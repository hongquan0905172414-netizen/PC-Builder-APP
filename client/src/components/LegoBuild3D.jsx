/*
================================================================
  LegoBuild3D.jsx — Lego-manual style build view
================================================================
  Shows the PC as it exists SO FAR, plus the one new piece for
  this step floating next to its slot with a green arrow
  pointing where it goes. No text — the picture is the
  instruction, exactly like a Lego booklet page.

  PROPS:
    installed — array of piece ids already placed
    incoming  — id of the piece being added this step (or null)
================================================================
*/

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';

/* ----------------------------------------------------------
  Every piece of the build, in install order.

  pos     — where it ends up
  size    — box dimensions
  color   — its colour in the finished build
  from    — offset it floats at before being pushed in
            (the arrow is drawn along this line)
---------------------------------------------------------- */
export const PIECES = {
  'case': {
    pos: [0, 0, 0], size: [1.1, 2.3, 0.75], color: '#3a3a42',
    from: [0, 1.6, 0],
  },
  'psu': {
    pos: [0.1, -0.92, 0], size: [0.85, 0.3, 0.68], color: '#5a5a62',
    from: [-1.5, -0.2, 0],
  },
  'motherboard': {
    pos: [0.52, 0.1, 0], size: [0.03, 1.85, 0.66], color: '#1f6b3a',
    from: [-1.5, 0.5, 0],
  },
  'cpu': {
    pos: [0.48, 0.55, 0.1], size: [0.03, 0.22, 0.22], color: '#c9a227',
    from: [-1.1, 0.7, 0],
  },
  'cpu-cooler': {
    pos: [0.3, 0.55, 0.1], size: [0.22, 0.5, 0.3], color: '#8a8a94',
    from: [-1.2, 0.8, 0],
  },
  'ram-1': {
    pos: [0.44, 0.36, 0.1], size: [0.035, 0.44, 0.09], color: '#2f6bd8',
    from: [-0.9, 0.9, 0.3],
  },
  'ram-2': {
    pos: [0.44, 0.36, -0.04], size: [0.035, 0.44, 0.09], color: '#2f6bd8',
    from: [-0.9, 0.9, -0.3],
  },
  'storage': {
    pos: [0.44, -0.08, -0.2], size: [0.04, 0.03, 0.28], color: '#22223a',
    from: [-1.0, 0.3, -0.5],
  },
  'gpu': {
    pos: [0.2, -0.22, 0.03], size: [0.62, 0.2, 0.62], color: '#2a2a48',
    from: [-1.3, 0.5, 0],
  },
  'glass': {
    pos: [-0.558, 0, 0], size: [0.02, 2.22, 0.73], color: '#9fc4ff',
    from: [-1.4, 0.2, 0],
  },
};

const GREEN = '#22c55e';

/** One placed piece — plain, no highlight */
function Placed({ id }) {
  const p = PIECES[id];
  if (!p) return null;
  const glass = id === 'glass';
  return (
    <mesh position={p.pos}>
      <boxGeometry args={p.size} />
      <meshStandardMaterial
        color={p.color}
        metalness={glass ? 0.9 : 0.35}
        roughness={glass ? 0.05 : 0.6}
        transparent={glass}
        opacity={glass ? 0.25 : 1}
      />
    </mesh>
  );
}

/** The new piece — floats at `from`, bobbing, outlined green */
function Incoming({ id }) {
  const ref = useRef();
  const p   = PIECES[id];

  useFrame(({ clock }) => {
    if (!ref.current || !p) return;
    const bob = Math.sin(clock.elapsedTime * 2) * 0.05;
    ref.current.position.set(
      p.pos[0] + p.from[0],
      p.pos[1] + p.from[1] + bob,
      p.pos[2] + p.from[2]
    );
  });

  if (!p) return null;

  return (
    <mesh ref={ref}>
      <boxGeometry args={p.size} />
      <meshStandardMaterial color={p.color} metalness={0.35} roughness={0.5} />
      <Edges color={GREEN} lineWidth={3} />
    </mesh>
  );
}

/** Green arrow from the floating piece toward its slot */
function Arrow({ id }) {
  const p = PIECES[id];
  if (!p) return null;

  const [fx, fy, fz] = p.from;
  const len = Math.sqrt(fx * fx + fy * fy + fz * fz);
  if (len < 0.01) return null;

  // Sit the arrow between the floating piece and the slot,
  // pointing inward (toward the slot).
  const ux = fx / len, uy = fy / len, uz = fz / len;
  const shaft = Math.max(len * 0.45, 0.3);
  const mid = [
    p.pos[0] + ux * len * 0.5,
    p.pos[1] + uy * len * 0.5,
    p.pos[2] + uz * len * 0.5,
  ];

  // Rotate +Y (cylinder's default axis) onto the direction we
  // want the arrow to POINT, which is back toward the slot.
  const dir  = [-ux, -uy, -uz];
  const yaw  = Math.atan2(dir[0], dir[2]);
  const pitch = Math.asin(Math.max(-1, Math.min(1, dir[1])));
  const rot = [Math.PI / 2 - pitch, yaw, 0, 'YXZ'];

  return (
    <group position={mid} rotation={rot}>
      <mesh position={[0, -shaft / 2, 0]}>
        <cylinderGeometry args={[0.045, 0.045, shaft, 12]} />
        <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -shaft, 0]}>
        <coneGeometry args={[0.12, 0.26, 16]} />
        <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Scene({ installed, incoming }) {
  const group = useRef();

  return (
    <group ref={group} rotation={[0.12, 0.5, 0]}>
      {installed.map((id) => <Placed key={id} id={id} />)}
      {incoming && <Incoming id={incoming} />}
      {incoming && <Arrow id={incoming} />}
    </group>
  );
}

export default function LegoBuild3D({ installed = [], incoming = null }) {
  return (
    <Canvas
      camera={{ position: [-2.2, 0.8, 4.2], fov: 38 }}
      style={{ width: '100%', height: '100%', background: '#e9e9ec' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[-4, 6, 6]} intensity={1.1} />
      <directionalLight position={[4, 2, -3]} intensity={0.4} />
      <Scene installed={installed} incoming={incoming} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI * 0.7}
      />
    </Canvas>
  );
}
