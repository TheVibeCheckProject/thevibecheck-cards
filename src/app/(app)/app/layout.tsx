
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link href="/app" className="text-lg font-bold">
                            VibeCheck
                        </Link>
                        <nav className="hidden md:flex gap-4 text-sm font-medium">
                            <Link href="/app" className="hover:text-gray-600 dark:hover:text-gray-300">
                                Dashboard
                            </Link>
                            <Link href="/app/sent" className="hover:text-gray-600 dark:hover:text-gray-300">
                                Sent Cards
                            </Link>
                            <Link href="/app/templates" className="hover:text-gray-600 dark:hover:text-gray-300">
                                Templates
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{user.email}</span>
                        <form action="/auth/signout" method="post">
                            {/* We need a signout route or client component. For now, simple text or link. 
                    Actually, cleaner to make a client UserNav component, but to keep it simple: */}
                        </form>
                        <Link href="/app/account" className="text-sm hover:underline">
                            Account
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1 bg-gray-50 dark:bg-black/5">
                <div className="container mx-auto p-4 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
