const QUALITY_ORDER = Object.freeze({
  constrained: 0,
  balanced: 1,
  high: 2,
});

function quantile(sorted, ratio) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];

  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function normalizeFrames(frames, count) {
  const limit = Math.min(Number(count) || frames?.length || 0, frames?.length || 0);
  const values = [];

  for (let index = 0; index < limit; index += 1) {
    const value = Number(frames[index]);
    if (Number.isFinite(value) && value >= 2 && value <= 250) values.push(value);
  }

  return values.sort((a, b) => a - b);
}

export function compareRuntimeQuality(left, right) {
  return (QUALITY_ORDER[left] ?? QUALITY_ORDER.high) - (QUALITY_ORDER[right] ?? QUALITY_ORDER.high);
}

export function analyzePerformanceWindow({
  frames,
  count,
  longTasks = {},
  longAnimationFrames = {},
} = {}) {
  const sorted = normalizeFrames(frames, count);
  const sampleCount = sorted.length;

  if (sampleCount < 24) {
    return {
      recommendation: "high",
      confidence: "low",
      sampleCount,
      estimatedHz: 0,
      baseFrameMs: 0,
      medianFrameMs: 0,
      p95FrameMs: 0,
      p99FrameMs: 0,
      droppedFrameRatio: 0,
      severeFrameRatio: 0,
      longTaskCount: Number(longTasks.count || 0),
      longAnimationFrameCount: Number(longAnimationFrames.count || 0),
      urgent: false,
    };
  }

  const baseFrameMs = Math.max(4, quantile(sorted, 0.2));
  const medianFrameMs = quantile(sorted, 0.5);
  const p95FrameMs = quantile(sorted, 0.95);
  const p99FrameMs = quantile(sorted, 0.99);
  const estimatedHz = Math.max(1, Math.min(240, Math.round(1000 / baseFrameMs)));
  const droppedThreshold = baseFrameMs * 1.55;
  const severeThreshold = Math.max(50, baseFrameMs * 3.2);
  const droppedFrameCount = sorted.filter((value) => value > droppedThreshold).length;
  const severeFrameCount = sorted.filter((value) => value > severeThreshold).length;
  const droppedFrameRatio = droppedFrameCount / sampleCount;
  const severeFrameRatio = severeFrameCount / sampleCount;
  const longTaskCount = Number(longTasks.count || 0);
  const maxLongTaskMs = Number(longTasks.maxDuration || 0);
  const longAnimationFrameCount = Number(longAnimationFrames.count || 0);
  const maxLongAnimationFrameMs = Number(longAnimationFrames.maxDuration || 0);

  const highQuality = (
    droppedFrameRatio <= 0.035
    && p95FrameMs <= baseFrameMs * 1.42
    && severeFrameRatio <= 0.005
    && longTaskCount <= 1
    && longAnimationFrameCount <= 1
  );

  const balancedQuality = (
    droppedFrameRatio <= 0.12
    && p95FrameMs <= baseFrameMs * 2.05
    && severeFrameRatio <= 0.025
    && longTaskCount <= 4
    && longAnimationFrameCount <= 3
  );

  const recommendation = highQuality
    ? "high"
    : balancedQuality
      ? "balanced"
      : "constrained";

  return {
    recommendation,
    confidence: "high",
    sampleCount,
    estimatedHz,
    baseFrameMs,
    medianFrameMs,
    p95FrameMs,
    p99FrameMs,
    droppedFrameRatio,
    severeFrameRatio,
    longTaskCount,
    maxLongTaskMs,
    longAnimationFrameCount,
    maxLongAnimationFrameMs,
    urgent: maxLongTaskMs >= 140 || maxLongAnimationFrameMs >= 120 || severeFrameRatio >= 0.06,
  };
}
