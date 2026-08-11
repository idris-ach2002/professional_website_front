export function resolveAquariumFps(runtimeQuality, performanceMode, mobile = false) {
  if (runtimeQuality === "constrained") return 30;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return mobile ? 36 : 45;
  return mobile ? 45 : 60;
}

export function resolveMineFxFps(runtimeQuality = "high", ultraLite = false) {
  if (ultraLite) return 0;
  if (runtimeQuality === "constrained") return 12;
  if (runtimeQuality === "balanced") return 18;
  return 24;
}
