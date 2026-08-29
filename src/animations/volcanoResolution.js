export const VOLCANO_RESOLUTION_OPTIONS = Object.freeze(["auto", "max", "4k", "2k", "fhd"]);
export const DEFAULT_VOLCANO_RESOLUTION = "auto";

const VALID_VOLCANO_RESOLUTIONS = new Set(VOLCANO_RESOLUTION_OPTIONS);

const VOLCANO_RESOLUTION_ASSETS = Object.freeze({
  max: Object.freeze({
    id: "max",
    width: 5696,
    height: 3200,
    environment: "/scenes/abyss-volcano-environment.svg",
    foreground: "/scenes/abyss-volcano-foreground.svg",
    vector: true,
  }),
  "4k": Object.freeze({
    id: "4k",
    width: 3840,
    height: 2160,
    environment: "/scenes/volcano-raster/abyss-volcano-environment-4k.webp",
    foreground: "/scenes/volcano-raster/abyss-volcano-foreground-4k.webp",
    vector: false,
  }),
  "2k": Object.freeze({
    id: "2k",
    width: 2560,
    height: 1440,
    environment: "/scenes/volcano-raster/abyss-volcano-environment-2k.webp",
    foreground: "/scenes/volcano-raster/abyss-volcano-foreground-2k.webp",
    vector: false,
  }),
  fhd: Object.freeze({
    id: "fhd",
    width: 1920,
    height: 1080,
    environment: "/scenes/volcano-raster/abyss-volcano-environment-fhd.webp",
    foreground: "/scenes/volcano-raster/abyss-volcano-foreground-fhd.webp",
    vector: false,
  }),
});

export function normalizeVolcanoResolution(value) {
  return VALID_VOLCANO_RESOLUTIONS.has(value) ? value : DEFAULT_VOLCANO_RESOLUTION;
}

export function resolveEffectiveVolcanoResolution(value) {
  const normalized = normalizeVolcanoResolution(value);
  return normalized === "auto" ? "4k" : normalized;
}

export function resolveVolcanoResolutionAssets(value) {
  return VOLCANO_RESOLUTION_ASSETS[resolveEffectiveVolcanoResolution(value)] ?? VOLCANO_RESOLUTION_ASSETS["4k"];
}
