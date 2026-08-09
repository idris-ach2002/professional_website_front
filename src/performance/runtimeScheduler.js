export const TASK_PRIORITIES = Object.freeze({
  USER_BLOCKING: "user-blocking",
  USER_VISIBLE: "user-visible",
  BACKGROUND: "background",
});

function createAbortError() {
  try {
    return new DOMException("The task was aborted.", "AbortError");
  } catch {
    const error = new Error("The task was aborted.");
    error.name = "AbortError";
    return error;
  }
}

function runCallback(callback, resolve, reject, signal) {
  if (signal?.aborted) {
    reject(createAbortError());
    return;
  }

  try {
    resolve(callback());
  } catch (error) {
    reject(error);
  }
}

function scheduleFallback(callback, { priority, delay, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    let timeoutId = 0;
    let idleId = 0;
    let settled = false;

    const cleanup = () => {
      if (timeoutId) globalThis.clearTimeout?.(timeoutId);
      if (idleId && typeof globalThis.cancelIdleCallback === "function") {
        globalThis.cancelIdleCallback(idleId);
      }
      signal?.removeEventListener?.("abort", handleAbort);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      runCallback(callback, resolve, reject, signal);
    };

    const handleAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(createAbortError());
    };

    signal?.addEventListener?.("abort", handleAbort, { once: true });

    const schedule = () => {
      if (priority === TASK_PRIORITIES.BACKGROUND && typeof globalThis.requestIdleCallback === "function") {
        idleId = globalThis.requestIdleCallback(finish, { timeout: 800 });
        return;
      }

      timeoutId = globalThis.setTimeout?.(finish, 0) ?? 0;
    };

    if (delay > 0) {
      timeoutId = globalThis.setTimeout?.(() => {
        timeoutId = 0;
        schedule();
      }, delay) ?? 0;
    } else {
      schedule();
    }
  });
}

export function scheduleTask(callback, options = {}) {
  const {
    priority = TASK_PRIORITIES.USER_VISIBLE,
    delay = 0,
    signal,
  } = options;

  if (typeof callback !== "function") {
    return Promise.reject(new TypeError("scheduleTask callback must be a function."));
  }

  const nativeScheduler = globalThis.scheduler;
  if (nativeScheduler?.postTask) {
    return nativeScheduler.postTask(callback, {
      priority,
      delay,
      signal,
    });
  }

  return scheduleFallback(callback, { priority, delay, signal });
}

export function scheduleBackgroundTask(callback, options = {}) {
  return scheduleTask(callback, {
    ...options,
    priority: TASK_PRIORITIES.BACKGROUND,
  });
}

export function scheduleUserVisibleTask(callback, options = {}) {
  return scheduleTask(callback, {
    ...options,
    priority: TASK_PRIORITIES.USER_VISIBLE,
  });
}

export async function yieldToMain(priority = TASK_PRIORITIES.USER_VISIBLE) {
  if (globalThis.scheduler?.yield) {
    await globalThis.scheduler.yield();
    return;
  }

  await scheduleTask(() => undefined, { priority });
}
