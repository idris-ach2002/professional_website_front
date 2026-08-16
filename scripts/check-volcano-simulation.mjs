import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const component = read("src/components/UnderwaterVolcanoField.jsx");
const aquarium = read("src/components/GlobalAquarium.jsx");
const engine = read("src/animations/volcanoSimulationEngine.js");
const renderer = read("src/rendering/volcanoWebGLRenderer.js");
const canvasRenderer = read("src/rendering/volcanoCanvasRenderer.js");
const canvasWorker = read("src/workers/volcanoCanvasRender.worker.js");
const smokeTexture = read("src/rendering/volcanoSmokeTexture.js");
const worker = read("src/workers/volcanoTexture.worker.js");
const environment = read("public/scenes/abyss-volcano-environment.svg");
const foreground = read("public/scenes/abyss-volcano-foreground.svg");
const packageJson = JSON.parse(read("package.json"));
const errors = [];

if (!engine.includes('VOLCANO_STAGES = Object.freeze(["eruption"])')) {
  errors.push("Volcano must remain in perpetual eruption rather than cycling back to dormant/cooldown states.");
}
for (const pulse of ["base", "surge", "burst", "mega"]) {
  if (!engine.includes(`"${pulse}"`)) errors.push(`Missing perpetual-eruption pulse type: ${pulse}.`);
}
if (!engine.includes("FIRST_PULSES") || !engine.includes('kind: "mega"') || !engine.includes("resolveGeneratedPulse")) {
  errors.push("Perpetual eruption must keep an immediate showcase followed by irregular generated pulses.");
}
if (!engine.includes("PERPETUAL_BASE") || !engine.includes("pulseStartedAt") || !engine.includes("resolvePulseEnvelope")) {
  errors.push("Perpetual lava/smoke baseline and pulse-envelope engine are required.");
}
if (!engine.includes('type === "sediment"')) {
  errors.push("Living caldera must keep sediment lift in the particle engine.");
}
const rockfall = read("src/animations/volcanoRockfallEngine.js");
if (!rockfall.includes("stepVolcanoRockfall") || !rockfall.includes("settledCount")) {
  errors.push("Living caldera must use persistent non-recycled volcanic rockfall.");
}
if (!(component.includes("data-volcano-pulse") || component.includes("root.dataset.volcanoPulse")) || !component.includes("volcano-foreground-vector")) {
  errors.push("Volcano component must expose pulse state and render the asymmetric foreground rock layer.");
}
if (!component.includes("requestWorkerParticleTextures") || !component.includes("resolveRenderFps") || !component.includes("hotSmoke")) {
  errors.push("Volcano textures, layered hot smoke and render cadence must remain asynchronous/adaptive.");
}
if (!canvasRenderer.includes('layer === "diffuse"') || !canvasRenderer.includes('context.filter = "none"')) {
  errors.push("Smoke rendering must keep a visible hot/main/diffuse continuous plume without Canvas blur filters.");
}
if (!component.includes("transferControlToOffscreen") || !canvasWorker.includes("drawParticleField") || !canvasWorker.includes("drawRockfall")) {
  errors.push("Volcano Canvas2D particles/debris must retain the OffscreenCanvas worker path with deterministic main-thread fallback.");
}
if (!engine.includes("smokeDensity") || !engine.includes("smokeFlow") || !engine.includes('"diffuse"')) {
  errors.push("Perpetual smoke must expose stable density/flow and a pre-warmed diffuse layer.");
}
if (engine.includes("smokeMushroom") || engine.includes('"cap"') || engine.includes('"crown"')) {
  errors.push("Mushroom-cloud smoke must remain retired so eruption pulses cannot cover the volcano.");
}
if (!engine.includes('particle.type !== "smoke"')) {
  errors.push("Eruption shock must not kick the continuous smoke plume.");
}
if (!smokeTexture.includes("putImageData") || !smokeTexture.includes("fbm") || !smokeTexture.includes("ellipseField")) {
  errors.push("Natural smoke sprites must be generated as textured billowing ImageData rather than blurred radial clouds.");
}
if (smokeTexture.includes("context.shadowBlur") || smokeTexture.includes("createRadialGradient(")) {
  errors.push("Volcano smoke textures must not use blur/shadow/radial-gradient shortcuts.");
}
if (!component.includes("portfolio:volcano-stage") || !component.includes("reaction:") || !aquarium.includes("event.detail?.reaction")) {
  errors.push("Fauna must react only to strong eruption pulses, not continuously to the perpetual-eruption baseline.");
}
if (!renderer.includes('getContext("webgl2"') || !renderer.includes("u_lava") || !renderer.includes("u_heat")) {
  errors.push("WebGL2 renderer must keep procedural basalt/lava/thermal uniforms.");
}
if (!renderer.includes("fbm") || !renderer.includes("organicChannel") || !renderer.includes("fractureField") || !renderer.includes("moltenLake")) {
  errors.push("Procedural basalt, organic lava channels/fractures and a molten crater lake are required.");
}
if (!renderer.includes("lowerThermalZone") || !renderer.includes("middleThermalZone") || !renderer.includes("upperThermalZone")) {
  errors.push("V21.15 must keep deep-crimson thermal coverage across the lower, middle and upper volcano cone.");
}
if (!renderer.includes("crimsonEnvelope") || !renderer.includes("crimsonAura") || !renderer.includes("eruptionDelta")) {
  errors.push("V21.15 must keep a permanent crimson vein aura that intensifies during eruption pulses.");
}
if (!renderer.includes("u_canyon_light") || !renderer.includes("wallCracks") || !renderer.includes("canyonWarm")) {
  errors.push("Side basalt walls must receive dynamic volcanic light and sparse pulse-driven hot fractures.");
}
if (!environment.includes("asymmetric far caldera walls") || !environment.includes("basalt column fields") || !environment.includes("hydrothermal black-smoker")) {
  errors.push("Environment must keep asymmetric basalt cliffs, columns and hydrothermal black smokers.");
}
if (!foreground.includes("close left rock") || !foreground.includes("distant right foreground")) {
  errors.push("Foreground must keep asymmetric near/far rocks for cinematic depth.");
}
if (!worker.includes("OffscreenCanvas") || !worker.includes("transferToImageBitmap") || !worker.includes("paintVolcanoSmokeTexture")) {
  errors.push("Particle texture generation must retain the OffscreenCanvas worker path and procedural smoke texture painter.");
}
for (const asset of [
  "public/scenes/abyss-volcano.svg",
  "public/scenes/abyss-volcano-environment.svg",
  "public/scenes/abyss-volcano-foreground.svg",
]) {
  if (!fs.existsSync(path.join(root, asset))) errors.push(`Missing volcano fallback/environment asset: ${asset}.`);
}
if (packageJson.dependencies?.three || packageJson.dependencies?.["@react-three/fiber"] || packageJson.dependencies?.["@react-three/rapier"]) {
  errors.push("Volcano simulation must remain dependency-free from Three/Rapier.");
}
if (!packageJson.scripts?.build?.includes("check:volcano-simulation")) {
  errors.push("Production build must execute check:volcano-simulation.");
}

if (errors.length) {
  console.error(`Volcano simulation contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("Volcano simulation OK: V21.15 thermal veins and steady smoke preserved, with V21.16 persistent rockfall integrated.");
