export const RUNTIME_PROFILES = Object.freeze({
  ULTRA: "ultra",
  HIGH: "high",
  BALANCED: "balanced",
  REDUCED: "reduced",
  SURVIVAL: "survival",
});

const PROFILE_ORDER = Object.freeze({
  survival: 0,
  reduced: 1,
  balanced: 2,
  high: 3,
  ultra: 4,
});

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readMatchMedia(matchMedia, query) {
  try {
    return Boolean(matchMedia?.(query)?.matches);
  } catch {
    return false;
  }
}

function detectWebGL2(documentLike) {
  try {
    const canvas = documentLike?.createElement?.("canvas");
    const gl = canvas?.getContext?.("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return { supported: false, maxTextureSize: 0 };
    const maxTextureSize = safeNumber(gl.getParameter?.(gl.MAX_TEXTURE_SIZE), 0);
    gl.getExtension?.("WEBGL_lose_context")?.loseContext?.();
    return { supported: true, maxTextureSize };
  } catch {
    return { supported: false, maxTextureSize: 0 };
  }
}

export function detectRuntimeCapabilities({
  navigatorLike = typeof navigator === "undefined" ? null : navigator,
  windowLike = typeof window === "undefined" ? null : window,
  documentLike = typeof document === "undefined" ? null : document,
  matchMedia = windowLike?.matchMedia?.bind(windowLike),
} = {}) {
  const connection = navigatorLike?.connection
    ?? navigatorLike?.mozConnection
    ?? navigatorLike?.webkitConnection
    ?? null;
  const webgl2 = detectWebGL2(documentLike);
  const hardwareConcurrency = Math.max(1, safeNumber(navigatorLike?.hardwareConcurrency, 4));
  const deviceMemoryRaw = safeNumber(navigatorLike?.deviceMemory, 0);
  const deviceMemoryGb = deviceMemoryRaw > 0 ? deviceMemoryRaw : null;
  const effectiveType = String(connection?.effectiveType ?? "unknown").toLowerCase();
  const downlinkMbps = Math.max(0, safeNumber(connection?.downlink, 0));
  const rttMs = Math.max(0, safeNumber(connection?.rtt, 0));
  const saveData = Boolean(connection?.saveData);
  const reducedMotion = readMatchMedia(matchMedia, "(prefers-reduced-motion: reduce)");
  const coarsePointer = readMatchMedia(matchMedia, "(pointer: coarse)");
  const viewportWidth = Math.max(0, safeNumber(windowLike?.innerWidth, 0));
  const viewportHeight = Math.max(0, safeNumber(windowLike?.innerHeight, 0));
  const dpr = Math.max(1, safeNumber(windowLike?.devicePixelRatio, 1));
  const workerSupport = typeof Worker !== "undefined" || typeof windowLike?.Worker !== "undefined";
  const schedulerSupport = Boolean(globalThis.scheduler?.postTask);
  const offscreenCanvasSupport = typeof OffscreenCanvas !== "undefined" || typeof windowLike?.OffscreenCanvas !== "undefined";
  const isMobileViewport = viewportWidth > 0 && viewportWidth <= 820;

  return Object.freeze({
    hardwareConcurrency,
    deviceMemoryGb,
    effectiveType,
    downlinkMbps,
    rttMs,
    saveData,
    reducedMotion,
    coarsePointer,
    viewportWidth,
    viewportHeight,
    dpr,
    isMobileViewport,
    workerSupport,
    schedulerSupport,
    offscreenCanvasSupport,
    webgpuSupported: Boolean(navigatorLike?.gpu),
    webAssemblySupported: typeof WebAssembly !== "undefined",
    crossOriginIsolated: Boolean(globalThis.crossOriginIsolated),
    sharedArrayBufferSupport: typeof SharedArrayBuffer !== "undefined" && Boolean(globalThis.crossOriginIsolated),
    webgl2Supported: webgl2.supported,
    maxTextureSize: webgl2.maxTextureSize,
    displayHz: 0,
  });
}

export function negotiateCapabilityProfile(capabilities = {}) {
  if (capabilities.reducedMotion || capabilities.saveData) return RUNTIME_PROFILES.REDUCED;
  if (!capabilities.webgl2Supported || capabilities.hardwareConcurrency <= 2) return RUNTIME_PROFILES.SURVIVAL;
  if (
    capabilities.deviceMemoryGb !== null
    && capabilities.deviceMemoryGb !== undefined
    && capabilities.deviceMemoryGb <= 2
  ) return RUNTIME_PROFILES.SURVIVAL;

  const weakNetwork = ["slow-2g", "2g"].includes(capabilities.effectiveType)
    || (capabilities.rttMs >= 500 && capabilities.downlinkMbps > 0 && capabilities.downlinkMbps < 1.5);
  if (weakNetwork) return RUNTIME_PROFILES.REDUCED;

  const lowPower = capabilities.hardwareConcurrency <= 4
    || (capabilities.deviceMemoryGb !== null && capabilities.deviceMemoryGb <= 4)
    || capabilities.maxTextureSize > 0 && capabilities.maxTextureSize < 8192;
  if (lowPower || capabilities.isMobileViewport) return RUNTIME_PROFILES.BALANCED;

  const highPower = capabilities.hardwareConcurrency >= 12
    && (capabilities.deviceMemoryGb === null || capabilities.deviceMemoryGb >= 8)
    && capabilities.webgl2Supported
    && (capabilities.maxTextureSize === 0 || capabilities.maxTextureSize >= 16384)
    && !capabilities.coarsePointer;

  return highPower ? RUNTIME_PROFILES.ULTRA : RUNTIME_PROFILES.HIGH;
}

export function clampRuntimeProfile(profile, ceilingProfile) {
  const normalizedProfile = PROFILE_ORDER[profile] === undefined ? RUNTIME_PROFILES.HIGH : profile;
  const normalizedCeiling = PROFILE_ORDER[ceilingProfile] === undefined ? RUNTIME_PROFILES.HIGH : ceilingProfile;
  return PROFILE_ORDER[normalizedProfile] <= PROFILE_ORDER[normalizedCeiling]
    ? normalizedProfile
    : normalizedCeiling;
}

export function compareRuntimeProfiles(left, right) {
  return (PROFILE_ORDER[left] ?? PROFILE_ORDER.high) - (PROFILE_ORDER[right] ?? PROFILE_ORDER.high);
}

export function profileToLegacyQuality(profile) {
  if (profile === RUNTIME_PROFILES.ULTRA || profile === RUNTIME_PROFILES.HIGH) return "high";
  if (profile === RUNTIME_PROFILES.BALANCED) return "balanced";
  return "constrained";
}

export function performanceModeCeiling(performanceMode) {
  if (performanceMode === "ultra-lite") return RUNTIME_PROFILES.SURVIVAL;
  if (performanceMode === "lite") return RUNTIME_PROFILES.REDUCED;
  if (performanceMode === "balanced") return RUNTIME_PROFILES.BALANCED;
  return RUNTIME_PROFILES.ULTRA;
}
