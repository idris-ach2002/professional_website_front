import { expect, test } from "./support/test-fixtures";
import {
  CONTRACT_TIMEOUT_MS,
  isPublicWebsiteRequest,
  openPortfolioContract,
} from "./support/runtime-contract";

test.use({ reducedMotion: "reduce" });


test("charge l'accueil depuis l'API publique", async ({ page }) => {
  await openPortfolioContract(page, "fr");

  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("rend le lien d’évitement accessible au clavier", async ({ page }) => {
  await openPortfolioContract(page, "fr");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Aller au contenu principal" });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("bascule du français vers l'anglais", async ({ page }) => {
  await openPortfolioContract(page, "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();

  const englishResponse = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), "en") && response.status() === 200,
  );
  const languageMenu = page.locator(".nav_language-dropdown");
  const languageTrigger = languageMenu.getByRole("button", { name: "Langue" });
  await expect(languageTrigger).toBeVisible();
  await expect(languageTrigger).not.toContainText("FR");
  await expect(languageTrigger).not.toContainText("EN");
  await languageTrigger.hover();
  const languagePanel = languageMenu.getByRole("navigation", { name: "Langue" });
  await expect(languagePanel).toBeVisible();
  await languagePanel.getByRole("button", { name: /English/ }).click();
  await englishResponse;

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Full Stack Java Developer" })).toBeVisible();
});


test("expose une route anglaise indexable", async ({ page }) => {
  await openPortfolioContract(page, "en");

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Full Stack Java Developer" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en$/);
});

test("piège le focus dans la modale projet et le restaure", async ({ page }) => {
  await openPortfolioContract(page, "fr");

  const trigger = page.getByRole("button", { name: "Détails" }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: /Projet.*Portfolio fiable/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2, name: "Projet — Portfolio fiable" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fermer les détails du projet" })).toBeFocused();

  const focusable = dialog.locator(
    'a[href]:visible, button:not([disabled]):visible, input:not([disabled]):visible, select:not([disabled]):visible, textarea:not([disabled]):visible, [tabindex]:not([tabindex="-1"]):visible',
  );
  const focusableCount = await focusable.count();
  expect(focusableCount, "précondition: la modale doit contenir au moins un contrôle focusable").toBeGreaterThan(0);

  // Traverse more than one complete focus cycle. The invariant is checked
  // after every key press instead of assuming a fixed number of controls.
  for (let index = 0; index < focusableCount + 2; index += 1) {
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus"), `focus trap après Tab ${index + 1}`).toHaveCount(1);
  }
  await expect(dialog).toContainText("Portfolio fiable");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("affiche la route 404", async ({ page }) => {
  await page.goto("/route-inconnue?lang=fr", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Cette profondeur n’existe pas." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour à l’accueil" })).toBeVisible();
});

test("ne provoque pas de débordement horizontal en mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPortfolioContract(page, "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("utilise le fallback français quand l'API est indisponible", async ({ page, runtimeGuard }) => {
  runtimeGuard.runtime.allowHttpResponse(
    (response) => response.status() === 503 && isPublicWebsiteRequest(response.url(), "fr"),
  );
  // Page-level routing intentionally overrides the default context API fixture.
  await page.route("**/website/default**", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ code: "SERVICE_UNAVAILABLE" }),
  }));

  const unavailableResponse = page.waitForResponse(
    (response) => response.status() === 503 && isPublicWebsiteRequest(response.url(), "fr"),
    { timeout: CONTRACT_TIMEOUT_MS },
  );
  await page.goto("/?lang=fr", { waitUntil: "domcontentloaded" });
  await unavailableResponse;

  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible({ timeout: CONTRACT_TIMEOUT_MS * 2 });
});

test("expose les réglages d’animation dans le menu mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");

  await page.getByRole("button", { name: "Navigation principale" }).click();
  const mobileSettings = page.locator(".animation-preferences-mobile");
  await expect(mobileSettings).toBeVisible();
  await mobileSettings.getByRole("button", { name: "Désactivées" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "off");
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "ultra-lite");
});

test("mémorise les préférences d’animation et active le mode ultra-léger", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");

  const desktopControl = page.locator(".animation-preferences-control");
  const animationNavItem = desktopControl.getByTestId("animation-preferences-trigger");
  await expect(animationNavItem).toHaveAccessibleName("Animations");
  await expect(animationNavItem).toContainText("Animations");
  await expect(animationNavItem).not.toContainText("FX");
  await animationNavItem.hover();
  const settings = desktopControl.getByRole("group", { name: "Niveau d’animations" });
  await expect(settings).toBeVisible();
  await settings.getByRole("button", { name: /Réduites/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "lite");
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "reduced");
  await page.getByRole("button", { name: "Mettre en pause" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "paused");
  await page.getByRole("button", { name: "Reprendre" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "running");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "reduced");
  const reloadedAnimationControl = page.locator(".animation-preferences-control");
  await reloadedAnimationControl.getByTestId("animation-preferences-trigger").hover();
  await reloadedAnimationControl.getByRole("group", { name: "Niveau d’animations" }).getByRole("button", { name: /Désactivées/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "ultra-lite");
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "off");
});

test("ne réintroduit pas le poisson de révélation dans le Parcours", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");

  await expect(page.locator(".timeline-section .section-reveal-fish")).toHaveCount(0);
  await expect(page.locator(".ocean-transition-stage")).toHaveAttribute("data-reveal-engine", "cinematic-world-reveal");
});

test("@vitals respecte les budgets Web Vitals sur mobile", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "Les métriques PerformanceObserver sont contrôlées dans Chromium.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const supportedEntryTypes = PerformanceObserver.supportedEntryTypes ?? [];
    window.__portfolioPerformance = {
      lcp: 0,
      cls: 0,
      inp: 0,
      lcpSupported: supportedEntryTypes.includes("largest-contentful-paint"),
      lcpSamples: 0,
      interactions: {},
    };

    if (window.__portfolioPerformance.lcpSupported) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries.at(-1);
        if (last) {
          window.__portfolioPerformance.lcp = last.startTime;
          window.__portfolioPerformance.lcpSamples += entries.length;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes?.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__portfolioPerformance.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes?.includes("event")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.interactionId || !entry.duration) continue;
          const key = String(entry.interactionId);
          window.__portfolioPerformance.interactions[key] = Math.max(
            window.__portfolioPerformance.interactions[key] ?? 0,
            entry.duration,
          );
          window.__portfolioPerformance.inp = Math.max(
            window.__portfolioPerformance.inp,
            window.__portfolioPerformance.interactions[key],
          );
        }
      }).observe({ type: "event", durationThreshold: 16, buffered: true });
    }
  });

  await openPortfolioContract(page, "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });

  // LCP stops being updated after the first user interaction. Wait for an
  // actual paint candidate before generating the interaction used for INP.
  await page.waitForFunction(
    () => window.__portfolioPerformance?.lcp > 0,
    undefined,
    { timeout: CONTRACT_TIMEOUT_MS },
  );

  // Warm the interaction path before starting the isolated INP sample.
  const navigationButton = page.getByRole("button", { name: "Navigation principale" });
  await navigationButton.click();
  await expect(navigationButton).toHaveAttribute("aria-expanded", "true");
  await navigationButton.click();
  await expect(navigationButton).toHaveAttribute("aria-expanded", "false");
  await page.evaluate(() => {
    window.__portfolioPerformance.inp = 0;
    window.__portfolioPerformance.interactions = {};
  });

  await navigationButton.click();
  await expect(navigationButton).toHaveAttribute("aria-expanded", "true");
  await expect.poll(
    () => page.evaluate(() => Object.keys(window.__portfolioPerformance?.interactions ?? {}).length),
    { timeout: CONTRACT_TIMEOUT_MS, intervals: [50, 100, 250] },
  ).toBeGreaterThan(0);

  const metrics = await page.evaluate(() => ({
    ...window.__portfolioPerformance,
    interactionSamples: Object.keys(window.__portfolioPerformance.interactions ?? {}).length,
    resources: performance.getEntriesByType("resource").length,
  }));

  await testInfo.attach("performance-metrics.json", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });

  expect(metrics.lcpSupported).toBe(true);
  expect(metrics.lcpSamples).toBeGreaterThan(0);
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.lcp).toBeLessThanOrEqual(2500);
  expect(metrics.cls).toBeLessThanOrEqual(0.1);
  expect(metrics.interactionSamples).toBeGreaterThan(0);
  expect(metrics.inp).toBeLessThanOrEqual(200);
  expect(metrics.resources).toBeLessThanOrEqual(50);
});
