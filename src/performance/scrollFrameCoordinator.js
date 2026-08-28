const subscribers = new Set();

let listening = false;
let resizeObserver = null;
let frame = 0;
let metricsDirty = true;
let snapshot = Object.freeze({
  version: 0,
  timestamp: 0,
  scrollTop: 0,
  delta: 0,
  direction: "down",
  viewportWidth: 1,
  viewportHeight: 1,
  scrollHeight: 1,
  maxScroll: 1,
});

function readScrollTop() {
  if (typeof window === "undefined") return 0;
  const visualTop = window.visualViewport?.pageTop;
  if (Number.isFinite(visualTop)) return Math.max(0, visualTop);
  if (Number.isFinite(window.scrollY)) return Math.max(0, window.scrollY);
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  return Math.max(0, scrollingElement?.scrollTop ?? 0);
}

function readSnapshot(timestamp = performance.now(), forceMetrics = false) {
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  const viewportWidth = Math.max(1, window.visualViewport?.width ?? window.innerWidth ?? snapshot.viewportWidth ?? 1);
  const viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight ?? snapshot.viewportHeight ?? 1);
  const scrollTop = readScrollTop();
  const delta = scrollTop - snapshot.scrollTop;
  const direction = Math.abs(delta) >= 0.5 ? (delta > 0 ? "down" : "up") : snapshot.direction;
  const scrollHeight = forceMetrics || metricsDirty || snapshot.version === 0
    ? Math.max(viewportHeight, scrollingElement?.scrollHeight ?? document.documentElement?.scrollHeight ?? viewportHeight)
    : snapshot.scrollHeight;

  snapshot = Object.freeze({
    version: snapshot.version + 1,
    timestamp,
    scrollTop,
    delta,
    direction,
    viewportWidth,
    viewportHeight,
    scrollHeight,
    maxScroll: Math.max(1, scrollHeight - viewportHeight),
  });
  metricsDirty = false;
  return snapshot;
}

function flush(timestamp) {
  frame = 0;
  const next = readSnapshot(timestamp, metricsDirty);
  for (const subscriber of subscribers) subscriber(next);
}

function schedule({ metrics = false } = {}) {
  if (typeof window === "undefined") return;
  metricsDirty = metricsDirty || metrics;
  if (frame) return;
  frame = window.requestAnimationFrame(flush);
}

function handleScroll() {
  schedule();
}

function handleResize() {
  schedule({ metrics: true });
}

function ensureListening() {
  if (listening || typeof window === "undefined" || typeof document === "undefined") return;
  listening = true;
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
  window.visualViewport?.addEventListener("scroll", handleScroll, { passive: true });
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => schedule({ metrics: true }));
    if (document.documentElement) resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
  }
  readSnapshot(performance.now(), true);
}

function cleanupIfIdle() {
  if (!listening || subscribers.size > 0 || typeof window === "undefined") return;
  listening = false;
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleResize);
  window.visualViewport?.removeEventListener("resize", handleResize);
  window.visualViewport?.removeEventListener("scroll", handleScroll);
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
}

export function subscribeScrollFrame(listener, { immediate = true } = {}) {
  if (typeof listener !== "function") return () => {};
  ensureListening();
  subscribers.add(listener);
  if (immediate) listener(snapshot.version ? snapshot : readSnapshot(performance.now(), true));
  return () => {
    subscribers.delete(listener);
    cleanupIfIdle();
  };
}

export function getScrollFrameSnapshot({ fresh = false, metrics = false } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return snapshot;
  if (!listening) return readSnapshot(performance.now(), metrics || !snapshot.version);
  if (fresh || !snapshot.version || metrics) return readSnapshot(performance.now(), metrics);
  return snapshot;
}
