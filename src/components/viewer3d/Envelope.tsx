// components/Envelope.tsx

"use client";

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* =========================================================
   Props
========================================================= */

interface EnvelopeProps {
    isOpen: boolean
    onClick?: () => void

    // Optional customization (non-breaking)
    bodyColor?: string
    flapColor?: string
    sealColor?: string
}

/* =========================================================
   Constants
========================================================= */

const ENV_W = 2.15
const ENV_H = 2.1
const ENV_D = 0.05

/* =========================================================
   Geometry Generators
========================================================= */

const createFlapShape = (width: number, height: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(0, -height * 0.8)
    shape.lineTo(-width / 2, 0)
    return shape
}

const createPocketShape = (width: number, height: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, -height / 2)
    shape.lineTo(width / 2, -height / 2)
    shape.lineTo(width / 2, 0)
    shape.lineTo(0, height * 0.1)
    shape.lineTo(-width / 2, 0)
    shape.lineTo(-width / 2, -height / 2)
    return shape
}

/* =========================================================
   Component
========================================================= */

export function Envelope({
    isOpen,
    onClick,
    bodyColor = "#8FB6D9",
    flapColor = "#7FA6C9",
    sealColor = "#8a1c1c",
}: EnvelopeProps) {
    const flapRef = useRef<THREE.Group>(null)
    const sealRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)

    /* -----------------------------
       Deterministic Flap Animation
    ----------------------------- */

    const prevIsOpen = useRef(isOpen)
    const flapT = useRef(isOpen ? 1 : 0)
    const flapAnimDir = useRef(0)
    const FLAP_DURATION = 0.9

    /* -----------------------------
       Shapes
    ----------------------------- */

    const flapShape = useMemo(() => createFlapShape(ENV_W, ENV_H), [])
    const pocketShape = useMemo(() => createPocketShape(ENV_W, ENV_H), [])

    /* -----------------------------
       Procedural Paper Texture
    ----------------------------- */

    const paperTexture = useMemo(() => {
        if (typeof document === 'undefined') return null

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 512, 512)

        const imageData = ctx.getImageData(0, 0, 512, 512)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
            const grain = (Math.random() - 0.5) * 40
            data[i] = Math.max(0, Math.min(255, data[i] + grain))
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain))
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain))
        }

        ctx.putImageData(imageData, 0, 0)

        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(2, 2)
        tex.anisotropy = 16
        return tex
    }, [])

    /* -----------------------------
       Pocket Alpha Map
    ----------------------------- */

    const pocketAlphaMap = useMemo(() => {
        if (typeof document === 'undefined') return null

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, 512, 512)

        const toX = (x: number) => (x / ENV_W + 0.5) * 512
        const toY = (y: number) => ((-y) / ENV_H + 0.5) * 512

        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(toX(-ENV_W / 2), toY(-ENV_H / 2))
        ctx.lineTo(toX(ENV_W / 2), toY(-ENV_H / 2))
        ctx.lineTo(toX(ENV_W / 2), toY(0))
        ctx.lineTo(toX(0), toY(ENV_H * 0.1))
        ctx.lineTo(toX(-ENV_W / 2), toY(0))
        ctx.closePath()
        ctx.fill()

        return new THREE.CanvasTexture(canvas)
    }, [])

    /* -----------------------------
       Bulge Displacement Map
    ----------------------------- */

    const bulgeMap = useMemo(() => {
        if (typeof document === 'undefined') return null

        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, 256, 256)

        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        grad.addColorStop(0, '#fff')
        grad.addColorStop(1, '#000')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 256, 256)

        return new THREE.CanvasTexture(canvas)
    }, [])

    /* -----------------------------
       Materials
    ----------------------------- */

    const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
        map: paperTexture || undefined,
        bumpMap: paperTexture || undefined,
        bumpScale: 0.02,
        displacementMap: bulgeMap || undefined,
        displacementScale: 0.15,
        displacementBias: -0.05,
        alphaMap: pocketAlphaMap || undefined,
        alphaTest: 0.5,
        transparent: true,
    }), [paperTexture, pocketAlphaMap, bulgeMap, bodyColor])

    const backMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
        map: paperTexture || undefined,
        bumpMap: paperTexture || undefined,
        bumpScale: 0.02,
        displacementMap: bulgeMap || undefined,
        displacementScale: -0.04,
        displacementBias: -0.03,
    }), [paperTexture, bulgeMap, bodyColor])

    const flapMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: flapColor,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
        map: paperTexture || undefined,
        bumpMap: paperTexture || undefined,
        bumpScale: 0.02,
    }), [paperTexture, flapColor])

    /* -----------------------------
       Extruded Geometry
    ----------------------------- */

    const POCKET_DEPTH = 0.003

    const pocketExtruded = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(pocketShape, {
            depth: POCKET_DEPTH,
            bevelEnabled: true,
            bevelThickness: 0.001,
            bevelSize: 0.001,
            bevelSegments: 2,
        })
        g.translate(0, 0, -POCKET_DEPTH / 2)
        g.computeVertexNormals()
        return g
    }, [pocketShape])

    const flapExtruded = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(flapShape, {
            depth: 0.003,
            bevelEnabled: true,
            bevelThickness: 0.001,
            bevelSize: 0.001,
            bevelSegments: 2,
        })
        g.translate(0, 0, -0.0015)
        g.computeVertexNormals()
        return g
    }, [flapShape])

    /* -----------------------------
       Animation Loop
    ----------------------------- */

    useFrame((state, delta) => {
        if (prevIsOpen.current !== isOpen) {
            flapAnimDir.current = isOpen ? 1 : -1
            prevIsOpen.current = isOpen
        }

        if (flapAnimDir.current !== 0 && flapRef.current) {
            const step = delta / FLAP_DURATION
            flapT.current = THREE.MathUtils.clamp(
                flapT.current + flapAnimDir.current * step,
                0,
                1
            )

            if (flapT.current === 0 || flapT.current === 1) {
                flapAnimDir.current = 0
            }

            flapRef.current.rotation.x =
                THREE.MathUtils.lerp(0, -Math.PI * 1.4, flapT.current)
        }

        if (sealRef.current && !isOpen) {
            const scale = hovered
                ? 1.05 + Math.sin(state.clock.elapsedTime * 8) * 0.03
                : 1
            sealRef.current.scale.setScalar(
                THREE.MathUtils.lerp(sealRef.current.scale.x, scale, 10 * delta)
            )
        }
    })

    /* -----------------------------
       Render
    ----------------------------- */

    return (
        <group>
            <mesh position={[0, 0, -0.005]}>
                <planeGeometry args={[ENV_W, ENV_H, 32, 32]} />
                <primitive object={backMaterial} attach="material" />
            </mesh>

            <mesh geometry={pocketExtruded} position={[0, 0, 0.005]}>
                <primitive object={bodyMaterial} attach="material" />
            </mesh>

            <group ref={flapRef} position={[0, ENV_H / 2, 0.006]}>
                <mesh geometry={flapExtruded}>
                    <primitive object={flapMaterial} attach="material" />
                </mesh>

                {!isOpen && (
                    <group
                        ref={sealRef}
                        position={[0, -ENV_H * 0.45, 0.03]}
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
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
                            <meshStandardMaterial
                                color={sealColor}
                                roughness={0.4}
                                metalness={0.1}
                            />
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    )
}
