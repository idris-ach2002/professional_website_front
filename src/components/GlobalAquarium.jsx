import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BIOME_ORDER,
  BIOME_PROFILES,
  OCEAN_BIOMES,
  OCEAN_WORLD_ANCHOR_IDS,
  createMarinePopulation,
  resolveMarinePopulation,
  resolveRareOceanEvent,
  resolveBiomeTransitionDuration,
  resolveViewportBiome,
  stepMarinePopulation,
} from "../ocean/oceanWorldEngine";
import {
  OCEAN_WORLD_MOUNTED_EVENT,
  OCEAN_WORLD_RECONCILE_EVENT,
} from "../ocean/oceanWorldRegistration";
import { resolveAquariumFps } from "../ocean/oceanRuntimePolicy";
import { applyMarineStateBuffer, createMarineWorkerRuntime } from "../performance/marineWorkerRuntime";
import {
  markRuntimeOwnerMounted,
  markRuntimeOwnerUnmounted,
  registerRuntimeResource,
} from "../performance/resourceLifecycleRegistry";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { isOceanTransitionEnabled } from "../animations/oceanTransitionPreferences";
import { getScrollFrameSnapshot } from "../performance/scrollFrameCoordinator";

const OBSERVED_SECTIONS = Object.freeze([...OCEAN_WORLD_ANCHOR_IDS, "ocean-outro"]);

const PALETTES = Object.freeze({
  reef: ["#8fe8ff", "#0ea5c6", "#f0fbff"],
  silver: ["#dff8ff", "#7db7c9", "#ffffff"],
  deep: ["#345276", "#14233d", "#8edfff"],
  lantern: ["#16314a", "#071927", "#78f5ff"],
  vent: ["#3c5660", "#14272d", "#b2ecdc"],
});

function resolveDpr(runtimeQuality, budgetCap = Infinity) {
  const device = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const qualityCap = runtimeQuality === "constrained" ? 0.90 : runtimeQuality === "balanced" ? 1.05 : 1.22;
  return Math.min(device, qualityCap, Number.isFinite(Number(budgetCap)) ? Number(budgetCap) : qualityCap);
}

function resizeCanvas(canvas, dpr) {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return { width, height, dpr };
}

function supportsAquariumOffscreenRendering() {
  return typeof Worker !== "undefined"
    && typeof OffscreenCanvas !== "undefined"
    && typeof HTMLCanvasElement !== "undefined"
    && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function";
}

function writeAquariumRenderState(target, agents, previousAgents) {
  let offset = 0;
  for (const agent of agents) {
    target[offset] = agent.x;
    target[offset + 1] = agent.y;
    target[offset + 2] = agent.heading;
    offset += 3;
  }
  for (const agent of previousAgents) {
    target[offset] = agent.x;
    target[offset + 1] = agent.y;
    target[offset + 2] = agent.heading;
    offset += 3;
  }
  return offset;
}

function drawFish(context, agent, x, y, size, opacity) {
  const [light, dark, accent] = PALETTES[agent.species] ?? PALETTES.reef;
  const direction = agent.heading >= 0 ? 1 : -1;
  context.save();
  context.translate(x, y);
  context.scale(direction, 1);
  context.globalAlpha = opacity;

  const gradient = context.createLinearGradient(-size * 0.7, 0, size * 0.75, 0);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.55, light);
  gradient.addColorStop(1, accent);
  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(0, 0, size * 0.72, size * 0.34, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(-size * 0.62, 0);
  context.lineTo(-size * 1.04, -size * 0.42);
  context.lineTo(-size * 0.92, size * 0.42);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255,255,255,.92)";
  context.beginPath();
  context.arc(size * 0.42, -size * 0.08, Math.max(1.2, size * 0.055), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(3,18,29,.9)";
  context.beginPath();
  context.arc(size * 0.44, -size * 0.08, Math.max(0.8, size * 0.026), 0, Math.PI * 2);
  context.fill();

  if (agent.species === "lantern") {
    context.globalCompositeOperation = "lighter";
    context.fillStyle = "rgba(104,245,255,.72)";
    context.beginPath();
    context.arc(size * 0.15, size * 0.17, size * 0.06, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawRay(context, agent, x, y, size, opacity, manta = false) {
  const direction = agent.heading >= 0 ? 1 : -1;
  context.save();
  context.translate(x, y);
  context.scale(direction, 1);
  context.globalAlpha = opacity;
  context.fillStyle = manta ? "rgba(10,32,49,.88)" : "rgba(45,104,126,.72)";
  context.beginPath();
  context.moveTo(size * 0.72, 0);
  context.bezierCurveTo(size * 0.15, -size * 0.54, -size * 0.48, -size * 0.46, -size * 0.62, -size * 0.04);
  context.bezierCurveTo(-size * 0.45, size * 0.42, size * 0.14, size * 0.50, size * 0.72, 0);
  context.fill();
  context.strokeStyle = manta ? "rgba(117,210,227,.28)" : "rgba(163,235,246,.32)";
  context.lineWidth = Math.max(1, size * 0.018);
  context.beginPath();
  context.moveTo(-size * 0.54, 0);
  context.quadraticCurveTo(-size * 0.94, size * 0.10, -size * 1.20, size * 0.30);
  context.stroke();
  context.restore();
}

function drawJelly(context, x, y, size, opacity, phase) {
  context.save();
  context.translate(x, y);
  context.globalAlpha = opacity;
  const pulse = 0.92 + Math.sin(phase) * 0.08;
  context.scale(pulse, 1 / pulse);
  const gradient = context.createLinearGradient(0, -size * 0.5, 0, size * 0.35);
  gradient.addColorStop(0, "rgba(178,238,255,.58)");
  gradient.addColorStop(1, "rgba(71,151,194,.12)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, size * 0.44, Math.PI, 0);
  context.quadraticCurveTo(size * 0.28, size * 0.34, 0, size * 0.26);
  context.quadraticCurveTo(-size * 0.28, size * 0.34, -size * 0.44, 0);
  context.fill();
  context.strokeStyle = "rgba(130,225,249,.32)";
  context.lineWidth = Math.max(0.8, size * 0.018);
  for (let index = -2; index <= 2; index += 1) {
    context.beginPath();
    context.moveTo(index * size * 0.12, size * 0.22);
    context.bezierCurveTo(
      index * size * 0.10 + Math.sin(phase + index) * size * 0.06,
      size * 0.52,
      index * size * 0.15,
      size * 0.72,
      index * size * 0.09 + Math.sin(phase * 0.7 + index) * size * 0.08,
      size * 0.90,
    );
    context.stroke();
  }
  context.restore();
}

function drawSquid(context, agent, x, y, size, opacity) {
  const direction = agent.heading >= 0 ? 1 : -1;
  context.save();
  context.translate(x, y);
  context.scale(direction, 1);
  context.globalAlpha = opacity;
  context.fillStyle = "rgba(77,129,158,.72)";
  context.beginPath();
  context.ellipse(0, 0, size * 0.52, size * 0.27, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(127,203,224,.58)";
  context.beginPath();
  context.moveTo(size * 0.12, -size * 0.18);
  context.lineTo(-size * 0.22, -size * 0.46);
  context.lineTo(-size * 0.14, -size * 0.10);
  context.fill();
  context.strokeStyle = "rgba(154,226,239,.45)";
  context.lineWidth = Math.max(0.8, size * 0.015);
  for (let index = -1; index <= 1; index += 1) {
    context.beginPath();
    context.moveTo(-size * 0.46, index * size * 0.08);
    context.quadraticCurveTo(-size * 0.72, index * size * 0.15, -size * 0.92, index * size * 0.22);
    context.stroke();
  }
  context.restore();
}

function drawAgent(context, agent, viewport, elapsed, biomeOpacity) {
  const layerScale = agent.depthLayer === "near" ? 1.28 : agent.depthLayer === "far" ? 0.68 : 0.92;
  const layerOpacity = agent.depthLayer === "near" ? 0.74 : agent.depthLayer === "far" ? 0.34 : 0.58;
  const minDimension = Math.min(viewport.width, viewport.height);
  const size = Math.max(12, minDimension * agent.size * layerScale);
  const x = agent.x * viewport.width;
  const y = agent.y * viewport.height;
  const opacity = agent.opacity * layerOpacity * biomeOpacity;

  if (agent.species === "ray") drawRay(context, agent, x, y, size, opacity);
  else if (agent.species === "jelly") drawJelly(context, x, y, size, opacity, agent.wanderPhase + elapsed * 1.3);
  else if (agent.species === "squid") drawSquid(context, agent, x, y, size, opacity);
  else drawFish(context, agent, x, y, size, opacity);
}

function drawRareEvent(context, event, viewport) {
  if (!event) return;
  const p = event.progress;
  const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  if (event.type === "manta") {
    const agent = { heading: 1 };
    drawRay(
      context,
      agent,
      (-0.18 + eased * 1.36) * viewport.width,
      viewport.height * (0.26 + Math.sin(p * Math.PI) * 0.05),
      Math.min(viewport.width, viewport.height) * 0.18,
      Math.sin(Math.PI * p) * 0.42,
      true,
    );
    return;
  }
  if (event.type === "school") {
    for (let index = 0; index < 6; index += 1) {
      const local = Math.max(0, Math.min(1, p * 1.25 - index * 0.035));
      const agent = { heading: 1, species: "silver" };
      drawFish(
        context,
        agent,
        (-0.12 + local * 1.24) * viewport.width,
        viewport.height * (0.36 + index * 0.025 + Math.sin(index * 1.7) * 0.02),
        Math.min(viewport.width, viewport.height) * 0.032,
        Math.sin(Math.PI * local) * 0.34,
      );
    }
    return;
  }
  for (let index = 0; index < 3; index += 1) {
    drawJelly(
      context,
      viewport.width * (0.28 + index * 0.19 + Math.sin(p * Math.PI * 2 + index) * 0.02),
      viewport.height * (0.74 - p * 0.22 + index * 0.025),
      Math.min(viewport.width, viewport.height) * (0.045 + index * 0.008),
      Math.sin(Math.PI * p) * 0.30,
      p * Math.PI * 2 + index,
    );
  }
}

function chooseBiome(worldGeometry, currentBiome, scrollTop) {
  const focusY = Math.max(1, window.innerHeight) * 0.5;
  const anchors = [];

  for (const id of OCEAN_WORLD_ANCHOR_IDS) {
    const geometry = worldGeometry.get(id);
    if (!geometry) continue;
    anchors.push({ id, top: geometry.documentTop - scrollTop });
  }

  return resolveViewportBiome(anchors, currentBiome, focusY);
}

let activeWorldDirectorOwner = null;

export default function GlobalAquarium({
  isMobile = false,
  reducedMotion = false,
  performanceMode = "full",
  paused = false,
  runtimeQuality = "high",
  runtimeBudget = null,
}) {
  const { transitionPreferences } = useAnimationPreferences();
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const renderWorkerRef = useRef(null);
  const renderWorkerOwnedRef = useRef(false);
  const renderTransferredCanvasRef = useRef(null);
  const renderWorkerFailedRef = useRef(false);
  const renderWorkerBuffersRef = useRef([]);
  const initialOffscreenAllowedRef = useRef(!reducedMotion);
  const dprRef = useRef(1);
  const [renderBackend, setRenderBackend] = useState(() => (
    !reducedMotion && supportsAquariumOffscreenRendering() ? "pending" : "main"
  ));
  const [canvasEpoch, setCanvasEpoch] = useState(0);
  const agentsRef = useRef([]);
  const previousAgentsRef = useRef([]);
  const transitionRef = useRef({ from: OCEAN_BIOMES.SURFACE, to: OCEAN_BIOMES.SURFACE, startedAt: 0, duration: 0 });
  const viewportRef = useRef({ width: 1, height: 1, dpr: 1 });
  const rafRef = useRef(0);
  const marineWorkerRef = useRef(null);
  const marineWorkerLeaseRef = useRef(null);
  const marineWorkerDeltaRef = useRef(0);
  const lastFrameRef = useRef(0);
  const elapsedRef = useRef(0);
  const dangerRef = useRef(0);
  const cinematicRef = useRef(false);
  // The footer is intentionally compact (~35vh), so it can never cross the
  // generic viewport-centre arbitration at the document end. A dedicated
  // visibility observer gives the final world priority while the mine is in
  // view, without tying cinematic progress to scroll position.
  const outroVisibleRef = useRef(false);
  const biomeRef = useRef(OCEAN_BIOMES.SURFACE);
  const renderedBiomeRef = useRef(OCEAN_BIOMES.SURFACE);
  const transitionTimerRef = useRef(0);
  const [biome, setBiome] = useState(OCEAN_BIOMES.SURFACE);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" ? true : !document.hidden);

  const population = useMemo(() => {
    const baseline = resolveMarinePopulation(runtimeQuality, performanceMode, isMobile);
    const scale = Math.max(0.2, Number(runtimeBudget?.marinePopulationScale ?? 1));
    return Math.max(2, Math.round(baseline * scale));
  }, [isMobile, performanceMode, runtimeBudget?.marinePopulationScale, runtimeQuality]);
  const dpr = useMemo(
    () => resolveDpr(runtimeQuality, runtimeBudget?.dprCap),
    [runtimeBudget?.dprCap, runtimeQuality],
  );
  const active = pageVisible && !paused;

  useEffect(() => {
    dprRef.current = dpr;
  }, [dpr]);

  const syncRenderWorkerPopulation = useCallback(() => {
    const worker = renderWorkerRef.current;
    if (!renderWorkerOwnedRef.current || !worker) return;
    worker.postMessage({
      type: "sync-population",
      agents: agentsRef.current,
      previousAgents: previousAgentsRef.current,
    });
  }, []);

  const rebuildPopulation = useCallback((targetBiome = biomeRef.current) => {
    agentsRef.current = createMarinePopulation(population, targetBiome, 0x5183 + population * 13);
    marineWorkerDeltaRef.current = 0;
    marineWorkerRef.current?.sync(agentsRef.current);
    queueMicrotask(syncRenderWorkerPopulation);
  }, [population, syncRenderWorkerPopulation]);

  const setCinematicMask = useCallback((enabled) => {
    const next = Boolean(enabled);
    cinematicRef.current = next;
    rootRef.current?.classList.toggle("is-cinematic", next);
  }, []);

  useEffect(() => {
    markRuntimeOwnerMounted("GlobalAquarium");
    return () => markRuntimeOwnerUnmounted("GlobalAquarium");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!initialOffscreenAllowedRef.current || renderWorkerFailedRef.current || !supportsAquariumOffscreenRendering()) {
      return undefined;
    }

    // React StrictMode intentionally mounts, cleans up, then mounts effects again
    // in development. transferControlToOffscreen() is irreversible for a given
    // HTMLCanvasElement, so transferring synchronously during the throw-away
    // StrictMode pass leaves the second pass with a canvas that can no longer
    // service getContext(). Defer the transfer by one animation frame: the
    // throw-away pass is cancelled before it can claim the canvas, while the
    // committed pass still moves rendering off the main thread immediately.
    let cancelled = false;
    let startupFrame = 0;
    let worker = null;
    let transferred = false;

    const fallbackToMain = () => {
      if (cancelled) return;
      renderWorkerFailedRef.current = true;
      renderWorkerOwnedRef.current = false;
      if (renderWorkerRef.current === worker) renderWorkerRef.current = null;
      renderWorkerBuffersRef.current = [];
      if (rootRef.current) rootRef.current.dataset.renderBackend = "main";
      window.__portfolioAquariumRender = { backend: "main", fallback: true };
      try { worker?.terminate(); } catch { /* optional worker */ }
      // Once transferControlToOffscreen() succeeds, that DOM canvas can never
      // regain a main-thread context. Remount a fresh one before enabling the
      // exact main-thread fallback renderer.
      if (transferred) setCanvasEpoch((value) => value + 1);
      setRenderBackend("main");
    };

    const startOffscreenRenderer = () => {
      startupFrame = 0;
      if (cancelled || canvasRef.current !== canvas) return;
      try {
        worker = new Worker(new URL("../workers/aquariumCanvasRender.worker.js", import.meta.url), { type: "module" });
        const offscreen = canvas.transferControlToOffscreen();
        transferred = true;
        renderTransferredCanvasRef.current = canvas;
        renderWorkerRef.current = worker;
        renderWorkerOwnedRef.current = true;
        renderWorkerBuffersRef.current = [];
        const viewport = {
          width: Math.max(1, window.innerWidth),
          height: Math.max(1, window.innerHeight),
          dpr: dprRef.current,
        };
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        worker.addEventListener("message", (event) => {
          if (cancelled) return;
          if (event.data?.type === "ready") {
            if (rootRef.current) rootRef.current.dataset.renderBackend = "worker";
            window.__portfolioAquariumRender = { backend: "worker" };
            setRenderBackend("worker");
            syncRenderWorkerPopulation();
            return;
          }
          if (event.data?.type === "buffer-return" && event.data.buffer instanceof ArrayBuffer) {
            if (renderWorkerBuffersRef.current.length < 4) renderWorkerBuffersRef.current.push(event.data.buffer);
          }
        });
        worker.addEventListener("error", fallbackToMain);
        worker.postMessage({
          type: "init",
          canvas: offscreen,
          viewport,
          agents: agentsRef.current,
          previousAgents: previousAgentsRef.current,
        }, [offscreen]);
      } catch {
        fallbackToMain();
      }
    };

    startupFrame = window.requestAnimationFrame(startOffscreenRenderer);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startupFrame);
      try { worker?.terminate(); } catch { /* already terminated */ }
      if (renderWorkerRef.current === worker) renderWorkerRef.current = null;
      renderWorkerOwnedRef.current = false;
      renderWorkerBuffersRef.current = [];
      delete window.__portfolioAquariumRender;
    };
  }, [canvasEpoch, syncRenderWorkerPopulation]);

  useEffect(() => {
    const workerEnabled = Boolean(runtimeBudget?.workerSimulation) && !reducedMotion;
    if (!workerEnabled) {
      marineWorkerRef.current?.terminate();
      marineWorkerRef.current = null;
      marineWorkerLeaseRef.current?.release();
      marineWorkerLeaseRef.current = null;
      marineWorkerDeltaRef.current = 0;
      return undefined;
    }

    const lease = registerRuntimeResource({
      owner: "GlobalAquarium",
      type: "worker",
      label: "marine-simulation",
    });
    const runtime = createMarineWorkerRuntime({
      onState: (stateBuffer, count, status) => {
        applyMarineStateBuffer(agentsRef.current, stateBuffer, count);
        lease.update({ metadata: { status: "active", latencyMs: status.latencyMs } });
        window.__portfolioMarineWorker = { status: "active", latencyMs: status.latencyMs, count };
      },
      onStatus: (status) => {
        lease.update({ metadata: status });
        window.__portfolioMarineWorker = status;
      },
    });

    if (!runtime) {
      lease.release();
      window.__portfolioMarineWorker = { status: "unavailable" };
      return undefined;
    }

    marineWorkerRef.current = runtime;
    marineWorkerLeaseRef.current = lease;
    runtime.sync(agentsRef.current);

    return () => {
      runtime.terminate();
      if (marineWorkerRef.current === runtime) marineWorkerRef.current = null;
      if (marineWorkerLeaseRef.current === lease) marineWorkerLeaseRef.current = null;
      marineWorkerDeltaRef.current = 0;
      lease.release();
      delete window.__portfolioMarineWorker;
    };
  }, [reducedMotion, runtimeBudget?.workerSimulation]);

  useEffect(() => {
    // The World Director publishes its observable marker synchronously.
    // This effect only brings the rendered population to that decision.
    if (biome !== biomeRef.current) return undefined;

    const previousBiome = renderedBiomeRef.current;
    renderedBiomeRef.current = biome;

    const runningTransition = transitionRef.current;
    const runningTransitionName = `${runningTransition.from}-${runningTransition.to}`;
    if (runningTransition.duration > 0 && !isOceanTransitionEnabled(transitionPreferences, runningTransitionName)) {
      previousAgentsRef.current = [];
      transitionRef.current = { ...runningTransition, duration: 0 };
      syncRenderWorkerPopulation();
      window.clearTimeout(transitionTimerRef.current);
      setCinematicMask(false);
      delete document.documentElement.dataset.oceanTransition;
    }

    const transitionName = `${previousBiome}-${biome}`;
    const transitionEnabled = previousBiome === biome
      || isOceanTransitionEnabled(transitionPreferences, transitionName);
    const duration = previousBiome === biome
      ? 0.38
      : transitionEnabled
        ? resolveBiomeTransitionDuration(previousBiome, biome)
        : 0;

    if (previousBiome !== biome) {
      window.clearTimeout(transitionTimerRef.current);
      delete document.documentElement.dataset.oceanTransition;

      if (transitionEnabled) {
        setCinematicMask(true);
        document.documentElement.dataset.oceanTransition = transitionName;
        window.dispatchEvent(new CustomEvent("portfolio:ocean-transition", {
          detail: { from: previousBiome, to: biome, duration },
        }));
        transitionTimerRef.current = window.setTimeout(() => {
          setCinematicMask(false);
          if (document.documentElement.dataset.oceanTransition === transitionName) {
            delete document.documentElement.dataset.oceanTransition;
          }
        }, Math.ceil(duration * 1000 + 180));
      }
    }

    if (!agentsRef.current.length) {
      rebuildPopulation(biome);
    } else if (previousBiome !== biome || agentsRef.current.length !== population) {
      previousAgentsRef.current = transitionEnabled ? agentsRef.current : [];
      agentsRef.current = createMarinePopulation(population, biome, 0x5183 + population * 13 + BIOME_ORDER.indexOf(biome) * 97);
      marineWorkerDeltaRef.current = 0;
      marineWorkerRef.current?.sync(agentsRef.current);
      transitionRef.current = {
        from: previousBiome,
        to: biome,
        startedAt: elapsedRef.current,
        duration,
      };
      syncRenderWorkerPopulation();
    }

    return () => {
      window.clearTimeout(transitionTimerRef.current);
      setCinematicMask(false);
      if (document.documentElement.dataset.oceanTransition === transitionName) delete document.documentElement.dataset.oceanTransition;
    };
  }, [biome, population, rebuildPopulation, setCinematicMask, syncRenderWorkerPopulation, transitionPreferences]);

  useEffect(() => {
    const handleVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleVolcano = (event) => {
      if (event.detail?.reaction) dangerRef.current = 1.35;
    };
    window.addEventListener("portfolio:volcano-stage", handleVolcano);
    return () => window.removeEventListener("portfolio:volcano-stage", handleVolcano);
  }, []);

  useEffect(() => {
    const directorOwner = Symbol("ocean-world-director");
    const observed = new Set();
    const outroObserved = new Set();
    const worldGeometry = new Map();
    let verificationFrame = 0;
    let verificationTimer = 0;
    let resizeFrame = 0;
    let geometryDirty = true;
    let pendingGeometryMeasure = false;

    const getScrollTop = () => getScrollFrameSnapshot().scrollTop;

    const commitBiome = (nextBiome) => {
      if (!nextBiome || activeWorldDirectorOwner !== directorOwner) return;
      // Keep the marker observable without mutating <html> when the value is
      // already correct. No-op dataset writes still trigger document-wide
      // selector invalidation on a large portfolio DOM.
      if (document.documentElement.dataset.oceanBiome !== nextBiome) {
        document.documentElement.dataset.oceanBiome = nextBiome;
      }
      if (nextBiome === biomeRef.current) return;
      window.__portfolioOceanBiome = nextBiome;
      window.dispatchEvent(new CustomEvent("portfolio:ocean-biome", {
        detail: { biome: nextBiome },
      }));
      biomeRef.current = nextBiome;
      setBiome(nextBiome);
    };

    const measureWorldGeometry = () => {
      const scrollTop = getScrollTop();
      for (const id of OBSERVED_SECTIONS) {
        const target = document.getElementById(id);
        if (!target?.isConnected) {
          worldGeometry.delete(id);
          continue;
        }
        const rect = target.getBoundingClientRect();
        worldGeometry.set(id, {
          documentTop: rect.top + scrollTop,
          height: rect.height,
        });
      }
      geometryDirty = false;
    };

    const resolveOutroVisibility = (scrollTop) => {
      const geometry = worldGeometry.get("ocean-outro");
      if (!geometry) return false;

      const top = geometry.documentTop - scrollTop;
      const bottom = top + geometry.height;
      const viewportHeight = Math.max(1, window.innerHeight);
      return top < viewportHeight * 0.84 && bottom > 0;
    };

    const selectViewportBiome = ({ remeasure = false } = {}) => {
      if (remeasure || geometryDirty) measureWorldGeometry();
      const scrollTop = getScrollTop();
      outroVisibleRef.current = resolveOutroVisibility(scrollTop);
      const nextBiome = outroVisibleRef.current
        ? OCEAN_BIOMES.OUTRO
        : chooseBiome(worldGeometry, biomeRef.current, scrollTop);
      commitBiome(nextBiome);
      return nextBiome;
    };

    // IntersectionObserver remains the primary trigger. Geometry snapshots are
    // kept in document coordinates so verification never needs a synchronous
    // layout read after style/animation writes. The original double-RAF + 120ms
    // reconciliation cadence is preserved to keep world hand-offs identical.
    const scheduleBandVerification = ({ remeasure = false } = {}) => {
      pendingGeometryMeasure = pendingGeometryMeasure || remeasure;
      window.cancelAnimationFrame(verificationFrame);
      window.clearTimeout(verificationTimer);
      verificationFrame = window.requestAnimationFrame(() => {
        const shouldMeasure = pendingGeometryMeasure;
        pendingGeometryMeasure = false;
        selectViewportBiome({ remeasure: shouldMeasure });
        verificationFrame = window.requestAnimationFrame(selectViewportBiome);
      });
      verificationTimer = window.setTimeout(selectViewportBiome, 120);
    };

    const handleObservedGeometry = () => {
      selectViewportBiome();
      scheduleBandVerification();
    };

    const observer = new IntersectionObserver(handleObservedGeometry, {
      rootMargin: "-48% 0px -48% 0px",
      threshold: [0, 0.01],
    });

    // A broad observer catches direct jumps/lazy mounts and commits the
    // viewport-centred world immediately before scheduling verification.
    const visibilityObserver = new IntersectionObserver(handleObservedGeometry, {
      rootMargin: "18% 0px 18% 0px",
      threshold: [0, 0.01, 0.25, 0.5],
    });

    // The mine/footer is deliberately much shorter than a viewport. At the
    // maximum scroll position its centre remains below the viewport focus, so
    // the generic band observer cannot ever select it reliably.
    const outroObserver = new IntersectionObserver(() => {
      selectViewportBiome();
    }, {
      rootMargin: "0px 0px -16% 0px",
      threshold: [0, 0.01],
    });

    // `scrollend` is a low-frequency reconciliation hook, not a scroll-driven
    // animation source. Cached document geometry makes this path layout-free.
    const handleScrollEnd = () => {
      selectViewportBiome();
      scheduleBandVerification();
    };

    const handleExplicitReconcile = () => {
      selectViewportBiome();
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          geometryDirty = true;
          scheduleBandVerification({ remeasure: true });
        })
      : null;

    const scheduleViewportMeasure = () => {
      geometryDirty = true;
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        scheduleBandVerification({ remeasure: true });
      });
    };

    const discoverSections = () => {
      let discovered = false;
      for (const id of OBSERVED_SECTIONS) {
        const target = document.getElementById(id);
        if (!target || observed.has(target)) continue;
        observed.add(target);
        observer.observe(target);
        visibilityObserver.observe(target);
        resizeObserver?.observe(target);
        discovered = true;
        if (id === "ocean-outro" && !outroObserved.has(target)) {
          outroObserved.add(target);
          outroObserver.observe(target);
        }
      }
      if (discovered) {
        geometryDirty = true;
        scheduleBandVerification({ remeasure: true });
      }
    };

    const handleWorldMounted = () => discoverSections();
    activeWorldDirectorOwner = directorOwner;
    document.documentElement.dataset.oceanDirectorReady = "true";
    discoverSections();
    window.addEventListener(OCEAN_WORLD_MOUNTED_EVENT, handleWorldMounted);
    window.addEventListener(OCEAN_WORLD_RECONCILE_EVENT, handleExplicitReconcile);
    window.addEventListener("scrollend", handleScrollEnd, { passive: true });
    window.addEventListener("resize", scheduleViewportMeasure, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleViewportMeasure, { passive: true });
    measureWorldGeometry();
    selectViewportBiome();

    return () => {
      window.removeEventListener(OCEAN_WORLD_MOUNTED_EVENT, handleWorldMounted);
      window.removeEventListener(OCEAN_WORLD_RECONCILE_EVENT, handleExplicitReconcile);
      window.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("resize", scheduleViewportMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleViewportMeasure);
      observer.disconnect();
      visibilityObserver.disconnect();
      outroObserver.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(verificationFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.clearTimeout(verificationTimer);
      outroVisibleRef.current = false;
      // React may mount a replacement director before an older effect cleanup
      // is flushed. Defer document cleanup by one microtask and only let the
      // instance that still owns the markers remove them.
      queueMicrotask(() => {
        if (activeWorldDirectorOwner !== directorOwner) return;
        activeWorldDirectorOwner = null;
        delete window.__portfolioOceanBiome;
        delete document.documentElement.dataset.oceanDirectorReady;
        delete document.documentElement.dataset.oceanBiome;
        delete document.documentElement.dataset.oceanTransition;
      });
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || renderBackend === "pending") return undefined;
    const workerOwned = renderBackend === "worker" && renderWorkerOwnedRef.current;
    const transferredToWorker = renderTransferredCanvasRef.current === canvas;
    // Never ask the DOM canvas for a context after transferControlToOffscreen().
    // This is an irreversible browser invariant, including during async worker
    // fallback races. A fresh keyed canvas is mounted before main rendering.
    if (transferredToWorker && !workerOwned) return undefined;
    const context = workerOwned ? null : canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!workerOwned && !context) return undefined;
    const canvasLease = registerRuntimeResource({ owner: "GlobalAquarium", type: "canvas", label: "ocean-world" });
    const rafLease = registerRuntimeResource({ owner: "GlobalAquarium", type: "raf", label: "ocean-paint-loop" });

    let resizeFrame = 0;
    let wakeTimer = 0;

    const applyResize = () => {
      resizeFrame = 0;
      if (workerOwned) {
        const width = Math.max(1, window.innerWidth);
        const height = Math.max(1, window.innerHeight);
        viewportRef.current = { width, height, dpr };
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        renderWorkerRef.current?.postMessage({ type: "resize", viewport: viewportRef.current });
      } else {
        viewportRef.current = resizeCanvas(canvas, dpr);
        context.imageSmoothingEnabled = true;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      canvasLease.update({
        estimatedBytes: Math.round(viewportRef.current.width * dpr) * Math.round(viewportRef.current.height * dpr) * 4,
        metadata: { width: viewportRef.current.width, height: viewportRef.current.height, dpr, backend: workerOwned ? "offscreen-worker" : "main" },
      });
    };
    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(applyResize);
    };
    applyResize();
    window.addEventListener("resize", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleResize, { passive: true });

    if (!agentsRef.current.length) rebuildPopulation();

    const targetFps = Math.min(
      resolveAquariumFps(runtimeQuality, performanceMode, isMobile),
      Number(runtimeBudget?.aquariumFps || Infinity),
    );
    const minimumFrameMs = 1000 / Math.max(1, targetFps);

    const schedulePaint = (delayMs = 0) => {
      if (!active || reducedMotion) return;
      window.clearTimeout(wakeTimer);
      const request = () => {
        wakeTimer = 0;
        if (!active || rafRef.current) return;
        rafRef.current = window.requestAnimationFrame(paint);
      };
      if (delayMs > 4) wakeTimer = window.setTimeout(request, Math.max(0, delayMs - 4));
      else request();
    };

    const paint = (timestamp) => {
      rafRef.current = 0;
      if (!reducedMotion && lastFrameRef.current && timestamp - lastFrameRef.current < minimumFrameMs) {
        schedulePaint(minimumFrameMs - (timestamp - lastFrameRef.current));
        return;
      }
      const previous = lastFrameRef.current || timestamp;
      const delta = Math.min(0.05, Math.max(1 / 240, (timestamp - previous) / 1000));
      lastFrameRef.current = timestamp;
      elapsedRef.current += delta;
      dangerRef.current = Math.max(0, dangerRef.current - delta * 0.72);

      const viewport = viewportRef.current;
      if (!workerOwned) context.clearRect(0, 0, viewport.width, viewport.height);

      const profile = BIOME_PROFILES[biomeRef.current] ?? BIOME_PROFILES.surface;
      const transition = transitionRef.current;
      const transitionProgress = transition.duration > 0
        ? Math.min(1, Math.max(0, (elapsedRef.current - transition.startedAt) / transition.duration))
        : 1;
      const easedTransition = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
      if (!reducedMotion) {
        const danger = { danger: dangerRef.current, dangerX: 0.5, dangerY: 0.56 };
        const workerRuntime = marineWorkerRef.current;
        const workerStatus = workerRuntime?.getStatus();
        if (workerRuntime && !workerStatus?.failed && runtimeBudget?.workerSimulation) {
          marineWorkerDeltaRef.current = Math.min(0.05, marineWorkerDeltaRef.current + delta);
          const submitted = workerRuntime.step({
            delta: marineWorkerDeltaRef.current,
            elapsed: elapsedRef.current,
            biome: biomeRef.current,
            danger,
          });
          if (submitted) marineWorkerDeltaRef.current = 0;
        } else {
          stepMarinePopulation(agentsRef.current, delta, elapsedRef.current, biomeRef.current, danger);
        }
        // The previous biome is fully masked for the entire cinematic. Keep
        // the new biome simulation time-correct, but do not spend CPU stepping
        // a population whose pixels are forced to opacity:0 and discarded at
        // transition completion.
        if (!cinematicRef.current && transitionProgress < 1 && previousAgentsRef.current.length) {
          stepMarinePopulation(previousAgentsRef.current, delta, elapsedRef.current, transition.from, danger);
        }
      }
      if (transitionProgress < 1 && previousAgentsRef.current.length) {
        const previousProfile = BIOME_PROFILES[transition.from] ?? BIOME_PROFILES.surface;
        if (!workerOwned) {
          for (const agent of previousAgentsRef.current) {
            drawAgent(context, agent, viewport, elapsedRef.current, previousProfile.visibility * (1 - easedTransition));
          }
        }
      } else if (previousAgentsRef.current.length) {
        previousAgentsRef.current = [];
        syncRenderWorkerPopulation();
      }
      if (workerOwned && !cinematicRef.current) {
        const currentCount = agentsRef.current.length;
        const previousCount = transitionProgress < 1 ? previousAgentsRef.current.length : 0;
        const neededFloats = Math.max(1, (currentCount + previousCount) * 3);
        let buffer = renderWorkerBuffersRef.current.pop();
        if (!buffer || buffer.byteLength < neededFloats * Float32Array.BYTES_PER_ELEMENT) {
          buffer = new ArrayBuffer(neededFloats * Float32Array.BYTES_PER_ELEMENT);
        }
        const state = new Float32Array(buffer, 0, neededFloats);
        writeAquariumRenderState(state, agentsRef.current, previousCount ? previousAgentsRef.current : []);
        renderWorkerRef.current?.postMessage({
          type: "frame",
          buffer,
          elapsed: elapsedRef.current,
          biome: biomeRef.current,
          previousBiome: transition.from,
          transitionProgress: easedTransition,
          currentCount,
          previousCount,
          rareEvents: !isMobile && !reducedMotion && runtimeQuality !== "constrained" && runtimeBudget?.rareOceanEvents !== false,
        }, [buffer]);
      } else if (!workerOwned && !cinematicRef.current) {
        for (const agent of agentsRef.current) {
          drawAgent(context, agent, viewport, elapsedRef.current, profile.visibility * easedTransition);
        }

        if (!isMobile && !reducedMotion && runtimeQuality !== "constrained" && runtimeBudget?.rareOceanEvents !== false) {
          drawRareEvent(context, resolveRareOceanEvent(elapsedRef.current), viewport);
        }
      }

      if (active && !reducedMotion) schedulePaint(minimumFrameMs);
    };

    if (active) {
      if (reducedMotion) paint(performance.now());
      else schedulePaint();
    }

    return () => {
      window.clearTimeout(wakeTimer);
      cancelAnimationFrame(rafRef.current);
      window.cancelAnimationFrame(resizeFrame);
      lastFrameRef.current = 0;
      rafLease.release();
      canvasLease.release();
      window.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
    };
  }, [active, dpr, isMobile, performanceMode, rebuildPopulation, reducedMotion, renderBackend, runtimeBudget?.aquariumFps, runtimeBudget?.rareOceanEvents, runtimeBudget?.workerSimulation, runtimeQuality, syncRenderWorkerPopulation]);

  return (
    <div
      ref={rootRef}
      className={`global-aquarium ocean-world-runtime${paused ? " is-paused" : ""}`}
      data-biome={biome}
      data-render-backend={renderBackend}
      data-simulation-fps={Math.min(resolveAquariumFps(runtimeQuality, performanceMode, isMobile), Number(runtimeBudget?.aquariumFps || Infinity))}
      aria-hidden="true"
    >
      <div className="ocean-biome-transition-layer" data-world-director="intersection-viewport-center">
        <span className="ocean-biome-haze" />
        <span className="ocean-biome-mineral" />
        <span className="ocean-biome-project-light" />
        <span className="ocean-biome-surface-light" />
        <span className="ocean-transition-thermocline" />
        <span className="ocean-transition-hydrothermal">
          <i /><i /><i /><i />
        </span>
        <span className="ocean-transition-data-cooling">
          {Array.from({ length: 12 }, (_, index) => (
            <i
              key={`cooling-node-${index}`}
              style={{
                "--transition-x": `${8 + index * 7.4}%`,
                "--transition-y": `${72 - (index % 4) * 13}%`,
                "--transition-delay": `${index * 0.035}s`,
              }}
            />
          ))}
        </span>
      </div>
      <canvas key={canvasEpoch} ref={canvasRef} className="ocean-world-canvas" />
    </div>
  );
}
