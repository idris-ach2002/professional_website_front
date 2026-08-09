import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const useGsap = read("src/animations/useGsap.js");
const ocean = read("src/components/OceanMorphBackground.jsx");
const oceanCss = read("src/styles/effects/04-rapier-and-responsive.css");
const timeline = read("src/components/PortfolioTimeline.jsx");
const responsiveCss = read("src/styles/responsive/company-responsive.css");
const aquarium = read("src/components/GlobalAquarium.jsx");
const app = read("src/App.jsx");
const rapier = read("src/components/three/BeachBallField.jsx");
const errors = [];

if (useGsap.includes("gsap.ticker.fps(")) {
  errors.push("GSAP ticker must stay uncapped and follow native requestAnimationFrame cadence.");
}
if (!useGsap.includes("lagSmoothing(240, 16)")) {
  errors.push("GSAP high-refresh lag smoothing configuration is missing.");
}
if (!ocean.includes("FULL_MORPH_FPS = 60") || !ocean.includes("FULL_DEPTH_PAINT_FPS = 90")) {
  errors.push("Ocean geometry must remain decoupled from display Hz.");
}
if (!ocean.includes("PATH_COUNT = 2") || !ocean.includes("BALANCED_MORPH_PATH_COUNT = 1")) {
  errors.push("Ocean SVG texture must remain reduced to two layers / one balanced layer.");
}
if (!ocean.includes("phasePerSecond") || !ocean.includes("new Float32Array")) {
  errors.push("Ocean morphing must stay delta-time based and reuse point buffers.");
}
if (!ocean.includes("ocean-surface-wave-main") || (ocean.match(/className="ocean-surface-wave /g) ?? []).length !== 1) {
  errors.push("Ocean surface must keep one seamless infinite SVG wave.");
}
if (!oceanCss.includes("ocean-surface-infinite-drift") || !oceanCss.includes("translate3d(-50%, 0, 0)")) {
  errors.push("Surface wave must keep a compositor-friendly seamless transform loop.");
}
if (!timeline.includes("IntersectionObserver") || !timeline.includes("requestAnimationFrame")) {
  errors.push("Timeline animation must be visibility-gated and synchronized to native display frames.");
}
if (/ScrollTrigger|getVelocity\s*\(|scrollY|pageYOffset|addEventListener\(["']scroll/.test(timeline)) {
  errors.push("Timeline must not perform scroll-position calculations on the main thread.");
}
if (!timeline.includes("document.hidden") || !timeline.includes("cancelAnimationFrame")) {
  errors.push("Timeline autonomous RAF loop must stop when inactive/hidden.");
}
if (app.includes("ScrollPerformanceGuard") || /data-scroll-performance/.test(responsiveCss)) {
  errors.push("Legacy scroll-speed DOM/CSS mutation guard must stay removed.");
}
if (/global-aquarium[\s\S]{0,160}animation-play-state\s*:\s*paused/.test(responsiveCss)) {
  errors.push("Global aquarium motion must never be paused by a scroll-speed mode.");
}
if (aquarium.includes("isScrolling") || aquarium.includes('addEventListener("scroll"')) {
  errors.push("Global aquarium must not trigger React state changes from scrolling.");
}
if (!rapier.includes("timeStep={1 / 60}") || !rapier.includes("interpolate")) {
  errors.push("Rapier must keep a fixed physics step with interpolated high-refresh rendering.");
}

if (errors.length) {
  console.error(`High-refresh contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("High-refresh contract OK: visibility-gated timeline, continuous aquarium fish, reduced ocean SVG work and interpolated Rapier rendering.");
