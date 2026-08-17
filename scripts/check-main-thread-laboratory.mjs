import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rankMainThreadHotspot, summarizeMainThreadSnapshot } from "../e2e/support/main-thread-laboratory.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const errors = [];

const helper = read("e2e/support/main-thread-laboratory.js");
const spec = read("e2e/main-thread-laboratory.spec.js");
const packageJson = JSON.parse(read("package.json"));
const workflow = read(".github/workflows/frontend-ci.yml");
const guardrails = read("docs/FRONT_RELEASE_GUARDRAILS.md");
const timeline = read("src/components/PortfolioTimeline.jsx");
const aquarium = read("src/components/GlobalAquarium.jsx");
const viewport = read("src/components/ViewportStability.jsx");
const ocean = read("src/components/OceanMorphBackground.jsx");
const gsapRuntime = read("src/animations/useGsap.js");
const sectionTitle = read("src/components/SectionTitle.jsx");
const projectsShowcase = read("src/components/ProjectsShowcase.jsx");
const volcanoField = read("src/components/UnderwaterVolcanoField.jsx");
const profileHero = read("src/components/ProfileHero.jsx");
const adminController = read("src/components/admin/useAdminController.jsx");

const requireText = (source, fragment, message) => {
  if (!source.includes(fragment)) errors.push(message);
};

for (const fragment of [
  'supported.includes("longtask")',
  'supported.includes("long-animation-frame")',
  "frameDeltas",
  "eventLoopDelays",
  "blockingDuration",
  "topScripts",
  "rankMainThreadHotspot",
]) requireText(helper, fragment, `Main-thread helper missing: ${fragment}`);

for (const fragment of [
  "#profile",
  "#timeline",
  "#abyss-volcano-field",
  "#projects",
  "#ocean-transition-caldera",
  "#ocean-transition-projects",
  "#ocean-transition-outro",
  "MAIN_THREAD_MAX_LONG_TASK_MS",
  "MAIN_THREAD_MAX_LOAF_MS",
  "MAIN_THREAD_MAX_EVENT_LOOP_DELAY_MS",
  "MAIN_THREAD_MAX_BLOCKING_DURATION_MS",
  "MAIN_THREAD_MAX_P99_FRAME_MS",
  "MAIN_THREAD_MAX_DROPPED_FRAME_RATIO",
  "MAIN_THREAD_INITIAL_WARMUP_MS",
  "MAIN_THREAD_STEADY_SETTLE_MS",
  "maxBlockingDurationMs",
  "main-thread-laboratory.json",
  "investigate-offscreen-canvas-worker",
  'align: "end"',
]) requireText(spec, fragment, `Main-thread spec missing: ${fragment}`);

if (spec.includes("toBeLessThanOrEqual(MAX_P99_FRAME_MS)")) {
  errors.push("Headless RAF p99 must remain diagnostic, not a hard release gate.");
}
if (spec.includes("toBeLessThanOrEqual(MAX_DROPPED_FRAME_RATIO)")) {
  errors.push("Headless dropped-frame ratio must remain diagnostic, not a hard release gate.");
}
const portfolioSpec = read("e2e/portfolio.spec.js");
const topNavigation = read("src/components/TopNavigation.jsx");
const navigationCss = read("src/styles/navigation/premium-navigation-v2.css");
requireText(portfolioSpec, "sampleStart: 0", "Vitals INP sampling must expose an explicit temporal boundary.");
requireText(portfolioSpec, "let remaining = 4", "Vitals warm-up must drain several rendered frames before sampling INP.");
requireText(portfolioSpec, "requestAnimationFrame(settleFrame)", "Vitals warm-up must use rendered frames rather than a fixed sleep before sampling INP.");
requireText(portfolioSpec, "entry.startTime < (window.__portfolioPerformance.sampleStart ?? 0)", "Vitals INP sampling must reject late-delivered warm-up EventTiming entries.");
requireText(portfolioSpec, "interactionDetails", "Vitals failures must expose input/processing/presentation timing diagnostics.");
requireText(topNavigation, '!sheet || sheet === "more" ? renderMore() : null', "Mobile More sheet must remain warm-mounted so the measured click does not construct its DOM tree.");
requireText(topNavigation, 'nav_mobile-command-sheet${sheet ? " is-open" : ""}', "Mobile command sheet must toggle visibility without remounting the shell.");
requireText(navigationCss, "mobile-sheet INP precomposition guard", "Mobile sheet precomposition guard marker missing.");
requireText(topNavigation, "inert={!sheet ? true : undefined}", "Closed mobile command sheet must remain mounted but inert.");
requireText(navigationCss, ".nav_mobile-dock-tools.nav_mobile-command-sheet{opacity:0;visibility:visible;pointer-events:none;animation:none!important", "Mobile command sheet must stay paintable/precomposed while closed.");
requireText(navigationCss, "transition:opacity .08s linear,transform .08s cubic-bezier(.16,1,.3,1)", "Mobile command sheet compositor motion must stay below the INP presentation budget.");
requireText(navigationCss, ".nav_mobile-sheet-backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important", "Full-viewport mobile backdrop blur must stay disabled on the measured INP path.");
requireText(navigationCss, ".nav_mobile-dock-tools.nav_mobile-command-sheet{contain:layout style paint;backdrop-filter:none!important;-webkit-backdrop-filter:none!important", "Mobile sheet must stay paint-contained and avoid first-open backdrop rasterization.");

requireText(spec, "toBeLessThanOrEqual(MAX_BLOCKING_DURATION_MS)", "Blocking-duration safety gate missing.");

const mainThreadScript = packageJson.scripts?.["test:e2e:main-thread"] ?? "";
requireText(mainThreadScript, "PLAYWRIGHT_WORKERS=1", "Main-thread lab must force one Playwright worker.");
requireText(mainThreadScript, "--project=chromium", "Main-thread lab must run in Chromium for PerformanceObserver coverage.");
requireText(mainThreadScript, "--workers=1", "Main-thread lab CLI must agree on one worker.");
requireText(packageJson.scripts?.["check:main-thread"] ?? "", "check-main-thread-laboratory.mjs", "Missing check:main-thread contract.");
requireText(packageJson.scripts?.["check:final"] ?? "", "check:main-thread", "Final static hardening must include the main-thread laboratory contract.");
requireText(packageJson.scripts?.["ci:full:chain"] ?? "", "ci:main-thread", "The complete blocking chain must execute the main-thread laboratory before release.");

for (const fragment of [
  "main-thread:",
  "Run Main Thread Laboratory",
  "frontend-main-thread-report",
]) requireText(workflow, fragment, `GitHub Actions main-thread job missing: ${fragment}`);

requireText(guardrails, "Main Thread Laboratory", "Release guardrails must document the Main Thread Laboratory.");
requireText(guardrails, "250 ms", "Release guardrails must document the Long Task safety ceiling.");

// V9 trace-derived invariants. These guards target the exact hot paths that
// dominated forced style/layout in the production benchmark while keeping CSS
// and animation formulas outside the optimization surface.
requireText(timeline, "TimelineCardReef", "V10 Timeline must use the lightweight legacy reef card surface.");
if (/FossilTimelineSurface|timeline-fossil-canvas|getContext\(["']2d["']\)/.test(timeline)) {
  errors.push("V10 Timeline must remain Canvas-free.");
}
requireText(timeline, "const measureCardGeometry = () =>", "Timeline must keep a dedicated geometry read phase.");
requireText(timeline, "cachedCardGeometry", "Timeline card geometry cache missing.");
const timelineRefresh = timeline.slice(timeline.indexOf("const refreshVisibleCardsFromLayout"), timeline.indexOf("const scheduleCardSync"));
if (timelineRefresh.includes("getBoundingClientRect")) errors.push("Timeline autonomous visibility refresh must use cached geometry, not live layout reads.");
requireText(aquarium, "const worldGeometry = new Map()", "World Director geometry cache missing.");
requireText(aquarium, "const measureWorldGeometry = () =>", "World Director must batch geometry reads outside selection.");
requireText(aquarium, "new ResizeObserver", "World Director geometry cache must invalidate on layout-size changes.");
const aquariumSelect = aquarium.slice(aquarium.indexOf("const selectViewportBiome"), aquarium.indexOf("const scheduleBandVerification"));
if (aquariumSelect.includes("getBoundingClientRect")) errors.push("World Director selection hot path must remain layout-free.");
requireText(viewport, "VIEWPORT_TARGET_SELECTOR", "Viewport values must be scoped to their real consumers.");
if (viewport.includes("root.style.setProperty")) errors.push("Viewport geometry must not publish inherited custom properties on <html>.");
requireText(ocean, "const scheduleDepthPaint =", "Ocean depth must use coalesced native RAF publication.");
requireText(ocean, "global-ocean-depth-overlay", "Global ocean depth must use a dedicated compositor-local overlay.");
if (ocean.includes("--global-ocean-depth") || ocean.includes("document.documentElement.style.setProperty")) {
  errors.push("Global ocean depth must not publish inherited style state on <html>.");
}
if (ocean.includes("ScrollTrigger.create")) errors.push("Global ocean depth must not reactivate a full-document ScrollTrigger.");
requireText(ocean, "needsScrollTrigger: false", "Ocean background must stay on the GSAP core-only runtime.");
requireText(gsapRuntime, "getGsapCoreRuntime", "GSAP core runtime split missing.");
requireText(gsapRuntime, "getGsapScrollRuntime", "Optional ScrollTrigger runtime split missing.");
requireText(spec, "context.addInitScript", "Hosted main-thread lab must seed animation preference at context level.");
requireText(spec, 'toHaveAttribute("data-performance-profile", "full"', "Main-thread lab must prove the full visual world before sampling.");

// Visual-motion invariants: V9 changes the wake-up mechanism, not what the
// user sees. Keep the original scroll thresholds, animation values and depth
// formula locked while removing the global ScrollTrigger work from steady state.
requireText(ocean, "const GLOBAL_DEPTH_PAINT_FPS = 45", "Ocean depth publication cadence changed.");
requireText(ocean, "clamp(Math.pow(progress * 1.5, 0.92), 0, 1)", "Ocean depth mapping formula changed.");
requireText(sectionTitle, 'rootMargin: "0px 0px -24% 0px"', "Soft SectionTitle threshold must remain equivalent to top 76%.");
requireText(sectionTitle, 'rect.top <= (window.innerHeight || 1) * 0.76', "Soft SectionTitle already-past-threshold fallback changed.");
requireText(sectionTitle, 'duration: 0.9', "Soft SectionTitle copy duration changed.");
requireText(sectionTitle, 'duration: 0.86', "Soft SectionTitle heading duration changed.");
requireText(projectsShowcase, 'rootMargin: "0px 0px -28% 0px"', "Projects toolbar threshold must remain equivalent to top 72%.");
requireText(projectsShowcase, 'duration: 0.56', "Projects toolbar entrance duration changed.");
requireText(projectsShowcase, 'ease: "power3.out"', "Projects toolbar entrance easing changed.");
requireText(volcanoField, 'rootMargin: "0px 0px -16% 0px"', "Volcano entrance threshold must remain equivalent to top 84%.");
requireText(volcanoField, 'duration: performanceMode === "balanced" ? 0.54 : 0.72', "Volcano entrance duration changed.");
requireText(volcanoField, 'ease: "expo.out"', "Volcano entrance easing changed.");
requireText(profileHero, "needsScrollTrigger: false", "ProfileHero must not eagerly load ScrollTrigger when it does not use it.");
requireText(adminController, "needsScrollTrigger: false", "Admin entrance must not eagerly load ScrollTrigger when it does not use it.");

const syntheticSummary = summarizeMainThreadSnapshot({
  label: "contract-self-test",
  startedAt: 0,
  endedAt: 1000,
  supported: { longtask: true, longAnimationFrame: true },
  frameDeltas: [16, 16, 17, 20, 40, 80],
  eventLoopDelays: [0, 2, 7, 55],
  longTasks: [{ duration: 75 }, { duration: 120 }],
  longAnimationFrames: [{
    duration: 130,
    blockingDuration: 80,
    scripts: [{ duration: 70, sourceURL: "/assets/app.js", invoker: "event" }],
  }],
});
if (syntheticSummary.maxLongTaskMs !== 120) errors.push("Main-thread summary max Long Task calculation regressed.");
if (syntheticSummary.p99FrameMs !== 80) errors.push("Main-thread summary p99 calculation regressed.");
if (syntheticSummary.topScripts[0]?.durationMs !== 70) errors.push("Main-thread LoAF script attribution regressed.");
if (rankMainThreadHotspot(syntheticSummary) <= 1) errors.push("Main-thread hotspot ranking must flag the synthetic pressured sample.");

if (errors.length) {
  console.error(`Main Thread Laboratory contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  "Main Thread Laboratory contract OK: RAF cadence is diagnostic in headless; "
  + "Long Task/LoAF blocking/event-loop gates, warm-up isolation, worker recommendations and a single-worker Chromium release gate are wired.",
);
