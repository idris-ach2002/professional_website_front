import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { analyzePerformanceWindow } from "./performanceMetrics";
import PerformanceRuntimeContext from "./performanceRuntimeContextValue";
import {
  scheduleBackgroundTask,
  scheduleTask,
  scheduleUserVisibleTask,
  TASK_PRIORITIES,
  yieldToMain,
} from "./runtimeScheduler";
import {
  compareRuntimeProfiles,
  detectRuntimeCapabilities,
  negotiateCapabilityProfile,
  profileToLegacyQuality,
  RUNTIME_PROFILES,
} from "./runtimeCapabilities";
import { resolveProfileFromSignals, runtimeBudgetForProfile } from "./runtimeBudgets";
import {
  MEMORY_STATES,
  advanceMemoryPressureState,
  classifyMemoryPressure,
  sampleMemoryPressureSignals,
} from "./memoryPressureGovernor";
import {
  getRuntimeResourceSnapshot,
  markRuntimeOwnerMounted,
  markRuntimeOwnerUnmounted,
  registerRuntimeResource,
} from "./resourceLifecycleRegistry";
import { decideSmartPrefetch } from "./smartPrefetch";

const FRAME_BUFFER_SIZE = 256;
const ANALYSIS_INTERVAL_MS = 1800;
const STARTUP_GRACE_MS = 2600;
const DEGRADE_WINDOWS = 2;
const RECOVER_WINDOWS = 4;
const INTERACTION_GUARD_MS = 320;
const MEMORY_SAMPLE_MS = 4000;
const DECISION_LIMIT = 80;
const PERFORMANCE_OWNER = "PerformanceRuntimeProvider";

const E2E_RUNTIME_QUALITY = ["high", "balanced", "constrained"].includes(import.meta.env.VITE_E2E_RUNTIME_QUALITY)
  ? import.meta.env.VITE_E2E_RUNTIME_QUALITY
  : null;

const E2E_RUNTIME_PROFILE = E2E_RUNTIME_QUALITY === "constrained"
  ? RUNTIME_PROFILES.REDUCED
  : E2E_RUNTIME_QUALITY === "balanced"
    ? RUNTIME_PROFILES.BALANCED
    : E2E_RUNTIME_QUALITY === "high"
      ? RUNTIME_PROFILES.HIGH
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

function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

export default function PerformanceRuntimeProvider({ children }) {
  const { performanceMode } = useAnimationPreferences();
  const [capabilities, setCapabilities] = useState(() => detectRuntimeCapabilities());
  const capabilitiesRef = useRef(capabilities);
  const performanceModeRef = useRef(performanceMode);
  const [memoryState, setMemoryState] = useState(MEMORY_STATES.NORMAL);
  const memoryStateRef = useRef(MEMORY_STATES.NORMAL);
  const memoryStreakRef = useRef({ pressure: 0, normal: 0 });
  const memoryAssessmentRef = useRef({ recommendedState: MEMORY_STATES.NORMAL, score: 0, confidence: "low" });
  const metricsRef = useRef({
    recommendation: "high",
    estimatedHz: 0,
    sampleCount: 0,
  });
  const capabilityProfile = useMemo(() => negotiateCapabilityProfile(capabilities), [capabilities]);
  const capabilityProfileRef = useRef(capabilityProfile);
  const initialProfile = E2E_RUNTIME_PROFILE ?? resolveProfileFromSignals({
    capabilityProfile,
    performanceMode,
    memoryState: MEMORY_STATES.NORMAL,
  });
  const [runtimeProfile, setRuntimeProfile] = useState(initialProfile);
  const runtimeProfileRef = useRef(initialProfile);
  const runtimeQuality = profileToLegacyQuality(runtimeProfile);
  const runtimeBudget = useMemo(
    () => runtimeBudgetForProfile(runtimeProfile, capabilities),
    [capabilities, runtimeProfile],
  );
  const runtimeBudgetRef = useRef(runtimeBudget);
  const streakRef = useRef({ degrade: 0, recover: 0 });
  const interactionUntilRef = useRef(0);
  const decisionsRef = useRef([]);
  const prefetchCacheRef = useRef(new Map());

  const recordDecision = useCallback((decision) => {
    const entry = {
      id: `${Math.round(now() * 1000)}-${decisionsRef.current.length}`,
      at: now(),
      ...decision,
    };
    decisionsRef.current = [...decisionsRef.current.slice(-(DECISION_LIMIT - 1)), entry];
    if (typeof window !== "undefined") {
      window.__portfolioRuntimeDecisions = decisionsRef.current;
      window.dispatchEvent(new CustomEvent("portfolio:runtime-decision", { detail: entry }));
    }
    return entry;
  }, []);

  const applyProfile = useCallback((nextProfile, reason, details = {}) => {
    const current = runtimeProfileRef.current;
    if (!nextProfile || current === nextProfile) return false;
    runtimeProfileRef.current = nextProfile;
    setRuntimeProfile(nextProfile);
    recordDecision({
      type: "runtime-profile",
      from: current,
      to: nextProfile,
      reason,
      details,
    });
    return true;
  }, [recordDecision]);

  useEffect(() => {
    capabilitiesRef.current = capabilities;
  }, [capabilities]);

  useEffect(() => {
    performanceModeRef.current = performanceMode;
  }, [performanceMode]);

  useEffect(() => {
    capabilityProfileRef.current = capabilityProfile;
  }, [capabilityProfile]);

  useEffect(() => {
    memoryStateRef.current = memoryState;
  }, [memoryState]);

  useEffect(() => {
    runtimeBudgetRef.current = runtimeBudget;
  }, [runtimeBudget]);

  useEffect(() => {
    runtimeProfileRef.current = runtimeProfile;
    const root = document.documentElement;
    root.dataset.runtimeProfile = runtimeProfile;
    root.dataset.runtimeQuality = runtimeQuality;
    root.dataset.runtimeMemory = memoryState;
    root.dataset.runtimePrefetch = runtimeBudget.prefetchLevel;
    return () => {
      delete root.dataset.runtimeProfile;
      delete root.dataset.runtimeQuality;
      delete root.dataset.runtimeMemory;
      delete root.dataset.runtimePrefetch;
    };
  }, [memoryState, runtimeBudget.prefetchLevel, runtimeProfile, runtimeQuality]);

  useEffect(() => {
    const connection = navigator?.connection ?? navigator?.mozConnection ?? navigator?.webkitConnection;
    let resizeTimer = 0;

    const refresh = () => {
      setCapabilities((current) => {
        const next = detectRuntimeCapabilities();
        // Display Hz is measured by the performance sampler and must survive
        // capability re-detection caused by network or viewport changes.
        return { ...next, displayHz: current.displayHz || 0 };
      });
    };
    const scheduleRefresh = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(refresh, 180);
    };

    connection?.addEventListener?.("change", refresh);
    window.addEventListener("resize", scheduleRefresh, { passive: true });
    return () => {
      connection?.removeEventListener?.("change", refresh);
      window.removeEventListener("resize", scheduleRefresh);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    if (E2E_RUNTIME_PROFILE) {
      applyProfile(E2E_RUNTIME_PROFILE, "e2e-fixed-profile");
      return;
    }

    const desired = resolveProfileFromSignals({
      capabilityProfile,
      performanceMode,
      performanceRecommendation: metricsRef.current.recommendation,
      urgent: Boolean(metricsRef.current.urgent),
      memoryState,
    });
    // Capability/preference/memory changes are explicit constraints, so they
    // are applied immediately. Frame-driven changes retain hysteresis below.
    applyProfile(desired, "runtime-constraints-changed", {
      capabilityProfile,
      performanceMode,
      memoryState,
    });
  }, [applyProfile, capabilityProfile, memoryState, performanceMode]);

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
    markRuntimeOwnerMounted(PERFORMANCE_OWNER);
    const monitorLease = registerRuntimeResource({
      owner: PERFORMANCE_OWNER,
      type: "raf",
      label: "frame-performance-monitor",
    });

    if (E2E_RUNTIME_PROFILE) {
      streakRef.current = { degrade: 0, recover: 0 };
      return () => {
        monitorLease.release();
        markRuntimeOwnerUnmounted(PERFORMANCE_OWNER);
      };
    }

    const worker = createWorker();
    const workerLease = worker
      ? registerRuntimeResource({ owner: PERFORMANCE_OWNER, type: "worker", label: "performance-analysis" })
      : null;
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

      if (analysis.estimatedHz > 0 && capabilitiesRef.current.displayHz !== analysis.estimatedHz) {
        setCapabilities((current) => ({ ...current, displayHz: analysis.estimatedHz }));
      }

      const desired = resolveProfileFromSignals({
        capabilityProfile: capabilityProfileRef.current,
        performanceMode: performanceModeRef.current,
        performanceRecommendation: analysis.recommendation,
        urgent: analysis.urgent,
        memoryState: memoryStateRef.current,
      });
      const current = runtimeProfileRef.current;
      const comparison = compareRuntimeProfiles(desired, current);

      if (comparison < 0) {
        streakRef.current.recover = 0;
        streakRef.current.degrade += 1;
        if (analysis.urgent || streakRef.current.degrade >= DEGRADE_WINDOWS) {
          streakRef.current.degrade = 0;
          scheduleUserVisibleTask(() => applyProfile(desired, "frame-pressure", {
            recommendation: analysis.recommendation,
            p95FrameMs: analysis.p95FrameMs,
            droppedFrameRatio: analysis.droppedFrameRatio,
            urgent: analysis.urgent,
          })).catch(() => {});
        }
        return;
      }

      if (comparison > 0) {
        streakRef.current.degrade = 0;
        streakRef.current.recover += 1;
        if (streakRef.current.recover >= RECOVER_WINDOWS) {
          streakRef.current.recover = 0;
          scheduleBackgroundTask(() => applyProfile(desired, "sustained-recovery", {
            recommendation: analysis.recommendation,
            p95FrameMs: analysis.p95FrameMs,
          })).catch(() => {});
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
        workerLease?.update({ metadata: { status: "failed" } });
        recordDecision({ type: "worker", reason: "performance-worker-failed", details: { fallback: "main-thread-background" } });
      });
    }

    const flushWindow = (timestamp) => {
      if (frameCount < 24 || timestamp - startedAt < STARTUP_GRACE_MS) return;
      if (timestamp < interactionUntilRef.current) return;

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
      lastAnalysisAt = timestamp;

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

    const onFrame = (timestamp) => {
      if (document.hidden) {
        lastFrameAt = 0;
        rafId = requestAnimationFrame(onFrame);
        return;
      }

      if (lastFrameAt > 0) {
        const delta = timestamp - lastFrameAt;
        if (delta >= 2 && delta <= 250 && frameCount < FRAME_BUFFER_SIZE) {
          frameBuffer[frameCount] = delta;
          frameCount += 1;
        }
      }
      lastFrameAt = timestamp;

      if (frameCount >= FRAME_BUFFER_SIZE || timestamp - lastAnalysisAt >= ANALYSIS_INTERVAL_MS) {
        flushWindow(timestamp);
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
      workerLease?.release();
      monitorLease.release();
      markRuntimeOwnerUnmounted(PERFORMANCE_OWNER);
      delete window.__portfolioPerformanceRuntime;
      const root = document.documentElement;
      delete root.dataset.runtimeEstimatedHz;
      delete root.dataset.runtimeDroppedFrames;
      delete root.dataset.runtimeLongTasks;
      delete root.dataset.runtimeLoaf;
    };
  }, [applyProfile, recordDecision]);

  useEffect(() => {
    const sample = () => {
      if (document.hidden) return;
      const resourceSnapshot = getRuntimeResourceSnapshot();
      const signals = sampleMemoryPressureSignals({
        resourceSnapshot,
        performanceMetrics: metricsRef.current,
      });
      const assessment = classifyMemoryPressure(signals);
      memoryAssessmentRef.current = { ...assessment, signals };
      const advanced = advanceMemoryPressureState(memoryStateRef.current, assessment, memoryStreakRef.current);
      memoryStreakRef.current = advanced.streak;

      if (advanced.state !== memoryStateRef.current) {
        const previous = memoryStateRef.current;
        memoryStateRef.current = advanced.state;
        setMemoryState(advanced.state);
        const actions = advanced.state === MEMORY_STATES.CRITICAL
          ? ["suspend-non-critical", "purge-prefetch", "reduce-scenes", "release-inactive"]
          : advanced.state === MEMORY_STATES.PRESSURE
            ? ["reduce-scenes", "pause-background-prefetch"]
            : advanced.state === MEMORY_STATES.RECOVERING
              ? ["hold-balanced-budget"]
              : [];
        const detail = {
          from: previous,
          to: advanced.state,
          assessment,
          actions,
        };
        recordDecision({ type: "memory-pressure", reason: "memory-governor", ...detail });
        window.dispatchEvent(new CustomEvent("portfolio:memory-pressure", { detail }));
        if ([MEMORY_STATES.PRESSURE, MEMORY_STATES.CRITICAL].includes(advanced.state)) {
          prefetchCacheRef.current.clear();
        }
      }
    };

    sample();
    const intervalId = window.setInterval(sample, MEMORY_SAMPLE_MS);
    return () => window.clearInterval(intervalId);
  }, [recordDecision]);

  const evaluatePrefetch = useCallback((options = {}) => decideSmartPrefetch({
    ...options,
    prefetchLevel: runtimeBudgetRef.current.prefetchLevel,
    saveData: capabilitiesRef.current.saveData,
    effectiveType: capabilitiesRef.current.effectiveType,
    memoryState: memoryStateRef.current,
    runtimeProfile: runtimeProfileRef.current,
  }), []);

  const requestPrefetch = useCallback((key, loader, options = {}) => {
    if (typeof loader !== "function") {
      return { decision: "skip", reason: "invalid-loader", score: 0, promise: null };
    }
    const assessment = evaluatePrefetch(options);
    if (assessment.decision !== "prefetch") {
      recordDecision({ type: "prefetch", reason: assessment.reason, details: { key, ...assessment } });
      return { ...assessment, promise: null };
    }

    if (prefetchCacheRef.current.has(key)) {
      return { ...assessment, reason: "deduplicated", promise: prefetchCacheRef.current.get(key) };
    }

    const scheduler = options.critical ? scheduleUserVisibleTask : scheduleBackgroundTask;
    const promise = scheduler(() => loader())
      .catch((error) => {
        prefetchCacheRef.current.delete(key);
        throw error;
      });
    prefetchCacheRef.current.set(key, promise);
    recordDecision({ type: "prefetch", reason: assessment.reason, details: { key, ...assessment } });
    return { ...assessment, promise };
  }, [evaluatePrefetch, recordDecision]);

  const getRuntimeSnapshot = useCallback(() => ({
    profile: runtimeProfileRef.current,
    quality: profileToLegacyQuality(runtimeProfileRef.current),
    capabilityProfile: capabilityProfileRef.current,
    preferenceMode: performanceModeRef.current,
    budget: runtimeBudgetRef.current,
    capabilities: capabilitiesRef.current,
    metrics: metricsRef.current,
    memory: {
      state: memoryStateRef.current,
      assessment: memoryAssessmentRef.current,
    },
    resources: getRuntimeResourceSnapshot(),
    decisions: [...decisionsRef.current],
  }), []);

  useEffect(() => {
    window.__portfolioGetRuntimeSnapshot = getRuntimeSnapshot;
    return () => {
      delete window.__portfolioGetRuntimeSnapshot;
      delete window.__portfolioRuntimeDecisions;
    };
  }, [getRuntimeSnapshot]);

  const value = useMemo(() => ({
    runtimeProfile,
    runtimeQuality,
    runtimeBudget,
    capabilities,
    memoryState,
    getRuntimeMetrics: () => metricsRef.current,
    getRuntimeSnapshot,
    evaluatePrefetch,
    requestPrefetch,
    recordDecision,
    scheduleTask,
    scheduleBackgroundTask,
    scheduleUserVisibleTask,
    yieldToMain,
    priorities: TASK_PRIORITIES,
  }), [
    capabilities,
    evaluatePrefetch,
    getRuntimeSnapshot,
    memoryState,
    recordDecision,
    requestPrefetch,
    runtimeBudget,
    runtimeProfile,
    runtimeQuality,
  ]);

  return (
    <PerformanceRuntimeContext.Provider value={value}>
      {children}
    </PerformanceRuntimeContext.Provider>
  );
}
