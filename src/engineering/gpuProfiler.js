const WINDOW_KEY = "__portfolioGpuTelemetry";
const MAX_SAMPLES = 120;

function store() {
  if (typeof window === "undefined") return null;
  if (!window[WINDOW_KEY]) {
    window[WINDOW_KEY] = { sources: {}, lastUpdatedAt: 0 };
  }
  return window[WINDOW_KEY];
}

export function reportGpuDuration(source, durationMs) {
  const value = Number(durationMs);
  if (!Number.isFinite(value) || value < 0) return;
  const target = store();
  if (!target) return;
  const current = target.sources[source] ?? { samples: [] };
  current.samples = [...current.samples, value].slice(-MAX_SAMPLES);
  current.lastMs = value;
  current.averageMs = current.samples.reduce((sum, item) => sum + item, 0) / current.samples.length;
  current.p95Ms = [...current.samples].sort((left, right) => left - right)[Math.max(0, Math.ceil(current.samples.length * .95) - 1)] ?? value;
  current.sampleCount = current.samples.length;
  current.sampledAt = Date.now();
  target.sources[source] = current;
  target.lastUpdatedAt = current.sampledAt;
}

export function getGpuTelemetrySnapshot() {
  const target = store();
  const sources = target?.sources ?? {};
  const entries = Object.entries(sources).map(([name, value]) => ({ name, ...value }));
  const live = entries.filter((entry) => Date.now() - Number(entry.sampledAt || 0) < 5000);
  const aggregate = live;
  const averageMs = aggregate.length
    ? aggregate.reduce((sum, entry) => sum + Number(entry.averageMs || 0), 0)
    : Number.NaN;
  const p95Ms = aggregate.length ? Math.max(...aggregate.map((entry) => Number(entry.p95Ms || 0))) : Number.NaN;
  return {
    supported: entries.length > 0,
    averageMs,
    p95Ms,
    sources: entries,
    sampledAt: target?.lastUpdatedAt || null,
  };
}

export function createGpuTimerQuery(gl, source) {
  const extension = gl?.getExtension?.("EXT_disjoint_timer_query_webgl2");
  if (!extension || typeof gl.createQuery !== "function") return null;
  let pending = null;
  let active = null;

  const poll = () => {
    if (!pending) return;
    const available = gl.getQueryParameter(pending, gl.QUERY_RESULT_AVAILABLE);
    const disjoint = gl.getParameter(extension.GPU_DISJOINT_EXT);
    if (!available) return;
    if (!disjoint) {
      const nanoseconds = gl.getQueryParameter(pending, gl.QUERY_RESULT);
      reportGpuDuration(source, Number(nanoseconds) / 1_000_000);
    }
    gl.deleteQuery(pending);
    pending = null;
  };

  return {
    begin() {
      poll();
      if (active || pending) return;
      try {
        active = gl.createQuery();
        gl.beginQuery(extension.TIME_ELAPSED_EXT, active);
      } catch {
        if (active) gl.deleteQuery(active);
        active = null;
      }
    },
    end() {
      if (!active) return;
      try {
        gl.endQuery(extension.TIME_ELAPSED_EXT);
        pending = active;
      } catch {
        gl.deleteQuery(active);
      }
      active = null;
    },
    poll,
    destroy() {
      try {
        if (active) {
          gl.endQuery(extension.TIME_ELAPSED_EXT);
          gl.deleteQuery(active);
        }
        if (pending) gl.deleteQuery(pending);
      } catch {
        // Context destruction is intentionally best-effort.
      }
      active = null;
      pending = null;
    },
  };
}
