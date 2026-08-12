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
  const control = page.locator(".animation-preferences-control");
  const trigger = control.getByTestId("animation-preferences-trigger");

  await trigger.hover();

  const group = control.getByRole("group", {
    name: "Niveau d’animations",
  });

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

test("@stability garde la Timeline autonome, révèle les cartes puis coupe la scène avant le volcan abyssal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await openPortfolioContract(page, "fr");
  await selectAnimationMode(page, "Complètes", "full");

  const timeline = page.locator("#timeline");
  const firstCard = timeline.locator(".timeline-row").first();
  const drone = timeline.locator(".timeline-exploration-drone");
  const submarine = timeline.locator(".timeline-submarine");
  const exitSentinel = timeline.locator(".timeline-exit-sentinel");

  await expect(firstCard).toBeAttached({ timeout: 10_000 });
  await firstCard.scrollIntoViewIfNeeded();

  await expect(timeline).toHaveAttribute("data-motion-source", "time-and-intersection-state");
  await expect(timeline).toHaveAttribute("data-timeline-scene", "active");
  await expect(timeline).toHaveAttribute("data-timeline-reveal", "complete", { timeout: 6_000 });
  await expect(timeline).toHaveAttribute("data-timeline-inspection", /approaching|active/, { timeout: 4_000 });
  await expect(drone).toHaveAttribute("data-torch", "on", { timeout: 4_000 });

  const geometry = await page.evaluate(() => {
    const section = document.querySelector("#timeline")?.getBoundingClientRect();
    const vehicle = document
      .querySelector("#timeline .timeline-exploration-drone")
      ?.getBoundingClientRect();

    if (!section || !vehicle) return null;

    return {
      section: {
        top: section.top,
        bottom: section.bottom,
      },
      vehicle: {
        top: vehicle.top,
        bottom: vehicle.bottom,
      },
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.vehicle.top).toBeGreaterThanOrEqual(geometry.section.top - 8);
  expect(geometry.vehicle.bottom).toBeLessThanOrEqual(geometry.section.bottom + 8);

  await exitSentinel.scrollIntoViewIfNeeded();
  await expect(timeline).toHaveAttribute("data-timeline-exit", "approaching");
  await expect(timeline).toHaveAttribute("data-timeline-scene", "exiting");
  await expect(drone).toBeHidden();
  await expect(submarine).toBeHidden();

});

test("@stability résiste aux sauts de scroll et conserve une géométrie saine", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await openPortfolioContract(page, "fr");

  const positions = [0, 0.24, 0.67, 0.95, 0.42, 1, 0.12, 0.78, 0];

  for (const ratio of positions) {
    await page.evaluate((nextRatio) => new Promise((resolve) => {
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const maxScroll = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);

      scrollingElement.scrollTop = maxScroll * nextRatio;
      window.dispatchEvent(new CustomEvent("portfolio:ocean-world-reconcile", {
        detail: { reason: "stability-scroll-stress" },
      }));
      requestAnimationFrame(resolve);
    }), ratio);
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
