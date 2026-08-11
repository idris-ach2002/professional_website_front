export const OCEAN_WORLD_MOUNTED_EVENT = "portfolio:ocean-world-mounted";

export function announceOceanWorldMounted(id) {
  if (typeof window === "undefined" || !id) return;
  window.dispatchEvent(new CustomEvent(OCEAN_WORLD_MOUNTED_EVENT, { detail: { id } }));
}
