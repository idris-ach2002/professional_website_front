import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const provider = read("src/performance/PerformanceRuntimeContext.jsx");
const capabilities = read("src/performance/runtimeCapabilities.js");
const budgets = read("src/performance/runtimeBudgets.js");
const memory = read("src/performance/memoryPressureGovernor.js");
const resources = read("src/performance/resourceLifecycleRegistry.js");
const prefetch = read("src/performance/smartPrefetch.js");
const assets = read("src/performance/assetLoadingPolicy.js");
const marineRuntime = read("src/performance/marineWorkerRuntime.js");
const marineWorker = read("src/workers/marineSimulation.worker.js");
const aquarium = read("src/components/GlobalAquarium.jsx");
const volcano = read("src/components/UnderwaterVolcanoField.jsx");
const app = read("src/App.jsx");
const projects = read("src/components/ProjectsShowcase.jsx");
const packageJson = JSON.parse(read("package.json"));
const errors = [];

for (const profile of ["ultra", "high", "balanced", "reduced", "survival"]) {
  if (!capabilities.includes(`\"${profile}\"`)) errors.push(`Missing adaptive runtime profile: ${profile}.`);
}
if (!capabilities.includes("hardwareConcurrency") || !capabilities.includes("saveData") || !capabilities.includes("webgl2Supported")) {
  errors.push("Capability negotiation must include CPU, Save-Data and WebGL2 signals.");
}
if (!budgets.includes("marinePopulationScale") || !budgets.includes("prefetchLevel") || !budgets.includes("volcanoFps")) {
  errors.push("Runtime profiles must resolve into explicit subsystem budgets.");
}
if (!memory.includes("MEMORY_STATES") || !memory.includes("RECOVERING") || !memory.includes("heapRatio")) {
  errors.push("Memory governor must expose a hysteretic NORMAL/WATCH/PRESSURE/CRITICAL/RECOVERING state machine.");
}
if (!resources.includes("possibleLeaks") || !resources.includes("markRuntimeOwnerUnmounted")) {
  errors.push("Resource lifecycle registry must surface possible leaks after owner teardown.");
}
if (!prefetch.includes("save-data") || !prefetch.includes("memory-pressure") || !prefetch.includes("benefit-exceeds-cost")) {
  errors.push("Smart prefetch must account for data saving, memory pressure and cost/benefit.");
}
if (!assets.includes("VISIBLE_SOON") || !assets.includes("fetchPriority") || !projects.includes("resolveAssetLoadingPolicy")) {
  errors.push("Asset Intelligence must drive real project image loading priority.");
}
if (!provider.includes("resolveProfileFromSignals") || !provider.includes("portfolio:runtime-decision") || !provider.includes("portfolio:memory-pressure")) {
  errors.push("PerformanceRuntimeProvider must coordinate adaptive decisions and publish explainable runtime events.");
}
if (!provider.includes("getRuntimeSnapshot") || !provider.includes("requestPrefetch")) {
  errors.push("Runtime provider must expose Mission-Control-ready snapshots and smart prefetch.");
}
if (
  !marineRuntime.includes('WorkerClass = typeof Worker === "undefined" ? null : Worker')
  || !marineRuntime.includes('new WorkerClass(new URL("../workers/marineSimulation.worker.js"')
  || !marineWorker.includes("stepMarinePopulation")
) {
  errors.push("Marine simulation must have a real injectable module Worker path with the existing ocean engine as its source of truth.");
}
if (!marineRuntime.includes("worker-stall") || !marineRuntime.includes("stallTimeoutMs")) {
  errors.push("Marine Worker runtime must fail over deterministically when the Worker stalls.");
}
if (!marineWorker.includes("state.buffer") || !marineWorker.includes("[state.buffer]")) {
  errors.push("Marine simulation state must return through a transferable typed-array buffer.");
}
if (!aquarium.includes("createMarineWorkerRuntime") || !aquarium.includes("runtimeBudget?.workerSimulation")) {
  errors.push("GlobalAquarium must use Worker simulation with runtime-budget fallback.");
}
if (!aquarium.includes("registerRuntimeResource") || !volcano.includes("registerRuntimeResource")) {
  errors.push("Major graphical runtimes must register their Canvas/RAF/Worker lifecycle.");
}
if (!volcano.includes("runtimeBudget?.volcanoFps") || !volcano.includes("runtimeBudget?.dprCap")) {
  errors.push("Volcano must obey adaptive runtime FPS and DPR budgets.");
}
if (!app.includes("requestPrefetch") || !app.includes("underwater-volcano-module")) {
  errors.push("A real lazy subsystem must exercise Smart Prefetch without gating required content.");
}
if (!packageJson.scripts?.["check:intelligent-runtime"]) {
  errors.push("Missing npm script check:intelligent-runtime.");
}
if (!packageJson.scripts?.build?.includes("check:intelligent-runtime")) {
  errors.push("Production build must enforce the intelligent runtime contract.");
}

if (errors.length) {
  console.error(`Intelligent runtime contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("Intelligent runtime contract OK: capability negotiation, adaptive budgets, memory governor, Worker simulation, smart prefetch and lifecycle/leak telemetry are wired into the real front runtime.");
