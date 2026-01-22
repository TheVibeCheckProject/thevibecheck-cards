
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCardPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const createCard = async () => {
      try {
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Untitled Card' }),
        })

        if (!res.ok) {
          throw new Error('Failed to create card')
        }

        const card = await res.json()
        router.replace(`/app/designer/${card.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      }
    }

    createCard()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-red-600">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Creating your card...</p>
      </div>
    </div>
  )
}
