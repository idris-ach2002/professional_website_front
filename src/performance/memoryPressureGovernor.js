export const MEMORY_STATES = Object.freeze({
  NORMAL: "normal",
  WATCH: "watch",
  PRESSURE: "pressure",
  CRITICAL: "critical",
  RECOVERING: "recovering",
});

function ratio(used, limit) {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null;
  return Math.min(1.5, Math.max(0, used / limit));
}

export function sampleMemoryPressureSignals({
  performanceLike = typeof performance === "undefined" ? null : performance,
  resourceSnapshot = null,
  performanceMetrics = null,
} = {}) {
  const memory = performanceLike?.memory;
  const heapRatio = ratio(Number(memory?.usedJSHeapSize), Number(memory?.jsHeapSizeLimit));
  const allocatedRatio = ratio(Number(memory?.totalJSHeapSize), Number(memory?.jsHeapSizeLimit));
  const activeResources = Number(resourceSnapshot?.activeCount || 0);
  const retainedBytes = Number(resourceSnapshot?.estimatedBytes || 0);
  const p95FrameMs = Number(performanceMetrics?.p95FrameMs || 0);
  const severeFrameRatio = Number(performanceMetrics?.severeFrameRatio || 0);
  const longTaskCount = Number(performanceMetrics?.longTaskCount || 0);

  return {
    heapRatio,
    allocatedRatio,
    activeResources,
    retainedBytes,
    p95FrameMs,
    severeFrameRatio,
    longTaskCount,
  };
}

export function scoreMemoryPressure(signals = {}) {
  let score = 0;
  let evidence = 0;

  if (signals.heapRatio !== null && signals.heapRatio !== undefined) {
    evidence += 1;
    if (signals.heapRatio >= 0.90) score += 1;
    else if (signals.heapRatio >= 0.78) score += 0.78;
    else if (signals.heapRatio >= 0.64) score += 0.48;
    else score += Math.max(0, signals.heapRatio * 0.42);
  }

  if (signals.allocatedRatio !== null && signals.allocatedRatio !== undefined) {
    evidence += 0.5;
    if (signals.allocatedRatio >= 0.92) score += 0.5;
    else if (signals.allocatedRatio >= 0.76) score += 0.32;
  }

  // Fallback evidence for browsers without performance.memory. This never
  // pretends to measure memory directly; it only raises a conservative signal
  // when retained resources and sustained frame pressure move together.
  if ((signals.activeResources || 0) >= 18) {
    evidence += 0.35;
    score += Math.min(0.35, ((signals.activeResources - 18) / 28) * 0.35);
  }
  if ((signals.retainedBytes || 0) >= 48 * 1024 * 1024) {
    evidence += 0.35;
    score += Math.min(0.35, (signals.retainedBytes / (192 * 1024 * 1024)) * 0.35);
  }
  if ((signals.p95FrameMs || 0) >= 20 && ((signals.longTaskCount || 0) >= 2 || (signals.severeFrameRatio || 0) >= 0.025)) {
    evidence += 0.3;
    score += 0.25;
  }

  if (evidence === 0) return { score: 0, confidence: "low" };
  return {
    score: Math.min(1, score / Math.max(1, evidence)),
    confidence: signals.heapRatio === null || signals.heapRatio === undefined ? "inferred" : "direct",
  };
}

export function classifyMemoryPressure(signals = {}) {
  const { score, confidence } = scoreMemoryPressure(signals);
  const heapRatio = signals.heapRatio;
  let recommendedState = MEMORY_STATES.NORMAL;

  if (heapRatio !== null && heapRatio !== undefined && heapRatio >= 0.92) recommendedState = MEMORY_STATES.CRITICAL;
  else if (score >= 0.82) recommendedState = MEMORY_STATES.CRITICAL;
  else if (score >= 0.62) recommendedState = MEMORY_STATES.PRESSURE;
  else if (score >= 0.38) recommendedState = MEMORY_STATES.WATCH;

  return { recommendedState, score, confidence };
}

export function advanceMemoryPressureState(previousState, assessment, streak = { pressure: 0, normal: 0 }) {
  const recommendation = assessment?.recommendedState ?? MEMORY_STATES.NORMAL;
  const nextStreak = { ...streak };

  if (recommendation === MEMORY_STATES.CRITICAL) {
    return { state: MEMORY_STATES.CRITICAL, streak: { pressure: 0, normal: 0 } };
  }

  if (recommendation === MEMORY_STATES.PRESSURE) {
    nextStreak.pressure += 1;
    nextStreak.normal = 0;
    if (previousState === MEMORY_STATES.PRESSURE || previousState === MEMORY_STATES.CRITICAL) {
      return { state: MEMORY_STATES.PRESSURE, streak: nextStreak };
    }
    return {
      state: nextStreak.pressure >= 2 ? MEMORY_STATES.PRESSURE : MEMORY_STATES.WATCH,
      streak: nextStreak,
    };
  }

  if (recommendation === MEMORY_STATES.WATCH) {
    nextStreak.pressure = 0;
    nextStreak.normal = 0;
    if ([MEMORY_STATES.PRESSURE, MEMORY_STATES.CRITICAL].includes(previousState)) {
      return { state: MEMORY_STATES.RECOVERING, streak: nextStreak };
    }
    return { state: MEMORY_STATES.WATCH, streak: nextStreak };
  }

  nextStreak.pressure = 0;
  nextStreak.normal += 1;
  if ([MEMORY_STATES.PRESSURE, MEMORY_STATES.CRITICAL, MEMORY_STATES.RECOVERING].includes(previousState)) {
    if (nextStreak.normal >= 3) return { state: MEMORY_STATES.NORMAL, streak: { pressure: 0, normal: 0 } };
    return { state: MEMORY_STATES.RECOVERING, streak: nextStreak };
  }
  if (previousState === MEMORY_STATES.WATCH && nextStreak.normal < 2) {
    return { state: MEMORY_STATES.WATCH, streak: nextStreak };
  }
  return { state: MEMORY_STATES.NORMAL, streak: nextStreak };
}
