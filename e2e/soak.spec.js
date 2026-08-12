import process from "node:process";
import { expect, test } from "./support/test-fixtures";
import {
  CONTRACT_TIMEOUT_MS,
  PROBE_DEADLINE_MS,
  RUNTIME_WATCHDOG_KEY,
  assertNoRuntimeFaults,
  openPortfolioContract,
  probeHtml,
} from "./support/runtime-contract";
import { reconcileWorldAtAnchor } from "./support/world-contract";

function positiveIntegerEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SOAK_DURATION_MS = Math.max(10_000, positiveIntegerEnv("SOAK_DURATION_MS", 60_000));
const SOAK_HEARTBEAT_MS = Math.min(
  10_000,
  Math.max(2_000, positiveIntegerEnv("SOAK_HEARTBEAT_MS", 5_000)),
);
const SOAK_STRUCTURE_EVERY = Math.min(6, Math.max(1, positiveIntegerEnv("SOAK_STRUCTURE_EVERY", 3)));
const SOAK_SETUP_BUDGET_MS = process.env.CI ? 45_000 : 30_000;
const SOAK_TEARDOWN_BUDGET_MS = 20_000;
const SOAK_TOTAL_TIMEOUT_MS = SOAK_SETUP_BUDGET_MS + SOAK_DURATION_MS + SOAK_TEARDOWN_BUDGET_MS;
const FAILURE_PROBE_DEADLINE_MS = Math.min(2_500, PROBE_DEADLINE_MS);
const VALID_RUNTIME_QUALITIES = new Set(["high", "balanced", "constrained"]);
const REQUIRED_RUNTIME_IDS = Object.freeze([
  "profile",
  "ocean-transition-deep",
  "ocean-transition-caldera",
  "ocean-transition-projects",
  "ocean-transition-outro",
  "timeline",
  "projects",
  "ocean-outro",
]);

function holdSessionFor(milliseconds) {
  if (milliseconds <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readHeartbeatSnapshot(page, {
  label = "heartbeat runtime",
  deadlineMs = PROBE_DEADLINE_MS,
} = {}) {
  const { value, probe } = await probeHtml(page, (watchdogKey) => {
    const root = document.documentElement;
    const aquarium = document.querySelector(".global-aquarium");
    const watchdog = window[watchdogKey];

    return {
      path: window.location.pathname,
      language: root.lang,
      mainReady: Boolean(document.querySelector("main#main-content:not(.loading-shell)")),
      animationPreference: root.dataset.animationPreference ?? null,
      performanceProfile: root.dataset.performanceProfile ?? null,
      animationState: root.dataset.animationState ?? null,
      runtimeQuality: root.dataset.runtimeQuality ?? null,
      directorReady: root.dataset.oceanDirectorReady ?? null,
      biome: root.dataset.oceanBiome ?? null,
      aquariumCount: aquarium ? 1 : 0,
      aquariumFps: Number(aquarium?.dataset.simulationFps || 0),
      watchdog: watchdog ? {
        schema: watchdog.schema,
        ticks: watchdog.ticks,
        maxDelayMs: watchdog.maxDelayMs,
        severeDelayCount: watchdog.severeDelayCount,
        longTaskSupported: watchdog.longTaskSupported,
        longTaskCount: watchdog.longTaskCount,
        maxLongTaskMs: watchdog.maxLongTaskMs,
        recentDelays: [...watchdog.recentDelays],
      } : null,
    };
  }, RUNTIME_WATCHDOG_KEY, { label, deadlineMs });

  return { ...value, probe };
}

function assertHeartbeatSnapshot(snapshot, phase) {
  const violations = [];
  if (snapshot.path !== "/") violations.push(`route=${snapshot.path}`);
  if (snapshot.language !== "fr") violations.push(`lang=${snapshot.language}`);
  if (!snapshot.mainReady) violations.push("main absent ou revenu au chargement");
  if (snapshot.animationPreference !== "full") violations.push(`preference=${snapshot.animationPreference}`);
  if (snapshot.performanceProfile !== "full") violations.push(`profile=${snapshot.performanceProfile}`);
  if (snapshot.animationState !== "running") violations.push(`animation=${snapshot.animationState}`);
  if (snapshot.directorReady !== "true") violations.push(`directorReady=${snapshot.directorReady}`);
  if (!VALID_RUNTIME_QUALITIES.has(snapshot.runtimeQuality)) violations.push(`runtimeQuality=${snapshot.runtimeQuality}`);
  if (snapshot.biome !== "projects") violations.push(`biome=${snapshot.biome}`);
  if (snapshot.aquariumCount !== 1) violations.push(`aquarium count=${snapshot.aquariumCount}`);
  if (!(snapshot.aquariumFps > 0 && snapshot.aquariumFps <= 60)) violations.push(`aquarium fps=${snapshot.aquariumFps}`);
  if (!snapshot.watchdog || snapshot.watchdog.schema !== 1) violations.push("watchdog runtime absent");
  if (!(snapshot.watchdog?.ticks > 0)) violations.push(`watchdog ticks=${snapshot.watchdog?.ticks ?? null}`);

  expect(
    violations,
    `${phase} — invariants runtime invalides:\n${JSON.stringify(snapshot, null, 2)}`,
  ).toEqual([]);
}

async function readStructureSnapshot(page, {
  label = "audit structurel",
  deadlineMs = PROBE_DEADLINE_MS,
} = {}) {
  const { value, probe } = await probeHtml(page, (requiredIds) => {
    const root = document.documentElement;
    const counts = Object.fromEntries(requiredIds.map((id) => [id, document.querySelectorAll(`#${CSS.escape(id)}`).length]));
    const allIds = [...document.querySelectorAll("[id]")].map((node) => node.id).filter(Boolean);
    const seen = new Set();
    const duplicates = new Set();
    for (const id of allIds) {
      if (seen.has(id)) duplicates.add(id);
      else seen.add(id);
    }

    return {
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      requiredCounts: counts,
      duplicateIds: [...duplicates],
      aquariumCanvasCount: document.querySelectorAll(".ocean-world-canvas").length,
      transitionStageCount: document.querySelectorAll(".ocean-transition-stage").length,
    };
  }, REQUIRED_RUNTIME_IDS, { label, deadlineMs });

  return { ...value, probe };
}

function assertStructureSnapshot(snapshot, phase) {
  const violations = [];
  if (snapshot.horizontalOverflow > 1) violations.push(`overflow=${snapshot.horizontalOverflow}px`);
  if (snapshot.duplicateIds.length > 0) violations.push(`ids dupliqués=${snapshot.duplicateIds.join(",")}`);
  for (const [id, count] of Object.entries(snapshot.requiredCounts)) {
    if (count !== 1) violations.push(`#${id} count=${count}`);
  }
  if (snapshot.aquariumCanvasCount !== 1) violations.push(`aquarium canvas count=${snapshot.aquariumCanvasCount}`);
  if (snapshot.transitionStageCount !== 1) violations.push(`transition stage count=${snapshot.transitionStageCount}`);

  expect(
    violations,
    `${phase} — invariants structurels invalides:\n${JSON.stringify(snapshot, null, 2)}`,
  ).toEqual([]);
}

async function observeEnduranceWindow(page, runtime, deadline, testInfo) {
  const samples = [];
  let sequence = 0;
  let nextSampleAt = Math.min(deadline, Date.now() + SOAK_HEARTBEAT_MS);

  try {
    while (Date.now() < deadline) {
      await holdSessionFor(Math.max(0, nextSampleAt - Date.now()));
      if (Date.now() >= deadline) break;

      sequence += 1;
      const heartbeat = await readHeartbeatSnapshot(page, { label: `heartbeat ${sequence}` });
      assertNoRuntimeFaults(runtime, `Heartbeat ${sequence}`);
      assertHeartbeatSnapshot(heartbeat, `Heartbeat ${sequence}`);

      let structure = null;
      if (sequence % SOAK_STRUCTURE_EVERY === 0) {
        structure = await readStructureSnapshot(page, { label: `audit structurel ${sequence}` });
        assertStructureSnapshot(structure, `Audit structurel ${sequence}`);
      }

      samples.push({ sequence, at: Date.now(), heartbeat, structure });
      nextSampleAt += SOAK_HEARTBEAT_MS;
      if (nextSampleAt < Date.now()) nextSampleAt = Date.now();
    }
    return samples;
  } catch (error) {
    await testInfo.attach("soak-failure.json", {
      body: JSON.stringify({
        sequence: sequence + 1,
        lastGoodSample: samples.at(-1) ?? null,
        runtimeFatal: runtime?.fatal ?? [],
        runtimeDiagnostics: runtime?.diagnostics ?? [],
        error: error instanceof Error ? error.message : String(error),
      }, null, 2),
      contentType: "application/json",
    });
    throw error;
  } finally {
    await testInfo.attach("soak-samples.json", {
      body: JSON.stringify(samples, null, 2),
      contentType: "application/json",
    });
  }
}

test.afterEach(async ({ page, runtimeGuard }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  const messages = (testInfo.errors ?? []).map((entry) => entry?.message ?? String(entry)).filter(Boolean);
  const livenessFailed = messages.some((message) => message.includes("liveness violée"));
  const diagnostic = {
    messages,
    runtimeFatal: runtimeGuard.runtime?.fatal ?? [],
    runtimeDiagnostics: runtimeGuard.runtime?.diagnostics ?? [],
  };

  if (!page.isClosed() && !livenessFailed) {
    try {
      diagnostic.renderer = await readHeartbeatSnapshot(page, {
        label: "diagnostic post-échec",
        deadlineMs: FAILURE_PROBE_DEADLINE_MS,
      });
    } catch (error) {
      diagnostic.snapshotError = error instanceof Error ? error.message : String(error);
    }
  }

  await testInfo.attach("soak-failure-state.json", {
    body: JSON.stringify(diagnostic, null, 2),
    contentType: "application/json",
  });
});

test("@soak garde une session Projects saine pendant la durée demandée", async ({ page, runtimeGuard }, testInfo) => {
  test.setTimeout(SOAK_TOTAL_TIMEOUT_MS);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("portfolio-animation-preference", "full");
      localStorage.setItem("portfolio-animation-paused", "false");
    } catch {
      // Storage is best-effort; the E2E origin normally supports it.
    }
  });

  const setupStartedAt = Date.now();
  await openPortfolioContract(page, "fr");
  await expect(page.locator("html")).toHaveAttribute("data-runtime-quality", /^(high|balanced|constrained)$/, {
    timeout: CONTRACT_TIMEOUT_MS * 2,
  });

  const navigation = await reconcileWorldAtAnchor(page, "#ocean-transition-projects", {
    reason: "soak-steady-state",
    timeout: CONTRACT_TIMEOUT_MS,
  });
  expect(navigation.biome, "précondition: biome stable du soak").toBe("projects");

  for (const id of REQUIRED_RUNTIME_IDS) {
    await expect(page.locator(`#${id}`), `précondition: #${id} unique`).toHaveCount(1, {
      timeout: CONTRACT_TIMEOUT_MS,
    });
  }

  const baselineHeartbeat = await readHeartbeatSnapshot(page, { label: "baseline heartbeat" });
  const baselineStructure = await readStructureSnapshot(page, { label: "baseline structure" });
  assertNoRuntimeFaults(runtimeGuard.runtime, "Précondition soak");
  assertHeartbeatSnapshot(baselineHeartbeat, "Précondition soak");
  assertStructureSnapshot(baselineStructure, "Précondition soak");

  expect(
    Date.now() - setupStartedAt,
    `Le setup du soak doit rester sous ${SOAK_SETUP_BUDGET_MS} ms.`,
  ).toBeLessThanOrEqual(SOAK_SETUP_BUDGET_MS);

  const enduranceStartedAt = Date.now();
  const samples = await observeEnduranceWindow(
    page,
    runtimeGuard.runtime,
    enduranceStartedAt + SOAK_DURATION_MS,
    testInfo,
  );

  const finalHeartbeat = await readHeartbeatSnapshot(page, { label: "postcondition heartbeat" });
  const finalStructure = await readStructureSnapshot(page, { label: "postcondition structure" });
  assertNoRuntimeFaults(runtimeGuard.runtime, "Postcondition soak");
  assertHeartbeatSnapshot(finalHeartbeat, "Postcondition soak");
  assertStructureSnapshot(finalStructure, "Postcondition soak");

  expect(Date.now() - enduranceStartedAt, "La durée du soak doit être réellement observée.")
    .toBeGreaterThanOrEqual(SOAK_DURATION_MS);
  expect(samples.length, "Le soak doit produire au moins un heartbeat.").toBeGreaterThan(0);
});
