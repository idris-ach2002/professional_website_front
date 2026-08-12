import { useEffect, useRef, useState } from "react";
import { OCEAN_CINEMATIC_DURATIONS_MS } from "../ocean/oceanTransitionTimings";

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
    const layerScale = 0.55 + particle.layer * 0.44;
    const length = (vertical ? height : width) * (0.018 + progress * 0.095) * layerScale;
    const x = particle.x * width + Math.sin(particle.phase + progress * 9) * width * particle.drift;
    const y = ((particle.y + progress * particle.speed * 0.92) % 1) * height;
    context.strokeStyle = `rgba(187,242,251,${alpha * (0.15 + particle.layer * 0.11)})`;
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
      Math.PI * 2,
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

  // Surface caustics collapse upward while refraction bands squeeze inward.
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

  // Foreground strata rush upward at different speeds: the viewer feels a real plunge.
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

  drawSpeedStreaks(context, viewport, particles, plunge, 0.92, true);
  drawPressureLens(context, viewport, p);

  const ceiling = height * (0.04 + e * 0.30);
  const topShade = context.createLinearGradient(0, 0, 0, ceiling + height * 0.22);
  topShade.addColorStop(0, `rgba(0,5,13,${e * 0.78})`);
  topShade.addColorStop(1, "rgba(0,5,13,0)");
  context.fillStyle = topShade;
  context.fillRect(0, 0, width, ceiling + height * 0.22);

  // A final pressure pinch hides the exact next composition for a fraction of a second.
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

  // Multi-depth basalt occlusion closes like a real fault before the hot cavity appears.
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

  // The destination is announced by geology: a branching incandescent fault, not an object crossing the screen.
  const crackX = width * 0.5;
  const crackGlow = context.createRadialGradient(crackX, height * 0.55, 0, crackX, height * 0.55, width * (0.025 + fracture * 0.36));
  crackGlow.addColorStop(0, `rgba(255,167,62,${fracture * 0.86})`);
  crackGlow.addColorStop(0.18, `rgba(255,74,12,${fracture * 0.54})`);
  crackGlow.addColorStop(1, "rgba(227,39,7,0)");
  context.fillStyle = crackGlow;
  context.fillRect(0, 0, width, height);

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
  for (let branch = 0; branch < 6; branch += 1) {
    drawFractureBranch(context, width, height, crackX, height * (0.18 + branch * 0.105), fracture * (0.42 + branch * 0.07), fracture * 0.72, branch);
  }
  context.restore();

  // Heat haze: thin displaced strips suggest pressure without expensive pixel filters.
  context.save();
  context.globalCompositeOperation = "screen";
  for (let band = 0; band < 6; band += 1) {
    const bandY = height * (0.28 + band * 0.09);
    const wave = Math.sin(p * 15 + band) * width * 0.005;
    context.fillStyle = `rgba(255,106,33,${fracture * 0.035})`;
    context.fillRect(crackX - width * 0.12 + wave, bandY, width * 0.24, 2 + band % 2);
  }
  context.restore();

  for (const particle of particles) {
    const radial = 0.025 + fracture * (0.12 + particle.speed * 0.34);
    const angle = particle.phase + p * (0.9 + particle.speed * 0.48);
    const x = crackX + Math.cos(angle) * width * radial;
    const y = height * 0.56 + Math.sin(angle) * height * radial * 0.72 - fracture * height * particle.speed * 0.15;
    context.fillStyle = particle.layer === 2 ? "rgba(255,162,71,.58)" : "rgba(133,151,152,.30)";
    context.fillRect(x, y, particle.size * (1 + fracture * 0.8), particle.size * 0.62);
  }

  // A short subterranean pulse immediately before reveal makes the caldera feel alive.
  const pulse = Math.max(0, 1 - Math.abs(p - 0.76) / 0.105);
  if (pulse > 0) {
    context.strokeStyle = `rgba(255,136,39,${pulse * 0.46})`;
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(crackX, height * 0.57, width * (0.05 + pulse * 0.27), height * (0.03 + pulse * 0.15), 0, 0, Math.PI * 2);
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

  // Central airlock silhouette grows from the boot sequence.
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
    const residual = context.createRadialGradient(width * 0.12, height * 0.62, 0, width * 0.12, height * 0.62, width * (0.05 + shock * 0.40));
    residual.addColorStop(0, `rgba(255,115,38,${Math.max(0, 0.72 - p * 0.78)})`);
    residual.addColorStop(0.28, `rgba(240,54,10,${Math.max(0, 0.33 - p * 0.35)})`);
    residual.addColorStop(1, "rgba(214,44,8,0)");
    context.fillStyle = residual;
    context.fillRect(0, 0, width, height);

    // One expanding pressure ring from the caldera before power loss.
    if (p < 0.32) {
      context.strokeStyle = `rgba(255,149,69,${(1 - p / 0.32) * 0.34})`;
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(width * 0.12, height * 0.62, width * shock * 0.46, height * shock * 0.28, 0, 0, Math.PI * 2);
      context.stroke();
    }
  }

  // Total blackout creates the suspense beat. Nothing announces the station yet.
  context.fillStyle = `rgba(0,2,6,${blackout * 0.94})`;
  context.fillRect(0, 0, width, height);

  // Destination-linked boot sequence: rails, power nodes, grid and airlock materialise in layers.
  drawPerspectiveGrid(context, viewport, power, (p * 4) % 1);
  drawStationGeometry(context, viewport, power);

  context.save();
  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 14; index += 1) {
    const local = clamp01((power - index * 0.038) / 0.48);
    if (local <= 0) continue;
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = width * (0.10 + column * 0.133);
    const y = height * (0.22 + row * 0.54 + Math.sin(index * 2.3) * 0.026);
    const glow = context.createRadialGradient(x, y, 0, x, y, 16 + local * 20);
    glow.addColorStop(0, `rgba(163,249,255,${local * 0.72})`);
    glow.addColorStop(0.18, `rgba(68,225,244,${local * 0.45})`);
    glow.addColorStop(1, "rgba(68,225,244,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, 18 + local * 18, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  // Airlock shutters retract to reveal the next world instead of a generic wipe.
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

  const scanY = height * (0.12 + power * 0.76);
  const scan = context.createLinearGradient(0, scanY - 26, 0, scanY + 26);
  scan.addColorStop(0, "rgba(92,236,250,0)");
  scan.addColorStop(0.5, `rgba(92,236,250,${power * 0.28})`);
  scan.addColorStop(1, "rgba(92,236,250,0)");
  context.fillStyle = scan;
  context.fillRect(0, scanY - 26, width, 52);

  for (const particle of particles) {
    const x = ((particle.x - p * particle.speed * 0.16) % 1 + 1) % 1 * width;
    const y = particle.y * height + Math.sin(p * 8 + particle.phase) * 10;
    context.fillStyle = power > 0.30 ? "rgba(112,237,250,.25)" : "rgba(206,108,62,.16)";
    context.fillRect(x, y, 2 + particle.layer * 2, 1);
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

  // Station light decays into natural stone.
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, `rgb(1,${Math.round(28 - e * 22)},${Math.round(43 - e * 33)})`);
  background.addColorStop(0.55, `rgb(${Math.round(2 + e * 7)},${Math.round(20 - e * 12)},${Math.round(30 - e * 17)})`);
  background.addColorStop(1, "#030507");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  // A geological wall grows inward in several parallax layers.
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

  // Sonar-style resonance scans the wall before any precious material is visible.
  context.save();
  context.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 4; ring += 1) {
    const local = clamp01(resonance * 1.28 - ring * 0.18);
    if (local <= 0 || local >= 1) continue;
    context.strokeStyle = `rgba(119,229,241,${Math.sin(local * Math.PI) * 0.18})`;
    context.lineWidth = 1.1;
    context.beginPath();
    context.ellipse(width * 0.5, height * 0.54, width * local * 0.34, height * local * 0.24, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  // Microfractures answer the scan. They reveal only mineral veins, never the final objects.
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

  for (const particle of particles) {
    const local = clamp01((crack - particle.x * 0.30) / 0.74);
    if (local <= 0) continue;
    const x = width * (0.43 + particle.x * 0.14) + Math.sin(particle.phase + p * 6) * width * 0.010;
    const y = particle.y * height;
    context.fillStyle = particle.layer === 2 ? `rgba(255,219,132,${local * 0.54})` : `rgba(176,241,249,${local * 0.36})`;
    context.beginPath();
    context.arc(x, y, particle.size * (0.65 + local), 0, Math.PI * 2);
    context.fill();
  }

  // A brief spectral reflection promises something rare behind the wall, then disappears.
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

function drawScene(context, sceneKey, viewport, progress, particles, shards) {
  const reverse = ["deep-surface", "caldera-deep", "projects-caldera", "projects-deep", "outro-projects"].includes(sceneKey);
  if (sceneKey === "surface-deep" || sceneKey === "deep-surface") {
    drawPressureDescent(context, viewport, progress, particles, reverse);
    return;
  }
  if (sceneKey === "deep-caldera" || sceneKey === "caldera-deep") {
    drawSeismicRift(context, viewport, progress, particles, shards, reverse);
    return;
  }
  if (["caldera-projects", "projects-caldera", "deep-projects", "projects-deep"].includes(sceneKey)) {
    drawStationPowerReveal(
      context,
      viewport,
      progress,
      particles,
      sceneKey.includes("deep-projects") || sceneKey.includes("projects-deep"),
      reverse,
    );
    return;
  }
  if (sceneKey === "projects-outro" || sceneKey === "outro-projects") {
    drawMineralResonance(context, viewport, progress, particles, shards, reverse);
  }
}

export default function OceanTransitionStage({ reducedMotion = false, performanceMode = "full", paused = false, runtimeQuality = "high" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const [scene, setScene] = useState(null);

  useEffect(() => {
    const handleTransition = (event) => {
      const from = event.detail?.from;
      const to = event.detail?.to;
      if (!from || !to || from === to) return;
      const key = `${from}-${to}`;
      if (!OCEAN_CINEMATIC_DURATIONS_MS[key]) return;
      setScene({ key, token: performance.now() });
    };
    window.addEventListener("portfolio:ocean-transition", handleTransition);
    return () => window.removeEventListener("portfolio:ocean-transition", handleTransition);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene || reducedMotion || paused || ["lite", "ultra-lite"].includes(performanceMode)) return undefined;
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return undefined;

    let viewport = resizeCanvas(canvas, runtimeQuality);
    const count = runtimeQuality === "constrained" ? 18 : runtimeQuality === "balanced" ? 28 : 40;
    const shardCount = runtimeQuality === "constrained" ? 8 : runtimeQuality === "balanced" ? 12 : 16;
    const seed = Math.round(scene.token) ^ scene.key.length * 131;
    const particles = createSceneParticles(count, seed);
    const shards = createRockShards(shardCount, seed);
    const duration = OCEAN_CINEMATIC_DURATIONS_MS[scene.key] ?? 760;
    const startedAt = performance.now();
    let disposed = false;

    document.documentElement.dataset.oceanCinematic = scene.key;

    const resize = () => {
      viewport = resizeCanvas(canvas, runtimeQuality);
    };
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });

    const paint = (now) => {
      if (disposed) return;
      const progress = clamp01((now - startedAt) / duration);
      context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);
      context.save();
      context.globalAlpha = sceneFade(progress);
      drawScene(context, scene.key, viewport, progress, particles, shards);
      context.restore();

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(paint);
      } else {
        context.clearRect(0, 0, viewport.width, viewport.height);
        if (document.documentElement.dataset.oceanCinematic === scene.key) delete document.documentElement.dataset.oceanCinematic;
        setScene((current) => current?.token === scene.token ? null : current);
      }
    };

    rafRef.current = window.requestAnimationFrame(paint);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      if (document.documentElement.dataset.oceanCinematic === scene.key) delete document.documentElement.dataset.oceanCinematic;
    };
  }, [paused, performanceMode, reducedMotion, runtimeQuality, scene]);

  return (
    <canvas
      ref={canvasRef}
      className={`ocean-transition-stage${scene ? " is-active" : ""}`}
      data-cinematic={scene?.key ?? "idle"}
      data-reveal-engine="cinematic-world-reveal"
      aria-hidden="true"
    />
  );
}
