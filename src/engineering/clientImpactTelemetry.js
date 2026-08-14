import { getGpuTelemetrySnapshot } from "./gpuProfiler";

let networkState = null;
let networkObserver = null;

function addResource(entry) {
  if (!networkState || !entry) return;
  networkState.requestCount += 1;
  networkState.transferBytes += Number(entry.transferSize || 0);
  networkState.encodedBytes += Number(entry.encodedBodySize || 0);
  networkState.decodedBytes += Number(entry.decodedBodySize || 0);
}

function ensureNetworkObserver() {
  if (networkState) return;
  networkState = { requestCount: 0, transferBytes: 0, encodedBytes: 0, decodedBytes: 0, startedAt: Date.now() };
  try {
    performance.getEntriesByType?.("resource")?.forEach(addResource);
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("resource")) {
      networkObserver = new PerformanceObserver((list) => list.getEntries().forEach(addResource));
      networkObserver.observe({ type: "resource", buffered: false });
    }
  } catch {
    // Resource Timing can be restricted without affecting the page.
  }
}

export function getNetworkTelemetrySnapshot() {
  ensureNetworkObserver();
  return { ...(networkState ?? {}) };
}

export async function measurePageMemory() {
  if (typeof performance?.measureUserAgentSpecificMemory !== "function") {
    return { supported: false, bytes: Number.NaN, breakdown: [] };
  }
  try {
    const result = await performance.measureUserAgentSpecificMemory();
    return {
      supported: true,
      bytes: Number(result?.bytes || 0),
      breakdown: Array.isArray(result?.breakdown) ? result.breakdown : [],
    };
  } catch (error) {
    return {
      supported: true,
      bytes: Number.NaN,
      breakdown: [],
      restricted: true,
      reason: error?.name ?? "unavailable",
    };
  }
}

export function getClientImpactSnapshot() {
  return {
    network: getNetworkTelemetrySnapshot(),
    gpu: getGpuTelemetrySnapshot(),
  };
}

export function stopClientImpactTelemetry() {
  networkObserver?.disconnect?.();
  networkObserver = null;
  networkState = null;
}
