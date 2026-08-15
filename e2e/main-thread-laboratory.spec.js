import process from "node:process";
import { expect, test } from "./support/test-fixtures";
import { CONTRACT_TIMEOUT_MS, openPortfolioContract } from "./support/runtime-contract";
import { reconcileWorldAtAnchor } from "./support/world-contract";
import {
  beginMainThreadSample,
  endMainThreadSample,
  installMainThreadLaboratory,
  rankMainThreadHotspot,
  settleMainThreadSample,
  summarizeMainThreadSnapshot,
} from "./support/main-thread-laboratory";

function positiveNumberEnv(name, fallback) {
  const parsed = Number.parseFloat(process.env[name] ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SAMPLE_MS = Math.max(800, positiveNumberEnv("MAIN_THREAD_SAMPLE_MS", 1_400));
const MAX_LONG_TASK_MS = positiveNumberEnv("MAIN_THREAD_MAX_LONG_TASK_MS", 250);
const MAX_LOAF_MS = positiveNumberEnv("MAIN_THREAD_MAX_LOAF_MS", 320);
const MAX_EVENT_LOOP_DELAY_MS = positiveNumberEnv("MAIN_THREAD_MAX_EVENT_LOOP_DELAY_MS", 220);
const MAX_BLOCKING_DURATION_MS = positiveNumberEnv("MAIN_THREAD_MAX_BLOCKING_DURATION_MS", 180);
const MAX_P99_FRAME_MS = positiveNumberEnv("MAIN_THREAD_MAX_P99_FRAME_MS", 120);
const MAX_DROPPED_FRAME_RATIO = positiveNumberEnv("MAIN_THREAD_MAX_DROPPED_FRAME_RATIO", 0.45);
const INITIAL_WARMUP_MS = Math.max(1_200, positiveNumberEnv("MAIN_THREAD_INITIAL_WARMUP_MS", 1_400));
const STEADY_SETTLE_MS = Math.max(150, positiveNumberEnv("MAIN_THREAD_STEADY_SETTLE_MS", 300));
const TEST_TIMEOUT_MS = Math.round(95_000 + SAMPLE_MS * 7 + INITIAL_WARMUP_MS);

const SECTION_PLAN = [
  { label: "profile", selector: "#profile", kind: "steady", workerCandidate: "none" },
  { label: "timeline", selector: "#timeline", kind: "steady", workerCandidate: "none" },
  { label: "caldera-transition", selector: "#ocean-transition-caldera", kind: "transition", workerCandidate: "offscreen-canvas" },
  { label: "volcano", selector: "#abyss-volcano-field", kind: "steady", workerCandidate: "offscreen-canvas" },
  { label: "projects-transition", selector: "#ocean-transition-projects", kind: "transition", workerCandidate: "offscreen-canvas" },
  { label: "projects", selector: "#projects", kind: "steady", workerCandidate: "none" },
  { label: "outro-transition", selector: "#ocean-transition-outro", kind: "transition", align: "end", workerCandidate: "offscreen-canvas" },
];

async function warmTarget(page, item) {
  if (item.label === "volcano") {
    await reconcileWorldAtAnchor(page, "#ocean-transition-caldera", {
      reason: "main-thread-lab-volcano-warmup",
      timeout: CONTRACT_TIMEOUT_MS,
    });
    await expect(page.locator("#abyss-volcano-field"), "volcan chargé avant mesure")
      .toBeAttached({ timeout: CONTRACT_TIMEOUT_MS * 2 });
  }

  await reconcileWorldAtAnchor(page, item.selector, {
    reason: `main-thread-lab-warmup-${item.label}`,
    timeout: CONTRACT_TIMEOUT_MS,
  });

  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function measureSteadyState(page, item) {
  await warmTarget(page, item);
  await settleMainThreadSample(page, STEADY_SETTLE_MS);
  await beginMainThreadSample(page, item.label);
  await settleMainThreadSample(page, SAMPLE_MS);
  return summarizeMainThreadSnapshot(await endMainThreadSample(page));
}

async function measureTransition(page, item) {
  await beginMainThreadSample(page, item.label);
  await reconcileWorldAtAnchor(page, item.selector, {
    align: item.align ?? "center",
    reason: `main-thread-lab-transition-${item.label}`,
    timeout: CONTRACT_TIMEOUT_MS,
  });
  await settleMainThreadSample(page, SAMPLE_MS);
  return summarizeMainThreadSnapshot(await endMainThreadSample(page));
}

function recommendationFor(item, summary, hotspotScore) {
  const pressured = hotspotScore >= 1
    || summary.maxLongTaskMs >= 100
    || summary.maxBlockingDurationMs >= 80
    || summary.maxEventLoopDelayMs >= 100
    || (summary.maxLongAnimationFrameMs >= 160 && summary.maxBlockingDurationMs >= 50);

  if (!pressured) return "keep-current-runtime";
  if (item.workerCandidate === "offscreen-canvas") return "investigate-offscreen-canvas-worker";
  return "profile-main-thread-before-worker";
}

test("@main-thread cartographie les goulets d'étranglement du thread principal", async ({ context, page }, testInfo) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await installMainThreadLaboratory(context);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("portfolio-animation-preference", "full");
      localStorage.setItem("portfolio-animation-paused", "false");
    } catch {
      // The E2E origin supports storage; this remains best-effort for portability.
    }
  });

  await openPortfolioContract(page, "fr");
  await expect(page.locator("html")).toHaveAttribute("data-runtime-quality", /^(high|balanced|constrained)$/);

  // Ne pas attribuer au profil le coût de bootstrap, des fonts ou de l'intro signature.
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await settleMainThreadSample(page, INITIAL_WARMUP_MS);

  const runtime = await page.evaluate(() => ({
    quality: document.documentElement.dataset.runtimeQuality ?? null,
    profile: document.documentElement.dataset.runtimeProfile ?? null,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory ?? null,
  }));

  const sections = [];
  for (const item of SECTION_PLAN) {
    const summary = item.kind === "transition"
      ? await measureTransition(page, item)
      : await measureSteadyState(page, item);
    const hotspotScore = rankMainThreadHotspot(summary);
    sections.push({
      ...summary,
      hotspotScore,
      workerCandidate: item.workerCandidate,
      recommendation: recommendationFor(item, summary, hotspotScore),
    });
  }

  const ranked = [...sections].sort((a, b) => b.hotspotScore - a.hotspotScore);
  const report = {
    schema: 1,
    sampledAt: new Date().toISOString(),
    runtime,
    budgets: {
      sampleMs: SAMPLE_MS,
      maxLongTaskMs: MAX_LONG_TASK_MS,
      maxLongAnimationFrameMs: MAX_LOAF_MS,
      maxEventLoopDelayMs: MAX_EVENT_LOOP_DELAY_MS,
      maxBlockingDurationMs: MAX_BLOCKING_DURATION_MS,
      diagnosticP99FrameMs: MAX_P99_FRAME_MS,
      diagnosticDroppedFrameRatio: MAX_DROPPED_FRAME_RATIO,
      initialWarmupMs: INITIAL_WARMUP_MS,
      steadySettleMs: STEADY_SETTLE_MS,
    },
    sections,
    rankedHotspots: ranked.map(({ label, hotspotScore, recommendation }) => ({ label, hotspotScore, recommendation })),
    topCandidate: ranked[0]?.label ?? null,
  };

  console.log("\n=== MAIN THREAD LABORATORY ===");
  console.table(sections.map((section) => ({
    section: section.label,
    p95: section.p95FrameMs,
    p99: section.p99FrameMs,
    longTask: section.maxLongTaskMs,
    loaf: section.maxLongAnimationFrameMs,
    eventLoop: section.maxEventLoopDelayMs,
    blocking: section.maxBlockingDurationMs,
    frames: section.frameSamples,
    dropped: section.droppedFrameRatio,
    score: section.hotspotScore,
    recommendation: section.recommendation,
  })));
  console.log(`Top hotspot: ${report.topCandidate ?? "none"}`);

  await testInfo.attach("main-thread-laboratory.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });

  for (const section of sections) {
    expect(
      section.maxLongTaskMs,
      `${section.label}: Long Task > ${MAX_LONG_TASK_MS} ms`,
    ).toBeLessThanOrEqual(MAX_LONG_TASK_MS);
    expect(
      section.maxLongAnimationFrameMs,
      `${section.label}: Long Animation Frame > ${MAX_LOAF_MS} ms`,
    ).toBeLessThanOrEqual(MAX_LOAF_MS);
    expect(
      section.maxEventLoopDelayMs,
      `${section.label}: event-loop delay > ${MAX_EVENT_LOOP_DELAY_MS} ms`,
    ).toBeLessThanOrEqual(MAX_EVENT_LOOP_DELAY_MS);
    expect(
      section.maxBlockingDurationMs,
      `${section.label}: blocking duration > ${MAX_BLOCKING_DURATION_MS} ms`,
    ).toBeLessThanOrEqual(MAX_BLOCKING_DURATION_MS);
    expect(
      section.frameSamples,
      `${section.label}: RAF collector produced too few diagnostic samples`,
    ).toBeGreaterThanOrEqual(3);
    // p95/p99/dropped restent diagnostiques: Chromium headless peut réduire la
    // cadence de paint sans que le thread JS soit bloqué. Les gates CPU fiables
    // sont Long Task, LoAF/blockingDuration et event-loop delay.
  }
});
