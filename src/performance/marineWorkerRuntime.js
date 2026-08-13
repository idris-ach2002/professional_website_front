export function applyMarineStateBuffer(agents, stateBuffer, count = agents?.length ?? 0) {
  if (!Array.isArray(agents) || !(stateBuffer instanceof ArrayBuffer)) return false;
  const state = new Float32Array(stateBuffer);
  const limit = Math.min(agents.length, Number(count || 0), Math.floor(state.length / 5));
  for (let index = 0; index < limit; index += 1) {
    const offset = index * 5;
    const agent = agents[index];
    agent.x = state[offset];
    agent.y = state[offset + 1];
    agent.vx = state[offset + 2];
    agent.vy = state[offset + 3];
    agent.heading = state[offset + 4];
  }
  return limit === agents.length;
}

const DEFAULT_SYNC_TIMEOUT_MS = 2_500;
const DEFAULT_STEP_TIMEOUT_MS = 900;

export function createMarineWorkerRuntime({
  onState,
  onStatus,
  WorkerClass = typeof Worker === "undefined" ? null : Worker,
  now = () => performance.now(),
  stallTimeoutMs,
  syncTimeoutMs = stallTimeoutMs ?? DEFAULT_SYNC_TIMEOUT_MS,
  stepTimeoutMs = stallTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS,
} = {}) {
  if (!WorkerClass) return null;

  let worker;
  try {
    worker = new WorkerClass(new URL("../workers/marineSimulation.worker.js", import.meta.url), { type: "module" });
  } catch {
    return null;
  }

  let generation = 0;
  let requestId = 0;
  let inFlight = false;
  let ready = false;
  let failed = false;
  let sentAt = 0;
  let lastLatencyMs = 0;
  let pendingOperation = null;

  const publishStatus = (status, extra = {}) => {
    onStatus?.({
      status,
      ready,
      failed,
      inFlight,
      generation,
      lastLatencyMs,
      ...extra,
    });
  };

  worker.addEventListener("message", (event) => {
    const message = event.data;
    if (!message) return;

    if (message.type === "marine-population-synced") {
      if (Number(message.generation) !== generation) return;
      ready = true;
      inFlight = false;
      pendingOperation = null;
      publishStatus("ready", { count: message.count });
      return;
    }

    if (message.type === "marine-step-result") {
      if (Number(message.generation) !== generation) return;
      inFlight = false;
      pendingOperation = null;
      lastLatencyMs = sentAt > 0 ? Math.max(0, now() - sentAt) : 0;
      onState?.(message.stateBuffer, message.count, {
        generation,
        requestId: message.requestId,
        latencyMs: lastLatencyMs,
      });
      publishStatus("active");
    }
  });

  const failWorker = (reason) => {
    if (failed) return;
    failed = true;
    ready = false;
    inFlight = false;
    pendingOperation = null;
    try { worker.terminate(); } catch { /* fallback must remain available */ }
    publishStatus("failed", { reason });
  };

  const currentTimeoutMs = () => pendingOperation === "sync"
    ? Math.max(1, Number(syncTimeoutMs) || DEFAULT_SYNC_TIMEOUT_MS)
    : Math.max(1, Number(stepTimeoutMs) || DEFAULT_STEP_TIMEOUT_MS);

  const hasStalled = () => inFlight
    && sentAt > 0
    && now() - sentAt >= currentTimeoutMs();

  worker.addEventListener("error", () => failWorker("worker-error"));

  return {
    sync(agents) {
      if (failed) return false;
      generation += 1;
      ready = false;
      inFlight = true;
      pendingOperation = "sync";
      sentAt = now();
      worker.postMessage({
        type: "sync-marine-population",
        generation,
        agents: Array.isArray(agents) ? agents : [],
      });
      publishStatus("syncing");
      return true;
    },
    step({ delta, elapsed, biome, danger } = {}) {
      if (failed) return false;
      if (hasStalled()) {
        failWorker("worker-stall");
        return false;
      }
      if (!ready || inFlight) return false;
      requestId += 1;
      inFlight = true;
      pendingOperation = "step";
      sentAt = now();
      worker.postMessage({
        type: "step-marine-population",
        generation,
        requestId,
        delta,
        elapsed,
        biome,
        danger,
      });
      return true;
    },
    getStatus() {
      if (hasStalled()) failWorker("worker-stall");
      return {
        ready,
        failed,
        inFlight,
        generation,
        requestId,
        lastLatencyMs,
        pendingOperation,
        timeoutMs: inFlight ? currentTimeoutMs() : null,
      };
    },
    terminate() {
      ready = false;
      inFlight = false;
      pendingOperation = null;
      try { worker.terminate(); } catch { /* already terminated */ }
      publishStatus("terminated");
    },
  };
}
