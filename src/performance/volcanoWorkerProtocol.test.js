import { describe, expect, it } from "vitest";
import {
  decodeVolcanoParticles,
  decodeVolcanoRocks,
  readVolcanoFrame,
  requiredVolcanoFrameFloats,
  writeVolcanoFrame,
} from "./volcanoWorkerProtocol";

describe("volcano worker protocol", () => {
  it("round-trips exact draw state through a reusable Float64 transferable buffer", () => {
    const sourceProfile = {
      pulseType: "mega",
      pulseProgress: 0.42,
      pulse: 1.7,
      lava: 1.4,
      crater: 1.3,
      plume: 1.02,
      smokeDensity: 1.34,
      smokeFlow: 1.05,
      bubbles: 1.1,
      embers: 1.2,
      ash: 0.7,
      heat: 1.6,
      turbulence: 1.25,
      waterGlow: 0.9,
      eruption: 1.7,
      fracture: 1.4,
      shock: 1.5,
      sediment: 1.1,
    };
    const particles = [
      {
        type: "smoke",
        variant: 4,
        plumeLayer: "diffuse",
        x: 612.125,
        y: 188.75,
        size: 91.5,
        alpha: 0.41,
        phase: 3.7,
        rotation: 1.2,
        life: 2.1,
        ttl: 7.8,
      },
      {
        type: "bubble",
        variant: 0,
        x: 430.25,
        y: 511.75,
        size: 8.5,
        alpha: 0.27,
        phase: 0.9,
        rotation: 0.3,
        life: 4.2,
        ttl: 9.6,
      },
    ];
    const rocks = [{
      kind: "mega",
      x: 710.125,
      y: 490.875,
      rotation: 0.72,
      size: 12.4,
      heat: 0.61,
      shape: [0.81, 0.72, 0.77, 0.64],
    }];
    const viewport = { width: 1280, height: 720, dpr: 1.16 };
    const floats = requiredVolcanoFrameFloats(particles.length, rocks.length);
    const target = new Float64Array(new ArrayBuffer(floats * Float64Array.BYTES_PER_ELEMENT));
    writeVolcanoFrame(target, 1 / 60, viewport, 12.5, sourceProfile, particles, rocks);

    const decodedProfile = {};
    const decodedViewport = {};
    const meta = readVolcanoFrame(target, decodedProfile, decodedViewport);
    const decodedParticles = [];
    const decodedRocks = [];
    decodeVolcanoParticles(target, meta.particleCount, decodedParticles);
    decodeVolcanoRocks(target, meta.particleCount, meta.rockCount, decodedRocks);

    expect(decodedViewport).toEqual(viewport);
    expect(meta.paintDelta).toBe(1 / 60);
    expect(meta.elapsed).toBe(12.5);
    expect(decodedProfile.pulseType).toBe("mega");
    for (const [key, value] of Object.entries(sourceProfile)) {
      if (key === "pulseType") continue;
      expect(decodedProfile[key]).toBe(value);
    }

    for (let index = 0; index < particles.length; index += 1) {
      const expected = particles[index];
      const actual = decodedParticles[index];
      for (const key of ["type", "variant", "x", "y", "size", "alpha", "phase", "rotation", "life", "ttl"]) {
        expect(actual[key]).toBe(expected[key]);
      }
      if (expected.plumeLayer) expect(actual.plumeLayer).toBe(expected.plumeLayer);
    }
    expect(decodedRocks[0]).toEqual(rocks[0]);
  });
});
