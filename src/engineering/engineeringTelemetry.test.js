import { describe, expect, it, vi } from "vitest";
import { analyzeRuntimeMode, bytes, detectGraphicsDeviceAsync, frameVerdict } from "./engineeringTelemetry";

describe("engineeringTelemetry", () => {
  it("explique le facteur qui limite le profil runtime", () => {
    const analysis = analyzeRuntimeMode({
      profile: "reduced",
      capabilityProfile: "ultra",
      preferenceMode: "full",
      metrics: { recommendation: "high", p95FrameMs: 8 },
      memory: { state: "pressure", assessment: { score: .72 } },
      capabilities: { hardwareConcurrency: 20, deviceMemoryGb: 16 },
    });
    expect(analysis.primary.id).toBe("memory");
    expect(analysis.explanation).toContain("pression mémoire");
  });

  it("traduit les mesures techniques en valeurs lisibles", () => {
    expect(bytes(8 * 1024 ** 3)).toBe("8.0 Go");
    expect(frameVerdict(7, 120).label).toBe("Très fluide");
    expect(frameVerdict(30, 60).status).toBe("watch");
  });

  it("demande automatiquement l’adaptateur WebGPU haute performance sans installation", async () => {
    const requestAdapter = vi.fn().mockResolvedValue({
      info: { vendor: "NVIDIA", description: "RTX 4050" },
      limits: { maxTextureDimension2D: 16384, maxBufferSize: 1024 },
    });
    const result = await detectGraphicsDeviceAsync({
      documentLike: null,
      navigatorLike: { gpu: { requestAdapter }, platform: "Linux" },
      windowLike: {},
    });
    expect(requestAdapter).toHaveBeenCalledWith({ powerPreference: "high-performance" });
    expect(result.webgpuAdapter.description).toBe("RTX 4050");
  });
});
