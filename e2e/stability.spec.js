import { expect, test } from "@playwright/test";
import { portfolioOwner } from "./fixtures/owner";

// Keep the stability suite genuinely concurrent. Determinism comes from
// stable navigation anchors and explicit runtime reconciliation, not from
// reducing worker count or inflating arbitrary waits.
test.describe.configure({ mode: "parallel", timeout: 60_000 });

const PUBLIC_WEBSITE_PATH = "/website/default";
const PUBLIC_WEBSITE_ROUTE = /\/website\/default(?:\?.*)?$/;
const ANALYTICS_EVENTS_ROUTE = /\/analytics\/events(?:\?.*)?$/;

function isPublicWebsiteRequest(url, locale) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith(PUBLIC_WEBSITE_PATH)
      && parsed.searchParams.get("locale") === locale;
  } catch {
    return false;
  }
}

async function mockPublicApi(context) {
  await context.route(PUBLIC_WEBSITE_ROUTE, async (route) => {
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "cache-control": "no-store",
      },
      body: JSON.stringify(portfolioOwner(locale)),
    });
  });

  await context.route(ANALYTICS_EVENTS_ROUTE, async (route) => {
    await route.fulfill({
      status: 204,
      body: "",
    });
  });
}

async function openPortfolio(page, locale = "fr") {
  const publicResponse = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), locale) && response.status() === 200,
  );

  await page.goto(locale === "en" ? "/en" : "/", {
    waitUntil: "domcontentloaded",
  });

  await publicResponse;
  await expect(page.locator("main#main-content")).toBeVisible();
}

function capturePageErrors(page) {
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

async function selectAnimationMode(page, label, expectedPreference) {
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
}

async function jumpToSection(page, selector, { align = "center", timeout = 10_000 } = {}) {
  const target = page.locator(selector);
  await expect(target).toBeAttached({ timeout });

  await target.evaluate((element, block) => {
    const root = document.documentElement;
    const previousBehavior = root.style.getPropertyValue("scroll-behavior");
    const previousPriority = root.style.getPropertyPriority("scroll-behavior");

    root.style.setProperty("scroll-behavior", "auto", "important");

    if (block === "end") {
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const maxScroll = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
      scrollingElement.scrollTop = maxScroll;
    } else {
      element.scrollIntoView({
        block,
        inline: "nearest",
        behavior: "auto",
      });
    }

    if (previousBehavior) {
      root.style.setProperty("scroll-behavior", previousBehavior, previousPriority);
    } else {
      root.style.removeProperty("scroll-behavior");
    }

    // GlobalAquarium owns an explicit low-frequency scrollend reconciliation
    // path. Trigger it after the synchronous jump so biome selection is based
    // on the geometry that exists now instead of scheduler/IO delivery timing.
    window.dispatchEvent(new Event("scrollend"));
  }, align);

  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));

  return target;
}

async function preloadCaldera(page) {
  await jumpToSection(page, "#ocean-transition-caldera");

  const volcano = page.locator("#abyss-volcano-field");
  await expect(volcano).toBeAttached({ timeout: 10_000 });
  return volcano;
}

test.beforeEach(async ({ context }) => {
  await mockPublicApi(context);
});

test("@stability enchaîne les routes publiques FR/EN sans erreur runtime", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const pageErrors = capturePageErrors(page);
  const routes = ["/", "/en", "/recruiter", "/en/recruiter", "/cv", "/en/cv", "/", "/en", "/"];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      route.startsWith("/en") ? "en" : "fr",
    );
  }

  expect(
    pageErrors,
    `Erreurs runtime pendant les transitions: ${pageErrors.join(" | ")}`,
  ).toEqual([]);
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

  expect(
    pageErrors,
    `Erreurs runtime pendant les changements d’animation: ${pageErrors.join(" | ")}`,
  ).toEqual([]);
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
  await expect(drone).toBeHidden();
  await expect(submarine).toBeHidden();

  // This scenario validates the Timeline boundary, not WebGL lazy-load timing.
  // The permanent caldera gate is therefore the deterministic navigation anchor.
  const calderaGate = await jumpToSection(page, "#ocean-transition-caldera");
  await expect(calderaGate).toBeAttached();
  await expect(drone).toBeHidden();
  await expect(submarine).toBeHidden();

  expect(
    pageErrors,
    `Erreurs runtime dans la Timeline: ${pageErrors.join(" | ")}`,
  ).toEqual([]);
});

test("@stability résiste aux sauts de scroll et conserve une géométrie saine", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const pageErrors = capturePageErrors(page);

  await openPortfolio(page, "fr");

  const positions = [0, 0.24, 0.67, 0.95, 0.42, 1, 0.12, 0.78, 0];

  for (const ratio of positions) {
    await page.evaluate((nextRatio) => {
      const root = document.documentElement;
      const previousBehavior = root.style.getPropertyValue("scroll-behavior");
      const previousPriority = root.style.getPropertyPriority("scroll-behavior");
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const maxScroll = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);

      root.style.setProperty("scroll-behavior", "auto", "important");
      scrollingElement.scrollTop = maxScroll * nextRatio;

      if (previousBehavior) {
        root.style.setProperty("scroll-behavior", previousBehavior, previousPriority);
      } else {
        root.style.removeProperty("scroll-behavior");
      }

      window.dispatchEvent(new Event("scrollend"));
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

  expect(
    pageErrors,
    `Erreurs runtime pendant le stress scroll: ${pageErrors.join(" | ")}`,
  ).toEqual([]);
});

test("@stability enchaîne les biomes du Living Ocean World sans dépendance au scroll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const pageErrors = capturePageErrors(page);

  await openPortfolio(page, "fr");
  await selectAnimationMode(page, "Complètes", "full");

  await expect(page.locator(".ocean-world-canvas")).toBeAttached();
  await expect(page.locator(".ocean-transition-stage")).toBeAttached();
  await expect(page.locator(".ocean-biome-transition-layer")).toHaveAttribute(
    "data-world-director",
    "intersection-viewport-center",
  );

  await jumpToSection(page, "#timeline");
  await expect(page.locator("html")).toHaveAttribute("data-ocean-biome", "deep", {
    timeout: 4_000,
  });

  // First move to the permanent gate so DeferredVolcanoField is guaranteed to
  // enter its preload range. Only after the real caldera section exists do we
  // center it and assert the World Director state.
  const volcano = await preloadCaldera(page);
  await jumpToSection(page, "#abyss-volcano-field");
  await expect(volcano).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-ocean-biome", "caldera", {
    timeout: 4_000,
  });

  const projects = await jumpToSection(page, "#projects");
  await expect(page.locator("html")).toHaveAttribute("data-ocean-biome", "projects", {
    timeout: 4_000,
  });
  await expect(projects.locator(".project-gallery-shell")).toBeAttached();
  await expect(projects.locator(".project-slide-card").first()).toBeAttached();

  const outro = await jumpToSection(page, "#ocean-outro", { align: "end" });
  await expect(page.locator("html")).toHaveAttribute("data-ocean-biome", "outro", {
    timeout: 4_000,
  });
  await expect(outro.locator(".treasure-mine-field")).toHaveAttribute(
    "data-mine-field",
    "excavation-runtime",
  );
  await expect(outro.locator(".treasure-mine-canvas")).toHaveCount(2);
  await expect(outro.locator(".treasure-mine-base-canvas")).toBeAttached();
  await expect(outro.locator(".treasure-mine-fx-canvas")).toBeAttached();
  await expect(page.locator(".ocean-ascent-vehicle")).toHaveCount(0);
  await expect(page.locator(".ascent-vehicle-silhouette")).toHaveCount(0);

  expect(
    pageErrors,
    `Erreurs runtime pendant les transitions de biomes: ${pageErrors.join(" | ")}`,
  ).toEqual([]);
});