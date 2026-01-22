
import { useRef } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Card3DProps {
    frontUrl: string
    insideLeftUrl: string
    insideRightUrl: string
    // Animation targets passed from parent or internal?
    // Parent controls step/variants, here we just need to know if open. // Actually, simple:
    isOpen: boolean // Controls the hinge
}

const WIDTH = 1.46
const HEIGHT = 1.95
const THICKNESS = 0.002 // Thinner card

export function Card3D({ frontUrl, insideLeftUrl, insideRightUrl, isOpen }: Card3DProps) {
    const [front, insideLeft, insideRight] = useLoader(THREE.TextureLoader, [
        frontUrl,
        insideLeftUrl,
        insideRightUrl
    ])

        ;[front, insideLeft, insideRight].forEach(t => {
            if (t) {
                t.colorSpace = THREE.SRGBColorSpace
                t.anisotropy = 16
            }
        })

    const hingeGroup = useRef<THREE.Group>(null)

    useFrame((state, delta) => {
        if (!hingeGroup.current) return

        // Hinge: Closed = PI (180deg), Open = 0
        const targetRot = isOpen ? 0 : Math.PI

        hingeGroup.current.rotation.y = THREE.MathUtils.lerp(
            hingeGroup.current.rotation.y,
            targetRot,
            3 * delta
        )
    })

    const Border = ({ width, height }: { width: number, height: number }) => {
        const thickness = 0.01
        const inset = 0.1
        const color = "#eecfa1"
        const z = THICKNESS / 2 + 0.001

        // 4 lines
        return (
            <group>
                {/* Top */}
                <mesh position={[0, height / 2 - inset, z]}>
                    <boxGeometry args={[width - inset * 2, thickness, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Bottom */}
                <mesh position={[0, -height / 2 + inset, z]}>
                    <boxGeometry args={[width - inset * 2, thickness, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Left */}
                <mesh position={[-width / 2 + inset, 0, z]}>
                    <boxGeometry args={[thickness, height - inset * 2, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Right */}
                <mesh position={[width / 2 - inset, 0, z]}>
                    <boxGeometry args={[thickness, height - inset * 2, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </group>
        )
    }

    return (
        <group>
            {/* Panel B: Right Side (Static relative to card group root) */}
            <mesh position={[WIDTH / 2, 0, 0]}>
                <boxGeometry args={[WIDTH, HEIGHT, THICKNESS]} />
                <meshStandardMaterial attach="material-0" color="#fff" />
                <meshStandardMaterial attach="material-1" color="#fff" />
                <meshStandardMaterial attach="material-2" color="#fff" />
                <meshStandardMaterial attach="material-3" color="#fff" />
                <meshStandardMaterial attach="material-4" map={insideRight} transparent />
                <meshStandardMaterial attach="material-5" color="#f0f0f0" />

                {/* Decorative Border */}
                <Border width={WIDTH} height={HEIGHT} />

                {/* Fold Line (At Left Edge of this panel, which is x = -WIDTH/2 relative to this mesh) */}
                <mesh position={[-WIDTH / 2, 0, THICKNESS / 2 + 0.002]}>
                    <planeGeometry args={[0.02, HEIGHT * 0.95]} />
                    <meshStandardMaterial color="#eecfa1" transparent opacity={0.5} />
                </mesh>
            </mesh>

            {/* Panel A: Left Side (Hinged) */}
            {/* Offset Z slightly to avoid Z-fighting with Panel B when folded */}
            <group ref={hingeGroup} rotation={[0, Math.PI, 0]} position={[0, 0, THICKNESS + 0.0001]}>
                {/* Initial rotation PI = closed. But we lerp it. */}
                {/* Note: In useFrame we lerp towards target. Initial check? */}
                {/* We'll set initial via ref in useLayoutEffect if needed, but lerp handles it quickly. */}

                <mesh position={[-WIDTH / 2, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[WIDTH, HEIGHT, THICKNESS]} />
                    <meshStandardMaterial attach="material-0" color="#fff" />
                    <meshStandardMaterial attach="material-1" color="#fff" />
                    <meshStandardMaterial attach="material-2" color="#fff" />
                    <meshStandardMaterial attach="material-3" color="#fff" />
                    <meshStandardMaterial attach="material-4" map={insideLeft} transparent />
                    <meshStandardMaterial attach="material-5" map={front} transparent />

                    {/* Decorative Border */}
                    {/* Relative to this mesh, +Z is Inside Left (Mat 4) */}
                    <Border width={WIDTH} height={HEIGHT} />
                </mesh>
            </group>
        </group>
    )
}
