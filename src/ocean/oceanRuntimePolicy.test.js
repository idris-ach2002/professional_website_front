import { describe, expect, test } from "vitest";
import { resolveAquariumFps, resolveMineFxFps } from "./oceanRuntimePolicy";

describe("ocean runtime policy", () => {
  test("plafonne les simulations selon le governor et le mobile", () => {
    expect(resolveAquariumFps("high", "full", false)).toBe(60);
    expect(resolveAquariumFps("high", "full", true)).toBe(45);
    expect(resolveAquariumFps("balanced", "full", false)).toBe(45);
    expect(resolveAquariumFps("constrained", "full", false)).toBe(30);
  });

  test("les FX de la mine restent bien plus lents que le rendu principal", () => {
    expect(resolveMineFxFps("high")).toBe(24);
    expect(resolveMineFxFps("balanced")).toBe(18);
    expect(resolveMineFxFps("constrained")).toBe(12);
    expect(resolveMineFxFps("high", true)).toBe(0);
  });
});
