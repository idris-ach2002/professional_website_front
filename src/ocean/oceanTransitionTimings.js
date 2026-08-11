export const OCEAN_CINEMATIC_DURATIONS_MS = Object.freeze({
  "surface-deep": 760,
  "deep-surface": 480,
  "deep-caldera": 800,
  "caldera-deep": 500,
  "caldera-projects": 820,
  "projects-caldera": 520,
  "deep-projects": 740,
  "projects-deep": 480,
  "projects-outro": 780,
  "outro-projects": 480,
});

const DEFAULT_FORWARD_MS = 760;
const DEFAULT_REVERSE_MS = 500;

export function oceanTransitionKey(fromBiome, toBiome) {
  if (!fromBiome || !toBiome || fromBiome === toBiome) return "";
  return `${fromBiome}-${toBiome}`;
}

export function resolveOceanTransitionDurationMs(fromBiome, toBiome) {
  const key = oceanTransitionKey(fromBiome, toBiome);
  if (!key) return 0;
  if (OCEAN_CINEMATIC_DURATIONS_MS[key]) return OCEAN_CINEMATIC_DURATIONS_MS[key];
  const reverse = ["deep-surface", "caldera-deep", "projects-caldera", "projects-deep", "outro-projects"]
    .includes(key);
  return reverse ? DEFAULT_REVERSE_MS : DEFAULT_FORWARD_MS;
}

export function resolveOceanTransitionDurationSeconds(fromBiome, toBiome) {
  return resolveOceanTransitionDurationMs(fromBiome, toBiome) / 1000;
}
