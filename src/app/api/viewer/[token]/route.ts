
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// We need a Service Role client here because RLS blocks PUBLIC read of storage paths in card_faces
// unless we make them public. But we want to gate them behind this API token.
// So we use Service Role to fetch the paths AND generate signed URLs.
// Wait, 'card_faces' table RLS prevents public read. So we definitely need admin or a public policy for token access.
// Since token validation happens logically here, Admin/Service Role is appropriate to bypass RLS 
// AFTER validating the token exists.

export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    // Use standard client for public delivery check (Deliveries table should be readable?? No, RLS says owner only).
    // Actually, everything is owner only. The recipient is anonymous.
    // So we MUST use Service Role to lookup the token and fetch data.

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Validate Token & Increment Count
    const { data: delivery, error: deliveryError } = await adminClient
        .from('deliveries')
        .select('card_id, open_count')
        .eq('share_token', token)
        .single()

    if (deliveryError || !delivery) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    // Fire and forget increment (or await if strict)
    await adminClient.rpc('increment_open_count', { row_id: token })
    // Wait, typical pattern is update. 
    await adminClient
        .from('deliveries')
        .update({ open_count: delivery.open_count + 1 })
        .eq('share_token', token)


    // 2. Fetch Card Faces (Stable paths)
    const { data: faces } = await adminClient
        .from('card_faces')
        .select('front_url, inside_left_url, inside_right_url')
        .eq('card_id', delivery.card_id)
        .single()

    if (!faces || !faces.front_url || !faces.inside_left_url || !faces.inside_right_url) {
        return NextResponse.json({ error: 'Card content is not ready (missing exports)' }, { status: 404 })
    }

    // 3. Fetch Sender Info
    const { data: card } = await adminClient
        .from('cards')
        .select('title, user_id') // We could fetch user metadata here if we had profiles
        .eq('id', delivery.card_id)
        .single()

    // 4. Generate Signed URLs
    // Expiry: 1 hour (3600s)
    const { data: front } = await adminClient.storage.from('card-assets').createSignedUrl(faces.front_url, 3600)
    const { data: left } = await adminClient.storage.from('card-assets').createSignedUrl(faces.inside_left_url, 3600)
    const { data: right } = await adminClient.storage.from('card-assets').createSignedUrl(faces.inside_right_url, 3600)

    if (!front?.signedUrl || !left?.signedUrl || !right?.signedUrl) {
        return NextResponse.json({ error: 'Failed to generate access links' }, { status: 500 })
    }

    return NextResponse.json({
        card: {
            title: card?.title || 'Card',
            senderName: 'Someone', // Placeholder until we have profiles
        },
        faces: {
            front: front.signedUrl,
            inside_left: left.signedUrl,
            inside_right: right.signedUrl
        }
    })
}
