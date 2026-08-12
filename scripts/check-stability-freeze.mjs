import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const packageJson = JSON.parse(read("package.json"));
const vite = read("vite.config.js");
const playwright = read("playwright.config.js");
const engine = read("src/animations/timelineInspectionEngine.js");
const oceanEngine = read("src/ocean/oceanWorldEngine.js");
const oceanRegistration = read("src/ocean/oceanWorldRegistration.js");
const aquarium = read("src/components/GlobalAquarium.jsx");
const cssCheck = read("scripts/check-css-architecture.mjs");
const performanceCheck = read("scripts/check-performance-budgets.mjs");
const stabilitySpec = read("e2e/stability.spec.js");
const workerPolicy = read("scripts/test-worker-policy.mjs");
const ownerFixture = read("e2e/fixtures/owner.js");
const workflow = read(".github/workflows/frontend-ci.yml");
const errors = [];

const requiredScripts = [
  "check:source-tree",
  "check:stability-freeze",
  "check:runtime-performance",
  "check:front-cost",
  "check:volcano-simulation",
  "check:living-ocean-world",
  "test:e2e:functional",
  "test:e2e:responsive",
  "test:e2e:stability",
  "test:e2e:stability:ci",
  "test:e2e:stability:repeat",
  "test:e2e:vitals",
  "ci:verify",
  "ci:freeze",
  "ci:stability:repeat",
  "test:workers",
  "test:e2e:soak",
  "ci:soak",
];

for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing npm script ${script}.`);
}

for (const check of [
  "check:source-tree",
  "check:stability-freeze",
  "check:runtime-performance",
  "check:front-cost",
  "check:volcano-simulation",
  "check:living-ocean-world",
]) {
  if (!packageJson.scripts?.build?.includes(check)) {
    errors.push(`Production build must execute ${check}.`);
  }
}

if (!packageJson.scripts?.["test:e2e"]?.includes("test:e2e:stability")) {
  errors.push("The E2E chain must include the dedicated stability suite.");
}
if (!packageJson.scripts?.["test:e2e:functional"]?.includes("@stability")) {
  errors.push("Functional E2E must exclude @stability to avoid duplicate execution.");
}
if (!packageJson.scripts?.["test:e2e:functional"]?.includes("@soak")) {
  errors.push("Functional E2E must exclude @soak; long soak coverage belongs to its dedicated job.");
}

if (!engine.includes("0.26 + distance * (mobile ? 0.44 : 0.52)")) {
  errors.push("Approved vehicle speed coefficients are missing.");
}
if (!engine.includes("0.34, mobile ? 0.62 : 0.72")) {
  errors.push("Approved vehicle duration bounds are missing.");
}

for (const threshold of [
  "statements: 68",
  "branches: 50",
  "functions: 70",
  "lines: 75",
]) {
  if (!vite.includes(threshold)) errors.push(`Coverage threshold missing: ${threshold}.`);
}

if (!cssCheck.includes("const maxGlobalCssBytes = 232_000")) {
  errors.push("Global CSS freeze must stay at <= 232000 bytes.");
}
if (!cssCheck.includes("const maxImportantCount = 1_250")) {
  errors.push("!important freeze must stay at <= 1250 declarations.");
}
if (!performanceCheck.includes("const HARD_INITIAL_JS_BROTLI = 210 * 1024")) {
  errors.push("Initial JS hard budget must stay at <= 210 KiB Brotli.");
}
if (!performanceCheck.includes("const TARGET_INITIAL_JS_BROTLI = 190 * 1024")) {
  errors.push("Initial JS target must stay at <= 190 KiB Brotli.");
}
if (!performanceCheck.includes("const MAX_PUBLIC_TOTAL = 230 * 1024")) {
  errors.push("Public asset budget must stay at <= 230 KiB.");
}

if (!playwright.includes("forbidOnly: Boolean(process.env.CI)")) {
  errors.push("Playwright must forbid focused tests in CI.");
}
if (!playwright.includes("failOnFlakyTests: Boolean(process.env.CI)")) {
  errors.push("Playwright must fail CI when a flaky test is detected.");
}
if (!playwright.includes("retries: 0")) {
  errors.push("Freeze tests must not hide instability behind retries.");
}
if (!playwright.includes("detectTestWorkerPolicy")) {
  errors.push("Playwright must use the hardware-aware worker policy.");
}
if (!playwright.includes('VITE_E2E_RUNTIME_QUALITY: "constrained"')) {
  errors.push("Parallel headless E2E must use the constrained production runtime tier.");
}
if (!playwright.includes('trace: process.env.CI ? "retain-on-failure"')) {
  errors.push("CI failures must retain a trace without requiring a retry.");
}
if (!playwright.includes("PLAYWRIGHT_PREBUILT")) {
  errors.push("Playwright must support running against a prebuilt dist artifact.");
}
if (!workerPolicy.includes("os.availableParallelism")) {
  errors.push("Worker policy must use os.availableParallelism().");
}
if (!workerPolicy.includes("memoryWorkerBudget")) {
  errors.push("Worker policy must include a RAM safeguard.");
}

if (packageJson.scripts?.["test:e2e:responsive"]?.includes("--workers=1")) {
  errors.push("Responsive E2E must not be hard-capped to one worker.");
}
if (!packageJson.scripts?.["test:e2e:stability"]?.includes("PLAYWRIGHT_WORKER_CAP=6")) {
  errors.push("Local stability E2E must retain the six-worker performance ceiling.");
}
if (!packageJson.scripts?.["test:e2e:stability:ci"]?.includes("PLAYWRIGHT_WORKERS=1")) {
  errors.push("Each hosted CI stability shard must use one isolated worker.");
}
if (!packageJson.scripts?.["test:e2e:stability:ci"]?.includes("PLAYWRIGHT_PREBUILT=1")) {
  errors.push("CI stability must reuse the single production build.");
}
if (!packageJson.scripts?.["test:e2e:stability:repeat"]?.includes("--repeat-each=10")) {
  errors.push("The local repeat gate must exercise stability ten times.");
}
if (!packageJson.scripts?.["test:e2e:vitals"]?.includes("--workers=1")) {
  errors.push("Web Vitals must remain isolated on one worker for measurement integrity.");
}

if (!ownerFixture.includes("id: 201") || !ownerFixture.includes("id: 203")) {
  errors.push("E2E fixture must contain representative Timeline experiences.");
}
if (!stabilitySpec.includes('test.describe.configure({ mode: "parallel", timeout: 60_000 })')) {
  errors.push("Stability scenarios must remain parallel with a strict scenario budget.");
}
if (!/async\s+function\s+jumpToSection\s*\(\s*page\s*,\s*selector\b/.test(stabilitySpec)) {
  errors.push("Stability spec must use deterministic world-anchor jumps.");
}
for (const gate of [
  "#ocean-transition-deep",
  "#ocean-transition-caldera",
  "#ocean-transition-projects",
  "#ocean-transition-outro",
]) {
  if (!stabilitySpec.includes(`jumpToBiome(page, "${gate}"`)) {
    errors.push(`Biome sequence must reconcile through stable gate ${gate}.`);
  }
}
for (const unstableJump of [
  'jumpToSection(page, "#abyss-volcano-field")',
  'jumpToSection(page, "#projects")',
]) {
  if (stabilitySpec.includes(unstableJump)) {
    errors.push(`Stability world sequencing must not depend on deferred content: ${unstableJump}.`);
  }
}
if (stabilitySpec.includes('scrollIntoView({ block: "center", behavior: "auto" })')) {
  errors.push("Stability spec must not inherit CSS smooth scrolling for world jumps.");
}

if (!stabilitySpec.includes("scrollingElement.scrollTop =")) {
  errors.push("Deterministic world jumps must set the viewport position directly instead of relying on scrollIntoView alignment.");
}
if (!stabilitySpec.includes('"portfolio:ocean-world-reconcile"')) {
  errors.push("Stability jumps must request an explicit synchronous world reconciliation.");
}
if (!stabilitySpec.includes('"data-ocean-director-ready"')) {
  errors.push("Stability tests must wait for the World Director readiness marker before navigation.");
}
if (!stabilitySpec.includes('get: () => 4')) {
  errors.push("Stability tests must emulate the four-core hosted-runner hardware class locally.");
}
if (!stabilitySpec.includes('await selectAnimationMode(page, "Complètes", "full");')) {
  errors.push("Full-world stability scenarios must explicitly activate the full animation profile.");
}
if (stabilitySpec.includes("page.waitForTimeout(")) {
  errors.push("Stability tests must use observable state or frame barriers instead of fixed sleeps.");
}
if (!oceanRegistration.includes('OCEAN_WORLD_RECONCILE_EVENT = "portfolio:ocean-world-reconcile"')) {
  errors.push("Ocean world registration must expose the explicit reconciliation event.");
}
if (!aquarium.includes("OCEAN_WORLD_RECONCILE_EVENT") || !aquarium.includes('dataset.oceanDirectorReady = "true"')) {
  errors.push("World Director must expose readiness and handle explicit reconciliation requests.");
}
if (aquarium.includes("setInterval(selectViewportBiome")) {
  errors.push("World Director must not rely on periodic polling for biome correctness.");
}

for (const anchor of [
  '"ocean-transition-deep"',
  '"ocean-transition-caldera"',
  '"ocean-transition-projects"',
  '"ocean-transition-outro"',
]) {
  if (!oceanEngine.includes(anchor)) errors.push(`Stable world anchor missing from engine: ${anchor}.`);
}
if (!oceanEngine.includes("resolveViewportBiome")) {
  errors.push("World selection must be resolved by the pure viewport-biome function.");
}

if (!workflow.includes("shard: [1, 2, 3, 4, 5, 6]")) {
  errors.push("Hosted stability CI must use six isolated shards.");
}
if (!workflow.includes('PLAYWRIGHT_WORKERS: "1"')) {
  errors.push("Hosted stability shards must isolate each browser worker on its runner.");
}
if (!workflow.includes("--repeat-each=10")) {
  errors.push("Hosted stability CI must repeat each scenario ten times.");
}
if (!workflow.includes('PLAYWRIGHT_PREBUILT: "1"')) {
  errors.push("Hosted E2E jobs must reuse the single production build.");
}
if (!workflow.includes("actions/upload-artifact@v4") || !workflow.includes("name: frontend-dist")) {
  errors.push("The production dist must be uploaded once and reused by browser jobs.");
}

const stabilityCount = (stabilitySpec.match(/\btest\s*\(\s*["'`]@stability/g) ?? []).length;
if (stabilityCount < 4) {
  errors.push(`Stability suite must keep at least four scenarios; found ${stabilityCount}.`);
}
for (const contract of [
  "routes publiques FR/EN",
  "changements rapides de modes d’animation",
  "Timeline autonome",
  "sauts de scroll",
  "biomes du Living Ocean World",
]) {
  if (!stabilitySpec.includes(contract)) errors.push(`Stability scenario missing: ${contract}.`);
}

for (const scanRoot of ["src", "e2e"]) {
  const rootPath = path.join(root, scanRoot);
  const stack = [rootPath];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!/\.(js|jsx)$/.test(entry.name)) continue;
      const content = fs.readFileSync(absolute, "utf8");
      if (/\b(?:test|it|describe)\.only\s*\(|\bfit\s*\(|\bfdescribe\s*\(/.test(content)) {
        errors.push(`Focused test forbidden in ${path.relative(root, absolute)}.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Stability freeze contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Stability freeze contract OK: ${stabilityCount} scenarios, stable world gates, single-build CI, six isolated shards and ten deterministic repetitions.`,
);
