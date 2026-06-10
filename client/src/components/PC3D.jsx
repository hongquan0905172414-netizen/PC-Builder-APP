import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function PCModel({ showRgb, showGlass }) {
  const groupRef  = useRef()
  const ramRefs   = useRef([])
  const gpuRgbRef = useRef()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
    }
    if (showRgb) {
      const t = clock.elapsedTime
      const r = Math.sin(t * 0.8) * 0.5 + 0.5
      const g = Math.sin(t * 0.8 + 2.1) * 0.5 + 0.5
      const b = Math.sin(t * 0.8 + 4.2) * 0.5 + 0.5
      ramRefs.current.forEach((mesh) => {
        if (mesh?.material) {
          mesh.material.color.setRGB(r, g, b)
          mesh.material.emissive.setRGB(r * 0.6, g * 0.6, b * 0.6)
          mesh.material.emissiveIntensity = 2.0
        }
      })
      if (gpuRgbRef.current?.material) {
        gpuRgbRef.current.material.color.setRGB(r, g, b)
        gpuRgbRef.current.material.emissive.setRGB(r * 0.6, g * 0.6, b * 0.6)
      }
    }
  })

  return (
    <group ref={groupRef} rotation={[0.08, 0.45, 0]}>

      {/* ── Case body ── */}
      <mesh>
        <boxGeometry args={[1.1, 2.3, 0.75]} />
        <meshStandardMaterial color="#111" metalness={0.4} roughness={0.7} />
      </mesh>

      {/* Front panel base */}
      <mesh position={[0, 0, 0.384]}>
        <boxGeometry args={[1.08, 2.28, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      {/* Front grille cutout */}
      <mesh position={[0, 0.05, 0.389]}>
        <boxGeometry args={[0.78, 1.5, 0.005]} />
        <meshStandardMaterial color="#0c0c0c" roughness={1} />
      </mesh>

      {/* Power button LED */}
      <mesh position={[0.35, 1.0, 0.392]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.01, 12]} />
        <meshStandardMaterial color="#3b9eff" emissive="#3b9eff" emissiveIntensity={3} />
      </mesh>
      {/* USB ports */}
      {[-0.04, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0.392]}>
          <boxGeometry args={[0.065, 0.022, 0.005]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}

      {/* ── Glass side panel (left face) ── */}
      {showGlass && (
        <mesh position={[-0.558, 0, 0]}>
          <boxGeometry args={[0.008, 2.22, 0.73]} />
          <meshStandardMaterial
            color="#99bbff"
            transparent
            opacity={0.2}
            metalness={0.9}
            roughness={0.05}
          />
        </mesh>
      )}

      {/* ── Motherboard ── */}
      <mesh position={[0.52, 0.1, 0]}>
        <boxGeometry args={[0.01, 1.85, 0.66]} />
        <meshStandardMaterial color="#06200e" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Mobo heatsink */}
      <mesh position={[0.44, 0.62, -0.22]}>
        <boxGeometry args={[0.1, 0.07, 0.18]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── CPU cooler tower ── */}
      <mesh position={[0.3, 0.55, 0.1]}>
        <boxGeometry args={[0.22, 0.5, 0.3]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* CPU fan disc */}
      <mesh position={[0.17, 0.55, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 14]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* ── GPU ── */}
      <mesh position={[0.2, -0.22, 0.03]}>
        <boxGeometry args={[0.62, 0.2, 0.62]} />
        <meshStandardMaterial color="#161630" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* GPU top shroud */}
      <mesh position={[0.2, -0.12, 0.03]}>
        <boxGeometry args={[0.6, 0.04, 0.6]} />
        <meshStandardMaterial color="#1e1e3a" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* GPU fan rings (bottom face) */}
      {[0.06, 0.32].map((x, i) => (
        <mesh key={i} position={[x, -0.325, 0.03]}>
          <cylinderGeometry args={[0.072, 0.072, 0.01, 14]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
      {/* GPU RGB stripe */}
      {showRgb && (
        <mesh ref={gpuRgbRef} position={[0.2, -0.11, 0.03]}>
          <boxGeometry args={[0.58, 0.012, 0.58]} />
          <meshStandardMaterial color="#3b9eff" emissive="#1a4d7a" emissiveIntensity={2.5} />
        </mesh>
      )}

      {/* ── RAM sticks ── */}
      {[0.1, -0.04].map((z, i) => (
        <mesh
          key={i}
          ref={(el) => { ramRefs.current[i] = el }}
          position={[0.44, 0.36, z]}
        >
          <boxGeometry args={[0.025, 0.44, 0.09]} />
          <meshStandardMaterial
            color={showRgb ? '#3b9eff' : '#1a1a2e'}
            emissive={showRgb ? '#1a4d7a' : '#000008'}
            emissiveIntensity={showRgb ? 1.5 : 0.1}
          />
        </mesh>
      ))}

      {/* ── SSD ── */}
      <mesh position={[0.35, -0.08, -0.2]}>
        <boxGeometry args={[0.05, 0.01, 0.28]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
      </mesh>

      {/* ── PSU ── */}
      <mesh position={[0.1, -0.92, 0]}>
        <boxGeometry args={[0.85, 0.3, 0.68]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* PSU fan */}
      <mesh position={[0.1, -0.92, 0.352]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.01, 14]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} />
      </mesh>

      {/* ── Case feet ── */}
      {[[-0.4, 0.27], [0.4, 0.27], [-0.4, -0.27], [0.4, -0.27]].map(([x, z], i) => (
        <mesh key={i} position={[x, -1.18, z]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      ))}

    </group>
  )
}

export default function PC3D({ showRgb = false, showGlass = false }) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.5], fov: 38 }}
      style={{ height: '300px', borderRadius: '12px', background: '#07070f' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#4488ff" />
      <pointLight position={[-2, 3, 3]} intensity={0.5} color="#3b9eff" />
      {showRgb && <pointLight position={[0, 0, 2]} intensity={0.6} color="#ff44aa" />}
      <PCModel showRgb={showRgb} showGlass={showGlass} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.72}
      />
    </Canvas>
  )
}
