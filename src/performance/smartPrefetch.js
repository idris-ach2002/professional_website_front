const PREFETCH_LEVELS = Object.freeze({
  off: 0,
  "critical-only": 1,
  conservative: 2,
  normal: 3,
  aggressive: 4,
});

const COST_WEIGHT = Object.freeze({
  low: 0.18,
  medium: 0.42,
  high: 0.72,
  extreme: 1,
});

export function decideSmartPrefetch({
  probability = 0,
  cost = "medium",
  critical = false,
  prefetchLevel = "normal",
  saveData = false,
  effectiveType = "unknown",
  memoryState = "normal",
  runtimeProfile = "high",
} = {}) {
  const probabilityScore = Math.min(1, Math.max(0, Number(probability) || 0));
  const costScore = COST_WEIGHT[cost] ?? COST_WEIGHT.medium;
  const level = PREFETCH_LEVELS[prefetchLevel] ?? PREFETCH_LEVELS.normal;

  if (critical) return { decision: "prefetch", reason: "critical", score: 1 };
  if (saveData) return { decision: "skip", reason: "save-data", score: 0 };
  if (level === 0) return { decision: "skip", reason: "prefetch-disabled", score: 0 };
  if (["critical", "pressure"].includes(memoryState)) return { decision: "skip", reason: "memory-pressure", score: 0 };
  if (["slow-2g", "2g"].includes(effectiveType)) return { decision: "skip", reason: "slow-network", score: 0 };
  if (runtimeProfile === "survival") return { decision: "skip", reason: "survival-runtime", score: 0 };

  const levelBonus = (level - 2) * 0.08;
  const score = probabilityScore - costScore * 0.44 + levelBonus;
  const threshold = level >= 4 ? 0.28 : level === 3 ? 0.38 : level === 2 ? 0.52 : 0.75;
  return score >= threshold
    ? { decision: "prefetch", reason: "benefit-exceeds-cost", score }
    : { decision: "skip", reason: "insufficient-benefit", score };
}
