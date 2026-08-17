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
  const englishResponse = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), "en") && response.status() === 200,
  );

  await page.getByTestId("command-options-trigger").click();
  const commandPanel = page.getByRole("dialog", { name: "Options" });
  await expect(commandPanel).toBeVisible();

  const languageTrigger = commandPanel.getByRole("button", { name: /^Langue\b/ });
  await expect(languageTrigger).toBeVisible();
  await languageTrigger.click();

  const languageGroup = commandPanel.getByRole("group", { name: "Choisir la langue" });
  await expect(languageGroup).toBeVisible();
  await languageGroup.getByRole("button", { name: /English/ }).click();
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

  const projectsSection = page.locator("#projects");
  await expect(projectsSection).toBeVisible();
  const trigger = projectsSection.getByRole("button", { name: "Détails", exact: true }).first();
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();
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

  await page.getByRole("button", { name: "Plus d’options" }).click();
  const morePanel = page.getByRole("dialog", { name: "Plus" });
  await expect(morePanel).toBeVisible();
  await morePanel.getByRole("button", { name: "Options" }).click();

  const optionsPanel = page.getByRole("dialog", { name: "Options" });
  await expect(optionsPanel).toBeVisible();
  const mobileSettings = optionsPanel.locator(".animation-preferences-mobile");
  await expect(mobileSettings).toBeVisible();
  await mobileSettings.getByRole("button", { name: "Désactivées" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "off");
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "ultra-lite");
});

test("mémorise les préférences d’animation et active le mode ultra-léger", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");

  await page.getByTestId("command-options-trigger").click();
  const commandPanel = page.getByRole("dialog", { name: "Options" });
  const animationNavItem = commandPanel.getByTestId("animation-preferences-trigger");
  await expect(animationNavItem).toHaveAccessibleName("Animations");
  await expect(animationNavItem).toContainText("Animations");
  await expect(animationNavItem).not.toContainText("FX");
  await animationNavItem.click();
  const settings = commandPanel.getByRole("group", { name: "Niveau d’animations" });
  await expect(settings).toBeVisible();
  await settings.getByRole("button", { name: /Réduit/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "lite");
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "reduced");
  await commandPanel.getByRole("switch", { name: "Mettre en pause" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "paused");
  await commandPanel.getByRole("switch", { name: "Reprendre" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-animation-state", "running");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-animation-preference", "reduced");
  await page.getByTestId("command-options-trigger").click();
  const reloadedCommandPanel = page.getByRole("dialog", { name: "Options" });
  await reloadedCommandPanel.getByTestId("animation-preferences-trigger").click();
  await reloadedCommandPanel.getByRole("group", { name: "Niveau d’animations" }).getByRole("button", { name: /Off|Désactivées/ }).click();
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
      interactionDetails: {},
      sampleStart: 0,
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
          if (entry.startTime < (window.__portfolioPerformance.sampleStart ?? 0)) continue;
          const key = String(entry.interactionId);
          const duration = Math.max(window.__portfolioPerformance.interactions[key] ?? 0, entry.duration);
          window.__portfolioPerformance.interactions[key] = duration;
          const inputDelay = Math.max(0, entry.processingStart - entry.startTime);
          const processing = Math.max(0, entry.processingEnd - entry.processingStart);
          const presentation = Math.max(0, entry.duration - (entry.processingEnd - entry.startTime));
          const previous = window.__portfolioPerformance.interactionDetails[key];
          if (!previous || entry.duration >= previous.duration) {
            window.__portfolioPerformance.interactionDetails[key] = {
              name: entry.name,
              duration: entry.duration,
              inputDelay,
              processing,
              presentation,
              target: entry.target instanceof Element ? (entry.target.getAttribute("class") || entry.target.tagName) : null,
              startTime: entry.startTime,
            };
          }
          window.__portfolioPerformance.inp = Math.max(window.__portfolioPerformance.inp, duration);
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
  const navigationButton = page.getByRole("button", { name: "Plus d’options" });
  await navigationButton.click();
  await expect(navigationButton).toHaveAttribute("aria-expanded", "true");
  await navigationButton.click();
  await expect(navigationButton).toHaveAttribute("aria-expanded", "false");
  // EventTiming timestamps isolate late observer delivery, but they do not drain
  // presentation work already queued by the warm-up. Give the precomposed dock
  // one full motion window plus two frames before starting the measured sample.
  await page.evaluate(() => new Promise((resolve) => {
    let remaining = 4;
    const settleFrame = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(settleFrame);
    };
    requestAnimationFrame(settleFrame);
  }));
  // Start a real isolated sample. PerformanceObserver delivery is asynchronous:
  // warm-up EventTiming entries can arrive after the reset unless we reject entries
  // whose startTime predates this boundary.
  await page.evaluate(() => {
    window.__portfolioPerformance.sampleStart = performance.now();
    window.__portfolioPerformance.inp = 0;
    window.__portfolioPerformance.interactions = {};
    window.__portfolioPerformance.interactionDetails = {};
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
  const slowestInteraction = Object.values(metrics.interactionDetails ?? {}).sort((a, b) => b.duration - a.duration)[0] ?? null;
  expect(metrics.inp, `INP breakdown: ${JSON.stringify(slowestInteraction)}`).toBeLessThanOrEqual(200);
  expect(metrics.resources).toBeLessThanOrEqual(50);
});
