import {
  BIOME_PROFILES,
  resolveRareOceanEvent,
} from "../ocean/oceanWorldEngine.js";

const PALETTES = Object.freeze({
  reef: ["#8fe8ff", "#0ea5c6", "#f0fbff"],
  silver: ["#dff8ff", "#7db7c9", "#ffffff"],
  deep: ["#345276", "#14233d", "#8edfff"],
  lantern: ["#16314a", "#071927", "#78f5ff"],
  vent: ["#3c5660", "#14272d", "#b2ecdc"],
});

let canvas = null;
let context = null;
let agents = [];
let previousAgents = [];
const viewport = { width: 1, height: 1, dpr: 1 };

function resize(nextViewport) {
  viewport.width = Math.max(1, Number(nextViewport?.width) || 1);
  viewport.height = Math.max(1, Number(nextViewport?.height) || 1);
  viewport.dpr = Math.max(0.1, Number(nextViewport?.dpr) || 1);
  if (!canvas || !context) return;
  const pixelWidth = Math.max(1, Math.round(viewport.width * viewport.dpr));
  const pixelHeight = Math.max(1, Math.round(viewport.height * viewport.dpr));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  context.imageSmoothingEnabled = true;
  context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
}

function drawFish(target, agent, x, y, size, opacity) {
  const [light, dark, accent] = PALETTES[agent.species] ?? PALETTES.reef;
  const direction = agent.heading >= 0 ? 1 : -1;
  target.save();
  target.translate(x, y);
  target.scale(direction, 1);
  target.globalAlpha = opacity;

  const gradient = target.createLinearGradient(-size * 0.7, 0, size * 0.75, 0);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.55, light);
  gradient.addColorStop(1, accent);
  target.fillStyle = gradient;
  target.beginPath();
  target.ellipse(0, 0, size * 0.72, size * 0.34, 0, 0, Math.PI * 2);
  target.fill();

  target.fillStyle = dark;
  target.beginPath();
  target.moveTo(-size * 0.62, 0);
  target.lineTo(-size * 1.04, -size * 0.42);
  target.lineTo(-size * 0.92, size * 0.42);
  target.closePath();
  target.fill();

  target.fillStyle = "rgba(255,255,255,.92)";
  target.beginPath();
  target.arc(size * 0.42, -size * 0.08, Math.max(1.2, size * 0.055), 0, Math.PI * 2);
  target.fill();
  target.fillStyle = "rgba(3,18,29,.9)";
  target.beginPath();
  target.arc(size * 0.44, -size * 0.08, Math.max(0.8, size * 0.026), 0, Math.PI * 2);
  target.fill();

  if (agent.species === "lantern") {
    target.globalCompositeOperation = "lighter";
    target.fillStyle = "rgba(104,245,255,.72)";
    target.beginPath();
    target.arc(size * 0.15, size * 0.17, size * 0.06, 0, Math.PI * 2);
    target.fill();
  }
  target.restore();
}

function drawRay(target, agent, x, y, size, opacity, manta = false) {
  const direction = agent.heading >= 0 ? 1 : -1;
  target.save();
  target.translate(x, y);
  target.scale(direction, 1);
  target.globalAlpha = opacity;
  target.fillStyle = manta ? "rgba(10,32,49,.88)" : "rgba(45,104,126,.72)";
  target.beginPath();
  target.moveTo(size * 0.72, 0);
  target.bezierCurveTo(size * 0.15, -size * 0.54, -size * 0.48, -size * 0.46, -size * 0.62, -size * 0.04);
  target.bezierCurveTo(-size * 0.45, size * 0.42, size * 0.14, size * 0.50, size * 0.72, 0);
  target.fill();
  target.strokeStyle = manta ? "rgba(117,210,227,.28)" : "rgba(163,235,246,.32)";
  target.lineWidth = Math.max(1, size * 0.018);
  target.beginPath();
  target.moveTo(-size * 0.54, 0);
  target.quadraticCurveTo(-size * 0.94, size * 0.10, -size * 1.20, size * 0.30);
  target.stroke();
  target.restore();
}

function drawJelly(target, x, y, size, opacity, phase) {
  target.save();
  target.translate(x, y);
  target.globalAlpha = opacity;
  const pulse = 0.92 + Math.sin(phase) * 0.08;
  target.scale(pulse, 1 / pulse);
  const gradient = target.createLinearGradient(0, -size * 0.5, 0, size * 0.35);
  gradient.addColorStop(0, "rgba(178,238,255,.58)");
  gradient.addColorStop(1, "rgba(71,151,194,.12)");
  target.fillStyle = gradient;
  target.beginPath();
  target.arc(0, 0, size * 0.44, Math.PI, 0);
  target.quadraticCurveTo(size * 0.28, size * 0.34, 0, size * 0.26);
  target.quadraticCurveTo(-size * 0.28, size * 0.34, -size * 0.44, 0);
  target.fill();
  target.strokeStyle = "rgba(130,225,249,.32)";
  target.lineWidth = Math.max(0.8, size * 0.018);
  for (let index = -2; index <= 2; index += 1) {
    target.beginPath();
    target.moveTo(index * size * 0.12, size * 0.22);
    target.bezierCurveTo(
      index * size * 0.10 + Math.sin(phase + index) * size * 0.06,
      size * 0.52,
      index * size * 0.15,
      size * 0.72,
      index * size * 0.09 + Math.sin(phase * 0.7 + index) * size * 0.08,
      size * 0.90,
    );
    target.stroke();
  }
  target.restore();
}

function drawSquid(target, agent, x, y, size, opacity) {
  const direction = agent.heading >= 0 ? 1 : -1;
  target.save();
  target.translate(x, y);
  target.scale(direction, 1);
  target.globalAlpha = opacity;
  target.fillStyle = "rgba(77,129,158,.72)";
  target.beginPath();
  target.ellipse(0, 0, size * 0.52, size * 0.27, 0, 0, Math.PI * 2);
  target.fill();
  target.fillStyle = "rgba(127,203,224,.58)";
  target.beginPath();
  target.moveTo(size * 0.12, -size * 0.18);
  target.lineTo(-size * 0.22, -size * 0.46);
  target.lineTo(-size * 0.14, -size * 0.10);
  target.fill();
  target.strokeStyle = "rgba(154,226,239,.45)";
  target.lineWidth = Math.max(0.8, size * 0.015);
  for (let index = -1; index <= 1; index += 1) {
    target.beginPath();
    target.moveTo(-size * 0.46, index * size * 0.08);
    target.quadraticCurveTo(-size * 0.72, index * size * 0.15, -size * 0.92, index * size * 0.22);
    target.stroke();
  }
  target.restore();
}

function drawAgent(target, agent, elapsed, biomeOpacity) {
  const layerScale = agent.depthLayer === "near" ? 1.28 : agent.depthLayer === "far" ? 0.68 : 0.92;
  const layerOpacity = agent.depthLayer === "near" ? 0.74 : agent.depthLayer === "far" ? 0.34 : 0.58;
  const minDimension = Math.min(viewport.width, viewport.height);
  const size = Math.max(12, minDimension * agent.size * layerScale);
  const x = agent.x * viewport.width;
  const y = agent.y * viewport.height;
  const opacity = agent.opacity * layerOpacity * biomeOpacity;

  if (agent.species === "ray") drawRay(target, agent, x, y, size, opacity);
  else if (agent.species === "jelly") drawJelly(target, x, y, size, opacity, agent.wanderPhase + elapsed * 1.3);
  else if (agent.species === "squid") drawSquid(target, agent, x, y, size, opacity);
  else drawFish(target, agent, x, y, size, opacity);
}

function drawRareEvent(target, event) {
  if (!event) return;
  const p = event.progress;
  const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  if (event.type === "manta") {
    const agent = { heading: 1 };
    drawRay(
      target,
      agent,
      (-0.18 + eased * 1.36) * viewport.width,
      viewport.height * (0.26 + Math.sin(p * Math.PI) * 0.05),
      Math.min(viewport.width, viewport.height) * 0.18,
      Math.sin(Math.PI * p) * 0.42,
      true,
    );
    return;
  }
  if (event.type === "school") {
    for (let index = 0; index < 6; index += 1) {
      const local = Math.max(0, Math.min(1, p * 1.25 - index * 0.035));
      const agent = { heading: 1, species: "silver" };
      drawFish(
        target,
        agent,
        (-0.12 + local * 1.24) * viewport.width,
        viewport.height * (0.36 + index * 0.025 + Math.sin(index * 1.7) * 0.02),
        Math.min(viewport.width, viewport.height) * 0.032,
        Math.sin(Math.PI * local) * 0.34,
      );
    }
    return;
  }
  for (let index = 0; index < 3; index += 1) {
    drawJelly(
      target,
      viewport.width * (0.28 + index * 0.19 + Math.sin(p * Math.PI * 2 + index) * 0.02),
      viewport.height * (0.74 - p * 0.22 + index * 0.025),
      Math.min(viewport.width, viewport.height) * (0.045 + index * 0.008),
      Math.sin(Math.PI * p) * 0.30,
      p * Math.PI * 2 + index,
    );
  }
}

function applyDynamicState(state, currentCount, previousCount) {
  let offset = 0;
  const currentLimit = Math.min(currentCount, agents.length);
  for (let index = 0; index < currentLimit; index += 1) {
    const agent = agents[index];
    agent.x = state[offset];
    agent.y = state[offset + 1];
    agent.heading = state[offset + 2];
    offset += 3;
  }
  const previousLimit = Math.min(previousCount, previousAgents.length);
  for (let index = 0; index < previousLimit; index += 1) {
    const agent = previousAgents[index];
    agent.x = state[offset];
    agent.y = state[offset + 1];
    agent.heading = state[offset + 2];
    offset += 3;
  }
}

function renderFrame(message) {
  if (!context || !(message.buffer instanceof ArrayBuffer)) return;
  const currentCount = Math.max(0, Number(message.currentCount) || 0);
  const previousCount = Math.max(0, Number(message.previousCount) || 0);
  const requiredFloats = Math.max(1, (currentCount + previousCount) * 3);
  const state = new Float32Array(message.buffer, 0, Math.min(requiredFloats, message.buffer.byteLength / Float32Array.BYTES_PER_ELEMENT));
  applyDynamicState(state, currentCount, previousCount);

  const elapsed = Number(message.elapsed) || 0;
  const biome = message.biome || "surface";
  const previousBiome = message.previousBiome || biome;
  const transitionProgress = Math.max(0, Math.min(1, Number(message.transitionProgress) || 0));
  const profile = BIOME_PROFILES[biome] ?? BIOME_PROFILES.surface;
  const previousProfile = BIOME_PROFILES[previousBiome] ?? BIOME_PROFILES.surface;

  context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  context.clearRect(0, 0, viewport.width, viewport.height);
  if (previousCount > 0 && transitionProgress < 1) {
    for (let index = 0; index < Math.min(previousCount, previousAgents.length); index += 1) {
      drawAgent(context, previousAgents[index], elapsed, previousProfile.visibility * (1 - transitionProgress));
    }
  }
  for (let index = 0; index < Math.min(currentCount, agents.length); index += 1) {
    drawAgent(context, agents[index], elapsed, profile.visibility * transitionProgress);
  }
  if (message.rareEvents) drawRareEvent(context, resolveRareOceanEvent(elapsed));
  self.postMessage({ type: "buffer-return", buffer: message.buffer }, [message.buffer]);
}

self.addEventListener("message", (event) => {
  const message = event.data ?? {};
  if (message.type === "init") {
    canvas = message.canvas;
    context = canvas?.getContext?.("2d", { alpha: true, desynchronized: true }) ?? null;
    agents = Array.isArray(message.agents) ? message.agents.map((agent) => ({ ...agent })) : [];
    previousAgents = Array.isArray(message.previousAgents) ? message.previousAgents.map((agent) => ({ ...agent })) : [];
    resize(message.viewport);
    self.postMessage({ type: "ready" });
    return;
  }
  if (message.type === "resize") {
    resize(message.viewport);
    return;
  }
  if (message.type === "sync-population") {
    agents = Array.isArray(message.agents) ? message.agents.map((agent) => ({ ...agent })) : [];
    previousAgents = Array.isArray(message.previousAgents) ? message.previousAgents.map((agent) => ({ ...agent })) : [];
    return;
  }
  if (message.type === "clear") {
    if (context) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }
  if (message.type === "frame") renderFrame(message);
});
