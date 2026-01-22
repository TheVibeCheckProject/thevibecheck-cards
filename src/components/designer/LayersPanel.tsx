
'use client'

import { useDesignerStore } from './store'
import { FaceId } from '@/types/designer'

const LABELS: Record<FaceId, string> = {
    front: 'Front Cover',
    inside_left: 'Inside Left',
    inside_right: 'Inside Right',
}

export default function LayersPanel() {
    const { design, activeFace, selectedLayerId, selectLayer, reorderLayer, setActiveFace } = useDesignerStore()
    const layers = design.faces[activeFace].layers

    const reversedLayers = [...layers].reverse() // Show top layer at top of list

    return (
        <div className="flex flex-col border-l border-gray-200 dark:border-gray-800 w-72 bg-white dark:bg-zinc-950">

            {/* Face Selector */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Active Face</h3>
                <select
                    value={activeFace}
                    onChange={(e) => setActiveFace(e.target.value as FaceId)}
                    className="w-full rounded-md border p-2 dark:bg-zinc-900 dark:border-zinc-700"
                >
                    {(Object.keys(LABELS) as FaceId[]).map((face) => (
                        <option key={face} value={face}>{LABELS[face]}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Layers</h3>

                <div className="space-y-2">
                    {reversedLayers.map((layer) => (
                        <div
                            key={layer.id}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer border ${selectedLayerId === layer.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                }`}
                            onClick={() => selectLayer(layer.id)}
                        >
                            <span className="text-sm truncate max-w-[120px]">
                                {layer.type === 'text' ? `T: ${layer.text}` : 'Image'}
                            </span>

                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="p-1 text-xs hover:bg-gray-200 rounded dark:hover:bg-zinc-700"
                                    onClick={() => reorderLayer(layer.id, 'up')}
                                    title="Move Up"
                                >
                                    ↑
                                </button>
                                <button
                                    className="p-1 text-xs hover:bg-gray-200 rounded dark:hover:bg-zinc-700"
                                    onClick={() => reorderLayer(layer.id, 'down')}
                                    title="Move Down"
                                >
                                    ↓
                                </button>
                            </div>
                        </div>
                    ))}

                    {layers.length === 0 && (
                        <div className="text-sm text-gray-400 text-center py-4">
                            No layers on this face.
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}
