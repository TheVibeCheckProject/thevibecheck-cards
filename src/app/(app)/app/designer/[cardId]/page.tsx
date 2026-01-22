'use client'

import { useEffect, useState } from 'react'
import { useDesignerStore } from '@/components/designer/store'
import CanvasArea from '@/components/designer/CanvasArea'
import Toolbox from '@/components/designer/Toolbox'
import LayersPanel from '@/components/designer/LayersPanel'
import PropertiesPanel from '@/components/designer/PropertiesPanel'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DesignerDocument } from '@/types/designer'
import { exportCardFaces } from '@/lib/designer/export'

// Because of server component layout, we pass userId via client component fetch
// But wait, the standard pattern in Next.js is to fetch in page.tsx (Server) and pass to client.
// However, the Designer store is strictly client side. 
// We will fetch initial data in a useEffect here or pass it from server page.
// Let's do client fetch to ensure we have latest version and avoid serialization issues with large JSONs initially.
// Actually passing from Server Page is faster. Let's stick to client fetch for simplicity of "Reload restores".

export default function DesignerEditor() {
    const { cardId } = useParams() as { cardId: string }
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // Store actions
    const setDesign = useDesignerStore((state) => state.setDesign)
    const design = useDesignerStore((state) => state.design)

    useEffect(() => {
        const load = async () => {
            const supabase = createClient()

            // Get User
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }
            setUserId(user.id)

            // Get Design
            const { data } = await supabase
                .from('card_designs')
                .select('data')
                .eq('card_id', cardId)
                .single()

            if (data && data.data) {
                // Cast to our type (assuming DB valid from previous steps)
                setDesign(data.data as unknown as DesignerDocument)
            }
            setLoading(false)
        }
        load()
    }, [cardId, setDesign, router])

    const handleSave = async (silent = false) => {
        if (!userId) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!silent) setSaving(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('card_designs')
            .update({
                data: JSON.parse(JSON.stringify(design)),
                updated_at: new Date().toISOString()
            })
            .eq('card_id', cardId)

        if (error) {
            console.error('Save failed', error)
            if (!silent) alert('Save failed')
        }
        if (!silent) setSaving(false)
    }

    const handleFinish = async () => {
        if (!userId) {
            alert('Error: User ID missing')
            return
        }

        if (window.confirm('Finish designing? This will generate previews and prepare your card for sending.')) {
            setSaving(true) // Reuse saving state for UI block
            try {
                // 1. Auto-save first
                await handleSave(true)
                // 2. Export faces
                await exportCardFaces(cardId, userId, design)

                alert('Card generated successfully! Taking you to sent cards.')
                router.push('/app/sent')
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error(err)
                alert('Failed to generate card: ' + err.message)
                setSaving(false)
            }
        }
    }

    if (loading || !userId) return <div className="flex h-screen items-center justify-center">Loading Designer...</div>

    return (
        <div className="flex h-screen flex-col bg-white text-black dark:bg-black dark:text-white">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <Link href="/app" className="text-sm font-medium hover:underline">
                        &larr; Exit
                    </Link>
                    <span className="text-sm text-gray-400">Card ID: {cardId.substring(0, 8)}...</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        onClick={handleFinish}
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                        Finish & Send
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">
                <Toolbox userId={userId} cardId={cardId} />
                <CanvasArea />
                <div className="flex">
                    <LayersPanel />
                    <PropertiesPanel />
                </div>
            </div>
        </div>
    )
}
