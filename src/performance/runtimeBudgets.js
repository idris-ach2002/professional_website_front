import {
  RUNTIME_PROFILES,
  clampRuntimeProfile,
  performanceModeCeiling,
} from "./runtimeCapabilities.js";

const PROFILE_BUDGETS = Object.freeze({
  [RUNTIME_PROFILES.ULTRA]: Object.freeze({
    aquariumFps: 60,
    marinePopulationScale: 1,
    dprCap: 1.35,
    rareOceanEvents: true,
    workerSimulation: true,
    backgroundWork: true,
    prefetchLevel: "aggressive",
    volcanoRenderer: "webgl2",
    volcanoScale: 1,
    volcanoFps: 60,
  }),
  [RUNTIME_PROFILES.HIGH]: Object.freeze({
    aquariumFps: 60,
    marinePopulationScale: 1,
    dprCap: 1.22,
    rareOceanEvents: true,
    workerSimulation: true,
    backgroundWork: true,
    prefetchLevel: "normal",
    volcanoRenderer: "webgl2",
    volcanoScale: 1,
    volcanoFps: 60,
  }),
  [RUNTIME_PROFILES.BALANCED]: Object.freeze({
    aquariumFps: 45,
    marinePopulationScale: 0.82,
    dprCap: 1.05,
    rareOceanEvents: true,
    workerSimulation: true,
    backgroundWork: true,
    prefetchLevel: "conservative",
    volcanoRenderer: "webgl2",
    volcanoScale: 0.72,
    volcanoFps: 42,
  }),
  [RUNTIME_PROFILES.REDUCED]: Object.freeze({
    aquariumFps: 24,
    marinePopulationScale: 0.52,
    dprCap: 0.82,
    rareOceanEvents: false,
    workerSimulation: false,
    backgroundWork: false,
    prefetchLevel: "critical-only",
    volcanoRenderer: "fallback",
    volcanoScale: 0.45,
    volcanoFps: 20,
  }),
  [RUNTIME_PROFILES.SURVIVAL]: Object.freeze({
    aquariumFps: 15,
    marinePopulationScale: 0.30,
    dprCap: 0.70,
    rareOceanEvents: false,
    workerSimulation: false,
    backgroundWork: false,
    prefetchLevel: "off",
    volcanoRenderer: "fallback",
    volcanoScale: 0.25,
    volcanoFps: 12,
  }),
});

export function runtimeBudgetForProfile(profile, capabilities = {}) {
  const base = PROFILE_BUDGETS[profile] ?? PROFILE_BUDGETS[RUNTIME_PROFILES.HIGH];
  const mobileScale = capabilities.isMobileViewport ? 0.82 : 1;
  const memoryScale = capabilities.deviceMemoryGb !== null
    && capabilities.deviceMemoryGb !== undefined
    && capabilities.deviceMemoryGb <= 4
    ? 0.86
    : 1;

  return Object.freeze({
    ...base,
    aquariumFps: Math.max(15, Math.round(base.aquariumFps * (capabilities.isMobileViewport ? 0.84 : 1))),
    marinePopulationScale: Number((base.marinePopulationScale * mobileScale * memoryScale).toFixed(3)),
    dprCap: Math.min(base.dprCap, capabilities.dpr || base.dprCap),
    workerSimulation: base.workerSimulation && capabilities.workerSupport !== false,
    profile,
  });
}

export function resolveProfileFromSignals({
  capabilityProfile = RUNTIME_PROFILES.HIGH,
  performanceMode = "full",
  performanceRecommendation = "high",
  urgent = false,
  memoryState = "normal",
} = {}) {
  let profile = clampRuntimeProfile(capabilityProfile, performanceModeCeiling(performanceMode));

  if (urgent) profile = clampRuntimeProfile(profile, RUNTIME_PROFILES.REDUCED);
  else if (performanceRecommendation === "constrained") profile = clampRuntimeProfile(profile, RUNTIME_PROFILES.REDUCED);
  else if (performanceRecommendation === "balanced") profile = clampRuntimeProfile(profile, RUNTIME_PROFILES.BALANCED);

  if (memoryState === "watch") profile = clampRuntimeProfile(profile, RUNTIME_PROFILES.HIGH);
  if (memoryState === "pressure") profile = clampRuntimeProfile(profile, RUNTIME_PROFILES.REDUCED);
  if (memoryState === "critical") profile = RUNTIME_PROFILES.SURVIVAL;
  if (memoryState === "recovering") profile = clampRuntimeProfile(profile, RUNTIME_PROFILES.BALANCED);

  return profile;
}
