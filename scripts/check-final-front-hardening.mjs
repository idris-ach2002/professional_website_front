import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decideSmartPrefetch } from "../src/performance/smartPrefetch.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const errors = [];

const indexHtml = read("index.html");
const indexCss = read("src/index.css");
const app = read("src/App.jsx");
const profileHero = read("src/components/ProfileHero.jsx");
const analytics = read("src/components/AnalyticsTracker.jsx");
const runtime = read("src/performance/PerformanceRuntimeContext.jsx");
const visibility = read("src/visibility/ItemVisibilityContext.jsx");
const mission = read("src/components/MissionControlPage.jsx");
const architecture = read("src/components/mission-control/ArchitectureObservatory.jsx");
const liveTrace = read("src/components/mission-control/LiveTraceObservatory.jsx");
const routeAccessibility = read("src/components/RouteAccessibility.jsx");
const metadata = read("src/components/MetadataHead.jsx");
const errorBoundary = read("src/components/errors/ErrorBoundary.jsx");
const headers = read("public/_headers");
const portfolioE2e = read("e2e/portfolio.spec.js");
const pkg = JSON.parse(read("package.json"));

function requireFragment(source, fragment, message) {
  if (!source.includes(fragment)) errors.push(message);
}
function forbidFragment(source, fragment, message) {
  if (source.includes(fragment)) errors.push(message);
}

// Loading/LCP and font delivery.
requireFragment(indexHtml, 'rel="preconnect" href="https://fonts.googleapis.com"', "Google Fonts CSS preconnect missing");
requireFragment(indexHtml, 'rel="preconnect" href="https://fonts.gstatic.com" crossorigin', "Google Fonts binary preconnect missing");
requireFragment(indexHtml, 'rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:', "Inter stylesheet must be discovered from HTML");
forbidFragment(indexCss, "fonts.googleapis.com", "Google Fonts must not return to a chained CSS @import");
requireFragment(profileHero, 'loading="eager"', "above-fold profile portrait must stay eager");
requireFragment(profileHero, 'fetchPriority="high"', "above-fold profile portrait must keep high fetch priority");

// Initial/runtime work.
requireFragment(app, 'const ProjectsShowcase = lazy(() => import("./components/ProjectsShowcase"));', "ProjectsShowcase must stay lazy");
requireFragment(app, 'const PortfolioTimeline = lazy(() => import("./components/PortfolioTimeline"));', "PortfolioTimeline must stay lazy");
requireFragment(app, 'const SiteFooter = lazy(() => import("./components/SiteFooter"));', "SiteFooter and TreasureMine must stay out of the initial graph");
requireFragment(app, "probability: 0.60", "volcano high-cost speculative prefetch probability must stay conservative");
requireFragment(app, "const projects = useMemo(", "projects sorting must stay memoized");
requireFragment(app, "const experiences = useMemo(", "experiences sorting must stay memoized");
forbidFragment(runtime, "setInterval(clearInteraction", "interaction priority must not use a permanent polling interval");
forbidFragment(runtime, "setInterval(sample", "memory pressure sampling must not use a permanent interval");
requireFragment(runtime, 'document.addEventListener("visibilitychange", syncFrameMonitorVisibility)', "frame monitor must suspend with document visibility");
requireFragment(runtime, 'document.addEventListener("visibilitychange", syncMemorySamplingVisibility)', "memory sampler must suspend with document visibility");
if (/if \(document\.hidden\)[\s\S]{0,120}requestAnimationFrame\(onFrame\)/.test(runtime)) {
  errors.push("frame monitor must not schedule another RAF while the document is hidden");
}
forbidFragment(visibility, "setInterval(", "global item visibility refresh must not use a permanent interval");
requireFragment(visibility, 'document.addEventListener("visibilitychange", onVisibility)', "item visibility refresh must resume on visibilitychange");
forbidFragment(analytics, "}, [location.search]);", "global analytics click listener must not rebind on query-string changes");

// Secondary dashboards may keep intervals while mounted, but must do zero useful work hidden.
if ((mission.match(/document\.hidden/g)?.length ?? 0) < 5) {
  errors.push("Mission Control pollers must all short-circuit while hidden");
}
requireFragment(architecture, "if (document.hidden) return;", "Architecture Observatory timer must pause state updates while hidden");
requireFragment(liveTrace, "if (document.hidden) return;", "Live Trace state animation must pause while hidden");

// Existing production-hardening features are contractual, not optional.
requireFragment(routeAccessibility, 'className="skip-to-content"', "skip-to-content accessibility path missing");
requireFragment(routeAccessibility, 'target.focus({ preventScroll: false })', "route focus management missing");
for (const fragment of [
  'link[rel="canonical"]',
  'hreflang="fr"',
  'hreflang="en"',
  'application/ld+json',
]) requireFragment(metadata, fragment, `SEO metadata contract missing: ${fragment}`);
requireFragment(errorBoundary, "componentDidCatch", "React Error Boundary missing");
requireFragment(errorBoundary, "handleRetry", "Error Boundary retry path missing");
for (const fragment of [
  "Content-Security-Policy:",
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "X-Content-Type-Options: nosniff",
  "Cross-Origin-Opener-Policy: same-origin",
]) requireFragment(headers, fragment, `security header missing: ${fragment}`);

// Keep the fixed language flow and core accessibility E2E coverage.
const languageMarker = "bascule du français vers l'anglais";
const languageStart = portfolioE2e.indexOf(languageMarker);
const languageEnd = languageStart >= 0 ? portfolioE2e.indexOf("\ntest(", languageStart + languageMarker.length) : -1;
const languageBlock = languageStart >= 0
  ? portfolioE2e.slice(languageStart, languageEnd >= 0 ? languageEnd : undefined)
  : "";
if (!languageBlock) errors.push("FR→EN E2E scenario missing");
if (languageBlock.includes("Développeur Java Full Stack")) errors.push("redundant flaky French H1 precondition returned to language E2E");
if (!languageBlock.includes("Full Stack Java Developer")) errors.push("English H1 postcondition missing from language E2E");
for (const fragment of ["Aller au contenu principal", "toBeFocused", "focus trap", "@vitals"]) {
  if (!portfolioE2e.includes(fragment)) errors.push(`E2E hardening coverage missing: ${fragment}`);
}

// The high-cost volcano must not prefetch on a normal budget, but remains available to aggressive profiles.
const normalPrefetch = decideSmartPrefetch({
  probability: 0.60,
  cost: "high",
  prefetchLevel: "normal",
  effectiveType: "4g",
});
const aggressivePrefetch = decideSmartPrefetch({
  probability: 0.60,
  cost: "high",
  prefetchLevel: "aggressive",
  effectiveType: "4g",
});
if (normalPrefetch.decision !== "skip") errors.push(`normal volcano prefetch should skip, got ${normalPrefetch.decision}`);
if (aggressivePrefetch.decision !== "prefetch") errors.push(`aggressive volcano prefetch should remain enabled, got ${aggressivePrefetch.decision}`);

const finalScript = pkg.scripts?.["check:final"] ?? "";
if (!finalScript.startsWith("npm run check:initial-source && node scripts/check-final-front-hardening.mjs")) {
  errors.push("check:final core script missing or reordered");
}
for (const required of ["npm run check:main-thread", "npm run check:transparent-performance"]) {
  if (!finalScript.includes(required)) errors.push(`check:final missing ${required}`);
}
if (pkg.scripts?.["ci:full"] !== "CI=1 npm run ci:full:chain") {
  errors.push("ci:full must enforce GitHub-like CI semantics for local full verification");
}
if (!pkg.scripts?.["ci:full:chain"]?.includes("npm run ci:main-thread")) {
  errors.push("ci:full:chain must include the isolated Main Thread Laboratory so local full and GitHub blocking gates stay identical");
}
if (!pkg.scripts?.["ci:full:chain"]?.includes("npm run ci:transparent-performance")) {
  errors.push("ci:full:chain must include the transparent-performance browser contract");
}
if (pkg.scripts?.["ci:release"] !== "npm run ci:full && npm run ci:soak") {
  errors.push("ci:release must run exactly one complete blocking ci:full, then the manual-style endurance soak");
}
if (!pkg.scripts?.build?.includes("npm run check:final")) errors.push("build must enforce check:final before Vite");
if (!pkg.scripts?.["ci:preflight"]?.includes("npm run check:final")) errors.push("ci:preflight must enforce check:final");

// Final CSS cascade debt: preserve the three-layer architecture and stricter debt ceiling.
const cssFiles = [];
const walkCss = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkCss(absolute);
    else if (absolute.endsWith(".css")) cssFiles.push(absolute);
  }
};
walkCss(path.join(root, "src"));
let cssImportant = 0;
let criticalLayerFiles = 0;
for (const file of cssFiles) {
  const source = fs.readFileSync(file, "utf8");
  cssImportant += source.match(/!important\b/g)?.length ?? 0;
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (relative.startsWith("src/styles/") && relative !== "src/styles/vendor/mantine-layer.css") {
    if (!source.startsWith("@layer base, priority, critical;")) {
      errors.push(`final CSS layer header missing: ${relative}`);
    }
    if (source.includes("@layer critical")) criticalLayerFiles += 1;
  }
}
if (cssImportant > 1500) errors.push(`final CSS !important budget exceeded: ${cssImportant} > 1500`);
if (criticalLayerFiles < 20) errors.push(`critical cascade coverage too low: ${criticalLayerFiles} files`);

if (errors.length) {
  console.error(`Final front hardening FAILED:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Final front hardening OK: LCP/font discovery, deferred loading, hidden-tab suspension, `
  + `a11y, SEO, resilience, security, E2E and release contracts are locked.`,
);
