const resources = new Map();
const owners = new Map();
const listeners = new Set();
let sequence = 0;

function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function emit() {
  const snapshot = getRuntimeResourceSnapshot();
  for (const listener of listeners) {
    try { listener(snapshot); } catch { /* diagnostics must never break runtime */ }
  }
}

export function markRuntimeOwnerMounted(owner) {
  if (!owner) return;
  owners.set(owner, { mounted: true, changedAt: now() });
  emit();
}

export function markRuntimeOwnerUnmounted(owner) {
  if (!owner) return;
  owners.set(owner, { mounted: false, changedAt: now() });
  emit();
}

export function registerRuntimeResource({ owner = "unknown", type = "resource", label = "", estimatedBytes = 0, metadata = {} } = {}) {
  const id = `${type}:${++sequence}`;
  markRuntimeOwnerMounted(owner);
  resources.set(id, {
    id,
    owner,
    type,
    label,
    estimatedBytes: Math.max(0, Number(estimatedBytes || 0)),
    metadata: { ...metadata },
    createdAt: now(),
    updatedAt: now(),
  });
  emit();

  let released = false;
  return {
    id,
    update(patch = {}) {
      if (released) return;
      const current = resources.get(id);
      if (!current) return;
      resources.set(id, {
        ...current,
        ...patch,
        id,
        owner: current.owner,
        type: current.type,
        estimatedBytes: Math.max(0, Number(patch.estimatedBytes ?? current.estimatedBytes ?? 0)),
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        updatedAt: now(),
      });
      emit();
    },
    release() {
      if (released) return;
      released = true;
      resources.delete(id);
      emit();
    },
  };
}

export function getRuntimeResourceSnapshot({ leakGraceMs = 1200 } = {}) {
  const timestamp = now();
  const countsByType = {};
  let estimatedBytes = 0;
  const active = [];
  const possibleLeaks = [];

  for (const resource of resources.values()) {
    countsByType[resource.type] = (countsByType[resource.type] ?? 0) + 1;
    estimatedBytes += Number(resource.estimatedBytes || 0);
    active.push({ ...resource });

    const owner = owners.get(resource.owner);
    if (owner && !owner.mounted && timestamp - owner.changedAt >= leakGraceMs) {
      possibleLeaks.push({
        ...resource,
        ownerUnmountedForMs: timestamp - owner.changedAt,
      });
    }
  }

  return {
    activeCount: active.length,
    estimatedBytes,
    countsByType,
    possibleLeaks,
    active,
    sampledAt: timestamp,
  };
}

export function subscribeRuntimeResources(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetRuntimeResourceRegistryForTests() {
  resources.clear();
  owners.clear();
  listeners.clear();
  sequence = 0;
}
