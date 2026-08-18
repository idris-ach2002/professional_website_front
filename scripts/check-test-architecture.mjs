import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const errors = [];
const requireText = (source, fragment, message) => {
  if (!source.includes(fragment)) errors.push(message);
};
const forbidText = (source, fragment, message) => {
  if (source.includes(fragment)) errors.push(message);
};
const requireMatch = (source, pattern, message) => {
  if (!pattern.test(source)) errors.push(message);
};
const forbidMatch = (source, pattern, message) => {
  if (pattern.test(source)) errors.push(message);
};

const packageJson = JSON.parse(read("package.json"));
const playwright = read("playwright.config.js");
const vite = read("vite.config.js");
const setup = read("src/test/setup.js");
const runtime = read("e2e/support/runtime-contract.js");
const faultPolicy = read("e2e/support/runtime-fault-policy.js");
const fixtures = read("e2e/support/test-fixtures.js");
const world = read("e2e/support/world-contract.js");
const functional = read("e2e/portfolio.spec.js");
const responsive = read("e2e/responsive.spec.js");
const stability = read("e2e/stability.spec.js");
const runtimeSpec = read("e2e/runtime-intelligence.spec.js");
const missionSpec = read("e2e/mission-control.spec.js");
const transparentSpec = read("e2e/transparent-performance.spec.js");
const vitalsDiagnostic = read("e2e/vitals-diagnostic.spec.js");
const soak = read("e2e/soak.spec.js");
const mainThreadLab = read("e2e/main-thread-laboratory.spec.js");
const mainThreadHelper = read("e2e/support/main-thread-laboratory.js");
const workerPolicy = read("scripts/test-worker-policy.mjs");
const runtimeEnv = read("scripts/check-runtime-env.mjs");
const artifact = read("scripts/e2e-build-artifact.mjs");
const publicSnapshot = read("scripts/public-snapshot.mjs");
const npmrc = read(".npmrc");
const nvmrc = read(".nvmrc").trim();
const ownerFixture = read("e2e/fixtures/owner.js");
const workflowFiles = fs.readdirSync(path.join(root, ".github/workflows"))
  .filter((name) => /\.ya?ml$/.test(name))
  .sort();
const workflow = read(".github/workflows/frontend-ci.yml");

for (const file of [
  "e2e/support/runtime-contract.js",
  "e2e/support/runtime-fault-policy.js",
  "e2e/support/test-fixtures.js",
  "e2e/support/world-contract.js",
  "src/test/runtimeFaultPolicy.test.js",
  "scripts/check-runtime-env.mjs",
  "scripts/check-production-env.mjs",
  "scripts/retire-legacy-workflow.mjs",
  "scripts/check-workflow-yaml.mjs",
  "scripts/e2e-build-artifact.mjs",
]) {
  if (!exists(file)) errors.push(`Missing test architecture file: ${file}.`);
}

const requiredScripts = [
  "ci:migrate",
  "check:runtime-env",
  "check:repo-hygiene",
  "package:source",
  "check:production-env",
  "check:workflow",
  "ci:preflight",
  "test:e2e:functional",
  "test:e2e:browser:ci",
  "ci:browser-contracts",
  "test:e2e:responsive",
  "ci:responsive",
  "test:e2e:stability",
  "test:e2e:stability:ci",
  "test:e2e:concurrency",
  "test:e2e:concurrency:ci",
  "test:e2e:concurrency:smoke",
  "ci:concurrency:hosted",
  "test:e2e:vitals",
  "ci:vitals",
  "test:e2e:soak",
  "test:e2e:main-thread",
  "ci:main-thread",
  "test:e2e:transparent-performance",
  "ci:transparent-performance",
  "test:e2e:soak:ci",
  "test:workers",
  "check:main-thread",
  "test:leaks",
  "e2e:artifact:stamp",
  "e2e:artifact:verify",
  "e2e:artifact:ensure",
  "e2e:artifact:build",
  "ci:quality",
  "ci:verify",
  "ci:freeze",
  "ci:concurrency",
  "ci:diagnostics",
  "ci:soak",
  "ci:full",
  "ci:full:chain",
];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing npm script ${script}.`);
}

requireText(packageJson.scripts?.build ?? "", "check:stability-freeze", "Production build must run the test-architecture freeze gate.");
requireText(packageJson.scripts?.prebuild ?? "", "ci:migrate", "Prebuild must retire the known legacy CI workflow before architecture checks.");
requireText(packageJson.scripts?.["ci:preflight"] ?? "", "check:runtime-env", "ci:preflight must fail fast on an unsupported Node/npm runtime.");
requireText(packageJson.scripts?.["ci:preflight"] ?? "", "check:repo-hygiene", "ci:preflight must reject tracked secrets/generated artefacts.");
requireText(packageJson.scripts?.["ci:preflight"] ?? "", "check:test-architecture", "ci:preflight must validate the test architecture on every standalone gate.");
requireText(packageJson.scripts?.["ci:preflight"] ?? "", "test:workers", "ci:preflight must validate worker policy.");
requireText(packageJson.scripts?.["ci:quality"] ?? "", "ci:preflight", "ci:quality must run the common preflight contract.");
requireText(packageJson.scripts?.["ci:quality"] ?? "", "e2e:artifact:build", "ci:quality must build and stamp one hermetic E2E artifact.");
requireText(packageJson.scripts?.["ci:quality"] ?? "", "test:leaks", "ci:quality must execute the async-leak detector before coverage/build.");
requireText(packageJson.scripts?.["ci:concurrency"] ?? "", "PLAYWRIGHT_WORKERS=4 PLAYWRIGHT_STRESS=1 npm run ci:preflight", "Local concurrency must validate its four-worker hardware precondition before launching browsers.");
requireText(packageJson.scripts?.["ci:concurrency"] ?? "", "ci:preflight", "Standalone concurrency must run the common preflight contract.");
requireText(packageJson.scripts?.["ci:soak"] ?? "", "ci:preflight", "Standalone soak must run the common preflight contract.");
requireText(packageJson.scripts?.["ci:verify"] ?? "", "PLAYWRIGHT_WORKER_CAP=2", "Local ci:verify must use the same hardware-aware worker cap as hosted normal gates.");
requireText(packageJson.scripts?.["ci:verify"] ?? "", "PLAYWRIGHT_PREBUILT=1", "ci:verify must reuse the artifact produced by ci:quality.");
requireText(packageJson.scripts?.["ci:freeze"] ?? "", "test:e2e:concurrency:smoke", "ci:freeze must include one deterministic parallel-isolation smoke gate.");
if (packageJson.scripts?.["ci:full"] !== "CI=1 npm run ci:full:chain") {
  errors.push("ci:full must force CI semantics locally and delegate to the single blocking chain.");
}
for (const diagnostic of ["ci:vitals", "ci:main-thread", "ci:soak"]) {
  forbidText(packageJson.scripts?.["ci:full:chain"] ?? "", diagnostic, `ci:full must not block release on diagnostic experiment ${diagnostic}.`);
}
for (const gate of ["ci:quality", "ci:browser-contracts", "ci:responsive", "ci:concurrency:hosted", "ci:transparent-performance"]) {
  requireText(packageJson.scripts?.["ci:full:chain"] ?? "", `npm run ${gate}`, `ci:full:chain must include deterministic gate ${gate}.`);
}
for (const gate of ["ci:browser-contracts", "ci:responsive", "ci:vitals", "ci:main-thread", "ci:transparent-performance"]) {
  requireText(packageJson.scripts?.[gate] ?? "", "PLAYWRIGHT_PREBUILT=1", `${gate} must reuse the hermetic artifact built by ci:quality.`);
  requireText(packageJson.scripts?.[gate] ?? "", "E2E_ARTIFACT_REQUIRE_PREBUILT=1", `${gate} must reject stale/missing hermetic artifacts.`);
}
requireText(packageJson.scripts?.["ci:diagnostics"] ?? "", "ci:vitals", "ci:diagnostics must expose Web Vitals collection.");
requireText(packageJson.scripts?.["ci:diagnostics"] ?? "", "ci:main-thread", "ci:diagnostics must expose Main Thread collection.");
requireText(packageJson.scripts?.["ci:browser-contracts"] ?? "", "PLAYWRIGHT_WORKER_CAP=2", "ci:browser-contracts must match the hosted browser worker policy.");
requireText(packageJson.scripts?.["ci:responsive"] ?? "", "PLAYWRIGHT_WORKER_CAP=2", "ci:responsive must match the hosted responsive worker policy.");
for (const gate of ["ci:vitals", "ci:main-thread", "ci:transparent-performance"]) requireText(packageJson.scripts?.[gate] ?? "", "PLAYWRIGHT_WORKERS=1", `${gate} must stay isolated to one worker.`);

// Parallel execution is allowed to prove test isolation, but repetition is never
// accepted as evidence of correctness. One deterministic scenario = one verdict.
requireText(packageJson.scripts?.["test:e2e:concurrency"] ?? "", "PLAYWRIGHT_WORKERS=4", "Local concurrency must force four workers.");
requireText(packageJson.scripts?.["test:e2e:concurrency"] ?? "", "--project=chromium", "Local concurrency must isolate parallel execution to Chromium.");
requireText(packageJson.scripts?.["test:e2e:concurrency"] ?? "", "PLAYWRIGHT_STRESS=1", "Local concurrency must exercise the stress instrumentation policy.");
requireText(packageJson.scripts?.["test:e2e:concurrency:ci"] ?? "", "PLAYWRIGHT_WORKERS=2", "Hosted concurrency must use two workers.");
requireText(packageJson.scripts?.["test:e2e:concurrency:ci"] ?? "", "--workers=2", "Hosted concurrency CLI must use exactly two workers.");
requireText(packageJson.scripts?.["test:e2e:concurrency:smoke"] ?? "", "--workers=2", "Freeze concurrency smoke must use exactly two workers.");
for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
  if (command.includes("--repeat-each")) errors.push(`${name} must not use --repeat-each as a correctness gate.`);
}
requireText(packageJson.scripts?.["ci:concurrency:hosted"] ?? "", "ci:preflight", "Hosted concurrency must rerun environment/architecture preconditions on its fresh VM.");
requireText(packageJson.scripts?.["ci:concurrency:hosted"] ?? "", "test:e2e:concurrency:ci", "Hosted concurrency must execute the deterministic two-worker suite.");
requireText(packageJson.scripts?.["ci:concurrency:hosted"] ?? "", "PLAYWRIGHT_PREBUILT=1", "Hosted concurrency must reuse the hermetic artifact.");
requireText(packageJson.scripts?.["ci:concurrency:hosted"] ?? "", "E2E_ARTIFACT_REQUIRE_PREBUILT=1", "Hosted concurrency must reject stale/missing artifacts.");
requireText(packageJson.scripts?.["test:e2e:browser:ci"] ?? "", "PLAYWRIGHT_WORKER_CAP=2", "Cross-browser CI contracts must use the hardware-aware two-worker cap.");
requireText(packageJson.scripts?.["test:e2e:stability:ci"] ?? "", "PLAYWRIGHT_WORKER_CAP=2", "Cross-browser CI stability must use the hardware-aware two-worker cap.");
requireText(packageJson.scripts?.["test:e2e:soak:ci"] ?? "", "PLAYWRIGHT_WORKERS=1", "Soak config and CLI must agree on one worker.");
requireText(packageJson.scripts?.["test:e2e:soak:ci"] ?? "", "--workers=1", "Soak must remain a single-browser single-worker endurance test.");
requireText(packageJson.scripts?.["test:e2e:vitals"] ?? "", "e2e/vitals-diagnostic.spec.js", "Web Vitals must live in a dedicated diagnostic spec.");
requireText(packageJson.scripts?.["test:e2e:vitals"] ?? "", "--workers=1", "Web Vitals diagnostics must remain isolated on one worker.");
requireText(packageJson.scripts?.["test:e2e:main-thread"] ?? "", "--workers=1", "Main Thread diagnostics must remain isolated on one worker.");
requireText(packageJson.scripts?.["test:e2e:main-thread"] ?? "", "--project=chromium", "Main Thread diagnostics require Chromium PerformanceObserver coverage.");
requireText(packageJson.scripts?.["test:e2e:transparent-performance"] ?? "", "--project=chromium", "Transparent performance smoke requires Chromium instrumentation.");
requireText(packageJson.scripts?.["test:e2e:responsive"] ?? "", "--project=chromium", "Responsive matrix must run once in Chromium instead of duplicating layout checks cross-browser.");

for (const threshold of ["statements: 82", "branches: 70", "functions: 85", "lines: 84"]) {
  requireText(vite, threshold, `Coverage threshold missing: ${threshold}.`);
}
for (const contract of [
  "pool: 'forks'",
  "isolate: true",
  "fileParallelism: true",
  "maxWorkers:",
  "concurrent: false",
  "hooks: 'stack'",
  "restoreMocks: true",
  "clearMocks: true",
  "mockReset: true",
]) {
  requireText(vite, contract, `Vitest isolation contract missing: ${contract}.`);
}
requireText(setup, "beforeEach", "Vitest setup must recreate mutable browser state before every test.");
requireText(setup, "afterEach", "Vitest setup must clean mutable browser state after every test.");
requireText(setup, "vi.unstubAllGlobals()", "Vitest setup must remove stubbed globals after every test.");
requireText(setup, "vi.useRealTimers()", "Vitest setup must restore real timers after every test.");

for (const contract of [
  "fullyParallel: true",
  "retries: 0",
  "forbidOnly: Boolean(process.env.CI)",
  'trace: metricsMode || soakMode ? "off" : "retain-on-failure"',
  'serviceWorkers: "block"',
  "metricsMode || soakMode",
  "--strictPort",
  "reuseExistingServer: false",
  "detectTestWorkerPolicy",
  "assertTestWorkerEnvironment",
  "assertRuntimeEnvironment",
  "e2e-build-artifact.mjs ensure",
]) {
  requireText(playwright, contract, `Playwright contract missing: ${contract}.`);
}
requireText(playwright, 'video: stressMode || soakMode || metricsMode ? "off" : "retain-on-failure"', "Stress/soak/metrics runs must avoid video encoder contention.");
requireText(artifact, "VITE_E2E_RUNTIME_QUALITY", "Hermetic E2E artifact profile must pin runtime quality.");

for (const contract of [
  "os.availableParallelism",
  "cpuWorkerBudget",
  "memoryWorkerBudget",
  "resolveWorkerBudget",
  "explicitWorkers",
  "assertTestWorkerEnvironment",
  "stress concurrency requires at least 2 workers",
  "stress concurrency must not oversubscribe logical CPUs",
  "stress concurrency must declare PLAYWRIGHT_WORKERS explicitly",
  "assertTestWorkerEnvironment(policy);",
]) {
  requireText(workerPolicy, contract, `Worker policy contract missing: ${contract}.`);
}
requireText(ownerFixture, "id: 201", "E2E fixture must contain representative Timeline data.");
requireText(ownerFixture, "id: 203", "E2E fixture must contain representative Timeline data.");

for (const contract of [
  "installHermeticNetworkContract",
  "GOOGLE_FONTS_CSS_ROUTE",
  "GOOGLE_FONTS_BINARY_ROUTE",
  "CLOUDINARY_ASSET_ROUTE",
  "external-network",
  'route.abort("blockedbyclient")',
  "installPublicApiContract",
  "forceHostedRunnerBrowserHardwareFloor",
  'get: () => 2',
  'page.on("pageerror"',
  'page.on("requestfailed"',
  'page.on("response"',
  "allowHttpResponse",
  'page.on("crash"',
  'page.on("close"',
  "runtime.dispose()",
  "probeHtml",
  "installRuntimeWatchdogContract",
  "RUNTIME_WATCHDOG_KEY",
  "longTaskCount",
]) {
  requireText(runtime + fixtures, contract, `Shared E2E runtime contract missing: ${contract}.`);
}
requireText(faultPolicy, "NS_BINDING_ABORTED", "Firefox cancellation must be classified explicitly.");
requireText(faultPolicy, 'severity: "diagnostic"', "Browser cancellations must remain diagnostics, not fatal application faults.");
requireText(faultPolicy, 'severity: "fatal"', "Unknown network failures must remain fatal.");
requireText(fixtures, "{ auto: true }", "Runtime/network guard must be an automatic Playwright fixture.");
requireText(fixtures, "testInfo.errors.length === 0", "Automatic fixture must preserve the primary test failure.");
for (const contract of [
  "long-animation-frame",
  "eventLoopDelays",
  "rankMainThreadHotspot",
]) {
  requireText(mainThreadHelper + mainThreadLab, contract, `Main Thread Laboratory contract missing: ${contract}.`);
}
requireText(mainThreadLab, "main-thread-laboratory.json", "Main Thread Laboratory must attach a machine-readable JSON report.");
requireText(mainThreadLab, "investigate-offscreen-canvas-worker", "Main Thread Laboratory must identify OffscreenCanvas Worker candidates rather than workerizing blindly.");
requireText(runtime, "Single-flight bounded renderer probe", "Renderer liveness probes must remain single-flight.");
requireText(runtime, "page.evaluate(probe, arg)", "Renderer liveness must use direct page evaluation instead of Locator actionability.");
forbidText(runtime, 'locator("html").evaluate', "Renderer liveness probes must not depend on locating <html> before evaluation.");
requireText(runtime, "deadlineMs = PROBE_DEADLINE_MS", "Renderer probes must use one explicit bounded liveness deadline.");
forbidText(runtime, "PROBE_ATTEMPT_TIMEOUT_MS", "Renderer liveness must not reintroduce short retry attempts.");
forbidText(runtime, "while (Date.now() - startedAt < deadlineMs)", "Renderer probes must not queue repeated evaluate calls behind a saturated main thread.");

for (const contract of [
  "reconcileWorldAtAnchor",
  'root.style.setProperty("scroll-behavior", "auto", "important")',
  '"portfolio:ocean-world-reconcile"',
  "getBoundingClientRect()",
  "scrollError",
  "centerError",
]) {
  requireText(world, contract, `World navigation contract missing: ${contract}.`);
}

const blockingE2eSpecs = [
  ["portfolio.spec.js", functional],
  ["responsive.spec.js", responsive],
  ["stability.spec.js", stability],
  ["runtime-intelligence.spec.js", runtimeSpec],
  ["mission-control.spec.js", missionSpec],
  ["transparent-performance.spec.js", transparentSpec],
];
for (const [name, source] of blockingE2eSpecs) {
  requireText(source, 'from "./support/test-fixtures"', `${name} must use the shared automatic fixture.`);
  forbidText(source, 'from "@playwright/test"', `${name} must not bypass the shared E2E fixture.`);
  forbidText(source, "page.waitForTimeout(", `${name} must use causal postconditions instead of fixed sleeps.`);
  forbidText(source, "expect.poll(", `${name} must not poll until a scheduler-dependent state becomes favorable.`);
  forbidText(source, "page.mouse.wheel(", `${name} must not use wheel timing as proof of a functional state transition.`);
  forbidText(source, "requestAnimationFrame(", `${name} must not predict paint cadence in a blocking browser gate.`);
  forbidText(source, 'waitUntil: "networkidle"', `${name} must not use networkidle as an application readiness signal.`);
  forbidText(source, "unrouteAll(", `${name} must not destroy shared hermetic routing contracts.`);
}

const deterministicUnitFiles = fs.readdirSync(path.join(root, "src"), { recursive: true })
  .filter((entry) => /\.test\.(?:js|jsx|ts|tsx)$/.test(String(entry)))
  .map((entry) => {
    const relative = `src/${String(entry).replaceAll("\\", "/")}`;
    return [relative, read(relative)];
  });

for (const [name, source] of deterministicUnitFiles) {
  forbidMatch(source, /Date\.now\s*\(/, `${name} must use a fixed test instant instead of the wall clock.`);
  forbidMatch(source, /new\s+Promise\s*\([^)]*=>[\s\S]{0,120}setTimeout\s*\(/, `${name} must not sleep to let asynchronous work settle.`);
  forbidMatch(source, /new\s+Promise\s*\([^)]*=>[\s\S]{0,160}requestAnimationFrame\s*\(/, `${name} must control RAF explicitly instead of waiting for real paint frames.`);
  forbidMatch(source, /\bwaitFor\s*\(/, `${name} must use an explicit async barrier instead of Testing Library polling.`);
  forbidMatch(source, /\.findBy[A-Z][A-Za-z0-9_]*\s*\(/, `${name} must use explicit controlled completion before synchronous getBy assertions.`);
}

for (const [name, source] of [["soak.spec.js", soak], ["vitals-diagnostic.spec.js", vitalsDiagnostic]]) {
  requireText(source, 'from "./support/test-fixtures"', `${name} must use the shared automatic fixture.`);
  forbidText(source, 'from "@playwright/test"', `${name} must not bypass the shared E2E fixture.`);
}

requireMatch(stability, /test\.describe\.configure\(\{\s*mode:\s*"parallel"[\s\S]*?timeout:\s*\d[\d_]*\s*\}\)/, "Stability scenarios must be explicitly parallel with a bounded scenario timeout.");
requireText(stability, "expectWorldBiome", "Stability world sequencing must use the shared deterministic anchor contract.");
requireText(stability, 'presetAnimationRuntime(page, { preference: "full", paused: true })', "Timeline stability must use an explicit paused precondition instead of racing IntersectionObserver/scroll timing.");
requireText(stability, 'data-timeline-scene", "paused"', "Timeline stability must assert the causal paused-state postcondition.");
forbidText(stability, "captureRuntimeFaults", "Stability specs must rely on the automatic runtime fixture.");
forbidText(stability, "setTimeout(", "Stability scenarios must not contain fixed-duration sleeps.");
forbidText(stability, "page.mouse.wheel(", "Timeline stability must not infer direction from scheduler-sensitive wheel timing.");
forbidText(world, "requestAnimationFrame(", "World navigation must use geometry reads plus explicit reconciliation, not paint-frame prediction.");

for (const contract of [
  "runtimeGuard",
  "assertNoRuntimeFaults",
  "probeHtml",
  "REQUIRED_RUNTIME_IDS",
  "reconcileWorldAtAnchor",
  "holdSessionFor",
  "SOAK_HEARTBEAT_MS",
  "observeEnduranceWindow",
  "readHeartbeatSnapshot",
  "readStructureSnapshot",
  "SOAK_STRUCTURE_EVERY",
  "RUNTIME_WATCHDOG_KEY",
  "soak-failure.json",
  "SOAK_TOTAL_TIMEOUT_MS",
]) {
  requireText(soak, contract, `Soak invariant contract missing: ${contract}.`);
}
forbidText(soak, "waitForWorldQuiescence", "Soak must not depend on synthetic quiescence states that are not a public runtime contract.");
forbidText(soak, "#abyss-volcano-field", "Soak must not require lazy volcano internals; traversal belongs to @stability.");
forbidText(soak, "data-mine-active", "Soak must not depend on test-only mine lifecycle markers.");
forbidText(soak, 'page.on("', "Soak must not own low-level browser listeners; the automatic runtime fixture owns them.");
forbidText(soak, "scrollIntoView(", "Soak must navigate only through persistent deterministic anchors.");

const responsiveCases = (responsive.match(/name:\s*"\d+x\d+"/g) ?? []).length;
if (responsiveCases !== 9) errors.push(`Responsive matrix must retain 9 viewports; found ${responsiveCases}.`);
forbidText(functional, "@vitals", "Functional browser contracts must not contain hardware-dependent Web Vitals gates.");
requireText(vitalsDiagnostic, "@vitals", "Dedicated Web Vitals diagnostic scenario missing.");
requireText(vitalsDiagnostic, "[vitals][diagnostic]", "Web Vitals thresholds must be reported as diagnostics.");
requireText(functional, "page.route(\"**/website/default**\"", "API fallback test must override only its page-level route.");
requireText(functional, "allowHttpResponse", "Expected HTTP failures must be explicitly declared by the scenario.");
requireText(faultPolicy, "classifyConsoleError", "Runtime fault policy must distinguish browser-generated resource console noise from application console errors.");

if (nvmrc !== "22.16.0") errors.push(`.nvmrc must pin 22.16.0; found ${nvmrc}.`);
requireText(npmrc, "engine-strict=true", ".npmrc must reject unsupported Node/npm engines during npm ci.");
requireText(packageJson.engines?.node ?? "", ">=22.16 <23", "package engines must pin the Node 22 CI major.");
requireText(packageJson.engines?.npm ?? "", ">=10.9 <11", "package engines must pin the npm 10 CI major.");
requireText(packageJson.packageManager ?? "", "npm@10.9.2", "packageManager must document the CI npm toolchain.");
requireText(packageJson.scripts?.["ci:quality"] ?? "", "VITEST_WORKERS=2", "ci:quality must use the two-process hosted-safe Vitest reference budget.");
requireText(vite, "maxWorkers: Number(process.env.VITEST_WORKERS || 2)", "Vitest must use an explicit hosted-safe worker budget instead of host-dependent percentages.");
for (const contract of ["REQUIRED_NODE_MAJOR = 22", "MIN_NODE_MINOR = 16", "REQUIRED_NPM_MAJOR = 10", "spawnSync", "npm introuvable", "assertRuntimeEnvironment"]) {
  requireText(runtimeEnv, contract, `Runtime environment contract missing: ${contract}.`);
}
for (const contract of [
  "REQUIRED_BUILD_PROFILE",
  "E2E_HERMETIC_BUILD",
  "VITE_E2E_RUNTIME_QUALITY",
  "VITE_ANALYTICS_DISABLED",
  "VITE_PUBLIC_SITE_URL",
  "VITE_API_BASE_URL",
  "schema: 2",
  "ensureStamp",
  "PLAYWRIGHT_PREBUILT",
]) {
  requireText(artifact, contract, `E2E artifact contract missing: ${contract}.`);
}
const viteRuntimeKeys = new Set();
const collectViteRuntimeKeys = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectViteRuntimeKeys(absolute);
    else if (/\.(?:js|jsx)$/.test(entry.name)) {
      const source = fs.readFileSync(absolute, "utf8");
      for (const match of source.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)) viteRuntimeKeys.add(match[1]);
    }
  }
};
collectViteRuntimeKeys(path.join(root, "src"));
for (const key of viteRuntimeKeys) {
  requireText(artifact, `${key}:`, `Hermetic E2E build profile does not pin runtime env key ${key}.`);
}

requireText(publicSnapshot, "HERMETIC_E2E_BUILD", "Static snapshot generator must support a network-free E2E build mode.");
requireText(publicSnapshot, "e2e-hermetic-demo", "Hermetic static snapshot must use deterministic demo data.");
requireText(publicSnapshot, "2000-01-01T00:00:00.000Z", "Hermetic static snapshot must use a deterministic timestamp.");

const allTestFiles = [];
const collectTests = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectTests(absolute);
    else if (/\.(?:test|spec)\.(?:js|jsx)$/.test(entry.name)) allTestFiles.push(absolute);
  }
};
collectTests(path.join(root, "src"));
collectTests(path.join(root, "e2e"));
if (allTestFiles.length < 20) errors.push(`Test inventory unexpectedly shrank: expected at least 20 test/spec files, found ${allTestFiles.length}.`);
for (const absolute of allTestFiles) {
  const source = fs.readFileSync(absolute, "utf8");
  const relative = path.relative(root, absolute);
  forbidText(source, ".only(", `${relative} must never commit focused .only tests.`);
  forbidText(source, "Math.random(", `${relative} must not introduce nondeterministic randomness; use an explicit seed.`);
  forbidText(source, ".concurrent(", `${relative} must use file/process isolation rather than intra-file shared-state concurrency.`);
}

if (workflowFiles.length !== 1 || workflowFiles[0] !== "frontend-ci.yml") {
  errors.push(`GitHub Actions must have one authoritative frontend workflow after migration; found: ${workflowFiles.join(", ")}.`);
}
for (const contract of [
  "runs-on: ubuntu-24.04",
  "Quality and hermetic E2E build",
  "name: frontend-e2e-dist",
  "Browser contracts",
  "Responsive matrix",
  "Deterministic parallel isolation",
  "Web Vitals diagnostic",
  "Main Thread diagnostic",
  "Transparent performance contract",
  "Runtime soak",
  "Deploy Cloudflare",
  "npm run ci:browser-contracts",
  "npm run ci:responsive",
  "npm run ci:concurrency:hosted",
  "npm run ci:vitals",
  "npm run ci:main-thread",
  "npm run ci:transparent-performance",
  "npm run ci:soak",
  "PLAYWRIGHT_PREBUILT: \"1\"",
  "E2E_ARTIFACT_REQUIRE_PREBUILT: \"1\"",
]) {
  requireText(workflow, contract, `GitHub Actions contract missing: ${contract}.`);
}
for (const actionName of ["upload-artifact", "download-artifact"]) {
  const majors = [...workflow.matchAll(new RegExp(`actions/${actionName}@v(\\d+)`, "g"))]
    .map((match) => Number(match[1]));
  if (majors.length === 0) {
    errors.push(`GitHub Actions contract missing: actions/${actionName}.`);
  } else if (majors.some((major) => !Number.isInteger(major) || major < 4)) {
    errors.push(`GitHub Actions ${actionName} must use artifact protocol v4 or newer; found majors: ${majors.join(", ")}.`);
  }
}

forbidText(workflow.split("  deploy:")[0], "VITE_E2E_RUNTIME_QUALITY:", "E2E runtime quality must not be a workflow-global env inherited by production.");
forbidText(workflow.split("  deploy:")[0], "VITE_ANALYTICS_DISABLED:", "Analytics disabling must not be a workflow-global env inherited by production.");
requireText(workflow, "E2E_ARTIFACT_REQUIRE_PREBUILT: \"1\"", "GitHub E2E jobs must reject missing/stale downloaded artifacts instead of rebuilding silently.");
requireMatch(
  workflow,
  /concurrency-contract:[\s\S]*?PLAYWRIGHT_WORKERS:\s*"2"[\s\S]*?npm run ci:concurrency:hosted/,
  "GitHub concurrency must target the 2-worker standard hosted-runner floor without oversubscribing private-repository VMs.",
);
requireMatch(workflow, /vitals:[\s\S]*?continue-on-error:\s*true/, "Web Vitals must be a non-blocking diagnostic job.");
requireMatch(workflow, /main-thread:[\s\S]*?continue-on-error:\s*true/, "Main Thread Laboratory must be a non-blocking diagnostic job.");
requireMatch(workflow, /verify:[\s\S]*?needs:\s*\[browser-contracts, responsive, concurrency-contract, transparent-performance\]/, "verify must depend only on deterministic blocking jobs.");
forbidText(workflow.match(/verify:[\s\S]*?(?=\n  soak:)/)?.[0] ?? "", "vitals", "verify must not depend on Web Vitals diagnostics.");
forbidText(workflow.match(/verify:[\s\S]*?(?=\n  soak:)/)?.[0] ?? "", "main-thread", "verify must not depend on Main Thread diagnostics.");

for (const contract of [
  'SOAK_DURATION_MS: "60000"',
  'SOAK_HEARTBEAT_MS: "5000"',
  'SOAK_STRUCTURE_EVERY: "3"',
]) {
  requireText(workflow, contract, `GitHub soak experiment must pin ${contract}.`);
}
requireText(workflow, "npm run check:production-env", "Deploy must assert that no E2E build profile leaked into production.");
requireMatch(workflow, /concurrency:\s*[\s\S]*?group:\s*frontend-\$\{\{ github\.workflow \}\}-\$\{\{ github\.ref \}\}[\s\S]*?cancel-in-progress:\s*true/, "Workflow must cancel obsolete runs only within the same workflow/ref.");
requireMatch(workflow, /soak:[\s\S]*?if:\s*github\.event_name == 'workflow_dispatch'/, "Soak must be manual/diagnostic and must not block routine push CI.");
requireMatch(workflow, /deploy:[\s\S]*?needs:\s*verify/, "Production deployment must depend on the reliable freeze gate, not on diagnostic soak.");

if (errors.length > 0) {
  console.error("Test architecture contract failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  "Test architecture OK: hermetic fixtures, observable pre/postconditions, isolated browser contexts, "
  + "pinned Node/npm runtime, hermetic build+browser network, hardware-aware worker caps, deterministic parallel-isolation gates without repeat-each, "
  + "single-flight soak plus non-blocking vitals/main-thread diagnostics, and one authoritative CI/CD workflow.",
);
