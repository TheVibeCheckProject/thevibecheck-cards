import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { Card3D } from './Card'
import { Envelope } from './EnvelopeFbx'
import Link from 'next/link'

interface ExperienceProps {
    faces: {
        front: string;
        inside_left: string;
        inside_right: string;
    }
    onSkip?: () => void
}

type AnimationStep =
    | 'idle'
    | 'opening_envelope'
    | 'sliding_out'
    | 'rotating'
    | 'pause'
    | 'opening_card'
    | 'reading'

function AnimationController({ step, children }: { step: AnimationStep, children: React.ReactNode }) {
    const groupRef = useRef<THREE.Group>(null)

    const getTargets = (s: AnimationStep) => {
        const landscapeRot = -Math.PI / 2
        const portraitRot = 0

        switch (s) {
            case 'idle':
            case 'opening_envelope':
                return { pos: [0, 0.005, 0], rot: [0, 0, landscapeRot] }
            case 'sliding_out':
                return { pos: [0, 2.0, 0.0], rot: [0, 0, landscapeRot] }
            case 'rotating':
                return { pos: [0, 2.0, 0.5], rot: [0, 0, portraitRot] }
            case 'pause':
                return { pos: [0, 0, 1.5], rot: [0, 0, portraitRot] }
            case 'opening_card':
                return { pos: [0, 0, 2.0], rot: [0, 0, portraitRot] }
            case 'reading':
                return { pos: [0, 0.5, 3.2], rot: [0, 0, portraitRot] }
            default:
                return { pos: [0, 0, 0], rot: [0, 0, 0] }
        }
    }

    useLayoutEffect(() => {
        if (groupRef.current && step === 'idle') {
            const { pos, rot } = getTargets('idle');
            groupRef.current.position.set(pos[0], pos[1], pos[2]);
            groupRef.current.rotation.set(rot[0], rot[1], rot[2]);
        }
    }, [step]);

    useFrame((state, delta) => {
        if (!groupRef.current) return
        const { pos, rot } = getTargets(step)

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, pos[0], 3 * delta)
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, pos[1], 3 * delta)
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, pos[2], 3 * delta)

        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rot[0], 3 * delta)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rot[1], 3 * delta)
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rot[2], 3 * delta)
    })

    const isVisible = step !== 'idle'

    return (
        <group ref={groupRef} visible={isVisible}>
            {children}
        </group>
    )
}

function CameraRig() {
    useFrame((state) => {
        state.camera.lookAt(0, 0, 0)
    })
    return null
}

export function Experience({ faces }: ExperienceProps) {
    const [step, setStep] = useState<AnimationStep>('idle')

    useEffect(() => {
        if (step === 'opening_envelope') {
            const t = setTimeout(() => setStep('sliding_out'), 900)
            return () => clearTimeout(t)
        }
        if (step === 'sliding_out') {
            const t = setTimeout(() => setStep('rotating'), 1200)
            return () => clearTimeout(t)
        }
        if (step === 'rotating') {
            const t = setTimeout(() => setStep('pause'), 800)
            return () => clearTimeout(t)
        }
        if (step === 'pause') {
            const t = setTimeout(() => setStep('opening_card'), 1000)
            return () => clearTimeout(t)
        }
        if (step === 'opening_card') {
            const t = setTimeout(() => setStep('reading'), 800)
            return () => clearTimeout(t)
        }
    }, [step])

    return (
        <div className="w-full h-full absolute top-0 left-0 bg-[#0a0a0a]" style={{ touchAction: 'none' }}>

            {step !== 'reading' && (
                <button
                    onClick={() => setStep('reading')}
                    className="absolute top-8 right-8 z-50 text-white/40 hover:text-white uppercase text-xs tracking-widest border border-white/10 hover:border-white/50 px-4 py-2 rounded-full transition-all"
                >
                    {step === 'idle' ? 'Skip' : 'Skip Animation'}
                </button>
            )}

            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10" />

            {/* UPDATED CAMERA: 45 Degree Angle
               X: 10 (Right)
               Y: 5 (Up)
               Z: -10 (Back)
               This creates a diagonal view to fix the "leaning" asset.
            */}
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }} style={{ touchAction: 'none' }}>
                <color attach="background" args={['#111']} />

                <ambientLight intensity={0.4} />
                <spotLight
                    // Move light to match the new camera angle so shadows fall nicely
                    position={[10, 10, -5]}
                    angle={0.5}
                    penumbra={1}
                    intensity={2}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <Environment preset="city" blur={1} />

                <group position={[0, 0, 0]}>
                    <Envelope
                        isOpen={step !== 'idle'}
                        onClick={() => {
                            if (step === 'idle') setStep('opening_envelope')
                        }}
                    />

                    <AnimationController step={step}>
                        <Card3D
                            frontUrl={faces.front}
                            insideLeftUrl={faces.inside_left}
                            insideRightUrl={faces.inside_right}
                            isOpen={step === 'opening_card' || step === 'reading'}
                        />
                    </AnimationController>
                </group>

                <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={20} blur={2.5} far={4} color="#000" />

                <CameraRig />
                <OrbitControls
                    makeDefault
                    enablePan={false}
                    enableZoom={false}
                    target={[0, 0, 0]}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / .5}
                />
            </Canvas>

            {step === 'reading' && (
                <div className="absolute bottom-12 left-0 w-full text-center z-50 animate-in fade-in duration-1000">
                    <Link href="/" className="inline-block bg-white text-black font-serif px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 transition-transform">
                        Send your own card
                    </Link>
                </div>
            )}

            {step === 'idle' && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-[0.2em] animate-pulse pointer-events-none uppercase">
                    Tap seal to open
                </div>
            )}
        </div>
    )
}