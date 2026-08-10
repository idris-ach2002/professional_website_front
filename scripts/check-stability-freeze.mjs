import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const packageJson = JSON.parse(read("package.json"));
const vite = read("vite.config.js");
const playwright = read("playwright.config.js");
const engine = read("src/animations/timelineInspectionEngine.js");
const timelineCheck = read("scripts/check-timeline-motion.mjs");
const cssCheck = read("scripts/check-css-architecture.mjs");
const performanceCheck = read("scripts/check-performance-budgets.mjs");
const stabilitySpec = read("e2e/stability.spec.js");
const workerPolicy = read("scripts/test-worker-policy.mjs");
const ownerFixture = read("e2e/fixtures/owner.js");
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
  "test:e2e:vitals",
  "ci:verify",
  "ci:freeze",
  "test:workers",
];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing npm script ${script}.`);
}

if (!packageJson.scripts?.build?.includes("check:source-tree") || !packageJson.scripts?.build?.includes("check:stability-freeze") || !packageJson.scripts?.build?.includes("check:runtime-performance") || !packageJson.scripts?.build?.includes("check:front-cost") || !packageJson.scripts?.build?.includes("check:volcano-simulation") || !packageJson.scripts?.build?.includes("check:living-ocean-world")) {
  errors.push("The production build must execute source-tree, stability-freeze, runtime-performance, front-cost, volcano-simulation and living-ocean-world checks.");
}
if (!packageJson.scripts?.["test:e2e"]?.includes("test:e2e:stability")) {
  errors.push("The E2E chain must include the dedicated stability suite.");
}
if (!packageJson.scripts?.["test:e2e:functional"]?.includes("@stability")) {
  errors.push("Functional E2E must exclude @stability to avoid duplicate execution.");
}

if (!engine.includes("0.26 + distance * (mobile ? 0.44 : 0.52)")) {
  errors.push("Approved V21 vehicle speed coefficients are missing.");
}
if (!engine.includes("0.34, mobile ? 0.62 : 0.72")) {
  errors.push("Approved V21 vehicle duration bounds are missing.");
}
if (!timelineCheck.includes("approved V20.9/V21 faster inspection timing envelope")) {
  errors.push("Timeline contract must freeze the approved vehicle timing envelope.");
}

for (const threshold of [
  "statements: 80",
  "branches: 60",
  "functions: 80",
  "lines: 85",
]) {
  if (!vite.includes(threshold)) errors.push(`Coverage threshold missing: ${threshold}.`);
}

if (!cssCheck.includes("const maxGlobalCssBytes = 245_000")) {
  errors.push("V21.24 global CSS freeze must stay at <= 245000 bytes.");
}
if (!cssCheck.includes("const maxImportantCount = 1_300")) {
  errors.push("V21.24 !important freeze must stay at <= 1300 declarations.");
}
if (!performanceCheck.includes("const HARD_INITIAL_JS_BROTLI = 360 * 1024")) {
  errors.push("V21 initial JS hard budget must stay at <= 360 KiB Brotli.");
}
if (!performanceCheck.includes("const TARGET_INITIAL_JS_BROTLI = 350 * 1024")) {
  errors.push("V21 initial JS target must stay at <= 350 KiB Brotli.");
}
if (!performanceCheck.includes("const MAX_PUBLIC_TOTAL = 400 * 1024")) {
  errors.push("Front-cost reset public asset budget must stay at <= 400 KiB.");
}

if (!playwright.includes("forbidOnly: Boolean(process.env.CI)")) {
  errors.push("Playwright must forbid focused tests in CI.");
}
if (!playwright.includes("detectTestWorkerPolicy")) {
  errors.push("Playwright must use the hardware-aware worker policy.");
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
if (packageJson.scripts?.["test:e2e:stability"]?.includes("--workers=1")) {
  errors.push("Stability E2E must not be hard-capped to one worker.");
}
if (!packageJson.scripts?.["test:e2e:vitals"]?.includes("--workers=1")) {
  errors.push("Web Vitals must remain isolated on one worker for measurement integrity.");
}
if (!ownerFixture.includes("id: 201") || !ownerFixture.includes("id: 203")) {
  errors.push("E2E fixture must contain representative Timeline experiences.");
}
const stabilityCount = (stabilitySpec.match(/test\("@stability/g) ?? []).length;
if (stabilityCount < 4) {
  errors.push(`Stability suite must keep at least 4 scenarios; found ${stabilityCount}.`);
}
for (const contract of [
  "routes publiques FR/EN",
  "changements rapides de modes d’animation",
  "Timeline autonome",
  "sauts de scroll",
]) {
  if (!stabilitySpec.includes(contract)) errors.push(`Stability scenario missing: ${contract}.`);
}

const scanRoots = ["src", "e2e"];
for (const scanRoot of scanRoots) {
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
  console.error(`V21 stability freeze failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  "V21.24 stability freeze OK: vehicle timing frozen, runtime governor enforced, coverage thresholds active, source/build budgets tightened, "
  + `${stabilityCount} stability E2E scenarios enforced.`,
);
