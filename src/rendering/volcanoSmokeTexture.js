function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value >= edge1 ? 1 : 0;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function hash2(x, y, seed) {
  let value = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  value = (value ^ (value >>> 13)) * 1274126177;
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

function valueNoise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

function fbm(x, y, seed) {
  let value = 0;
  let amplitude = 0.56;
  let frequency = 1;
  let normalizer = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    value += valueNoise(x * frequency, y * frequency, seed + octave * 97) * amplitude;
    normalizer += amplitude;
    amplitude *= 0.50;
    frequency *= 2.03;
  }
  return value / normalizer;
}

function ellipseField(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const radius = Math.sqrt(dx * dx + dy * dy);
  return clamp01(1 - radius);
}

function resolveLobes(variant, kind) {
  const shift = (variant % 5) * 0.012;
  if (kind === "hot") {
    return [
      [0.50, 0.59, 0.31, 0.34, 1.00],
      [0.39 + shift, 0.49, 0.25, 0.27, 0.86],
      [0.62 - shift, 0.48, 0.24, 0.26, 0.82],
      [0.51, 0.36, 0.20, 0.22, 0.70],
      [0.44, 0.67, 0.18, 0.16, 0.60],
    ];
  }

  return [
    [0.50, 0.57, 0.38, 0.34, 1.00],
    [0.34 + shift, 0.49, 0.29, 0.27, 0.86],
    [0.66 - shift, 0.47, 0.30, 0.28, 0.88],
    [0.47, 0.32 + shift, 0.25, 0.23, 0.76],
    [0.61, 0.30, 0.23, 0.21, 0.70],
    [0.27, 0.61, 0.21, 0.19, 0.58],
    [0.75, 0.60, 0.20, 0.18, 0.56],
  ];
}

/**
 * Paints a dense, hard-edged billowing smoke sprite using only ImageData.
 * There is intentionally no Canvas blur, shadowBlur or CSS filter involved.
 */
export function paintVolcanoSmokeTexture(context, size, variant = 0, kind = "cold") {
  const image = context.createImageData(size, size);
  const data = image.data;
  const lobes = resolveLobes(variant, kind);
  const seed = 0x51f15e + variant * 7919 + (kind === "hot" ? 13007 : 0);

  for (let py = 0; py < size; py += 1) {
    const y = (py + 0.5) / size;
    for (let px = 0; px < size; px += 1) {
      const x = (px + 0.5) / size;
      let body = 0;
      for (const [cx, cy, rx, ry, weight] of lobes) {
        body = Math.max(body, ellipseField(x, y, cx, cy, rx, ry) * weight);
      }
      if (body <= 0) continue;

      const coarse = fbm(x * 4.2 + variant * 0.37, y * 4.0 - variant * 0.21, seed);
      const detail = fbm(x * 11.0 - variant * 0.19, y * 10.2 + variant * 0.31, seed + 311);
      const turbulentBody = body + (coarse - 0.52) * 0.38 + (detail - 0.5) * 0.17;
      const silhouette = smoothstep(0.065, 0.22, turbulentBody);
      if (silhouette <= 0.002) continue;

      const internal = clamp01(0.32 + body * 0.72 + (coarse - 0.5) * 0.48 + (detail - 0.5) * 0.26);
      const soot = smoothstep(0.30, 0.92, internal);
      const edgeLight = 1 - smoothstep(0.34, 0.76, body);

      let red;
      let green;
      let blue;
      let alpha;

      if (kind === "hot") {
        const heat = clamp01((y - 0.20) * 1.45) * clamp01(0.42 + body * 0.78);
        red = 47 + soot * 25 + heat * 62 + edgeLight * 11;
        green = 42 + soot * 20 + heat * 24 + edgeLight * 14;
        blue = 44 + soot * 16 + edgeLight * 19;
        alpha = silhouette * (0.64 + soot * 0.28);
      } else {
        red = 45 + edgeLight * 54 - soot * 15;
        green = 58 + edgeLight * 62 - soot * 16;
        blue = 67 + edgeLight * 72 - soot * 14;
        alpha = silhouette * (0.60 + soot * 0.32);
      }

      const index = (py * size + px) * 4;
      data[index] = Math.round(Math.min(255, red));
      data[index + 1] = Math.round(Math.min(255, green));
      data[index + 2] = Math.round(Math.min(255, blue));
      data[index + 3] = Math.round(Math.min(255, alpha * 255));
    }
  }

  context.clearRect(0, 0, size, size);
  context.putImageData(image, 0, 0);
}
