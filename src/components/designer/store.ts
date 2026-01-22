
import { create } from 'zustand'
import {
    DesignerDocument,
    FaceId,
    Layer,
    DESIGNER_VERSION,
    CARD_WIDTH_PX,
    CARD_HEIGHT_PX
} from '@/types/designer'

interface DesignerState {
    design: DesignerDocument
    activeFace: FaceId
    selectedLayerId: string | null

    // Actions
    setDesign: (design: DesignerDocument) => void
    setActiveFace: (face: FaceId) => void
    selectLayer: (id: string | null) => void
    addLayer: (layer: Layer) => void
    updateLayer: (id: string, updates: Partial<Layer>) => void
    removeLayer: (id: string) => void
    reorderLayer: (id: string, direction: 'up' | 'down') => void
}

const DEFAULT_DESIGN: DesignerDocument = {
    meta: {
        version: DESIGNER_VERSION,
        width: CARD_WIDTH_PX,
        height: CARD_HEIGHT_PX,
    },
    faces: {
        front: { layers: [] },
        inside_left: { layers: [] },
        inside_right: { layers: [] },
    },
}

export const useDesignerStore = create<DesignerState>((set) => ({
    design: DEFAULT_DESIGN,
    activeFace: 'front',
    selectedLayerId: null,

    setDesign: (design) => set({ design, selectedLayerId: null }),
    setActiveFace: (face) => set({ activeFace: face, selectedLayerId: null }),
    selectLayer: (id) => set({ selectedLayerId: id }),

    addLayer: (layer) =>
        set((state) => {
            const face = state.design.faces[state.activeFace]
            const newLayers = [...face.layers, layer]

            return {
                design: {
                    ...state.design,
                    faces: {
                        ...state.design.faces,
                        [state.activeFace]: {
                            ...face,
                            layers: newLayers,
                        },
                    },
                },
                selectedLayerId: layer.id,
            }
        }),

    updateLayer: (id, updates) =>
        set((state) => {
            const face = state.design.faces[state.activeFace]
            // Search for layer in current face (or we could search all faces if needed, but UI implies active face edit)
            // Actually strictly speaking, we should find which face it belongs to if we support multi-face selection, 
            // but for V1 we only edit active face.
            const layerIndex = face.layers.findIndex((l) => l.id === id)
            if (layerIndex === -1) return state

            const newLayers = [...face.layers]
            newLayers[layerIndex] = { ...newLayers[layerIndex], ...updates } as Layer

            return {
                design: {
                    ...state.design,
                    faces: {
                        ...state.design.faces,
                        [state.activeFace]: {
                            ...face,
                            layers: newLayers,
                        },
                    },
                },
            }
        }),

    removeLayer: (id) =>
        set((state) => {
            const face = state.design.faces[state.activeFace]
            const newLayers = face.layers.filter((l) => l.id !== id)

            return {
                design: {
                    ...state.design,
                    faces: {
                        ...state.design.faces,
                        [state.activeFace]: {
                            ...face,
                            layers: newLayers,
                        },
                    },
                },
                selectedLayerId: null,
            }
        }),

    reorderLayer: (id, direction) =>
        set((state) => {
            const face = state.design.faces[state.activeFace]
            const index = face.layers.findIndex((l) => l.id === id)
            if (index === -1) return state

            const newLayers = [...face.layers]
            if (direction === 'up' && index < newLayers.length - 1) {
                // Swap with next
                [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]]
            } else if (direction === 'down' && index > 0) {
                // Swap with prev
                [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]]
            } else {
                return state
            }

            return {
                design: {
                    ...state.design,
                    faces: {
                        ...state.design.faces,
                        [state.activeFace]: {
                            ...face,
                            layers: newLayers,
                        },
                    },
                },
            }
        }),
}))
