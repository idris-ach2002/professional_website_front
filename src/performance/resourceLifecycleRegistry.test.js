import { afterEach, describe, expect, test } from "vitest";
import {
  getRuntimeResourceSnapshot,
  markRuntimeOwnerUnmounted,
  registerRuntimeResource,
  resetRuntimeResourceRegistryForTests,
} from "./resourceLifecycleRegistry";

afterEach(() => resetRuntimeResourceRegistryForTests());

describe("runtime resource lifecycle registry", () => {
  test("compte les ressources et leur poids estimé", () => {
    const canvas = registerRuntimeResource({ owner: "ocean", type: "canvas", estimatedBytes: 8_000_000 });
    const worker = registerRuntimeResource({ owner: "ocean", type: "worker" });
    const snapshot = getRuntimeResourceSnapshot();
    expect(snapshot.activeCount).toBe(2);
    expect(snapshot.countsByType.canvas).toBe(1);
    expect(snapshot.countsByType.worker).toBe(1);
    expect(snapshot.estimatedBytes).toBe(8_000_000);
    canvas.release();
    worker.release();
    expect(getRuntimeResourceSnapshot().activeCount).toBe(0);
  });

  test("signale une ressource encore active après démontage de son propriétaire", () => {
    registerRuntimeResource({ owner: "Timeline", type: "raf" });
    markRuntimeOwnerUnmounted("Timeline");
    const snapshot = getRuntimeResourceSnapshot({ leakGraceMs: 0 });
    expect(snapshot.possibleLeaks).toHaveLength(1);
    expect(snapshot.possibleLeaks[0].owner).toBe("Timeline");
  });
});
