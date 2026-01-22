
import React, { useEffect, useRef, useState } from 'react'
import { Text, Image as KonvaImage, Transformer } from 'react-konva'
import { Layer } from '@/types/designer'
import { getAssetUrl } from '@/lib/supabase/storage'
import { getTextAttrs, getImageAttrs } from '@/lib/designer/render-utils'
import useImage from 'use-image' // We need to install this or handle image loading manually

// Helper to load image from URL (standard Konva pattern)
// We'll standard hook 'use-image' if installed, or just write a simple one. 
// Let's assume we will install 'use-image'.

interface LayerItemProps {
    layer: Layer
    isSelected: boolean
    onSelect: () => void
    onChange: (newAttrs: Partial<Layer>) => void
}

interface URLImageProps {
    src: string;
    onSelect: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layerConfig: any;
}

const URLImage = ({ src, onSelect, layerConfig }: URLImageProps) => {
    const [image] = useImage(src)
    return <KonvaImage image={image} {...layerConfig} onClick={onSelect} onTap={onSelect} />
}

export const LayerItem: React.FC<LayerItemProps> = ({
    layer,
    isSelected,
    onSelect,
    onChange,
}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapeRef = useRef<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trRef = useRef<any>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current])
            trRef.current.getLayer()?.batchDraw()
        }
    }, [isSelected])

    // Resolve Image URL if needed
    const layerSrc = layer.type === 'image' ? (layer as unknown as { src: string }).src : null

    useEffect(() => {
        let isMounted = true
        // Reset image URL when layer type or src changes
        if (layer.type !== 'image') {
            if (imageUrl !== null) setImageUrl(null)
            return
        }

        if (layer.type === 'image' && layerSrc) {
            getAssetUrl(layerSrc).then(url => {
                if (isMounted && url) setImageUrl(url)
            })
        }
        return () => { isMounted = false }
    }, [layer.type, layerSrc])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragEnd = (e: any) => {
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        })
    }

    const handleTransformEnd = () => {
        const node = shapeRef.current
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()

        // reset scale to 1 in store to avoid accumulating scale? 
        // Actually standard behavior is to store scale.
        onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: scaleX,
            scaleY: scaleY,
        })
    }

    // Common props for drag/transform handlers that are NOT in the shared utils
    // because utils are for "visual state", these are for "editor interaction".
    const interactionProps = {
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: handleDragEnd,
        onTransformEnd: handleTransformEnd,
        ref: shapeRef,
    }

    return (
        <>
            {layer.type === 'text' && (
                <Text
                    {...getTextAttrs(layer)}
                    {...interactionProps}
                />
            )}

            {layer.type === 'image' && imageUrl && (
                <URLImage
                    src={imageUrl}
                    onSelect={onSelect}
                    layerConfig={{
                        ...getImageAttrs(layer),
                        ...interactionProps
                    }}
                />
            )}

            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // limit resize
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox
                        }
                        return newBox
                    }}
                />
            )}
        </>
    )
}
