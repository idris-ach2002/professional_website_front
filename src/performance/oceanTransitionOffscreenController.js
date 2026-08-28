import { scheduleBackgroundTask } from "./runtimeScheduler.js";


export function createOceanTransitionFramePump(worker, sceneToken) {
  let disposed = false;
  let inFlight = false;
  let pendingFrame = null;
  let sequence = 0;
  const collectStats = import.meta.env.DEV;
  const stats = { requested: 0, sent: 0, rendered: 0, coalesced: 0, maxBacklog: 0 };

  const sendFrame = (frame) => {
    inFlight = true;
    sequence += 1;
    if (collectStats) stats.sent += 1;
    worker.postMessage({
      type: "frame",
      ...frame,
      sceneToken,
      sequence,
    });
  };

  const handleMessage = (event) => {
    const message = event.data ?? {};
    if (message.type !== "frame-rendered" || message.sceneToken !== sceneToken) return;

    inFlight = false;
    if (collectStats) stats.rendered += 1;
    if (disposed || !pendingFrame) return;

    const nextFrame = pendingFrame;
    pendingFrame = null;
    sendFrame(nextFrame);
  };

  worker.addEventListener("message", handleMessage);

  return {
    postFrame(frame) {
      if (disposed) return false;
      if (collectStats) stats.requested += 1;
      if (inFlight) {
        if (collectStats) {
          if (pendingFrame) stats.coalesced += 1;
          stats.maxBacklog = Math.max(stats.maxBacklog, 1);
        }
        pendingFrame = frame;
        return false;
      }
      sendFrame(frame);
      return true;
    },
    clearPending() {
      pendingFrame = null;
    },
    getStats() {
      return { ...stats };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pendingFrame = null;
      worker.removeEventListener("message", handleMessage);
    },
  };
}

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
      return {
        worker,
        viewport,
        createFramePump: (sceneToken) => createOceanTransitionFramePump(worker, sceneToken),
      };
    } catch (error) {
      worker.terminate();
      throw error;
    }
  }, { delay: 120, signal });
}
