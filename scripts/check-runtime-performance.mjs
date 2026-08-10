import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const provider = read("src/performance/PerformanceRuntimeContext.jsx");
const scheduler = read("src/performance/runtimeScheduler.js");
const worker = read("src/performance/performanceRuntime.worker.js");
const metrics = read("src/performance/performanceMetrics.js");
const main = read("src/main.jsx");
const app = read("src/App.jsx");
const ocean = read("src/components/OceanMorphBackground.jsx");
const aquarium = read("src/components/GlobalAquarium.jsx");
const volcano = read("src/components/UnderwaterVolcanoField.jsx");
const volcanoWorker = read("src/workers/volcanoTexture.worker.js");
const volcanoSimulation = read("src/animations/volcanoSimulationEngine.js");
const analytics = read("src/components/AnalyticsTracker.jsx");
const packageJson = JSON.parse(read("package.json"));
const errors = [];

if (!main.includes("PerformanceRuntimeProvider")) {
  errors.push("PerformanceRuntimeProvider must wrap the application runtime.");
}
if (!provider.includes('new Worker(new URL("./performanceRuntime.worker.js", import.meta.url)')) {
  errors.push("Performance analysis must run in a dedicated module Worker when available.");
}
if (!provider.includes('supportedTypes.includes("longtask")')) {
  errors.push("Long Tasks monitoring is missing.");
}
if (!provider.includes('supportedTypes.includes("long-animation-frame")')) {
  errors.push("Long Animation Frames monitoring is missing.");
}
if (!provider.includes("DEGRADE_WINDOWS = 2") || !provider.includes("RECOVER_WINDOWS = 4")) {
  errors.push("Performance governor hysteresis must prevent quality flapping.");
}
if (!provider.includes("[transferableBuffer]")) {
  errors.push("Frame samples must be transferred to the Worker without retaining the source buffer.");
}
if (!worker.includes("analyzePerformanceWindow")) {
  errors.push("Worker must perform performance-window analysis off the main thread.");
}
if (!metrics.includes("droppedFrameRatio") || !metrics.includes("estimatedHz")) {
  errors.push("Governor analysis must be refresh-rate aware and track dropped-frame pressure.");
}
if (!scheduler.includes("nativeScheduler?.postTask") || !scheduler.includes("requestIdleCallback")) {
  errors.push("Prioritized scheduler must use postTask with an idle fallback.");
}
if (!scheduler.includes("AbortError") || !scheduler.includes("signal")) {
  errors.push("Scheduled work must support cancellation safeguards.");
}
if (!analytics.includes("scheduleBackgroundTask")) {
  errors.push("Analytics must be deferred as background work.");
}
if (!app.includes("runtimeQuality={runtimeQuality}")) {
  errors.push("Runtime quality must reach visual subsystems.");
}
if (!ocean.includes('runtimeQuality === "constrained"') || !ocean.includes("CONSTRAINED_PARTICLE_COUNT") || !ocean.includes("!runtimeConstrained")) {
  errors.push("Ocean layers and particle density must adapt to sustained runtime pressure.");
}
if (!aquarium.includes("CONSTRAINED_FISH") || !aquarium.includes('runtimeQuality === "constrained"')) {
  errors.push("Aquarium density must adapt to sustained runtime pressure.");
}
if (!volcano.includes("resolveVolcanoParticleCounts") || !volcano.includes("resolveDpr") || !volcano.includes("resolveRenderFps") || !volcano.includes("runtimeQuality")) {
  errors.push("Volcano particle density, DPR and render cadence must adapt to sustained runtime pressure.");
}
if (!volcanoWorker.includes("OffscreenCanvas") || !volcanoWorker.includes("transferToImageBitmap")) {
  errors.push("Volcano texture preparation must support OffscreenCanvas Worker execution.");
}
if (!volcanoSimulation.includes("resolveVolcanoStageProfile") || !volcanoSimulation.includes("stepVolcanoSimulation")) {
  errors.push("Volcano eruption stages must be simulated outside React state hot paths.");
}
if (!packageJson.scripts?.build?.includes("check:runtime-performance")) {
  errors.push("Production build must execute check:runtime-performance.");
}
if (!packageJson.scripts?.["check:runtime-performance"]) {
  errors.push("Missing npm script check:runtime-performance.");
}

if (errors.length) {
  console.error(`Runtime performance contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  "Runtime performance contract OK: prioritized scheduler, Long Tasks/LoAF observers, Worker analysis, "
  + "hysteretic governor and adaptive ocean/aquarium/Canvas quality.",
);
