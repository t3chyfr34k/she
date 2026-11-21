import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COLORS = ["#e2f3eb", "#3da783", "#f0c765", "#fff9f0", "#b5ddca", "#b77a32"];

function RisingBalloon({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const cfg = useMemo(() => {
    const r = (n: number) => Math.abs(Math.sin(seed * 12.9898 + n) * 43758.5453) % 1;
    return {
      x: (r(1) - 0.5) * 14,
      z: -r(2) * 5,
      speed: 0.35 + r(3) * 0.5,
      phase: r(4) * 12,
      scale: 0.55 + r(5) * 0.5,
      color: COLORS[seed % COLORS.length] ?? "#e2f3eb",
    };
  }, [seed]);

  useFrame(({ clock, pointer }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const y = ((t * cfg.speed + cfg.phase) % 12) - 6;
    g.position.set(cfg.x + Math.sin(t * 0.8 + cfg.phase) * 0.4 + pointer.x * 0.6, y, cfg.z);
    g.rotation.z = Math.sin(t + cfg.phase) * 0.15;
  });

  return (
    <group ref={ref} scale={cfg.scale}>
      <mesh scale={[1, 1.18, 1]}>
        <sphereGeometry args={[0.6, 40, 40]} />
        <meshPhysicalMaterial color={cfg.color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh position={[0, -0.74, 0]}>
        <coneGeometry args={[0.08, 0.12, 12]} />
        <meshStandardMaterial color={cfg.color} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 1.5, 4]} />
        <meshStandardMaterial color="#fff9f0" />
      </mesh>
    </group>
  );
}

export default function BalloonScene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 9], fov: 45 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#fff9f0", "#174b3c", 0.8]} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -5]} scale={[10, 4, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#f0c765" position={[4, 2, 3]} scale={2} />
      </Environment>
      {Array.from({ length: 18 }, (_, i) => (
        <RisingBalloon key={i} seed={i + 1} />
      ))}
    </Canvas>
  );
}
