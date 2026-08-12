import { resolveOceanTransitionDurationSeconds } from "./oceanTransitionTimings";

const TAU = Math.PI * 2;

export const OCEAN_BIOMES = Object.freeze({
  SURFACE: "surface",
  DEEP: "deep",
  CALDERA: "caldera",
  PROJECTS: "projects",
  OUTRO: "outro",
});

export const BIOME_ORDER = Object.freeze([
  OCEAN_BIOMES.SURFACE,
  OCEAN_BIOMES.DEEP,
  OCEAN_BIOMES.CALDERA,
  OCEAN_BIOMES.PROJECTS,
  OCEAN_BIOMES.OUTRO,
]);

export const OCEAN_WORLD_ANCHOR_IDS = Object.freeze([
  "profile",
  "skills",
  "ocean-transition-deep",
  "ocean-transition-caldera",
  "ocean-transition-projects",
  "ocean-transition-outro",
]);

export const BIOME_PROFILES = Object.freeze({
  [OCEAN_BIOMES.SURFACE]: Object.freeze({
    currentStrength: 0.34,
    verticalBias: -0.02,
    visibility: 0.88,
    species: ["reef", "silver", "ray"],
  }),
  [OCEAN_BIOMES.DEEP]: Object.freeze({
    currentStrength: 0.24,
    verticalBias: 0.01,
    visibility: 0.74,
    species: ["deep", "lantern", "jelly", "squid"],
  }),
  [OCEAN_BIOMES.CALDERA]: Object.freeze({
    currentStrength: 0.18,
    verticalBias: -0.01,
    visibility: 0.62,
    species: ["vent", "lantern", "jelly"],
  }),
  [OCEAN_BIOMES.PROJECTS]: Object.freeze({
    currentStrength: 0.30,
    verticalBias: -0.015,
    visibility: 0.82,
    species: ["silver", "reef", "ray", "jelly"],
  }),
  [OCEAN_BIOMES.OUTRO]: Object.freeze({
    currentStrength: 0.26,
    verticalBias: -0.045,
    visibility: 0.70,
    species: ["silver", "jelly", "ray"],
  }),
});

const SPECIES = Object.freeze({
  reef: Object.freeze({ speed: 0.075, turnRate: 2.4, size: 0.052, school: true, depth: 0.42 }),
  silver: Object.freeze({ speed: 0.092, turnRate: 2.9, size: 0.035, school: true, depth: 0.34 }),
  deep: Object.freeze({ speed: 0.058, turnRate: 1.9, size: 0.060, school: false, depth: 0.58 }),
  lantern: Object.freeze({ speed: 0.052, turnRate: 1.7, size: 0.036, school: true, depth: 0.66 }),
  vent: Object.freeze({ speed: 0.044, turnRate: 1.5, size: 0.044, school: false, depth: 0.73 }),
  ray: Object.freeze({ speed: 0.050, turnRate: 1.2, size: 0.105, school: false, depth: 0.48 }),
  jelly: Object.freeze({ speed: 0.020, turnRate: 0.8, size: 0.052, school: false, depth: 0.62 }),
  squid: Object.freeze({ speed: 0.064, turnRate: 2.0, size: 0.052, school: false, depth: 0.61 }),
  manta: Object.freeze({ speed: 0.062, turnRate: 0.95, size: 0.16, school: false, depth: 0.50 }),
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function damp(current, target, response, deltaSeconds) {
  const safeDelta = clamp(Number(deltaSeconds) || 0, 0, 0.05);
  const alpha = 1 - Math.exp(-Math.max(0, response) * safeDelta);
  return current + (target - current) * alpha;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashNoise(value) {
  const s = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/**
 * Shared low-cost current field. Coordinates are normalized 0..1.
 * The same field can be sampled by fish, bubbles and volcano particles.
 */
export function sampleOceanCurrent(x, y, timeSeconds, biome = OCEAN_BIOMES.SURFACE) {
  const profile = BIOME_PROFILES[biome] ?? BIOME_PROFILES[OCEAN_BIOMES.SURFACE];
  const t = Number(timeSeconds) || 0;
  const nx = clamp(Number(x) || 0, 0, 1);
  const ny = clamp(Number(y) || 0, 0, 1);
  const flowA = Math.sin(t * 0.18 + ny * 5.3 + nx * 1.8);
  const flowB = Math.cos(t * 0.13 + nx * 4.7 - ny * 2.6);
  const swirl = Math.sin(t * 0.09 + (nx + ny) * 7.1);
  return {
    x: (flowA * 0.68 + flowB * 0.32) * profile.currentStrength,
    y: (flowB * 0.16 + swirl * 0.08 + profile.verticalBias) * profile.currentStrength,
  };
}

export function resolveMarinePopulation(runtimeQuality = "high", performanceMode = "full", mobile = false) {
  if (runtimeQuality === "constrained") return mobile ? 4 : 6;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return mobile ? 6 : 9;
  return mobile ? 8 : 14;
}

function resolveSpeciesForBiome(biome, random, index) {
  const profile = BIOME_PROFILES[biome] ?? BIOME_PROFILES[OCEAN_BIOMES.SURFACE];
  const list = profile.species;
  const selector = random();
  const offset = index % list.length;
  return list[(offset + Math.floor(selector * list.length)) % list.length];
}

export function createMarineAgent(index, biome, seed = 0x6f39, options = {}) {
  const random = mulberry32((seed + index * 0x9e3779b9) >>> 0);
  const species = options.species ?? resolveSpeciesForBiome(biome, random, index);
  const config = SPECIES[species] ?? SPECIES.reef;
  const spawnLeft = options.spawnLeft ?? random() > 0.5;
  const inwardDirection = spawnLeft ? 1 : -1;
  const depthRoll = random();
  const depthLayer = depthRoll < 0.28 ? "far" : depthRoll > 0.78 ? "near" : "mid";
  const parallaxSpeed = depthLayer === "near" ? 1.16 : depthLayer === "far" ? 0.74 : 0.94;
  const speed = config.speed * (0.82 + random() * 0.34) * parallaxSpeed;
  const preferredDepth = clamp(config.depth + (random() - 0.5) * 0.26, 0.10, 0.88);

  return {
    id: options.id ?? `${species}-${index}`,
    species,
    x: options.x ?? (spawnLeft ? -0.08 - random() * 0.12 : 1.08 + random() * 0.12),
    y: options.y ?? preferredDepth,
    vx: inwardDirection * speed,
    vy: (random() - 0.5) * speed * 0.35,
    ax: 0,
    ay: 0,
    heading: inwardDirection,
    preferredDepth,
    speed,
    turnRate: config.turnRate,
    size: config.size * (0.84 + random() * 0.36),
    school: config.school,
    wanderPhase: random() * TAU,
    curiosity: 0.35 + random() * 0.55,
    opacity: 0.36 + random() * 0.38,
    depthLayer,
  };
}

export function createMarinePopulation(count, biome, seed = 0x6f39) {
  const result = [];
  for (let index = 0; index < Math.max(0, Math.floor(count)); index += 1) {
    result.push(createMarineAgent(index, biome, seed));
  }
  return result;
}

function steerToward(agent, targetX, targetY, strength) {
  const dx = targetX - agent.x;
  const dy = targetY - agent.y;
  const distance = Math.max(0.001, Math.hypot(dx, dy));
  return { x: (dx / distance) * strength, y: (dy / distance) * strength };
}

function boundarySteer(agent) {
  let x = 0;
  let y = 0;
  const marginX = 0.10;
  const marginY = 0.08;
  if (agent.x < marginX) x += (marginX - agent.x) * 1.8;
  if (agent.x > 1 - marginX) x -= (agent.x - (1 - marginX)) * 1.8;
  if (agent.y < marginY) y += (marginY - agent.y) * 1.7;
  if (agent.y > 1 - marginY) y -= (agent.y - (1 - marginY)) * 1.7;
  return { x, y };
}

function schoolSteer(agent, agents) {
  if (!agent.school) return { x: 0, y: 0 };
  let neighbors = 0;
  let centerX = 0;
  let centerY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let separateX = 0;
  let separateY = 0;

  for (const other of agents) {
    if (other === agent || other.species !== agent.species) continue;
    const dx = other.x - agent.x;
    const dy = other.y - agent.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0.24) continue;
    neighbors += 1;
    centerX += other.x;
    centerY += other.y;
    velocityX += other.vx;
    velocityY += other.vy;
    if (distance < 0.075 && distance > 0.0001) {
      separateX -= dx / distance;
      separateY -= dy / distance;
    }
  }

  if (!neighbors) return { x: 0, y: 0 };
  centerX /= neighbors;
  centerY /= neighbors;
  velocityX /= neighbors;
  velocityY /= neighbors;
  const cohesion = steerToward(agent, centerX, centerY, 0.018);
  return {
    x: cohesion.x + velocityX * 0.12 + separateX * 0.022,
    y: cohesion.y + velocityY * 0.12 + separateY * 0.022,
  };
}

export function stepMarinePopulation(
  agents,
  deltaSeconds,
  elapsedSeconds,
  biome,
  options = {},
) {
  const dt = clamp(Number(deltaSeconds) || 0, 0, 0.05);
  if (!dt) return agents;
  const danger = clamp(options.danger ?? 0, 0, 1.5);
  const dangerX = options.dangerX ?? 0.5;
  const dangerY = options.dangerY ?? 0.58;

  for (const agent of agents) {
    const config = SPECIES[agent.species] ?? SPECIES.reef;
    const current = sampleOceanCurrent(agent.x, agent.y, elapsedSeconds, biome);
    const boundary = boundarySteer(agent);
    const school = schoolSteer(agent, agents);
    const wanderAngle = agent.wanderPhase + elapsedSeconds * (0.22 + agent.turnRate * 0.08);
    const wander = {
      x: Math.cos(wanderAngle) * 0.014,
      y: Math.sin(wanderAngle * 1.17) * 0.010,
    };
    const depthForce = (agent.preferredDepth - agent.y) * 0.045;

    let dangerXForce = 0;
    let dangerYForce = 0;
    if (danger > 0.01) {
      const dx = agent.x - dangerX;
      const dy = agent.y - dangerY;
      const distance = Math.max(0.04, Math.hypot(dx, dy));
      const falloff = clamp(1 - distance / 0.62, 0, 1);
      dangerXForce = (dx / distance) * danger * falloff * 0.14;
      dangerYForce = (dy / distance) * danger * falloff * 0.08;
    }

    agent.ax = current.x * 0.018 + boundary.x + school.x + wander.x + dangerXForce;
    agent.ay = current.y * 0.018 + boundary.y + school.y + wander.y + depthForce + dangerYForce;
    agent.vx += agent.ax * dt;
    agent.vy += agent.ay * dt;

    const targetSpeed = agent.speed * (1 + danger * 0.62);
    const magnitude = Math.max(0.0001, Math.hypot(agent.vx, agent.vy));
    const normalizedX = agent.vx / magnitude;
    const normalizedY = agent.vy / magnitude;
    const smoothedSpeed = damp(magnitude, targetSpeed, 2.4, dt);
    agent.vx = normalizedX * smoothedSpeed;
    agent.vy = normalizedY * smoothedSpeed;

    agent.x += agent.vx * dt;
    agent.y += agent.vy * dt;

    // Hysteresis: the sprite changes orientation only after horizontal velocity
    // is meaningful, so it can never face left while travelling right.
    if (agent.vx > 0.006) agent.heading = 1;
    else if (agent.vx < -0.006) agent.heading = -1;

    const hardMargin = 0.24;
    if (agent.x < -hardMargin) {
      agent.x = -hardMargin;
      agent.vx = Math.abs(agent.vx);
      agent.heading = 1;
    } else if (agent.x > 1 + hardMargin) {
      agent.x = 1 + hardMargin;
      agent.vx = -Math.abs(agent.vx);
      agent.heading = -1;
    }
    agent.y = clamp(agent.y, 0.04, 0.96);

    // Jellyfish move vertically more than horizontally; keep their horizontal
    // vector coherent but gentle.
    if (agent.species === "jelly") {
      agent.vx = damp(agent.vx, current.x * 0.015 + agent.heading * config.speed * 0.35, 1.6, dt);
    }
  }
  return agents;
}

export function resolveRareOceanEvent(elapsedSeconds, seed = 0x91ac) {
  const cycle = 36;
  const slot = Math.floor(Math.max(0, elapsedSeconds) / cycle);
  const random = mulberry32((seed + slot * 0x9e3779b9) >>> 0);
  const local = elapsedSeconds - slot * cycle;
  const start = 12 + random() * 12;
  const duration = 6 + random() * 4;
  if (local < start || local > start + duration) return null;
  const selector = random();
  return {
    type: selector > 0.72 ? "manta" : selector > 0.34 ? "school" : "jelly-cluster",
    progress: clamp((local - start) / duration, 0, 1),
  };
}

export function biomeFromSectionId(id) {
  if (id === "ocean-transition-deep" || id === "timeline") return OCEAN_BIOMES.DEEP;
  if (id === "ocean-transition-caldera" || id === "abyss-volcano-field") return OCEAN_BIOMES.CALDERA;
  if (id === "ocean-transition-projects" || id === "projects") return OCEAN_BIOMES.PROJECTS;
  if (id === "ocean-transition-outro" || id === "ocean-outro") return OCEAN_BIOMES.OUTRO;
  return OCEAN_BIOMES.SURFACE;
}

export function resolveViewportBiome(anchors, currentBiome, focusY) {
  const safeFocusY = Number.isFinite(focusY) ? focusY : 0;
  const focusTolerance = 2;
  const candidates = anchors
    .filter((anchor) => OCEAN_WORLD_ANCHOR_IDS.includes(anchor?.id) && Number.isFinite(anchor?.top))
    .map((anchor) => ({
      id: anchor.id,
      top: anchor.top,
      biome: biomeFromSectionId(anchor.id),
      order: OCEAN_WORLD_ANCHOR_IDS.indexOf(anchor.id),
    }))
    .sort((left, right) => left.top - right.top || left.order - right.order);

  let winner = currentBiome;
  for (const candidate of candidates) {
    if (candidate.top > safeFocusY + focusTolerance) break;
    winner = candidate.biome;
  }

  return winner;
}

export function resolveBiomeTransitionDuration(fromBiome, toBiome) {
  return resolveOceanTransitionDurationSeconds(fromBiome, toBiome);
}

export function deterministicRockSeed(x, y, index) {
  return hashNoise((x + 1.7) * 31 + (y + 0.3) * 47 + index * 13.3);
}
