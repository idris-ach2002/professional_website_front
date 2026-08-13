const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_lava;
uniform float u_crater;
uniform float u_eruption;
uniform float u_heat;
uniform float u_water_glow;
uniform float u_fracture;
uniform float u_shock;
uniform float u_canyon_light;
uniform float u_quality;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);
  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * noise2(p);
    p = rotation * p * 2.03 + 7.17;
    amplitude *= 0.5;
  }
  return value;
}

float gaussian(float value, float variance) {
  return exp(-(value * value) / max(0.000001, variance));
}

float band(float value, float start, float end) {
  return smoothstep(start - 0.04, start + 0.02, value)
    * (1.0 - smoothstep(end - 0.02, end + 0.04, value));
}

float organicChannel(
  vec2 p,
  float center,
  float bend,
  float frequency,
  float phase,
  float variance
) {
  float irregular = (noise2(vec2(p.y * 3.3 + phase, phase * 2.7)) - 0.5) * bend * 0.46;
  float path = center
    + bend * sin((p.y + 0.84) * frequency + phase)
    + bend * 0.27 * sin((p.y + 0.29) * frequency * 2.37 - phase * 0.63)
    + irregular;
  return gaussian(p.x - path, variance);
}

float fractureField(vec2 p, float terrainNoise, float ridgeNoise) {
  float contourA = abs(fract((fbm(p * vec2(4.6, 5.7) + 2.7) + ridgeNoise * 0.31) * 5.1) - 0.5);
  float contourB = abs(fract((fbm(p * vec2(7.8, 8.9) - 4.1) + terrainNoise * 0.24) * 4.2) - 0.5);
  float crackA = 1.0 - smoothstep(0.018, 0.070, contourA);
  float crackB = 1.0 - smoothstep(0.014, 0.052, contourB);
  float sparse = smoothstep(0.48, 0.79, fbm(p * vec2(2.2, 2.8) + 14.2));
  return max(crackA * 0.82, crackB * 0.58) * (0.36 + sparse * 0.64);
}

void main() {
  float aspect = max(0.7, u_resolution.x / max(1.0, u_resolution.y));
  // Screen top is +Y and the seabed is -Y. This keeps the caldera upright.
  vec2 p = vec2((v_uv.x - 0.5) * 2.0 * aspect, (v_uv.y - 0.5) * 2.0);
  float t = u_time;

  float terrainNoise = fbm(p * vec2(2.55, 3.65) + vec2(2.7, 5.4));
  float ridgeNoise = fbm(p * vec2(5.3, 7.4) + vec2(-7.1, 11.6));
  float fineNoise = fbm(p * vec2(12.0, 15.0) + vec2(17.0, -4.0));

  // Broken basaltic stratovolcano: broad foot, asymmetrical shoulders and a real crater notch.
  float ax = abs(p.x);
  float normalizedX = ax / 1.31;
  float surface = 0.225 - 0.93 * pow(clamp(normalizedX, 0.0, 1.0), 1.28);
  surface += (terrainNoise - 0.5) * (0.062 + 0.014 * u_quality);
  surface += (ridgeNoise - 0.5) * 0.026;
  surface += sin(p.x * 4.7 + 0.7) * 0.012 * (1.0 - normalizedX);
  surface -= 0.092 * exp(-pow(p.x / 0.20, 2.0));

  float belowSurface = 1.0 - smoothstep(surface - 0.018, surface + 0.024, p.y);
  float sideMask = 1.0 - smoothstep(1.17, 1.34, ax);
  float baseMask = smoothstep(-0.995, -0.79, p.y);
  float rockMask = belowSurface * sideMask * baseMask;

  // Basalt material: wet facets, vesicles, cooled layers and erosion ribs.
  float angle = atan(p.x, p.y + 0.93);
  float rib = 0.5 + 0.5 * sin(angle * 20.0 + ridgeNoise * 4.2);
  float strata = 0.5 + 0.5 * sin((p.y + terrainNoise * 0.083) * 36.0 + p.x * 5.2);
  float pores = smoothstep(0.56, 0.90, fineNoise);
  float facet = smoothstep(0.34, 0.78, fbm(p * vec2(8.2, 6.9) + 3.2));
  vec3 basaltBlack = vec3(0.004, 0.008, 0.014);
  vec3 basaltBlue = vec3(0.020, 0.050, 0.070);
  vec3 basaltWet = vec3(0.050, 0.112, 0.135);
  vec3 rock = mix(basaltBlack, basaltBlue, terrainNoise * 0.82);
  rock = mix(rock, basaltWet, pores * 0.31 + facet * 0.10);
  rock *= 0.67 + rib * 0.11 + strata * 0.10 + facet * 0.08;

  float overhead = clamp(0.53 + p.y * 0.15 - p.x * 0.052, 0.29, 0.84);
  float innerWarm = exp(-dot(vec2(p.x / 0.55, (p.y - 0.05) / 0.56), vec2(p.x / 0.55, (p.y - 0.05) / 0.56)));
  rock *= overhead;
  rock += vec3(0.24, 0.044, 0.009) * innerWarm * u_lava * 0.14;

  // Living lava network. Cores are narrow; surrounding heat is broad and organic.
  float verticalGate = band(p.y, -0.78, 0.16);
  float branchDepth = smoothstep(0.10, -0.60, p.y);
  float mainCore = organicChannel(p, -0.018, 0.040, 4.4, 0.64, 0.00010);
  float mainGlow = organicChannel(p, -0.018, 0.040, 4.4, 0.64, 0.00145);

  float leftCenter = -0.06 - branchDepth * 0.31;
  float rightCenter = 0.07 + branchDepth * 0.29;
  float leftCore = organicChannel(p, leftCenter, 0.030, 5.1, 2.4, 0.000075) * band(p.y, -0.67, 0.055);
  float rightCore = organicChannel(p, rightCenter, 0.028, 4.8, -1.15, 0.000075) * band(p.y, -0.66, 0.045);
  float leftGlow = organicChannel(p, leftCenter, 0.030, 5.1, 2.4, 0.00092) * band(p.y, -0.69, 0.075);
  float rightGlow = organicChannel(p, rightCenter, 0.028, 4.8, -1.15, 0.00092) * band(p.y, -0.68, 0.065);

  float lowerLeftCenter = -0.23 - smoothstep(-0.16, -0.72, p.y) * 0.28;
  float lowerRightCenter = 0.22 + smoothstep(-0.15, -0.70, p.y) * 0.30;
  float lowerLeft = organicChannel(p, lowerLeftCenter, 0.017, 6.2, 3.7, 0.000055) * band(p.y, -0.79, -0.20);
  float lowerRight = organicChannel(p, lowerRightCenter, 0.017, 5.9, 1.3, 0.000055) * band(p.y, -0.78, -0.19);
  float lowerGlow = (
    organicChannel(p, lowerLeftCenter, 0.017, 6.2, 3.7, 0.00070)
    + organicChannel(p, lowerRightCenter, 0.017, 5.9, 1.3, 0.00070)
  ) * band(p.y, -0.80, -0.18);

  float coreNetwork = max(mainCore, max(leftCore, max(rightCore, max(lowerLeft, lowerRight))));
  float glowNetwork = max(mainGlow, max(leftGlow, max(rightGlow, lowerGlow)));

  // V21.15 thermal network: every altitude of the cone carries visible deep-crimson heat.
  // Pulses do not create the veins; they drive an already-hot network toward orange/yellow cores.
  float lowerThermalZone = band(p.y, -0.88, -0.24);
  float middleThermalZone = band(p.y, -0.54, 0.02);
  float upperThermalZone = band(p.y, -0.20, 0.19);
  float thermalCoverage = clamp(
    lowerThermalZone * 0.96 + middleThermalZone * 1.02 + upperThermalZone * 1.08,
    0.0,
    1.18
  );

  // Natural fracture contours span the lower, middle and upper cone.
  float fracture = fractureField(p, terrainNoise, ridgeNoise) * rockMask * band(p.y, -0.88, 0.19);
  float eruptionDelta = max(0.0, u_eruption - 0.56);
  float fractureActivity = clamp(0.30 + u_fracture * 0.72 + eruptionDelta * 0.16, 0.0, 1.28);
  float microCore = fracture * smoothstep(0.42, 0.86, fineNoise) * fractureActivity;
  coreNetwork = max(coreNetwork, microCore * 0.64);
  glowNetwork = max(
    glowNetwork,
    fracture * thermalCoverage * (0.23 + u_fracture * 0.38 + eruptionDelta * 0.16)
  );

  float flowPulse = 0.69 + 0.31 * sin(t * 3.0 - p.y * 22.0 + ridgeNoise * 5.0);
  float travellingHeat = 0.72 + 0.28 * sin(t * 1.64 - p.y * 13.0 + terrainNoise * 7.2);
  float magmaHeat = clamp(
    u_lava * (0.76 + flowPulse * 0.20 + travellingHeat * 0.15)
      * (0.94 + thermalCoverage * 0.10)
      + eruptionDelta * 0.20,
    0.0,
    2.05
  );

  // Permanent deep-red aura. This is deliberately visible before every burst.
  vec3 crimsonDeep = vec3(0.34, 0.0015, 0.0005);
  vec3 crimsonHot = vec3(0.78, 0.006, 0.001);
  float crimsonEnvelope = clamp(
    glowNetwork * (0.40 + u_fracture * 0.34 + thermalCoverage * 0.16),
    0.0,
    1.0
  );
  vec3 crimsonAura = mix(crimsonDeep, crimsonHot, clamp(magmaHeat * 0.46, 0.0, 1.0));
  rock += crimsonAura * crimsonEnvelope * (0.32 + u_lava * 0.34 + eruptionDelta * 0.26);

  vec3 lavaDeep = vec3(0.46, 0.002, 0.0006);
  vec3 lavaRed = vec3(1.0, 0.018, 0.001);
  vec3 lavaOrange = vec3(1.0, 0.25, 0.004);
  vec3 lavaYellow = vec3(1.0, 0.86, 0.28);
  vec3 lavaColor = mix(lavaDeep, lavaRed, smoothstep(0.12, 0.78, magmaHeat));
  // Keep normal operation predominantly crimson; orange/yellow is reserved for eruption peaks.
  lavaColor = mix(lavaColor, lavaOrange, smoothstep(0.96, 1.42, magmaHeat));
  lavaColor = mix(lavaColor, lavaYellow, smoothstep(1.42, 1.88, magmaHeat) * coreNetwork);
  rock += lavaColor * glowNetwork * (0.16 + u_lava * 0.48 + eruptionDelta * 0.18);
  rock = mix(rock, lavaColor, clamp(coreNetwork * (0.46 + u_lava * 0.60 + eruptionDelta * 0.10), 0.0, 1.0));

  // Dark cooling rims sell the crust forming over molten channels.
  float crust = clamp(glowNetwork - coreNetwork, 0.0, 1.0) * (0.32 + (1.0 - min(1.0, u_lava)) * 0.34);
  rock = mix(rock, vec3(0.065, 0.015, 0.008), crust * 0.42);

  // Irregular molten crater lake with a black fractured rim.
  vec2 craterP = vec2(p.x / 0.25, (p.y - 0.182) / 0.072);
  float craterNoise = (noise2(craterP * 4.1 + vec2(t * 0.022, -t * 0.016)) - 0.5) * 0.15;
  float craterR = length(craterP) + craterNoise;
  float outerRim = 1.0 - smoothstep(0.90, 1.20, craterR);
  float moltenLake = 1.0 - smoothstep(0.39, 0.83, craterR);
  float lakePulse = 0.76 + 0.24 * sin(t * 3.6 + fineNoise * 5.4);
  float craterEnergy = clamp(u_crater * lakePulse, 0.0, 1.90);
  vec3 lakeColor = mix(vec3(0.42, 0.006, 0.001), lavaOrange, smoothstep(0.26, 1.0, craterEnergy));
  lakeColor = mix(lakeColor, vec3(1.0, 0.92, 0.42), smoothstep(1.04, 1.62, craterEnergy));
  rock = mix(rock, vec3(0.0005, 0.0015, 0.003), outerRim * 0.80);
  rock = mix(rock, lakeColor, moltenLake * clamp(0.42 + craterEnergy * 0.62, 0.0, 1.0));

  // Hydrothermal refraction around the crater and a true underwater shock front.
  float plumeEnvelope = exp(-pow(p.x / 0.36, 2.0))
    * smoothstep(0.17, 0.27, p.y)
    * (1.0 - smoothstep(0.30, 0.99, p.y));
  float shimmer = sin(p.y * 48.0 + t * 7.0 + noise2(p * 12.0) * 6.1);
  float shimmer2 = sin(p.x * 31.0 - t * 4.2 + terrainNoise * 4.6);
  float heatAlpha = plumeEnvelope * u_heat * (0.018 + 0.020 * shimmer + 0.012 * shimmer2);

  vec2 pressureP = vec2(p.x / 0.82, (p.y - 0.18) / 0.92);
  float shockRadius = 0.12 + fract(t * 0.86) * 0.88;
  float shockRing = exp(-pow((length(pressureP) - shockRadius) / 0.020, 2.0));
  shockRing *= u_shock * (1.0 - shockRadius) * 0.28;
  float echoRadius = 0.10 + fract(t * 0.86 + 0.34) * 0.88;
  float echoRing = exp(-pow((length(pressureP) - echoRadius) / 0.026, 2.0));
  echoRing *= u_shock * (1.0 - echoRadius) * 0.10;

  float blastCore = exp(-dot(vec2(p.x / 0.40, (p.y - 0.18) / 0.28), vec2(p.x / 0.40, (p.y - 0.18) / 0.28)));
  blastCore *= (0.035 + u_eruption * 0.23 + u_water_glow * 0.09);

  // The blast lights the inward-facing canyon walls instead of leaving the volcano isolated.
  float leftWallWarm = exp(-dot(
    vec2((p.x + aspect * 0.72) / 0.48, (p.y + 0.06) / 0.72),
    vec2((p.x + aspect * 0.72) / 0.48, (p.y + 0.06) / 0.72)
  ));
  float rightWallWarm = exp(-dot(
    vec2((p.x - aspect * 0.72) / 0.48, (p.y + 0.06) / 0.72),
    vec2((p.x - aspect * 0.72) / 0.48, (p.y + 0.06) / 0.72)
  ));
  float canyonWarm = (leftWallWarm + rightWallWarm) * (0.018 + u_canyon_light * 0.105 + u_shock * 0.055);

  // Sparse hot micro-fractures briefly appear on inward-facing basalt walls during major pulses.
  float wallBand = smoothstep(aspect * 0.54, aspect * 0.69, abs(p.x))
    * (1.0 - smoothstep(aspect * 0.93, aspect * 1.06, abs(p.x)))
    * band(p.y, -0.72, 0.43);
  float wallNoise = fbm(p * vec2(2.1, 3.2) + vec2(8.7, -5.4));
  float wallCracks = fractureField(p * vec2(0.72, 0.94), wallNoise, ridgeNoise) * wallBand;
  float wallCrackHeat = wallCracks * (0.004 + u_canyon_light * 0.070 + u_shock * 0.082);

  vec3 thermalBlue = vec3(0.035, 0.36, 0.54) * max(0.0, heatAlpha);
  vec3 blastWarm = vec3(1.0, 0.16, 0.012) * blastCore;
  vec3 pressureColor = vec3(0.42, 0.90, 1.0) * (shockRing + echoRing);
  vec3 canyonLight = vec3(1.0, 0.13, 0.008) * canyonWarm;
  vec3 wallHeat = vec3(1.0, 0.11, 0.004) * wallCrackHeat;

  vec3 color = rock + thermalBlue + blastWarm + pressureColor + canyonLight + wallHeat;
  float alpha = clamp(
    rockMask + abs(heatAlpha) * 0.34 + blastCore * 0.40 + shockRing + echoRing + canyonWarm * 0.42 + wallCrackHeat * 0.72,
    0.0,
    1.0
  );

  // Merge the base into the existing seabed; never produce a rectangular canvas edge.
  alpha *= smoothstep(-0.995, -0.78, p.y);
  outColor = vec4(color * alpha, alpha);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "Unknown WebGL shader error";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "Unknown WebGL program error";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

function uniformLocations(gl, program) {
  return {
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    lava: gl.getUniformLocation(program, "u_lava"),
    crater: gl.getUniformLocation(program, "u_crater"),
    eruption: gl.getUniformLocation(program, "u_eruption"),
    heat: gl.getUniformLocation(program, "u_heat"),
    waterGlow: gl.getUniformLocation(program, "u_water_glow"),
    fracture: gl.getUniformLocation(program, "u_fracture"),
    shock: gl.getUniformLocation(program, "u_shock"),
    canyonLight: gl.getUniformLocation(program, "u_canyon_light"),
    quality: gl.getUniformLocation(program, "u_quality"),
  };
}

export function shouldUseVolcanoWebGLRenderer({
  runtimeQuality = "high",
  volcanoRenderer = "webgl2",
} = {}) {
  return runtimeQuality !== "constrained" && volcanoRenderer !== "fallback";
}

export function createVolcanoWebGLRenderer(canvas) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: true,
    powerPreference: "high-performance",
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  let program;
  try {
    program = createProgram(gl);
  } catch (error) {
    console.warn("Volcano WebGL renderer disabled:", error);
    return null;
  }

  const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const uniforms = uniformLocations(gl, program);

  const resize = (width, height, dpr = 1) => {
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, pixelWidth, pixelHeight);
  };

  const render = (timeSeconds, profile, quality = 1) => {
    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, timeSeconds);
    gl.uniform1f(uniforms.lava, profile?.lava ?? 0.34);
    gl.uniform1f(uniforms.crater, profile?.crater ?? 0.30);
    gl.uniform1f(uniforms.eruption, profile?.eruption ?? (profile?.stage === "eruption" ? 1 : 0));
    gl.uniform1f(uniforms.heat, profile?.heat ?? 0.14);
    gl.uniform1f(uniforms.waterGlow, profile?.waterGlow ?? 0.10);
    gl.uniform1f(uniforms.fracture, profile?.fracture ?? 0.18);
    gl.uniform1f(uniforms.shock, profile?.shock ?? 0);
    gl.uniform1f(uniforms.canyonLight, profile?.canyonLight ?? 0.18);
    gl.uniform1f(uniforms.quality, quality);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const destroy = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    // Explicitly release the driver context. Deleting the program alone can
    // leave the GPU process compiling/retaining the large fragment shader when
    // the deferred volcano exits its active zone.
    gl.getExtension?.("WEBGL_lose_context")?.loseContext?.();
  };

  return { gl, resize, render, destroy };
}

export const VOLCANO_VERTEX_SHADER = VERTEX_SHADER;
export const VOLCANO_FRAGMENT_SHADER = FRAGMENT_SHADER;
