import { expect, test } from "@playwright/test";
import { portfolioOwner } from "./fixtures/owner";

const PUBLIC_WEBSITE_PATH = "/website/default";

function isPublicWebsiteRequest(url, locale) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith(PUBLIC_WEBSITE_PATH)
      && parsed.searchParams.get("locale") === locale;
  } catch {
    return false;
  }
}

async function mockPublicApi(page) {
  await page.route("**/website/default**", async (route) => {
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(portfolioOwner(locale)),
    });
  });

  await page.route("**/analytics/events", (route) => route.fulfill({ status: 204, body: "" }));
}

async function openPortfolio(page, locale = "fr") {
  const publicResponse = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), locale) && response.status() === 200,
  );

  await page.goto(locale === "en" ? "/en" : "/", { waitUntil: "domcontentloaded" });
  await publicResponse;
  await expect(page.locator("main#main-content")).toBeVisible();
}

function capturePageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function selectAnimationMode(page, label, expectedPreference) {
  const control = page.locator(".animation-preferences-control");
  const trigger = control.getByTestId("animation-preferences-trigger");
  await trigger.hover();
  const group = control.getByRole("group", { name: "Niveau d’animations" });
  await expect(group).toBeVisible();
  await group.getByRole("button", { name: new RegExp(label) }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", expectedPreference);
}

test.beforeEach(async ({ page }) => {
  await mockPublicApi(page);
});

test("@stability enchaîne les routes publiques FR/EN sans erreur runtime", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const pageErrors = capturePageErrors(page);
  const routes = ["/", "/en", "/recruiter", "/en/recruiter", "/cv", "/en/cv", "/", "/en", "/"];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", route.startsWith("/en") ? "en" : "fr");
  }

  expect(pageErrors, `Erreurs runtime pendant les transitions: ${pageErrors.join(" | ")}`).toEqual([]);
});

test("@stability supporte les changements rapides de modes d’animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const pageErrors = capturePageErrors(page);
  await openPortfolio(page, "fr");

  await selectAnimationMode(page, "Complètes", "full");
  await selectAnimationMode(page, "Réduites", "reduced");
  await selectAnimationMode(page, "Désactivées", "off");
  await selectAnimationMode(page, "Automatique", "auto");

  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "running");
  await expect(page.locator("html")).not.toHaveAttribute("data-performance-profile", "ultra-lite");
  expect(pageErrors, `Erreurs runtime pendant les changements d’animation: ${pageErrors.join(" | ")}`).toEqual([]);
});

test("@stability garde la Timeline autonome, révèle les cartes puis coupe la scène avant le volcan abyssal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const pageErrors = capturePageErrors(page);
  await openPortfolio(page, "fr");
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
    const vehicle = document.querySelector("#timeline .timeline-exploration-drone")?.getBoundingClientRect();
    if (!section || !vehicle) return null;
    return {
      section: { top: section.top, bottom: section.bottom },
      vehicle: { top: vehicle.top, bottom: vehicle.bottom },
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.vehicle.top).toBeGreaterThanOrEqual(geometry.section.top - 8);
  expect(geometry.vehicle.bottom).toBeLessThanOrEqual(geometry.section.bottom + 8);

  await exitSentinel.scrollIntoViewIfNeeded();
  await expect(timeline).toHaveAttribute("data-timeline-exit", "approaching");
  await expect(drone).toBeHidden();
  await expect(submarine).toBeHidden();

  // La scène volcanique remplace son placeholder quand elle entre dans la zone
  // de préchargement. Attendre son ancre stable évite de scroller un nœud
  // temporaire qui se détache pendant le lazy loading.
  const volcano = page.locator("#abyss-volcano-field");
  await expect(volcano).toBeAttached({ timeout: 10_000 });
  await volcano.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "auto" });
  });
  await expect(volcano).toBeVisible();
  await expect(drone).toBeHidden();
  await expect(submarine).toBeHidden();

  expect(pageErrors, `Erreurs runtime dans la Timeline: ${pageErrors.join(" | ")}`).toEqual([]);
});

test("@stability résiste aux sauts de scroll et conserve une géométrie saine", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const pageErrors = capturePageErrors(page);
  await openPortfolio(page, "fr");

  const positions = [0, 0.24, 0.67, 0.95, 0.42, 1, 0.12, 0.78, 0];
  for (const ratio of positions) {
    await page.evaluate((nextRatio) => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: maxScroll * nextRatio, behavior: "auto" });
    }, ratio);
    await page.waitForTimeout(60);
  }

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    duplicateIds: [...document.querySelectorAll("[id]")]
      .map((element) => element.id)
      .filter((id, index, all) => id && all.indexOf(id) !== index),
  }));

  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect([...new Set(layout.duplicateIds)]).toEqual([]);
  expect(pageErrors, `Erreurs runtime pendant le stress scroll: ${pageErrors.join(" | ")}`).toEqual([]);
});
