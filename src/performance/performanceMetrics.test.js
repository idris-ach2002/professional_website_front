import { describe, expect, it } from "vitest";
import { analyzePerformanceWindow, compareRuntimeQuality } from "./performanceMetrics";

function frames(value, count = 180) {
  return Float32Array.from({ length: count }, () => value);
}

describe("performance runtime metrics", () => {
  it("conserve la qualité haute sur une cadence 120 Hz stable", () => {
    const analysis = analyzePerformanceWindow({
      frames: frames(8.33),
      count: 180,
      longTasks: { count: 0, maxDuration: 0 },
      longAnimationFrames: { count: 0, maxDuration: 0 },
    });

    expect(analysis.recommendation).toBe("high");
    expect(analysis.estimatedHz).toBeGreaterThanOrEqual(118);
    expect(analysis.droppedFrameRatio).toBe(0);
  });

  it("dégrade sous une pression de frames et de tâches longues", () => {
    const sample = [
      ...Array.from({ length: 110 }, () => 8.33),
      ...Array.from({ length: 45 }, () => 18),
      ...Array.from({ length: 25 }, () => 55),
    ];
    const analysis = analyzePerformanceWindow({
      frames: Float32Array.from(sample),
      count: sample.length,
      longTasks: { count: 5, maxDuration: 155 },
      longAnimationFrames: { count: 4, maxDuration: 130 },
    });

    expect(analysis.recommendation).toBe("constrained");
    expect(analysis.urgent).toBe(true);
  });

  it("ordonne les niveaux du governor", () => {
    expect(compareRuntimeQuality("high", "balanced")).toBeGreaterThan(0);
    expect(compareRuntimeQuality("constrained", "balanced")).toBeLessThan(0);
    expect(compareRuntimeQuality("balanced", "balanced")).toBe(0);
  });
});
