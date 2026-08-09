export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function damp(current, target, response, deltaSeconds) {
  const safeDelta = clamp(Number(deltaSeconds) || 0, 0, 0.05);
  const safeResponse = Math.max(0, Number(response) || 0);
  if (safeDelta === 0 || safeResponse === 0) return current;
  const alpha = 1 - Math.exp(-safeResponse * safeDelta);
  return current + (target - current) * alpha;
}

export function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const amount = clamp01((value - edge0) / (edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}

export function cycleProgress(elapsedMs, durationMs, phaseOffset = 0) {
  const safeDuration = Math.max(1, Number(durationMs) || 1);
  const safeElapsed = Math.max(0, Number(elapsedMs) || 0);
  const normalizedOffset = ((Number(phaseOffset) || 0) % 1 + 1) % 1;
  return ((safeElapsed / safeDuration) + normalizedOffset) % 1;
}

export function pingPongState(elapsedMs, durationMs, phaseOffset = 0) {
  const cycle = cycleProgress(elapsedMs, durationMs, phaseOffset);
  if (cycle < 0.5) return { progress: cycle * 2, direction: 1 };
  return { progress: (1 - cycle) * 2, direction: -1 };
}

export function progressForStep(activeIndex, totalSteps) {
  const safeTotal = Math.max(0, Number(totalSteps) || 0);
  if (safeTotal === 0 || activeIndex < 0) return 0;
  return clamp01((Math.min(activeIndex, safeTotal - 1) + 1) / safeTotal);
}
