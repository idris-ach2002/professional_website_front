import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleBackgroundTask, scheduleTask, TASK_PRIORITIES } from "./runtimeScheduler";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runtime scheduler", () => {
  it("utilise scheduler.postTask quand il est disponible", async () => {
    const postTask = vi.fn(async (callback, options) => callback(options.priority));
    vi.stubGlobal("scheduler", { postTask });

    const result = await scheduleTask(
      () => "ok",
      { priority: TASK_PRIORITIES.USER_BLOCKING },
    );

    expect(result).toBe("ok");
    expect(postTask).toHaveBeenCalledOnce();
    expect(postTask.mock.calls[0][1].priority).toBe("user-blocking");
  });

  it("retombe sur une tâche asynchrone sans scheduler natif", async () => {
    vi.stubGlobal("scheduler", undefined);
    await expect(scheduleBackgroundTask(() => 42)).resolves.toBe(42);
  });

  it("respecte un AbortSignal déjà annulé", async () => {
    vi.stubGlobal("scheduler", undefined);
    const controller = new AbortController();
    controller.abort();

    await expect(scheduleTask(() => 1, { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
