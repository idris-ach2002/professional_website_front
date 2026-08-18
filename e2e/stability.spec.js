import { expect, test } from "./support/test-fixtures";
import { openPortfolioContract, openPublicRouteContract } from "./support/runtime-contract";
import { expectWorldBiome } from "./support/world-contract";

// Keep the stability suite genuinely concurrent. Determinism comes from
// stable navigation anchors and explicit runtime reconciliation, not from
// reducing worker count or inflating arbitrary waits.
test.describe.configure({ mode: "parallel", timeout: 75_000 });

async function selectAnimationMode(page, label, expectedPreference) {
  const expectedPerformanceMode = {
    auto: "lite",
    full: "full",
    reduced: "lite",
    off: "ultra-lite",
  }[expectedPreference];
  const trigger = page.getByTestId("command-options-trigger");
  let panel = page.getByRole("dialog", { name: "Options" });

  if (!(await panel.isVisible().catch(() => false))) {
    await trigger.click();
    panel = page.getByRole("dialog", { name: "Options" });
  }

  const group = panel.getByRole("group", { name: "Niveau d’animations" });
  if (!(await group.isVisible().catch(() => false))) {
    await panel.getByTestId("animation-preferences-trigger").click();
  }

  await expect(group).toBeVisible();
  await group.getByRole("button", { name: new RegExp(label) }).click();

  await expect(page.locator("html")).toHaveAttribute(
    "data-animation-preference",
    expectedPreference,
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-performance-profile",
    expectedPerformanceMode,
  );
}

async function presetAnimationRuntime(page, { preference, paused }) {
  await page.addInitScript(({ nextPreference, nextPaused }) => {
    try {
      window.localStorage.setItem("portfolio-animation-preference", nextPreference);
      window.localStorage.setItem("portfolio-animation-paused", String(nextPaused));
    } catch {
      // Storage is optional in production; the hosted E2E origin supports it.
    }
  }, {
    nextPreference: preference,
    nextPaused: paused,
  });
}

test("@stability enchaîne les routes publiques FR/EN sans erreur runtime", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const routes = ["/", "/en", "/recruiter", "/en/recruiter", "/cv", "/en/cv", "/", "/en", "/"];

  for (const route of routes) {
    await openPublicRouteContract(page, route);
  }

});

test("@stability supporte les changements rapides de modes d’animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await openPortfolioContract(page, "fr");

  const transitions = [
    ["Complètes", "full"],
    ["Réduites", "reduced"],
    ["Désactivées", "off"],
    ["Complètes", "full"],
    ["Réduites", "reduced"],
    ["Automatique", "auto"],
  ];
  for (const [label, preference] of transitions) {
    await selectAnimationMode(page, label, preference);
  }

  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "running");
  await expect(page.locator("html")).not.toHaveAttribute("data-performance-profile", "ultra-lite");

});

test("@stability garde la Timeline cohérente sous une précondition d’animation contrôlée", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Précondition déterministe : le monde complet est monté mais les animations
  // sont explicitement pausées avant le bootstrap. Aucun IntersectionObserver,
  // scroll ou cadence de paint ne décide du résultat de ce contrat.
  await presetAnimationRuntime(page, { preference: "full", paused: true });
  await openPortfolioContract(page, "fr");

  const timeline = page.locator("#timeline");
  const rows = timeline.locator(".timeline-row");
  const drone = timeline.locator(".timeline-exploration-drone");
  const submarine = timeline.locator(".timeline-submarine");

  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "full");
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "full");
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "paused");

  await expect(timeline).toBeAttached();
  await expect(timeline).toHaveAttribute("data-motion-engine", "abyss-expedition-inspection-v10-legacy-optimized");
  await expect(timeline).toHaveAttribute("data-motion-source", "time-and-intersection-state");
  await expect(timeline).toHaveAttribute("data-timeline-scene", "paused");
  await expect(timeline).toHaveAttribute("data-timeline-reveal", "complete");
  await expect(timeline).toHaveAttribute("data-timeline-inspection", "idle");
  await expect(timeline).toHaveAttribute("data-timeline-exit", "clear");

  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);
  for (let index = 0; index < rowCount; index += 1) {
    await expect(rows.nth(index)).toHaveAttribute("data-timeline-card-state", "revealed");
    await expect(rows.nth(index)).toHaveAttribute("data-timeline-inspection", "idle");
  }

  // Postcondition visuelle causale de l'état paused, pas d'une fenêtre temporelle.
  await expect(drone).toBeHidden();
  await expect(submarine).toBeHidden();
});

test("@stability résiste aux sauts de scroll et conserve une géométrie saine", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await openPortfolioContract(page, "fr");

  const positions = [0, 0.24, 0.67, 0.95, 0.42, 1, 0.12, 0.78, 0];

  for (const ratio of positions) {
    await page.evaluate((nextRatio) => {
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const maxScroll = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);

      scrollingElement.scrollTop = maxScroll * nextRatio;
      // The explicit reconciliation listener is synchronous. The final layout
      // read below is the postcondition barrier; no paint cadence is predicted.
      window.dispatchEvent(new CustomEvent("portfolio:ocean-world-reconcile", {
        detail: { reason: "stability-scroll-stress" },
      }));
    }, ratio);
  }

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    duplicateIds: [...document.querySelectorAll("[id]")]
      .map((element) => element.id)
      .filter((id, index, all) => id && all.indexOf(id) !== index),
  }));

  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect([...new Set(layout.duplicateIds)]).toEqual([]);

});

test("@stability enchaîne les biomes du Living Ocean World sans dépendance au scroll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Keep every full-world gate mounted while isolating World Director
  // arbitration from the aquarium, volcano, transition and mine render loops.
  // Active motion is covered independently by the Timeline and soak scenarios.
  await presetAnimationRuntime(page, { preference: "full", paused: true });
  await openPortfolioContract(page, "fr");

  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "full");
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "full");
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "paused");

  await expect(page.locator(".ocean-world-canvas")).toBeAttached();
  await expect(page.locator(".ocean-transition-stage")).toBeAttached();
  await expect(page.locator(".ocean-biome-transition-layer")).toHaveAttribute(
    "data-world-director",
    "intersection-viewport-center",
  );

  await expectWorldBiome(page, "#ocean-transition-deep", "deep");
  await expectWorldBiome(page, "#ocean-transition-caldera", "caldera");
  await expectWorldBiome(page, "#ocean-transition-projects", "projects");
  await expectWorldBiome(page, "#ocean-transition-outro", "outro", { align: "end" });

  const outro = page.locator("#ocean-outro");
  await expect(outro).toBeAttached();
  await expect(outro.locator(".treasure-mine-field")).toHaveAttribute(
    "data-mine-field",
    "excavation-runtime",
  );
  await expect(outro.locator(".treasure-mine-canvas")).toHaveCount(2);
  await expect(outro.locator(".treasure-mine-base-canvas")).toBeAttached();
  await expect(outro.locator(".treasure-mine-fx-canvas")).toBeAttached();
  await expect(page.locator(".ocean-ascent-vehicle")).toHaveCount(0);
  await expect(page.locator(".ascent-vehicle-silhouette")).toHaveCount(0);

});
