import { describe, expect, test, vi } from "vitest";
import {
  RUNTIME_PROFILES,
  clampRuntimeProfile,
  detectRuntimeCapabilities,
  negotiateCapabilityProfile,
  performanceModeCeiling,
  profileToLegacyQuality,
} from "./runtimeCapabilities";

describe("runtime capability negotiation", () => {
  const high = {
    hardwareConcurrency: 16,
    deviceMemoryGb: 16,
    effectiveType: "4g",
    rttMs: 25,
    downlinkMbps: 20,
    saveData: false,
    reducedMotion: false,
    coarsePointer: false,
    isMobileViewport: false,
    webgl2Supported: true,
    maxTextureSize: 16384,
  };

  test("détecte les signaux navigateur, réseau et WebGL2 réellement disponibles", () => {
    const loseContext = vi.fn();
    const capabilities = detectRuntimeCapabilities({
      navigatorLike: {
        hardwareConcurrency: 12,
        deviceMemory: 16,
        connection: { effectiveType: "4g", downlink: 25, rtt: 18, saveData: false },
        gpu: {},
      },
      windowLike: {
        innerWidth: 1440,
        innerHeight: 900,
        devicePixelRatio: 2,
        Worker: class WorkerMock {},
        OffscreenCanvas: class OffscreenCanvasMock {},
      },
      documentLike: {
        createElement: () => ({
          getContext: () => ({
            MAX_TEXTURE_SIZE: 0x0D33,
            getParameter: () => 16384,
            getExtension: () => ({ loseContext }),
          }),
        }),
      },
      matchMedia: (query) => ({ matches: query.includes("pointer: coarse") }),
    });

    expect(capabilities).toMatchObject({
      hardwareConcurrency: 12,
      deviceMemoryGb: 16,
      effectiveType: "4g",
      downlinkMbps: 25,
      rttMs: 18,
      viewportWidth: 1440,
      viewportHeight: 900,
      dpr: 2,
      workerSupport: true,
      offscreenCanvasSupport: true,
      webgpuSupported: true,
      webgl2Supported: true,
      maxTextureSize: 16384,
      coarsePointer: true,
    });
    expect(loseContext).toHaveBeenCalledOnce();
  });

  test("sélectionne ultra seulement pour une machine réellement confortable", () => {
    expect(negotiateCapabilityProfile(high)).toBe(RUNTIME_PROFILES.ULTRA);
    expect(negotiateCapabilityProfile({ ...high, hardwareConcurrency: 8 })).toBe(RUNTIME_PROFILES.HIGH);
  });

  test("respecte accessibilité, économie de données et faibles capacités", () => {
    expect(negotiateCapabilityProfile({ ...high, reducedMotion: true })).toBe(RUNTIME_PROFILES.REDUCED);
    expect(negotiateCapabilityProfile({ ...high, saveData: true })).toBe(RUNTIME_PROFILES.REDUCED);
    expect(negotiateCapabilityProfile({ ...high, webgl2Supported: false })).toBe(RUNTIME_PROFILES.SURVIVAL);
    expect(negotiateCapabilityProfile({ ...high, hardwareConcurrency: 2 })).toBe(RUNTIME_PROFILES.SURVIVAL);
  });

  test("une machine mobile ou modeste démarre en balanced", () => {
    expect(negotiateCapabilityProfile({ ...high, isMobileViewport: true, hardwareConcurrency: 8 })).toBe(RUNTIME_PROFILES.BALANCED);
    expect(negotiateCapabilityProfile({ ...high, hardwareConcurrency: 4, deviceMemoryGb: 4 })).toBe(RUNTIME_PROFILES.BALANCED);
  });

  test("les préférences utilisateur imposent un plafond sans augmenter artificiellement la qualité", () => {
    expect(performanceModeCeiling("full")).toBe(RUNTIME_PROFILES.ULTRA);
    expect(performanceModeCeiling("balanced")).toBe(RUNTIME_PROFILES.BALANCED);
    expect(performanceModeCeiling("lite")).toBe(RUNTIME_PROFILES.REDUCED);
    expect(performanceModeCeiling("ultra-lite")).toBe(RUNTIME_PROFILES.SURVIVAL);
    expect(clampRuntimeProfile("ultra", "balanced")).toBe("balanced");
    expect(clampRuntimeProfile("reduced", "high")).toBe("reduced");
  });

  test("maintient le contrat legacy high/balanced/constrained", () => {
    expect(profileToLegacyQuality("ultra")).toBe("high");
    expect(profileToLegacyQuality("high")).toBe("high");
    expect(profileToLegacyQuality("balanced")).toBe("balanced");
    expect(profileToLegacyQuality("reduced")).toBe("constrained");
    expect(profileToLegacyQuality("survival")).toBe("constrained");
  });
});
