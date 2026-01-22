
'use client'

import { Stage, Layer as KonvaLayer } from 'react-konva'
import { useDesignerStore } from './store'
import { LayerItem } from './LayerItem'
import { useRef, useEffect, useState } from 'react'

export default function CanvasArea() {
    const { design, activeFace, selectedLayerId, selectLayer, updateLayer } = useDesignerStore()
    const layers = design.faces[activeFace].layers

    // Fit to screen logic
    const [scale, setScale] = useState(0.4) // default start
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current
                // Target: 1536 x 2048
                const widthRatio = (offsetWidth - 40) / 1536
                const heightRatio = (offsetHeight - 40) / 2048
                setScale(Math.min(widthRatio, heightRatio, 0.8)) // Max 0.8
            }
        }

        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className="flex-1 bg-gray-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center relative" ref={containerRef}>
            <Stage
                width={1536 * scale}
                height={2048 * scale}
                scaleX={scale}
                scaleY={scale}
                onMouseDown={(e) => {
                    // deselect when clicking on empty stage
                    const clickedOnEmpty = e.target === e.target.getStage()
                    if (clickedOnEmpty) {
                        selectLayer(null)
                    }
                }}
            >
                <KonvaLayer>
                    {/* Background / Paper Color */}
                    {/* We could add a Rect here for the card background */}

                    {layers.map((layer) => (
                        <LayerItem
                            key={layer.id}
                            layer={layer}
                            isSelected={layer.id === selectedLayerId}
                            onSelect={() => selectLayer(layer.id)}
                            onChange={(attrs) => updateLayer(layer.id, attrs)}
                        />
                    ))}
                </KonvaLayer>
            </Stage>
        </div>
    )
}
