import { performanceModeCeiling, RUNTIME_PROFILES } from "../performance/runtimeCapabilities";

const PROFILE_LEVEL = Object.freeze({
  [RUNTIME_PROFILES.SURVIVAL]: 0,
  [RUNTIME_PROFILES.REDUCED]: 1,
  [RUNTIME_PROFILES.BALANCED]: 2,
  [RUNTIME_PROFILES.HIGH]: 3,
  [RUNTIME_PROFILES.ULTRA]: 4,
});

const PROFILE_LABEL = Object.freeze({
  ultra: "Ultra",
  high: "Élevé",
  balanced: "Équilibré",
  reduced: "Allégé",
  survival: "Protection",
});

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeParameter(gl, parameter, fallback = "Non exposé") {
  try {
    return gl?.getParameter?.(parameter) ?? fallback;
  } catch {
    return fallback;
  }
}

export function detectGraphicsDevice({
  documentLike = typeof document === "undefined" ? null : document,
  navigatorLike = typeof navigator === "undefined" ? null : navigator,
  windowLike = typeof window === "undefined" ? null : window,
} = {}) {
  const canvas = documentLike?.createElement?.("canvas");
  let gl = null;
  try {
    gl = canvas?.getContext?.("webgl2", { antialias: false, powerPreference: "high-performance" })
      ?? canvas?.getContext?.("webgl", { antialias: false });
  } catch {
    gl = null;
  }

  const debugInfo = gl?.getExtension?.("WEBGL_debug_renderer_info");
  const renderer = debugInfo
    ? safeParameter(gl, debugInfo.UNMASKED_RENDERER_WEBGL)
    : safeParameter(gl, gl?.RENDERER);
  const vendor = debugInfo
    ? safeParameter(gl, debugInfo.UNMASKED_VENDOR_WEBGL)
    : safeParameter(gl, gl?.VENDOR);
  const result = {
    renderer: String(renderer),
    vendor: String(vendor),
    api: gl ? String(safeParameter(gl, gl.VERSION)) : "WebGL indisponible",
    shadingLanguage: gl ? String(safeParameter(gl, gl.SHADING_LANGUAGE_VERSION)) : "—",
    maxTextureSize: gl ? number(safeParameter(gl, gl.MAX_TEXTURE_SIZE, 0)) : 0,
    maxRenderbufferSize: gl ? number(safeParameter(gl, gl.MAX_RENDERBUFFER_SIZE, 0)) : 0,
    maxTextureUnits: gl ? number(safeParameter(gl, gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS, 0)) : 0,
    webgpu: Boolean(navigatorLike?.gpu),
    platform: navigatorLike?.userAgentData?.platform ?? navigatorLike?.platform ?? "Non exposée",
    userAgent: navigatorLike?.userAgent ?? "Non exposé",
    connection: navigatorLike?.connection?.effectiveType
      ? `${navigatorLike.connection.effectiveType}${navigatorLike.connection.downlink ? ` · ${navigatorLike.connection.downlink} Mb/s` : ""}`
      : "Non exposé",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Non exposé",
    viewport: {
      width: number(windowLike?.innerWidth),
      height: number(windowLike?.innerHeight),
    },
    screen: {
      width: number(windowLike?.screen?.width),
      height: number(windowLike?.screen?.height),
      colorDepth: number(windowLike?.screen?.colorDepth),
      pixelRatio: number(windowLike?.devicePixelRatio, 1),
    },
  };
  try {
    gl?.getExtension?.("WEBGL_lose_context")?.loseContext?.();
  } catch {
    // Le contexte de détection est jetable ; une extension absente ne change pas le diagnostic.
  }
  return result;
}

export async function detectGraphicsDeviceAsync(options = {}) {
  const navigatorLike = options.navigatorLike ?? (typeof navigator === "undefined" ? null : navigator);
  const base = detectGraphicsDevice(options);
  const gpu = navigatorLike?.gpu;
  if (!gpu?.requestAdapter) return { ...base, webgpuProbe: "indisponible" };

  try {
    const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return { ...base, webgpuProbe: "aucun adaptateur" };
    const info = adapter.info ?? await adapter.requestAdapterInfo?.() ?? {};
    return {
      ...base,
      webgpu: true,
      webgpuProbe: "haute performance demandée",
      webgpuAdapter: {
        vendor: info.vendor || null,
        architecture: info.architecture || null,
        device: info.device || null,
        description: info.description || null,
      },
      webgpuLimits: {
        maxTextureDimension2D: Number(adapter.limits?.maxTextureDimension2D || 0),
        maxBufferSize: Number(adapter.limits?.maxBufferSize || 0),
      },
    };
  } catch {
    return { ...base, webgpu: true, webgpuProbe: "autorisation refusée" };
  }
}

function performanceCeiling(recommendation) {
  if (recommendation === "constrained") return RUNTIME_PROFILES.REDUCED;
  if (recommendation === "balanced") return RUNTIME_PROFILES.BALANCED;
  return RUNTIME_PROFILES.ULTRA;
}

function memoryCeiling(state) {
  if (state === "critical") return RUNTIME_PROFILES.SURVIVAL;
  if (state === "pressure") return RUNTIME_PROFILES.REDUCED;
  if (state === "recovering") return RUNTIME_PROFILES.BALANCED;
  if (state === "watch") return RUNTIME_PROFILES.HIGH;
  return RUNTIME_PROFILES.ULTRA;
}

function profilePercent(profile) {
  return ((PROFILE_LEVEL[profile] ?? 3) + 1) * 20;
}

export function analyzeRuntimeMode(runtime = {}) {
  const profile = runtime.profile ?? RUNTIME_PROFILES.HIGH;
  const metrics = runtime.metrics ?? {};
  const memory = runtime.memory ?? {};
  const capabilityProfile = runtime.capabilityProfile ?? profile;
  const preference = performanceModeCeiling(runtime.preferenceMode ?? "full");
  const performance = performanceCeiling(metrics.recommendation);
  const memoryLimit = memoryCeiling(memory.state);
  const factors = [
    {
      id: "hardware",
      label: "Capacités matérielles",
      ceiling: capabilityProfile,
      value: profilePercent(capabilityProfile),
      detail: `${runtime.capabilities?.hardwareConcurrency ?? "?"} processeurs logiques · ${runtime.capabilities?.deviceMemoryGb ?? "RAM masquée"}${runtime.capabilities?.deviceMemoryGb ? " Go RAM" : ""}`,
    },
    {
      id: "preference",
      label: "Préférence utilisateur",
      ceiling: preference,
      value: profilePercent(preference),
      detail: `Mode demandé : ${runtime.preferenceMode ?? "complet"}`,
    },
    {
      id: "frames",
      label: "Fluidité mesurée",
      ceiling: performance,
      value: profilePercent(performance),
      detail: `${number(metrics.p95FrameMs).toFixed(1)} ms pour rendre 95 % des images`,
    },
    {
      id: "memory",
      label: "Pression mémoire",
      ceiling: memoryLimit,
      value: profilePercent(memoryLimit),
      detail: `${String(memory.state ?? "normal")} · score ${Math.round(number(memory.assessment?.score) * 100)} %`,
    },
  ];
  const selectedLevel = PROFILE_LEVEL[profile] ?? 3;
  const limiting = factors
    .filter((factor) => (PROFILE_LEVEL[factor.ceiling] ?? 4) <= selectedLevel)
    .sort((left, right) => PROFILE_LEVEL[left.ceiling] - PROFILE_LEVEL[right.ceiling]);
  const primary = limiting[0] ?? factors.reduce((result, factor) => (
    PROFILE_LEVEL[factor.ceiling] < PROFILE_LEVEL[result.ceiling] ? factor : result
  ), factors[0]);

  return {
    profile,
    label: PROFILE_LABEL[profile] ?? profile,
    factors,
    primary,
    explanation: `Le mode ${PROFILE_LABEL[profile] ?? profile} protège la fluidité en respectant la contrainte la plus forte : ${primary.label.toLowerCase()} (${PROFILE_LABEL[primary.ceiling] ?? primary.ceiling}).`,
  };
}

export function frameVerdict(frameMs, refreshRate = 60) {
  const target = refreshRate >= 100 ? 1000 / refreshRate : 1000 / 60;
  const value = number(frameMs);
  if (value <= target) return { status: "excellent", label: "Très fluide", target };
  if (value <= target * 1.45) return { status: "good", label: "Fluide", target };
  if (value <= target * 2.2) return { status: "watch", label: "À surveiller", target };
  return { status: "critical", label: "Rendu sous pression", target };
}

export function bytes(value, decimals = 1) {
  const amount = number(value, -1);
  if (amount < 0) return "Non exposé";
  if (amount === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(amount) / Math.log(1024)));
  return `${(amount / 1024 ** index).toFixed(decimals)} ${units[index]}`;
}

export function percent(value, decimals = 0) {
  const amount = number(value, -1);
  return amount < 0 ? "Non exposé" : `${amount.toFixed(decimals)} %`;
}

export function duration(value) {
  const milliseconds = number(value);
  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  return days > 0 ? `${days} j ${hours} h` : `${hours} h ${minutes} min`;
}
