import { expect, test } from "@playwright/test";
import { portfolioOwner } from "./fixtures/owner";

const PUBLIC_WEBSITE_PATH = "/website/default";

function isPublicWebsiteRequest(url, locale) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.endsWith(PUBLIC_WEBSITE_PATH)
      && parsedUrl.searchParams.get("locale") === locale;
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

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockPublicApi(page);
});

test("charge l'accueil depuis l'API publique", async ({ page }) => {
  await openPortfolio(page, "fr");

  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("rend le lien d’évitement accessible au clavier", async ({ page }) => {
  await openPortfolio(page, "fr");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Aller au contenu principal" });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("bascule du français vers l'anglais", async ({ page }) => {
  await openPortfolio(page, "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();

  const englishResponse = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), "en") && response.status() === 200,
  );
  const languageGroup = page.getByRole("group", { name: /langue/i }).first();
  await languageGroup.getByRole("button", { name: "EN" }).click();
  await englishResponse;

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Full Stack Java Developer" })).toBeVisible();
});


test("expose une route anglaise indexable", async ({ page }) => {
  await openPortfolio(page, "en");

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Full Stack Java Developer" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en$/);
});

test("piège le focus dans la modale projet et le restaure", async ({ page }) => {
  await openPortfolio(page, "fr");

  const trigger = page.getByRole("button", { name: "Détails" }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: /Projet.*Portfolio fiable/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2, name: "Projet — Portfolio fiable" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fermer les détails du projet" })).toBeFocused();

  for (let index = 0; index < 8; index += 1) await page.keyboard.press("Tab");
  await expect(dialog).toContainText("Portfolio fiable");
  await expect(dialog.locator(":focus")).toHaveCount(1);

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
  await openPortfolio(page, "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("utilise le fallback français quand l'API est indisponible", async ({ page }) => {
  await page.unroute("**/website/default**");
  await page.route("**/website/default**", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ code: "SERVICE_UNAVAILABLE" }),
  }));

  await page.goto("/?lang=fr", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible({ timeout: 20_000 });
});
