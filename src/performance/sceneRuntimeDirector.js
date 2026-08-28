const SCENE_RUNTIME_EVENT = "portfolio:scene-runtime";

const records = new Map();
const virtualScenes = new Map();
const subscribers = new Set();
let nearObserver = null;
let visibleObserver = null;
let visibilityListening = false;
let activeScene = "idle";
let version = 0;

function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function isInfiniteCssAnimation(animation) {
  const CssAnimationCtor = typeof CSSAnimation !== "undefined" ? CSSAnimation : null;
  if (CssAnimationCtor && !(animation instanceof CssAnimationCtor)) return false;
  if (!CssAnimationCtor && animation?.constructor?.name !== "CSSAnimation") return false;
  return animation.effect?.getTiming?.().iterations === Infinity;
}

function suspendCssAnimations(record) {
  if (!record?.sleepCssAnimations || record.suspendedAt || !record.element) return;
  const animations = record.element.getAnimations?.({ subtree: true }) ?? [];
  const suspended = animations
    .filter((animation) => animation.playState === "running" && isInfiniteCssAnimation(animation))
    .map((animation) => ({
      animation,
      currentTime: animation.currentTime,
      playbackRate: Number.isFinite(animation.playbackRate) ? animation.playbackRate : 1,
    }));
  if (!suspended.length) return;
  record.suspendedAt = now();
  record.suspended = suspended;
  for (const { animation } of suspended) {
    try { animation.pause(); } catch { /* animation may have been detached */ }
  }
}

function resumeCssAnimations(record) {
  if (!record?.suspendedAt || !record.suspended?.length) {
    if (record) {
      record.suspendedAt = 0;
      record.suspended = [];
    }
    return;
  }
  const elapsed = Math.max(0, now() - record.suspendedAt);
  for (const { animation, currentTime, playbackRate } of record.suspended) {
    if (!animation || animation.playState === "idle") continue;
    try {
      if (currentTime != null) animation.currentTime = currentTime + elapsed * playbackRate;
      animation.play();
    } catch {
      // CSS animation may disappear while React reconciles the subtree.
    }
  }
  record.suspendedAt = 0;
  record.suspended = [];
}

function snapshot() {
  return {
    version,
    activeScene,
    documentVisible: typeof document === "undefined" ? true : !document.hidden,
    scenes: Array.from(records.values(), (record) => ({
      id: record.id,
      near: record.near,
      visible: record.visible,
      ratio: record.ratio,
    })),
    virtualScenes: Array.from(virtualScenes.entries(), ([id, active]) => ({ id, active })),
  };
}

function publish(reason = "update") {
  version += 1;
  const value = snapshot();
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.sceneRuntime = activeScene;
    root.dataset.sceneRuntimeVisible = value.documentVisible ? "true" : "false";
  }
  if (typeof window !== "undefined") {
    window.__portfolioSceneRuntime = value;
    window.dispatchEvent(new CustomEvent(SCENE_RUNTIME_EVENT, { detail: { reason, ...value } }));
  }
  for (const subscriber of subscribers) subscriber(value);
}

function chooseActiveScene() {
  const virtualActive = Array.from(virtualScenes.entries()).find(([, active]) => active)?.[0];
  if (virtualActive) return virtualActive;
  if (typeof window === "undefined") return "idle";
  const center = Math.max(1, window.innerHeight) * 0.5;
  let winner = null;
  let score = Infinity;
  for (const record of records.values()) {
    if (!record.visible || !record.element?.isConnected) continue;
    const rect = record.lastRect;
    if (!rect) continue;
    const rectCenter = rect.top + rect.height * 0.5;
    const distance = Math.abs(rectCenter - center);
    const sizePenalty = Math.max(0, 0.2 - record.ratio) * 500;
    const candidate = distance + sizePenalty;
    if (candidate < score) {
      winner = record.id;
      score = candidate;
    }
  }
  return winner ?? "idle";
}

function refreshActiveScene(reason) {
  const next = chooseActiveScene();
  if (next === activeScene) return;
  activeScene = next;
  publish(reason);
}

function ensureObservers() {
  if (typeof IntersectionObserver === "undefined") return;
  if (!nearObserver) {
    nearObserver = new IntersectionObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const record = records.get(entry.target);
        if (!record) continue;
        const next = Boolean(entry.isIntersecting);
        if (record.near !== next) {
          record.near = next;
          record.element.dataset.sceneNear = next ? "true" : "false";
          changed = true;
          record.onNearChange?.(next, entry);
        }
        if (!next || (typeof document !== "undefined" && document.hidden)) suspendCssAnimations(record);
        else resumeCssAnimations(record);
      }
      if (changed) publish("near-change");
    }, { root: null, rootMargin: "100% 0px", threshold: 0 });
  }
  if (!visibleObserver) {
    visibleObserver = new IntersectionObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const record = records.get(entry.target);
        if (!record) continue;
        const next = Boolean(entry.isIntersecting);
        record.lastRect = entry.boundingClientRect;
        record.ratio = Number(entry.intersectionRatio) || 0;
        if (record.visible !== next) {
          record.visible = next;
          record.element.dataset.sceneVisible = next ? "true" : "false";
          changed = true;
          record.onVisibleChange?.(next, entry);
        }
      }
      if (changed) publish("visible-change");
      refreshActiveScene("active-scene-change");
    }, { root: null, threshold: [0, 0.01, 0.2, 0.5, 0.8] });
  }
  if (!visibilityListening && typeof document !== "undefined") {
    visibilityListening = true;
    document.addEventListener("visibilitychange", handleDocumentVisibility);
  }
}

function handleDocumentVisibility() {
  const hidden = document.hidden;
  for (const record of records.values()) {
    if (hidden || !record.near) suspendCssAnimations(record);
    else resumeCssAnimations(record);
    record.onDocumentVisibilityChange?.(!hidden);
  }
  publish(hidden ? "document-hidden" : "document-visible");
}

function cleanupObserversIfIdle() {
  if (records.size || virtualScenes.size) return;
  nearObserver?.disconnect();
  visibleObserver?.disconnect();
  nearObserver = null;
  visibleObserver = null;
  if (visibilityListening && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleDocumentVisibility);
    visibilityListening = false;
  }
  activeScene = "idle";
  if (typeof document !== "undefined") {
    delete document.documentElement.dataset.sceneRuntime;
    delete document.documentElement.dataset.sceneRuntimeVisible;
  }
}

export function registerSceneElement(id, element, options = {}) {
  if (!id || !element) return () => {};
  ensureObservers();
  const record = {
    id,
    element,
    near: true,
    visible: false,
    ratio: 0,
    lastRect: null,
    sleepCssAnimations: options.sleepCssAnimations !== false,
    onNearChange: options.onNearChange,
    onVisibleChange: options.onVisibleChange,
    onDocumentVisibilityChange: options.onDocumentVisibilityChange,
    suspendedAt: 0,
    suspended: [],
  };
  element.dataset.sceneRuntimeId = id;
  element.dataset.sceneNear = "true";
  element.dataset.sceneVisible = "false";
  records.set(element, record);
  nearObserver?.observe(element);
  visibleObserver?.observe(element);
  publish("scene-register");
  return () => {
    resumeCssAnimations(record);
    nearObserver?.unobserve(element);
    visibleObserver?.unobserve(element);
    records.delete(element);
    delete element.dataset.sceneRuntimeId;
    delete element.dataset.sceneNear;
    delete element.dataset.sceneVisible;
    refreshActiveScene("scene-unregister");
    publish("scene-unregister");
    cleanupObserversIfIdle();
  };
}

export function setVirtualSceneActivity(id, active) {
  if (!id) return;
  ensureObservers();
  if (active) virtualScenes.set(id, true);
  else virtualScenes.delete(id);
  refreshActiveScene("virtual-scene");
  publish("virtual-scene");
  cleanupObserversIfIdle();
}

export function subscribeSceneRuntime(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getSceneRuntimeSnapshot() {
  return snapshot();
}

export { SCENE_RUNTIME_EVENT };
