import {
  createRockShards,
  createSceneParticles,
  drawScene,
} from "../rendering/oceanTransitionRenderer.js";

let canvas = null;
let context = null;
let viewport = { width: 1, height: 1, dpr: 1 };
let sceneKey = "";
let particles = [];
let shards = [];

function applyViewport(next) {
  viewport = next ?? viewport;
  if (!canvas) return;
  const pixelWidth = Math.max(1, Math.round(viewport.width * viewport.dpr));
  const pixelHeight = Math.max(1, Math.round(viewport.height * viewport.dpr));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
}

function clear() {
  if (!context) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
}

self.onmessage = (event) => {
  const message = event.data ?? {};
  if (message.type === "init") {
    canvas = message.canvas;
    context = canvas?.getContext("2d", { alpha: true, desynchronized: true }) ?? null;
    applyViewport(message.viewport);
    self.postMessage({ type: "ready" });
    return;
  }
  if (message.type === "resize") {
    applyViewport(message.viewport);
    return;
  }
  if (message.type === "prepare") {
    sceneKey = message.key;
    particles = createSceneParticles(message.count, message.seed);
    shards = createRockShards(message.shardCount, message.seed);
    return;
  }
  if (message.type === "clear") {
    applyViewport(message.viewport);
    clear();
    return;
  }
  if (message.type !== "frame" || !context || !canvas) return;
  if (message.key !== sceneKey) return;
  applyViewport(message.viewport);
  context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  context.clearRect(0, 0, viewport.width, viewport.height);
  context.save();
  context.globalAlpha = message.alpha;
  drawScene(context, sceneKey, viewport, message.progress, particles, shards);
  context.restore();
};
