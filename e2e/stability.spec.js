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
  await expect(page.locator("html")).toHaveAttribute(
    "data-ocean-director-ready",
    "true",
    { timeout: 10_000 },
  );
}

function capturePageErrors(page) {
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

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

async function jumpToSection(page, selector, { align = "center", timeout = 10_000 } = {}) {
  const target = page.locator(selector);
  await expect(target).toBeAttached({ timeout });
  await expect(page.locator("html")).toHaveAttribute(
    "data-ocean-director-ready",
    "true",
    { timeout },
  );

  const result = await page.evaluate(async ({ targetSelector, block }) => {
    const root = document.documentElement;
    const body = document.body;
    const scrollingElement = document.scrollingElement ?? root;
    const viewportHeight = Math.max(1, window.innerHeight);
    const focusY = viewportHeight / 2;

    const previousRootBehavior = root.style.getPropertyValue("scroll-behavior");
    const previousRootPriority = root.style.getPropertyPriority("scroll-behavior");
    const previousBodyBehavior = body?.style.getPropertyValue("scroll-behavior") ?? "";
    const previousBodyPriority = body?.style.getPropertyPriority("scroll-behavior") ?? "";

    const restoreScrollBehavior = () => {
      if (previousRootBehavior) {
        root.style.setProperty("scroll-behavior", previousRootBehavior, previousRootPriority);
      } else {
        root.style.removeProperty("scroll-behavior");
      }

      if (!body) return;
      if (previousBodyBehavior) {
        body.style.setProperty("scroll-behavior", previousBodyBehavior, previousBodyPriority);
      } else {
        body.style.removeProperty("scroll-behavior");
      }
    };

    const nextPaint = () => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    root.style.setProperty("scroll-behavior", "auto", "important");
    body?.style.setProperty("scroll-behavior", "auto", "important");

    let snapshot = null;

    try {
      // Recompute from current geometry after every paint. This converges even
      // when a lazy world mounts and changes document height during the jump.
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const element = document.querySelector(targetSelector);
        if (!element) throw new Error(`Missing stability anchor: ${targetSelector}`);

        const rect = element.getBoundingClientRect();
        const maxScroll = Math.max(0, scrollingElement.scrollHeight - viewportHeight);
        const absoluteCenter = scrollingElement.scrollTop + rect.top + rect.height / 2;
        const requestedScrollTop = block === "end"
          ? maxScroll
          : absoluteCenter - focusY;
        const expectedScrollTop = Math.max(0, Math.min(maxScroll, requestedScrollTop));

        scrollingElement.scrollTop = expectedScrollTop;
        await nextPaint();

        const settledElement = document.querySelector(targetSelector);
        if (!settledElement) throw new Error(`Missing stability anchor after scroll: ${targetSelector}`);

        const settledRect = settledElement.getBoundingClientRect();
        const settledMaxScroll = Math.max(0, scrollingElement.scrollHeight - viewportHeight);
        const targetCenterY = settledRect.top + settledRect.height / 2;
        const targetVisible = settledRect.top < viewportHeight && settledRect.bottom > 0;
        const scrollTop = scrollingElement.scrollTop;
        const scrollError = Math.abs(scrollTop - Math.max(0, Math.min(settledMaxScroll, expectedScrollTop)));
        const centerError = Math.abs(targetCenterY - focusY);
        const reachedEnd = scrollTop >= settledMaxScroll - 2;

        snapshot = {
          focusY,
          maxScroll: settledMaxScroll,
          scrollTop,
          targetCenterY,
          targetVisible,
          centerError,
          scrollError,
          reachedEnd,
        };

        if (block === "end") {
          if (reachedEnd && targetVisible) break;
        } else if (centerError <= 2 && scrollError <= 2) {
          break;
        }
      }

      window.dispatchEvent(new CustomEvent("portfolio:ocean-world-reconcile", {
        detail: { reason: "stability-anchor-jump" },
      }));

      return {
        ...snapshot,
        biome: document.documentElement.dataset.oceanBiome ?? null,
      };
    } finally {
      restoreScrollBehavior();
    }
  }, { targetSelector: selector, block: align });

  expect(result).not.toBeNull();

  if (align === "end") {
    expect(result.reachedEnd).toBe(true);
    expect(result.targetVisible).toBe(true);
  } else {
    expect(result.scrollError).toBeLessThanOrEqual(2);
    expect(result.centerError).toBeLessThanOrEqual(2);
  }

  return { target, biome: result.biome };
}

async function jumpToBiome(page, selector, expectedBiome, options) {
  const { target, biome } = await jumpToSection(page, selector, options);
  expect(
    biome,
    `World Director did not synchronously reconcile ${selector} to ${expectedBiome}.`,
  ).toBe(expectedBiome);
  await expect(page.locator("html")).toHaveAttribute("data-ocean-biome", expectedBiome);
  return target;
}


test.beforeEach(async ({ context }) => {
  // Use the hosted-runner hardware class everywhere. This prevents a powerful
  // local machine from selecting a different automatic animation profile and
  // hiding CI-only rendering paths.
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
      configurable: true,
      get: () => 4,
    });
  });

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
  await expect(timeline).toHaveAttribute("data-timeline-scene", "exiting");
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

  await jumpToBiome(page, "#ocean-transition-deep", "deep");
  await jumpToBiome(page, "#ocean-transition-caldera", "caldera");
  await jumpToBiome(page, "#ocean-transition-projects", "projects");
  await jumpToBiome(page, "#ocean-transition-outro", "outro", { align: "end" });

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

  expect(
    pageErrors,
    `Erreurs runtime pendant les transitions de biomes: ${pageErrors.join(" | ")}`,
  ).toEqual([]);
});
