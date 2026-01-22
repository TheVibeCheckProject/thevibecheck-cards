
'use client'

import { useDesignerStore } from './store'
import { v4 as uuidv4 } from 'uuid'
import { uploadCardAsset } from '@/lib/supabase/storage'
import { useState } from 'react'

interface ToolboxProps {
    userId: string
    cardId: string
}

export default function Toolbox({ userId, cardId }: ToolboxProps) {
    const addLayer = useDesignerStore((state) => state.addLayer)
    const [uploading, setUploading] = useState(false)

    const handleAddText = () => {
        addLayer({
            id: uuidv4(),
            type: 'text',
            text: 'Double click to edit',
            x: 100,
            y: 100,
            fontFamily: 'sans-serif',
            fontSize: 48,
            color: '#000000',
            align: 'center',
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        })
    }

    const handleOSFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const path = await uploadCardAsset(userId, cardId, file)
            addLayer({
                id: uuidv4(),
                type: 'image',
                src: path,
                x: 150,
                y: 150,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            })
        } catch (err) {
            console.error('Upload failed', err)
            alert('Upload failed')
        } finally {
            setUploading(false)
            // reset input
            e.target.value = ''
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 border-r border-gray-200 dark:border-gray-800 w-64 bg-white dark:bg-zinc-950">
            <h3 className="font-bold text-sm uppercase text-gray-500">Tools</h3>

            <button
                onClick={handleAddText}
                className="flex items-center justify-center gap-2 rounded-md bg-gray-100 p-3 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
                <span>Aa</span> Add Text
            </button>

            <div className="relative">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleOSFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                />
                <button
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-100 p-3 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Add Image'}
                </button>
            </div>
        </div>
    )
}
