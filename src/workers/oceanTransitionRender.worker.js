import {
  createRockShards,
  createSceneParticles,
  drawPreparedScene,
  resolveScenePlan,
  sceneFade,
} from "../rendering/oceanTransitionRenderer.js";

let canvas = null;
let context = null;
let viewport = { width: 1, height: 1, dpr: 1 };
let sceneKey = "";
let scenePlan = null;
let sceneToken = null;
let particles = [];
let shards = [];
let transformDirty = true;
const frameRenderedMessage = {
  type: "frame-rendered",
  sceneToken: null,
  sequence: 0,
};

function acknowledgeFrame(message) {
  frameRenderedMessage.sceneToken = message.sceneToken;
  frameRenderedMessage.sequence = message.sequence;
  self.postMessage(frameRenderedMessage);
}

function applyViewport(next) {
  viewport = next ?? viewport;
  if (!canvas) return;
  const pixelWidth = Math.max(1, Math.round(viewport.width * viewport.dpr));
  const pixelHeight = Math.max(1, Math.round(viewport.height * viewport.dpr));
  let resized = false;
  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
    resized = true;
  }
  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
    resized = true;
  }
  if (resized) transformDirty = true;
}

function clear() {
  if (!context) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  transformDirty = true;
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
    scenePlan = resolveScenePlan(sceneKey);
    sceneToken = message.sceneToken;
    particles = createSceneParticles(message.count, message.seed);
    shards = createRockShards(message.shardCount, message.seed);
    return;
  }
  if (message.type === "clear") {
    clear();
    return;
  }
  if (message.type !== "frame") return;

  if (!context || !canvas || !scenePlan || message.sceneToken !== sceneToken) {
    acknowledgeFrame(message);
    return;
  }

  try {
    if (transformDirty) {
      context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      transformDirty = false;
    }
    context.clearRect(0, 0, viewport.width, viewport.height);
    context.globalAlpha = sceneFade(message.progress);
    try {
      drawPreparedScene(context, scenePlan, viewport, message.progress, particles, shards);
    } finally {
      context.globalAlpha = 1;
    }
  } finally {
    acknowledgeFrame(message);
  }
};
