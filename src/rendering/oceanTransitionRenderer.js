// Visual language contract: real plunge; branching incandescent fault; Airlock shutters; Sonar-style resonance.
const TAU = Math.PI * 2;
const STATION_GLOW_LAYOUT = Object.freeze(Array.from({ length: 14 }, (_, index) => Object.freeze({
  column: index % 7,
  row: Math.floor(index / 7),
  yJitter: Math.sin(index * 2.3) * 0.026,
})));
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeInOut(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function easeOut(value) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function easeIn(value) {
  const t = clamp01(value);
  return t * t * t;
}

function sceneFade(progress) {
  const enter = clamp01(progress / 0.055);
  const exit = clamp01((1 - progress) / 0.06);
  return Math.min(enter, exit);
}

function makeRandom(seed = 0x5219) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSceneParticles(count, seed) {
  const random = makeRandom(seed);
  return Array.from({ length: count }, (_, index) => ({
    x: random(),
    y: random(),
    size: 0.8 + random() * 3.2,
    speed: 0.32 + random() * 1.25,
    drift: (random() - 0.5) * 0.18,
    phase: random() * Math.PI * 2,
    layer: index % 3,
    streakLayerScale: 0.55 + (index % 3) * 0.44,
    streakAlphaBase: 0.15 + (index % 3) * 0.11,
    stationWidth: 2 + (index % 3) * 2,
  }));
}

function createRockShards(count, seed) {
  const random = makeRandom(seed ^ 0x9914);
  return Array.from({ length: count }, (_, index) => ({
    side: index % 2 === 0 ? -1 : 1,
    y: 0.04 + random() * 0.88,
    width: 0.045 + random() * 0.12,
    height: 0.05 + random() * 0.17,
    depth: 0.45 + random() * 0.9,
    skew: (random() - 0.5) * 0.8,
    phase: random() * Math.PI * 2,
  }));
}

function resizeCanvas(canvas, runtimeQuality) {
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    runtimeQuality === "constrained" ? 0.9 : runtimeQuality === "balanced" ? 1.05 : 1.2,
  );
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return { width, height, dpr };
}

function drawSuspenseVeil(context, viewport, progress, intensity = 1, focusX = 0.5, focusY = 0.52) {
  const { width, height } = viewport;
  const reveal = easeOut(clamp01((progress - 0.34) / 0.58));
  const darkness = intensity * 0.58 * (1 - reveal);
  if (darkness <= 0) return;
  const aperture = Math.max(width, height) * (0.055 + reveal * 0.76);
  const vignette = context.createRadialGradient(
    width * focusX,
    height * focusY,
    aperture * 0.08,
    width * focusX,
    height * focusY,
    aperture,
  );
  vignette.addColorStop(0, `rgba(0,3,8,${darkness * 0.015})`);
  vignette.addColorStop(0.42, `rgba(0,3,8,${darkness * 0.16})`);
  vignette.addColorStop(1, `rgba(0,2,7,${darkness})`);
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function drawSpeedStreaks(context, viewport, particles, progress, alpha, vertical = true) {
  const { width, height } = viewport;
  context.save();
  context.lineCap = "round";
  for (const particle of particles) {
    const length = (vertical ? height : width) * (0.018 + progress * 0.095) * particle.streakLayerScale;
    const x = particle.x * width + Math.sin(particle.phase + progress * 9) * width * particle.drift;
    const y = ((particle.y + progress * particle.speed * 0.92) % 1) * height;
    context.strokeStyle = `rgba(187,242,251,${alpha * particle.streakAlphaBase})`;
    context.lineWidth = Math.max(0.7, particle.size * 0.55);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(vertical ? x : x - length, vertical ? y - length : y);
    context.stroke();
  }
  context.restore();
}

function drawPressureLens(context, viewport, progress) {
  const { width, height } = viewport;
  const pressure = easeInOut(clamp01((progress - 0.12) / 0.72));
  if (pressure <= 0) return;
  context.save();
  context.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 5; ring += 1) {
    const local = (pressure * 1.35 - ring * 0.14) % 1;
    if (local <= 0) continue;
    const alpha = Math.sin(local * Math.PI) * 0.13;
    context.strokeStyle = `rgba(154,236,251,${alpha})`;
    context.lineWidth = 1 + ring * 0.16;
    context.beginPath();
    context.ellipse(
      width * 0.5,
      height * 0.54,
      width * (0.045 + local * 0.43),
      height * (0.028 + local * 0.27),
      0,
      0,
      TAU,
    );
    context.stroke();
  }
  context.restore();
}

function drawPressureDescent(context, viewport, progress, particles, reverse = false) {
  const { width, height } = viewport;
  const p = reverse ? 1 - progress : progress;
  const e = easeInOut(p);
  const plunge = easeIn(clamp01((p - 0.08) / 0.68));

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, `rgb(${Math.round(84 - e * 80)},${Math.round(205 - e * 184)},${Math.round(231 - e * 197)})`);
  background.addColorStop(0.52, `rgb(${Math.round(22 - e * 18)},${Math.round(113 - e * 88)},${Math.round(151 - e * 111)})`);
  background.addColorStop(1, `rgb(1,${Math.round(44 - e * 34)},${Math.round(68 - e * 48)})`);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  if (e < 1) {
    context.save();
    context.globalCompositeOperation = "screen";
    for (let index = 0; index < 7; index += 1) {
      const x = width * (0.02 + index * 0.165);
      const narrowing = 1 - e * 0.82;
      context.fillStyle = `rgba(219,252,255,${(1 - e) * (0.075 + (index % 3) * 0.018)})`;
      context.beginPath();
      context.moveTo(x, -40);
      context.lineTo(x + width * 0.05 * narrowing, height * (0.46 + index % 2 * 0.08));
      context.lineTo(x + width * 0.13 * narrowing, height * (0.46 + index % 2 * 0.08));
      context.lineTo(x + width * 0.025, -40);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  if (e > 0) {
    for (let layer = 0; layer < 3; layer += 1) {
      const lift = plunge * height * (0.24 + layer * 0.24);
      const alpha = (0.08 + layer * 0.035) * e;
      context.fillStyle = `rgba(0,12,22,${alpha})`;
      context.beginPath();
      context.moveTo(0, height * (0.77 - layer * 0.08) - lift);
      context.quadraticCurveTo(width * 0.25, height * (0.69 - layer * 0.07) - lift, width * 0.48, height * (0.75 - layer * 0.05) - lift);
      context.quadraticCurveTo(width * 0.72, height * (0.66 - layer * 0.06) - lift, width, height * (0.73 - layer * 0.08) - lift);
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      context.fill();
    }
  }

  drawSpeedStreaks(context, viewport, particles, plunge, 0.92, true);
  drawPressureLens(context, viewport, p);

  if (e > 0) {
    const ceiling = height * (0.04 + e * 0.30);
    const topShade = context.createLinearGradient(0, 0, 0, ceiling + height * 0.22);
    topShade.addColorStop(0, `rgba(0,5,13,${e * 0.78})`);
    topShade.addColorStop(1, "rgba(0,5,13,0)");
    context.fillStyle = topShade;
    context.fillRect(0, 0, width, ceiling + height * 0.22);
  }

  const pinch = Math.max(0, 1 - Math.abs(p - 0.72) / 0.20);
  if (pinch > 0) {
    const shade = context.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, `rgba(0,3,9,${pinch * 0.48})`);
    shade.addColorStop(0.44, "rgba(0,3,9,0)");
    shade.addColorStop(0.56, "rgba(0,3,9,0)");
    shade.addColorStop(1, `rgba(0,3,9,${pinch * 0.48})`);
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);
  }

  drawSuspenseVeil(context, viewport, progress, 0.80);
}

function drawFractureBranch(context, width, height, originX, originY, scale, alpha, branchIndex) {
  if (scale <= 0 || alpha <= 0) return;
  const direction = branchIndex % 2 === 0 ? -1 : 1;
  context.beginPath();
  context.moveTo(originX, originY);
  context.lineTo(originX + direction * width * 0.034 * scale, originY + height * 0.12 * scale);
  context.lineTo(originX - direction * width * 0.018 * scale, originY + height * 0.23 * scale);
  context.lineTo(originX + direction * width * 0.044 * scale, originY + height * 0.36 * scale);
  context.strokeStyle = `rgba(255,108,31,${alpha})`;
  context.stroke();
}

function drawRockShards(context, viewport, shards, progress, heat = 0) {
  const { width, height } = viewport;
  const travel = easeOut(progress);
  for (const shard of shards) {
    const startX = shard.side < 0 ? -width * shard.width * 0.2 : width * (1 + shard.width * 0.2);
    const inward = width * (0.07 + shard.depth * 0.085) * Math.sin(travel * Math.PI);
    const x = startX - shard.side * inward;
    const y = height * shard.y + Math.sin(progress * 7 + shard.phase) * 5;
    const w = width * shard.width * shard.depth;
    const h = height * shard.height * shard.depth;
    const gradient = context.createLinearGradient(x, y, x + shard.side * w, y + h);
    gradient.addColorStop(0, `rgba(${Math.round(7 + heat * 28)},${Math.round(10 + heat * 8)},${Math.round(12 + heat * 3)},.98)`);
    gradient.addColorStop(1, "rgba(0,3,6,.995)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + shard.side * w, y + h * (0.14 + shard.skew * 0.12));
    context.lineTo(x + shard.side * w * 0.72, y + h);
    context.lineTo(x + shard.side * w * 0.12, y + h * 0.78);
    context.closePath();
    context.fill();
  }
}

function drawSeismicRift(context, viewport, progress, particles, shards, reverse = false) {
  const { width, height } = viewport;
  const p = reverse ? 1 - progress : progress;
  const lock = easeOut(clamp01(p / 0.36));
  const fracture = easeOut(clamp01((p - 0.28) / 0.52));
  const release = easeOut(clamp01((p - 0.68) / 0.30));

  context.fillStyle = "#01070d";
  context.fillRect(0, 0, width, height);

  drawRockShards(context, viewport, shards, Math.min(1, p * 1.15), fracture);
  for (let layer = 0; layer < 3; layer += 1) {
    const closure = lock * width * (0.12 + layer * 0.045) - release * width * (0.09 + layer * 0.04);
    const edge = width * (0.30 + layer * 0.045) + closure;
    const shade = 3 + layer * 4;
    context.fillStyle = `rgb(${shade},${shade + 3},${shade + 5})`;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(edge, 0);
    context.lineTo(edge * 0.88, height * 0.17);
    context.lineTo(edge * 1.03, height * 0.39);
    context.lineTo(edge * 0.82, height * 0.62);
    context.lineTo(edge * 1.00, height * 0.83);
    context.lineTo(edge * 0.93, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(width, 0);
    context.lineTo(width - edge, 0);
    context.lineTo(width - edge * 0.88, height * 0.17);
    context.lineTo(width - edge * 1.03, height * 0.39);
    context.lineTo(width - edge * 0.82, height * 0.62);
    context.lineTo(width - edge * 1.00, height * 0.83);
    context.lineTo(width - edge * 0.93, height);
    context.lineTo(width, height);
    context.closePath();
    context.fill();
  }

  const crackX = width * 0.5;
  if (fracture > 0) {
    const crackGlow = context.createRadialGradient(crackX, height * 0.55, 0, crackX, height * 0.55, width * (0.025 + fracture * 0.36));
    crackGlow.addColorStop(0, `rgba(255,167,62,${fracture * 0.86})`);
    crackGlow.addColorStop(0.18, `rgba(255,74,12,${fracture * 0.54})`);
    crackGlow.addColorStop(1, "rgba(227,39,7,0)");
    context.fillStyle = crackGlow;
    context.fillRect(0, 0, width, height);
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "rgba(255,61,9,.78)";
  context.shadowBlur = 10 + fracture * 22;
  context.strokeStyle = `rgba(255,139,45,${0.16 + fracture * 0.82})`;
  context.lineWidth = Math.max(1.1, width * 0.0014);
  context.beginPath();
  context.moveTo(crackX - width * 0.004, height * 0.07);
  context.lineTo(crackX + width * 0.012, height * 0.22);
  context.lineTo(crackX - width * 0.016, height * 0.38);
  context.lineTo(crackX + width * 0.009, height * 0.53);
  context.lineTo(crackX - width * 0.022, height * 0.72);
  context.lineTo(crackX + width * 0.006, height * 0.94);
  context.stroke();
  if (fracture > 0) {
    for (let branch = 0; branch < 6; branch += 1) {
      drawFractureBranch(context, width, height, crackX, height * (0.18 + branch * 0.105), fracture * (0.42 + branch * 0.07), fracture * 0.72, branch);
    }
  }
  context.restore();

  if (fracture > 0) {
    context.save();
    context.globalCompositeOperation = "screen";
    for (let band = 0; band < 6; band += 1) {
      const bandY = height * (0.28 + band * 0.09);
      const wave = Math.sin(p * 15 + band) * width * 0.005;
      context.fillStyle = `rgba(255,106,33,${fracture * 0.035})`;
      context.fillRect(crackX - width * 0.12 + wave, bandY, width * 0.24, 2 + band % 2);
    }
    context.restore();
  }

  for (const particle of particles) {
    const radial = 0.025 + fracture * (0.12 + particle.speed * 0.34);
    const angle = particle.phase + p * (0.9 + particle.speed * 0.48);
    const x = crackX + Math.cos(angle) * width * radial;
    const y = height * 0.56 + Math.sin(angle) * height * radial * 0.72 - fracture * height * particle.speed * 0.15;
    context.fillStyle = particle.layer === 2 ? "rgba(255,162,71,.58)" : "rgba(133,151,152,.30)";
    context.fillRect(x, y, particle.size * (1 + fracture * 0.8), particle.size * 0.62);
  }

  const pulse = Math.max(0, 1 - Math.abs(p - 0.76) / 0.105);
  if (pulse > 0) {
    context.strokeStyle = `rgba(255,136,39,${pulse * 0.46})`;
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(crackX, height * 0.57, width * (0.05 + pulse * 0.27), height * (0.03 + pulse * 0.15), 0, 0, TAU);
    context.stroke();
  }

  drawSuspenseVeil(context, viewport, progress, 0.96, 0.5, 0.56);
}

function drawPerspectiveGrid(context, viewport, power, offset = 0) {
  const { width, height } = viewport;
  if (power <= 0) return;
  const horizon = height * 0.46;
  context.save();
  context.strokeStyle = `rgba(84,226,246,${power * 0.16})`;
  context.lineWidth = 1;
  for (let line = -5; line <= 5; line += 1) {
    context.beginPath();
    context.moveTo(width * 0.5 + line * width * 0.025, horizon);
    context.lineTo(width * 0.5 + line * width * 0.17, height);
    context.stroke();
  }
  for (let row = 0; row < 6; row += 1) {
    const t = (row + offset) / 6;
    const y = horizon + (height - horizon) * t * t;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

function drawStationGeometry(context, viewport, power) {
  const { width, height } = viewport;
  if (power <= 0) return;
  const inset = width * (0.065 + (1 - power) * 0.10);
  const top = height * (0.15 + (1 - power) * 0.06);
  const bottom = height * (0.84 - (1 - power) * 0.06);

  context.save();
  context.strokeStyle = `rgba(98,235,250,${power * 0.32})`;
  context.lineWidth = 1.1;
  context.shadowColor = "rgba(66,216,239,.35)";
  context.shadowBlur = 6 * power;
  context.strokeRect(inset, top, width - inset * 2, bottom - top);
  for (let rail = 1; rail <= 5; rail += 1) {
    const x = inset + ((width - inset * 2) * rail) / 6;
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, bottom);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(inset, height * 0.33);
  context.lineTo(width - inset, height * 0.33);
  context.moveTo(inset, height * 0.67);
  context.lineTo(width - inset, height * 0.67);
  context.stroke();

  const doorW = width * 0.18 * power;
  const doorH = height * 0.34 * power;
  context.strokeStyle = `rgba(169,246,255,${power * 0.38})`;
  context.strokeRect(width * 0.5 - doorW / 2, height * 0.51 - doorH / 2, doorW, doorH);
  context.restore();
}

function drawStationPowerReveal(context, viewport, progress, particles, direct = false, reverse = false) {
  const { width, height } = viewport;
  const p = reverse ? 1 - progress : progress;
  const e = easeInOut(p);
  const shock = direct ? 0 : easeOut(clamp01(p / 0.24));
  const blackout = clamp01(1 - Math.abs(p - 0.30) / 0.18);
  const power = easeOut(clamp01((p - 0.43) / 0.46));

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, direct ? "#02131f" : `rgb(${Math.round(38 + (1 - e) * 45)},${Math.round(12 + (1 - e) * 8)},${Math.round(13 + e * 15)})`);
  background.addColorStop(0.48, "#01070d");
  background.addColorStop(1, `rgb(1,${Math.round(10 + power * 27)},${Math.round(17 + power * 38)})`);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  if (!direct) {
    const residualCoreAlpha = Math.max(0, 0.72 - p * 0.78);
    const residualMidAlpha = Math.max(0, 0.33 - p * 0.35);
    if (residualCoreAlpha > 0 || residualMidAlpha > 0) {
      const residual = context.createRadialGradient(width * 0.12, height * 0.62, 0, width * 0.12, height * 0.62, width * (0.05 + shock * 0.40));
      residual.addColorStop(0, `rgba(255,115,38,${residualCoreAlpha})`);
      residual.addColorStop(0.28, `rgba(240,54,10,${residualMidAlpha})`);
      residual.addColorStop(1, "rgba(214,44,8,0)");
      context.fillStyle = residual;
      context.fillRect(0, 0, width, height);
    }

    if (p < 0.32) {
      context.strokeStyle = `rgba(255,149,69,${(1 - p / 0.32) * 0.34})`;
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(width * 0.12, height * 0.62, width * shock * 0.46, height * shock * 0.28, 0, 0, TAU);
      context.stroke();
    }
  }

  if (blackout > 0) {
    context.fillStyle = `rgba(0,2,6,${blackout * 0.94})`;
    context.fillRect(0, 0, width, height);
  }

  drawPerspectiveGrid(context, viewport, power, (p * 4) % 1);
  drawStationGeometry(context, viewport, power);

  if (power > 0) {
    context.save();
    context.globalCompositeOperation = "screen";
    for (let index = 0; index < STATION_GLOW_LAYOUT.length; index += 1) {
      const local = clamp01((power - index * 0.038) / 0.48);
      if (local <= 0) continue;
      const layout = STATION_GLOW_LAYOUT[index];
      const x = width * (0.10 + layout.column * 0.133);
      const y = height * (0.22 + layout.row * 0.54 + layout.yJitter);
      const radius = 16 + local * 20;
      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(163,249,255,${local * 0.72})`);
      glow.addColorStop(0.18, `rgba(68,225,244,${local * 0.45})`);
      glow.addColorStop(1, "rgba(68,225,244,0)");
      context.fillStyle = glow;
      // The former arc clip was always >= the gradient outer radius, so it
      // could not affect a visible pixel. Filling the exact gradient bounds
      // removes 14 path constructions per frame with identical output.
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    context.restore();
  }

  const shutters = easeOut(clamp01((power - 0.46) / 0.54));
  if (shutters < 1) {
    const shutterH = height * 0.31 * (1 - shutters);
    const metal = context.createLinearGradient(0, 0, 0, shutterH);
    metal.addColorStop(0, "rgba(4,20,29,.99)");
    metal.addColorStop(1, "rgba(1,8,14,.99)");
    context.fillStyle = metal;
    context.fillRect(0, 0, width, shutterH);
    context.fillRect(0, height - shutterH, width, shutterH);
    context.strokeStyle = `rgba(79,214,234,${power * 0.25})`;
    context.beginPath();
    context.moveTo(0, shutterH);
    context.lineTo(width, shutterH);
    context.moveTo(0, height - shutterH);
    context.lineTo(width, height - shutterH);
    context.stroke();
  }

  if (power > 0) {
    const scanY = height * (0.12 + power * 0.76);
    const scan = context.createLinearGradient(0, scanY - 26, 0, scanY + 26);
    scan.addColorStop(0, "rgba(92,236,250,0)");
    scan.addColorStop(0.5, `rgba(92,236,250,${power * 0.28})`);
    scan.addColorStop(1, "rgba(92,236,250,0)");
    context.fillStyle = scan;
    context.fillRect(0, scanY - 26, width, 52);
  }

  context.fillStyle = power > 0.30 ? "rgba(112,237,250,.25)" : "rgba(206,108,62,.16)";
  for (const particle of particles) {
    const x = ((particle.x - p * particle.speed * 0.16) % 1 + 1) % 1 * width;
    const y = particle.y * height + Math.sin(p * 8 + particle.phase) * 10;
    context.fillRect(x, y, particle.stationWidth, 1);
  }

  drawSuspenseVeil(context, viewport, progress, 0.84, 0.5, 0.5);
}

function drawMineralResonance(context, viewport, progress, particles, shards, reverse = false) {
  const { width, height } = viewport;
  const p = reverse ? 1 - progress : progress;
  const e = easeInOut(p);
  const rockArrival = easeOut(clamp01((p - 0.15) / 0.38));
  const resonance = easeOut(clamp01((p - 0.37) / 0.46));
  const crack = easeOut(clamp01((p - 0.52) / 0.34));

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, `rgb(1,${Math.round(28 - e * 22)},${Math.round(43 - e * 33)})`);
  background.addColorStop(0.55, `rgb(${Math.round(2 + e * 7)},${Math.round(20 - e * 12)},${Math.round(30 - e * 17)})`);
  background.addColorStop(1, "#030507");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  drawRockShards(context, viewport, shards, rockArrival, 0);
  for (let layer = 0; layer < 3; layer += 1) {
    const inset = width * (0.09 + layer * 0.055) * rockArrival;
    context.fillStyle = `rgba(${7 + layer * 3},${9 + layer * 3},${10 + layer * 3},${0.88 + layer * 0.035})`;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(width * 0.42 - inset, 0);
    context.lineTo(width * 0.46 - inset * 0.55, height * 0.22);
    context.lineTo(width * 0.41 - inset, height * 0.49);
    context.lineTo(width * 0.46 - inset * 0.45, height * 0.72);
    context.lineTo(width * 0.43 - inset * 0.65, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(width, 0);
    context.lineTo(width * 0.58 + inset, 0);
    context.lineTo(width * 0.54 + inset * 0.55, height * 0.22);
    context.lineTo(width * 0.59 + inset, height * 0.49);
    context.lineTo(width * 0.54 + inset * 0.45, height * 0.72);
    context.lineTo(width * 0.57 + inset * 0.65, height);
    context.lineTo(width, height);
    context.closePath();
    context.fill();
  }

  context.save();
  context.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 4; ring += 1) {
    const local = clamp01(resonance * 1.28 - ring * 0.18);
    if (local <= 0 || local >= 1) continue;
    context.strokeStyle = `rgba(119,229,241,${Math.sin(local * Math.PI) * 0.18})`;
    context.lineWidth = 1.1;
    context.beginPath();
    context.ellipse(width * 0.5, height * 0.54, width * local * 0.34, height * local * 0.24, 0, 0, TAU);
    context.stroke();
  }
  context.restore();

  if (crack > 0) {
    context.save();
    context.lineCap = "round";
    const veinColors = [
      `rgba(252,216,120,${crack * 0.72})`,
      `rgba(157,237,251,${crack * 0.66})`,
      `rgba(184,153,249,${crack * 0.38})`,
    ];
    for (let vein = 0; vein < 7; vein += 1) {
      const spread = (vein - 3) * width * 0.0105;
      context.strokeStyle = veinColors[vein % veinColors.length];
      context.lineWidth = 0.9 + (vein % 3) * 0.45;
      context.shadowColor = veinColors[vein % veinColors.length];
      context.shadowBlur = 7 + crack * 11;
      const startX = width * 0.5 + spread;
      context.beginPath();
      context.moveTo(startX, height * 0.18);
      context.lineTo(startX + width * 0.012 * Math.sin(vein + 1), height * 0.34);
      context.lineTo(startX - width * 0.017 * Math.cos(vein * 1.6), height * 0.52);
      context.lineTo(startX + width * 0.019 * Math.sin(vein * 2.2), height * 0.72);
      context.lineTo(startX - width * 0.006, height * 0.90);
      context.stroke();
    }
    context.restore();
  }

  for (const particle of particles) {
    const local = clamp01((crack - particle.x * 0.30) / 0.74);
    if (local <= 0) continue;
    const x = width * (0.43 + particle.x * 0.14) + Math.sin(particle.phase + p * 6) * width * 0.010;
    const y = particle.y * height;
    context.fillStyle = particle.layer === 2 ? `rgba(255,219,132,${local * 0.54})` : `rgba(176,241,249,${local * 0.36})`;
    context.beginPath();
    context.arc(x, y, particle.size * (0.65 + local), 0, TAU);
    context.fill();
  }

  const glint = Math.max(0, 1 - Math.abs(p - 0.82) / 0.075);
  if (glint > 0) {
    const beam = context.createRadialGradient(width * 0.50, height * 0.54, 0, width * 0.50, height * 0.54, width * 0.29);
    beam.addColorStop(0, `rgba(250,255,255,${glint * 0.42})`);
    beam.addColorStop(0.12, `rgba(164,242,255,${glint * 0.17})`);
    beam.addColorStop(0.24, `rgba(255,221,141,${glint * 0.13})`);
    beam.addColorStop(1, "rgba(255,221,141,0)");
    context.fillStyle = beam;
    context.fillRect(0, 0, width, height);
  }

  drawSuspenseVeil(context, viewport, progress, 0.97, 0.5, 0.54);
}

const OCEAN_TRANSITION_SCENE_PLANS = Object.freeze({
  "surface-deep": Object.freeze({ kind: "pressure", reverse: false, direct: false }),
  "deep-surface": Object.freeze({ kind: "pressure", reverse: true, direct: false }),
  "deep-caldera": Object.freeze({ kind: "seismic", reverse: false, direct: false }),
  "caldera-deep": Object.freeze({ kind: "seismic", reverse: true, direct: false }),
  "caldera-projects": Object.freeze({ kind: "station", reverse: false, direct: false }),
  "projects-caldera": Object.freeze({ kind: "station", reverse: true, direct: false }),
  "deep-projects": Object.freeze({ kind: "station", reverse: false, direct: true }),
  "projects-deep": Object.freeze({ kind: "station", reverse: true, direct: true }),
  "projects-outro": Object.freeze({ kind: "mineral", reverse: false, direct: false }),
  "outro-projects": Object.freeze({ kind: "mineral", reverse: true, direct: false }),
});

function resolveScenePlan(sceneKey) {
  return OCEAN_TRANSITION_SCENE_PLANS[sceneKey] ?? null;
}

function drawPreparedScene(context, plan, viewport, progress, particles, shards) {
  if (!plan) return;
  if (plan.kind === "pressure") {
    drawPressureDescent(context, viewport, progress, particles, plan.reverse);
    return;
  }
  if (plan.kind === "seismic") {
    drawSeismicRift(context, viewport, progress, particles, shards, plan.reverse);
    return;
  }
  if (plan.kind === "station") {
    drawStationPowerReveal(context, viewport, progress, particles, plan.direct, plan.reverse);
    return;
  }
  if (plan.kind === "mineral") {
    drawMineralResonance(context, viewport, progress, particles, shards, plan.reverse);
  }
}

function drawScene(context, sceneKey, viewport, progress, particles, shards) {
  drawPreparedScene(context, resolveScenePlan(sceneKey), viewport, progress, particles, shards);
}


export {
  clamp01,
  sceneFade,
  createSceneParticles,
  createRockShards,
  resizeCanvas,
  resolveScenePlan,
  drawPreparedScene,
  drawScene,
};
