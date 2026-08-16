export const VOLCANO_FRAME_FLOATS = 25;
export const VOLCANO_PARTICLE_FLOATS = 11;
export const VOLCANO_ROCK_FLOATS = 10;

export const VOLCANO_FRAME = Object.freeze({
  PAINT_DELTA: 0,
  WIDTH: 1,
  HEIGHT: 2,
  DPR: 3,
  ELAPSED: 4,
  PULSE_TYPE: 5,
  PULSE_PROGRESS: 6,
  PULSE: 7,
  LAVA: 8,
  CRATER: 9,
  PLUME: 10,
  SMOKE_DENSITY: 11,
  SMOKE_FLOW: 12,
  BUBBLES: 13,
  EMBERS: 14,
  ASH: 15,
  HEAT: 16,
  TURBULENCE: 17,
  WATER_GLOW: 18,
  ERUPTION: 19,
  FRACTURE: 20,
  SHOCK: 21,
  SEDIMENT: 22,
  PARTICLE_COUNT: 23,
  ROCK_COUNT: 24,
});

export const VOLCANO_PARTICLE = Object.freeze({
  TYPE: 0,
  VARIANT: 1,
  PLUME_LAYER: 2,
  X: 3,
  Y: 4,
  SIZE: 5,
  ALPHA: 6,
  PHASE: 7,
  ROTATION: 8,
  LIFE: 9,
  TTL: 10,
});

export const VOLCANO_ROCK = Object.freeze({
  KIND: 0,
  X: 1,
  Y: 2,
  ROTATION: 3,
  SIZE: 4,
  HEAT: 5,
  SHAPE_0: 6,
  SHAPE_1: 7,
  SHAPE_2: 8,
  SHAPE_3: 9,
});

const PULSE_CODES = Object.freeze({ base: 0, surge: 1, burst: 2, mega: 3 });
const PULSE_NAMES = Object.freeze(["base", "surge", "burst", "mega"]);
const PARTICLE_TYPE_CODES = Object.freeze({ smoke: 0, vent: 1, ember: 2, ash: 3, bubble: 4, bio: 5, sediment: 6 });
const PARTICLE_TYPE_NAMES = Object.freeze(["smoke", "vent", "ember", "ash", "bubble", "bio", "sediment"]);
const PLUME_LAYER_CODES = Object.freeze({ hot: 0, main: 1, diffuse: 2 });
const PLUME_LAYER_NAMES = Object.freeze(["hot", "main", "diffuse"]);
const ROCK_KIND_CODES = Object.freeze({ dust: 0, mega: 1, hot: 2, basalt: 3 });
const ROCK_KIND_NAMES = Object.freeze(["dust", "mega", "hot", "basalt"]);

function clampCode(value, length) {
  return Math.max(0, Math.min(length - 1, Math.round(value)));
}

export function encodePulseType(value) {
  return PULSE_CODES[value] ?? 0;
}

export function decodePulseType(value) {
  return PULSE_NAMES[clampCode(value, PULSE_NAMES.length)] ?? "base";
}

function encodeParticleType(value) {
  return PARTICLE_TYPE_CODES[value] ?? PARTICLE_TYPE_CODES.bio;
}

function decodeParticleType(value) {
  return PARTICLE_TYPE_NAMES[clampCode(value, PARTICLE_TYPE_NAMES.length)] ?? "bio";
}

function encodePlumeLayer(value) {
  return PLUME_LAYER_CODES[value] ?? PLUME_LAYER_CODES.main;
}

function decodePlumeLayer(value) {
  return PLUME_LAYER_NAMES[clampCode(value, PLUME_LAYER_NAMES.length)] ?? "main";
}

function encodeRockKind(value) {
  return ROCK_KIND_CODES[value] ?? ROCK_KIND_CODES.basalt;
}

function decodeRockKind(value) {
  return ROCK_KIND_NAMES[clampCode(value, ROCK_KIND_NAMES.length)] ?? "basalt";
}

export function requiredVolcanoFrameFloats(particleCount, rockCount) {
  return VOLCANO_FRAME_FLOATS
    + Math.max(0, particleCount) * VOLCANO_PARTICLE_FLOATS
    + Math.max(0, rockCount) * VOLCANO_ROCK_FLOATS;
}

export function writeVolcanoFrame(target, paintDelta, viewport, elapsed, profile, particles = [], rocks = []) {
  const particleCount = particles.length;
  const rockCount = rocks.length;
  const required = requiredVolcanoFrameFloats(particleCount, rockCount);
  if (target.length < required) {
    throw new RangeError(`Volcano frame buffer too small: ${target.length} < ${required}`);
  }

  target[VOLCANO_FRAME.PAINT_DELTA] = paintDelta;
  target[VOLCANO_FRAME.WIDTH] = viewport.width;
  target[VOLCANO_FRAME.HEIGHT] = viewport.height;
  target[VOLCANO_FRAME.DPR] = viewport.dpr;
  target[VOLCANO_FRAME.ELAPSED] = elapsed;
  target[VOLCANO_FRAME.PULSE_TYPE] = encodePulseType(profile.pulseType);
  target[VOLCANO_FRAME.PULSE_PROGRESS] = profile.pulseProgress;
  target[VOLCANO_FRAME.PULSE] = profile.pulse;
  target[VOLCANO_FRAME.LAVA] = profile.lava;
  target[VOLCANO_FRAME.CRATER] = profile.crater;
  target[VOLCANO_FRAME.PLUME] = profile.plume;
  target[VOLCANO_FRAME.SMOKE_DENSITY] = profile.smokeDensity;
  target[VOLCANO_FRAME.SMOKE_FLOW] = profile.smokeFlow;
  target[VOLCANO_FRAME.BUBBLES] = profile.bubbles;
  target[VOLCANO_FRAME.EMBERS] = profile.embers;
  target[VOLCANO_FRAME.ASH] = profile.ash;
  target[VOLCANO_FRAME.HEAT] = profile.heat;
  target[VOLCANO_FRAME.TURBULENCE] = profile.turbulence;
  target[VOLCANO_FRAME.WATER_GLOW] = profile.waterGlow;
  target[VOLCANO_FRAME.ERUPTION] = profile.eruption;
  target[VOLCANO_FRAME.FRACTURE] = profile.fracture;
  target[VOLCANO_FRAME.SHOCK] = profile.shock;
  target[VOLCANO_FRAME.SEDIMENT] = profile.sediment;
  target[VOLCANO_FRAME.PARTICLE_COUNT] = particleCount;
  target[VOLCANO_FRAME.ROCK_COUNT] = rockCount;

  let offset = VOLCANO_FRAME_FLOATS;
  for (const particle of particles) {
    target[offset + VOLCANO_PARTICLE.TYPE] = encodeParticleType(particle.type);
    target[offset + VOLCANO_PARTICLE.VARIANT] = particle.variant ?? 0;
    target[offset + VOLCANO_PARTICLE.PLUME_LAYER] = encodePlumeLayer(particle.plumeLayer);
    target[offset + VOLCANO_PARTICLE.X] = particle.x;
    target[offset + VOLCANO_PARTICLE.Y] = particle.y;
    target[offset + VOLCANO_PARTICLE.SIZE] = particle.size;
    target[offset + VOLCANO_PARTICLE.ALPHA] = particle.alpha;
    target[offset + VOLCANO_PARTICLE.PHASE] = particle.phase;
    target[offset + VOLCANO_PARTICLE.ROTATION] = particle.rotation;
    target[offset + VOLCANO_PARTICLE.LIFE] = particle.life;
    target[offset + VOLCANO_PARTICLE.TTL] = particle.ttl;
    offset += VOLCANO_PARTICLE_FLOATS;
  }

  for (const rock of rocks) {
    const shape = rock.shape ?? [0.8, 0.7, 0.78, 0.68];
    target[offset + VOLCANO_ROCK.KIND] = encodeRockKind(rock.kind);
    target[offset + VOLCANO_ROCK.X] = rock.x;
    target[offset + VOLCANO_ROCK.Y] = rock.y;
    target[offset + VOLCANO_ROCK.ROTATION] = rock.rotation;
    target[offset + VOLCANO_ROCK.SIZE] = rock.size;
    target[offset + VOLCANO_ROCK.HEAT] = rock.heat;
    target[offset + VOLCANO_ROCK.SHAPE_0] = shape[0];
    target[offset + VOLCANO_ROCK.SHAPE_1] = shape[1];
    target[offset + VOLCANO_ROCK.SHAPE_2] = shape[2];
    target[offset + VOLCANO_ROCK.SHAPE_3] = shape[3];
    offset += VOLCANO_ROCK_FLOATS;
  }
  return required;
}

export function readVolcanoFrame(source, profile, viewport) {
  viewport.width = source[VOLCANO_FRAME.WIDTH];
  viewport.height = source[VOLCANO_FRAME.HEIGHT];
  viewport.dpr = source[VOLCANO_FRAME.DPR];
  profile.stage = "eruption";
  profile.pulseType = decodePulseType(source[VOLCANO_FRAME.PULSE_TYPE]);
  profile.pulseProgress = source[VOLCANO_FRAME.PULSE_PROGRESS];
  profile.pulse = source[VOLCANO_FRAME.PULSE];
  profile.lava = source[VOLCANO_FRAME.LAVA];
  profile.crater = source[VOLCANO_FRAME.CRATER];
  profile.plume = source[VOLCANO_FRAME.PLUME];
  profile.smokeDensity = source[VOLCANO_FRAME.SMOKE_DENSITY];
  profile.smokeFlow = source[VOLCANO_FRAME.SMOKE_FLOW];
  profile.bubbles = source[VOLCANO_FRAME.BUBBLES];
  profile.embers = source[VOLCANO_FRAME.EMBERS];
  profile.ash = source[VOLCANO_FRAME.ASH];
  profile.heat = source[VOLCANO_FRAME.HEAT];
  profile.turbulence = source[VOLCANO_FRAME.TURBULENCE];
  profile.waterGlow = source[VOLCANO_FRAME.WATER_GLOW];
  profile.eruption = source[VOLCANO_FRAME.ERUPTION];
  profile.fracture = source[VOLCANO_FRAME.FRACTURE];
  profile.shock = source[VOLCANO_FRAME.SHOCK];
  profile.sediment = source[VOLCANO_FRAME.SEDIMENT];
  return {
    paintDelta: source[VOLCANO_FRAME.PAINT_DELTA],
    elapsed: source[VOLCANO_FRAME.ELAPSED],
    particleCount: Math.max(0, Math.floor(source[VOLCANO_FRAME.PARTICLE_COUNT])),
    rockCount: Math.max(0, Math.floor(source[VOLCANO_FRAME.ROCK_COUNT])),
  };
}

function ensureObjectPool(pool, count, factory) {
  while (pool.length < count) pool.push(factory());
  return pool;
}

export function decodeVolcanoParticles(source, count, targetPool) {
  ensureObjectPool(targetPool, count, () => ({
    type: "bio",
    variant: 0,
    plumeLayer: "main",
    x: 0,
    y: 0,
    size: 0,
    alpha: 0,
    phase: 0,
    rotation: 0,
    life: 0,
    ttl: 1,
  }));
  let offset = VOLCANO_FRAME_FLOATS;
  for (let index = 0; index < count; index += 1) {
    const particle = targetPool[index];
    particle.type = decodeParticleType(source[offset + VOLCANO_PARTICLE.TYPE]);
    particle.variant = Math.max(0, Math.floor(source[offset + VOLCANO_PARTICLE.VARIANT]));
    particle.plumeLayer = decodePlumeLayer(source[offset + VOLCANO_PARTICLE.PLUME_LAYER]);
    particle.x = source[offset + VOLCANO_PARTICLE.X];
    particle.y = source[offset + VOLCANO_PARTICLE.Y];
    particle.size = source[offset + VOLCANO_PARTICLE.SIZE];
    particle.alpha = source[offset + VOLCANO_PARTICLE.ALPHA];
    particle.phase = source[offset + VOLCANO_PARTICLE.PHASE];
    particle.rotation = source[offset + VOLCANO_PARTICLE.ROTATION];
    particle.life = source[offset + VOLCANO_PARTICLE.LIFE];
    particle.ttl = source[offset + VOLCANO_PARTICLE.TTL];
    offset += VOLCANO_PARTICLE_FLOATS;
  }
  targetPool.length = count;
  return offset;
}

export function decodeVolcanoRocks(source, particleCount, rockCount, targetPool) {
  ensureObjectPool(targetPool, rockCount, () => ({
    kind: "basalt",
    x: 0,
    y: 0,
    rotation: 0,
    size: 0,
    heat: 0,
    shape: [0.8, 0.7, 0.78, 0.68],
  }));
  let offset = VOLCANO_FRAME_FLOATS + particleCount * VOLCANO_PARTICLE_FLOATS;
  for (let index = 0; index < rockCount; index += 1) {
    const rock = targetPool[index];
    rock.kind = decodeRockKind(source[offset + VOLCANO_ROCK.KIND]);
    rock.x = source[offset + VOLCANO_ROCK.X];
    rock.y = source[offset + VOLCANO_ROCK.Y];
    rock.rotation = source[offset + VOLCANO_ROCK.ROTATION];
    rock.size = source[offset + VOLCANO_ROCK.SIZE];
    rock.heat = source[offset + VOLCANO_ROCK.HEAT];
    rock.shape[0] = source[offset + VOLCANO_ROCK.SHAPE_0];
    rock.shape[1] = source[offset + VOLCANO_ROCK.SHAPE_1];
    rock.shape[2] = source[offset + VOLCANO_ROCK.SHAPE_2];
    rock.shape[3] = source[offset + VOLCANO_ROCK.SHAPE_3];
    offset += VOLCANO_ROCK_FLOATS;
  }
  targetPool.length = rockCount;
  return targetPool;
}
