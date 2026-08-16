import { useEffect, useRef, useState } from "react";
import { OCEAN_CINEMATIC_DURATIONS_MS } from "../ocean/oceanTransitionTimings";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { isOceanTransitionEnabled } from "../animations/oceanTransitionPreferences";
import {
  clamp01,
  createRockShards,
  createSceneParticles,
  drawScene,
  resizeCanvas,
  sceneFade,
} from "../rendering/oceanTransitionRenderer";

export default function OceanTransitionStage({ reducedMotion = false, performanceMode = "full", paused = false, runtimeQuality = "high" }) {
  const { transitionPreferences } = useAnimationPreferences();
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const workerRef = useRef(null);
  const workerOwnedCanvasRef = useRef(false);
  const viewportRef = useRef({ width: 1, height: 1, dpr: 1 });
  const runtimeQualityRef = useRef(runtimeQuality);
  const offscreenAllowedAtMountRef = useRef(!reducedMotion && !["lite", "ultra-lite"].includes(performanceMode));
  const [scene, setScene] = useState(null);

  useEffect(() => {
    runtimeQualityRef.current = runtimeQuality;
  }, [runtimeQuality]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreenAllowedAtMountRef.current) return undefined;
    if (typeof Worker === "undefined" || typeof canvas.transferControlToOffscreen !== "function") return undefined;

    const controller = new AbortController();
    let disposed = false;
    let worker = null;

    import("../performance/oceanTransitionOffscreenController.js")
      .then(({ scheduleOceanTransitionOffscreen }) => (
        scheduleOceanTransitionOffscreen(canvas, runtimeQualityRef.current, controller.signal)
      ))
      .then((result) => {
        if (!result) return;
        if (disposed || controller.signal.aborted) {
          result.worker.terminate();
          return;
        }
        worker = result.worker;
        viewportRef.current = result.viewport;
        workerRef.current = worker;
        workerOwnedCanvasRef.current = true;
        canvas.dataset.renderThread = "worker";
      })
      .catch(() => {
        if (disposed) return;
        workerRef.current = null;
        workerOwnedCanvasRef.current = false;
        canvas.dataset.renderThread = "main";
      });

    return () => {
      disposed = true;
      controller.abort();
      worker?.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      workerOwnedCanvasRef.current = false;
    };
  }, []);


  useEffect(() => {
    const handleTransition = (event) => {
      const from = event.detail?.from;
      const to = event.detail?.to;
      if (!from || !to || from === to) return;
      const key = `${from}-${to}`;
      if (!OCEAN_CINEMATIC_DURATIONS_MS[key] || !isOceanTransitionEnabled(transitionPreferences, key)) return;
      setScene({ key, token: performance.now() });
    };
    window.addEventListener("portfolio:ocean-transition", handleTransition);
    return () => window.removeEventListener("portfolio:ocean-transition", handleTransition);
  }, [transitionPreferences]);

  const enabledScene = scene && isOceanTransitionEnabled(transitionPreferences, scene.key) ? scene : null;

  useEffect(() => {
    if (!scene || enabledScene) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      setScene((current) => current?.token === scene.token ? null : current);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [enabledScene, scene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabledScene || reducedMotion || paused || ["lite", "ultra-lite"].includes(performanceMode)) return undefined;

    const count = runtimeQuality === "constrained" ? 18 : runtimeQuality === "balanced" ? 28 : 40;
    const shardCount = runtimeQuality === "constrained" ? 8 : runtimeQuality === "balanced" ? 12 : 16;
    const seed = Math.round(enabledScene.token) ^ enabledScene.key.length * 131;
    const duration = OCEAN_CINEMATIC_DURATIONS_MS[enabledScene.key] ?? 760;
    const startedAt = performance.now();
    let disposed = false;
    let context = null;
    let particles = null;
    let shards = null;

    const worker = workerRef.current;
    const useWorker = Boolean(workerOwnedCanvasRef.current && worker);
    if (!useWorker) {
      context = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!context) return undefined;
      viewportRef.current = resizeCanvas(canvas, runtimeQuality);
      particles = createSceneParticles(count, seed);
      shards = createRockShards(shardCount, seed);
    } else {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        runtimeQuality === "constrained" ? 0.9 : runtimeQuality === "balanced" ? 1.05 : 1.2,
      );
      const viewport = { width: Math.max(1, window.innerWidth), height: Math.max(1, window.innerHeight), dpr };
      viewportRef.current = viewport;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      worker.postMessage({ type: "resize", viewport });
      worker.postMessage({ type: "prepare", key: enabledScene.key, count, shardCount, seed });
    }

    document.documentElement.dataset.oceanCinematic = enabledScene.key;

    const resize = () => {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        runtimeQuality === "constrained" ? 0.9 : runtimeQuality === "balanced" ? 1.05 : 1.2,
      );
      const viewport = { width: Math.max(1, window.innerWidth), height: Math.max(1, window.innerHeight), dpr };
      viewportRef.current = viewport;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      if (useWorker) worker.postMessage({ type: "resize", viewport });
      else viewportRef.current = resizeCanvas(canvas, runtimeQuality);
    };
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });

    const paint = (now) => {
      if (disposed) return;
      const progress = clamp01((now - startedAt) / duration);
      const viewport = viewportRef.current;

      if (useWorker) {
        worker.postMessage({ type: "frame", key: enabledScene.key, progress, alpha: sceneFade(progress), viewport });
      } else {
        context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);
        context.save();
        context.globalAlpha = sceneFade(progress);
        drawScene(context, enabledScene.key, viewport, progress, particles, shards);
        context.restore();
      }

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(paint);
      } else {
        if (useWorker) worker.postMessage({ type: "clear", viewport });
        else context.clearRect(0, 0, viewport.width, viewport.height);
        if (document.documentElement.dataset.oceanCinematic === enabledScene.key) delete document.documentElement.dataset.oceanCinematic;
        setScene((current) => current?.token === enabledScene.token ? null : current);
      }
    };

    rafRef.current = window.requestAnimationFrame(paint);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      if (useWorker) worker.postMessage({ type: "clear", viewport: viewportRef.current });
      if (document.documentElement.dataset.oceanCinematic === enabledScene.key) delete document.documentElement.dataset.oceanCinematic;
    };
  }, [enabledScene, paused, performanceMode, reducedMotion, runtimeQuality]);

  return (
    <canvas
      ref={canvasRef}
      className={`ocean-transition-stage${enabledScene ? " is-active" : ""}`}
      data-cinematic={enabledScene?.key ?? "idle"}
      data-reveal-engine="cinematic-world-reveal"
      data-render-thread="main"
      aria-hidden="true"
    />
  );
}
