import { OCEAN_BIOMES, sampleOceanCurrent } from "../ocean/oceanWorldEngine.js";

const TAU = Math.PI * 2;

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

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

export const VOLCANO_STAGES = Object.freeze(["eruption"]);
export const VOLCANO_PULSE_TYPES = Object.freeze(["base", "surge", "burst", "mega"]);

const PERPETUAL_BASE = Object.freeze({
  // V21.15: the whole cone remains thermally alive. Even between pulses,
  // the magma network is visible from the lower flanks to the crater.
  lava: 0.96,
  crater: 1.02,
  plume: 0.96,
  smokeDensity: 1.34,
  bubbles: 0.84,
  embers: 0.48,
  ash: 0.18,
  heat: 0.84,
  turbulence: 0.72,
  waterGlow: 0.54,
  eruption: 0.56,
  fracture: 0.96,
  shock: 0.02,
});

const FIRST_PULSES = Object.freeze([
  Object.freeze({ at: 0.22, kind: "burst", duration: 0.72, strength: 1.04 }),
  Object.freeze({ at: 1.02, kind: "surge", duration: 0.58, strength: 0.74 }),
  Object.freeze({ at: 1.72, kind: "mega", duration: 1.18, strength: 1.38 }),
]);

function pulseRandom(seed, index) {
  return mulberry32((seed + index * 2654435761 + 0x9e3779b9) >>> 0);
}

function resolveGeneratedPulse(seed, index, previousEnd) {
  const random = pulseRandom(seed, index);
  const selector = random();
  const kind = index % 5 === 0 || selector > 0.86
    ? "mega"
    : selector > 0.46
      ? "burst"
      : "surge";
  const duration = kind === "mega"
    ? 1.02 + random() * 0.42
    : kind === "burst"
      ? 0.64 + random() * 0.28
      : 0.46 + random() * 0.22;
  const gap = kind === "mega"
    ? 2.6 + random() * 2.2
    : kind === "burst"
      ? 0.72 + random() * 1.18
      : 0.42 + random() * 0.72;
  const strength = kind === "mega"
    ? 1.18 + random() * 0.34
    : kind === "burst"
      ? 0.82 + random() * 0.26
      : 0.54 + random() * 0.20;
  return {
    at: previousEnd + gap,
    kind,
    duration,
    strength,
  };
}

function pulseAtIndex(seed, index, previousPulse) {
  if (index < FIRST_PULSES.length) return FIRST_PULSES[index];
  const previousEnd = (previousPulse?.at ?? 0) + (previousPulse?.duration ?? 0);
  return resolveGeneratedPulse(seed, index, previousEnd);
}

export function createVolcanoSimulation(seed = 0x8218) {
  const firstPulse = pulseAtIndex(seed, 0, null);
  return {
    seed: seed >>> 0,
    stage: "eruption",
    elapsed: 0,
    pulseIndex: 0,
    pulseKind: "base",
    pulseStartedAt: -1,
    pulseElapsed: 0,
    pulseDuration: 0,
    pulseStrength: 0,
    nextPulse: firstPulse,
  };
}

export function stepVolcanoSimulation(simulation, deltaSeconds) {
  const dt = clamp(Number(deltaSeconds) || 0, 0, 0.08);
  if (dt <= 0) return simulation;

  simulation.elapsed += dt;
  simulation.stage = "eruption";

  if (simulation.pulseStartedAt >= 0) {
    simulation.pulseElapsed = simulation.elapsed - simulation.pulseStartedAt;
    if (simulation.pulseElapsed >= simulation.pulseDuration) {
      const completedPulse = {
        at: simulation.pulseStartedAt,
        duration: simulation.pulseDuration,
        kind: simulation.pulseKind,
        strength: simulation.pulseStrength,
      };
      simulation.pulseStartedAt = -1;
      simulation.pulseElapsed = 0;
      simulation.pulseDuration = 0;
      simulation.pulseStrength = 0;
      simulation.pulseKind = "base";
      simulation.pulseIndex += 1;
      simulation.nextPulse = pulseAtIndex(simulation.seed, simulation.pulseIndex, completedPulse);
    }
  }

  if (
    simulation.pulseStartedAt < 0
    && simulation.nextPulse
    && simulation.elapsed >= simulation.nextPulse.at
  ) {
    simulation.pulseStartedAt = simulation.nextPulse.at;
    simulation.pulseDuration = simulation.nextPulse.duration;
    simulation.pulseStrength = simulation.nextPulse.strength;
    simulation.pulseKind = simulation.nextPulse.kind;
    simulation.pulseElapsed = Math.max(0, simulation.elapsed - simulation.pulseStartedAt);
  }

  return simulation;
}

function gaussian(value, center, width) {
  return Math.exp(-Math.pow((value - center) / Math.max(0.001, width), 2));
}

function perpetualBreathing(elapsed) {
  return {
    slow: 0.5 + 0.5 * Math.sin(elapsed * 0.68 + 0.7),
    lava: 0.5 + 0.5 * Math.sin(elapsed * 2.15 + 1.4),
    plume: 0.5 + 0.5 * Math.sin(elapsed * 0.43 + 2.2),
  };
}

function resolvePulseEnvelope(simulation) {
  if (!simulation || simulation.pulseStartedAt < 0 || simulation.pulseDuration <= 0) {
    return { kind: "base", progress: 0, envelope: 0, shock: 0 };
  }
  const progress = clamp(simulation.pulseElapsed / simulation.pulseDuration, 0, 1);
  const kind = simulation.pulseKind;
  const strength = simulation.pulseStrength || 1;

  if (kind === "mega") {
    const primary = gaussian(progress, 0.26, 0.12);
    const secondary = gaussian(progress, 0.62, 0.14) * 0.72;
    const rebound = gaussian(progress, 0.84, 0.10) * 0.28;
    return {
      kind,
      progress,
      envelope: clamp((primary + secondary + rebound) * strength, 0, 2.2),
      shock: clamp((primary * 1.28 + secondary * 0.84 + rebound * 0.24) * strength, 0, 1.9),
    };
  }

  const peak = kind === "burst"
    ? gaussian(progress, 0.40, 0.20)
    : gaussian(progress, 0.46, 0.24);
  const tail = kind === "burst" ? gaussian(progress, 0.76, 0.18) * 0.22 : 0;
  return {
    kind,
    progress,
    envelope: clamp((peak + tail) * strength, 0, kind === "burst" ? 1.45 : 1.0),
    shock: kind === "burst" ? clamp(peak * strength * 0.34, 0, 0.46) : 0,
  };
}

export function resolveVolcanoStageProfileInto(simulation, target = {}) {
  const elapsed = simulation?.elapsed ?? 0;
  const breathing = perpetualBreathing(elapsed);
  const pulse = resolvePulseEnvelope(simulation);
  const boost = pulse.envelope;
  const megaBoost = pulse.kind === "mega" ? boost : 0;
  const burstBoost = pulse.kind === "burst" ? boost : 0;

  target.stage = "eruption";
  target.pulseType = pulse.kind;
  target.pulseProgress = pulse.progress;
  target.pulse = boost;
  target.lava = clamp(PERPETUAL_BASE.lava + breathing.lava * 0.12 + boost * 0.46, 0, 2.08);
  target.crater = clamp(PERPETUAL_BASE.crater + breathing.lava * 0.11 + boost * 0.54, 0, 2.12);
  target.plume = clamp(PERPETUAL_BASE.plume + breathing.plume * 0.08, 0.94, 1.16);
  target.smokeDensity = PERPETUAL_BASE.smokeDensity;
  target.smokeFlow = 1.0 + breathing.plume * 0.08;
  target.bubbles = clamp(PERPETUAL_BASE.bubbles + breathing.slow * 0.10 + boost * 0.38, 0, 1.86);
  target.embers = clamp(PERPETUAL_BASE.embers + burstBoost * 0.46 + megaBoost * 0.74 + breathing.lava * 0.08, 0, 2.16);
  target.ash = clamp(PERPETUAL_BASE.ash + burstBoost * 0.28 + megaBoost * 0.72, 0, 1.82);
  target.heat = clamp(PERPETUAL_BASE.heat + breathing.lava * 0.11 + boost * 0.46, 0, 2.04);
  target.turbulence = clamp(PERPETUAL_BASE.turbulence + breathing.plume * 0.08 + boost * 0.35, 0, 1.88);
  target.waterGlow = clamp(PERPETUAL_BASE.waterGlow + boost * 0.34, 0, 1.68);
  target.eruption = clamp(PERPETUAL_BASE.eruption + boost * 0.70, 0, 2.10);
  target.fracture = clamp(PERPETUAL_BASE.fracture + breathing.lava * 0.09 + boost * 0.34, 0, 1.68);
  target.shock = pulse.shock;
  target.sediment = clamp(0.12 + pulse.shock * 0.76 + megaBoost * 0.12, 0, 1.46);
  target.debris = clamp(0.03 + pulse.shock * 0.82 + megaBoost * 0.24, 0, 1.72);
  target.canyonLight = clamp(0.18 + boost * 0.52 + pulse.shock * 0.20, 0, 1.72);
  return target;
}

export function resolveVolcanoStageProfile(simulation) {
  return resolveVolcanoStageProfileInto(simulation, {});
}

function createParticle(type, random, width, height, index) {
  const centerX = width * 0.5;
  const craterY = height * 0.385;

  if (type === "smoke") {
    const roll = random();
    const plumeLayer = roll < 0.28
      ? "hot"
      : roll < 0.80
        ? "main"
        : "diffuse";
    const ttl = plumeLayer === "hot"
      ? 8.5 + random() * 4.5
      : plumeLayer === "main"
        ? 11 + random() * 6
        : 14 + random() * 7;
    const layerY = plumeLayer === "hot"
      ? craterY - height * (0.01 + random() * 0.055)
      : plumeLayer === "main"
        ? craterY - height * (0.07 + random() * 0.20)
        : craterY - height * (0.22 + random() * 0.18);
    const lateralSpread = plumeLayer === "hot"
      ? 0.030
      : plumeLayer === "main"
        ? 0.055
        : 0.095;
    const baseSize = plumeLayer === "hot"
      ? 66 + random() * 62
      : plumeLayer === "main"
        ? 92 + random() * 82
        : 122 + random() * 92;
    const upwardSpeed = plumeLayer === "hot"
      ? 18 + random() * 16
      : plumeLayer === "main"
        ? 11 + random() * 12
        : 5 + random() * 7;

    return {
      id: `smoke-${index}`,
      type,
      variant: Math.floor(random() * 6),
      plumeLayer,
      x: centerX + (random() - 0.5) * width * lateralSpread,
      y: clamp(layerY, height * 0.035, craterY - height * 0.005),
      vx: (random() - 0.5) * (plumeLayer === "diffuse" ? 6.5 : 4.2),
      vy: -upwardSpeed,
      size: baseSize,
      alpha: plumeLayer === "hot"
        ? 0.44 + random() * 0.16
        : plumeLayer === "main"
          ? 0.38 + random() * 0.16
          : 0.28 + random() * 0.12,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * (plumeLayer === "hot" ? 0.055 : 0.032),
      life: random() * ttl * 0.88,
      ttl,
    };
  }

  if (type === "ember") {
    return {
      id: `ember-${index}`,
      type,
      variant: 0,
      x: centerX + (random() - 0.5) * width * 0.065,
      y: craterY + random() * height * 0.04,
      vx: (random() - 0.5) * 24,
      vy: -(34 + random() * 66),
      size: 1.3 + random() * 4.6,
      alpha: 0.50 + random() * 0.48,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 2.4,
      life: random() * 2.2,
      ttl: 1.4 + random() * 3.1,
    };
  }

  if (type === "ash") {
    return {
      id: `ash-${index}`,
      type,
      variant: 0,
      x: centerX + (random() - 0.5) * width * 0.12,
      y: craterY + random() * height * 0.06,
      vx: (random() - 0.5) * 30,
      vy: -(20 + random() * 52),
      size: 0.8 + random() * 3.4,
      alpha: 0.18 + random() * 0.34,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 3.4,
      life: random() * 4,
      ttl: 3.2 + random() * 5.8,
    };
  }

  if (type === "vent") {
    const left = random() < 0.5;
    return {
      id: `vent-${index}`,
      type,
      variant: Math.floor(random() * 4),
      plumeLayer: "diffuse",
      x: width * (left ? 0.18 + random() * 0.06 : 0.76 + random() * 0.06),
      y: height * (0.62 + random() * 0.12),
      vx: (random() - 0.5) * 5,
      vy: -(8 + random() * 15),
      size: 32 + random() * 66,
      alpha: 0.035 + random() * 0.055,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 0.07,
      life: random() * 7,
      ttl: 7 + random() * 9,
    };
  }

  if (type === "bubble") {
    return {
      id: `bubble-${index}`,
      type,
      variant: 0,
      x: width * (0.28 + random() * 0.44),
      y: height * (0.38 + random() * 0.58),
      vx: (random() - 0.5) * 7,
      vy: -(20 + random() * 40),
      size: 3 + random() * 13,
      alpha: 0.16 + random() * 0.30,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 0.55,
      life: random() * 8,
      ttl: 5.5 + random() * 7.5,
    };
  }

  if (type === "sediment") {
    return {
      id: `sediment-${index}`,
      type,
      variant: 0,
      x: width * (0.06 + random() * 0.88),
      y: height * (0.76 + random() * 0.18),
      vx: (random() - 0.5) * 5,
      vy: -(1 + random() * 5),
      size: 0.7 + random() * 2.4,
      alpha: 0.06 + random() * 0.15,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 0.5,
      life: random() * 10,
      ttl: 8 + random() * 12,
    };
  }



  return {
    id: `bio-${index}`,
    type: "bio",
    variant: 0,
    x: width * (0.08 + random() * 0.84),
    y: height * (0.18 + random() * 0.68),
    vx: (random() - 0.5) * 2.8,
    vy: -(0.5 + random() * 1.9),
    size: 1 + random() * 2.8,
    alpha: 0.16 + random() * 0.40,
    phase: random() * TAU,
    rotation: 0,
    spin: 0,
    life: random() * 14,
    ttl: 10 + random() * 12,
  };
}

export function resolveVolcanoParticleCounts(runtimeQuality = "high", performanceMode = "full") {
  if (runtimeQuality === "constrained") {
    return { smoke: 18, vent: 4, ember: 20, ash: 8, bubble: 15, bio: 9, sediment: 8 };
  }
  if (runtimeQuality === "balanced" || performanceMode === "balanced") {
    return { smoke: 28, vent: 6, ember: 38, ash: 14, bubble: 26, bio: 13, sediment: 15 };
  }
  return { smoke: 40, vent: 10, ember: 62, ash: 24, bubble: 42, bio: 18, sediment: 26 };
}

export function createVolcanoParticles(width, height, counts, seed = 0x71a5) {
  const random = mulberry32(seed);
  const particles = [];
  const orderedTypes = ["smoke", "vent", "ember", "ash", "bubble", "bio", "sediment"];

  for (const type of orderedTypes) {
    const count = Math.max(0, Math.floor(counts?.[type] ?? 0));
    for (let index = 0; index < count; index += 1) {
      particles.push(createParticle(type, random, width, height, index));
    }
  }
  return particles;
}

function resetParticle(particle, random, width, height) {
  const replacement = createParticle(particle.type, random, width, height, 0);
  Object.assign(particle, replacement, { id: particle.id, life: 0 });
}

export function stepVolcanoParticles(
  particles,
  deltaSeconds,
  width,
  height,
  elapsedSeconds,
  profile,
  seed = 0x91b7,
) {
  const dt = clamp(Number(deltaSeconds) || 0, 0, 1 / 20);
  if (dt <= 0) return particles;
  const random = mulberry32((seed + Math.floor(elapsedSeconds * 17)) >>> 0);
  const turbulence = clamp(profile?.turbulence ?? 0.72, 0, 2.0);
  const plume = clamp(profile?.plume ?? 1.0, 0.9, 1.2);
  const smokeDensity = clamp(profile?.smokeDensity ?? 1.34, 1.2, 1.5);
  const smokeFlow = clamp(profile?.smokeFlow ?? 1.0, 0.96, 1.12);
  const eruption = clamp(profile?.eruption ?? 0.52, 0, 2.2);
  const shock = clamp(profile?.shock ?? 0, 0, 2.0);
  const sediment = clamp(profile?.sediment ?? 0.12, 0, 1.6);
  const craterX = width * 0.5;
  const craterY = height * 0.385;

  for (const particle of particles) {
    particle.life += dt;
    particle.rotation += particle.spin * dt;
    const phase = particle.phase + elapsedSeconds * (particle.type === "ember" ? 3.4 : 0.78);
    const sharedCurrent = sampleOceanCurrent(
      particle.x / Math.max(1, width),
      particle.y / Math.max(1, height),
      elapsedSeconds,
      OCEAN_BIOMES.CALDERA,
    );

    if (particle.type === "vent") {
      particle.x += (particle.vx + Math.sin(phase) * (3.2 + turbulence * 2.0) + sharedCurrent.x * 10) * dt;
      particle.y += particle.vy * (0.76 + plume * 0.20) * dt;
      particle.size += dt * 4.5;
    } else if (particle.type === "smoke") {
      const layer = particle.plumeLayer ?? "main";
      const layerBoost = layer === "hot" ? 1.08 : layer === "main" ? 0.86 : 0.48;
      const buoyancy = (0.82 + plume * 0.34) * layerBoost * smokeFlow;
      const lateral = layer === "hot" ? 2.8 : layer === "main" ? 5.4 : 8.2;
      const drift = Math.sin(phase) * lateral + Math.sin(phase * 0.47 + 1.7) * 2.1;
      particle.x += (particle.vx + drift + sharedCurrent.x * 8) * dt;
      particle.y += particle.vy * buoyancy * dt;
      const expansion = layer === "hot"
        ? 2.4 + smokeDensity * 1.6
        : layer === "main"
          ? 3.2 + smokeDensity * 2.2
          : 4.2 + smokeDensity * 2.6;
      particle.size += dt * expansion;
    } else if (particle.type === "ember") {
      const burst = 0.78 + (profile?.embers ?? 0) * 0.82;
      particle.x += (particle.vx + Math.sin(phase) * (7 + turbulence * 10)) * dt;
      particle.y += particle.vy * burst * dt;
    } else if (particle.type === "ash") {
      const burst = 0.56 + (profile?.ash ?? 0) * 0.82;
      particle.x += (particle.vx + Math.sin(phase * 0.6) * (8 + turbulence * 12)) * dt;
      particle.y += particle.vy * burst * dt;
    } else if (particle.type === "bubble") {
      const lift = 0.82 + (profile?.bubbles ?? 0) * 0.62;
      particle.x += (particle.vx + Math.sin(phase) * (5.2 + turbulence * 4.6) + sharedCurrent.x * 12) * dt;
      particle.y += particle.vy * lift * dt;
      particle.size += dt * (0.12 + eruption * 0.30);
    } else if (particle.type === "sediment") {
      particle.x += (particle.vx + Math.sin(phase * 0.7) * (1.6 + turbulence * 2.2)) * dt;
      particle.y += (particle.vy * (0.22 + sediment * 0.46) + (1 - sediment) * 2.2) * dt;
      if (shock > 0.12) particle.y -= shock * dt * (22 + particle.size * 3.5);
    } else {
      particle.x += (particle.vx + Math.sin(phase) * 0.8 + sharedCurrent.x * 7) * dt;
      particle.y += (particle.vy + sharedCurrent.y * 5) * dt;
    }

    if (shock > 0.08 && particle.type !== "vent" && particle.type !== "bio" && particle.type !== "smoke") {
      const dx = particle.x - craterX;
      const dy = particle.y - craterY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const shockRadius = height * 0.68;
      if (distance < shockRadius) {
        const falloff = 1 - distance / shockRadius;
        const mass = particle.type === "smoke"
          ? 0.34
          : particle.type === "bubble"
            ? 0.82
            : particle.type === "sediment"
              ? 0.70
              : 1;
        const impulse = shock * falloff * mass * dt;
        particle.x += (dx / distance) * impulse * 226;
        particle.y += (dy / distance) * impulse * 104;
      }
    }

    const margin = Math.max(8, particle.size * 1.5);
    if (
      particle.life >= particle.ttl
      || particle.y < -margin
      || particle.y > height + margin * 1.4
      || particle.x < -margin
      || particle.x > width + margin
    ) {
      resetParticle(particle, random, width, height);
    }
  }

  return particles;
}
