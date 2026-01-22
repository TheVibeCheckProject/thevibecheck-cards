
'use client'

import { useDesignerStore } from './store'
import { Layer } from '@/types/designer'

export default function PropertiesPanel() {
    const { design, activeFace, selectedLayerId, updateLayer, removeLayer } = useDesignerStore()
    const layers = design.faces[activeFace].layers
    const selectedLayer = layers.find((l) => l.id === selectedLayerId)

    if (!selectedLayer) {
        return (
            <div className="flex flex-col border-l border-gray-200 dark:border-gray-800 w-72 bg-white dark:bg-zinc-950 p-4">
                <div className="text-sm text-gray-400 text-center mt-10">
                    Select a layer to edit properties.
                </div>
            </div>
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (key: string, value: string | number | undefined) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateLayer(selectedLayer.id, { [key]: value } as any)
    }

    // Helper to safely parse numbers
    const safeParseInt = (val: string, fallback: number = 0) => {
        const parsed = parseInt(val, 10)
        return isNaN(parsed) ? fallback : parsed
    }

    return (
        <div className="flex flex-col border-l border-gray-200 dark:border-gray-800 w-72 bg-white dark:bg-zinc-950 p-4 overflow-y-auto">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-4">Properties</h3>

            {/* Common Properties */}
            <div className="space-y-4">
                {/* Layer Type Badge */}
                <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-xs font-mono uppercase">
                        {selectedLayer.type}
                    </span>
                    <button
                        onClick={() => removeLayer(selectedLayer.id)}
                        className="text-xs text-red-500 hover:text-red-600 underline"
                    >
                        Delete Layer
                    </button>
                </div>

                {/* Text Specific */}
                {selectedLayer.type === 'text' && (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Content</label>
                            <textarea
                                value={selectedLayer.text}
                                onChange={(e) => handleChange('text', e.target.value)}
                                className="w-full rounded-md border border-gray-200 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Size (px)</label>
                                <input
                                    type="number"
                                    value={selectedLayer.fontSize || ''}
                                    onChange={(e) => handleChange('fontSize', safeParseInt(e.target.value, 12))}
                                    className="w-full rounded-md border border-gray-200 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Color</label>
                                <input
                                    type="color"
                                    value={selectedLayer.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className="w-full h-9 rounded-md border border-gray-200 p-1 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Alignment</label>
                            <div className="flex rounded-md border border-gray-200 dark:border-zinc-800 overflow-hidden">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => handleChange('align', align)}
                                        className={`flex-1 p-2 text-xs capitalize hover:bg-gray-50 dark:hover:bg-zinc-800 ${selectedLayer.align === align ? 'bg-gray-100 dark:bg-zinc-800 font-bold' : ''
                                            }`}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Font Family</label>
                            <select
                                value={selectedLayer.fontFamily}
                                onChange={(e) => handleChange('fontFamily', e.target.value)}
                                className="w-full rounded-md border border-gray-200 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <option value="sans-serif">Sans Serif</option>
                                <option value="serif">Serif</option>
                                <option value="monospace">Monospace</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Image Specific (Basic) */}
                {selectedLayer.type === 'image' && (
                    <div className="text-xs text-gray-500 italic">
                        Use the canvas handles to resize or rotate the image.
                    </div>
                )}

                {/* Position Info (Read only or editable?) - Let's make editable */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">Transform</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-400">X</label>
                            <input
                                type="number"
                                value={Math.round(selectedLayer.x) || 0}
                                onChange={(e) => handleChange('x', safeParseInt(e.target.value, 0))}
                                className="w-full px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400">Y</label>
                            <input
                                type="number"
                                value={Math.round(selectedLayer.y) || 0}
                                onChange={(e) => handleChange('y', safeParseInt(e.target.value, 0))}
                                className="w-full px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400">Rotation</label>
                            <input
                                type="number"
                                value={Math.round(selectedLayer.rotation) || 0}
                                onChange={(e) => handleChange('rotation', safeParseInt(e.target.value, 0))}
                                className="w-full px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
