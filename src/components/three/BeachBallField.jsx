import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  BallCollider,
  CylinderCollider,
  Physics,
  RigidBody,
} from "@react-three/rapier";
import { gsapReady } from "../../animations/useGsap";

const BALL_COUNT = 34;
const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);
const highlightGeometry = new THREE.SphereGeometry(1, 24, 24);

function createWaterDropTexture() {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Corps plus sombre pour que les gouttes restent lisibles sur le fond clair.
  const body = ctx.createRadialGradient(210, 160, 24, 390, 410, 520);
  body.addColorStop(0, "rgba(244,255,255,1)");
  body.addColorStop(0.12, "rgba(158,236,255,0.96)");
  body.addColorStop(0.34, "rgba(28,177,220,0.9)");
  body.addColorStop(0.62, "rgba(7,116,164,0.88)");
  body.addColorStop(0.86, "rgba(4,64,111,0.9)");
  body.addColorStop(1, "rgba(2,28,60,0.96)");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bord externe contrasté : effet lentille / goutte d'eau.
  const rim = ctx.createRadialGradient(384, 384, 190, 384, 384, 380);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.56, "rgba(255,255,255,0.05)");
  rim.addColorStop(0.76, "rgba(126,225,255,0.26)");
  rim.addColorStop(0.91, "rgba(236,252,255,0.76)");
  rim.addColorStop(1, "rgba(6,34,80,0.96)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Caustiques : lignes liquides visibles, mais pas cartoon.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 13; i += 1) {
    const y = 160 + i * 42;
    const alpha = 0.16 + (i % 3) * 0.045;
    ctx.strokeStyle = `rgba(214,250,255,${alpha})`;
    ctx.lineWidth = i % 2 === 0 ? 3.2 : 1.8;
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.bezierCurveTo(190, y - 76, 310, y + 86, 460, y - 20);
    ctx.bezierCurveTo(570, y - 88, 660, y + 28, 720, y - 38);
    ctx.stroke();
  }
  ctx.restore();

  // Nervures verticales légèrement courbes pour renforcer la texture eau.
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  for (let i = 0; i < 10; i += 1) {
    const x = 110 + i * 66;
    ctx.strokeStyle = `rgba(255,255,255,${0.16 + (i % 2) * 0.06})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, 90);
    ctx.bezierCurveTo(x - 38, 250, x + 46, 390, x - 12, 680);
    ctx.stroke();
  }
  ctx.restore();

  // Reflet principal en haut-gauche.
  const glow = ctx.createRadialGradient(190, 140, 8, 190, 140, 150);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.24, "rgba(255,255,255,0.88)");
  glow.addColorStop(0.54, "rgba(211,249,255,0.32)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(190, 140, 132, 68, -0.58, 0, Math.PI * 2);
  ctx.fill();

  // Petit reflet secondaire.
  const tinyGlow = ctx.createRadialGradient(438, 254, 6, 438, 254, 70);
  tinyGlow.addColorStop(0, "rgba(255,255,255,0.86)");
  tinyGlow.addColorStop(0.4, "rgba(255,255,255,0.28)");
  tinyGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = tinyGlow;
  ctx.beginPath();
  ctx.ellipse(438, 254, 58, 28, 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Micro-bulles discrètes pour donner une texture liquide.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const bubbles = [
    [530, 180, 9, 0.34], [585, 250, 5, 0.25], [500, 336, 7, 0.22],
    [630, 410, 11, 0.2], [210, 420, 6, 0.18], [300, 565, 8, 0.2],
    [150, 315, 4, 0.18], [445, 610, 5, 0.2], [610, 585, 7, 0.18],
  ];
  bubbles.forEach(([x, y, radius, alpha]) => {
    ctx.strokeStyle = `rgba(236,253,255,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 12;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

function createWaterDropBumpTexture() {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 18; i += 1) {
    const y = 36 + i * 27;
    ctx.strokeStyle = i % 2 === 0 ? "rgb(178,178,178)" : "rgb(92,92,92)";
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.4;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.bezierCurveTo(120, y - 55, 210, y + 50, 322, y - 10);
    ctx.bezierCurveTo(405, y - 50, 455, y + 32, 500, y - 24);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

const ballScales = [0.58, 0.7, 0.82, 0.94, 1.06, 1.18];
const balls = Array.from({ length: BALL_COUNT }, (_, index) => ({
  id: index,
  scale: ballScales[index % ballScales.length],
}));

function WaterDropBall({ scale, material, innerWaterMaterial, highlightMaterial, active, r = THREE.MathUtils.randFloatSpread }) {
  const bodyRef = useRef(null);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const startPosition = useMemo(
    () => [r(26), r(14) - 8, r(14) - 5],
    [r],
  );

  useFrame((_state, delta) => {
    const body = bodyRef.current;
    if (!body || !active) return;

    const safeDelta = Math.min(0.1, delta);
    const translation = body.translation();

    const impulse = vec
      .set(translation.x, translation.y, translation.z)
      .normalize()
      .multiply(
        new THREE.Vector3(
          -50 * safeDelta * scale,
          -150 * safeDelta * scale,
          -50 * safeDelta * scale,
        ),
      );

    body.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={startPosition}
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      restitution={0.64}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <group scale={scale} rotation={[0.3, 1, 1]}>
        <mesh
          castShadow
          receiveShadow
          geometry={sphereGeometry}
          material={material}
        />
        <mesh
          scale={0.94}
          geometry={sphereGeometry}
          material={innerWaterMaterial}
        />
        <mesh
          position={[-0.34, 0.34, 0.72]}
          scale={[0.2, 0.105, 0.045]}
          geometry={highlightGeometry}
          material={highlightMaterial}
        />
      </group>
    </RigidBody>
  );
}

function Pointer({ active }) {
  const bodyRef = useRef(null);
  const vec = useMemo(() => new THREE.Vector3(100, 100, 100), []);

  useFrame(({ pointer, viewport }) => {
    const body = bodyRef.current;
    if (!body) return;

    if (!active) {
      body.setNextKinematicTranslation({ x: 100, y: 100, z: 100 });
      return;
    }

    const target = vec.lerp(
      new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0,
      ),
      0.22,
    );

    body.setNextKinematicTranslation({ x: target.x, y: target.y, z: target.z });
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
    >
      <BallCollider args={[2.35]} />
    </RigidBody>
  );
}

function BallScene({ active }) {
  const waterDropTexture = useMemo(() => createWaterDropTexture(), []);
  const waterDropBumpTexture = useMemo(() => createWaterDropBumpTexture(), []);

  const waterDropMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: waterDropTexture ?? undefined,
        bumpMap: waterDropBumpTexture ?? undefined,
        bumpScale: 0.085,
        color: new THREE.Color("#0b7fa6"),
        emissive: new THREE.Color("#023b63"),
        emissiveIntensity: 0.12,
        roughness: 0.045,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.035,
        transmission: 0.28,
        thickness: 2.25,
        ior: 1.34,
        reflectivity: 1,
        transparent: true,
        opacity: 0.91,
        depthWrite: true,
        sheen: 0.36,
        sheenColor: new THREE.Color("#b9f6ff"),
        sheenRoughness: 0.2,
      }),
    [waterDropTexture, waterDropBumpTexture],
  );

  const innerWaterMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#06466f"),
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    [],
  );

  const highlightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.92} />
      <spotLight
        position={[20, 20, 25]}
        penumbra={1}
        angle={0.22}
        color="white"
        intensity={2.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-8, 8, 8]} intensity={1.15} />
      <pointLight position={[0, 5, 10]} intensity={1.65} color="#d7fbff" />
      <pointLight position={[-10, -3, 8]} intensity={1.05} color="#8eeaff" />

      <Physics gravity={[0, 0, 0]} interpolate timeStep="vary">
        <Pointer active={active} />
        {balls.map((ball) => (
          <WaterDropBall
            key={ball.id}
            scale={ball.scale}
            material={waterDropMaterial}
            innerWaterMaterial={innerWaterMaterial}
            highlightMaterial={highlightMaterial}
            active={active}
          />
        ))}
      </Physics>

      <Environment preset="city" environmentIntensity={0.35} />
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <N8AO color="#03243a" aoRadius={2.2} intensity={1.05} />
      </EffectComposer>
    </>
  );
}

export default function BeachBallField() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.12 },
    );

    observer.observe(rootRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    gsapReady().then((runtime) => {
      if (disposed || !runtime?.gsap || !rootRef.current || !stageRef.current) return;

      const { gsap, ScrollTrigger } = runtime;
      if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        gsap.fromTo(
          stageRef.current,
          { y: 60, autoAlpha: 0, scale: 0.98 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 1.05,
            ease: "expo.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 78%",
            },
          },
        );
      }, rootRef.current);

      cleanup = () => context.revert();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <section ref={rootRef} id="kinetic-field" className="beach-3d-section" aria-label="Animation 3D interactive">
      <div ref={stageRef} className="beach-3d-stage">
        <Canvas
          shadows
          dpr={[1, 1.65]}
          gl={{ alpha: true, antialias: true, stencil: false, depth: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 22], fov: 34, near: 0.5, far: 100 }}
          className="beach-3d-canvas"
        >
          <Suspense fallback={null}>
            <BallScene active={active} />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}
