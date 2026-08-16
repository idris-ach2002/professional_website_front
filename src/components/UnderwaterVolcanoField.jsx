import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsapReady } from "../animations/useGsap";
import { announceOceanWorldMounted } from "../ocean/oceanWorldRegistration";
import {
  createVolcanoParticles,
  createVolcanoSimulation,
  resolveVolcanoParticleCounts,
  resolveVolcanoStageProfileInto,
  stepVolcanoParticles,
  stepVolcanoSimulation,
} from "../animations/volcanoSimulationEngine";
import {
  createVolcanoWebGLRenderer,
} from "../rendering/volcanoWebGLRenderer";
import {
  bakeSettledRock,
  createSettledDebrisSurface,
  drawParticleField,
  drawRockfall,
} from "../rendering/volcanoCanvasRenderer";
import {
  createVolcanoRockfall,
  resolveRockfallLimit,
  stepVolcanoRockfall,
} from "../animations/volcanoRockfallEngine";
import { paintVolcanoSmokeTexture } from "../rendering/volcanoSmokeTexture";
import {
  scheduleBackgroundTask,
  scheduleUserVisibleTask,
} from "../performance/runtimeScheduler";
import {
  markRuntimeOwnerMounted,
  markRuntimeOwnerUnmounted,
  registerRuntimeResource,
} from "../performance/resourceLifecycleRegistry";
import {
  requiredVolcanoFrameFloats,
  writeVolcanoFrame,
} from "../performance/volcanoWorkerProtocol";

const VOLCANO_ENVIRONMENT_PATH = "/scenes/abyss-volcano-environment.svg";

function resolveDpr(performanceMode, runtimeQuality, budgetCap = Infinity) {
  const deviceDpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const maxDpr = runtimeQuality === "constrained"
    ? 0.92
    : performanceMode === "balanced" || runtimeQuality === "balanced"
      ? 1.04
      : 1.16;
  return Math.min(deviceDpr, maxDpr, Number.isFinite(Number(budgetCap)) ? Number(budgetCap) : maxDpr);
}

function resolveRenderFps(performanceMode, runtimeQuality) {
  if (runtimeQuality === "constrained") return 28;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return 42;
  return 60;
}

function measureStageViewport(stage, dpr) {
  const rect = stage.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
    dpr,
  };
}

function applyCanvasViewport(canvas, viewport, { bitmap = true } = {}) {
  const pixelWidth = Math.max(1, Math.round(viewport.width * viewport.dpr));
  const pixelHeight = Math.max(1, Math.round(viewport.height * viewport.dpr));
  if (bitmap) {
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  }
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  return { pixelWidth, pixelHeight };
}

function supportsVolcanoOffscreenRendering() {
  return typeof Worker !== "undefined"
    && typeof OffscreenCanvas !== "undefined"
    && typeof HTMLCanvasElement !== "undefined"
    && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function";
}

function createTextureSurface(size) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const surface = document.createElement("canvas");
  surface.width = size;
  surface.height = size;
  return surface;
}

function createTexture(size, painter) {
  const surface = createTextureSurface(size);
  const context = surface.getContext("2d");
  painter(context, size);
  return surface;
}

function createLocalParticleTextures() {
  const smoke = [0, 1, 2, 3, 4, 5].map((variant) => createTexture(192, (context, size) => {
    paintVolcanoSmokeTexture(context, size, variant, "cold");
  }));

  const hotSmoke = createTexture(168, (context, size) => {
    paintVolcanoSmokeTexture(context, size, 0, "hot");
  });

  const ember = createTexture(40, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,218,1)");
    gradient.addColorStop(0.18, "rgba(255,185,46,.98)");
    gradient.addColorStop(0.52, "rgba(255,72,7,.62)");
    gradient.addColorStop(1, "rgba(255,36,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });

  const bubble = createTexture(64, (context, size) => {
    const center = size / 2;
    const radius = size * 0.39;
    const gradient = context.createRadialGradient(center * 0.72, center * 0.68, 1, center, center, radius);
    gradient.addColorStop(0, "rgba(255,255,255,.34)");
    gradient.addColorStop(0.34, "rgba(126,226,255,.11)");
    gradient.addColorStop(0.70, "rgba(44,177,224,.08)");
    gradient.addColorStop(1, "rgba(190,244,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(199,245,255,.82)";
    context.lineWidth = Math.max(1, size * 0.035);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.78)";
    context.beginPath();
    context.ellipse(center * 0.72, center * 0.67, size * 0.075, size * 0.045, -0.5, 0, Math.PI * 2);
    context.fill();
  });

  const bio = createTexture(28, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(214,255,255,.96)");
    gradient.addColorStop(0.26, "rgba(64,222,255,.70)");
    gradient.addColorStop(1, "rgba(0,165,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });

  return { smoke, hotSmoke, ember, bubble, bio };
}

function requestWorkerParticleTextures() {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    return Promise.resolve(createLocalParticleTextures());
  }

  return new Promise((resolve) => {
    const worker = new Worker(new URL("../workers/volcanoTexture.worker.js", import.meta.url), { type: "module" });
    let settled = false;
    const finish = (textures) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(textures);
    };
    const timeout = window.setTimeout(() => finish(createLocalParticleTextures()), 1400);
    worker.onmessage = (event) => {
      if (event.data?.type === "volcano-textures-ready") finish(event.data);
      else if (event.data?.type === "volcano-textures-error") finish(createLocalParticleTextures());
    };
    worker.onerror = () => finish(createLocalParticleTextures());
    worker.postMessage({ type: "build-volcano-textures" });
  });
}

function qualityScalar(runtimeQuality, performanceMode) {
  if (runtimeQuality === "constrained") return 0.45;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return 0.72;
  return 1;
}

export default function UnderwaterVolcanoField({
  performanceMode = "full",
  paused = false,
  runtimeQuality = "high",
  runtimeBudget = null,
}) {
  useEffect(() => {
    announceOceanWorldMounted("abyss-volcano-field");
  }, []);

  useEffect(() => {
    markRuntimeOwnerMounted("UnderwaterVolcanoField");
    return () => markRuntimeOwnerUnmounted("UnderwaterVolcanoField");
  }, []);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const webglCanvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const debrisCanvasRef = useRef(null);
  const settledDebrisSurfaceRef = useRef(null);
  const rockfallRef = useRef(createVolcanoRockfall(0x7a31));
  const rendererRef = useRef(null);
  const particlesRef = useRef([]);
  const texturesRef = useRef(null);
  const canvasWorkerRef = useRef(null);
  const canvasWorkerOwnedRef = useRef(false);
  const canvasWorkerPendingRef = useRef(false);
  const canvasWorkerReadyRef = useRef(false);
  const canvasWorkerBuffersRef = useRef([]);
  const viewportRef = useRef({ width: 1, height: 1, dpr: 1 });
  const simulationRef = useRef(createVolcanoSimulation(0x8218));
  const profileRef = useRef({});
  const reportedPulseRef = useRef("base");
  const reportedReactionRef = useRef(false);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastPaintRef = useRef(0);
  const unmountTimerRef = useRef(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [insideActiveZone, setInsideActiveZone] = useState(false);
  const [canvasWorkerEpoch, setCanvasWorkerEpoch] = useState(0);
  const [rendererKind, setRendererKind] = useState("webgl2");
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" ? true : !document.hidden);

  const counts = useMemo(() => {
    const base = resolveVolcanoParticleCounts(runtimeQuality, performanceMode);
    const scale = Math.max(0.2, Number(runtimeBudget?.volcanoScale ?? 1));
    return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, Math.max(1, Math.round(value * scale))]));
  }, [performanceMode, runtimeBudget?.volcanoScale, runtimeQuality]);
  const active = sceneReady && insideActiveZone && pageVisible && !paused;
  const dpr = resolveDpr(performanceMode, runtimeQuality, runtimeBudget?.dprCap);
  const targetFps = Math.min(resolveRenderFps(performanceMode, runtimeQuality), Number(runtimeBudget?.volcanoFps || Infinity));
  const quality = qualityScalar(runtimeQuality, performanceMode);
  const rockfallLimit = resolveRockfallLimit(runtimeQuality, performanceMode);
  const countsRef = useRef(counts);
  const rockfallLimitRef = useRef(rockfallLimit);
  const dprRef = useRef(dpr);

  useEffect(() => {
    countsRef.current = counts;
    rockfallLimitRef.current = rockfallLimit;
    dprRef.current = dpr;
  }, [counts, rockfallLimit, dpr]);

  const rebuildParticles = useCallback(() => {
    const { width, height } = viewportRef.current;
    if (width <= 1 || height <= 1) return;
    const seed = 0x7610 + counts.smoke * 31 + counts.ember * 17 + counts.ash * 13 + counts.sediment * 11;
    particlesRef.current = createVolcanoParticles(width, height, counts, seed);
  }, [counts]);

  const resize = useCallback(() => {
    const particleCanvas = particleCanvasRef.current;
    const debrisCanvas = debrisCanvasRef.current;
    const webglCanvas = webglCanvasRef.current;
    const stage = stageRef.current;
    if (!particleCanvas || !debrisCanvas || !webglCanvas || !stage) return;

    // One layout read, then all canvas writes are batched from the cached viewport.
    const viewport = measureStageViewport(stage, dpr);
    viewportRef.current = viewport;
    applyCanvasViewport(webglCanvas, viewport);
    rendererRef.current?.resize(viewport.width, viewport.height, dpr);

    if (canvasWorkerOwnedRef.current) {
      applyCanvasViewport(particleCanvas, viewport, { bitmap: false });
      applyCanvasViewport(debrisCanvas, viewport, { bitmap: false });
      canvasWorkerRef.current?.postMessage({ type: "resize", viewport });
      settledDebrisSurfaceRef.current = null;
    } else {
      const particlePixels = applyCanvasViewport(particleCanvas, viewport);
      applyCanvasViewport(debrisCanvas, viewport);
      settledDebrisSurfaceRef.current = createSettledDebrisSurface(particlePixels.pixelWidth, particlePixels.pixelHeight);
    }

    // Preserve the exact main-thread simulation state/seed; only rasterization moves.
    rockfallRef.current = createVolcanoRockfall(0x7a31);
    rebuildParticles();
  }, [dpr, rebuildParticles]);


  useEffect(() => {
    const handleVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const releaseInactiveResources = (event) => {
      const nextState = event.detail?.to;
      if (!["pressure", "critical"].includes(nextState) || insideActiveZone) return;
      const textures = texturesRef.current;
      if (textures) {
        for (const texture of [...(textures.smoke ?? []), textures.hotSmoke, textures.ember, textures.bubble, textures.bio]) {
          texture?.close?.();
        }
        texturesRef.current = null;
      }
      particlesRef.current = [];
      settledDebrisSurfaceRef.current = null;
      if (nextState === "critical") setSceneReady(false);
    };
    window.addEventListener("portfolio:memory-pressure", releaseInactiveResources);
    return () => window.removeEventListener("portfolio:memory-pressure", releaseInactiveResources);
  }, [insideActiveZone]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    // Runtime diagnostics are DOM-owned. Keeping these attributes outside JSX
    // prevents React rerenders from overwriting Worker/pulse state.
    root.dataset.volcanoCanvasRenderer = root.dataset.volcanoCanvasRenderer || "main";
    root.dataset.volcanoPulse = root.dataset.volcanoPulse || "base";

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(unmountTimerRef.current);
        if (entry.isIntersecting) {
          if (supportsVolcanoOffscreenRendering()) {
            scheduleUserVisibleTask(() => setSceneReady(true)).catch(() => setSceneReady(true));
            return;
          }
          if (texturesRef.current) {
            scheduleUserVisibleTask(() => setSceneReady(true)).catch(() => setSceneReady(true));
            return;
          }
          scheduleBackgroundTask(() => requestWorkerParticleTextures())
            .then((textures) => scheduleUserVisibleTask(() => {
              texturesRef.current = textures;
              setSceneReady(true);
            }))
            .catch(() => {
              texturesRef.current = createLocalParticleTextures();
              setSceneReady(true);
            });
          return;
        }
        unmountTimerRef.current = window.setTimeout(() => setSceneReady(false), 1800);
      },
      { rootMargin: "1100px 0px", threshold: 0.01 },
    );

    const activeObserver = new IntersectionObserver(
      ([entry]) => setInsideActiveZone(entry.isIntersecting),
      { rootMargin: "180px 0px", threshold: 0.01 },
    );

    preloadObserver.observe(root);
    activeObserver.observe(root);
    return () => {
      window.clearTimeout(unmountTimerRef.current);
      preloadObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!sceneReady || !supportsVolcanoOffscreenRendering()) return undefined;
    const particleCanvas = particleCanvasRef.current;
    const debrisCanvas = debrisCanvasRef.current;
    const stage = stageRef.current;
    if (!particleCanvas || !debrisCanvas || !stage || canvasWorkerOwnedRef.current) return undefined;

    const controller = new AbortController();
    let worker = null;
    canvasWorkerPendingRef.current = true;

    const initializeWorker = () => {
      if (controller.signal.aborted || canvasWorkerOwnedRef.current) return;
      try {
        const viewport = measureStageViewport(stage, dprRef.current);
        viewportRef.current = viewport;
        applyCanvasViewport(particleCanvas, viewport);
        applyCanvasViewport(debrisCanvas, viewport);
        // Construct the Worker before transferring either canvas so constructor
        // failure can still use the untouched main-thread fallback.
        worker = new Worker(new URL("../workers/volcanoCanvasRender.worker.js", import.meta.url), { type: "module" });
        const particleOffscreen = particleCanvas.transferControlToOffscreen();
        const debrisOffscreen = debrisCanvas.transferControlToOffscreen();
        canvasWorkerRef.current = worker;
        canvasWorkerOwnedRef.current = true;
        canvasWorkerReadyRef.current = false;
        canvasWorkerBuffersRef.current = [];
        worker.onmessage = (event) => {
          if (event.data?.type === "ready") {
            canvasWorkerPendingRef.current = false;
            canvasWorkerReadyRef.current = true;
            if (rootRef.current) rootRef.current.dataset.volcanoCanvasRenderer = "worker";
            setCanvasWorkerEpoch((value) => value + 1);
            const floats = requiredVolcanoFrameFloats(
              particlesRef.current.length,
              rockfallLimitRef.current,
            );
            canvasWorkerBuffersRef.current = Array.from(
              { length: 3 },
              () => new ArrayBuffer(floats * Float64Array.BYTES_PER_ELEMENT),
            );
            return;
          }
          if (event.data?.type === "buffer-return" && event.data.buffer instanceof ArrayBuffer) {
            if (canvasWorkerBuffersRef.current.length < 3) {
              canvasWorkerBuffersRef.current.push(event.data.buffer);
            }
          }
        };
        worker.onerror = () => {
          canvasWorkerPendingRef.current = false;
          canvasWorkerReadyRef.current = false;
          if (rootRef.current) rootRef.current.dataset.volcanoCanvasRenderer = "worker-error";
          setCanvasWorkerEpoch((value) => value + 1);
        };
        worker.postMessage({
          type: "init",
          particleCanvas: particleOffscreen,
          debrisCanvas: debrisOffscreen,
          viewport,
        }, [particleOffscreen, debrisOffscreen]);
      } catch {
        worker?.terminate();
        worker = null;
        canvasWorkerRef.current = null;
        canvasWorkerOwnedRef.current = false;
        canvasWorkerPendingRef.current = false;
        if (rootRef.current) rootRef.current.dataset.volcanoCanvasRenderer = "main";
        canvasWorkerReadyRef.current = false;
        canvasWorkerBuffersRef.current = [];
        setCanvasWorkerEpoch((value) => value + 1);
      }
    };

    // Deferring the transfer avoids StrictMode effect probing and uses idle time
    // while the volcano is still in its 1100px preload zone.
    scheduleBackgroundTask(initializeWorker, { signal: controller.signal }).catch(() => {});

    return () => {
      controller.abort();
      worker?.terminate();
      if (canvasWorkerRef.current === worker) canvasWorkerRef.current = null;
      canvasWorkerOwnedRef.current = false;
      canvasWorkerPendingRef.current = false;
      canvasWorkerReadyRef.current = false;
      canvasWorkerBuffersRef.current = [];
    };
  }, [sceneReady]);

  useEffect(() => {
    if (!sceneReady || !webglCanvasRef.current) return undefined;
    const canvasLeases = [
      [webglCanvasRef.current, "volcano-webgl"],
      [debrisCanvasRef.current, "volcano-debris"],
      [particleCanvasRef.current, "volcano-particles"],
    ].filter(([canvas]) => Boolean(canvas)).map(([canvas, label]) => registerRuntimeResource({
      owner: "UnderwaterVolcanoField",
      type: "canvas",
      label,
      estimatedBytes: canvas.width * canvas.height * 4,
    }));
    // The original volcano is one WebGL composition. Never mount the old SVG
    // fallback underneath it: that created two superposed volcanoes when the
    // deferred renderer became ready a few seconds later.
    const renderer = createVolcanoWebGLRenderer(webglCanvasRef.current);
    const rendererLease = registerRuntimeResource({
      owner: "UnderwaterVolcanoField",
      type: "renderer",
      label: renderer ? "webgl2-volcano-renderer" : "volcano-fallback-renderer",
    });
    rendererRef.current = renderer;
    setRendererKind(renderer ? "webgl2" : "fallback");
    resize();

    const stage = stageRef.current;
    if (!stage) {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererLease.release();
      canvasLeases.forEach((lease) => lease.release());
      return undefined;
    }
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.visualViewport?.addEventListener("resize", resize, { passive: true });

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", resize);
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererLease.release();
      canvasLeases.forEach((lease) => lease.release());
    };
  }, [resize, sceneReady]);

  useEffect(() => {
    if (!sceneReady) return;
    rebuildParticles();
  }, [counts, rebuildParticles, sceneReady]);

  useEffect(() => {
    const particleCanvas = particleCanvasRef.current;
    const debrisCanvas = debrisCanvasRef.current;
    const workerOwned = canvasWorkerOwnedRef.current;
    const workerPending = canvasWorkerPendingRef.current;
    // Do not acquire a 2D context while the volcano is inactive. The debris
    // canvas stays mounted while sceneReady is false; claiming its context here
    // would make a later transferControlToOffscreen() permanently illegal in
    // Firefox.
    if (!particleCanvas || !debrisCanvas || !active || workerPending) {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
      return undefined;
    }
    const context = workerOwned ? null : particleCanvas.getContext("2d", { alpha: true, desynchronized: true });
    const debrisContext = workerOwned ? null : debrisCanvas.getContext("2d", { alpha: true, desynchronized: true });
    const fallbackReady = (workerOwned && canvasWorkerReadyRef.current) || Boolean(!workerOwned && context && debrisContext && texturesRef.current);
    if (!fallbackReady) {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
      return undefined;
    }

    const rafLease = registerRuntimeResource({
      owner: "UnderwaterVolcanoField",
      type: "raf",
      label: "volcano-paint-loop",
    });
    const paintInterval = 1000 / Math.max(1, targetFps);
    const tick = (timestamp) => {
      const previous = lastFrameRef.current || timestamp;
      const deltaSeconds = Math.min(1 / 20, Math.max(1 / 240, (timestamp - previous) / 1000));
      lastFrameRef.current = timestamp;

      stepVolcanoSimulation(simulationRef.current, deltaSeconds);
      const profile = resolveVolcanoStageProfileInto(simulationRef.current, profileRef.current);
      const reacting = profile.shock > 0.52 || (profile.pulseType === "mega" && profile.pulse > 0.92);
      const pulseChanged = profile.pulseType !== reportedPulseRef.current;
      const reactionChanged = reacting !== reportedReactionRef.current;
      if (pulseChanged || reactionChanged) {
        reportedPulseRef.current = profile.pulseType;
        reportedReactionRef.current = reacting;
        if (rootRef.current) rootRef.current.dataset.volcanoPulse = profile.pulseType;
        window.dispatchEvent(new CustomEvent("portfolio:volcano-stage", {
          detail: { stage: "eruption", pulseType: profile.pulseType, reaction: reacting },
        }));
      }

      if (!lastPaintRef.current || timestamp - lastPaintRef.current >= paintInterval - 0.5) {
        lastPaintRef.current = timestamp;
        const paintDelta = Math.min(0.05, Math.max(deltaSeconds, paintInterval / 1000));
        rendererRef.current?.render(simulationRef.current.elapsed, profile, quality);

        // Keep simulation on the main thread exactly as before. Only Canvas2D
        // rasterization is offloaded, so particle trajectories and pulse timing
        // remain bit-for-bit driven by the original delta/elapsed sequence.
        stepVolcanoParticles(
          particlesRef.current,
          paintDelta,
          viewportRef.current.width,
          viewportRef.current.height,
          simulationRef.current.elapsed,
          profile,
        );
        const settledRocks = stepVolcanoRockfall(
          rockfallRef.current,
          paintDelta,
          viewportRef.current.width,
          viewportRef.current.height,
          simulationRef.current.elapsed,
          profile,
          rockfallLimit,
        );

        if (workerOwned) {
          for (const rock of settledRocks) {
            canvasWorkerRef.current?.postMessage({ type: "settled-rock", rock });
          }
          if (canvasWorkerReadyRef.current) {
            let buffer = canvasWorkerBuffersRef.current.pop();
            const requiredFloats = requiredVolcanoFrameFloats(
              particlesRef.current.length,
              rockfallRef.current.active.length,
            );
            if (buffer && buffer.byteLength < requiredFloats * Float64Array.BYTES_PER_ELEMENT) {
              buffer = new ArrayBuffer(requiredFloats * Float64Array.BYTES_PER_ELEMENT);
            }
            if (buffer) {
              const frameState = new Float64Array(buffer);
              writeVolcanoFrame(
                frameState,
                paintDelta,
                viewportRef.current,
                simulationRef.current.elapsed,
                profile,
                particlesRef.current,
                rockfallRef.current.active,
              );
              canvasWorkerRef.current?.postMessage({ type: "frame", buffer }, [buffer]);
            }
          }
        } else {
          for (const rock of settledRocks) bakeSettledRock(settledDebrisSurfaceRef.current, rock, viewportRef.current);
          drawRockfall(debrisContext, rockfallRef.current, settledDebrisSurfaceRef.current, viewportRef.current);
          drawParticleField(
            context,
            particlesRef.current,
            texturesRef.current,
            viewportRef.current,
            simulationRef.current.elapsed,
            profile,
          );
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
      if (workerOwned) canvasWorkerRef.current?.postMessage({ type: "clear" });
      rafLease.release();
    };
  }, [active, canvasWorkerEpoch, quality, rockfallLimit, targetFps]);


  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const pulseType = active ? reportedPulseRef.current : "base";
    const reaction = active && reportedReactionRef.current;
    if (rootRef.current) rootRef.current.dataset.volcanoPulse = pulseType;
    window.dispatchEvent(new CustomEvent("portfolio:volcano-stage", {
      detail: { stage: active ? "eruption" : "idle", pulseType, reaction },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent("portfolio:volcano-stage", {
        detail: { stage: "idle", pulseType: "base", reaction: false },
      }));
    };
  }, [active]);


  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (paused) return undefined;

    gsapReady().then((runtime) => {
      if (disposed || !runtime?.gsap || !rootRef.current || !stageRef.current) return;
      const { gsap, ScrollTrigger } = runtime;
      const context = gsap.context(() => {
        gsap.fromTo(
          stageRef.current,
          { y: 34, autoAlpha: 0, scale: 0.994 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: performanceMode === "balanced" ? 0.54 : 0.72,
            ease: "expo.out",
            force3D: true,
            scrollTrigger: ScrollTrigger ? { trigger: rootRef.current, start: "top 84%" } : undefined,
          },
        );
      }, rootRef.current);
      cleanup = () => context.revert();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [paused, performanceMode]);

  useEffect(() => () => {
    const textures = texturesRef.current;
    if (!textures) return;
    for (const texture of [...(textures.smoke ?? []), textures.hotSmoke, textures.ember, textures.bubble, textures.bio]) {
      texture?.close?.();
    }
  }, []);

  return (
    <section
      ref={rootRef}
      id="abyss-volcano-field"
      className={`volcano-field-section${active ? " is-active" : ""}${sceneReady ? " is-mounted" : " is-suspended"}`}
      data-volcano-stage={active ? "eruption" : "idle"}
      data-volcano-renderer={rendererKind}
      aria-hidden="true"
    >
      <div ref={stageRef} className="volcano-field-stage" aria-hidden="true">
        <div className="volcano-light-rays" />
        <img
          className="volcano-environment-vector"
          src={VOLCANO_ENVIRONMENT_PATH}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="volcano-render-stack">
          <canvas ref={webglCanvasRef} className="volcano-webgl-canvas" />
          {sceneReady ? (
            <>
              <canvas ref={debrisCanvasRef} className="volcano-debris-canvas" />
              <canvas ref={particleCanvasRef} className="volcano-particle-canvas" />
            </>
          ) : (
            <div className="volcano-field-placeholder" />
          )}
        </div>
        <img
          className="volcano-foreground-vector"
          src="/scenes/abyss-volcano-foreground.svg"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="volcano-seabed-vignette" />
      </div>
    </section>
  );
}
