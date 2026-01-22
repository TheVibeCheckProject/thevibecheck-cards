
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch recent 3 cards
    const { data: recentCards } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Link
                    href="/app/designer/new"
                    className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    Create New Card
                </Link>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Recent Cards</h2>
                {recentCards && recentCards.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recentCards.map((card) => (
                            <Link
                                key={card.id}
                                href={`/app/designer/${card.id}`}
                                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-zinc-900 dark:hover:border-gray-700"
                            >
                                <div className="font-medium">{card.title}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    {new Date(card.created_at).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
                        <p>Welcome back, {user?.email}!</p>
                        <p className="mt-2 text-gray-500">
                            You don&apos;t have any cards yet. Start by creating one!
                        </p>
                    </div>
                )}
            </div>

            {
                recentCards && recentCards.length > 0 && (
                    <div>
                        <Link href="/app/sent" className="text-sm font-medium hover:underline">
                            View all cards &rarr;
                        </Link>
                    </div>
                )
            }
        </div >
    )
}
