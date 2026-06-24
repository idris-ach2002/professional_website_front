import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "./useReducedMotion";

const additiveBlending = THREE.AdditiveBlending;

const DEFAULT_RGB_TOKENS = {
  aura: "34 211 238",
  shell: "148 163 184",
  orbit: "156 163 175",
  field: "125 211 252",
  center: "8 14 24",
  accent: "45 212 191",
  reflection: "226 232 240",
  particle: "226 232 240",
  glow: "14 165 233",
};

function normalizeRgb(value, fallback) {
  const raw = String(value || fallback).trim();
  const match = raw.match(/\d+(?:\.\d+)?/g);
  if (!match || match.length < 3) return fallback.replace(/\s+/g, ", ");
  return match.slice(0, 3).join(", ");
}

function rgb(value) {
  return `rgb(${value})`;
}

function makeTheme(tokens = DEFAULT_RGB_TOKENS) {
  return {
    aura: rgb(normalizeRgb(tokens.aura, DEFAULT_RGB_TOKENS.aura)),
    shell: rgb(normalizeRgb(tokens.shell, DEFAULT_RGB_TOKENS.shell)),
    orbit: rgb(normalizeRgb(tokens.orbit, DEFAULT_RGB_TOKENS.orbit)),
    field: rgb(normalizeRgb(tokens.field, DEFAULT_RGB_TOKENS.field)),
    center: rgb(normalizeRgb(tokens.center, DEFAULT_RGB_TOKENS.center)),
    accent: rgb(normalizeRgb(tokens.accent, DEFAULT_RGB_TOKENS.accent)),
    reflection: rgb(normalizeRgb(tokens.reflection, DEFAULT_RGB_TOKENS.reflection)),
    particle: rgb(normalizeRgb(tokens.particle, DEFAULT_RGB_TOKENS.particle)),
    glow: rgb(normalizeRgb(tokens.glow, DEFAULT_RGB_TOKENS.glow)),
  };
}

function makeEllipseLine(radiusX, radiusY, z = 0, segments = 240) {
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    const harmonic = Math.sin(angle * 3) * 0.018;
    return new THREE.Vector3(
      Math.cos(angle) * (radiusX + harmonic),
      Math.sin(angle) * (radiusY - harmonic * 0.6),
      z + Math.sin(angle * 2) * 0.015,
    );
  });

  return new THREE.BufferGeometry().setFromPoints(points);
}

function makeMagneticArc(phase, radius = 1.16, bend = 0.42, segments = 112) {
  const points = Array.from({ length: segments }, (_, index) => {
    const p = index / (segments - 1);
    const angle = -Math.PI * 0.82 + p * Math.PI * 1.64;
    const envelope = Math.sin(p * Math.PI);
    const x = Math.cos(angle + phase * 0.08) * radius;
    const y = Math.sin(angle) * radius * 0.42 + Math.sin(p * Math.PI * 2 + phase) * bend * envelope * 0.16;
    const z = Math.cos(p * Math.PI + phase) * 0.12 * envelope;
    return new THREE.Vector3(x, y, z);
  });

  return new THREE.BufferGeometry().setFromPoints(points);
}

function makeTickGeometry(length = 0.11) {
  return new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-length / 2, 0, 0), new THREE.Vector3(length / 2, 0, 0)]);
}

function BlackPearlNucleus({ reducedMotion, theme }) {
  const nucleusRef = useRef(null);
  const glowRef = useRef(null);
  const reflectionRef = useRef(null);
  const shellRef = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (nucleusRef.current && !reducedMotion) {
      nucleusRef.current.rotation.x = 0.36 + Math.sin(t * 0.32) * 0.055;
      nucleusRef.current.rotation.y = t * 0.32;
      nucleusRef.current.rotation.z = -t * 0.13;
    }

    if (shellRef.current && !reducedMotion) {
      shellRef.current.rotation.x = 0.52 + Math.sin(t * 0.24) * 0.11;
      shellRef.current.rotation.y = -t * 0.18;
      shellRef.current.rotation.z = t * 0.1;
    }

    if (reflectionRef.current && !reducedMotion) {
      reflectionRef.current.position.x = -0.145 + Math.sin(t * 0.68) * 0.018;
      reflectionRef.current.position.y = 0.18 + Math.cos(t * 0.52) * 0.012;
      reflectionRef.current.material.opacity = 0.34 + Math.sin(t * 0.86) * 0.035;
    }

    if (glowRef.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 1.1) * 0.035;
      glowRef.current.scale.set(pulse, pulse, pulse);
      glowRef.current.material.opacity = reducedMotion ? 0.08 : 0.07 + Math.sin(t * 1.18) * 0.014;
    }
  });

  return (
    <group>
      <mesh ref={glowRef} scale={[1.72, 1.72, 1.72]}>
        <sphereGeometry args={[0.54, 64, 64]} />
        <meshBasicMaterial color={theme.glow} transparent opacity={0.075} blending={additiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={shellRef}>
        <mesh scale={[0.78, 0.78, 0.78]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial color={theme.shell} wireframe transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh scale={[0.96, 0.62, 0.96]} rotation={[0.74, 0.18, -0.28]}>
          <torusKnotGeometry args={[0.42, 0.0045, 280, 8, 2, 5]} />
          <meshBasicMaterial color={theme.accent} transparent opacity={0.22} blending={additiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      <group ref={nucleusRef}>
        <mesh scale={[0.39, 0.39, 0.39]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color={theme.center} roughness={0.34} metalness={0.62} emissive={theme.center} emissiveIntensity={0.08} />
        </mesh>
        <mesh scale={[0.445, 0.445, 0.445]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial color={theme.aura} wireframe transparent opacity={0.075} blending={additiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      <mesh ref={reflectionRef} position={[-0.15, 0.18, 0.36]} scale={[0.115, 0.034, 0.014]} rotation={[0.08, 0.12, -0.34]}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshBasicMaterial color={theme.reflection} transparent opacity={0.36} blending={additiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh position={[0.19, -0.13, 0.3]} scale={[0.038, 0.014, 0.012]} rotation={[0.1, -0.05, -0.42]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.22} blending={additiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function MagneticFieldLines({ reducedMotion, theme }) {
  const fieldRef = useRef(null);
  const lines = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        key: `black-pearl-field-${index}`,
        geometry: makeMagneticArc((index / 12) * Math.PI * 2, 0.84 + (index % 3) * 0.17, 0.32 + (index % 4) * 0.08),
        rotation: [0.22 + (index % 4) * 0.13, (index - 6) * 0.045, (index / 12) * Math.PI * 2],
        opacity: index % 4 === 0 ? 0.24 : 0.14,
        color: index % 3 === 0 ? theme.accent : theme.field,
      })),
    [theme],
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !fieldRef.current) return;
    const t = clock.getElapsedTime();
    fieldRef.current.rotation.z = -t * 0.08;
    fieldRef.current.rotation.y = Math.sin(t * 0.24) * 0.13;
    fieldRef.current.rotation.x = Math.sin(t * 0.18) * 0.055;
  });

  return (
    <group ref={fieldRef}>
      {lines.map((line) => (
        <line key={line.key} geometry={line.geometry} rotation={line.rotation}>
          <lineBasicMaterial color={line.color} transparent opacity={line.opacity} blending={additiveBlending} depthWrite={false} toneMapped={false} />
        </line>
      ))}
    </group>
  );
}

function EllipticGyroOrbits({ reducedMotion, theme }) {
  const orbitRef = useRef(null);
  const satellitesRef = useRef(null);

  const rings = useMemo(
    () => [
      { key: "pearl-orbit-a", geometry: makeEllipseLine(1.46, 0.46), rotation: [0.15, 0.06, 0.02], color: theme.orbit, opacity: 0.34 },
      { key: "pearl-orbit-b", geometry: makeEllipseLine(1.22, 0.72), rotation: [0.7, 0.2, -0.34], color: theme.field, opacity: 0.22 },
      { key: "pearl-orbit-c", geometry: makeEllipseLine(0.88, 0.88), rotation: [-0.64, 0.36, 0.62], color: theme.shell, opacity: 0.18 },
      { key: "pearl-orbit-d", geometry: makeEllipseLine(1.08, 0.32), rotation: [1.05, -0.15, 0.18], color: theme.accent, opacity: 0.18 },
    ],
    [theme],
  );

  const satellites = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        key: `black-pearl-satellite-${index}`,
        phase: (index / 9) * Math.PI * 2,
        radiusX: 0.62 + (index % 4) * 0.22,
        radiusY: 0.24 + (index % 3) * 0.1,
        speed: 0.24 + (index % 5) * 0.045,
        scale: index % 4 === 0 ? 0.032 : 0.021,
        color: index % 3 === 0 ? theme.reflection : index % 3 === 1 ? theme.accent : theme.particle,
      })),
    [theme],
  );

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();

    if (orbitRef.current) {
      orbitRef.current.rotation.z = t * 0.085;
      orbitRef.current.rotation.y = Math.sin(t * 0.22) * 0.16;
      orbitRef.current.rotation.x = Math.cos(t * 0.18) * 0.065;
    }

    if (satellitesRef.current) {
      satellitesRef.current.children.forEach((child, index) => {
        const satellite = satellites[index];
        const angle = satellite.phase + t * satellite.speed;
        child.position.x = Math.cos(angle) * satellite.radiusX;
        child.position.y = Math.sin(angle) * satellite.radiusY;
        child.position.z = Math.sin(angle * 1.6) * 0.14;
        child.material.opacity = 0.34 + Math.sin(t * 1.1 + satellite.phase) * 0.075;
      });
    }
  });

  return (
    <group>
      <group ref={orbitRef}>
        {rings.map((ring) => (
          <line key={ring.key} geometry={ring.geometry} rotation={ring.rotation}>
            <lineBasicMaterial color={ring.color} transparent opacity={ring.opacity} blending={additiveBlending} depthWrite={false} toneMapped={false} />
          </line>
        ))}
      </group>

      <group ref={satellitesRef}>
        {satellites.map((satellite) => (
          <mesh key={satellite.key} scale={satellite.scale}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshBasicMaterial color={satellite.color} transparent opacity={0.36} blending={additiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CompassMicroTicks({ reducedMotion, theme }) {
  const ticksRef = useRef(null);
  const tickGeometry = useMemo(() => makeTickGeometry(0.1), []);
  const ticks = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => {
        const angle = (index / 44) * Math.PI * 2;
        const major = index % 11 === 0;
        const radius = major ? 1.62 : 1.48;
        return {
          key: `black-pearl-tick-${index}`,
          angle,
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.48, -0.08],
          scale: major ? [1.35, 1, 1] : [0.72, 1, 1],
          opacity: major ? 0.17 : 0.065,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !ticksRef.current) return;
    ticksRef.current.rotation.z = clock.getElapsedTime() * 0.045;
  });

  return (
    <group ref={ticksRef}>
      {ticks.map((tick) => (
        <line key={tick.key} geometry={tickGeometry} position={tick.position} rotation={[0, 0, tick.angle]} scale={tick.scale}>
          <lineBasicMaterial color={theme.shell} transparent opacity={tick.opacity} blending={additiveBlending} depthWrite={false} toneMapped={false} />
        </line>
      ))}
    </group>
  );
}

function SignatureCoreScene({ reducedMotion, theme }) {
  const sceneRef = useRef(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !sceneRef.current) return;
    const t = clock.getElapsedTime();
    sceneRef.current.rotation.z = Math.sin(t * 0.16) * 0.028;
    sceneRef.current.position.y = Math.sin(t * 0.5) * 0.018;
  });

  return (
    <group ref={sceneRef} scale={[1.18, 1.18, 1.18]}>
      <ambientLight intensity={0.72} />
      <pointLight position={[-1.2, 1.2, 2.8]} intensity={1.35} color={theme.reflection} />
      <pointLight position={[1.4, -1.1, 2.2]} intensity={0.34} color={theme.accent} />
      <CompassMicroTicks reducedMotion={reducedMotion} theme={theme} />
      <MagneticFieldLines reducedMotion={reducedMotion} theme={theme} />
      <EllipticGyroOrbits reducedMotion={reducedMotion} theme={theme} />
      <BlackPearlNucleus reducedMotion={reducedMotion} theme={theme} />
    </group>
  );
}

export default function NavSignatureCore() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const [theme, setTheme] = useState(() => makeTheme());

  useEffect(() => {
    if (typeof window === "undefined" || !rootRef.current) return;

    const scope = rootRef.current.closest(".top-nav") || document.documentElement;
    const styles = window.getComputedStyle(scope);
    const readToken = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

    setTheme(
      makeTheme({
        aura: readToken("--nav-core-aura-rgb", DEFAULT_RGB_TOKENS.aura),
        shell: readToken("--nav-core-shell-rgb", DEFAULT_RGB_TOKENS.shell),
        orbit: readToken("--nav-core-orbit-rgb", DEFAULT_RGB_TOKENS.orbit),
        field: readToken("--nav-core-field-rgb", DEFAULT_RGB_TOKENS.field),
        center: readToken("--nav-core-center-rgb", DEFAULT_RGB_TOKENS.center),
        accent: readToken("--nav-core-accent-rgb", DEFAULT_RGB_TOKENS.accent),
        reflection: readToken("--nav-core-reflection-rgb", DEFAULT_RGB_TOKENS.reflection),
        particle: readToken("--nav-core-particle-rgb", DEFAULT_RGB_TOKENS.particle),
        glow: readToken("--nav-core-glow-rgb", DEFAULT_RGB_TOKENS.glow),
      }),
    );
  }, []);

  return (
    <div ref={rootRef} className="nav-signature-core nav-signature-core--magnetic nav-signature-core--black-pearl" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 7], zoom: 42 }}
        dpr={[2.2, 3]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <SignatureCoreScene reducedMotion={reducedMotion} theme={theme} />
      </Canvas>
    </div>
  );
}
