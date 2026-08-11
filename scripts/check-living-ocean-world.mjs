import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("src/App.jsx");
const aquarium = read("src/components/GlobalAquarium.jsx");
const bridge = read("src/components/OceanWorldBridge.jsx");
const transitionStage = read("src/components/OceanTransitionStage.jsx");
const projects = read("src/components/ProjectsShowcase.jsx");
const footer = read("src/components/SiteFooter.jsx");
const mine = read("src/components/TreasureMineField.jsx");
const engine = read("src/ocean/oceanWorldEngine.js");
const timings = read("src/ocean/oceanTransitionTimings.js");
const runtimePolicy = read("src/ocean/oceanRuntimePolicy.js");
const rockfall = read("src/animations/volcanoRockfallEngine.js");
const volcano = read("src/components/UnderwaterVolcanoField.jsx");
const volcanoEngine = read("src/animations/volcanoSimulationEngine.js");
const css = read("src/styles/effects/global-aquarium.css");
const packageJson = JSON.parse(read("package.json"));
const errors = [];

for (const biome of ["surface", "deep", "caldera", "projects", "outro"]) {
  if (!engine.includes(`"${biome}"`)) errors.push(`Missing ocean biome: ${biome}.`);
}
if (!aquarium.includes("IntersectionObserver") || !aquarium.includes("data-biome")) {
  errors.push("Biome transitions must be driven by IntersectionObserver state rather than scroll positions.");
}
if (/addEventListener\(["']scroll["']|scrollY|pageYOffset/.test(aquarium)) {
  errors.push("Living Ocean World must not bind marine motion to scroll position.");
}
if (!aquarium.includes("ocean-world-canvas") || !aquarium.includes("requestAnimationFrame")) {
  errors.push("Marine life must render through a visibility-safe Canvas RAF loop.");
}
if (!engine.includes("sampleOceanCurrent") || !volcanoEngine.includes("sampleOceanCurrent") || !rockfall.includes("sampleOceanCurrent")) {
  errors.push("Marine life, volcano particles and falling rocks must share the common ocean-current field.");
}
if (!engine.includes("agent.vx > 0.006") || !engine.includes("agent.vx < -0.006")) {
  errors.push("Fish orientation hysteresis must remain tied to real horizontal velocity.");
}
if (!engine.includes("schoolSteer") || !engine.includes("boundarySteer") || !engine.includes("dangerXForce")) {
  errors.push("Marine agents must retain schooling, boundary avoidance and danger avoidance.");
}
if (!engine.includes("resolveRareOceanEvent") || !aquarium.includes("drawRareEvent")) {
  errors.push("Rare manta/school/jelly events are required for the living world.");
}

for (const variant of ["descent", "caldera", "projects", "deep-projects", "crystal"]) {
  if (!bridge.includes(`${variant}:`) && !bridge.includes(`"${variant}":`)) errors.push(`Missing world gate variant: ${variant}.`);
}
for (const transitionId of ["ocean-transition-deep", "ocean-transition-caldera", "ocean-transition-projects", "ocean-transition-outro", "ocean-outro"]) {
  if (!aquarium.includes(transitionId) && !footer.includes(transitionId)) errors.push(`Missing observed world hand-off: ${transitionId}.`);
}
if (!app.includes('<OceanWorldBridge variant="descent"') || !app.includes('<OceanWorldBridge variant="caldera"') || !app.includes('<OceanWorldBridge variant="projects"')) {
  errors.push("Desktop world flow must explicitly gate surface→deep→caldera→projects.");
}
if (!app.includes('<OceanWorldBridge variant="deep-projects"')) {
  errors.push("Reduced/mobile flow must gate deep ocean directly into projects when the volcano is disabled.");
}
if (!app.includes('<OceanWorldBridge variant="crystal"')) {
  errors.push("Projects must end in the crystalline world gate.");
}
if (!app.includes("OceanTransitionStage")) {
  errors.push("Fixed full-screen OceanTransitionStage is missing from the public world runtime.");
}
if (!aquarium.includes('portfolio:ocean-transition')) {
  errors.push("OceanWorldDirector must emit autonomous cinematic transition events.");
}
if (!aquarium.includes('rootMargin: "-48% 0px -48% 0px"') || !aquarium.includes('data-world-director="intersection-viewport-center"')) {
  errors.push("OceanWorldDirector must keep the viewport-centre IntersectionObserver arbitration.");
}
if (!aquarium.includes('addEventListener("scrollend"')) {
  errors.push("OceanWorldDirector must retain low-frequency scrollend reconciliation for direct navigation.");
}
if (!transitionStage.includes("position") && !css.includes(".ocean-transition-stage")) {
  errors.push("Transition stage must be a fixed viewport cinematic layer.");
}
for (const scene of ["surface-deep", "deep-caldera", "caldera-projects", "deep-projects", "projects-outro"]) {
  if (!transitionStage.includes(`"${scene}"`)) errors.push(`Missing game-world cinematic: ${scene}.`);
}
for (const duration of [760, 480, 800, 500, 820, 520, 740, 780]) {
  if (!timings.includes(`: ${duration},`)) errors.push(`Missing centralized recruiter-first cinematic duration: ${duration}ms.`);
}
if (/\"(?:surface-deep|deep-caldera|caldera-projects|deep-projects|projects-outro)\":\s*(?:1\d{3}|[2-9]\d{3})/.test(timings)) {
  errors.push("Primary world cinematics must remain below one second.");
}
if (!transitionStage.includes("OCEAN_CINEMATIC_DURATIONS_MS") || !engine.includes("resolveOceanTransitionDurationSeconds")) {
  errors.push("World Director and cinematic renderer must share one transition timing source.");
}
for (const sceneFunction of ["drawPressureDescent", "drawSeismicRift", "drawStationPowerReveal", "drawMineralResonance", "drawRockShards", "drawPerspectiveGrid", "drawStationGeometry"]) {
  if (!transitionStage.includes(sceneFunction)) errors.push(`Missing destination-linked suspense scene: ${sceneFunction}.`);
}
if (transitionStage.includes("drawSubmarine") || transitionStage.includes("drawFish")) {
  errors.push("World cinematics must not reveal the next universe with a crossing fish or vehicle.");
}
if (!transitionStage.includes('data-reveal-engine="cinematic-world-reveal-v21-25"')) {
  errors.push("Transition stage must expose the V21.25 fast cinematic world-reveal engine marker.");
}
if (!css.includes(".ocean-world-gate") || css.includes(".ocean-world-bridge{")) {
  errors.push("Legacy visible bridge bands must remain removed; only invisible gates are allowed.");
}
if (!projects.includes('data-project-world="research-station"') || !projects.includes("project-carousel-panel") || !projects.includes("ProjectVisual") || !projects.includes("project-gallery-shell")) {
  errors.push("Projects must preserve the proven V21.19 carousel and its project cards.");
}
if (projects.includes("project-world-backdrop") || projects.includes("resolveProjectWorldTheme")) {
  errors.push("Per-project viewport worlds must remain removed; only the global project-station background may change.");
}
if (!footer.includes("TreasureMineField") || !mine.includes('data-mine-field="excavation-runtime"') || !mine.includes("IntersectionObserver") || !mine.includes("requestAnimationFrame")) {
  errors.push("Final footer must use the compact animated excavation mine runtime.");
}
for (const treasure of ["diamond", "emerald", "ruby", "sapphire", "gold", "amethyst", "opal", "aquamarine", "topaz", "red-coral", "black-pearl"]) {
  if (!mine.includes(`type: "${treasure}"`)) errors.push(`Missing precious mine object: ${treasure}.`);
}
if (!css.includes(".treasure-mine-footer") || !css.includes("min-height: clamp(300px, 35vh, 370px)")) {
  errors.push("Treasure mine must remain a compact footer rather than a full-height chapter.");
}
if (/ocean-ascent-vehicle|ascent-vehicle-silhouette|oceanVehicleAscent/.test(`${footer}\n${bridge}\n${css}`)) {
  errors.push("Ascending project vehicles are forbidden in V21.22.");
}

if (!css.includes('html[data-ocean-cinematic] .global-aquarium .ocean-world-canvas')) {
  errors.push("Marine fish must disappear during cinematic hand-offs to preserve suspense.");
}
if (!css.includes('background: transparent !important;') || !css.includes('.projects-section[data-project-world="research-station"]')) {
  errors.push("Projects must not reintroduce a dark station card behind the carousel.");
}
if (!transitionStage.includes("drawSuspenseVeil")) {
  errors.push("World cinematics must keep the suspense veil before revealing the next universe.");
}
if (!transitionStage.includes("real plunge") || !transitionStage.includes("branching incandescent fault") || !transitionStage.includes("Airlock shutters") || !transitionStage.includes("Sonar-style resonance")) {
  errors.push("Each primary destination must keep a layered world-specific cinematic language: plunge, seismic fault, airlock boot and mineral resonance.");
}
if (footer.includes("EXCAVATION COMPLETE") || mine.includes("SITE 07") || mine.includes("ABYSSAL VEIN")) {
  errors.push("Synthetic diagnostic copy is forbidden in the human-facing mine footer.");
}

if (!rockfall.includes("settledCount") || !rockfall.includes("stepVolcanoRockfall") || !rockfall.includes("resolveSpawnDelay")) {
  errors.push("Persistent non-recycled volcanic rockfall engine is missing.");
}
for (const kind of ["dust", "hot", "basalt", "mega"]) {
  if (!rockfall.includes(`"${kind}"`)) errors.push(`Missing volcanic debris category: ${kind}.`);
}
if (!volcano.includes("bakeSettledRock") || !volcano.includes("settledDebrisSurfaceRef") || !volcano.includes("volcano-debris-canvas")) {
  errors.push("Settled volcanic rocks must be baked into a persistent debris field.");
}
if (volcanoEngine.includes('type === "fragment"') || volcanoEngine.includes('"fragment"')) {
  errors.push("Legacy recycled fragment particles must remain removed in favor of persistent rockfall.");
}

if (aquarium.includes("MutationObserver")) {
  errors.push("GlobalAquarium must use explicit lazy-world registration rather than a document-wide MutationObserver.");
}
if (!aquarium.includes("OCEAN_WORLD_MOUNTED_EVENT") || !aquarium.includes("resolveAquariumFps")) {
  errors.push("GlobalAquarium must use explicit world registration and an adaptive simulation FPS cap.");
}
if (!runtimePolicy.includes("return mobile ? 45 : 60") || !runtimePolicy.includes("return 30")) {
  errors.push("Ocean runtime policy must cap high/mobile/constrained simulation rates.");
}
if (!mine.includes('data-render-mode="static-base-dynamic-fx"') || !mine.includes("treasure-mine-fx-canvas") || !mine.includes("resolveMineFxFps")) {
  errors.push("Treasure mine must bake its static base and isolate low-frequency dynamic FX.");
}

if (!packageJson.scripts?.build?.includes("check:living-ocean-world")) {
  errors.push("Production build must execute check:living-ocean-world.");
}

if (errors.length) {
  console.error(`Living Ocean World contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("Living Ocean World V22 OK: V21.25 visuals are frozen while transition timing, lazy-world registration, aquarium cadence and mine rendering are consolidated for runtime efficiency.");
