import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const useGsap = read("src/animations/useGsap.js");
const ocean = read("src/components/OceanMorphBackground.jsx");
const oceanCss = read("src/styles/effects/04-volcano-and-responsive.css");
const timeline = read("src/components/PortfolioTimeline.jsx");
const responsiveCss = read("src/styles/responsive/company-responsive.css");
const aquarium = read("src/components/GlobalAquarium.jsx");
const app = read("src/App.jsx");
const volcano = read("src/components/UnderwaterVolcanoField.jsx");
const volcanoRenderer = read("src/rendering/volcanoWebGLRenderer.js");
const errors = [];

if (useGsap.includes("gsap.ticker.fps(")) errors.push("GSAP ticker must stay uncapped and follow native requestAnimationFrame cadence.");
if (!useGsap.includes("lagSmoothing(240, 16)")) errors.push("GSAP high-refresh lag smoothing configuration is missing.");
if (ocean.includes("setAttribute(\"d\"") || ocean.includes("getWavePoint")) errors.push("Ocean SVG geometry must remain static at runtime.");
if (!ocean.includes("STATIC_OCEAN_PATHS") || !oceanCss.includes("ocean-static-layer-drift-a")) errors.push("Ocean layers must use fixed geometry and compositor-friendly transforms.");
if (!ocean.includes("GLOBAL_DEPTH_PAINT_FPS = 45")) errors.push("Global ocean-depth publication must remain rate limited.");
if (!ocean.includes("ocean-surface-wave-main") || (ocean.match(/className="ocean-surface-wave /g) ?? []).length !== 1) errors.push("Ocean surface must keep one seamless infinite SVG wave.");
if (!oceanCss.includes("ocean-surface-infinite-drift") || !oceanCss.includes("translate3d(-50%, 0, 0)")) errors.push("Surface wave must keep a compositor-friendly seamless transform loop.");
if (!timeline.includes("IntersectionObserver") || !timeline.includes("requestAnimationFrame")) errors.push("Timeline animation must be visibility-gated and synchronized to native display frames.");
if (/ScrollTrigger|getVelocity\s*\(|scrollY|pageYOffset|addEventListener\(["']scroll/.test(timeline)) errors.push("Timeline must not perform scroll-position calculations on the main thread.");
if (!timeline.includes("document.hidden") || !timeline.includes("cancelAnimationFrame")) errors.push("Timeline autonomous RAF loop must stop when inactive/hidden.");
if (app.includes("ScrollPerformanceGuard") || /data-scroll-performance/.test(responsiveCss)) errors.push("Legacy scroll-speed DOM/CSS mutation guard must stay removed.");
if (/global-aquarium[\s\S]{0,160}animation-play-state\s*:\s*paused/.test(responsiveCss)) errors.push("Global aquarium motion must never be paused by a scroll-speed mode.");
if (aquarium.includes("isScrolling") || aquarium.includes('addEventListener("scroll"')) errors.push("Global aquarium must not trigger React state changes from scrolling.");
if (!volcano.includes("requestAnimationFrame") || !volcano.includes('getContext("2d")')) errors.push("Volcano particle layer must render through native RAF + Canvas 2D.");
if (!volcanoRenderer.includes('getContext("webgl2"') || !volcanoRenderer.includes('powerPreference: "high-performance"')) errors.push("Volcano rock/lava layer must use the lightweight native WebGL2 renderer.");
if (!volcano.includes("resolveRenderFps") || !volcano.includes("runtimeQuality")) errors.push("Volcano render cadence must adapt independently from display refresh under runtime pressure.");
if (volcano.includes("@react-three") || volcano.includes("rapier") || volcano.includes('from "three"')) errors.push("Volcano scene must not reintroduce Three/Rapier.");

if (errors.length) {
  console.error(`High-refresh contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("High-refresh contract OK: visibility-gated WebGL2/Canvas volcano, continuous aquarium fish, static/composited ocean layers and autonomous Timeline rendering.");
