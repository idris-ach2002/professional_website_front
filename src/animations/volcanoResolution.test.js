import { describe, expect, it } from "vitest";
import {
  normalizeVolcanoResolution,
  resolveEffectiveVolcanoResolution,
  resolveVolcanoResolutionAssets,
} from "./volcanoResolution";

describe("volcano resolution", () => {
  it("branche Auto sur 4K et conserve Max comme plafond explicite", () => {
    expect(normalizeVolcanoResolution(undefined)).toBe("auto");
    expect(resolveEffectiveVolcanoResolution("auto")).toBe("4k");
    expect(resolveEffectiveVolcanoResolution("max")).toBe("max");
  });

  it("associe chaque résolution raster à la paire d'assets correspondante", () => {
    expect(resolveVolcanoResolutionAssets("4k")).toMatchObject({ id: "4k", width: 3840, height: 2160, vector: false });
    expect(resolveVolcanoResolutionAssets("2k")).toMatchObject({ id: "2k", width: 2560, height: 1440, vector: false });
    expect(resolveVolcanoResolutionAssets("fhd")).toMatchObject({ id: "fhd", width: 1920, height: 1080, vector: false });
    expect(resolveVolcanoResolutionAssets("max")).toMatchObject({ id: "max", width: 5696, height: 3200, vector: true });
  });
});
