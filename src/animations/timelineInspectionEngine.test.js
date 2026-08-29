import { describe, expect, test } from "vitest";
import {
  createInspectionPilot,
  INSPECTION_PHASES,
  hideInspectionPilot,
  requestInspectionTarget,
  stepInspectionPilot,
  stepInspectionPilotInPlace,
} from "./timelineInspectionEngine";

function advance(state, seconds, fps = 120, options = {}) {
  let next = state;
  for (let frame = 0; frame < Math.ceil(seconds * fps); frame += 1) {
    next = stepInspectionPilot(next, 1 / fps, options);
  }
  return next;
}

function advanceInPlace(state, seconds, fps = 120, options = {}) {
  for (let frame = 0; frame < Math.ceil(seconds * fps); frame += 1) {
    const returned = stepInspectionPilotInPlace(state, 1 / fps, options);
    expect(returned).toBe(state);
  }
  return state;
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

  test("la variante mutable reste numériquement équivalente pendant tout un cycle d’inspection", () => {
    const options = { mobile: false };
    let immutable = requestInspectionTarget(createInspectionPilot({ x: 0.5, y: 0.18 }), { index: 2, side: "left", y: 0.64 }, options);
    const mutable = structuredClone(immutable);

    for (let frame = 0; frame < 180; frame += 1) {
      immutable = stepInspectionPilot(immutable, 1 / 120, options);
      const returned = stepInspectionPilotInPlace(mutable, 1 / 120, options);
      expect(returned).toBe(mutable);
      expect(mutable.phase).toBe(immutable.phase);
      expect(mutable.facing).toBe(immutable.facing);
      expect(mutable.targetIndex).toBe(immutable.targetIndex);
      expect(mutable.x).toBeCloseTo(immutable.x, 12);
      expect(mutable.y).toBeCloseTo(immutable.y, 12);
      expect(mutable.opacity).toBeCloseTo(immutable.opacity, 12);
      expect(mutable.torch).toBeCloseTo(immutable.torch, 12);
    }

    expect(mutable.phase).toBe(INSPECTION_PHASES.INSPECT);
  });

  test("la variante mutable couvre disparition, changement de cible et retour idle sans changer les transitions", () => {
    const options = { mobile: true };
    let immutable = {
      ...createInspectionPilot({ facing: "left", x: 0.62, y: 0.38 }),
      phase: INSPECTION_PHASES.INSPECT,
      opacity: 1,
      torch: 1.5,
      targetIndex: 0,
    };
    const mutable = structuredClone(immutable);

    immutable = hideInspectionPilot(immutable);
    Object.assign(mutable, hideInspectionPilot(mutable));
    immutable = requestInspectionTarget(immutable, { index: 3, side: "right", y: 0.46 }, options);
    Object.assign(mutable, requestInspectionTarget(mutable, { index: 3, side: "right", y: 0.46 }, options));

    for (let frame = 0; frame < 160; frame += 1) {
      immutable = stepInspectionPilot(immutable, 1 / 120, options);
      stepInspectionPilotInPlace(mutable, 1 / 120, options);
    }

    expect(mutable.phase).toBe(immutable.phase);
    expect(mutable.facing).toBe(immutable.facing);
    expect(mutable.targetIndex).toBe(immutable.targetIndex);
    expect(mutable.x).toBeCloseTo(immutable.x, 12);
    expect(mutable.y).toBeCloseTo(immutable.y, 12);
    expect(mutable.opacity).toBeCloseTo(immutable.opacity, 12);
    expect(mutable.torch).toBeCloseTo(immutable.torch, 12);

    immutable = hideInspectionPilot(immutable);
    Object.assign(mutable, hideInspectionPilot(mutable));
    immutable = advance(immutable, 0.12, 120, options);
    advanceInPlace(mutable, 0.12, 120, options);

    expect(mutable.phase).toBe(INSPECTION_PHASES.IDLE);
    expect(mutable.phase).toBe(immutable.phase);
    expect(mutable.opacity).toBe(0);
    expect(mutable.torch).toBe(0);
  });

  test("la variante mutable préserve les no-op et le fallback de phase", () => {
    const idle = createInspectionPilot();
    expect(stepInspectionPilotInPlace(idle, 0)).toBe(idle);

    const unknown = { ...idle, phase: "future-phase", phaseElapsed: 0.2 };
    const returned = stepInspectionPilotInPlace(unknown, 0.01);
    expect(returned).toBe(unknown);
    expect(unknown.phaseElapsed).toBeCloseTo(0.21, 10);
  });

});
