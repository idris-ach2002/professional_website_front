import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGsap } from "../../animations/useGsap";

const DROP_COUNT = 64;

function getResponsiveDropCount(width) {
  if (width < 520) return 28;
  if (width < 860) return 40;
  if (width < 1180) return 52;
  return DROP_COUNT;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function pseudoRandom(index, seed = 1) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createWaterDropTexture() {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const body = ctx.createRadialGradient(210, 160, 24, 390, 410, 520);
  body.addColorStop(0, "rgba(244,255,255,1)");
  body.addColorStop(0.12, "rgba(158,236,255,0.96)");
  body.addColorStop(0.34, "rgba(28,177,220,0.9)");
  body.addColorStop(0.62, "rgba(7,116,164,0.88)");
  body.addColorStop(0.86, "rgba(4,64,111,0.9)");
  body.addColorStop(1, "rgba(2,28,60,0.96)");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rim = ctx.createRadialGradient(384, 384, 190, 384, 384, 380);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.56, "rgba(255,255,255,0.05)");
  rim.addColorStop(0.76, "rgba(126,225,255,0.26)");
  rim.addColorStop(0.91, "rgba(236,252,255,0.76)");
  rim.addColorStop(1, "rgba(6,34,80,0.96)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  const glow = ctx.createRadialGradient(190, 140, 8, 190, 140, 150);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.24, "rgba(255,255,255,0.88)");
  glow.addColorStop(0.54, "rgba(211,249,255,0.32)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(190, 140, 132, 68, -0.58, 0, Math.PI * 2);
  ctx.fill();

  const tinyGlow = ctx.createRadialGradient(438, 254, 6, 438, 254, 70);
  tinyGlow.addColorStop(0, "rgba(255,255,255,0.86)");
  tinyGlow.addColorStop(0.4, "rgba(255,255,255,0.28)");
  tinyGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = tinyGlow;
  ctx.beginPath();
  ctx.ellipse(438, 254, 58, 28, 0.75, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 10;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
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
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function createDropSpecs(count = DROP_COUNT) {
  return Array.from({ length: count }, (_, index) => {
    const xSeed = pseudoRandom(index, 1);
    const ySeed = pseudoRandom(index, 2);
    const zSeed = pseudoRandom(index, 3);
    const sizeSeed = pseudoRandom(index, 4);
    const driftSeed = pseudoRandom(index, 5);
    const phaseSeed = pseudoRandom(index, 6);

    return {
      id: index,
      anchorX: -0.43 + xSeed * 0.86,
      anchorY: -0.34 + ySeed * 0.68,
      anchorZ: -5.8 + zSeed * 10.8,
      size: 0.16 + sizeSeed * 0.54,
      scrollDriftX: (driftSeed - 0.5) * 0.34,
      scrollDriftY: (pseudoRandom(index, 7) - 0.5) * 0.24,
      idleX: 0.018 + pseudoRandom(index, 8) * 0.038,
      idleY: 0.014 + pseudoRandom(index, 9) * 0.032,
      idleZ: 0.28 + pseudoRandom(index, 10) * 0.52,
      speed: 0.34 + pseudoRandom(index, 11) * 0.46,
      phase: phaseSeed * Math.PI * 2,
      twist: -0.28 + pseudoRandom(index, 12) * 0.56,
      depth: 0.35 + zSeed * 0.65,
    };
  });
}

function disposeScene(scene, renderer, geometries, materials, textures) {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose?.();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose?.());
      } else {
        object.material.dispose?.();
      }
    }
  });

  geometries.forEach((geometry) => geometry.dispose?.());
  materials.forEach((material) => material.dispose?.());
  textures.forEach((texture) => texture?.dispose?.());
  renderer.dispose();
}

export default function OceanBubbleField({ compact = false, fullBleed = true }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const drops = useMemo(() => createDropSpecs(DROP_COUNT), []);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    if (!root || !ScrollTrigger) return undefined;

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.9,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
      onLeaveBack: () => {
        progressRef.current = 0;
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia?.("(max-width: 680px)").matches;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isMobile ? 1.08 : 1.32),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 95);
    camera.position.set(0, 0, 19.4);

    const group = new THREE.Group();
    scene.add(group);

    const waterDropTexture = createWaterDropTexture();
    const waterDropBumpTexture = createWaterDropBumpTexture();

    const ambient = new THREE.AmbientLight(0xe8fbff, 0.96);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(-5, 7, 8);
    const rimLight = new THREE.PointLight(0x9eeeff, 9, 46);
    rimLight.position.set(4, -3, 8);
    const deepLight = new THREE.PointLight(0x0ea5e9, 3.2, 42);
    deepLight.position.set(-6, -4, 5);
    scene.add(ambient, keyLight, rimLight, deepLight);

    const shellGeometry = new THREE.SphereGeometry(
      1,
      isMobile ? 24 : 38,
      isMobile ? 14 : 20,
    );
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      map: waterDropTexture ?? undefined,
      bumpMap: waterDropBumpTexture ?? undefined,
      bumpScale: 0.07,
      color: 0x0b7fa6,
      emissive: 0x023b63,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.84,
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transmission: 0.22,
      thickness: 1.4,
      ior: 1.32,
      reflectivity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.015,
    });

    const innerGeometry = new THREE.SphereGeometry(
      0.92,
      isMobile ? 18 : 28,
      isMobile ? 10 : 14,
    );
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x06466f,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      depthTest: true,
    });

    const highlightGeometry = new THREE.SphereGeometry(1, 12, 8);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const shellMesh = new THREE.InstancedMesh(shellGeometry, shellMaterial, drops.length);
    const innerMesh = new THREE.InstancedMesh(innerGeometry, innerMaterial, drops.length);
    const highlightMesh = new THREE.InstancedMesh(
      highlightGeometry,
      highlightMaterial,
      drops.length,
    );

    shellMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    innerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    highlightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    drops.forEach((drop, index) => {
      const color = new THREE.Color().setHSL(0.53, 0.82, 0.64 - drop.depth * 0.12);
      shellMesh.setColorAt(index, color);
    });
    if (shellMesh.instanceColor) shellMesh.instanceColor.needsUpdate = true;

    group.add(shellMesh, innerMesh, highlightMesh);

    const dummy = new THREE.Object3D();
    const innerDummy = new THREE.Object3D();
    const highlightDummy = new THREE.Object3D();
    const clock = new THREE.Clock();
    const viewport = { width: 1, height: 1, pixelWidth: 1, pixelHeight: 1 };
    let animationId = 0;
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(
        320,
        Math.floor(rect.width || root.clientWidth || window.innerWidth),
      );
      const height = Math.max(
        420,
        Math.floor(rect.height || root.clientHeight || window.innerHeight),
      );

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const visibleHeight =
        2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) *
        Math.abs(camera.position.z);

      viewport.height = visibleHeight;
      viewport.width = visibleHeight * camera.aspect;
      viewport.pixelWidth = width;
      viewport.pixelHeight = height;
    };

    const render = () => {
      if (disposed) return;

      const elapsed = clock.getElapsedTime();
      let progress = prefersReducedMotion ? 0.5 : progressRef.current;

      if (!prefersReducedMotion) {
        const rect = root.getBoundingClientRect();
        const fallbackProgress = clamp(
          (window.innerHeight - rect.top) / (window.innerHeight + rect.height),
        );
        progress = Math.max(progress, fallbackProgress);
      }

      const scroll = smoothstep(0, 1, progress);
      const responsiveCount = getResponsiveDropCount(viewport.pixelWidth);
      const safeX = viewport.width * 0.43;
      const safeY = viewport.height * 0.34;

      camera.position.y = THREE.MathUtils.lerp(0.14, -0.16, scroll);
      camera.position.z = THREE.MathUtils.lerp(19.8, 18.8, scroll);
      camera.lookAt(0, THREE.MathUtils.lerp(0.08, -0.08, scroll), 0);

      group.rotation.x = Math.sin(scroll * Math.PI * 2) * 0.025;
      group.rotation.y = Math.sin(scroll * Math.PI * 1.4) * 0.04;

      drops.forEach((drop, index) => {
        const enabled = index < responsiveCount;
        const scrollPhase = scroll * Math.PI * 2 + drop.phase;
        const idlePhase = elapsed * drop.speed + drop.phase;
        const scalePulse = 0.92 + Math.sin(idlePhase * 0.78) * 0.08;
        const currentScale = enabled ? drop.size * scalePulse : 0.0001;
        const margin = currentScale * 1.7;

        const scrollX =
          Math.sin(scrollPhase) * viewport.width * 0.085 +
          drop.scrollDriftX * viewport.width * (scroll - 0.5);
        const scrollY =
          Math.cos(scrollPhase * 0.82) * viewport.height * 0.075 +
          drop.scrollDriftY * viewport.height * Math.sin(scroll * Math.PI);
        const idleX = Math.sin(idlePhase) * drop.idleX * viewport.width;
        const idleY = Math.cos(idlePhase * 0.86) * drop.idleY * viewport.height;

        const x = THREE.MathUtils.clamp(
          drop.anchorX * viewport.width + scrollX + idleX,
          -safeX + margin,
          safeX - margin,
        );
        const y = THREE.MathUtils.clamp(
          drop.anchorY * viewport.height + scrollY + idleY,
          -safeY + margin,
          safeY - margin,
        );
        const z =
          drop.anchorZ +
          Math.sin(scrollPhase * 0.62) * 0.62 +
          Math.sin(idlePhase * 0.34) * drop.idleZ;

        dummy.position.set(x, y, z);
        dummy.rotation.set(
          drop.twist + scroll * 0.44 + elapsed * 0.014,
          drop.phase * 0.05 + scroll * 0.62 + elapsed * 0.016,
          drop.twist * 0.6 + Math.sin(scrollPhase) * 0.16,
        );
        dummy.scale.setScalar(currentScale);
        dummy.updateMatrix();
        shellMesh.setMatrixAt(index, dummy.matrix);

        innerDummy.position.set(x, y, z);
        innerDummy.rotation.copy(dummy.rotation);
        innerDummy.scale.setScalar(currentScale * 0.93);
        innerDummy.updateMatrix();
        innerMesh.setMatrixAt(index, innerDummy.matrix);

        highlightDummy.position.set(
          x - currentScale * 0.34,
          y + currentScale * 0.34,
          z + currentScale * 0.6,
        );
        highlightDummy.rotation.set(0, 0, -0.55);
        highlightDummy.scale.set(
          currentScale * 0.2,
          currentScale * 0.1,
          currentScale * 0.042,
        );
        highlightDummy.updateMatrix();
        highlightMesh.setMatrixAt(index, highlightDummy.matrix);
      });

      shellMesh.instanceMatrix.needsUpdate = true;
      innerMesh.instanceMatrix.needsUpdate = true;
      highlightMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resizeObserver.observe(canvas);
    resize();
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      disposeScene(
        scene,
        renderer,
        [shellGeometry, innerGeometry, highlightGeometry],
        [shellMaterial, innerMaterial, highlightMaterial],
        [waterDropTexture, waterDropBumpTexture],
      );
    };
  }, [drops]);

  return (
    <section
      ref={rootRef}
      id="bubble-transition"
      className={[
        "ocean-bubble-field",
        "ocean-bubble-field-3d",
        "ocean-drop-field",
        fullBleed ? "ocean-bubble-fullbleed" : "",
        compact ? "is-compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Transition fluide vers les projets"
    >
      <div className="ocean-bubble-stage ocean-bubble-stage-3d ocean-drop-stage">
        <canvas
          ref={canvasRef}
          className="ocean-bubble-canvas ocean-bubble-canvas-3d ocean-drop-canvas"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
