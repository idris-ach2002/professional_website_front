export const MAIN_THREAD_LAB_KEY = "__portfolioMainThreadLab";

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1));
  return sorted[index];
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export async function installMainThreadLaboratory(context) {
  await context.addInitScript(({ key }) => {
    const supported = typeof PerformanceObserver === "function"
      ? PerformanceObserver.supportedEntryTypes ?? []
      : [];

    const state = {
      schema: 1,
      active: false,
      label: null,
      startedAt: 0,
      endedAt: 0,
      frameDeltas: [],
      eventLoopDelays: [],
      longTasks: [],
      longAnimationFrames: [],
      observers: [],
      rafId: 0,
      timerId: 0,
      lastFrameAt: 0,
      lastTimerAt: 0,
    };

    const trimScriptUrl = (value) => {
      if (!value) return "unknown";
      try {
        const parsed = new URL(value, window.location.href);
        return `${parsed.pathname}${parsed.search}`;
      } catch {
        return String(value).slice(-160);
      }
    };

    const resetBuffers = () => {
      state.frameDeltas.length = 0;
      state.eventLoopDelays.length = 0;
      state.longTasks.length = 0;
      state.longAnimationFrames.length = 0;
      state.lastFrameAt = 0;
      state.lastTimerAt = 0;
    };

    const stopSamplingLoops = () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      if (state.timerId) clearTimeout(state.timerId);
      state.rafId = 0;
      state.timerId = 0;
    };

    const frameTick = (timestamp) => {
      state.rafId = 0;
      if (!state.active) return;
      if (state.lastFrameAt > 0) {
        const delta = timestamp - state.lastFrameAt;
        if (delta > 0 && delta < 2_000) state.frameDeltas.push(delta);
      }
      state.lastFrameAt = timestamp;
      state.rafId = requestAnimationFrame(frameTick);
    };

    const timerTick = () => {
      state.timerId = 0;
      if (!state.active) return;
      const timestamp = performance.now();
      if (state.lastTimerAt > 0) {
        const expectedAt = state.lastTimerAt + 50;
        state.eventLoopDelays.push(Math.max(0, timestamp - expectedAt));
      }
      state.lastTimerAt = timestamp;
      state.timerId = setTimeout(timerTick, 50);
    };

    const begin = (label) => {
      stopSamplingLoops();
      resetBuffers();
      state.label = String(label || "sample");
      state.startedAt = performance.now();
      state.endedAt = 0;
      state.active = true;
      state.rafId = requestAnimationFrame(frameTick);
      state.timerId = setTimeout(timerTick, 50);
      return state.startedAt;
    };

    const end = () => {
      state.active = false;
      state.endedAt = performance.now();
      stopSamplingLoops();
      return state.endedAt;
    };

    const entryBelongsToActiveSample = (entry) => state.active && entry.startTime >= state.startedAt;

    if (supported.includes("longtask")) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entryBelongsToActiveSample(entry)) continue;
            state.longTasks.push({
              startTime: entry.startTime,
              duration: entry.duration,
              name: entry.name || "longtask",
            });
          }
        });
        observer.observe({ type: "longtask", buffered: true });
        state.observers.push(observer);
      } catch {
        // Unsupported observer configuration is represented in supportedEntryTypes.
      }
    }

    if (supported.includes("long-animation-frame")) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entryBelongsToActiveSample(entry)) continue;
            const scripts = entry.scripts
              ? Array.from(entry.scripts).map((script) => ({
                duration: Number(script.duration || 0),
                sourceURL: trimScriptUrl(script.sourceURL),
                invoker: String(script.invoker || script.invokerType || "unknown").slice(0, 160),
              }))
              : [];
            state.longAnimationFrames.push({
              startTime: entry.startTime,
              duration: entry.duration,
              blockingDuration: Number(entry.blockingDuration || 0),
              renderStart: Number(entry.renderStart || 0),
              styleAndLayoutStart: Number(entry.styleAndLayoutStart || 0),
              scripts,
            });
          }
        });
        observer.observe({ type: "long-animation-frame", buffered: true });
        state.observers.push(observer);
      } catch {
        // Unsupported observer configuration is represented in supportedEntryTypes.
      }
    }

    Object.defineProperty(window, key, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: {
        begin,
        end,
        snapshot: () => ({
          schema: state.schema,
          active: state.active,
          label: state.label,
          startedAt: state.startedAt,
          endedAt: state.endedAt || performance.now(),
          supported: {
            longtask: supported.includes("longtask"),
            longAnimationFrame: supported.includes("long-animation-frame"),
          },
          frameDeltas: [...state.frameDeltas],
          eventLoopDelays: [...state.eventLoopDelays],
          longTasks: state.longTasks.map((entry) => ({ ...entry })),
          longAnimationFrames: state.longAnimationFrames.map((entry) => ({
            ...entry,
            scripts: entry.scripts.map((script) => ({ ...script })),
          })),
        }),
      },
    });
  }, { key: MAIN_THREAD_LAB_KEY });
}

export async function beginMainThreadSample(page, label) {
  await page.evaluate(({ key, sampleLabel }) => {
    const laboratory = window[key];
    if (!laboratory) throw new Error(`Main Thread Laboratory missing: ${key}`);
    laboratory.begin(sampleLabel);
  }, { key: MAIN_THREAD_LAB_KEY, sampleLabel: label });
}

export async function settleMainThreadSample(page, durationMs) {
  await page.evaluate((duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  }), durationMs);
}

export async function endMainThreadSample(page) {
  return page.evaluate((key) => {
    const laboratory = window[key];
    if (!laboratory) throw new Error(`Main Thread Laboratory missing: ${key}`);
    laboratory.end();
    return laboratory.snapshot();
  }, MAIN_THREAD_LAB_KEY);
}

export function summarizeMainThreadSnapshot(snapshot) {
  const frameDeltas = snapshot?.frameDeltas ?? [];
  const eventLoopDelays = snapshot?.eventLoopDelays ?? [];
  const longTasks = snapshot?.longTasks ?? [];
  const longAnimationFrames = snapshot?.longAnimationFrames ?? [];
  const durationMs = Math.max(0, Number(snapshot?.endedAt || 0) - Number(snapshot?.startedAt || 0));

  const scriptTotals = new Map();
  for (const frame of longAnimationFrames) {
    for (const script of frame.scripts ?? []) {
      const key = `${script.sourceURL || "unknown"} :: ${script.invoker || "unknown"}`;
      const current = scriptTotals.get(key) ?? { key, sourceURL: script.sourceURL, invoker: script.invoker, durationMs: 0, samples: 0 };
      current.durationMs += Number(script.duration || 0);
      current.samples += 1;
      scriptTotals.set(key, current);
    }
  }

  const topScripts = [...scriptTotals.values()]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5)
    .map((entry) => ({ ...entry, durationMs: round(entry.durationMs) }));

  const p95FrameMs = percentile(frameDeltas, 95);
  const p99FrameMs = percentile(frameDeltas, 99);
  const maxLongTaskMs = Math.max(0, ...longTasks.map((entry) => Number(entry.duration || 0)));
  const maxLoafMs = Math.max(0, ...longAnimationFrames.map((entry) => Number(entry.duration || 0)));
  const maxBlockingDurationMs = Math.max(0, ...longAnimationFrames.map((entry) => Number(entry.blockingDuration || 0)));
  const maxEventLoopDelayMs = Math.max(0, ...eventLoopDelays);
  const droppedFrameRatio = frameDeltas.length
    ? frameDeltas.filter((delta) => delta > 34).length / frameDeltas.length
    : 0;

  return {
    label: snapshot?.label ?? "unknown",
    durationMs: round(durationMs),
    frameSamples: frameDeltas.length,
    p50FrameMs: round(percentile(frameDeltas, 50)),
    p95FrameMs: round(p95FrameMs),
    p99FrameMs: round(p99FrameMs),
    droppedFrameRatio: round(droppedFrameRatio, 4),
    longTaskSupported: Boolean(snapshot?.supported?.longtask),
    longTaskCount: longTasks.length,
    longTaskTotalMs: round(longTasks.reduce((total, entry) => total + Number(entry.duration || 0), 0)),
    maxLongTaskMs: round(maxLongTaskMs),
    loafSupported: Boolean(snapshot?.supported?.longAnimationFrame),
    longAnimationFrameCount: longAnimationFrames.length,
    maxLongAnimationFrameMs: round(maxLoafMs),
    maxBlockingDurationMs: round(maxBlockingDurationMs),
    maxEventLoopDelayMs: round(maxEventLoopDelayMs),
    topScripts,
  };
}

export function rankMainThreadHotspot(summary) {
  // Le ranking privilégie les signaux de blocage du main thread. La cadence RAF
  // brute reste dans le rapport mais n'est pas une gate absolue en headless.
  const loafPressure = summary.maxBlockingDurationMs > 0
    ? summary.maxLongAnimationFrameMs / 160
    : 0;
  const score = Math.max(
    summary.maxLongTaskMs / 100,
    summary.maxBlockingDurationMs / 80,
    summary.maxEventLoopDelayMs / 100,
    loafPressure,
  );
  return round(score, 3);
}
