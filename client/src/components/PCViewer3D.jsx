import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Environment, Grid } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ─── Tooltip ─────────────────────────────────────────────── */
function Label({ text }) {
  return (
    <Html center distanceFactor={10} zIndexRange={[100, 0]}>
      <div style={{
        background: 'rgba(0,0,0,0.92)', color: '#fff',
        padding: '5px 11px', borderRadius: '6px', fontSize: '12px',
        whiteSpace: 'nowrap', border: '1px solid rgba(59,158,255,0.6)',
        pointerEvents: 'none',
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}>{text}</div>
    </Html>
  )
}

/* ─── Hoverable mesh ──────────────────────────────────────── */
function Part({ geometry, position, rotation, color, hoverColor, emissive = '#000000',
  emissiveIntensity = 0, label, metalness = 0.5, roughness = 0.45, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <mesh position={position} rotation={rotation}
      onPointerOver={e => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}>
      {geometry}
      <meshStandardMaterial
        color={hovered ? (hoverColor || '#aaa') : color}
        metalness={metalness} roughness={roughness}
        emissive={emissive} emissiveIntensity={hovered ? emissiveIntensity + 0.15 : emissiveIntensity}
      />
      {hovered && label && <Label text={label} />}
      {children}
    </mesh>
  )
}

/* ─── Fan ─────────────────────────────────────────────────── */
function Fan({ position, rotation = [0, 0, 0], speed = 4, size = 1 }) {
  const bladesRef = useRef()
  useFrame((_, dt) => { if (bladesRef.current) bladesRef.current.rotation.z -= dt * speed })
  const r = 0.155 * size, bladeW = 0.23 * size, bladeH = 0.052 * size
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[r, 0.022 * size, 8, 32]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      <group ref={bladesRef}>
        {[0,1,2,3].map(i => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
            <boxGeometry args={[bladeW, bladeH, 0.016 * size]} />
            <meshStandardMaterial color="#484848" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
        {[0,1,2,3].map(i => (
          <mesh key={`d${i}`} rotation={[0, 0, Math.PI/4 + (i * Math.PI)/2]}>
            <boxGeometry args={[bladeW * 0.87, bladeH * 0.8, 0.016 * size]} />
            <meshStandardMaterial color="#383838" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </group>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.032 * size, 0.032 * size, 0.022 * size, 16]} />
        <meshStandardMaterial color="#111" metalness={0.8} />
      </mesh>
    </group>
  )
}

/* ─── AIO Water Cooler ────────────────────────────────────── */
function AIOCooler({ pumpPos, radPos }) {
  const tubeRef1 = useRef(), tubeRef2 = useRef()

  /* Pump head on CPU */
  const pump = (
    <group position={pumpPos}>
      <mesh>
        <cylinderGeometry args={[0.21, 0.21, 0.1, 32]} />
        <meshStandardMaterial color="#0d0d0d" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Logo glow ring */}
      <mesh>
        <torusGeometry args={[0.14, 0.012, 8, 48]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={2.5} />
      </mesh>
      {/* Top mirror plate */}
      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.008, 32]} />
        <meshStandardMaterial color="#888" metalness={0.98} roughness={0.02} />
      </mesh>
    </group>
  )

  /* 240 mm radiator */
  const rad = (
    <group position={radPos} rotation={[0, 0, 0]}>
      {/* Core block */}
      <mesh>
        <boxGeometry args={[0.08, 1.02, 0.5]} />
        <meshStandardMaterial color="#7a7a7a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Fins */}
      {Array.from({length: 22}).map((_, i) => (
        <mesh key={i} position={[0, -0.49 + i * 0.046, 0]}>
          <boxGeometry args={[0.07, 0.008, 0.48]} />
          <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Manifolds */}
      {[-0.52, 0.52].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.1, 0.05, 0.52]} />
          <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* 2× 120 mm fans */}
      <Fan position={[0.065, 0.27, 0]} rotation={[0, Math.PI/2, 0]} speed={3.5} />
      <Fan position={[0.065, -0.27, 0]} rotation={[0, Math.PI/2, 0]} speed={3.5} />
    </group>
  )

  return <group>{pump}{rad}</group>
}

/* ─── GPU ─────────────────────────────────────────────────── */
function GPU({ position }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={position}
      onPointerOver={e => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}>
      {/* PCB */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.28, 0.52, 1.12]} />
        <meshStandardMaterial color="#0e200e" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Heatsink block */}
      <mesh position={[-0.06, 0.04, 0]}>
        <boxGeometry args={[0.18, 0.36, 1.08]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Shroud top cap */}
      <mesh position={[0.02, 0.25, 0]}>
        <boxGeometry args={[0.26, 0.05, 1.1]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* RGB accent top */}
      <mesh position={[0.03, 0.28, 0]}>
        <boxGeometry args={[0.24, 0.012, 1.08]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} />
      </mesh>
      {/* Backplate */}
      <mesh position={[0.15, 0, 0]}>
        <boxGeometry args={[0.02, 0.5, 1.1]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Backplate RGB stripe */}
      <mesh position={[0.162, -0.18, 0]}>
        <boxGeometry args={[0.004, 0.06, 1.08]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
      </mesh>
      {/* Power connector */}
      <mesh position={[0, 0.29, -0.42]}>
        <boxGeometry args={[0.26, 0.1, 0.12]} />
        <meshStandardMaterial color="#111" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Fans */}
      <Fan position={[0, 0.04, 0.3]} rotation={[0, 0, 0]} speed={5} />
      <Fan position={[0, 0.04, -0.3]} rotation={[0, 0, 0]} speed={5} />
      {/* I/O bracket */}
      <mesh position={[0, -0.24, -0.57]}>
        <boxGeometry args={[0.26, 0.06, 0.02]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {hovered && <Label text="GPU — NVIDIA RTX 4070 Ti Super" />}
    </group>
  )
}

/* ─── RGB point light ─────────────────────────────────────── */
function RGBLight({ position, offset = 0 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.color.setHSL(((clock.getElapsedTime() * 0.1) + offset) % 1, 1, 0.55)
  })
  return <pointLight ref={ref} position={position} intensity={2.5} distance={2.2} />
}

/* ─── Main PC Model ───────────────────────────────────────── */
function PCModel() {
  return (
    <group>
      {/* ══ CASE PANELS ══ */}
      {/* Bottom */}
      <Part geometry={<boxGeometry args={[2, 0.025, 1.5]} />}
        position={[0, -2.01, 0]} color="#181818" metalness={0.7} roughness={0.3} />
      {/* Top */}
      <Part geometry={<boxGeometry args={[2, 0.025, 1.5]} />}
        position={[0, 2.01, 0]} color="#181818" metalness={0.7} roughness={0.3} />
      {/* Back */}
      <Part geometry={<boxGeometry args={[2, 4.05, 0.025]} />}
        position={[0, 0, -0.763]} color="#141414" metalness={0.7} roughness={0.3} />
      {/* Left (solid) */}
      <Part geometry={<boxGeometry args={[0.025, 4.05, 1.5]} />}
        position={[-1.01, 0, 0]} color="#1c1c1c" metalness={0.65} roughness={0.35} />
      {/* Front (open mesh — just a thin frame) */}
      <Part geometry={<boxGeometry args={[0.025, 4.05, 1.5]} />}
        position={[1.01, 0, 0]} color="#1a1a1a" metalness={0.65} roughness={0.35} />

      {/* ── Tempered glass right side ── */}
      <mesh position={[0.98, 0, 0]}>
        <boxGeometry args={[0.01, 3.9, 1.46]} />
        <meshPhysicalMaterial
          color="#99bbff" transmission={0.94} thickness={0.4}
          roughness={0.01} metalness={0} ior={1.52}
          transparent opacity={0.18} side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glass frame edges */}
      <lineSegments position={[0.98, 0, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.01, 3.9, 1.46)]} />
        <lineBasicMaterial color="#4a8aff" transparent opacity={0.5} />
      </lineSegments>

      {/* Case corner edge highlights */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2, 4, 1.5)]} />
        <lineBasicMaterial color="#3a3a3a" transparent opacity={0.8} />
      </lineSegments>

      {/* ── Feet ── */}
      {[[-0.8,-2.04,0.6],[0.8,-2.04,0.6],[-0.8,-2.04,-0.6],[0.8,-2.04,-0.6]].map(([x,y,z],i)=>(
        <mesh key={i} position={[x,y,z]}>
          <cylinderGeometry args={[0.07,0.09,0.06,16]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Power button ── */}
      <mesh position={[1.0, 1.7, -0.55]}>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 32]} rotation={[Math.PI/2,0,0]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[1.0, 1.7, -0.55]}>
        <torusGeometry args={[0.044, 0.008, 8, 32]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} />
      </mesh>

      {/* ── USB / front ports ── */}
      {[[-0.15,0],[-0.05,0],[0.05,0]].map(([z,_],i)=>(
        <mesh key={i} position={[1.01, 1.5, z]}>
          <boxGeometry args={[0.018, 0.04, 0.06]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* ══ LIGHTS ══ */}
      <RGBLight position={[0.5, 0.5, 0.3]} offset={0} />
      <RGBLight position={[0.4, -1.0, 0.4]} offset={0.33} />
      <pointLight position={[0.3, 1.6, 0.4]} color="#ffffff" intensity={1.0} distance={2.5} />

      {/* ══ MOTHERBOARD ══ */}
      <Part
        geometry={<boxGeometry args={[0.035, 2.75, 1.24]} />}
        position={[0.72, 0.05, 0]}
        color="#1a5e1a" hoverColor="#258025"
        emissive="#1a5e1a" emissiveIntensity={0.12}
        metalness={0.2} roughness={0.75}
        label="Motherboard — ASUS ROG STRIX Z790-E"
      />
      {/* PCB trace layer */}
      <mesh position={[0.706, 0.05, 0]}>
        <boxGeometry args={[0.01, 2.65, 1.14]} />
        <meshStandardMaterial color="#0e3c0e" emissive="#0e3c0e" emissiveIntensity={0.08} />
      </mesh>
      {/* VRM heatsink */}
      <mesh position={[0.66, 1.05, 0.45]}>
        <boxGeometry args={[0.08, 0.22, 0.3]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Chipset heatsink */}
      <mesh position={[0.66, -0.6, -0.3]}>
        <boxGeometry args={[0.07, 0.14, 0.22]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.653, -0.6, -0.3]}>
        <boxGeometry args={[0.005, 0.1, 0.18]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
      </mesh>

      {/* ══ CPU ══ */}
      <Part
        geometry={<boxGeometry args={[0.08, 0.44, 0.44]} />}
        position={[0.665, 0.6, 0.14]}
        color="#c4c4c4" hoverColor="#e0e0e0"
        metalness={0.85} roughness={0.08}
        label="CPU — Intel Core i9-14900K"
      />
      <mesh position={[0.658, 0.6, 0.14]}>
        <boxGeometry args={[0.03, 0.41, 0.41]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.98} roughness={0.02} />
      </mesh>

      {/* ══ AIO WATER COOLER ══ */}
      <AIOCooler
        pumpPos={[0.58, 0.6, 0.14]}
        radPos={[0.0, 1.48, 0.0]}
      />

      {/* ══ RAM ══ */}
      {[0.47, 0.32].map((z, i) => (
        <group key={i}>
          <Part
            geometry={<boxGeometry args={[0.055, 0.96, 0.116]} />}
            position={[0.648, 1.26, z]}
            color="#0a0a0a" hoverColor="#202020"
            metalness={0.4} roughness={0.6}
            label="RAM — 16GB DDR5-6000"
          />
          {/* Heatspreader fin detail */}
          {[-0.03, 0, 0.03].map((dz, j) => (
            <mesh key={j} position={[0.624, 1.72, z + dz]}>
              <boxGeometry args={[0.052, 0.04, 0.015]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          {/* RGB LED bar */}
          <mesh position={[0.621, 1.26, z]}>
            <boxGeometry args={[0.007, 0.94, 0.014]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      {/* ══ GPU ══ */}
      <GPU position={[0.54, -0.22, -0.02]} />

      {/* ══ NVMe SSD ══ */}
      <Part
        geometry={<boxGeometry args={[0.042, 0.11, 0.52]} />}
        position={[0.677, -0.78, 0.35]}
        color="#111" hoverColor="#252525"
        metalness={0.5} roughness={0.55}
        label="NVMe SSD — Samsung 990 Pro 2TB"
      />
      <mesh position={[0.655, -0.78, 0.35]}>
        <boxGeometry args={[0.008, 0.07, 0.5]} />
        <meshStandardMaterial color="#3388ff" emissive="#3388ff" emissiveIntensity={0.8} />
      </mesh>

      {/* ══ PSU ══ */}
      <Part
        geometry={<boxGeometry args={[0.92, 0.62, 1.42]} />}
        position={[0.14, -1.66, 0]}
        color="#1a1a1a" hoverColor="#2e2e2e"
        metalness={0.6} roughness={0.4}
        label="PSU — Corsair RM850x 850W 80+ Gold"
      />
      <mesh position={[0.62, -1.66, 0]}>
        <boxGeometry args={[0.016, 0.6, 1.38]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* PSU label badge */}
      <mesh position={[0.628, -1.52, 0.3]}>
        <boxGeometry args={[0.005, 0.16, 0.28]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.8} />
      </mesh>
      <Fan position={[0.622, -1.66, 0]} speed={1.5} />

      {/* ══ TOP CASE FANS (3×120mm) ══ */}
      {[-0.45, 0, 0.45].map((z, i) => (
        <Fan key={i} position={[0, 1.98, z]} rotation={[Math.PI/2, 0, 0]} speed={3.2} />
      ))}
    </group>
  )
}

/* ─── Canvas ──────────────────────────────────────────────── */
export default function PCViewer3D() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [3.6, 1.6, 3.6], fov: 44 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        shadows
      >
        <color attach="background" args={['#06060f']} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[8, 12, 7]} intensity={1.6} castShadow />
        <directionalLight position={[-5, 3, 5]} intensity={0.5} color="#aabbff" />

        <Suspense fallback={null}>
          <Environment preset="studio" />
          <PCModel />
          <Grid
            position={[0, -2.07, 0]}
            args={[14, 14]}
            cellSize={0.5}
            cellThickness={0.4}
            cellColor="#1a2a3a"
            sectionSize={2}
            sectionThickness={0.8}
            sectionColor="#1e3a5f"
            fadeDistance={12}
            infiniteGrid
          />
        </Suspense>

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.55}
            luminanceSmoothing={0.4}
            intensity={0.9}
            mipmapBlur
          />
        </EffectComposer>

        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={1.1}
          minPolarAngle={Math.PI * 0.08}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>
    </div>
  )
}
