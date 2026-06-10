import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import {
  BallCollider,
  CylinderCollider,
  Physics,
  RigidBody,
} from "@react-three/rapier";
import {
  Suspense,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { gsapReady } from "../../animations/useGsap";

const MODEL_PATH = "/models/ABSTRACT_SHAPES.glb";

const SHAPE_COUNT = 40;
const SPAWN_SPREAD_X = 34;
const SPAWN_SPREAD_Y = 19;
const SPAWN_SPREAD_Z = 16;
const POINTER_RADIUS = 2.35;
const CENTER_PULL_X = 48;
const CENTER_PULL_Y = 145;
const CENTER_PULL_Z = 48;
const CLICK_IMPULSE = 12;

const COLOR_SCHEMES = [
  // Clear water
  ["#ffffff", "#e0f7ff", "#bae6fd", "#38bdf8"],
  // Ice drop
  ["#f8fafc", "#e0f2fe", "#7dd3fc", "#0284c7"],
  // Aqua pearl
  ["#ffffff", "#ccfbf1", "#99f6e4", "#14b8a6"],
  // Blue crystal
  ["#eff6ff", "#dbeafe", "#93c5fd", "#2563eb"],
  // Opal glass
  ["#ffffff", "#f0fdfa", "#a7f3d0", "#22d3ee"],
  // Glacier blue
  ["#e0f7ff", "#bae6fd", "#7dd3fc", "#38bdf8"],
  // Pearl ocean
  ["#f8fafc", "#dbeafe", "#bfdbfe", "#60a5fa"],
  // Aqua glass
  ["#ecfeff", "#cffafe", "#67e8f9", "#22d3ee"],
  // Mint water
  ["#f0fdfa", "#ccfbf1", "#99f6e4", "#2dd4bf"],
  // Ice violet
  ["#f5f3ff", "#ddd6fe", "#c4b5fd", "#8b5cf6"],
  // Soft cyan / blue
  ["#f0f9ff", "#e0f2fe", "#7dd3fc", "#0ea5e9"],
  // White glass / blue edge
  ["#ffffff", "#eff6ff", "#bfdbfe", "#3b82f6"],
  // Opal
  ["#f8fafc", "#e0f2fe", "#bae6fd", "#5eead4"],

    // Ocean luxury
  ["#001219", "#005f73", "#0a9396", "#94d2bd"],
  ["#03045e", "#023e8a", "#0077b6", "#48cae4"],
  ["#001f2d", "#003f5c", "#2f4b7c", "#00b4d8"],
  ["#06283d", "#1363df", "#47b5ff", "#dff6ff"],

  // Deep tech
  ["#020617", "#0f172a", "#1e3a8a", "#38bdf8"],
  ["#111827", "#1f2937", "#334155", "#06b6d4"],
  ["#0b1120", "#172554", "#1d4ed8", "#60a5fa"],
  
  // Abyss / bioluminescent
  ["#00111c", "#003049", "#006466", "#22d3ee"],
  ["#010b13", "#012a36", "#014f5f", "#2dd4bf"],
  ["#020617", "#083344", "#155e75", "#67e8f9"],
  ["#001524", "#15616d", "#00b4d8", "#9bf6ff"],

  // Glassmorphism bleu/violet
  ["#0f172a", "#1e1b4b", "#3730a3", "#7dd3fc"],
  ["#111827", "#312e81", "#4f46e5", "#a5b4fc"],
  ["#020617", "#3b0764", "#6d28d9", "#c084fc"],
  ["#0b1026", "#1d267d", "#5c469c", "#d4adfc"],

  // Emerald ocean
  ["#022c22", "#064e3b", "#047857", "#5eead4"],
  ["#042f2e", "#115e59", "#0f766e", "#99f6e4"],
  ["#062e2e", "#134e4a", "#14b8a6", "#ccfbf1"],
  ["#001c1a", "#005f56", "#00897b", "#80cbc4"],

  // 
];

const MATERIAL_TYPES = [
  { roughness: 1, metalness: 0 },
  { roughness: 0.42, metalness: 0.18 },
  { roughness: 0.08, metalness: 0.02 },
];

const shapeScales = [0.68, 0.78, 0.88, 0.98, 1.08];

const InteractionContext = createContext({ clickTick: 0 });

function createShapeData() {
  return Array.from({ length: SHAPE_COUNT }, (_, index) => {
    const materialIndex = index % MATERIAL_TYPES.length;
    const colorIndex = index % 4;
    const scale = shapeScales[index % shapeScales.length];

    return {
      id: index,
      scale,
      materialIndex,
      colorIndex,
      startPosition: [
        THREE.MathUtils.randFloatSpread(SPAWN_SPREAD_X),
        THREE.MathUtils.randFloatSpread(SPAWN_SPREAD_Y) - 8,
        THREE.MathUtils.randFloatSpread(SPAWN_SPREAD_Z) - 5,
      ],
      rotationSeed: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ],
      spin: 0.18 + (index % 5) * 0.035,
    };
  });
}

const AbstractShapeModel = forwardRef(function AbstractShapeModel(
  { color, roughness, metalness, scale, rotationSeed },
  ref,
) {
  const { scene } = useGLTF(MODEL_PATH);

  const clone = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      clearcoat: 0.82,
      clearcoatRoughness: 0.1,
      reflectivity: 0.72,
      envMapIntensity: 1.15,
    });

    const clonedScene = scene.clone(true);
    clonedScene.traverse((node) => {
      if (!node.isMesh) return;
      node.material = material;
      node.castShadow = true;
      node.receiveShadow = true;
    });

    return clonedScene;
  }, [scene, color, roughness, metalness]);

  return (
    <primitive
      ref={ref}
      object={clone}
      scale={[scale, scale, scale]}
      rotation={rotationSeed}
    />
  );
});

function KineticShape({
  startPosition,
  scale,
  rotationSeed,
  spin,
  materialIndex,
  colorIndex,
  colorScheme,
  active,
}) {
  const bodyRef = useRef(null);
  const modelRef = useRef(null);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const clickVector = useMemo(() => new THREE.Vector3(), []);
  const { clickTick } = useContext(InteractionContext);
  const previousClickTickRef = useRef(clickTick);
  const materialSettings = MATERIAL_TYPES[materialIndex];
  const color = colorScheme[colorIndex];

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || clickTick === previousClickTickRef.current) return;

    previousClickTickRef.current = clickTick;

    const translation = body.translation();
    clickVector
      .set(
        translation.x + THREE.MathUtils.randFloatSpread(0.9),
        translation.y + THREE.MathUtils.randFloatSpread(0.9),
        translation.z + THREE.MathUtils.randFloatSpread(0.25),
      )
      .normalize();

    body.applyImpulse(
      {
        x: clickVector.x * CLICK_IMPULSE * scale,
        y: clickVector.y * CLICK_IMPULSE * scale,
        z: clickVector.z * CLICK_IMPULSE * scale,
      },
      true,
    );
  }, [clickTick, clickVector, scale]);

  useFrame((_state, delta) => {
    const body = bodyRef.current;
    const model = modelRef.current;
    if (!body || !model || !active) return;

    const safeDelta = Math.min(0.1, delta);
    const translation = body.translation();

    // Même logique de regroupement que l’ancienne version gouttes :
    // chaque forme reçoit une impulsion permanente vers le centre.
    const impulse = vec
      .set(translation.x, translation.y, translation.z)
      .normalize()
      .multiply(
        new THREE.Vector3(
          -CENTER_PULL_X * safeDelta * scale,
          -CENTER_PULL_Y * safeDelta * scale,
          -CENTER_PULL_Z * safeDelta * scale,
        ),
      );

    body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);

    if (Math.abs(translation.z) > 0.035) {
      body.applyImpulse({ x: 0, y: 0, z: -translation.z * 0.7 }, true);
    }

    model.rotation.x += safeDelta * spin * 0.8;
    model.rotation.y += safeDelta * spin * 1.15;
    model.rotation.z += safeDelta * spin * 0.52;
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={startPosition}
      linearDamping={0.74}
      angularDamping={0.16}
      friction={0.18}
      restitution={0.68}
      ccd
    >
      <BallCollider args={[scale * 0.92]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.1 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <AbstractShapeModel
        ref={modelRef}
        color={color}
        roughness={materialSettings.roughness}
        metalness={materialSettings.metalness}
        scale={scale}
        rotationSeed={rotationSeed}
      />
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
      <BallCollider args={[POINTER_RADIUS]} />
    </RigidBody>
  );
}

function AbstractSingularityScene({ active, colorSchemeIndex, clickTick }) {
  const shapes = useMemo(() => createShapeData(), []);
  const colorScheme = COLOR_SCHEMES[colorSchemeIndex];

  return (
    <InteractionContext.Provider value={{ clickTick }}>
      <group>
        <Physics gravity={[0, 0, 0]}>
          <Pointer active={active} />
          {shapes.map((shape) => (
            <KineticShape
              key={shape.id}
              {...shape}
              colorScheme={colorScheme}
              active={active}
            />
          ))}
        </Physics>
      </group>

      <ambientLight intensity={0.72} />
      <spotLight
        position={[20, 22, 26]}
        penumbra={0.9}
        angle={0.23}
        color="white"
        intensity={2.75}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-10, 9, 10]} intensity={1.35} color="#ecfeff" />
      <directionalLight position={[8, -4, 7]} intensity={0.7} color="#8ab4ff" />
      <pointLight position={[0, 5, 12]} intensity={1.45} color="#ffffff" />
      <Environment preset="city" environmentIntensity={0.64} />
    </InteractionContext.Provider>
  );
}

export default function BeachBallField() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const [active, setActive] = useState(false);
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  const [clickTick, setClickTick] = useState(0);

  const shiftPalette = useCallback(() => {
    setColorSchemeIndex((previous) => (previous + 1) % COLOR_SCHEMES.length);
    setClickTick((previous) => previous + 1);
  }, []);

  const handleStageKeyDown = useCallback((event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      shiftPalette();
    }
  }, [shiftPalette]);

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
          { y: 56, autoAlpha: 0, scale: 0.985 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 1.05,
            ease: "expo.out",
            force3D: true,
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
    <section
      ref={rootRef}
      id="kinetic-field"
      className="beach-3d-section"
      aria-label="Animation 3D interactive"
    >
      <div
        ref={stageRef}
        className="beach-3d-stage"
        role="button"
        tabIndex={0}
        aria-label="Changer la palette des formes 3D"
        onPointerDownCapture={shiftPalette}
        onKeyDown={handleStageKeyDown}
      >
        <Canvas
          shadows
          dpr={[1, 1.55]}
          gl={{
            alpha: true,
            antialias: true,
            stencil: false,
            depth: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 22], fov: 34, near: 0.5, far: 100 }}
          className="beach-3d-canvas"
        >
          <Suspense fallback={null}>
            <AbstractSingularityScene
              active={active}
              colorSchemeIndex={colorSchemeIndex}
              clickTick={clickTick}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}

useGLTF.preload(MODEL_PATH);