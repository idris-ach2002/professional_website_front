export const OCEAN_WORLD_MOUNTED_EVENT = "portfolio:ocean-world-mounted";
export const OCEAN_WORLD_RECONCILE_EVENT = "portfolio:ocean-world-reconcile";

export function announceOceanWorldMounted(id) {
  if (typeof window === "undefined" || !id) return;
  window.dispatchEvent(new CustomEvent(OCEAN_WORLD_MOUNTED_EVENT, { detail: { id } }));
}

export function requestOceanWorldReconciliation(reason = "external") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OCEAN_WORLD_RECONCILE_EVENT, { detail: { reason } }));
}
