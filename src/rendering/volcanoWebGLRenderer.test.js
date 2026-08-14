import { describe, expect, it } from "vitest";
import { shouldUseVolcanoWebGLRenderer } from "./volcanoWebGLRenderer";

describe("volcano WebGL runtime policy", () => {
  it("keeps WebGL for capable runtime profiles", () => {
    expect(shouldUseVolcanoWebGLRenderer({
      runtimeQuality: "balanced",
      volcanoRenderer: "webgl2",
    })).toBe(true);
  });

  it("keeps the original WebGL composition available in constrained quality", () => {
    expect(shouldUseVolcanoWebGLRenderer({
      runtimeQuality: "constrained",
      volcanoRenderer: "webgl2",
    })).toBe(true);
  });

  it("honours an explicit fallback budget independently of the legacy quality", () => {
    expect(shouldUseVolcanoWebGLRenderer({
      runtimeQuality: "high",
      volcanoRenderer: "fallback",
    })).toBe(false);
  });
});
