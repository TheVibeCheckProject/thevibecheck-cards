
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateCardSchema = z.object({
    title: z.string().optional().default('Untitled Card'),
})

export async function POST(request: Request) {
    const supabase = await createClient()

    // Authenticated check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const json = await request.json()
        const body = CreateCardSchema.parse(json)

        // 1. Create Card
        const { data: card, error: cardError } = await supabase
            .from('cards')
            .insert({
                user_id: user.id,
                title: body.title,
            })
            .select()
            .single()

        if (cardError) throw cardError

        // 2. Create Empty Design
        const { error: designError } = await supabase
            .from('card_designs')
            .insert({
                card_id: card.id,
                data: {
                    meta: { version: 1, width: 1536, height: 2048 },
                    faces: {
                        front: { layers: [] },
                        inside_left: { layers: [] },
                        inside_right: { layers: [] },
                    }
                },
            })

        if (designError) throw designError

        return NextResponse.json(card)

    } catch (err) {
        console.error('Create card error:', err)
        return NextResponse.json(
            { error: 'Failed to create card' },
            { status: 500 }
        )
    }
}
