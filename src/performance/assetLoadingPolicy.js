export const ASSET_PRIORITIES = Object.freeze({
  CRITICAL: "critical",
  VISIBLE_SOON: "visible-soon",
  PREFETCH: "prefetch",
  BACKGROUND: "background",
  OPTIONAL: "optional",
});

export function resolveAssetLoadingPolicy({
  priority = ASSET_PRIORITIES.BACKGROUND,
  runtimeProfile = "high",
  memoryState = "normal",
  saveData = false,
  effectiveType = "unknown",
} = {}) {
  const constrained = ["reduced", "survival"].includes(runtimeProfile)
    || ["pressure", "critical"].includes(memoryState)
    || saveData
    || ["slow-2g", "2g"].includes(effectiveType);

  if (priority === ASSET_PRIORITIES.CRITICAL) {
    return {
      loading: "eager",
      fetchPriority: "high",
      decoding: "async",
      allowSpeculativePreload: true,
    };
  }

  if (priority === ASSET_PRIORITIES.VISIBLE_SOON) {
    return {
      loading: constrained ? "lazy" : "eager",
      fetchPriority: constrained ? "auto" : "high",
      decoding: "async",
      allowSpeculativePreload: !constrained,
    };
  }

  if (priority === ASSET_PRIORITIES.PREFETCH) {
    return {
      loading: "lazy",
      fetchPriority: constrained ? "low" : "auto",
      decoding: "async",
      allowSpeculativePreload: !constrained,
    };
  }

  return {
    loading: "lazy",
    fetchPriority: "low",
    decoding: "async",
    allowSpeculativePreload: false,
  };
}
