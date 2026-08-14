const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const USE_DIRECT_BACKEND = !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";
const REQUEST_TIMEOUT_MS = 9000;
const OPERATION_NAMES = Object.freeze({
  "/api/engineering/mission-control": "État technique du backend",
  "/api/engineering/mission-control/queue": "Lecture d’une file backend",
  "/api/engineering/performance/history": "Historique de performance",
  "/api/engineering/performance/samples": "Publication d’une mesure",
  "/website/default": "Chargement du portfolio public",
});

async function request(path, options = {}) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener?.("abort", abortFromExternal, { once: true });
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const startedAt = performance.now();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
    });
    const payload = await response.json();
    const endedAt = performance.now();
    const resource = response.url ? performance.getEntriesByName?.(response.url, "resource")?.at(-1) : null;
    const serverTimingHeader = response.headers?.get?.("Server-Timing") ?? "";
    const serverTiming = Array.from(serverTimingHeader.split(",")).map((entry) => {
      const [namePart, ...parameters] = entry.trim().split(";");
      const duration = parameters.map((value) => value.trim()).find((value) => value.startsWith("dur="));
      const description = parameters.map((value) => value.trim()).find((value) => value.startsWith("desc="));
      return {
        name: namePart || "server",
        durationMs: Number(duration?.slice(4)) || 0,
        description: description?.slice(5).replace(/^"|"$/g, "") ?? "",
      };
    }).filter((entry) => entry.durationMs > 0);
    const traceHeader = response.headers?.get?.("X-Portfolio-Trace") ?? "";
    const componentTrail = traceHeader.split(">").map((value) => value.trim()).filter(Boolean);
    const calledComponents = [...new Set([
      ...componentTrail,
      ...serverTiming.map((entry) => entry.description || entry.name).filter(Boolean),
    ])];
    options.onTrace?.({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      method: options.method ?? "GET",
      operation: options.operationName ?? OPERATION_NAMES[path.split("?")[0]] ?? "Requête Engineering",
      path,
      url: response.url || `${window.location.origin}${path}`,
      clientOrigin: window.location.origin,
      initiator: "MissionControlPage",
      status: response.status,
      startedAt: Date.now() - (endedAt - startedAt),
      totalMs: endedAt - startedAt,
      requestBodyBytes: options.body ? new TextEncoder().encode(String(options.body)).byteLength : 0,
      transferBytes: Number(resource?.transferSize || response.headers?.get?.("Content-Length") || 0),
      encodedBodyBytes: Number(resource?.encodedBodySize || 0),
      decodedBodyBytes: Number(resource?.decodedBodySize || new TextEncoder().encode(JSON.stringify(payload)).byteLength),
      dnsMs: resource ? Math.max(0, resource.domainLookupEnd - resource.domainLookupStart) : 0,
      connectMs: resource ? Math.max(0, resource.connectEnd - resource.connectStart) : 0,
      ttfbMs: resource ? Math.max(0, resource.responseStart - resource.requestStart) : 0,
      downloadMs: resource ? Math.max(0, resource.responseEnd - resource.responseStart) : 0,
      serverTiming,
      componentTrail,
      calledComponents,
      contentType: response.headers?.get?.("Content-Type") ?? "application/json",
      cacheStatus: response.headers?.get?.("X-Portfolio-Cache") ?? response.headers?.get?.("CF-Cache-Status") ?? response.headers?.get?.("X-Cache") ?? "non exposé",
      payloadSignals: [
        payload?.system && "JVM + système",
        payload?.database && "PostgreSQL",
        payload?.caches && "Caffeine",
        payload?.analyticsQueue && "Analytics queue",
        payload?.jobs && "Jobs",
        payload?.outbox && "Outbox",
        payload?.publications && "Publications",
      ].filter(Boolean),
      source: serverTiming.length ? "server-timing" : "browser",
    });
    if (!response.ok) throw new Error(`Engineering API HTTP ${response.status}`);
    return payload;
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener?.("abort", abortFromExternal);
  }
}

export function fetchMissionControlSnapshot(options = {}) {
  return request("/api/engineering/mission-control", options);
}

export function fetchEngineeringQueuePage(kind = "analytics", page = 0, size = 10, options = {}) {
  return request(`/api/engineering/mission-control/queue?kind=${encodeURIComponent(kind)}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`, {
    ...options,
    operationName: `File backend · ${kind}`,
  });
}


export function fetchPerformanceHistory(limit = 80, options = {}) {
  return request(`/api/engineering/performance/history?limit=${encodeURIComponent(limit)}`, options);
}


export function recordPerformanceSample(sample, options = {}) {
  return request("/api/engineering/performance/samples", {
    ...options,
    method: "POST",
    body: JSON.stringify(sample),
  });
}

export function tracePortfolioPublic(locale = "fr", options = {}) {
  return request(`/website/default?locale=${encodeURIComponent(locale === "en" ? "en" : "fr")}`, {
    ...options,
    operationName: "Chargement du portfolio public",
  });
}
