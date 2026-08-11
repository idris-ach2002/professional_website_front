import { useEffect, useMemo, useRef, useState } from "react";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { analyzePerformanceWindow, compareRuntimeQuality } from "./performanceMetrics";
import PerformanceRuntimeContext from "./performanceRuntimeContextValue";
import {
  scheduleBackgroundTask,
  scheduleTask,
  scheduleUserVisibleTask,
  TASK_PRIORITIES,
  yieldToMain,
} from "./runtimeScheduler";

const FRAME_BUFFER_SIZE = 256;
const ANALYSIS_INTERVAL_MS = 1800;
const STARTUP_GRACE_MS = 2600;
const DEGRADE_WINDOWS = 2;
const RECOVER_WINDOWS = 4;
const INTERACTION_GUARD_MS = 320;

const E2E_RUNTIME_QUALITY = ["high", "balanced", "constrained"].includes(import.meta.env.VITE_E2E_RUNTIME_QUALITY)
  ? import.meta.env.VITE_E2E_RUNTIME_QUALITY
  : null;

function emptyPressureWindow() {
  return {
    count: 0,
    totalDuration: 0,
    maxDuration: 0,
  };
}

function recordPressure(target, entries) {
  for (const entry of entries) {
    const duration = Number(entry.duration || 0);
    target.count += 1;
    target.totalDuration += duration;
    target.maxDuration = Math.max(target.maxDuration, duration);
  }
}

function createWorker() {
  if (typeof Worker === "undefined") return null;
  try {
    return new Worker(new URL("./performanceRuntime.worker.js", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

export default function PerformanceRuntimeProvider({ children }) {
  const { animationsEnabled, animationsPaused, performanceMode } = useAnimationPreferences();
  const [runtimeQuality, setRuntimeQuality] = useState(() => E2E_RUNTIME_QUALITY ?? "high");
  const qualityRef = useRef(E2E_RUNTIME_QUALITY ?? "high");
  const metricsRef = useRef({
    recommendation: "high",
    estimatedHz: 0,
    sampleCount: 0,
  });
  const streakRef = useRef({ degrade: 0, recover: 0 });
  const interactionUntilRef = useRef(0);

  useEffect(() => {
    qualityRef.current = runtimeQuality;
    const root = document.documentElement;
    root.dataset.runtimeQuality = runtimeQuality;
    return () => {
      delete root.dataset.runtimeQuality;
    };
  }, [runtimeQuality]);

  useEffect(() => {
    const root = document.documentElement;
    const markInteraction = () => {
      interactionUntilRef.current = performance.now() + INTERACTION_GUARD_MS;
      root.dataset.runtimePriority = "user-blocking";
    };
    const clearInteraction = () => {
      if (performance.now() < interactionUntilRef.current) return;
      delete root.dataset.runtimePriority;
    };

    const interactionEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, { capture: true, passive: true });
    });
    const intervalId = window.setInterval(clearInteraction, 180);

    return () => {
      window.clearInterval(intervalId);
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction, { capture: true });
      });
      delete root.dataset.runtimePriority;
    };
  }, []);

  useEffect(() => {
    if (E2E_RUNTIME_QUALITY) {
      streakRef.current = { degrade: 0, recover: 0 };
      if (qualityRef.current !== E2E_RUNTIME_QUALITY) {
        qualityRef.current = E2E_RUNTIME_QUALITY;
        setRuntimeQuality(E2E_RUNTIME_QUALITY);
      }
      return undefined;
    }

    if (!animationsEnabled || animationsPaused || ["lite", "ultra-lite"].includes(performanceMode)) {
      streakRef.current = { degrade: 0, recover: 0 };
      if (qualityRef.current !== "constrained") {
        qualityRef.current = "constrained";
        setRuntimeQuality("constrained");
      }
      return undefined;
    }

    if (qualityRef.current === "constrained" && performanceMode === "full") {
      qualityRef.current = "high";
      setRuntimeQuality("high");
    } else if (qualityRef.current === "constrained" && performanceMode === "balanced") {
      qualityRef.current = "balanced";
      setRuntimeQuality("balanced");
    }

    const worker = createWorker();
    let workerFailed = false;
    let requestId = 0;
    let frameBuffer = new Float32Array(FRAME_BUFFER_SIZE);
    let frameCount = 0;
    let lastFrameAt = 0;
    let lastAnalysisAt = performance.now();
    const startedAt = lastAnalysisAt;
    let rafId = 0;
    let longTasks = emptyPressureWindow();
    let longAnimationFrames = emptyPressureWindow();
    const observers = [];

    const publishAnalysis = (analysis) => {
      if (!analysis || document.hidden) return;

      metricsRef.current = analysis;
      window.__portfolioPerformanceRuntime = analysis;
      const root = document.documentElement;
      root.dataset.runtimeEstimatedHz = String(analysis.estimatedHz || 0);
      root.dataset.runtimeDroppedFrames = String(Number(analysis.droppedFrameRatio || 0).toFixed(3));
      root.dataset.runtimeLongTasks = String(analysis.longTaskCount || 0);
      root.dataset.runtimeLoaf = String(analysis.longAnimationFrameCount || 0);

      const current = qualityRef.current;
      const recommendation = analysis.recommendation;
      const comparison = compareRuntimeQuality(recommendation, current);

      if (comparison < 0) {
        streakRef.current.recover = 0;
        streakRef.current.degrade += 1;
        if (analysis.urgent || streakRef.current.degrade >= DEGRADE_WINDOWS) {
          streakRef.current.degrade = 0;
          const nextQuality = recommendation === "constrained" ? "constrained" : "balanced";
          scheduleUserVisibleTask(() => {
            qualityRef.current = nextQuality;
            setRuntimeQuality(nextQuality);
          }).catch(() => {});
        }
        return;
      }

      if (comparison > 0) {
        streakRef.current.degrade = 0;
        streakRef.current.recover += 1;
        if (streakRef.current.recover >= RECOVER_WINDOWS) {
          streakRef.current.recover = 0;
          const nextQuality = current === "constrained" ? "balanced" : "high";
          scheduleBackgroundTask(() => {
            qualityRef.current = nextQuality;
            setRuntimeQuality(nextQuality);
          }).catch(() => {});
        }
        return;
      }

      streakRef.current = { degrade: 0, recover: 0 };
    };

    if (worker) {
      worker.addEventListener("message", (event) => {
        const message = event.data;
        if (message?.type === "performance-window-analysis") publishAnalysis(message.analysis);
      });
      worker.addEventListener("error", () => {
        workerFailed = true;
      });
    }

    const flushWindow = (now) => {
      if (frameCount < 24 || now - startedAt < STARTUP_GRACE_MS) return;
      if (now < interactionUntilRef.current) return;

      const payload = {
        count: frameCount,
        longTasks,
        longAnimationFrames,
      };
      const transferableBuffer = frameBuffer.buffer;
      frameBuffer = new Float32Array(FRAME_BUFFER_SIZE);
      frameCount = 0;
      longTasks = emptyPressureWindow();
      longAnimationFrames = emptyPressureWindow();
      lastAnalysisAt = now;

      if (worker && !workerFailed) {
        requestId += 1;
        worker.postMessage({
          type: "analyze-performance-window",
          requestId,
          frameBuffer: transferableBuffer,
          ...payload,
        }, [transferableBuffer]);
        return;
      }

      const fallbackFrames = new Float32Array(transferableBuffer);
      scheduleBackgroundTask(() => analyzePerformanceWindow({
        frames: fallbackFrames,
        ...payload,
      }))
        .then(publishAnalysis)
        .catch(() => {});
    };

    const onFrame = (now) => {
      if (document.hidden) {
        lastFrameAt = 0;
        rafId = requestAnimationFrame(onFrame);
        return;
      }

      if (lastFrameAt > 0) {
        const delta = now - lastFrameAt;
        if (delta >= 2 && delta <= 250 && frameCount < FRAME_BUFFER_SIZE) {
          frameBuffer[frameCount] = delta;
          frameCount += 1;
        }
      }
      lastFrameAt = now;

      if (frameCount >= FRAME_BUFFER_SIZE || now - lastAnalysisAt >= ANALYSIS_INTERVAL_MS) {
        flushWindow(now);
      }

      rafId = requestAnimationFrame(onFrame);
    };

    const supportedTypes = typeof PerformanceObserver === "undefined"
      ? []
      : PerformanceObserver.supportedEntryTypes ?? [];
    if (supportedTypes.includes("longtask")) {
      const observer = new PerformanceObserver((list) => recordPressure(longTasks, list.getEntries()));
      observer.observe({ type: "longtask" });
      observers.push(observer);
    }
    if (supportedTypes.includes("long-animation-frame")) {
      const observer = new PerformanceObserver((list) => recordPressure(longAnimationFrames, list.getEntries()));
      observer.observe({ type: "long-animation-frame" });
      observers.push(observer);
    }

    rafId = requestAnimationFrame(onFrame);

    return () => {
      cancelAnimationFrame(rafId);
      observers.forEach((observer) => observer.disconnect());
      worker?.terminate();
      delete window.__portfolioPerformanceRuntime;
      const root = document.documentElement;
      delete root.dataset.runtimeEstimatedHz;
      delete root.dataset.runtimeDroppedFrames;
      delete root.dataset.runtimeLongTasks;
      delete root.dataset.runtimeLoaf;
    };
  }, [animationsEnabled, animationsPaused, performanceMode]);

  const value = useMemo(() => ({
    runtimeQuality,
    getRuntimeMetrics: () => metricsRef.current,
    scheduleTask,
    scheduleBackgroundTask,
    scheduleUserVisibleTask,
    yieldToMain,
    priorities: TASK_PRIORITIES,
  }), [runtimeQuality]);

  return (
    <PerformanceRuntimeContext.Provider value={value}>
      {children}
    </PerformanceRuntimeContext.Provider>
  );
}
