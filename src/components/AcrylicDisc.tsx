import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment, Text } from '@react-three/drei'
import * as THREE from 'three'

interface AcrylicDiscProps {
  rotation: { x: number; y: number }
  totalRotation: number
  size: number // Size in pixels to match the image
}

const DiscMesh = ({ rotation, totalRotation, size }: AcrylicDiscProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const radius = (size * 1.5) / 300 // 1.5x bigger disc
  const thickness = 0.25 // Slightly thinner for more elegant look
  
  return (
    <group
      rotation={[
        (-rotation.x * Math.PI) / 180, // Negate to fix inverted rotation (no default tilt)
        ((rotation.y + totalRotation) * Math.PI) / 180, // Keep original rotation (no extra negative)
        0
      ]}
    >
      {/* Main glass disc - rotate to face user */}
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, thickness, 64]} />
        <MeshTransmissionMaterial
          thickness={thickness}
          transmission={0.95} // Slightly lower transmission for more reflectivity
          ior={1.5} // Lower IOR for more realistic glass
          roughness={0.01} // Even smoother surface for more reflection
          chromaticAberration={0.15} // More chromatic aberration for glass effect
          samples={16} // Higher samples for better quality
          transparent
          distortion={0.02} // Reduced distortion
          distortionScale={0.05}
          reflectivity={0.3} // Increased reflectivity for better front face visibility
          clearcoat={1} // Add clearcoat for glossy finish
          clearcoatRoughness={0}
          metalness={0.1} // Slight metalness for more reflection
          envMapIntensity={1.5} // Stronger environment reflections
        />
      </mesh>
      
      {/* Engraved text on back surface */}
      <group position={[0, 0, -thickness / 2 - 0.002]}>
        <Text
          fontSize={radius * 0.18}
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
        camera={{ position: [0, 0, 5], fov: 35 }} // Slightly elevated camera to catch more sky
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        {/* <directionalLight position={[0, 0, 2]} intensity={1.2} />
        <directionalLight position={[2, 2, 1]} intensity={0.8} />
        <directionalLight position={[-2, -2, 1]} intensity={0.6} />
        <directionalLight position={[1, -1, 1]} intensity={0.5} /> */}
        <Environment preset="dawn" />
        
        <DiscMesh 
          rotation={rotation} 
          totalRotation={totalRotation} 
          size={size} 
        />
      </Canvas>
    </div>
  )
} 