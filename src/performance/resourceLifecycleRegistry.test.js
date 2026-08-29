import { afterEach, describe, expect, test } from "vitest";
import {
  getRuntimeResourceSnapshot,
  markRuntimeOwnerUnmounted,
  subscribeRuntimeResources,
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

  test("met à jour une ressource sans changer son identité et notifie les abonnés", () => {
    const snapshots = [];
    const unsubscribe = subscribeRuntimeResources((snapshot) => snapshots.push(snapshot));
    const resource = registerRuntimeResource({
      owner: "Volcano",
      type: "image",
      label: "environment",
      estimatedBytes: 10,
      metadata: { resolution: "4k" },
    });

    resource.update({
      label: "foreground",
      estimatedBytes: 25,
      metadata: { decoded: true },
    });

    const snapshot = getRuntimeResourceSnapshot();
    expect(snapshot.active[0]).toMatchObject({
      id: resource.id,
      owner: "Volcano",
      type: "image",
      label: "foreground",
      estimatedBytes: 25,
      metadata: { resolution: "4k", decoded: true },
    });
    expect(snapshots.length).toBeGreaterThanOrEqual(2);

    unsubscribe();
    const beforeRelease = snapshots.length;
    resource.release();
    resource.release();
    expect(snapshots).toHaveLength(beforeRelease);
  });

  test("ignore les mises à jour après release et les abonnés invalides", () => {
    const noopUnsubscribe = subscribeRuntimeResources(null);
    expect(typeof noopUnsubscribe).toBe("function");
    expect(() => noopUnsubscribe()).not.toThrow();

    const resource = registerRuntimeResource({ owner: "Timeline", type: "raf" });
    resource.release();
    expect(() => resource.update({ estimatedBytes: 99 })).not.toThrow();
    expect(getRuntimeResourceSnapshot().activeCount).toBe(0);
  });

});
