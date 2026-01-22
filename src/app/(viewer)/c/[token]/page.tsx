'use client'

import { Experience } from '@/components/viewer3d/Experience'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ViewerResponse } from '@/types/viewer'

export default function ViewerPage() {
    const params = useParams()
    const token = params?.token as string
    const [data, setData] = useState<ViewerResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const res = await fetch(`/api/viewer/${token}`)
                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Failed to load card')
                }
                const viewerData = await res.json()
                setData(viewerData)
            } catch (err: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setError((err as any).message)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchCard()
    }, [token])

    if (loading) return <div className="flex h-screen items-center justify-center text-white font-serif">Loading Experience...</div>
    if (error) return <div className="flex h-screen items-center justify-center text-red-400">Error: {error}</div>
    if (!data) return null

    // Cache bust
    const timestamp = Date.now()
    const bustedFaces = {
        front: `${data.faces.front}&t=${timestamp}`,
        inside_left: `${data.faces.inside_left}&t=${timestamp}`,
        inside_right: `${data.faces.inside_right}&t=${timestamp}`
    }

    return (
        <main className="h-screen w-screen overflow-hidden bg-[#111]">
            <Experience faces={bustedFaces} />
        </main>
    )
}
