import { scheduleBackgroundTask } from "./runtimeScheduler.js";

function resolveViewport(canvas, runtimeQuality) {
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    runtimeQuality === "constrained" ? 0.9 : runtimeQuality === "balanced" ? 1.05 : 1.2,
  );
  const viewport = {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
    dpr,
  };
  canvas.width = Math.max(1, Math.round(viewport.width * dpr));
  canvas.height = Math.max(1, Math.round(viewport.height * dpr));
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  return viewport;
}

export function scheduleOceanTransitionOffscreen(canvas, runtimeQuality, signal) {
  return scheduleBackgroundTask(() => {
    const viewport = resolveViewport(canvas, runtimeQuality);
    const worker = new Worker(new URL("../workers/oceanTransitionRender.worker.js", import.meta.url), { type: "module" });
    try {
      const offscreen = canvas.transferControlToOffscreen();
      worker.postMessage({ type: "init", canvas: offscreen, viewport }, [offscreen]);
      return { worker, viewport };
    } catch (error) {
      worker.terminate();
      throw error;
    }
  }, { delay: 120, signal });
}
