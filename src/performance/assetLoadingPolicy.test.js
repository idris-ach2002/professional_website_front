import { describe, expect, test } from "vitest";
import { ASSET_PRIORITIES, resolveAssetLoadingPolicy } from "./assetLoadingPolicy";

describe("asset loading policy", () => {
  test("priorise les médias immédiatement utiles sur une machine saine", () => {
    const policy = resolveAssetLoadingPolicy({ priority: ASSET_PRIORITIES.VISIBLE_SOON, runtimeProfile: "high" });
    expect(policy.loading).toBe("eager");
    expect(policy.fetchPriority).toBe("high");
    expect(policy.allowSpeculativePreload).toBe(true);
  });

  test("réduit les médias secondaires sous contrainte", () => {
    const policy = resolveAssetLoadingPolicy({
      priority: ASSET_PRIORITIES.VISIBLE_SOON,
      runtimeProfile: "reduced",
      memoryState: "pressure",
    });
    expect(policy.loading).toBe("lazy");
    expect(policy.fetchPriority).toBe("auto");
    expect(policy.allowSpeculativePreload).toBe(false);
  });

  test("un asset critique reste prioritaire même en Save-Data", () => {
    const policy = resolveAssetLoadingPolicy({ priority: ASSET_PRIORITIES.CRITICAL, saveData: true });
    expect(policy.loading).toBe("eager");
    expect(policy.fetchPriority).toBe("high");
  });

  test("le prefetch reste spéculatif seulement hors contrainte et les assets de fond restent low", () => {
    const healthy = resolveAssetLoadingPolicy({
      priority: ASSET_PRIORITIES.PREFETCH,
      runtimeProfile: "high",
      memoryState: "normal",
    });
    expect(healthy).toEqual({
      loading: "lazy",
      fetchPriority: "auto",
      decoding: "async",
      allowSpeculativePreload: true,
    });

    const constrained = resolveAssetLoadingPolicy({
      priority: ASSET_PRIORITIES.PREFETCH,
      effectiveType: "2g",
    });
    expect(constrained.fetchPriority).toBe("low");
    expect(constrained.allowSpeculativePreload).toBe(false);

    expect(resolveAssetLoadingPolicy()).toEqual({
      loading: "lazy",
      fetchPriority: "low",
      decoding: "async",
      allowSpeculativePreload: false,
    });
  });

});
