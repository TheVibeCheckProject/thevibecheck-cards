import { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Card3DProps {
    frontUrl: string;
    insideLeftUrl: string;
    insideRightUrl: string;
    isOpen: boolean;
}

const WIDTH = 1.46;
const HEIGHT = 1.95;
const THICKNESS = 0.002;

export function Card3D({ frontUrl, insideLeftUrl, insideRightUrl, isOpen }: Card3DProps) {
    // SAFETY CHECK: Ensure valid URLs are provided
    const validUrls = [frontUrl, insideLeftUrl, insideRightUrl].every(url => typeof url === 'string' && url.length > 0);

    if (!validUrls) {
        console.warn("Card3D: Missing or invalid image URL(s). Skipping render.");
        return null;
    }

    const [front, insideLeft, insideRight] = useLoader(THREE.TextureLoader, [
        frontUrl,
        insideLeftUrl,
        insideRightUrl
    ]);

    [front, insideLeft, insideRight].forEach(t => {
        if (t) {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 16;
        }
    });

    const hingeGroup = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (!hingeGroup.current) return;

        const targetRot = isOpen ? 0 : Math.PI;
        hingeGroup.current.rotation.y = THREE.MathUtils.lerp(
            hingeGroup.current.rotation.y,
            targetRot,
            3 * delta
        );
    });

    const Border = ({ width, height }: { width: number, height: number }) => {
        const thickness = 0.01;
        const inset = 0.1;
        const color = "#eecfa1";
        const z = THICKNESS / 2 + 0.001;

        return (
            <group>
                <mesh position={[0, height / 2 - inset, z]}>
                    <boxGeometry args={[width - inset * 2, thickness, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[0, -height / 2 + inset, z]}>
                    <boxGeometry args={[width - inset * 2, thickness, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[-width / 2 + inset, 0, z]}>
                    <boxGeometry args={[thickness, height - inset * 2, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[width / 2 - inset, 0, z]}>
                    <boxGeometry args={[thickness, height - inset * 2, 0.001]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </group>
        );
    };

    return (
        <group>
            {/* Panel B: Right Side (Static) */}
            <mesh position={[WIDTH / 2, 0, 0]}>
                <boxGeometry args={[WIDTH, HEIGHT, THICKNESS]} />
                <meshStandardMaterial attach="material-0" color="#fff" />
                <meshStandardMaterial attach="material-1" color="#fff" />
                <meshStandardMaterial attach="material-2" color="#fff" />
                <meshStandardMaterial attach="material-3" color="#fff" />
                <meshStandardMaterial attach="material-4" map={insideRight} transparent />
                <meshStandardMaterial attach="material-5" color="#f0f0f0" />
                <Border width={WIDTH} height={HEIGHT} />
                <mesh position={[-WIDTH / 2, 0, THICKNESS / 2 + 0.002]}>
                    <planeGeometry args={[0.02, HEIGHT * 0.95]} />
                    <meshStandardMaterial color="#eecfa1" transparent opacity={0.5} />
                </mesh>
            </mesh>

            {/* Panel A: Left Side (Hinged) */}
            <group ref={hingeGroup} rotation={[0, Math.PI, 0]} position={[0, 0, THICKNESS + 0.0001]}>
                <mesh position={[-WIDTH / 2, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[WIDTH, HEIGHT, THICKNESS]} />
                    <meshStandardMaterial attach="material-0" color="#fff" />
                    <meshStandardMaterial attach="material-1" color="#fff" />
                    <meshStandardMaterial attach="material-2" color="#fff" />
                    <meshStandardMaterial attach="material-3" color="#fff" />
                    <meshStandardMaterial attach="material-4" map={insideLeft} transparent />
                    <meshStandardMaterial attach="material-5" map={front} transparent />
                    <Border width={WIDTH} height={HEIGHT} />
                </mesh>
            </group>
        </group>
    );
}
