import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  scheduleBackgroundTask,
  scheduleTask,
  scheduleUserVisibleTask,
  TASK_PRIORITIES,
  yieldToMain,
} from "./runtimeScheduler";

beforeEach(() => {
  vi.stubGlobal("scheduler", undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("runtime scheduler", () => {
  it("utilise scheduler.postTask quand il est disponible et transmet le contrat", async () => {
    const postTask = vi.fn(async (callback, options) => callback(options.priority));
    vi.stubGlobal("scheduler", { postTask });

    const result = await scheduleTask(
      () => "ok",
      { priority: TASK_PRIORITIES.USER_BLOCKING, delay: 12 },
    );

    expect(result).toBe("ok");
    expect(postTask).toHaveBeenCalledOnce();
    expect(postTask.mock.calls[0][1]).toMatchObject({
      priority: "user-blocking",
      delay: 12,
    });
  });

  it("retombe sur une macrotâche déterministe sans scheduler natif", async () => {
    vi.useFakeTimers();
    const callback = vi.fn(() => 42);
    const pending = scheduleUserVisibleTask(callback);

    expect(callback).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toBe(42);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("utilise requestIdleCallback pour une tâche background", async () => {
    const cancelIdleCallback = vi.fn();
    const requestIdleCallback = vi.fn((callback) => {
      queueMicrotask(() => callback({ didTimeout: false, timeRemaining: () => 8 }));
      return 17;
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);

    await expect(scheduleBackgroundTask(() => "idle")).resolves.toBe("idle");
    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(requestIdleCallback.mock.calls[0][1]).toEqual({ timeout: 800 });
    expect(cancelIdleCallback).toHaveBeenCalledWith(17);
  });

  it("annule une tâche différée sans exécuter son callback", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const callback = vi.fn();
    const pending = scheduleTask(callback, { delay: 250, signal: controller.signal });

    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.runAllTimersAsync();
    expect(callback).not.toHaveBeenCalled();
  });

  it("respecte un AbortSignal déjà annulé", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(scheduleTask(() => 1, { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("propage une exception du callback fallback", async () => {
    vi.useFakeTimers();
    const pending = scheduleTask(() => {
      throw new Error("scheduler-boom");
    });
    const assertion = expect(pending).rejects.toThrow("scheduler-boom");
    await vi.runAllTimersAsync();
    await assertion;
  });

  it("rejette immédiatement un callback invalide", async () => {
    await expect(scheduleTask(null)).rejects.toThrow(TypeError);
  });

  it("yieldToMain utilise scheduler.yield, sinon le fallback", async () => {
    const nativeYield = vi.fn(async () => undefined);
    vi.stubGlobal("scheduler", { yield: nativeYield });
    await yieldToMain();
    expect(nativeYield).toHaveBeenCalledOnce();

    vi.stubGlobal("scheduler", undefined);
    vi.useFakeTimers();
    const fallback = yieldToMain(TASK_PRIORITIES.USER_VISIBLE);
    await vi.runAllTimersAsync();
    await expect(fallback).resolves.toBeUndefined();
  });
});
