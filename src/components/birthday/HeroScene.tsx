import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fireConfetti } from "./confetti";

// three.js materials need concrete colors; read the active CSS tokens from the page.
function readThemeColor(token: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const themeRoot =
    document.querySelector<HTMLElement>("[data-theme-root]") ?? document.documentElement;
  return getComputedStyle(themeRoot).getPropertyValue(`--${token}`).trim() || fallback;
}

const C = {
  mint: readThemeColor("mint", "#e2f3eb"),
  mintDeep: readThemeColor("mint-deep", "#b5ddca"),
  jade: readThemeColor("jade", "#3da783"),
  forest: readThemeColor("forest", "#174b3c"),
  cream: readThemeColor("cream", "#fff9f0"),
  gold: readThemeColor("gold", "#f0c765"),
  goldDeep: readThemeColor("gold-deep", "#b77a32"),
};

function refreshThemeColors() {
  C.mint = readThemeColor("mint", "#e2f3eb");
  C.mintDeep = readThemeColor("mint-deep", "#b5ddca");
  C.jade = readThemeColor("jade", "#3da783");
  C.forest = readThemeColor("forest", "#174b3c");
  C.cream = readThemeColor("cream", "#fff9f0");
  C.gold = readThemeColor("gold", "#f0c765");
  C.goldDeep = readThemeColor("gold-deep", "#b77a32");
}

function Flame({ lit, seed }: { lit: boolean; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const s = useRef(1);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    s.current = THREE.MathUtils.lerp(s.current, lit ? 1 : 0, 0.18);
    const t = clock.elapsedTime * 9 + seed;
    const f = 1 + Math.sin(t) * 0.08 + Math.sin(t * 2.3) * 0.05;
    ref.current.scale.set(0.07 * s.current, 0.15 * f * s.current, 0.07 * s.current);
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.12;
  });
  return (
    <mesh ref={ref} position={[0, 0.42, 0]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={C.gold} toneMapped={false} />
    </mesh>
  );
}

function Candle({ position, color, lit, seed }: { position: [number, number, number]; color: string; lit: boolean; seed: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.55, 16]} />
        <meshStandardMaterial color={C.cream} roughness={0.4} />
      </mesh>
      {[-0.15, 0, 0.15].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2 + 0.35, 0, 0]}>
          <torusGeometry args={[0.052, 0.012, 6, 20]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <Flame lit={lit} seed={seed} />
    </group>
  );
}

function Cake() {
  const group = useRef<THREE.Group>(null);
  const [lit, setLit] = useState(true);
  const intro = useRef(0);
  const vw = useThree((s) => s.viewport.width);
  const fit = Math.min(0.78, vw / 4.4);

  const sprinkles = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const r = 0.15 + Math.random() * 0.68;
        return {
          key: i,
          pos: [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number],
          rot: Math.random() * Math.PI,
          color: [C.gold, C.forest, C.cream, C.jade][i % 4] ?? C.gold,
        };
      }),
    [C.gold, C.forest, C.cream, C.jade],
  );
  const dollops = useMemo(() => Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2), []);
  const drips = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * Math.PI * 2, l: 0.12 + Math.random() * 0.22 })),
    [],
  );
  const candles = useMemo(
    () => [0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      return { pos: [Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45] as [number, number, number], color: i % 2 ? C.jade : C.goldDeep };
    }),
    [C.jade, C.goldDeep],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    intro.current = Math.min(1, intro.current + dt * 0.55);
    const e = 1 - Math.pow(1 - intro.current, 3);
    const scroll = Math.min(1.5, window.scrollY / window.innerHeight);
    // Roll in from the left, then idle-spin; scroll sinks it into the wave.
    const targetX = THREE.MathUtils.lerp(-7, 0, e) + state.pointer.x * 0.25;
    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, 0.12);
    g.position.y = THREE.MathUtils.lerp(g.position.y, (fit < 0.7 ? -1.35 : -1.6) - scroll * 2.2 + state.pointer.y * 0.12, 0.1);
    g.rotation.y += dt * (0.25 + (1 - e) * 4);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, (1 - e) * 0.6 - state.pointer.x * 0.12, 0.1);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.32 + state.pointer.y * -0.15 + scroll * 0.4, 0.08);
  });

  return (
    <group
      ref={group}
      position={[-7, -1.6, 0]}
      scale={fit}
      onClick={(e) => {
        e.stopPropagation();
        if (!lit) return;
        setLit(false);
        fireConfetti({ x: 0.5, y: 0.7 });
        setTimeout(() => setLit(true), 3200);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {/* plate */}
      <mesh position={[0, -0.72, 0]} receiveShadow>
        <cylinderGeometry args={[1.75, 1.6, 0.1, 64]} />
        <meshStandardMaterial color={C.cream} roughness={0.25} metalness={0.05} />
      </mesh>
      {/* bottom tier */}
      <mesh position={[0, -0.27, 0]} castShadow>
        <cylinderGeometry args={[1.35, 1.35, 0.8, 64]} />
        <meshStandardMaterial color={C.mint} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.07, 12, 64]} />
        <meshStandardMaterial color={C.cream} roughness={0.5} />
      </mesh>
      {/* gold drip on bottom tier */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.37, 1.37, 0.06, 64]} />
        <meshStandardMaterial color={C.gold} metalness={0.6} roughness={0.25} />
      </mesh>
      {drips.map((d, i) => (
        <mesh key={i} position={[Math.cos(d.a) * 1.36, 0.1 - d.l / 2, Math.sin(d.a) * 1.36]}>
          <capsuleGeometry args={[0.045, d.l, 4, 8]} />
          <meshStandardMaterial color={C.gold} metalness={0.6} roughness={0.25} />
        </mesh>
      ))}
      {/* top tier */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.92, 0.92, 0.62, 64]} />
        <meshStandardMaterial color={C.cream} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.93, 0.05, 10, 64]} />
        <meshStandardMaterial color={C.jade} roughness={0.5} />
      </mesh>
      {dollops.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.82, 0.78, Math.sin(a) * 0.82]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={i % 2 ? C.mintDeep : C.mint} roughness={0.45} />
        </mesh>
      ))}
      {dollops.map((a, i) => (
        <mesh key={`b${i}`} position={[Math.cos(a + 0.2) * 1.2, 0.17, Math.sin(a + 0.2) * 1.2]}>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={C.cream} roughness={0.45} />
        </mesh>
      ))}
      <group position={[0, 0.77, 0]}>
        {sprinkles.map((s) => (
          <mesh key={s.key} position={s.pos} rotation={[Math.PI / 2, 0, s.rot]}>
            <capsuleGeometry args={[0.012, 0.05, 2, 6]} />
            <meshStandardMaterial color={s.color} roughness={0.4} />
          </mesh>
        ))}
        {candles.map((c, i) => (
          <Candle key={i} position={[c.pos[0], 0.27, c.pos[2]]} color={c.color} lit={lit} seed={i * 1.7} />
        ))}
      </group>
      {lit && <pointLight position={[0, 1.6, 0]} intensity={4} distance={4} color={C.gold} />}
    </group>
  );
}

function Balloon({ position, color, scale = 1, speed = 1 }: { position: [number, number, number]; color: string; scale?: number; speed?: number }) {
  return (
    <Float speed={1.6 * speed} rotationIntensity={0.6} floatIntensity={1.4}>
      <group position={position} scale={scale}>
        <mesh scale={[1, 1.18, 1]}>
          <sphereGeometry args={[0.55, 48, 48]} />
          <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
        <mesh position={[0, -0.68, 0]}>
          <coneGeometry args={[0.07, 0.1, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -1.4, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 1.4, 4]} />
          <meshStandardMaterial color={C.forest} />
        </mesh>
      </group>
    </Float>
  );
}

function Gift({ position, color, ribbon, rot = 0 }: { position: [number, number, number]; color: string; ribbon: string; rot?: number }) {
  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1}>
      <group position={position} rotation={[0.3, rot, 0.2]}>
        <RoundedBox args={[0.7, 0.6, 0.7]} radius={0.04}>
          <meshStandardMaterial color={color} roughness={0.5} />
        </RoundedBox>
        <mesh>
          <boxGeometry args={[0.72, 0.62, 0.14]} />
          <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.14, 0.62, 0.72]} />
          <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0.36, 0]} rotation={[0, 0, -0.6]}>
          <torusGeometry args={[0.1, 0.035, 8, 20]} />
          <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh position={[-0.1, 0.36, 0]} rotation={[0, 0, 0.6]}>
          <torusGeometry args={[0.1, 0.035, 8, 20]} />
          <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function Parallax({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!g.current) return;
    const scroll = window.scrollY / window.innerHeight;
    g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, scroll * 3, 0.1);
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, state.pointer.x * 0.12, 0.05);
  });
  return <group ref={g}>{children}</group>;
}

export default function HeroScene({ onReady }: { onReady?: () => void }) {
  refreshThemeColors();
  const [visible, setVisible] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: 0.01 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="h-full w-full">
      <Canvas
        {...(onReady ? { onCreated: () => onReady() } : {})}
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.25]}
        camera={{ position: [0, 0.6, 7.5], fov: 38 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={1.1} />
        <hemisphereLight args={[C.cream, C.forest, 0.8]} />
        <directionalLight position={[3, 6, 4]} intensity={2.2} />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={4} position={[0, 5, -6]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} color={C.mint} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={2} color={C.gold} position={[5, 3, 2]} scale={2} />
        </Environment>
        <Cake />
        <Parallax>
          <Balloon position={[-3.6, 1.4, -1]} color={C.jade} scale={0.9} />
          <Balloon position={[-2.7, 2.3, -2.5]} color={C.gold} scale={0.7} speed={1.3} />
          <Balloon position={[3.7, 1.7, -1.2]} color={C.cream} scale={0.85} speed={0.8} />
          <Balloon position={[2.9, 2.6, -3]} color={C.mintDeep} scale={0.65} speed={1.2} />
          <Gift position={[-3.1, -1.2, 0.4]} color={C.forest} ribbon={C.gold} rot={0.5} />
          <Gift position={[3.3, -0.9, 0]} color={C.gold} ribbon={C.cream} rot={-0.4} />
        </Parallax>
        <mesh position={[0, -2.08, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.1, 0.7, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color={C.forest} transparent opacity={0.16} depthWrite={false} />
        </mesh>
      </Canvas>
    </div>
  );
}
