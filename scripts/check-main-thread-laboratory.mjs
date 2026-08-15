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
requireText(spec, "toBeLessThanOrEqual(MAX_BLOCKING_DURATION_MS)", "Blocking-duration safety gate missing.");

const mainThreadScript = packageJson.scripts?.["test:e2e:main-thread"] ?? "";
requireText(mainThreadScript, "PLAYWRIGHT_WORKERS=1", "Main-thread lab must force one Playwright worker.");
requireText(mainThreadScript, "--project=chromium", "Main-thread lab must run in Chromium for PerformanceObserver coverage.");
requireText(mainThreadScript, "--workers=1", "Main-thread lab CLI must agree on one worker.");
requireText(packageJson.scripts?.["check:main-thread"] ?? "", "check-main-thread-laboratory.mjs", "Missing check:main-thread contract.");
requireText(packageJson.scripts?.["check:final"] ?? "", "check:main-thread", "Final static hardening must include the main-thread laboratory contract.");
requireText(packageJson.scripts?.["ci:release"] ?? "", "test:e2e:main-thread", "Release gate must execute the main-thread laboratory.");

for (const fragment of [
  "main-thread:",
  "Run Main Thread Laboratory",
  "frontend-main-thread-report",
]) requireText(workflow, fragment, `GitHub Actions main-thread job missing: ${fragment}`);

requireText(guardrails, "Main Thread Laboratory", "Release guardrails must document the Main Thread Laboratory.");
requireText(guardrails, "250 ms", "Release guardrails must document the Long Task safety ceiling.");

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
