import { describe, expect, test } from "vitest";
import { resolveProfileFromSignals, runtimeBudgetForProfile } from "./runtimeBudgets";

describe("runtime budgets", () => {
  test("les budgets baissent progressivement sans supprimer le contenu", () => {
    const high = runtimeBudgetForProfile("high", { dpr: 2, workerSupport: true, isMobileViewport: false, deviceMemoryGb: 8 });
    const reduced = runtimeBudgetForProfile("reduced", { dpr: 2, workerSupport: true, isMobileViewport: false, deviceMemoryGb: 8 });
    const survival = runtimeBudgetForProfile("survival", { dpr: 2, workerSupport: true, isMobileViewport: false, deviceMemoryGb: 8 });

    expect(high.aquariumFps).toBeGreaterThan(reduced.aquariumFps);
    expect(reduced.aquariumFps).toBeGreaterThan(survival.aquariumFps);
    expect(high.marinePopulationScale).toBeGreaterThan(reduced.marinePopulationScale);
    expect(reduced.marinePopulationScale).toBeGreaterThan(survival.marinePopulationScale);
    expect(survival.marinePopulationScale).toBeGreaterThan(0);
    expect(high.volcanoScale).toBeGreaterThan(reduced.volcanoScale);
    expect(reduced.volcanoScale).toBeGreaterThan(survival.volcanoScale);
    expect(reduced.rareOceanEvents).toBe(false);
    expect(survival.prefetchLevel).toBe("off");
  });

  test("le profil final respecte performance, mémoire et préférence", () => {
    expect(resolveProfileFromSignals({ capabilityProfile: "ultra", performanceMode: "balanced" })).toBe("balanced");
    expect(resolveProfileFromSignals({ capabilityProfile: "ultra", performanceRecommendation: "constrained" })).toBe("reduced");
    expect(resolveProfileFromSignals({ capabilityProfile: "high", memoryState: "critical" })).toBe("survival");
    expect(resolveProfileFromSignals({ capabilityProfile: "ultra", memoryState: "recovering" })).toBe("balanced");
  });
});
