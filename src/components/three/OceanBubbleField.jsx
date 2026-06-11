import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGsap } from "../../animations/useGsap";

const BUBBLE_COUNT = 60;

function getResponsiveBubbleCount(width) {
  if (width < 520) return 30;
  if (width < 860) return 40;
  if (width < 1180) return 50;
  return BUBBLE_COUNT;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - clamp(value), 3);
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * clamp(value)) - 1) / 2;
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
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

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const microBubbles = [
    [530, 180, 9, 0.34], [585, 250, 5, 0.25], [500, 336, 7, 0.22],
    [630, 410, 11, 0.2], [210, 420, 6, 0.18], [300, 565, 8, 0.2],
    [150, 315, 4, 0.18], [445, 610, 5, 0.2], [610, 585, 7, 0.18],
  ];
  microBubbles.forEach(([x, y, radius, alpha]) => {
    ctx.strokeStyle = `rgba(236,253,255,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 10;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
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
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function pseudoRandom(index, seed = 1) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createBubbleSpecs(count = BUBBLE_COUNT) {
  return Array.from({ length: count }, (_, index) => {
    const spread = pseudoRandom(index, 1);
    const driftSeed = pseudoRandom(index, 2);
    const depthSeed = pseudoRandom(index, 3);
    const travelSeed = pseudoRandom(index, 4);
    const arcSeed = pseudoRandom(index, 5);
    const sizeSeed = pseudoRandom(index, 6);
    const rowSeed = pseudoRandom(index, 7);
    const startSeed = pseudoRandom(index, 8);

    return {
      id: index,
      startX: -1.24 + spread * 2.48,
      // Valeurs normalisées : la position réelle est recalculée à chaque resize
      // à partir du viewport WebGL, donc pas de coordonnées figées en pixels.
      startBand: startSeed,
      endBand: pseudoRandom(index, 9),
      z: -9.4 + depthSeed * 15.2,
      size: 0.18 + sizeSeed * 0.72,
      release: rowSeed * 0.3,
      travel: 0.58 + travelSeed * 0.24,
      drift: (driftSeed - 0.5) * 3.25,
      arc: (arcSeed - 0.5) * 3.9,
      phase: index * 0.63,
      depth: 0.36 + depthSeed * 0.84,
      startScale: 1.24 + pseudoRandom(index, 10) * 0.62,
      endScale: 0.14 + pseudoRandom(index, 11) * 0.12,
      wobble: 0.08 + pseudoRandom(index, 12) * 0.2,
      idleSpeed: 0.32 + pseudoRandom(index, 13) * 0.48,
      idleLift: 0.014 + pseudoRandom(index, 14) * 0.032,
    };
  });
}

function disposeScene(scene, renderer, geometries, materials, textures) {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose?.();
    if (object.material) {
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
      else object.material.dispose?.();
    }
  });

  geometries.forEach((geometry) => geometry.dispose?.());
  materials.forEach((material) => material.dispose?.());
  textures.forEach((texture) => texture?.dispose?.());
  renderer.dispose();
}

export default function OceanBubbleField({ compact = false }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const bubbles = useMemo(() => createBubbleSpecs(BUBBLE_COUNT), []);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    if (!root || !ScrollTrigger) return undefined;

    gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top 110%",
        end: "bottom -10%",
        scrub: 1.05,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
        onLeaveBack: () => {
          progressRef.current = 0;
        },
      },
    });

    return undefined;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia?.("(max-width: 680px)").matches;
    const activeBubbles = bubbles;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.12 : 1.38));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 95);
    camera.position.set(0, 0.42, 19.2);

    const group = new THREE.Group();
    scene.add(group);

    const waterDropTexture = createWaterDropTexture();
    const waterDropBumpTexture = createWaterDropBumpTexture();

    const ambient = new THREE.AmbientLight(0xe8fbff, 0.92);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.64);
    keyLight.position.set(-5, 7, 8);
    const rimLight = new THREE.PointLight(0x9eeeff, 12, 48);
    rimLight.position.set(4, -3, 8);
    const deepLight = new THREE.PointLight(0x0ea5e9, 4.2, 44);
    deepLight.position.set(-6, -4, 5);
    scene.add(ambient, keyLight, rimLight, deepLight);

    const shellGeometry = new THREE.SphereGeometry(1, isMobile ? 26 : 42, isMobile ? 14 : 22);
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      map: waterDropTexture ?? undefined,
      bumpMap: waterDropBumpTexture ?? undefined,
      bumpScale: 0.075,
      color: 0x0b7fa6,
      emissive: 0x023b63,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.86,
      roughness: 0.045,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      transmission: 0.24,
      thickness: 1.6,
      ior: 1.32,
      reflectivity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.015,
    });

    const innerGeometry = new THREE.SphereGeometry(0.93, isMobile ? 20 : 30, isMobile ? 10 : 16);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x06466f,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      depthTest: true,
    });

    const highlightGeometry = new THREE.SphereGeometry(1, 12, 8);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const shellMesh = new THREE.InstancedMesh(shellGeometry, shellMaterial, activeBubbles.length);
    const innerMesh = new THREE.InstancedMesh(innerGeometry, innerMaterial, activeBubbles.length);
    const highlightMesh = new THREE.InstancedMesh(highlightGeometry, highlightMaterial, activeBubbles.length);

    shellMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    innerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    highlightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    activeBubbles.forEach((bubble, index) => {
      const color = new THREE.Color().setHSL(0.53, 0.86, 0.62 - bubble.depth * 0.12);
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
      const width = Math.max(320, Math.floor(rect.width || root.clientWidth || window.innerWidth));
      const height = Math.max(460, Math.floor(rect.height || root.clientHeight || window.innerHeight));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * Math.abs(camera.position.z);
      viewport.height = visibleHeight;
      viewport.width = visibleHeight * camera.aspect;
      viewport.pixelWidth = width;
      viewport.pixelHeight = height;
    };

    const render = () => {
      if (disposed) return;

      const elapsed = clock.getElapsedTime();
      let progress = prefersReducedMotion ? 0.72 : progressRef.current;

      // Fallback permanent et responsive : si ScrollTrigger tarde ou si le layout
      // change de hauteur, la position réelle de la section garde les bulles visibles.
      if (!prefersReducedMotion) {
        const rect = root.getBoundingClientRect();
        const fallbackProgress = clamp(
          (window.innerHeight * 1.08 - rect.top) / (window.innerHeight * 0.96 + rect.height),
        );
        progress = Math.max(progress, fallbackProgress * 0.98);
      }

      const reveal = easeInOutSine(progress);
      const front = progress * 1.24 + 0.16;
      const responsiveCount = getResponsiveBubbleCount(viewport.pixelWidth);
      const lowerStart = viewport.pixelWidth < 680 ? 0.7 : 0.76;
      const lowerSpread = viewport.pixelWidth < 680 ? 0.2 : 0.3;

      // Opacité volontairement fixe : la profondeur est donnée uniquement par
      // la taille et le mouvement, pas par un fade qui rendait les bulles invisibles.
      shellMaterial.opacity = 0.86;
      innerMaterial.opacity = 0.22;
      highlightMaterial.opacity = 0.8;

      camera.position.y = THREE.MathUtils.lerp(0.66, -0.74, reveal);
      camera.position.z = THREE.MathUtils.lerp(21.8, 15.8, reveal);
      camera.lookAt(0, THREE.MathUtils.lerp(0.12, -0.74, reveal), 0);

      group.rotation.x = THREE.MathUtils.lerp(-0.038, 0.042, reveal);
      group.rotation.y = THREE.MathUtils.lerp(-0.02, 0.034, reveal);

      activeBubbles.forEach((bubble, index) => {
        const enabled = index < responsiveCount;
        const local = clamp((front - bubble.release) / bubble.travel);
        const rise = easeOutCubic(local);
        const baseX = bubble.startX * viewport.width * 0.6;
        const startY = -viewport.height * (lowerStart + bubble.startBand * lowerSpread);
        const endY = viewport.height * (0.34 + bubble.endBand * 0.24);

        const arcOffset = Math.sin(rise * Math.PI) * bubble.arc * viewport.width * 0.18;
        const diagonalOffset = bubble.drift * rise * viewport.width * 0.24;
        const scrollWobble = Math.sin(progress * 7.2 + bubble.phase) * bubble.wobble * viewport.width * 0.045;
        const idleWobbleX = Math.sin(elapsed * bubble.idleSpeed + bubble.phase) * bubble.wobble * viewport.width * 0.03;
        const idleWobbleY = Math.cos(elapsed * (bubble.idleSpeed * 0.82) + bubble.phase * 0.7) * bubble.idleLift * viewport.height;
        const x = baseX + arcOffset + diagonalOffset + scrollWobble + idleWobbleX;
        const y = THREE.MathUtils.lerp(startY, endY, rise) + idleWobbleY;
        const z = bubble.z - rise * (4.8 + bubble.depth * 3.1) + Math.sin(elapsed * 0.34 + bubble.phase) * 0.08;

        const entryScale = smoothstep(0.08, 0.22, rise);
        const perspectiveScale = THREE.MathUtils.lerp(bubble.startScale, bubble.endScale, easeInOutSine(rise));
        const currentScale = enabled ? bubble.size * perspectiveScale * entryScale : 0.0001;

        dummy.position.set(x, y, z);
        dummy.rotation.set(
          progress * 0.48 + bubble.phase * 0.04 + elapsed * 0.018,
          progress * 0.72 + bubble.phase * 0.05 + elapsed * 0.018,
          bubble.arc * 0.12,
        );
        dummy.scale.setScalar(currentScale);
        dummy.updateMatrix();
        shellMesh.setMatrixAt(index, dummy.matrix);

        innerDummy.position.set(x, y, z);
        innerDummy.rotation.copy(dummy.rotation);
        innerDummy.scale.setScalar(currentScale * 0.94);
        innerDummy.updateMatrix();
        innerMesh.setMatrixAt(index, innerDummy.matrix);

        highlightDummy.position.set(x - currentScale * 0.34, y + currentScale * 0.34, z + currentScale * 0.62);
        highlightDummy.rotation.set(0, 0, -0.55);
        highlightDummy.scale.set(currentScale * 0.19, currentScale * 0.1, currentScale * 0.042);
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
  }, [bubbles]);

  return (
    <section
      ref={rootRef}
      id="bubble-transition"
      className={`ocean-bubble-field ocean-bubble-field-3d ${compact ? "is-compact" : ""}`}
      aria-label="Transition sous-marine vers les projets"
    >
      <div className="ocean-bubble-stage ocean-bubble-stage-3d">
        <canvas ref={canvasRef} className="ocean-bubble-canvas ocean-bubble-canvas-3d" aria-hidden="true" />
      </div>
    </section>
  );
}
