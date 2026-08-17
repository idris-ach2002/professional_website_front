import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const errors = [];
const requireText = (source, token, message) => { if (!source.includes(token)) errors.push(message); };

const app = read("src/App.jsx");
const mission = read("src/components/MissionControlPage.jsx");
const architecture = read("src/components/mission-control/ArchitectureObservatory.jsx");
const worker = read("src/engineering/architectureForceAtlas.worker.js");
const liveTrace = read("src/components/mission-control/LiveTraceObservatory.jsx");
const performance = read("src/components/mission-control/PerformanceObservatory.jsx");
const styles = read("src/styles/pages/mission-control.css");
const api = read("src/services/engineeringApi.js");
const adminNav = read("src/components/admin/adminNavigationConfig.js");
const visibility = read("src/visibility/itemVisibilityRegistry.js");

for (const route of ['path="/engineering"', 'path="/en/engineering"']) requireText(app, route, `Route absente: ${route}`);
for (const panel of ["ArchitectureObservatory", "LiveTraceObservatory", "PerformanceObservatory", "RequestTraceWaterfall"]) requireText(mission, panel, `Panneau Architecture absent: ${panel}`);
for (const view of ['id: "system"', 'id: "trace"', 'id: "performance"']) requireText(mission, view, `Vue Architecture absente: ${view}`);
if (mission.includes('id: "impact"') || mission.includes("DeviceTelemetryConsent") || mission.includes("ResourceImpactObservatory")) errors.push("Impact / Device Agent doit être retiré de la route Architecture.");
if (exists("src/components/mission-control/FullSiteBenchmarkPanel.jsx") || exists("src/engineering/fullSiteBenchmark.js")) errors.push("Le benchmark global doit être retiré du frontend.");
if (exists("device-agent") || exists("public/device-agent")) errors.push("Le Device Agent doit être retiré du projet frontend.");
for (const endpoint of ["/api/engineering/mission-control", "/api/engineering/performance/history", "/api/engineering/performance/samples"]) requireText(api, endpoint, `Contrat API absent: ${endpoint}`);
if (api.includes("/api/engineering/performance/routes") || api.includes("fetchDeviceAgentSnapshot")) errors.push("Les anciens contrats benchmark/device-agent ne doivent plus être exposés.");

if (architecture.includes("architecture-canvas-surface")) errors.push("Ancienne couche architecture-canvas-surface encore présente: le canvas WebGL doit être la surface peinte.");
for (const token of ["architectureForceAtlas.worker.js", 'type: "compute"', "GRAPH_LAYOUTS", "semanticZoom", "Focus", "Départ chemin", "architecture-system-stage", "architecture-webgl", "paintStyle", 'useState("sage")', "CPU layout libéré"]) requireText(architecture, token, `Explorateur de graphe incomplet: ${token}`);
for (const token of ["ArchitectureMobileFlow", "Explorer le graphe", "budgetMs: 20", "latencyMs <= 20", "heatLabel(telemetry.heat)"]) requireText(architecture, token, `Contrat App/latence Architecture incomplet: ${token}`);
if (architecture.includes("budgetMs: 12") || architecture.includes("latencyMs <= 12")) errors.push("Le seuil visuel client doit rester à 20 ms; 12 ms est un objectif interne et non le seuil affiché.");
for (const token of ["One-shot architecture layout worker", "semanticSeed", "flowSeed", "communitiesSeed", "radialSeed", "deploymentSeed", "compactSeed", 'message.type !== "compute"']) requireText(worker, token, `Moteur de disposition ponctuel incomplet: ${token}`);
for (const token of ["Float64Array", "forces.fill(0)", "indexById"]) requireText(worker, token, `Optimisation du calcul one-shot absente: ${token}`);
if (worker.includes("setInterval") || worker.includes('type === "update"') || worker.includes('type === "reheat"')) errors.push("Le worker de disposition ne doit plus tourner en continu.");
for (const token of ["architecture-subnav", "architecture-subnav-orbit", "architecture-subnav-marker", "architecture-subnav-live"]) requireText(styles, token, `Navbar Architecture incomplète: ${token}`);
for (const token of ["StateMachine", "layoutStateMachine", "Frameworks, plugins et services traversés", "traceMatchesFeature"]) requireText(liveTrace, token, `Live Trace incomplet: ${token}`);
for (const token of ["ProfilerTimeline", "Saturation des budgets", "Événements détectés", "Statistiques fenêtre"]) requireText(performance, token, `Profiler live incomplet: ${token}`);
if (performance.includes("FullSiteBenchmarkPanel")) errors.push("Performance ne doit plus contenir le benchmark global.");

requireText(adminNav, "items-visiblility", "L’onglet admin items-visiblility est absent.");
for (const key of ["architecture.system", "architecture.trace", "architecture.performance", "home.profile", "home.projects", "recruiter", "project", "cv"]) requireText(visibility, key, `Item visibility absent: ${key}`);
requireText(mission, "useItemVisibility", "La navbar Architecture doit respecter items-visiblility.");

if (errors.length) {
  console.error(`Architecture contract failed:\n\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Architecture contract OK: 3-view architecture navbar, one-shot graph layouts, canvas palette, semantic exploration, live trace, live profiler and admin items-visiblility are wired.");
