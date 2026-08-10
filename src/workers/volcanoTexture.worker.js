import { paintVolcanoSmokeTexture } from "../rendering/volcanoSmokeTexture.js";

function createTexture(size, painter) {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  painter(context, size);
  return canvas.transferToImageBitmap();
}

function smokeTexture(size, variant) {
  return createTexture(size, (context, dimension) => {
    paintVolcanoSmokeTexture(context, dimension, variant, "cold");
  });
}

function hotSmokeTexture(size) {
  return createTexture(size, (context, dimension) => {
    paintVolcanoSmokeTexture(context, dimension, 0, "hot");
  });
}

function emberTexture(size) {
  return createTexture(size, (context, dimension) => {
    const gradient = context.createRadialGradient(dimension / 2, dimension / 2, 0, dimension / 2, dimension / 2, dimension / 2);
    gradient.addColorStop(0, "rgba(255,255,218,1)");
    gradient.addColorStop(0.18, "rgba(255,185,46,.98)");
    gradient.addColorStop(0.52, "rgba(255,72,7,.62)");
    gradient.addColorStop(1, "rgba(255,36,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, dimension, dimension);
  });
}

function bubbleTexture(size) {
  return createTexture(size, (context, dimension) => {
    const center = dimension / 2;
    const radius = dimension * 0.39;
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
    context.lineWidth = Math.max(1, dimension * 0.035);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.78)";
    context.beginPath();
    context.ellipse(center * 0.72, center * 0.67, dimension * 0.075, dimension * 0.045, -0.5, 0, Math.PI * 2);
    context.fill();
  });
}

function bioTexture(size) {
  return createTexture(size, (context, dimension) => {
    const gradient = context.createRadialGradient(dimension / 2, dimension / 2, 0, dimension / 2, dimension / 2, dimension / 2);
    gradient.addColorStop(0, "rgba(214,255,255,.96)");
    gradient.addColorStop(0.26, "rgba(64,222,255,.70)");
    gradient.addColorStop(1, "rgba(0,165,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, dimension, dimension);
  });
}

self.onmessage = (event) => {
  if (event.data?.type !== "build-volcano-textures") return;
  if (typeof OffscreenCanvas === "undefined") {
    self.postMessage({ type: "volcano-textures-error" });
    return;
  }

  try {
    const smoke = [0, 1, 2, 3, 4, 5].map((variant) => smokeTexture(192, variant));
    const hotSmoke = hotSmokeTexture(168);
    const ember = emberTexture(40);
    const bubble = bubbleTexture(64);
    const bio = bioTexture(28);
    self.postMessage(
      { type: "volcano-textures-ready", smoke, hotSmoke, ember, bubble, bio },
      [...smoke, hotSmoke, ember, bubble, bio],
    );
  } catch {
    self.postMessage({ type: "volcano-textures-error" });
  }
};
