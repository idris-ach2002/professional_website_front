import {
  OCEAN_BIOMES,
  clamp,
  deterministicRockSeed,
  sampleOceanCurrent,
} from "../ocean/oceanWorldEngine.js";

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

export function createVolcanoRockfall(seed = 0x7a31) {
  return {
    seed: seed >>> 0,
    serial: 0,
    nextSpawnAt: 0.18,
    active: [],
    settledCount: 0,
  };
}

function resolveSpawnDelay(profile, random) {
  const shock = clamp(profile?.shock ?? 0, 0, 2);
  const pulse = clamp(profile?.pulse ?? 0, 0, 2.2);
  const base = 0.42 + random() * 0.58;
  const acceleration = 1 + shock * 2.5 + pulse * 0.62;
  return clamp(base / acceleration, 0.12, 1.08);
}

function resolveRockKind(profile, random) {
  const roll = random();
  const megaActive = profile?.pulseType === "mega" && (profile?.pulse ?? 0) > 0.78;
  if (roll < 0.18) return "dust";
  if (megaActive && roll < 0.34) return "mega";
  if (roll < 0.56) return "hot";
  return "basalt";
}

function resolveRockSize(kind, random) {
  if (kind === "dust") return 0.8 + random() * 1.5;
  if (kind === "mega") return 8.4 + random() * 7.2;
  if (kind === "hot") return 3.2 + random() * 6.4;
  return 2.4 + random() * 6.1;
}

function spawnRock(runtime, width, height, profile) {
  const random = mulberry32((runtime.seed + runtime.serial * 0x9e3779b9) >>> 0);
  const leftFlank = random() < 0.5;
  const normalizedX = leftFlank
    ? 0.345 + random() * 0.115
    : 0.54 + random() * 0.115;
  const normalizedY = 0.49 + random() * 0.215;
  const kind = resolveRockKind(profile, random);
  const size = resolveRockSize(kind, random);
  const hot = kind === "hot" || kind === "mega";
  const seedValue = deterministicRockSeed(normalizedX, normalizedY, runtime.serial);
  const speedScale = kind === "dust" ? 0.54 : kind === "mega" ? 1.18 : 1;
  const rock = {
    id: `rockfall-${runtime.serial}`,
    kind,
    x: normalizedX * width,
    y: normalizedY * height,
    vx: ((leftFlank ? -1 : 1) * (1.8 + random() * 8.6) + (random() - 0.5) * 3.4) * speedScale,
    vy: (7 + random() * 18) * speedScale,
    gravity: (5.8 + random() * 8.8) * (kind === "dust" ? 0.58 : kind === "mega" ? 1.12 : 1),
    waterDrag: kind === "dust" ? 0.972 : kind === "mega" ? 0.990 : 0.984,
    rotation: random() * Math.PI * 2,
    spin: (random() - 0.5) * (kind === "mega" ? 0.68 : 0.9 + random() * 1.7),
    size,
    hot,
    heat: hot ? (kind === "mega" ? 0.82 : 0.46) + random() * 0.54 : 0,
    floorY: height * (0.835 + random() * 0.075),
    shape: [
      0.74 + seedValue * 0.25,
      0.62 + random() * 0.25,
      0.70 + random() * 0.22,
      0.58 + random() * 0.28,
    ],
  };
  runtime.serial += 1;
  runtime.active.push(rock);
}

export function stepVolcanoRockfall(runtime, deltaSeconds, width, height, elapsedSeconds, profile, maxActive = 22) {
  const dt = clamp(Number(deltaSeconds) || 0, 0, 0.05);
  if (!dt || width <= 1 || height <= 1) return [];
  const settled = [];

  if (elapsedSeconds >= runtime.nextSpawnAt && runtime.active.length < maxActive) {
    const random = mulberry32((runtime.seed + runtime.serial * 17 + Math.floor(elapsedSeconds * 11)) >>> 0);
    const burstCount = profile?.pulseType === "mega" && (profile?.shock ?? 0) > 0.46 ? 2 : 1;
    for (let index = 0; index < burstCount && runtime.active.length < maxActive; index += 1) {
      spawnRock(runtime, width, height, profile);
    }
    runtime.nextSpawnAt = elapsedSeconds + resolveSpawnDelay(profile, random);
  }

  for (let index = runtime.active.length - 1; index >= 0; index -= 1) {
    const rock = runtime.active[index];
    const current = sampleOceanCurrent(
      rock.x / Math.max(1, width),
      rock.y / Math.max(1, height),
      elapsedSeconds,
      OCEAN_BIOMES.CALDERA,
    );
    rock.vy += rock.gravity * dt;
    rock.vx += current.x * (rock.kind === "dust" ? 4.8 : 2.2) * dt;
    rock.vy += current.y * (rock.kind === "dust" ? 2.8 : 1.3) * dt;
    rock.vx *= Math.pow(rock.waterDrag, dt * 60);
    rock.vy *= Math.pow(0.994, dt * 60);
    rock.x += rock.vx * dt;
    rock.y += rock.vy * dt;
    rock.rotation += rock.spin * dt;
    rock.heat = Math.max(0, rock.heat - dt * (rock.kind === "mega" ? 0.095 : 0.14));

    if (rock.y >= rock.floorY) {
      rock.y = rock.floorY;
      rock.rotation += (deterministicRockSeed(rock.x / width, rock.y / height, index) - 0.5) * 0.44;
      rock.settledIndex = runtime.settledCount;
      runtime.settledCount += 1;
      settled.push(rock);
      runtime.active.splice(index, 1);
    }
  }

  return settled;
}

export function resolveRockfallLimit(runtimeQuality = "high", performanceMode = "full") {
  if (runtimeQuality === "constrained") return 7;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return 13;
  return 22;
}
