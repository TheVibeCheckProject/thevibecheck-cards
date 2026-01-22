
import { Layer, TextLayer, ImageLayer } from '@/types/designer'

/**
 * Returns the common Konva node configuration for any layer.
 * Used by both the React Editor (LayerItem) and the Headless Exporter.
 */
export function getBaseAttrs(layer: Layer) {
    return {
        id: layer.id,
        x: layer.x,
        y: layer.y,
        rotation: layer.rotation,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        opacity: layer.opacity ?? 1,
        draggable: !layer.locked, // Only relevant for Editor, ignored by headless
    }
}

/**
 * Returns specific attributes for Text nodes.
 */
export function getTextAttrs(layer: TextLayer) {
    return {
        ...getBaseAttrs(layer),
        text: layer.text,
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize,
        fill: layer.color,
        align: layer.align,
        // Add other text props here as needed (shadow, stroke, etc.)
    }
}

/**
 * Returns specific attributes for Image nodes (excluding the actual image object).
 */
export function getImageAttrs(layer: ImageLayer) {
    return {
        ...getBaseAttrs(layer),
        width: layer.width,   // Optional overrides
        height: layer.height,
        crop: layer.crop,
    }
}
