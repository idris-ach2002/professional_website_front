import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "./useReducedMotion";

const additiveBlending = THREE.AdditiveBlending;

const plateVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const plateFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uReducedMotion;

  float line(float value, float width) {
    return smoothstep(width, 0.0, abs(value));
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    float t = uReducedMotion > 0.5 ? 0.0 : uTime;

    float n1 = noise(vec2(uv.x * 3.0 + t * 0.04, uv.y * 6.0 - t * 0.02));
    float n2 = noise(vec2(uv.x * 9.0 - t * 0.06, uv.y * 3.0 + t * 0.035));
    float drift = (n1 - 0.5) * 0.12 + (n2 - 0.5) * 0.04;

    float filamentA = line(sin((uv.x + drift) * 16.0 + uv.y * 4.2 + t * 0.58), 0.045);
    float filamentB = line(sin((uv.x * 0.8 - uv.y * 1.4) * 18.0 - t * 0.46), 0.034);
    float scanner = line(uv.x - fract(t * 0.055), 0.022);
    float upperGlow = smoothstep(0.92, 0.08, abs(uv.y - 0.5));
    float centerGlass = smoothstep(1.0, 0.0, distance(uv, vec2(0.58, 0.52)) * 1.2);
    float leftCool = smoothstep(0.72, 0.0, distance(uv, vec2(0.2, 0.5)));

    vec3 slate = vec3(0.34, 0.45, 0.55);
    vec3 blueGrey = vec3(0.46, 0.62, 0.72);
    vec3 cyanMist = vec3(0.66, 0.9, 0.96);
    vec3 color = mix(slate, blueGrey, uv.x * 0.72 + 0.18);
    color = mix(color, cyanMist, 0.18 * centerGlass + 0.13 * leftCool);
    color += vec3(0.58, 0.86, 0.94) * filamentA * 0.18;
    color += vec3(0.86, 0.97, 1.0) * filamentB * 0.1;
    color += vec3(0.9, 0.98, 1.0) * scanner * 0.22;

    float alpha = 0.72 * upperGlow + 0.16 * centerGlass + 0.08 * filamentA + 0.1 * scanner;
    alpha = clamp(alpha, 0.38, 0.9);
    gl_FragColor = vec4(color, alpha);
  }
`;

function makeSegmentGeometry(pairs) {
  const points = [];
  pairs.forEach(([start, end]) => {
    points.push(new THREE.Vector3(...start), new THREE.Vector3(...end));
  });
  return new THREE.BufferGeometry().setFromPoints(points);
}

function WebGLGlassPlate({ reducedMotion }) {
  const materialRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReducedMotion: { value: reducedMotion ? 1 : 0 },
    }),
    [reducedMotion],
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
  });

  return (
    <mesh position={[0, 0, -0.18]}>
      <planeGeometry args={[17.2, 3, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={plateVertexShader}
        fragmentShader={plateFragmentShader}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

function BlueprintLines({ reducedMotion }) {
  const groupRef = useRef(null);
  const geometry = useMemo(() => {
    const rows = [-1, -0.5, 0, 0.5, 1];
    const columns = [-7.6, -6.0, -4.4, -2.8, -1.2, 0.4, 2.0, 3.6, 5.2, 6.8];
    const pairs = [
      ...rows.map((y) => [[-8.0, y, 0], [8.0, y, 0]]),
      ...columns.map((x) => [[x, -1.2, 0], [x, 1.2, 0]]),
      [[-7.4, -0.78, 0.02], [-5.7, 0.88, 0.02]],
      [[-3.8, 0.86, 0.02], [-2.2, -0.7, 0.02]],
      [[0.9, -0.9, 0.02], [2.6, 0.82, 0.02]],
      [[4.0, 0.82, 0.02], [6.6, -0.82, 0.02]],
    ];

    return makeSegmentGeometry(pairs);
  }, []);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.x = Math.sin(t * 0.16) * 0.06;
    groupRef.current.position.y = Math.sin(t * 0.11) * 0.022;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#dbeafe" transparent opacity={0.14} blending={additiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function SignalDust({ reducedMotion }) {
  const dustRef = useRef(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => ({
        key: `nav-dust-${index}`,
        x: -7.7 + ((index * 0.83) % 15.4),
        y: -0.92 + ((index * 0.37) % 1.84),
        scale: index % 6 === 0 ? 0.034 : 0.022,
        speed: 0.003 + (index % 7) * 0.0012,
        phase: index * 0.63,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !dustRef.current) return;
    const t = clock.getElapsedTime();
    dustRef.current.children.forEach((child, index) => {
      const particle = particles[index];
      child.position.x += particle.speed;
      if (child.position.x > 7.8) child.position.x = -7.8;
      child.position.y = particle.y + Math.sin(t * 1.1 + particle.phase) * 0.026;
      child.material.opacity = 0.12 + Math.sin(t * 1.3 + particle.phase) * 0.05;
    });
  });

  return (
    <group ref={dustRef}>
      {particles.map((particle) => (
        <mesh key={particle.key} position={[particle.x, particle.y, 0.12]} scale={particle.scale}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color="#eff6ff" transparent opacity={0.14} blending={additiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function BackgroundScene({ reducedMotion }) {
  return (
    <group>
      <WebGLGlassPlate reducedMotion={reducedMotion} />
      <BlueprintLines reducedMotion={reducedMotion} />
      <SignalDust reducedMotion={reducedMotion} />
    </group>
  );
}

export default function NavHologramLayer() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="nav-hologram-layer nav-hologram-layer--blueprint" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 8], zoom: 54 }}
        dpr={[1.2, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <BackgroundScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
