
import Konva from 'konva'
import { DesignerDocument, FaceId } from '@/types/designer'
import { createClient } from '@/lib/supabase/client'
import { getAssetUrl } from '@/lib/supabase/storage'
import { getTextAttrs, getImageAttrs } from '@/lib/designer/render-utils'

// Helper to load image for headless Konva
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

// Convert dataURL to Blob
async function dataURLToBlob(dataURL: string): Promise<Blob> {
    const res = await fetch(dataURL)
    return await res.blob()
}

export async function exportCardFaces(
    cardId: string,
    userId: string,
    design: DesignerDocument
): Promise<void> {
    const supabase = createClient()
    const faces: FaceId[] = ['front', 'inside_left', 'inside_right']

    // 1. Resolve all image assets first (create Assets Map)
    // We need signed URLs for all image layers across all faces
    const assetsMap: Record<string, string> = {}

    // Collect all unique src paths from image layers
    const allPaths = new Set<string>()
    Object.values(design.faces).forEach(face => {
        face.layers.forEach(layer => {
            if (layer.type === 'image' && layer.src) {
                allPaths.add(layer.src)
            }
        })
    })

    // Fetch signed URLs
    for (const path of Array.from(allPaths)) {
        const url = await getAssetUrl(path)
        if (url) assetsMap[path] = url
    }

    // 2. Headless Render & Upload Loop
    const updates: Record<string, string> = {} // face_name -> storage_path

    for (const faceId of faces) {
        const face = design.faces[faceId]

        // Create detached stage
        const stage = new Konva.Stage({
            width: 1536,
            height: 2048,
            container: document.createElement('div'), // detached container
        })
        const layerNode = new Konva.Layer()
        stage.add(layerNode)

        // Add White Background (Standard card paper)
        // Without this, transparent PNGs might look weird in 3D or darker modes.
        // Let's ensure a white base.
        const bg = new Konva.Rect({
            width: 1536,
            height: 2048,
            fill: '#ffffff'
        })
        layerNode.add(bg)

        // Add Layers
        for (const layer of face.layers) {
            if (layer.type === 'text') {
                const textNode = new Konva.Text(getTextAttrs(layer))
                layerNode.add(textNode)
            } else if (layer.type === 'image') {
                const url = assetsMap[layer.src]
                if (url) {
                    try {
                        const imageObj = await loadImage(url)
                        const imageNode = new Konva.Image({
                            ...getImageAttrs(layer),
                            image: imageObj
                        })
                        layerNode.add(imageNode)
                    } catch (err) {
                        console.error(`Failed to load image for export: ${layer.src}`, err)
                    }
                }
            }
        }

        // Draw and Export
        layerNode.batchDraw()

        // Export to Blob (High quality PNG)
        // pixelRatio 1 is fine since we set explicit large dimensions
        const dataURL = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
        const blob = await dataURLToBlob(dataURL)
        const file = new File([blob], `${faceId}.png`, { type: 'image/png' })

        // Upload to Stable Path: cards/{userId}/{cardId}/faces/{faceId}.png
        const storagePath = `cards/${userId}/${cardId}/faces/${faceId}.png`

        const { error: uploadError } = await supabase.storage
            .from('card-assets')
            .upload(storagePath, file, {
                upsert: true, // Overwrite existing
                contentType: 'image/png'
            })

        if (uploadError) {
            console.error(`Upload failed for ${faceId}`, uploadError)
            throw uploadError
        }

        // Store this stable path
        // Mapping: front -> front_url, inside_left -> inside_left_url, inside_right -> inside_right_url
        if (faceId === 'front') updates['front_url'] = storagePath
        if (faceId === 'inside_left') updates['inside_left_url'] = storagePath
        if (faceId === 'inside_right') updates['inside_right_url'] = storagePath

        // Clean up
        stage.destroy()
    }

    // 3. Update Database
    const { error: dbError } = await supabase
        .from('card_faces')
        // We first try to update. If it doesn't represent card_id existence, we might need to insert.
        // Actually card_faces should have been created or we upsert.
        // "card_faces" has a unique constraint on card_id.
        .upsert({
            card_id: cardId,
            ...updates,
            updated_at: new Date().toISOString()
        }, { onConflict: 'card_id' })

    if (dbError) throw dbError
}
