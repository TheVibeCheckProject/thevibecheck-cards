import { useFBX, useAnimations } from '@react-three/drei'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

interface EnvelopeProps {
    isOpen: boolean
    onClick?: () => void
}

export function Envelope({ isOpen, onClick }: EnvelopeProps) {
    const group = useRef<THREE.Group>(null)

    // 1. Load the FBX file
    // Ensure this file is in your public/models/ folder
    const originalFbx = useFBX('/models/envelope.fbx')

    // 2. Clone the object so we can reuse it if needed without conflicts
    const fbx = useMemo(() => originalFbx.clone(), [originalFbx])

    // 3. Extract the animations
    const { actions } = useAnimations(fbx.animations, group)

    // 4. Helper function to convert Degrees to Radians (e.g., r(90) = 1.57...)
    const r = (degrees: number) => THREE.MathUtils.degToRad(degrees)

    useEffect(() => {
        // We grab the first animation found in the file (usually the "ArmatureAction")
        console.log('Available Animations:', Object.keys(actions))
        const action = Object.values(actions)[0]

        if (action) {
            // "Clamp" means it freezes at the end frame instead of resetting
            action.clampWhenFinished = true
            // Play only once, don't repeat
            action.loop = THREE.LoopOnce

            if (isOpen) {
                // Reset wipes any previous state, Play starts it
                action.reset().play()
            } else {
                // If closed, stop the animation and reset to frame 0 (folded)
                action.stop()
                action.reset()
            }
        }
    }, [isOpen, actions])

    return (
        <group ref={group} dispose={null} onClick={onClick}>
            <primitive
                object={fbx}
                // SCALE: Blender exports are often huge. 0.01 scales it down to normal size.
                // If it's too small, change this to 1.
                scale={0.01}

                // ROTATION: 
                // X: -90 degrees stands it upright (fixes Blender Z-up issue)
                // Y: 0 degrees (change to 180 if the back is facing you)
                // Z: 0 degrees
                rotation={[r(-90), r(0), r(0)]}
            />
        </group>
    )
}

// Preload the file so it doesn't pop in late
useFBX.preload('/models/envelope.fbx')