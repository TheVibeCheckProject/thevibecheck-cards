
import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/tokens/generateToken'
import { NextResponse } from 'next/server'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ cardId: string }> }
) {
    const { cardId } = await params
    const supabase = await createClient()

    // 1. Auth & Ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: card } = await supabase
        .from('cards')
        .select('id, title')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single()

    if (!card) {
        return NextResponse.json({ error: 'Card not found or access denied' }, { status: 404 })
    }

    // 2. Check existing delivery (Idempotency)
    const { data: existing } = await supabase
        .from('deliveries')
        .select('share_token')
        .eq('card_id', cardId)
        .single()

    let token = existing?.share_token

    if (!token) {
        // Create new
        token = generateToken()
        const { error: insertError } = await supabase.from('deliveries').insert({
            card_id: cardId,
            share_token: token,
            recipient_name: 'Friend', // Default for public links
        })

        if (insertError) {
            return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
        }
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}/c/${token}`

    return NextResponse.json({ token, url })
}
