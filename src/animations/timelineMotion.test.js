import { describe, expect, test } from "vitest";
import {
  cycleProgress,
  damp,
  pingPongState,
  progressForStep,
  smoothstep,
} from "./timelineMotion";

function simulateDamping(fps) {
  let value = 0;
  const delta = 1 / fps;
  for (let frame = 0; frame < fps; frame += 1) value = damp(value, 1, 9, delta);
  return value;
}

describe("timeline motion utilities", () => {
  test("le lissage est indépendant du taux de rafraîchissement", () => {
    const at60 = simulateDamping(60);
    expect(at60).toBeCloseTo(simulateDamping(90), 5);
    expect(at60).toBeCloseTo(simulateDamping(120), 5);
    expect(at60).toBeCloseTo(simulateDamping(144), 5);
    expect(at60).toBeGreaterThan(0.99);
  });

  test("smoothstep fournit une transition bornée", () => {
    expect(smoothstep(0.2, 0.8, 0)).toBe(0);
    expect(smoothstep(0.2, 0.8, 1)).toBe(1);
    expect(smoothstep(0.2, 0.8, 0.5)).toBeCloseTo(0.5, 5);
  });

  test("la boucle autonome dépend du temps et non du scroll", () => {
    expect(cycleProgress(0, 10_000)).toBe(0);
    expect(cycleProgress(2_500, 10_000)).toBeCloseTo(0.25, 8);
    expect(cycleProgress(12_500, 10_000)).toBeCloseTo(0.25, 8);
    expect(pingPongState(0, 10_000)).toEqual({ progress: 0, direction: 1 });
    expect(pingPongState(5_000, 10_000)).toEqual({ progress: 1, direction: -1 });
  });

  test("la ligne progresse par étapes simulées sans dépendre des pixels scrollés", () => {
    expect(progressForStep(-1, 5)).toBe(0);
    expect(progressForStep(0, 5)).toBeCloseTo(0.2, 8);
    expect(progressForStep(2, 5)).toBeCloseTo(0.6, 8);
    expect(progressForStep(4, 5)).toBe(1);
    expect(progressForStep(99, 5)).toBe(1);
  });
});
