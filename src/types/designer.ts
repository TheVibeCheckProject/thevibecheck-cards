// src/types/designer.ts
// Canonical data contract for the 2D card designer.
// DO NOT change without explicit user approval (see GEMINI.md).
//
// Version: 1 (locked)
// Updated: 2026-01-20
//
// IMPORTANT RENDERING RULES
// - Layer stacking order is the array order in `Face.layers`.
//   Earlier items draw first (behind). Later items draw last (on top).
// - Keep this stable: do not introduce alternate ordering systems unless explicitly approved.
//
// IMPORTANT ASSET RULES
// - `ImageLayer.src` should be a stable Supabase Storage reference (preferred):
//   e.g. "cards/<userId>/<cardId>/assets/<file>.png"
// - Do NOT store short-lived signed URLs inside saved designs.
//   Signed URLs should be generated at view-time by the server/viewer API.

export const DESIGNER_VERSION = 1 as const;

// Fixed export resolution (portrait).
export const CARD_WIDTH_PX = 1536 as const;
export const CARD_HEIGHT_PX = 2048 as const;

export type FaceId = "front" | "inside_left" | "inside_right";

/**
 * The full saved design document.
 * This must remain backward compatible forever once shipped.
 */
export type DesignerDocument = {
    meta: {
        version: typeof DESIGNER_VERSION;
        width: typeof CARD_WIDTH_PX;
        height: typeof CARD_HEIGHT_PX;
    };
    faces: Record<FaceId, Face>;
};

export type Face = {
    /**
     * Draw order / stacking order:
     * - index 0 is furthest back
     * - last index is on top
     */
    layers: Layer[];
};

export type Layer = TextLayer | ImageLayer;

export type BaseLayer = {
    id: string; // uuid
    x: number; // px
    y: number; // px
    rotation: number; // degrees
    scaleX: number; // 1 = normal
    scaleY: number; // 1 = normal
    opacity?: number; // 0..1 (optional)
    locked?: boolean; // optional (prevents editing)
};

export type TextAlign = "left" | "center" | "right";

export type TextLayer = BaseLayer & {
    type: "text";
    text: string;
    fontFamily: string;
    fontSize: number;
    color: string; // hex or rgba
    align: TextAlign;

    // Optional typography controls (keep optional for backward compatibility).
    fontWeight?: number; // e.g., 400, 700
    lineHeight?: number; // e.g., 1.2
    letterSpacing?: number; // px

    // Optional styling.
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    // Optional outline.
    strokeColor?: string;
    strokeWidth?: number;
};

/**
 * Stable storage reference (preferred).
 * Do not store a signed URL here.
 */
export type StoragePath = string;

export type ImageLayer = BaseLayer & {
    type: "image";
    src: StoragePath;

    // Optional sizing overrides (Konva can infer from image natural size).
    width?: number;
    height?: number;

    // Optional crop window in source image coordinates.
    crop?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

// Runtime validation should be implemented with Zod elsewhere;
// these TypeScript types are the source of truth for shape and constraints.
