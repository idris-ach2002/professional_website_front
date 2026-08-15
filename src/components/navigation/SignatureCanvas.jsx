import { useEffect, useMemo, useRef } from "react";
import useAnimationPreferences from "../../contexts/useAnimationPreferences";
import SignatureWordmarkSvg from "./SignatureWordmarkSvg";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MAX_DPR = 2;
const INTRO_DURATION_MS = 1_180;
const FEATHER_CYCLE_MS = 3_800;
const FEATHER_RENDER_SCALE = 0.86;
const SPECIAL_EVENT_FIRST_DELAY_MS = 1_500;
const SPECIAL_EVENT_PERIOD_MS = 10_550;
const SPECIAL_EVENT_DURATION_MS = 10_200;
const SPECIAL_FRAGMENT_COUNT = 9;
const ACTIVE_FRAME_RATE_FULL = 60;
const ACTIVE_FRAME_RATE_BALANCED = 42;
const REST_FRAME_RATE_FULL = 36;
const REST_FRAME_RATE_BALANCED = 24;
const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(0.00001, edge1 - edge0), 0, 1);
  return t * t * (3 - (2 * t));
}

function easeOutQuint(value) {
  const t = clamp(value, 0, 1);
  return 1 - ((1 - t) ** 5);
}

function easeInOutCubic(value) {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function fract(value) {
  return value - Math.floor(value);
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: (mt2 * mt * p0.x) + (3 * mt2 * t * p1.x) + (3 * mt * t2 * p2.x) + (t2 * t * p3.x),
    y: (mt2 * mt * p0.y) + (3 * mt2 * t * p1.y) + (3 * mt * t2 * p2.y) + (t2 * t * p3.y),
  };
}

function cubicBezierTangent(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const dx = (3 * mt * mt * (p1.x - p0.x)) + (6 * mt * t * (p2.x - p1.x)) + (3 * t * t * (p3.x - p2.x));
  const dy = (3 * mt * mt * (p1.y - p0.y)) + (6 * mt * t * (p2.y - p1.y)) + (3 * t * t * (p3.y - p2.y));
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function createParticleField(count = 36) {
  const random = mulberry32(0x1D415FEA);
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: index < count * 0.72 ? random() * 0.50 : random(),
    y: random(),
    depth: lerp(0.35, 1, random()),
    radius: lerp(0.45, 1.35, random()),
    driftX: lerp(0.006, 0.022, random()),
    driftY: lerp(0.012, 0.037, random()),
    phase: random() * TAU,
    twinkle: lerp(0.45, 1.25, random()),
    warm: random() > 0.77,
    glint: random() > 0.84,
    tone: random(),
    blur: random() > 0.72,
  }));
}

function createSparkField(count = 12) {
  const random = mulberry32(0xF341D9A2);
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    phase: random(),
    t: lerp(0.18, 0.94, random()),
    side: random() > 0.5 ? 1 : -1,
    spread: lerp(5, 16, random()),
    rise: lerp(10, 24, random()),
    radius: lerp(0.7, 1.45, random()),
  }));
}


function createTransformationFragments(count = SPECIAL_FRAGMENT_COUNT) {
  const random = mulberry32(0xFEA7A45);
  const slots = [
    { t: 0.22, side: -1 },
    { t: 0.31, side: 1 },
    { t: 0.40, side: -1 },
    { t: 0.49, side: 1 },
    { t: 0.58, side: -1 },
    { t: 0.66, side: 1 },
    { t: 0.74, side: -1 },
    { t: 0.82, side: 1 },
    { t: 0.89, side: -1 },
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    ...slots[index % slots.length],
    size: lerp(0.82, 1.12, random()),
    drift: lerp(-7.5, 7.5, random()),
    spin: lerp(-1.25, 1.25, random()),
    delay: index * 105,
    warm: index % 3 === 0 || random() > 0.76,
  }));
}

function resolveSpecialEvent(time, reveal, quality) {
  if (quality === "static" || reveal < 0.999) {
    return { active: false, mode: "idle", elapsed: 0, detachAmount: 0, contractionBoost: 0, energyPulse: 0 };
  }

  const sinceFirstEvent = time - INTRO_DURATION_MS - SPECIAL_EVENT_FIRST_DELAY_MS;
  if (sinceFirstEvent < 0) {
    return { active: false, mode: "idle", elapsed: 0, detachAmount: 0, contractionBoost: 0, energyPulse: 0 };
  }

  const elapsed = sinceFirstEvent % SPECIAL_EVENT_PERIOD_MS;
  if (elapsed >= SPECIAL_EVENT_DURATION_MS) {
    return { active: false, mode: "idle", elapsed, detachAmount: 0, contractionBoost: 0, energyPulse: 0 };
  }

  let mode = "prepare";
  if (elapsed >= 350 && elapsed < 2_900) mode = "shed";
  else if (elapsed >= 2_900 && elapsed < 4_300) mode = "assemble";
  else if (elapsed >= 4_300 && elapsed < 9_400) mode = "formed";
  else if (elapsed >= 9_400) mode = "return";

  // V47: the matter transformation is intentionally slow. Vanes detach and
  // settle with visible inertia before they become the initial I. The wordmark
  // then remains readable for about five seconds.
  const detachIn = smoothstep(260, 2_820, elapsed);
  const detachOut = 1 - smoothstep(9_400, 10_180, elapsed);
  const detachAmount = clamp(Math.min(detachIn, detachOut), 0, 1);
  const prepareContraction = smoothstep(0, 520, elapsed) * (1 - smoothstep(2_650, 3_220, elapsed));
  const returnContraction = smoothstep(9_360, 9_640, elapsed) * (1 - smoothstep(9_820, 10_180, elapsed));
  const energyPulse = Math.sin(smoothstep(3_760, 4_520, elapsed) * Math.PI) * (1 - smoothstep(4_520, 4_880, elapsed));

  return {
    active: true,
    mode,
    elapsed,
    detachAmount,
    contractionBoost: clamp(Math.max(prepareContraction * 0.96, returnContraction * 0.76), 0, 0.98),
    energyPulse: clamp(energyPulse, 0, 1),
  };
}

function resolveRibbonDetach(specialEvent, segmentIndex, side) {
  if (!specialEvent.active) return 0;
  const selected = side < 0
    ? [1, 3, 5, 7].includes(segmentIndex)
    : [2, 3, 5, 6, 7].includes(segmentIndex);
  if (!selected) return 0;
  const ordinal = side < 0 ? [1, 3, 5, 7].indexOf(segmentIndex) : 4 + [2, 3, 5, 6, 7].indexOf(segmentIndex);
  const stagger = smoothstep(0.08 + ordinal * 0.055, 0.42 + ordinal * 0.045, specialEvent.detachAmount);
  return clamp(stagger, 0, 1);
}

function interpolatePose(from, to, amount) {
  const t = easeInOutCubic(amount);
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    angle: lerp(from.angle, to.angle, t),
    scale: lerp(from.scale ?? 1, to.scale ?? 1, t),
  };
}

function drawCrossGlint(ctx, x, y, size, alpha, warm = false) {
  ctx.save();
  ctx.strokeStyle = warm ? `rgba(236,188,91,${alpha})` : `rgba(151,222,241,${alpha})`;
  ctx.lineWidth = 0.65;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawAmbientDust(ctx, width, height, particles, state) {
  const { time, hover, quality } = state;
  const count = quality === "full" ? particles.length : Math.min(20, particles.length);
  const seconds = time * 0.001;

  for (let index = 0; index < count; index += 1) {
    const particle = particles[index];
    const waveX = Math.sin((seconds * 0.48 * particle.depth) + particle.phase) * 0.021;
    const waveY = Math.cos((seconds * 0.36 * particle.depth) + particle.phase * 1.7) * 0.015;
    const xNorm = fract(particle.x + (seconds * particle.driftX) + waveX);
    const yNorm = 1 - fract((1 - particle.y) + (seconds * particle.driftY) + waveY);
    const x = xNorm * width;
    const y = yNorm * height;
    const pulse = 0.44 + 0.56 * Math.sin((seconds * particle.twinkle) + particle.phase);
    const edgeFade = smoothstep(0, 0.08, yNorm) * (1 - smoothstep(0.92, 1, yNorm));
    const foreground = smoothstep(0.68, 0.96, particle.depth);
    const alpha = (0.22 + particle.depth * 0.28 + hover * 0.055) * (0.58 + pulse * 0.42) * edgeFade;
    const radius = particle.radius * lerp(0.78, 1.28, particle.depth);

    if (particle.glint && quality === "full" && pulse > 0.70) {
      drawCrossGlint(ctx, x, y, 1.5 + radius, Math.min(0.9, alpha * 1.45), particle.warm);
      continue;
    }

    let rgb = "40,92,109"; // petrol dust remains visible over the bright cyan page.
    if (particle.tone > 0.52 && particle.tone <= 0.78) rgb = "76,152,175";
    else if (particle.tone > 0.78 && particle.tone <= 0.91) rgb = "201,153,66";
    else if (particle.tone > 0.91) rgb = "247,252,248";

    ctx.save();
    if (particle.blur && quality === "full") {
      ctx.shadowColor = `rgba(${rgb},${alpha * 0.58})`;
      ctx.shadowBlur = 3.6 + foreground * 3.4;
    }
    ctx.fillStyle = `rgba(${rgb},${Math.min(0.78, alpha)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();

    if (foreground > 0.38 && quality === "full") {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4.2);
      glow.addColorStop(0, `rgba(${rgb},${alpha * 0.22})`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function createFeatherGeometry(width, height) {
  const sx = width / 252;
  const sy = height / 62;
  const p0 = { x: 7 * sx, y: 58 * sy };
  const p1 = { x: 34 * sx, y: 38 * sy };
  const p2 = { x: 82 * sx, y: 8 * sy };
  const p3 = { x: 124 * sx, y: 4 * sy };
  return { sx, sy, p0, p1, p2, p3 };
}

function featherWidthAt(t, side) {
  const body = Math.sin(Math.PI * clamp(t, 0, 1)) ** 0.78;
  const shoulder = 0.74 + (0.26 * Math.sin(Math.PI * clamp(t * 1.12, 0, 1)));
  const asymmetry = side < 0 ? 1.05 : 0.88;
  return body * shoulder * asymmetry;
}

function resolveFeatherContraction(time, reveal) {
  if (reveal < 1) return 0.24 * (1 - reveal);
  const cycle = fract((time - INTRO_DURATION_MS) / FEATHER_CYCLE_MS);
  const ambient = 0.06 + (Math.sin(time * 0.0017) + 1) * 0.025;
  if (cycle < 0.14) return ambient;
  if (cycle < 0.38) return lerp(ambient, 0.91, easeInOutCubic((cycle - 0.14) / 0.24));
  if (cycle < 0.50) return 0.91 + Math.sin((cycle - 0.38) * Math.PI * 8.3) * 0.018;
  if (cycle < 0.76) return lerp(0.91, ambient, easeOutQuint((cycle - 0.50) / 0.26));
  return ambient;
}

function resolveFeatherReleasePulse(time, reveal) {
  if (reveal < 1) return 0;
  const cycle = fract((time - INTRO_DURATION_MS) / FEATHER_CYCLE_MS);
  if (cycle < 0.50 || cycle > 0.82) return 0;
  const local = (cycle - 0.50) / 0.32;
  return Math.sin(clamp(local, 0, 1) * Math.PI);
}

function drawVaneRibbon(ctx, geometry, side, t0, t1, reveal, wave, pointerPressure, quality, index, contraction, specialDetach = 0) {
  const { sx, sy, p0, p1, p2, p3 } = geometry;
  const localReveal = smoothstep(t0 - 0.14, t0 + 0.13, reveal);
  if (localReveal <= 0.001) return;

  const a = cubicBezierPoint(p0, p1, p2, p3, t0);
  const b = cubicBezierPoint(p0, p1, p2, p3, t1);
  const tangentA = cubicBezierTangent(p0, p1, p2, p3, t0);
  const tangentB = cubicBezierTangent(p0, p1, p2, p3, t1);
  const normalA = { x: -tangentA.y * side, y: tangentA.x * side };
  const normalB = { x: -tangentB.y * side, y: tangentB.x * side };
  const baseWidth = (quality === "full" ? 29.6 : 26.0) * Math.min(sx, sy);
  const propagation = clamp(contraction + Math.sin((wave * 1.55) - index * 0.52 + side * 0.4) * 0.10 * contraction, 0, 0.92);
  const foldA = 1 - propagation * (0.25 + t0 * 0.18);
  const foldB = 1 - propagation * (0.27 + t1 * 0.19);
  const widthA = baseWidth * featherWidthAt(t0, side) * foldA;
  const widthB = baseWidth * featherWidthAt(t1, side) * foldB;
  const waveAmount = (Math.sin(wave + index * 0.58 + side * 0.7) * 0.9 + pointerPressure * (1.6 + t0 * 1.8)) * Math.min(sx, sy);
  const tipA = {
    x: a.x + normalA.x * (widthA + waveAmount) - tangentA.x * (2 + t0 * 4) * sx,
    y: a.y + normalA.y * (widthA + waveAmount) - tangentA.y * (2 + t0 * 4) * sy,
  };
  const tipB = {
    x: b.x + normalB.x * (widthB + waveAmount * 0.72) - tangentB.x * (3 + t1 * 4) * sx,
    y: b.y + normalB.y * (widthB + waveAmount * 0.72) - tangentB.y * (3 + t1 * 4) * sy,
  };

  const gradient = ctx.createLinearGradient(a.x, a.y, tipA.x, tipA.y);
  if (side < 0) {
    gradient.addColorStop(0, `rgba(183,137,56,${0.36 * localReveal})`);
    gradient.addColorStop(0.42, `rgba(224,177,80,${0.72 * localReveal})`);
    gradient.addColorStop(0.78, `rgba(129,180,188,${0.60 * localReveal})`);
    gradient.addColorStop(1, `rgba(47,103,126,${0.18 * localReveal})`);
  } else {
    gradient.addColorStop(0, `rgba(71,118,136,${0.40 * localReveal})`);
    gradient.addColorStop(0.4, `rgba(79,171,201,${0.72 * localReveal})`);
    gradient.addColorStop(0.76, `rgba(216,171,77,${0.52 * localReveal})`);
    gradient.addColorStop(1, `rgba(223,188,104,${0.15 * localReveal})`);
  }

  ctx.save();
  ctx.globalAlpha = localReveal * (1 - specialDetach * 0.96);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(
    lerp(a.x, tipA.x, 0.62) + normalA.x * 1.2 * sx,
    lerp(a.y, tipA.y, 0.62) + normalA.y * 1.2 * sy,
    tipA.x,
    tipA.y,
  );
  ctx.quadraticCurveTo(
    lerp(tipA.x, tipB.x, 0.52) + tangentA.x * 1.8 * sx,
    lerp(tipA.y, tipB.y, 0.52) + tangentA.y * 1.8 * sy,
    tipB.x,
    tipB.y,
  );
  ctx.quadraticCurveTo(
    lerp(tipB.x, b.x, 0.62),
    lerp(tipB.y, b.y, 0.62),
    b.x,
    b.y,
  );
  ctx.quadraticCurveTo(
    lerp(b.x, a.x, 0.46) + tangentA.x * 1.4 * sx,
    lerp(b.y, a.y, 0.46) + tangentA.y * 1.4 * sy,
    a.x,
    a.y,
  );
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = side < 0
    ? `rgba(242,204,119,${0.26 * localReveal})`
    : `rgba(139,221,239,${0.24 * localReveal})`;
  ctx.lineWidth = 0.55 * Math.min(sx, sy);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(
    lerp(a.x, tipA.x, 0.6),
    lerp(a.y, tipA.y, 0.6),
    tipA.x,
    tipA.y,
  );
  ctx.stroke();
  ctx.restore();
}

function drawMicroFibers(ctx, geometry, state) {
  if (state.quality !== "full") return;
  const { sx, sy, p0, p1, p2, p3 } = geometry;
  const fiberCount = 26;

  ctx.save();
  ctx.lineCap = "round";
  for (let index = 0; index < fiberCount; index += 1) {
    const t = 0.10 + (index / (fiberCount - 1)) * 0.82;
    const stagger = smoothstep(t - 0.18, t + 0.08, state.reveal);
    if (stagger <= 0.005) continue;

    const side = index % 2 === 0 ? -1 : 1;
    const anchor = cubicBezierPoint(p0, p1, p2, p3, t);
    const tangent = cubicBezierTangent(p0, p1, p2, p3, t);
    const normal = { x: -tangent.y * side, y: tangent.x * side };
    const width = (20.5 * featherWidthAt(t, side)) * Math.min(sx, sy);
    const localWave = Math.sin(state.time * 0.002 + index * 0.73) * (0.45 + state.hover * 0.35);
    const pressure = state.pointerPressure * (0.8 + t * 1.4);
    const propagation = clamp(state.featherContraction + Math.sin(state.time * 0.0031 - index * 0.48) * 0.11 * state.featherContraction, 0, 0.94);
    const length = width * lerp(0.72, 1, fract(index * 0.618)) * (1 - propagation * (0.28 + t * 0.22));
    const tip = {
      x: anchor.x + normal.x * (length + localWave + pressure) - tangent.x * (2.4 + t * 2.2) * sx,
      y: anchor.y + normal.y * (length + localWave + pressure) - tangent.y * (2.4 + t * 2.2) * sy,
    };

    const fiberAlpha = state.specialFiberFade ?? 1;
    ctx.strokeStyle = side < 0
      ? `rgba(245,212,139,${(0.13 + stagger * 0.19) * fiberAlpha})`
      : `rgba(157,224,239,${(0.12 + stagger * 0.20) * fiberAlpha})`;
    ctx.lineWidth = 0.38 * Math.min(sx, sy);
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y);
    ctx.quadraticCurveTo(
      lerp(anchor.x, tip.x, 0.6) + normal.x * 0.55,
      lerp(anchor.y, tip.y, 0.6) + normal.y * 0.55,
      tip.x,
      tip.y,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawFeatherSparks(ctx, geometry, sparks, state) {
  if (state.quality === "static") return;
  const { p0, p1, p2, p3 } = geometry;
  const seconds = state.time * 0.001;
  const count = state.quality === "full" ? sparks.length : Math.min(5, sparks.length);

  for (let index = 0; index < count; index += 1) {
    const spark = sparks[index];
    const life = fract((seconds * 0.075) + spark.phase);
    if (life < 0.58) continue;
    const activeLife = (life - 0.58) / 0.42;
    const fade = Math.sin(activeLife * Math.PI);
    const anchor = cubicBezierPoint(p0, p1, p2, p3, spark.t);
    const tangent = cubicBezierTangent(p0, p1, p2, p3, spark.t);
    const normal = { x: -tangent.y * spark.side, y: tangent.x * spark.side };
    const x = anchor.x + normal.x * spark.spread * activeLife + tangent.x * activeLife * 4;
    const y = anchor.y + normal.y * spark.spread * activeLife - spark.rise * activeLife;
    const releaseBoost = 0.55 + state.releasePulse * 1.15;
    const alpha = fade * (0.34 + state.hover * 0.16) * releaseBoost;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, spark.radius * 4.5);
    glow.addColorStop(0, `rgba(255,235,172,${alpha * 0.95})`);
    glow.addColorStop(0.25, `rgba(121,213,237,${alpha * 0.62})`);
    glow.addColorStop(1, "rgba(121,213,237,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, spark.radius * 4.5, 0, TAU);
    ctx.fill();
  }
}


function drawLooseFragment(ctx, pose, fragment, scaleUnit, alpha = 1) {
  if (alpha <= 0.002) return;
  const length = (12.5 + fragment.size * 6.2) * scaleUnit;
  const half = length * 0.5;
  const thickness = (1.6 + fragment.size * 1.2) * scaleUnit;

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.angle);
  ctx.scale(pose.scale, pose.scale);
  ctx.globalAlpha = alpha;

  const gradient = ctx.createLinearGradient(-half, 0, half, 0);
  if (fragment.warm) {
    gradient.addColorStop(0, "rgba(111,150,147,0.22)");
    gradient.addColorStop(0.28, "rgba(213,170,91,0.88)");
    gradient.addColorStop(0.72, "rgba(231,198,126,0.78)");
    gradient.addColorStop(1, "rgba(76,130,142,0.18)");
  } else {
    gradient.addColorStop(0, "rgba(43,96,110,0.20)");
    gradient.addColorStop(0.26, "rgba(86,174,190,0.78)");
    gradient.addColorStop(0.72, "rgba(167,213,201,0.86)");
    gradient.addColorStop(1, "rgba(185,143,73,0.18)");
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-half, 0);
  ctx.quadraticCurveTo(-half * 0.2, -thickness * 1.4, half, 0);
  ctx.quadraticCurveTo(-half * 0.08, thickness * 1.15, -half, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = fragment.warm ? "rgba(251,226,166,0.58)" : "rgba(206,238,232,0.58)";
  ctx.lineWidth = 0.45 * scaleUnit;
  ctx.beginPath();
  ctx.moveTo(-half * 0.9, 0);
  ctx.quadraticCurveTo(0, -thickness * 0.28, half * 0.86, 0);
  ctx.stroke();
  ctx.restore();
}

function resolveFragmentPose(fragment, geometry, specialEvent) {
  const { sx, sy, p0, p1, p2, p3 } = geometry;
  const { elapsed } = specialEvent;
  const anchor = cubicBezierPoint(p0, p1, p2, p3, fragment.t);
  const tangent = cubicBezierTangent(p0, p1, p2, p3, fragment.t);
  const normal = { x: -tangent.y * fragment.side, y: tangent.x * fragment.side };
  const startWidth = 16.5 * featherWidthAt(fragment.t, fragment.side) * Math.min(sx, sy);
  const start = {
    x: anchor.x + normal.x * startWidth * 0.92,
    y: anchor.y + normal.y * startWidth * 0.92,
    angle: Math.atan2(normal.y, normal.x) + fragment.spin * 0.08,
    scale: 0.9 + fragment.size * 0.12,
  };

  const landing = {
    x: (48 + fragment.id * 9.4 + fragment.drift * 0.35) * sx,
    y: (55.2 + (fragment.id % 2) * 1.15) * sy,
    angle: fragment.spin * 0.42 + (fragment.id % 2 ? -0.10 : 0.10),
    scale: 0.92,
  };

  const waveX = (57 + fragment.id * 8.8) * sx;
  const waveY = (51.5 + Math.sin(fragment.id * 0.92) * 4.2) * sy;
  const waveNextY = 51.5 + Math.sin((fragment.id + 0.3) * 0.92) * 4.2;
  const wave = {
    x: waveX,
    y: waveY,
    angle: Math.atan2((waveNextY - (51.5 + Math.sin(fragment.id * 0.92) * 4.2)) * sy, 4 * sx),
    scale: 0.82,
  };

  const iSlots = [
    [96, 31.5, 0], [108, 31.5, 0], [120, 31.5, 0],
    [108, 38.5, Math.PI / 2], [108, 45.5, Math.PI / 2], [108, 52.2, Math.PI / 2],
    [96, 57, 0], [108, 57, 0], [120, 57, 0],
  ];
  const [ix, iy, ia] = iSlots[fragment.id] || iSlots[iSlots.length - 1];
  const iPose = { x: ix * sx, y: iy * sy, angle: ia, scale: 0.76 };

  const detachedStart = 360 + fragment.delay * 0.68;
  const detachedEnd = 2_620 + fragment.delay * 0.18;
  const fallProgress = smoothstep(detachedStart, detachedEnd, elapsed);
  if (fallProgress < 1) {
    const t = easeInOutCubic(fallProgress);
    const driftWave = Math.sin(t * Math.PI * 3 + fragment.id) * (2.6 + Math.abs(fragment.drift) * 0.12) * sx;
    const x = lerp(start.x, landing.x, t) + driftWave;
    const baseY = lerp(start.y, landing.y, t);
    const lift = Math.sin(t * Math.PI) * (4.5 + fragment.id * 0.22) * sy;
    return {
      x,
      y: baseY - lift,
      angle: lerp(start.angle, landing.angle + fragment.spin * 1.4, t),
      scale: lerp(start.scale, landing.scale, t),
      alpha: smoothstep(detachedStart - 120, detachedStart + 220, elapsed),
    };
  }

  if (elapsed < 3_250) {
    const pose = interpolatePose(landing, wave, smoothstep(2_650, 3_250, elapsed));
    return { ...pose, alpha: 1 };
  }

  if (elapsed < 4_300) {
    const pose = interpolatePose(wave, iPose, smoothstep(3_250, 4_300, elapsed));
    return { ...pose, alpha: 1 };
  }

  if (elapsed < 9_400) {
    const pulse = 1 + Math.sin((elapsed - 4_300) * 0.0045 + fragment.id * 0.55) * 0.018;
    const alpha = 1 - smoothstep(4_300, 4_850, elapsed);
    return { ...iPose, scale: iPose.scale * pulse, alpha };
  }

  if (elapsed < 9_660) {
    const pose = interpolatePose(iPose, wave, smoothstep(9_400, 9_660, elapsed));
    return { ...pose, alpha: smoothstep(9_400, 9_560, elapsed) };
  }

  if (elapsed < 10_200) {
    const returnT = smoothstep(9_560 + fragment.delay * 0.03, 10_200, elapsed);
    const pose = interpolatePose(wave, start, returnT);
    const arc = Math.sin(returnT * Math.PI) * (7 + fragment.id * 0.26) * sy;
    return {
      ...pose,
      y: pose.y - arc,
      angle: pose.angle - Math.sin(returnT * Math.PI) * fragment.spin * 0.52,
      alpha: 1 - smoothstep(10_080, 10_200, elapsed) * 0.08,
    };
  }

  return { ...start, alpha: 0 };
}

function drawTransformationFragments(ctx, geometry, fragments, state) {
  const { specialEvent, quality } = state;
  if (!specialEvent.active || quality === "static") return;
  const scaleUnit = Math.min(geometry.sx, geometry.sy);
  const count = quality === "full" ? fragments.length : Math.min(7, fragments.length);

  for (let index = 0; index < count; index += 1) {
    const fragment = fragments[index];
    const pose = resolveFragmentPose(fragment, geometry, specialEvent);
    drawLooseFragment(ctx, pose, fragment, scaleUnit, pose.alpha);
  }

  if (specialEvent.energyPulse > 0.002) {
    const y = 45.5 * geometry.sy;
    const startX = 119 * geometry.sx;
    const endX = 157 * geometry.sx;
    const pulse = specialEvent.energyPulse;
    const beam = ctx.createLinearGradient(startX, y, endX, y);
    beam.addColorStop(0, `rgba(211,175,115,${0.12 * pulse})`);
    beam.addColorStop(0.46, `rgba(246,241,231,${0.76 * pulse})`);
    beam.addColorStop(1, `rgba(169,206,194,${0.04 * pulse})`);
    ctx.save();
    ctx.strokeStyle = beam;
    ctx.lineWidth = (0.8 + pulse * 0.7) * scaleUnit;
    ctx.shadowColor = `rgba(211,175,115,${0.42 * pulse})`;
    ctx.shadowBlur = 5 * scaleUnit;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.quadraticCurveTo(137 * geometry.sx, (42.8 - pulse * 1.1) * geometry.sy, endX, y);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFeather(ctx, width, height, state, sparks, fragments) {
  const geometry = createFeatherGeometry(width, height);
  const { p0, p1, p2, p3, sx, sy } = geometry;
  const featherReveal = easeOutQuint(clamp(state.reveal / 0.72, 0, 1));
  const ambientContraction = resolveFeatherContraction(state.time, state.reveal);
  const featherContraction = Math.max(ambientContraction, state.specialEvent?.contractionBoost || 0);
  const releasePulse = Math.max(resolveFeatherReleasePulse(state.time, state.reveal), state.specialEvent?.energyPulse || 0);
  const breath = 1 + Math.sin(state.time * 0.00074) * 0.009;
  const sway = Math.sin(state.time * 0.00093) * (0.42 + state.hover * 0.34);
  const rotation = (sway + state.pointerPressure * 0.52) * Math.PI / 180;

  ctx.save();
  // V44: keep the detailed feather, but reduce its optical footprint so it
  // never competes with the two navigation capsules. Scale from the quill
  // base so the signature remains visually anchored to the navbar baseline.
  ctx.translate(p0.x, p0.y);
  ctx.scale(FEATHER_RENDER_SCALE, FEATHER_RENDER_SCALE);
  ctx.rotate(rotation);
  ctx.scale(breath, breath);
  ctx.translate(-p0.x, -p0.y);

  const baseGlow = ctx.createRadialGradient(p0.x + 4 * sx, p0.y - 1 * sy, 0, p0.x + 4 * sx, p0.y - 1 * sy, 19 * Math.min(sx, sy));
  baseGlow.addColorStop(0, `rgba(222,177,82,${0.12 + state.hover * 0.05})`);
  baseGlow.addColorStop(0.4, `rgba(76,177,206,${0.08 + state.hover * 0.04})`);
  baseGlow.addColorStop(1, "rgba(76,177,206,0)");
  ctx.fillStyle = baseGlow;
  ctx.beginPath();
  ctx.arc(p0.x + 4 * sx, p0.y - 1 * sy, 19 * Math.min(sx, sy), 0, TAU);
  ctx.fill();

  const segmentCount = state.quality === "full" ? 9 : 7;
  const wave = state.time * 0.00165;
  for (let index = 0; index < segmentCount; index += 1) {
    const t0 = 0.07 + (index / segmentCount) * 0.84;
    const t1 = Math.min(0.97, t0 + (0.84 / segmentCount) * 0.96);
    const leftDetach = resolveRibbonDetach(state.specialEvent, index, -1);
    const rightDetach = resolveRibbonDetach(state.specialEvent, index, 1);
    drawVaneRibbon(ctx, geometry, -1, t0, t1, featherReveal, wave, state.pointerPressure, state.quality, index, featherContraction, leftDetach);
    drawVaneRibbon(ctx, geometry, 1, t0 + 0.012, Math.min(0.98, t1 + 0.012), featherReveal, wave * 1.03, state.pointerPressure, state.quality, index + 11, featherContraction, rightDetach);
  }

  drawMicroFibers(ctx, geometry, {
    ...state,
    reveal: featherReveal,
    featherContraction,
    specialFiberFade: 1 - (state.specialEvent?.detachAmount || 0) * 0.58,
  });

  const stemGradient = ctx.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
  stemGradient.addColorStop(0, "rgba(127,88,33,0.97)");
  stemGradient.addColorStop(0.32, "rgba(230,190,101,0.98)");
  stemGradient.addColorStop(0.63, "rgba(120,179,190,0.96)");
  stemGradient.addColorStop(1, "rgba(69,123,145,0.92)");
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stemGradient;
  ctx.lineWidth = 2.15 * Math.min(sx, sy);
  ctx.setLineDash([280 * featherReveal, 300]);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = `rgba(255,230,160,${0.22 + state.hover * 0.12})`;
  ctx.lineWidth = 0.55 * Math.min(sx, sy);
  ctx.beginPath();
  ctx.moveTo(p0.x + 0.45 * sx, p0.y - 0.4 * sy);
  ctx.bezierCurveTo(p1.x + 0.35 * sx, p1.y - 0.45 * sy, p2.x + 0.25 * sx, p2.y - 0.35 * sy, p3.x, p3.y);
  ctx.stroke();
  ctx.restore();

  const glintTravel = fract(state.time * 0.00008 + 0.18);
  if (state.quality === "full" && featherReveal > 0.98 && glintTravel > 0.58) {
    const t = (glintTravel - 0.58) / 0.42;
    const point = cubicBezierPoint(p0, p1, p2, p3, t);
    const radius = (3.3 + state.hover * 1.6) * Math.min(sx, sy);
    const glint = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    glint.addColorStop(0, `rgba(255,249,224,${0.64 + state.hover * 0.12})`);
    glint.addColorStop(0.24, `rgba(169,226,240,${0.28 + state.hover * 0.08})`);
    glint.addColorStop(1, "rgba(169,226,240,0)");
    ctx.fillStyle = glint;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, TAU);
    ctx.fill();
  }

  drawFeatherSparks(ctx, geometry, sparks, { ...state, releasePulse });
  drawTransformationFragments(ctx, geometry, fragments, state);
  ctx.restore();
}

function drawSignature(ctx, width, height, particles, sparks, fragments, state) {
  ctx.clearRect(0, 0, width, height);

  const specialEvent = resolveSpecialEvent(state.time, state.reveal, state.quality);
  const frameState = { ...state, specialEvent };
  drawAmbientDust(ctx, width, height, particles, {
    ...frameState,
    hover: frameState.hover + (specialEvent.active ? specialEvent.detachAmount * 0.16 : 0),
  });
  drawFeather(ctx, width, height, frameState, sparks, fragments);
  return specialEvent;
}

function resolveQuality(performanceMode, canMove) {
  if (!canMove || ["lite", "ultra-lite"].includes(performanceMode)) return "static";
  if (performanceMode === "balanced") return "balanced";
  return "full";
}

export default function SignatureCanvas({ name = "IDRIS", fallbackSrc }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const particles = useMemo(() => createParticleField(), []);
  const sparks = useMemo(() => createSparkField(), []);
  const fragments = useMemo(() => createTransformationFragments(), []);
  const { animationsEnabled, animationsPaused, performanceMode } = useAnimationPreferences();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || typeof window === "undefined") return undefined;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return undefined;

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    const motionAllowed = () => animationsEnabled && !animationsPaused && !reducedMotionMedia.matches;
    const currentQuality = () => resolveQuality(performanceMode, motionAllowed());

    const interaction = {
      hover: 0,
      hoverTarget: 0,
      pointerX: 0.38,
      pointerY: 0.5,
      pointerPressure: 0,
      pointerPressureTarget: 0,
      start: performance.now(),
      lastFrame: 0,
      frame: 0,
      width: 252,
      height: 62,
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const quality = currentQuality();
      const qualityDprCap = quality === "full" ? MAX_DPR : quality === "balanced" ? 1.5 : 1.25;
      const dpr = Math.min(window.devicePixelRatio || 1, qualityDprCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      interaction.width = width;
      interaction.height = height;
    };

    const renderFrame = (time, reveal = 1) => {
      const quality = currentQuality();
      interaction.hover += (interaction.hoverTarget - interaction.hover) * 0.105;
      interaction.pointerPressure += (interaction.pointerPressureTarget - interaction.pointerPressure) * 0.09;
      const specialEvent = drawSignature(ctx, interaction.width, interaction.height, particles, sparks, fragments, {
        reveal,
        hover: interaction.hover,
        pointerX: interaction.pointerX,
        pointerY: interaction.pointerY,
        pointerPressure: interaction.pointerPressure,
        time,
        quality,
      });
      host.dataset.canvasReady = "true";
      host.dataset.signatureQuality = quality;
      host.dataset.signatureEvent = specialEvent.mode;
    };

    const renderStatic = () => {
      resize();
      renderFrame(INTRO_DURATION_MS + FEATHER_CYCLE_MS * 0.38, 1);
    };

    const animate = (now) => {
      const quality = currentQuality();
      if (quality === "static" || document.visibilityState === "hidden") {
        renderStatic();
        interaction.frame = 0;
        return;
      }

      const elapsed = now - interaction.start;
      const introReveal = clamp(elapsed / INTRO_DURATION_MS, 0, 1);
      const specialEvent = resolveSpecialEvent(elapsed, introReveal, quality);
      const interactionActive = interaction.hoverTarget > 0.001
        || Math.abs(interaction.pointerPressureTarget) > 0.001
        || Math.abs(interaction.hover - interaction.hoverTarget) > 0.01
        || Math.abs(interaction.pointerPressure - interaction.pointerPressureTarget) > 0.01;
      const highMotion = elapsed < INTRO_DURATION_MS
        || interactionActive
        || ["prepare", "shed", "assemble", "return"].includes(specialEvent.mode);
      const targetFrameRate = highMotion
        ? (quality === "full" ? ACTIVE_FRAME_RATE_FULL : ACTIVE_FRAME_RATE_BALANCED)
        : (quality === "full" ? REST_FRAME_RATE_FULL : REST_FRAME_RATE_BALANCED);
      const frameInterval = 1000 / targetFrameRate;
      if (now - interaction.lastFrame >= frameInterval) {
        interaction.lastFrame = now;
        renderFrame(elapsed, introReveal);
      }

      interaction.frame = window.requestAnimationFrame(animate);
    };

    const onPointerEnter = () => {
      if (currentQuality() === "static") return;
      interaction.hoverTarget = 1;
    };

    const onPointerMove = (event) => {
      if (currentQuality() === "static") return;
      const rect = host.getBoundingClientRect();
      interaction.pointerX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      interaction.pointerY = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      const featherCenterX = 0.23;
      const featherCenterY = 0.50;
      const dx = interaction.pointerX - featherCenterX;
      const dy = interaction.pointerY - featherCenterY;
      const distance = Math.hypot(dx * 1.35, dy);
      const proximity = 1 - clamp(distance / 0.64, 0, 1);
      interaction.pointerPressureTarget = clamp((interaction.pointerX - featherCenterX) * proximity * 1.6, -1, 1);
    };

    const onPointerLeave = () => {
      interaction.hoverTarget = 0;
      interaction.pointerPressureTarget = 0;
    };

    const restartAnimationIfNeeded = () => {
      const quality = currentQuality();
      if (quality === "static") {
        if (interaction.frame) window.cancelAnimationFrame(interaction.frame);
        interaction.frame = 0;
        interaction.hover = 0;
        interaction.hoverTarget = 0;
        interaction.pointerPressure = 0;
        interaction.pointerPressureTarget = 0;
        renderStatic();
        return;
      }

      if (document.visibilityState === "visible" && !interaction.frame) {
        interaction.start = performance.now() - INTRO_DURATION_MS;
        interaction.frame = window.requestAnimationFrame(animate);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (interaction.frame) window.cancelAnimationFrame(interaction.frame);
        interaction.frame = 0;
        return;
      }
      restartAnimationIfNeeded();
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
    resizeObserver?.observe(host);
    host.addEventListener("pointerenter", onPointerEnter, { passive: true });
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionMedia.addEventListener?.("change", restartAnimationIfNeeded);

    resize();
    if (currentQuality() === "static") renderStatic();
    else interaction.frame = window.requestAnimationFrame(animate);

    return () => {
      resizeObserver?.disconnect();
      host.removeEventListener("pointerenter", onPointerEnter);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionMedia.removeEventListener?.("change", restartAnimationIfNeeded);
      if (interaction.frame) window.cancelAnimationFrame(interaction.frame);
      delete host.dataset.canvasReady;
      delete host.dataset.signatureQuality;
      delete host.dataset.signatureEvent;
    };
  }, [animationsEnabled, animationsPaused, fragments, particles, performanceMode, sparks]);

  return (
    <span className="nav_signature" ref={hostRef} aria-hidden="true">
      {fallbackSrc ? <img src={fallbackSrc} alt="" className="nav_signature-fallback" decoding="async" /> : null}
      <canvas ref={canvasRef} className="nav_signature-canvas" />
      <SignatureWordmarkSvg name={name} />
    </span>
  );
}
