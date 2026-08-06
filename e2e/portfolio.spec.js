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

  await page.goto(`/?lang=${locale}`, { waitUntil: "domcontentloaded" });
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

test("bascule du français vers l'anglais", async ({ page }) => {
  await openPortfolio(page, "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();

  const englishResponse = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), "en") && response.status() === 200,
  );
  const languageGroup = page.getByRole("group", { name: /langue/i }).first();
  await languageGroup.getByRole("button", { name: "EN" }).click();
  await englishResponse;

  await expect(page).toHaveURL(/\?lang=en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Full Stack Java Developer" })).toBeVisible();
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
