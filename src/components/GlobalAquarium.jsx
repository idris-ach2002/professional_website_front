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

function chooseBiome(targets, currentBiome) {
  const focusY = Math.max(1, window.innerHeight) * 0.5;
  const anchors = [];

  for (const target of targets) {
    if (!target?.isConnected || !OCEAN_WORLD_ANCHOR_IDS.includes(target.id)) continue;
    const rect = target.getBoundingClientRect();
    if (!Number.isFinite(rect.top)) continue;
    anchors.push({ id: target.id, top: rect.top });
  }

  return resolveViewportBiome(anchors, currentBiome, focusY);
}

function collectMountedWorldTargets() {
  const targets = [];
  for (const id of OBSERVED_SECTIONS) {
    const target = document.getElementById(id);
    if (target) targets.push(target);
  }
  return targets;
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
  const canvasRef = useRef(null);
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

  const rebuildPopulation = useCallback((targetBiome = biomeRef.current) => {
    agentsRef.current = createMarinePopulation(population, targetBiome, 0x5183 + population * 13);
    marineWorkerDeltaRef.current = 0;
    marineWorkerRef.current?.sync(agentsRef.current);
  }, [population]);

  useEffect(() => {
    markRuntimeOwnerMounted("GlobalAquarium");
    return () => markRuntimeOwnerUnmounted("GlobalAquarium");
  }, []);

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
      window.clearTimeout(transitionTimerRef.current);
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
        document.documentElement.dataset.oceanTransition = transitionName;
        window.dispatchEvent(new CustomEvent("portfolio:ocean-transition", {
          detail: { from: previousBiome, to: biome, duration },
        }));
        transitionTimerRef.current = window.setTimeout(() => {
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
    }

    return () => {
      window.clearTimeout(transitionTimerRef.current);
      if (document.documentElement.dataset.oceanTransition === transitionName) delete document.documentElement.dataset.oceanTransition;
    };
  }, [biome, population, rebuildPopulation, transitionPreferences]);

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
    let verificationFrame = 0;
    let verificationTimer = 0;

    const commitBiome = (nextBiome) => {
      if (!nextBiome || activeWorldDirectorOwner !== directorOwner) return;
      // Reassert the observable decision even when the logical biome is
      // unchanged. A React effect cleanup must never be able to leave the
      // document without its current world marker.
      document.documentElement.dataset.oceanBiome = nextBiome;
      if (nextBiome === biomeRef.current) return;
      biomeRef.current = nextBiome;
      setBiome(nextBiome);
    };

    const resolveOutroVisibility = () => {
      const outro = document.getElementById("ocean-outro");
      if (!outro?.isConnected) return false;

      const rect = outro.getBoundingClientRect();
      const viewportHeight = Math.max(1, window.innerHeight);
      return rect.top < viewportHeight * 0.84 && rect.bottom > 0;
    };

    const selectViewportBiome = () => {
      outroVisibleRef.current = resolveOutroVisibility();
      const nextBiome = outroVisibleRef.current
        ? OCEAN_BIOMES.OUTRO
        : chooseBiome(collectMountedWorldTargets(), biomeRef.current);
      commitBiome(nextBiome);
      return nextBiome;
    };

    // IntersectionObserver remains the primary trigger. Geometry is verified
    // again after layout settles, but world choice is based on the viewport
    // centre rather than stale observer ratios or decorative overlap.
    const scheduleBandVerification = () => {
      window.cancelAnimationFrame(verificationFrame);
      window.clearTimeout(verificationTimer);
      verificationFrame = window.requestAnimationFrame(() => {
        selectViewportBiome();
        verificationFrame = window.requestAnimationFrame(selectViewportBiome);
      });
      verificationTimer = window.setTimeout(selectViewportBiome, 120);
    };

    const observer = new IntersectionObserver(() => {
      selectViewportBiome();
      scheduleBandVerification();
    }, {
      rootMargin: "-48% 0px -48% 0px",
      threshold: [0, 0.01],
    });

    // A broad observer catches direct jumps/lazy mounts and commits the
    // viewport-centred world immediately before scheduling verification.
    const visibilityObserver = new IntersectionObserver(() => {
      selectViewportBiome();
      scheduleBandVerification();
    }, {
      rootMargin: "18% 0px 18% 0px",
      threshold: [0, 0.01, 0.25, 0.5],
    });

    // The mine/footer is deliberately much shorter than a viewport. At the
    // maximum scroll position its centre remains below the viewport focus, so
    // the generic band observer cannot ever select it reliably. Observe the
    // actual footer in the lower viewport instead; this also handles direct
    // scrollIntoView/hash jumps consistently in Chromium and Firefox.
    const outroObserver = new IntersectionObserver(() => {
      selectViewportBiome();
    }, {
      rootMargin: "0px 0px -16% 0px",
      threshold: [0, 0.01],
    });

    // `scrollend` is a low-frequency reconciliation hook, not a scroll-driven
    // animation source. It is especially useful for instant anchor/scrollIntoView
    // navigation when a browser delays IntersectionObserver delivery under load.
    const handleScrollEnd = () => {
      selectViewportBiome();
      scheduleBandVerification();
    };

    const handleExplicitReconcile = () => {
      selectViewportBiome();
    };

    const discoverSections = () => {
      for (const id of OBSERVED_SECTIONS) {
        const target = document.getElementById(id);
        if (!target || observed.has(target)) continue;
        observed.add(target);
        observer.observe(target);
        visibilityObserver.observe(target);
        scheduleBandVerification();
        if (id === "ocean-outro" && !outroObserved.has(target)) {
          outroObserved.add(target);
          outroObserver.observe(target);
        }
      }
    };

    const handleWorldMounted = () => discoverSections();
    discoverSections();
    window.addEventListener(OCEAN_WORLD_MOUNTED_EVENT, handleWorldMounted);
    window.addEventListener(OCEAN_WORLD_RECONCILE_EVENT, handleExplicitReconcile);
    window.addEventListener("scrollend", handleScrollEnd, { passive: true });
    activeWorldDirectorOwner = directorOwner;
    document.documentElement.dataset.oceanDirectorReady = "true";
    selectViewportBiome();

    return () => {
      window.removeEventListener(OCEAN_WORLD_MOUNTED_EVENT, handleWorldMounted);
      window.removeEventListener(OCEAN_WORLD_RECONCILE_EVENT, handleExplicitReconcile);
      window.removeEventListener("scrollend", handleScrollEnd);
      observer.disconnect();
      visibilityObserver.disconnect();
      outroObserver.disconnect();
      window.cancelAnimationFrame(verificationFrame);
      window.clearTimeout(verificationTimer);
      outroVisibleRef.current = false;
      // React may mount a replacement director before an older effect cleanup
      // is flushed. Defer document cleanup by one microtask and only let the
      // instance that still owns the markers remove them.
      queueMicrotask(() => {
        if (activeWorldDirectorOwner !== directorOwner) return;
        activeWorldDirectorOwner = null;
        delete document.documentElement.dataset.oceanDirectorReady;
        delete document.documentElement.dataset.oceanBiome;
        delete document.documentElement.dataset.oceanTransition;
      });
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return undefined;
    const canvasLease = registerRuntimeResource({ owner: "GlobalAquarium", type: "canvas", label: "ocean-world" });
    const rafLease = registerRuntimeResource({ owner: "GlobalAquarium", type: "raf", label: "ocean-paint-loop" });

    const resize = () => {
      viewportRef.current = resizeCanvas(canvas, dpr);
      canvasLease.update({
        estimatedBytes: canvas.width * canvas.height * 4,
        metadata: { width: canvas.width, height: canvas.height, dpr },
      });
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });

    if (!agentsRef.current.length) rebuildPopulation();

    const targetFps = Math.min(
      resolveAquariumFps(runtimeQuality, performanceMode, isMobile),
      Number(runtimeBudget?.aquariumFps || Infinity),
    );
    const minimumFrameMs = 1000 / Math.max(1, targetFps);

    const paint = (timestamp) => {
      if (!reducedMotion && lastFrameRef.current && timestamp - lastFrameRef.current < minimumFrameMs) {
        if (active) rafRef.current = requestAnimationFrame(paint);
        return;
      }
      const previous = lastFrameRef.current || timestamp;
      const delta = Math.min(0.05, Math.max(1 / 240, (timestamp - previous) / 1000));
      lastFrameRef.current = timestamp;
      elapsedRef.current += delta;
      dangerRef.current = Math.max(0, dangerRef.current - delta * 0.72);

      const viewport = viewportRef.current;
      context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);
      context.imageSmoothingEnabled = true;

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
        if (transitionProgress < 1 && previousAgentsRef.current.length) {
          stepMarinePopulation(previousAgentsRef.current, delta, elapsedRef.current, transition.from, danger);
        }
      }
      if (transitionProgress < 1 && previousAgentsRef.current.length) {
        const previousProfile = BIOME_PROFILES[transition.from] ?? BIOME_PROFILES.surface;
        for (const agent of previousAgentsRef.current) {
          drawAgent(context, agent, viewport, elapsedRef.current, previousProfile.visibility * (1 - easedTransition));
        }
      } else if (previousAgentsRef.current.length) {
        previousAgentsRef.current = [];
      }
      for (const agent of agentsRef.current) {
        drawAgent(context, agent, viewport, elapsedRef.current, profile.visibility * easedTransition);
      }

      if (!isMobile && !reducedMotion && runtimeQuality !== "constrained" && runtimeBudget?.rareOceanEvents !== false) {
        drawRareEvent(context, resolveRareOceanEvent(elapsedRef.current), viewport);
      }

      if (active && !reducedMotion) rafRef.current = requestAnimationFrame(paint);
    };

    if (active) {
      if (reducedMotion) paint(performance.now());
      else rafRef.current = requestAnimationFrame(paint);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      rafLease.release();
      canvasLease.release();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, [active, biome, dpr, isMobile, performanceMode, rebuildPopulation, reducedMotion, runtimeBudget?.aquariumFps, runtimeBudget?.rareOceanEvents, runtimeBudget?.workerSimulation, runtimeQuality]);

  return (
    <div
      className={`global-aquarium ocean-world-runtime${paused ? " is-paused" : ""}`}
      data-biome={biome}
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
      <canvas ref={canvasRef} className="ocean-world-canvas" />
    </div>
  );
}
