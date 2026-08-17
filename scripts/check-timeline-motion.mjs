import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const component = read("src/components/PortfolioTimeline.jsx");
const sectionTitle = read("src/components/SectionTitle.jsx");
const inspection = read("src/animations/timelineInspectionEngine.js");
const timelineMotion = read("src/animations/timelineMotion.js");
const responsiveCss = read("src/styles/responsive/company-responsive.css");
const visualCss = read("src/styles/overrides/timeline-abyss.css");
const missionCss = read("src/styles/sections/timeline-mission-ui.css");
const detailSheet = read("src/components/timeline/TimelineDetailSheet.jsx");
const droneCss = read("src/styles/effects/global-aquarium.css");
const drone = read("src/components/ExplorationDrone.jsx");
const app = read("src/App.jsx");
const errors = [];

if (!component.includes('data-motion-engine="abyss-expedition-inspection-v10-legacy-optimized"')) {
  errors.push("Timeline must expose the V10 legacy-optimized inspection engine marker.");
}
if (!component.includes('data-motion-source="time-and-intersection-state"')) {
  errors.push("Timeline motion must be driven by time and discrete intersection state, not scroll coordinates.");
}
if (!component.includes("IntersectionObserver") || !component.includes("requestAnimationFrame")) {
  errors.push("Timeline scene must use IntersectionObserver lifecycle plus requestAnimationFrame animation.");
}
if (!component.includes("timeline-autonomous-stage") || !visualCss.includes("position:sticky")) {
  errors.push("Timeline vehicle must live in the native sticky inspection stage.");
}
if (/ScrollTrigger|getVelocity\s*\(|scrollY|pageYOffset|addEventListener\(["']scroll/.test(component)) {
  errors.push("Timeline component must not map decoration positions from scroll coordinates or scroll events.");
}
if (/\bpin\s*:\s*true|\bscrub\s*:/.test(component)) {
  errors.push("Timeline component must not reintroduce pinned/scrubbed motion.");
}
if (!component.includes("managedMotion") || !sectionTitle.includes("managedMotion")) {
  errors.push("Timeline heading must remain outside SectionTitle scroll-scrub motion.");
}
if (component.includes('reveal="fish"') || visualCss.includes("timeline-fish-entry-pass") || visualCss.includes("section-reveal-fish")) {
  errors.push("Timeline world entry must not use the old left-to-right fish reveal.");
}
if (!component.includes("playCardReveal") || !component.includes("progressForStep")) {
  errors.push("Timeline cards and line must reveal progressively from entry state using time, not scroll pixels.");
}
if (!component.includes("timeline-expedition-card") || !component.includes("TimelineCardReef") || !component.includes("timeline-card-reef-field")) {
  errors.push("Timeline must use the lightweight legacy expedition-card reef surface.");
}
if (/FossilTimelineSurface|timeline-fossil-canvas|getContext\(["']2d["']\)|createPortal|useState/.test(component)) {
  errors.push("Timeline must stay Canvas-free, portal-free and local-state-free after the V10 migration.");
}
if (!component.includes("TimelineDetailSheet") || !detailSheet.includes("useImperativeHandle") || detailSheet.includes("createPortal") || detailSheet.includes('document.body.style.overflow')) {
  errors.push("Mission details must use the shared pre-mounted local sheet without portals or body layout mutation.");
}
if (!component.includes('data-mission-shape="pressure-hull"') || !component.includes("timeline-mission-capsule") || !missionCss.includes("clip-path:polygon")) {
  errors.push("Timeline experiences must keep the approved pressure-hull mission capsule silhouette.");
}
if (!component.includes("timeline-bathymeter") || !component.includes("timeline-depth-tick") || !missionCss.includes("timeline-bathymeter")) {
  errors.push("Timeline must keep the lightweight bathymetric rail and depth markers.");
}
if (component.includes("pingPongState") || /submarine[^\n]{0,160}requestAnimationFrame|requestAnimationFrame[^\n]{0,160}submarine/.test(component)) {
  errors.push("The small submarine must not reintroduce per-frame ping-pong geometry; the existing inspection RAF is reserved for the inspection drone.");
}
if (component.includes("TimelineCardWave") || visualCss.includes("timeline-card-wave-field")) {
  errors.push("Legacy heartbeat-like card wave background must stay removed.");
}
if (!visualCss.includes("timeline-reef-ecosystem.svg") || !visualCss.includes("timeline-abyss-seabed")) {
  errors.push("Timeline must expose the lightweight reef/seabed ecosystem texture.");
}
if (/timeline-section island-section|timeline-section route-island|timeline-section island-section route-island/.test(component)) {
  errors.push("Timeline must stay full-bleed and must not return to the large island/card shell.");
}
if (!component.includes("createInspectionPilot") || !component.includes("requestInspectionTarget") || !component.includes("stepInspectionPilot")) {
  errors.push("Marine vehicle must use the card-inspection engine.");
}
if (!inspection.includes("const VANISH_DURATION = 0.075") || !inspection.includes("const APPEAR_DURATION = 0.095")) {
  errors.push("Vehicle facing swaps must use the V20.8 ultra-fast vanish/appear timings.");
}
if (!inspection.includes("0.26 + distance * (mobile ? 0.44 : 0.52)") || !inspection.includes("0.34, mobile ? 0.62 : 0.72")) {
  errors.push("Vehicle transit must keep the approved V20.9/V21 faster inspection timing envelope.");
}
if (!inspection.includes("0.92") || !inspection.includes("torch: 1.48") || !inspection.includes("1.64")) {
  errors.push("Vehicle transit and torch must keep the V20.8 faster/high-intensity envelope.");
}
if (!inspection.includes("INSPECTION_PHASES.VANISH") || !inspection.includes("INSPECTION_PHASES.APPEAR")) {
  errors.push("Vehicle must disappear before facing swaps and reappear already oriented correctly.");
}
if (!inspection.includes("INSPECTION_PHASES.INSPECT") || !component.includes("data-timeline-inspection")) {
  errors.push("Vehicle must support a torch inspection phase linked to the visible expedition card.");
}
if (!drone.includes("timeline-inspection-torch") || !drone.includes('data-facing="left"')) {
  errors.push("Exploration vehicle must expose the dedicated torch and discrete facing state.");
}
if (!droneCss.includes("conic-gradient") || !droneCss.includes("240deg") || !droneCss.includes("300deg")) {
  errors.push("Exploration torch must keep the V20.9 narrow 60-degree physical light cone.");
}
if (!droneCss.includes("257deg") || !droneCss.includes("283deg")) {
  errors.push("Exploration torch must keep a narrower high-energy core inside the 60-degree penumbra.");
}
if (!visualCss.includes("saturate(1.55)") || !visualCss.includes("brightness(1.20)")) {
  errors.push("Active torch inspection must restore vivid reef/coral colours without a card-local hotspot.");
}
if (component.includes("timeline-card-inspection-light") || visualCss.includes("timeline-card-inspection-light")) {
  errors.push("Card-local inspection hotspot must stay removed; illumination must come from the vehicle torch.");
}
if (!component.includes("timeline-exit-sentinel") || !component.includes("timelineExit") || !visualCss.includes("data-timeline-exit=\"approaching\"")) {
  errors.push("Timeline must hide the inspection vehicles before the abyss volcano using the exit sentinel.");
}
if (!component.includes("terminalExitPending") || !component.includes("terminalExitTimer") || !component.includes("420")) {
  errors.push("The terminal Timeline card must keep a fast 420ms inspection grace period before the volcano exit guard hides the vehicle.");
}
if (!component.includes("rearmInspectionFromBelow") || !component.includes("travelDirection") || !component.includes('timelineDirection')) {
  errors.push("Timeline terminal inspection must rearm directionally when the visitor scrolls back up from the volcano.");
}

if (!/margin-top\s*:\s*calc\(var\(--timeline-stage-height\)\s*\*\s*-1\)/.test(visualCss) || /margin-bottom\s*:\s*calc\(var\(--timeline-stage-height\)\s*\*\s*-1\)/.test(visualCss)) {
  errors.push("Sticky Timeline stage must keep its full margin box; overlap belongs on the list so vehicles cannot paint past the section end.");
}
if (!visualCss.includes("height:clamp(160px,22vh,260px)") || !component.includes('rootMargin: "0px 0px -14% 0px"')) {
  errors.push("Timeline exit guard must remain a broad pre-volcano intersection zone, not a 1px sentinel that fast scroll can skip.");
}
if (!visualCss.includes('data-timeline-scene="exiting"') || !visualCss.includes('data-timeline-scene="idle"')) {
  errors.push("Timeline vehicles must have CSS fail-safe hiding in exiting/idle scene states.");
}
if (!visualCss.includes("mask-image:linear-gradient") || !visualCss.includes("transparent 100%")) {
  errors.push("Abyss atmosphere must fade back to the global ocean before the next section.");
}
if (!/margin-bottom\s*:\s*0(?:\s*!important)?/.test(visualCss) || !/padding-bottom\s*:\s*0(?:\s*!important)?/.test(visualCss) || !/margin-top\s*:\s*-2px(?:\s*!important)?/.test(visualCss)) {
  errors.push("Timeline→caldera seam must remove the inherited page-section margin and overlap the caldera edge.");
}
if (!/padding-bottom\s*:\s*clamp\(220px,\s*18vw,\s*290px\)/.test(visualCss) || !/height\s*:\s*clamp\(190px,\s*17vw,\s*275px\)/.test(visualCss)) {
  errors.push("The final Timeline card must remain above a dedicated reef runway instead of colliding with foreground coral.");
}
if (/rotateY\(|createOrientationState|stepOrientation|createNavigationPilot|stepNavigationPilot/.test(component + inspection)) {
  errors.push("Legacy continuous rotation/wander engines must stay deleted from Timeline motion.");
}
if (/chooseIntelligentWanderTarget|steerTowardTarget|DESKTOP_DRONE_ROUTE|MOBILE_DRONE_ROUTE|sampleRoute/.test(timelineMotion + component)) {
  errors.push("Legacy waypoint/target-based timeline navigation must stay deleted.");
}
if (/data-scroll-performance/.test(responsiveCss) || app.includes("ScrollPerformanceGuard")) {
  errors.push("Legacy fast/direct scroll visual workaround must stay removed.");
}
if (/quickSetter\(card|timeline-card[\s\S]{0,120}quickSetter/.test(component)) {
  errors.push("Timeline cards must stay outside frame-driven transforms.");
}

if (errors.length) {
  console.error(`Timeline motion check failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("Timeline motion OK: V10 legacy cards are Canvas-free while autonomous inspection, caldera seam closure and protected abyss runway remain locked.");
