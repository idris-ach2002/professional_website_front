import { describe, expect, test } from "vitest";
import {
  MEMORY_STATES,
  advanceMemoryPressureState,
  classifyMemoryPressure,
  sampleMemoryPressureSignals,
  scoreMemoryPressure,
} from "./memoryPressureGovernor";

describe("memory pressure governor", () => {
  test("échantillonne ensemble le heap, les ressources et la pression frame", () => {
    expect(sampleMemoryPressureSignals({
      performanceLike: {
        memory: {
          usedJSHeapSize: 600,
          totalJSHeapSize: 750,
          jsHeapSizeLimit: 1000,
        },
      },
      resourceSnapshot: { activeCount: 12, estimatedBytes: 4096 },
      performanceMetrics: { p95FrameMs: 22, severeFrameRatio: 0.03, longTaskCount: 3 },
    })).toEqual({
      heapRatio: 0.6,
      allocatedRatio: 0.75,
      activeResources: 12,
      retainedBytes: 4096,
      p95FrameMs: 22,
      severeFrameRatio: 0.03,
      longTaskCount: 3,
    });
  });

  test("utilise la mémoire directe lorsqu'elle est disponible", () => {
    expect(classifyMemoryPressure({ heapRatio: 0.95, allocatedRatio: 0.97 }).recommendedState).toBe(MEMORY_STATES.CRITICAL);
    expect(classifyMemoryPressure({ heapRatio: 0.3, allocatedRatio: 0.4 }).recommendedState).toBe(MEMORY_STATES.NORMAL);
  });

  test("reste conservateur avec les signaux inférés", () => {
    const result = scoreMemoryPressure({
      heapRatio: null,
      allocatedRatio: null,
      activeResources: 35,
      retainedBytes: 100 * 1024 * 1024,
      p95FrameMs: 26,
      longTaskCount: 4,
      severeFrameRatio: 0.04,
    });
    expect(result.confidence).toBe("inferred");
    expect(result.score).toBeGreaterThan(0.3);
  });

  test("exige deux fenêtres avant PRESSURE mais entre immédiatement en CRITICAL", () => {
    const first = advanceMemoryPressureState("normal", { recommendedState: "pressure" });
    expect(first.state).toBe("watch");
    const second = advanceMemoryPressureState(first.state, { recommendedState: "pressure" }, first.streak);
    expect(second.state).toBe("pressure");

    const critical = advanceMemoryPressureState("normal", { recommendedState: "critical" });
    expect(critical.state).toBe("critical");
  });

  test("la récupération exige plusieurs fenêtres saines", () => {
    const one = advanceMemoryPressureState("pressure", { recommendedState: "normal" });
    expect(one.state).toBe("recovering");
    const two = advanceMemoryPressureState(one.state, { recommendedState: "normal" }, one.streak);
    expect(two.state).toBe("recovering");
    const three = advanceMemoryPressureState(two.state, { recommendedState: "normal" }, two.streak);
    expect(three.state).toBe("normal");
  });
});
