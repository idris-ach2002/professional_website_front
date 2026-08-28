import {
  createVolcanoParticles,
  stepVolcanoParticles,
} from "../animations/volcanoSimulationEngine.js";
import {
  createVolcanoRockfall,
  stepVolcanoRockfall,
} from "../animations/volcanoRockfallEngine.js";
import { paintVolcanoSmokeTexture } from "../rendering/volcanoSmokeTexture.js";
import {
  bakeSettledRock,
  createSettledDebrisSurface,
  drawParticleField,
  drawRockfall,
} from "../rendering/volcanoCanvasRenderer.js";
import {
  VOLCANO_FRAME_FLOATS,
  readVolcanoFrame,
} from "../performance/volcanoWorkerProtocol.js";

let particleCanvas = null;
let debrisCanvas = null;
let particleContext = null;
let debrisContext = null;
let settledDebrisSurface = null;
let textures = null;
let particles = [];
let rockfall = createVolcanoRockfall(0x7a31);
let rockfallLimit = 22;
let particleCounts = null;
let particleSeed = 0x7610;
let rockfallSeed = 0x7a31;
const settledRocks = [];
const viewport = { width: 1, height: 1, dpr: 1 };
const profile = { stage: "eruption", pulseType: "base" };
const rockfallView = { active: rockfall.active };

function texture(size, painter) {
  const surface = new OffscreenCanvas(size, size);
  const context = surface.getContext("2d", { alpha: true });
  painter(context, size);
  return surface;
}

function buildTextures() {
  const smoke = [0, 1, 2, 3, 4, 5].map((variant) => texture(192, (context, size) => {
    paintVolcanoSmokeTexture(context, size, variant, "cold");
  }));
  const hotSmoke = texture(168, (context, size) => paintVolcanoSmokeTexture(context, size, 0, "hot"));
  const ember = texture(40, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,218,1)");
    gradient.addColorStop(0.18, "rgba(255,185,46,.98)");
    gradient.addColorStop(0.52, "rgba(255,72,7,.62)");
    gradient.addColorStop(1, "rgba(255,36,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
  const bubble = texture(64, (context, size) => {
    const center = size / 2;
    const radius = size * 0.39;
    const gradient = context.createRadialGradient(center * 0.72, center * 0.68, 1, center, center, radius);
    gradient.addColorStop(0, "rgba(255,255,255,.34)");
    gradient.addColorStop(0.34, "rgba(126,226,255,.11)");
    gradient.addColorStop(0.70, "rgba(44,177,224,.08)");
    gradient.addColorStop(1, "rgba(190,244,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(199,245,255,.82)";
    context.lineWidth = Math.max(1, size * 0.035);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.78)";
    context.beginPath();
    context.ellipse(center * 0.72, center * 0.67, size * 0.075, size * 0.045, -0.5, 0, Math.PI * 2);
    context.fill();
  });
  const bio = texture(28, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(214,255,255,.96)");
    gradient.addColorStop(0.26, "rgba(64,222,255,.70)");
    gradient.addColorStop(1, "rgba(0,165,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
  textures = { smoke, hotSmoke, ember, bubble, bio };
}

function resizeCanvas(nextViewport) {
  viewport.width = nextViewport.width;
  viewport.height = nextViewport.height;
  viewport.dpr = nextViewport.dpr;
  const pixelWidth = Math.max(1, Math.round(viewport.width * viewport.dpr));
  const pixelHeight = Math.max(1, Math.round(viewport.height * viewport.dpr));
  const bitmapChanged = particleCanvas.width !== pixelWidth
    || particleCanvas.height !== pixelHeight
    || debrisCanvas.width !== pixelWidth
    || debrisCanvas.height !== pixelHeight;
  if (particleCanvas.width !== pixelWidth) particleCanvas.width = pixelWidth;
  if (particleCanvas.height !== pixelHeight) particleCanvas.height = pixelHeight;
  if (debrisCanvas.width !== pixelWidth) debrisCanvas.width = pixelWidth;
  if (debrisCanvas.height !== pixelHeight) debrisCanvas.height = pixelHeight;
  if (bitmapChanged || !settledDebrisSurface) {
    settledDebrisSurface = createSettledDebrisSurface(pixelWidth, pixelHeight);
  }
}

function resetSimulation(config = {}) {
  if (config.counts) particleCounts = config.counts;
  if (Number.isFinite(config.particleSeed)) particleSeed = config.particleSeed;
  if (Number.isFinite(config.rockfallSeed)) rockfallSeed = config.rockfallSeed;
  if (Number.isFinite(config.rockfallLimit)) rockfallLimit = config.rockfallLimit;
  particles = particleCounts
    ? createVolcanoParticles(viewport.width, viewport.height, particleCounts, particleSeed)
    : [];
  rockfall = createVolcanoRockfall(rockfallSeed);
  rockfallView.active = rockfall.active;
  settledRocks.length = 0;
  const pixelWidth = Math.max(1, Math.round(viewport.width * viewport.dpr));
  const pixelHeight = Math.max(1, Math.round(viewport.height * viewport.dpr));
  settledDebrisSurface = createSettledDebrisSurface(pixelWidth, pixelHeight);
}

function clear() {
  particleContext?.setTransform(1, 0, 0, 1, 0, 0);
  debrisContext?.setTransform(1, 0, 0, 1, 0, 0);
  particleContext?.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  debrisContext?.clearRect(0, 0, debrisCanvas.width, debrisCanvas.height);
}

self.onmessage = (event) => {
  const message = event.data ?? {};
  if (message.type === "init") {
    particleCanvas = message.particleCanvas;
    debrisCanvas = message.debrisCanvas;
    particleContext = particleCanvas.getContext("2d", { alpha: true, desynchronized: true });
    debrisContext = debrisCanvas.getContext("2d", { alpha: true, desynchronized: true });
    buildTextures();
    resizeCanvas(message.viewport);
    resetSimulation(message.simulation);
    self.postMessage({ type: "ready" });
    return;
  }
  if (message.type === "resize") {
    resizeCanvas(message.viewport);
    resetSimulation(message.simulation);
    return;
  }
  if (message.type === "reset-simulation") {
    resetSimulation(message.simulation);
    return;
  }
  if (message.type === "drop-particles") {
    particles = [];
    return;
  }
  if (message.type === "clear") {
    clear();
    return;
  }
  if (message.type !== "frame" || !(message.buffer instanceof ArrayBuffer)) return;

  const state = new Float64Array(message.buffer);
  if (state.length < VOLCANO_FRAME_FLOATS || !particleContext || !debrisContext || !textures) {
    self.postMessage({ type: "buffer-return", buffer: message.buffer }, [message.buffer]);
    return;
  }

  const { paintDelta, elapsed } = readVolcanoFrame(state, profile, viewport);
  stepVolcanoParticles(
    particles,
    paintDelta,
    viewport.width,
    viewport.height,
    elapsed,
    profile,
  );
  const newlySettled = stepVolcanoRockfall(
    rockfall,
    paintDelta,
    viewport.width,
    viewport.height,
    elapsed,
    profile,
    rockfallLimit,
    settledRocks,
  );
  for (let index = 0; index < newlySettled.length; index += 1) {
    bakeSettledRock(settledDebrisSurface, newlySettled[index], viewport);
  }
  drawRockfall(debrisContext, rockfallView, settledDebrisSurface, viewport);
  drawParticleField(particleContext, particles, textures, viewport, elapsed, profile);
  self.postMessage({ type: "buffer-return", buffer: message.buffer }, [message.buffer]);
};
