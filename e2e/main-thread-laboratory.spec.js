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
const TEST_TIMEOUT_MS = Math.round(165_000 + SAMPLE_MS * 7 + INITIAL_WARMUP_MS);

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
  await warmTransitionStart(page, item);
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
    || (summary.maxLongAnimationFrameMs >= 160 && summary.maxBlockingDurationMs >= 50);

  if (!pressured) return "keep-current-runtime";
  if (item.workerCandidate === "offscreen-canvas") return "investigate-offscreen-canvas-worker";
  return "profile-main-thread-before-worker";
}

async function prepareLaboratoryPage(page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await openPortfolioContract(page, "fr");

  await expect(page.locator("html"))
    .toHaveAttribute("data-runtime-quality", /^(high|balanced|constrained)$/);

  await expect(
    page.locator("html"),
    "profil d'animation full requis par le laboratoire",
  ).toHaveAttribute(
    "data-performance-profile",
    "full",
    { timeout: CONTRACT_TIMEOUT_MS * 2 },
  );

  for (const selector of [
    "#profile",
    "#timeline",
    "#ocean-transition-caldera",
    "#ocean-transition-projects",
    "#projects",
    "#ocean-transition-outro",
  ]) {
    await expect(
      page.locator(selector),
      `précondition laboratoire: ${selector}`,
    ).toBeAttached({
      timeout: CONTRACT_TIMEOUT_MS * 2,
    });
  }

  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });

  await settleMainThreadSample(page, INITIAL_WARMUP_MS);
}

async function warmTransitionStart(page, item) {
  let sourceSelector = null;

  if (item.label === "caldera-transition") {
    sourceSelector = "#timeline";
  } else if (item.label === "projects-transition") {
    await reconcileWorldAtAnchor(page, "#ocean-transition-caldera", {
      reason: "main-thread-lab-projects-volcano-bootstrap",
      timeout: CONTRACT_TIMEOUT_MS,
    });

    await expect(
      page.locator("#abyss-volcano-field"),
      "volcan chargé avant transition projets",
    ).toBeAttached({
      timeout: CONTRACT_TIMEOUT_MS * 2,
    });

    sourceSelector = "#abyss-volcano-field";
  } else if (item.label === "outro-transition") {
    sourceSelector = "#projects";
  }

  if (!sourceSelector) return;

  await reconcileWorldAtAnchor(page, sourceSelector, {
    reason: `main-thread-lab-pre-${item.label}`,
    timeout: CONTRACT_TIMEOUT_MS,
  });

  // DOE fresh,host,1,0:
  // première traversée hors échantillon pour absorber
  // l'initialisation froide de la transition.
  await reconcileWorldAtAnchor(page, item.selector, {
    align: item.align ?? "center",
    reason: `main-thread-lab-warm-${item.label}`,
    timeout: CONTRACT_TIMEOUT_MS,
  });

  await settleMainThreadSample(
    page,
    INITIAL_WARMUP_MS,
  );

  // Retour au point précédant la transition.
  await reconcileWorldAtAnchor(page, sourceSelector, {
    reason: `main-thread-lab-return-${item.label}`,
    timeout: CONTRACT_TIMEOUT_MS,
  });

  await settleMainThreadSample(
    page,
    STEADY_SETTLE_MS,
  );
}

const MEASUREMENT_ROUNDS = 3;

function median(values) {
  const ordered = values
    .map((value) => Number(value ?? 0))
    .sort((a, b) => a - b);

  if (ordered.length === 0) return 0;

  return ordered[Math.floor(ordered.length / 2)];
}

function medianMetric(samples, key) {
  return median(
    samples.map((sample) => sample[key]),
  );
}

function aggregateSection(item, samples) {
  const summary = {
    label: item.label,

    durationMs:
      medianMetric(samples, "durationMs"),

    // Structural invariant:
    // every individual round must already have >=3.
    // Keep the worst sample count in the aggregate report.
    frameSamples: Math.min(
      ...samples.map(
        (sample) => Number(sample.frameSamples ?? 0),
      ),
    ),

    p50FrameMs:
      medianMetric(samples, "p50FrameMs"),

    p95FrameMs:
      medianMetric(samples, "p95FrameMs"),

    p99FrameMs:
      medianMetric(samples, "p99FrameMs"),

    droppedFrameRatio:
      medianMetric(samples, "droppedFrameRatio"),

    longTaskSupported: samples.every(
      (sample) => sample.longTaskSupported !== false,
    ),

    longTaskCount:
      medianMetric(samples, "longTaskCount"),

    longTaskTotalMs:
      medianMetric(samples, "longTaskTotalMs"),

    maxLongTaskMs:
      medianMetric(samples, "maxLongTaskMs"),

    loafSupported: samples.every(
      (sample) => sample.loafSupported !== false,
    ),

    longAnimationFrameCount:
      medianMetric(
        samples,
        "longAnimationFrameCount",
      ),

    maxLongAnimationFrameMs:
      medianMetric(
        samples,
        "maxLongAnimationFrameMs",
      ),

    maxBlockingDurationMs:
      medianMetric(
        samples,
        "maxBlockingDurationMs",
      ),

    p95EventLoopDelayMs:
      medianMetric(
        samples,
        "p95EventLoopDelayMs",
      ),

    maxEventLoopDelayMs:
      medianMetric(
        samples,
        "maxEventLoopDelayMs",
      ),

    // Detailed scripts remain available in each raw round.
    topScripts: [],
  };

  const hotspotScore =
    rankMainThreadHotspot(summary);

  return {
    ...summary,
    hotspotScore,
    workerCandidate: item.workerCandidate,
    recommendation: recommendationFor(
      item,
      summary,
      hotspotScore,
    ),
  };
}

function collectTemporalOutliers(roundReports) {
  const outliers = [];

  roundReports.forEach((round, roundIndex) => {
    for (const section of round.sections) {
      const checks = [
        {
          metric: "maxLongTaskMs",
          value: section.maxLongTaskMs,
          budget: MAX_LONG_TASK_MS,
        },
        {
          metric: "maxLongAnimationFrameMs",
          value: section.maxLongAnimationFrameMs,
          budget: MAX_LOAF_MS,
        },
        {
          metric: "maxBlockingDurationMs",
          value: section.maxBlockingDurationMs,
          budget: MAX_BLOCKING_DURATION_MS,
        },
      ];

      for (const check of checks) {
        if (check.value > check.budget) {
          outliers.push({
            round: roundIndex + 1,
            section: section.label,
            ...check,
          });
        }
      }
    }
  });

  return outliers;
}

async function collectLaboratoryRound(
  context,
  fixturePage,
  roundNumber,
  testInfo,
) {
  await installMainThreadLaboratory(context);

  await context.addInitScript(() => {
    try {
      localStorage.setItem(
        "portfolio-animation-preference",
        "full",
      );
      localStorage.setItem(
        "portfolio-animation-paused",
        "false",
      );
    } catch {
      // Best effort only.
    }
  });

  // The fixture remains alive for the runtime guard,
  // but never carries a measured application instance.
  expect(
    fixturePage.isClosed(),
    `round ${roundNumber}: fixture page fermée`,
  ).toBe(false);

  const sections = [];
  let runtime = null;

  for (const item of SECTION_PLAN) {
    const samplePage = await context.newPage();

    try {
      await prepareLaboratoryPage(samplePage);

      if (!runtime) {
        runtime = await samplePage.evaluate(() => ({
          quality:
            document.documentElement
              .dataset.runtimeQuality ?? null,

          profile:
            document.documentElement
              .dataset.runtimeProfile ?? null,

          hardwareConcurrency:
            navigator.hardwareConcurrency,

          deviceMemory:
            navigator.deviceMemory ?? null,
        }));
      }

      const summary =
        item.kind === "transition"
          ? await measureTransition(
              samplePage,
              item,
            )
          : await measureSteadyState(
              samplePage,
              item,
            );

      // This is NOT statistical:
      // an incomplete collector invalidates the round.
      expect(
        summary.frameSamples,
        `round ${roundNumber}/${MEASUREMENT_ROUNDS} `
          + `${item.label}: RAF collector produced too few samples`,
      ).toBeGreaterThanOrEqual(3);

      const hotspotScore =
        rankMainThreadHotspot(summary);

      sections.push({
        ...summary,
        hotspotScore,
        workerCandidate:
          item.workerCandidate,
        recommendation:
          recommendationFor(
            item,
            summary,
            hotspotScore,
          ),
      });
    } finally {
      if (!samplePage.isClosed()) {
        await samplePage.close().catch(() => {});
      }
    }
  }

  const report = {
    schema: 1,
    type: "main-thread-round",
    round: roundNumber,
    sampledAt: new Date().toISOString(),
    runtime,
    sections,
  };

  console.log(
    `\n=== MAIN THREAD ROUND `
      + `${roundNumber}/${MEASUREMENT_ROUNDS} ===`,
  );

  console.table(
    sections.map((section) => ({
      section: section.label,
      longTask: section.maxLongTaskMs,
      loaf: section.maxLongAnimationFrameMs,
      eventLoopP95:
        section.p95EventLoopDelayMs,
      blocking:
        section.maxBlockingDurationMs,
      frames: section.frameSamples,
    })),
  );

  await testInfo.attach(
    `main-thread-round-${roundNumber}.json`,
    {
      body: JSON.stringify(
        report,
        null,
        2,
      ),
      contentType: "application/json",
    },
  );

  return report;
}

test(
  "@main-thread cartographie les goulets d'étranglement du thread principal",
  async ({ browser, page }, testInfo) => {
    // Three complete rounds are performed inside one Playwright test.
    // This keeps ci:main-thread at exactly one test while still providing
    // statistically robust measurements.
    test.setTimeout(
      Math.round(TEST_TIMEOUT_MS * MEASUREMENT_ROUNDS),
    );

    // The fixture page is deliberately kept alive and unmeasured.
    expect(
      page.isClosed(),
      "fixture Main Thread fermée avant mesure",
    ).toBe(false);

    const roundReports = [];

    for (
      let roundIndex = 0;
      roundIndex < MEASUREMENT_ROUNDS;
      roundIndex += 1
    ) {
      // A fresh browser context per round prevents state, Worker,
      // compositor and document history from leaking between rounds.
      const roundContext =
        await browser.newContext({
          viewport: {
            width: 1366,
            height: 768,
          },
          reducedMotion: "no-preference",
        });

      // Keep an empty fixture-like page alive during this round.
      const roundFixturePage =
        await roundContext.newPage();

      try {
        const report =
          await collectLaboratoryRound(
            roundContext,
            roundFixturePage,
            roundIndex + 1,
            testInfo,
          );

        roundReports.push(report);
      } finally {
        await roundContext.close().catch(() => {});
      }
    }

    expect(
      roundReports,
      "trois rounds Main Thread requis",
    ).toHaveLength(MEASUREMENT_ROUNDS);

    const sections =
      SECTION_PLAN.map(
        (item, sectionIndex) => {
          const samples =
            roundReports.map(
              (round) =>
                round.sections[sectionIndex],
            );

          return aggregateSection(
            item,
            samples,
          );
        },
      );

    const ranked = [...sections].sort(
      (a, b) =>
        b.hotspotScore
        - a.hotspotScore,
    );

    const outliers =
      collectTemporalOutliers(
        roundReports,
      );

    const report = {
      schema: 2,
      sampledAt:
        new Date().toISOString(),

      aggregation: {
        rounds:
          MEASUREMENT_ROUNDS,

        method:
          "median-of-3-independent-rounds",

        topology:
          "fresh-page-per-section",

        context:
          "fresh-context-per-round",

        fixturePage:
          "alive-and-unmeasured",
      },

      runtime:
        roundReports[0]?.runtime
        ?? null,

      budgets: {
        sampleMs:
          SAMPLE_MS,

        maxLongTaskMs:
          MAX_LONG_TASK_MS,

        maxLongAnimationFrameMs:
          MAX_LOAF_MS,

        maxEventLoopDelayMs:
          MAX_EVENT_LOOP_DELAY_MS,

        eventLoopDelayGate:
          "diagnostic-only",

        maxBlockingDurationMs:
          MAX_BLOCKING_DURATION_MS,

        diagnosticP99FrameMs:
          MAX_P99_FRAME_MS,

        diagnosticDroppedFrameRatio:
          MAX_DROPPED_FRAME_RATIO,

        initialWarmupMs:
          INITIAL_WARMUP_MS,

        steadySettleMs:
          STEADY_SETTLE_MS,
      },

      rounds:
        roundReports,

      sections,
      outliers,

      rankedHotspots:
        ranked.map(
          ({
            label,
            hotspotScore,
            recommendation,
          }) => ({
            label,
            hotspotScore,
            recommendation,
          }),
        ),

      topCandidate:
        ranked[0]?.label
        ?? null,
    };

    console.log(
      "\n=== MAIN THREAD MEDIAN RELEASE GATE ===",
    );

    console.table(
      sections.map((section) => ({
        section:
          section.label,

        longTaskMedian:
          section.maxLongTaskMs,

        loafMedian:
          section.maxLongAnimationFrameMs,

        blockingMedian:
          section.maxBlockingDurationMs,

        eventLoopP95Median:
          section.p95EventLoopDelayMs,

        framesMin:
          section.frameSamples,

        score:
          section.hotspotScore,
      })),
    );

    if (outliers.length > 0) {
      console.warn(
        `[main-thread] ${outliers.length} `
          + "outlier(s) individuel(s) "
          + "observé(s); décision prise sur la médiane:",
        outliers,
      );
    }

    await testInfo.attach(
      "main-thread-laboratory.json",
      {
        body: JSON.stringify(
          report,
          null,
          2,
        ),
        contentType:
          "application/json",
      },
    );

    for (const section of sections) {
      expect(
        section.maxLongTaskMs,
        `${section.label}: médiane Long Task `
          + `> ${MAX_LONG_TASK_MS} ms`,
      ).toBeLessThanOrEqual(
        MAX_LONG_TASK_MS,
      );

      expect(
        section.maxLongAnimationFrameMs,
        `${section.label}: médiane Long Animation Frame `
          + `> ${MAX_LOAF_MS} ms`,
      ).toBeLessThanOrEqual(
        MAX_LOAF_MS,
      );

      expect(
        section.maxBlockingDurationMs,
        `${section.label}: médiane blocking duration `
          + `> ${MAX_BLOCKING_DURATION_MS} ms`,
      ).toBeLessThanOrEqual(
        MAX_BLOCKING_DURATION_MS,
      );

      if (
        section.p95EventLoopDelayMs
        > MAX_EVENT_LOOP_DELAY_MS
      ) {
        console.warn(
          `[main-thread][diagnostic] `
            + `${section.label}: `
            + `event-loop median p95=`
            + `${section.p95EventLoopDelayMs}ms `
            + `(target=${MAX_EVENT_LOOP_DELAY_MS}ms).`,
        );
      }
    }
  },
);
