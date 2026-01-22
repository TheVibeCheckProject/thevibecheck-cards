import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EnvelopeProps {
    isOpen: boolean
    onClick?: () => void
}

const ENV_W = 2.15 // Slightly wider than card (2.0)
const ENV_H = 1.6  // Matches height
const ENV_D = 0.05 // Visual thickness of "bulge" (not mesh thickness)

// Geometry Generators
const createFlapShape = (width: number, height: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(0, -height * 0.8) // Pointy triangle down
    shape.lineTo(-width / 2, 0)
    return shape
}

const createPocketShape = (width: number, height: number) => {
    // Trapezoid pocket
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, -height / 2) // Bottom Left
    shape.lineTo(width / 2, -height / 2)   // Bottom Right
    shape.lineTo(width / 2, 0)             // Center Right (Mid)
    shape.lineTo(0, height * 0.1)          // Center Peak (slight overlap)
    shape.lineTo(-width / 2, 0)            // Center Left
    shape.lineTo(-width / 2, -height / 2)  // Close
    return shape
}

export function Envelope({ isOpen, onClick }: EnvelopeProps) {
    const flapRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)
    const sealRef = useRef<THREE.Group>(null)

    // Deterministic flap animation (time-based)
    const prevIsOpen = useRef(isOpen)
    const flapT = useRef(isOpen ? 1 : 0) // 0..1
    const flapAnimDir = useRef(0) // -1 closing, +1 opening, 0 idle
    const FLAP_DURATION = 0.9 // seconds (target)

    // Shapes
    const flapShape = useMemo(() => createFlapShape(ENV_W, ENV_H), [])
    const pocketShape = useMemo(() => createPocketShape(ENV_W, ENV_H), [])

    // Generate Procedural Paper Texture (Noise)
    const paperTexture = useMemo(() => {
        if (typeof document === 'undefined') return null

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Base
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 512, 512)

        // Noise
        const imageData = ctx.getImageData(0, 0, 512, 512)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
            // Grain intensity
            const grain = (Math.random() - 0.5) * 40
            data[i] = Math.max(0, Math.min(255, data[i] + grain))
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain))
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain))
        }
        ctx.putImageData(imageData, 0, 0)

        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(2, 2)
        return tex
    }, [])

    // Generate Pocket Alpha Map (Canvas)
    const pocketAlphaMap = useMemo(() => {
        if (typeof document === 'undefined') return null
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Fill Black (Transparent)
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, 512, 512)

        // Map World -> Canvas (512x512)
        // Domain: X=[-W/2, W/2], Y=[-H/2, H/2]
        const toX = (x: number) => (x / ENV_W + 0.5) * 512
        const toY = (y: number) => ((-y) / ENV_H + 0.5) * 512 // Canvas Y is inverted (0 at top) BUT Three UVs...
        // Wait, three.js plane UV (0,0) is Bottom-Left. 
        // Canvas (0,0) is Top-Left. 
        // Textures are usually flippedY=true by default in loaders, but CanvasTexture?
        // Let's assume standard logic: Draw it upright in canvas coord space (0 top).

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        // Recreate Pocket Shape Logic:
        // [-w/2, -h/2] -> Bottom Left
        ctx.moveTo(toX(-ENV_W / 2), toY(-ENV_H / 2))
        // [w/2, -h/2] -> Bottom Right
        ctx.lineTo(toX(ENV_W / 2), toY(-ENV_H / 2))
        // [w/2, 0] -> Center Right
        ctx.lineTo(toX(ENV_W / 2), toY(0))
        // [0, h*0.1] -> Peak
        ctx.lineTo(toX(0), toY(ENV_H * 0.1))
        // [-w/2, 0] -> Center Left
        ctx.lineTo(toX(-ENV_W / 2), toY(0))
        ctx.closePath()
        ctx.fill()

        return new THREE.CanvasTexture(canvas)
    }, [])

    // Generate Bulge Displacement Map (Radial Gradient)
    const bulgeMap = useMemo(() => {
        if (typeof document === 'undefined') return null
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, 256, 256)

        // Soft Radial Gradient
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        grad.addColorStop(0, '#ffffff') // High (Bulge)
        grad.addColorStop(1, '#000000') // Low (Flat)

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 256, 256)

        return new THREE.CanvasTexture(canvas)
    }, [])

    // Materials
    // Body Material (Darker Baby Blue + Texture + Bulge)
    const bodyMaterial = useMemo(() => {
        const m = new THREE.MeshStandardMaterial({
            color: "#8FB6D9",
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide,

            // Texture
            map: paperTexture || undefined,
            bumpMap: paperTexture || undefined,
            bumpScale: 0.02,

            // Bulge
            displacementMap: bulgeMap || null,
            displacementScale: 0.15, // Bulge Intensity
            displacementBias: -0.05,

            // Cutout
            alphaMap: pocketAlphaMap || undefined,
            alphaTest: 0.5,
            transparent: true
        })
        return m
    }, [paperTexture, pocketAlphaMap, bulgeMap])

    // Back Material (Needs own instance if we want different displacement or alpha?)
    // Back is full rect, so no alphaMap needed (or full white).
    // We can reuse bodyMaterial but clone it to remove alphaMap? 
    // Or just use a separate material for Back to avoid alphaTest intersection issues.
    const backMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "#8FB6D9",
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide,
            map: paperTexture || undefined,
            bumpMap: paperTexture || undefined,
            bumpScale: 0.02,
            // Slight bulge for back too? 
            displacementMap: bulgeMap || null,
            displacementScale: -0.04, // Smaller bulge on back
            displacementBias: -0.03
        })
    }, [paperTexture, bulgeMap])

    // Flap Material (Slightly contrast blue)
    const flapMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "#7FA6C9", // Slightly darker/desaturated
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide,
            bumpMap: paperTexture || undefined,
            bumpScale: 0.02,
            map: paperTexture || undefined
        })
    }, [paperTexture])

    // --- NEW: realistic paper thickness (much thinner) ---
    const BACK_THICKNESS = 0.003
    const POCKET_DEPTH = 0.003

    // NEW: Extruded pocket geometry (adds side faces / bottom thickness visually)
    const pocketExtruded = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(pocketShape, {
            depth: POCKET_DEPTH,
            steps: 1,
            bevelEnabled: true,
            bevelThickness: 0.001, // Reduced bevel for thin paper
            bevelSize: 0.001,
            bevelSegments: 2
        })

        // Center the extrusion around Z so it doesn't all push forward
        g.translate(0, 0, -POCKET_DEPTH / 2)
        g.computeVertexNormals()
        return g
    }, [pocketShape])

    // NEW: Extruded flap geometry
    const flapExtruded = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(flapShape, {
            depth: 0.003, // Match pocket
            steps: 1,
            bevelEnabled: true,
            bevelThickness: 0.001,
            bevelSize: 0.001,
            bevelSegments: 2
        })
        g.translate(0, 0, -0.003 / 2)
        g.computeVertexNormals()
        return g
    }, [flapShape])

    useFrame((state, delta) => {
        if (flapRef.current) {
            // Detect state change -> start deterministic animation
            if (prevIsOpen.current !== isOpen) {
                flapAnimDir.current = isOpen ? 1 : -1
                prevIsOpen.current = isOpen
            }

            // Advance animation
            if (flapAnimDir.current !== 0) {
                const step = delta / FLAP_DURATION
                flapT.current = THREE.MathUtils.clamp(
                    flapT.current + flapAnimDir.current * step,
                    0,
                    1
                )

                // Stop when finished
                if (flapT.current === 0 || flapT.current === 1) {
                    flapAnimDir.current = 0
                }
            }

            // Map t -> rotation:
            // Closed (0) -> 0
            // Open (1) -> your tuned rotation direction
            const rot = THREE.MathUtils.lerp(0, Math.PI * -1.4, flapT.current)
            flapRef.current.rotation.x = rot
        }

        // Pulse Seal
        if (sealRef.current && !isOpen) {
            const scale = hovered ? 1.05 + Math.sin(state.clock.elapsedTime * 8) * 0.03 : 1.0
            sealRef.current.scale.setScalar(
                THREE.MathUtils.lerp(sealRef.current.scale.x, scale, 10 * delta)
            )
        }
    })

    return (
        <group onClick={onClick}>
            {/* 1. Back Sheet */}
            {/* PlaneGeometry with segments for Displacement */}
            <mesh position={[0, 0, -0.005]} receiveShadow castShadow>
                <planeGeometry args={[ENV_W, ENV_H, 32, 32]} />
                <primitive object={backMaterial} attach="material" />
            </mesh>

            {/* 2. Side/Bottom Flaps (The "Pocket") */}
            {/* PlaneGeometry with AlphaCutout and Bulge */}
            <mesh position={[0, 0, 0.005]} receiveShadow castShadow>
                <planeGeometry args={[ENV_W, ENV_H, 32, 32]} />
                <primitive object={bodyMaterial} attach="material" />
            </mesh>

            {/* 3. Top Flap (Hinged Group) */}
            {/* Kept as Extruded for stiffness/simplicity, or could be plane.
                Given "Blocky" feedback was for "side", keeping Flap extruded (thin) is acceptable 
                as it adds a nice sharp detail on top. Or I can switch to plane.
                Let's stick to Thin Extrusion for Flap to avoid Alpha sorting headaches with the seal. */}
            <group
                ref={flapRef}
                position={[0, ENV_H / 2, 0.000]}
            >
                {/* Flap Mesh */}
                <mesh receiveShadow castShadow geometry={flapExtruded}>
                    <primitive object={flapMaterial} attach="material" />
                </mesh>

                {/* Wax Seal */}
                <group
                    ref={sealRef}
                    position={[0, -ENV_H * 0.45, 0.03]}
                    rotation={[0, 0, 0]}
                    onPointerOver={() => {
                        document.body.style.cursor = 'pointer'
                        setHovered(true)
                    }}
                    onPointerOut={() => {
                        document.body.style.cursor = 'auto'
                        setHovered(false)
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick?.()
                    }}
                >
                    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
                        <meshStandardMaterial color="#8a1c1c" roughness={0.4} metalness={0.1} />
                    </mesh>
                </group>
            </group>
        </group>
    )
}
