import { describe, expect, test } from "vitest";
import {
  createInspectionPilot,
  INSPECTION_PHASES,
  requestInspectionTarget,
  stepInspectionPilot,
} from "./timelineInspectionEngine";

function advance(state, seconds, fps = 120, options = {}) {
  let next = state;
  for (let frame = 0; frame < Math.ceil(seconds * fps); frame += 1) {
    next = stepInspectionPilot(next, 1 / fps, options);
  }
  return next;
}

describe("timeline inspection engine", () => {
  test("reste visible lorsqu’il change de côté et traverse la timeline dans le bon sens", () => {
    let state = createInspectionPilot({ facing: "left", x: 0.72, y: 0.4 });
    state = { ...state, opacity: 1, phase: INSPECTION_PHASES.INSPECT, targetIndex: 0 };
    state = requestInspectionTarget(state, { index: 1, side: "right" });

    expect(state.phase).toBe(INSPECTION_PHASES.TRANSIT);
    expect(state.facing).toBe("right");
    expect(state.opacity).toBe(1);
    expect(state.targetX).toBeLessThan(state.startX);

    const midway = advance(state, state.transitDuration * 0.5);
    expect(midway.opacity).toBe(1);
    expect(midway.x).toBeLessThan(state.startX);

    state = advance(state, state.transitDuration + 0.1);
    expect(state.phase).toBe(INSPECTION_PHASES.INSPECT);
    expect(state.facing).toBe("right");
    expect(state.opacity).toBe(1);
  });

  test("éclaire une carte presque immédiatement et termine l'approche en moins de deux secondes", () => {
    let state = createInspectionPilot({ facing: "left" });
    state = requestInspectionTarget(state, { index: 0, side: "left" });

    state = advance(state, 0.16);
    expect(state.phase).toBe(INSPECTION_PHASES.TRANSIT);
    expect(state.torch).toBeGreaterThan(0.7);
    expect(state.transitDuration).toBeLessThanOrEqual(0.72);
    expect(state.transitDuration).toBeGreaterThanOrEqual(0.34);

    state = advance(state, 0.95);
    expect(state.phase).toBe(INSPECTION_PHASES.INSPECT);
    expect(state.targetIndex).toBe(0);
    expect(state.torch).toBeGreaterThan(1.3);
    expect(state.opacity).toBe(1);
  });

  test("la trajectoire reste stable entre 60 et 120 Hz", () => {
    const initial60 = requestInspectionTarget(createInspectionPilot(), { index: 2, side: "left" });
    const initial120 = requestInspectionTarget(createInspectionPilot(), { index: 2, side: "left" });
    const at60 = advance(initial60, 0.8, 60);
    const at120 = advance(initial120, 0.8, 120);
    expect(at60.x).toBeCloseTo(at120.x, 3);
    expect(at60.y).toBeCloseTo(at120.y, 3);
    expect(at60.opacity).toBeCloseTo(at120.opacity, 3);
    expect(at60.torch).toBeCloseTo(at120.torch, 3);
  });
});
