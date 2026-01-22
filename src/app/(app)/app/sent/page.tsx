
// Since this is becoming interactive (button click), we should make it client-side or add a client component.
// The easiest for now is to make the whole page client or use a client component for the list.
// Let's use a client component wrapper for the card item or switch page to client.
// Actually, server component + client action is better.
// But keeping it simple for v1: Convert to Client Component for interactivity.

'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Card {
    id: string;
    title: string;
    created_at: string;
}

export default function SentCardsPage() {
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [sharingId, setSharingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchCards = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('cards')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                if (data) setCards(data)
            }
            setLoading(false)
        }
        fetchCards()
    }, [])

    const handleShare = async (e: React.MouseEvent, cardId: string) => {
        e.preventDefault() // Prevent navigation
        setSharingId(cardId)

        try {
            const res = await fetch(`/api/cards/${cardId}/deliver`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to create link')

            const { url } = await res.json()
            await navigator.clipboard.writeText(url)
            alert('Share link copied to clipboard!')
        } catch (err) {
            console.error(err)
            alert('Failed to share')
        }
        setSharingId(null)
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">My Cards</h1>

            {cards.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <Link
                            key={card.id}
                            href={`/app/designer/${card.id}`}
                            className="group block relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-zinc-900 dark:hover:border-gray-700"
                        >
                            <div className="font-medium">{card.title}</div>
                            <div className="mt-2 text-sm text-gray-500">
                                Created: {new Date(card.created_at).toLocaleDateString()}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={(e) => handleShare(e, card.id)}
                                    disabled={sharingId === card.id}
                                    className="rounded bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                                >
                                    {sharingId === card.id ? 'Copying...' : 'Share Link'}
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No cards yet.</p>
            )
            }
        </div >
    )
}
