import { useRef } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment, Text } from '@react-three/drei'
import * as THREE from 'three'
import ProfilePic from '../resources/images/me.png'

interface AcrylicDiscProps {
  rotation: { x: number; y: number }
  totalRotation: number
  size: number // Size in pixels to match the image
}

const DiscMesh = ({ rotation, totalRotation, size }: AcrylicDiscProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Load texture with error handling
  let texture;
  try {
    texture = useLoader(THREE.TextureLoader, ProfilePic);
  } catch (error) {
    console.error('Error loading texture:', error);
    texture = null;
  }
  
  const radius = size / 300
  const thickness = 0.3
  
  return (
    <group
      rotation={[
        (-rotation.x * Math.PI) / 180, // Negate to fix inverted rotation
        ((rotation.y + totalRotation) * Math.PI) / 180, // Keep original rotation (no extra negative)
        0
      ]}
    >
      {/* Main glass disc - rotate to face user */}
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, thickness, 32]} />
        <MeshTransmissionMaterial
          thickness={thickness}
          transmission={0.98}
          ior={1.52}
          roughness={0.15}
          chromaticAberration={0.01}
          samples={4}
          transparent
          distortion={0}
          distortionScale={0}
          reflectivity={0.1}
        />
      </mesh>
      
      {/* Inverted profile picture on back surface - only render if texture loaded */}
      {texture && (
        <mesh 
          position={[0, 0, -thickness / 2 - 0.001]} 
          rotation={[0, 0, 0]} // No rotation for inverted effect
        >
          <circleGeometry args={[radius * 0.85]} />
          <meshBasicMaterial 
            map={texture}
            transparent
            opacity={0.05}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Engraved text on back surface */}
      <group position={[0, 0, -thickness / 2 - 0.003]}>
        <Text
          fontSize={radius * 0.16}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
          renderOrder={1}
        >
          👋{'\n'}Hi there!
        </Text>
      </group>
    </group>
  )
}

export const AcrylicDisc = ({ rotation, totalRotation, size }: AcrylicDiscProps) => {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: 'rotateY(180deg)',
        backfaceVisibility: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 25 }} // Moved camera further back and increased FOV
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[1, 1, 1]} intensity={0.3} />
        <Environment preset="apartment" />
        
        <DiscMesh 
          rotation={rotation} 
          totalRotation={totalRotation} 
          size={size} 
        />
      </Canvas>
    </div>
  )
} 