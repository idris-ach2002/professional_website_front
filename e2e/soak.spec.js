import process from "node:process";
import { expect, test } from "@playwright/test";
import { portfolioOwner } from "./fixtures/owner";

const SOAK_DURATION_MS = Math.max(10_000, Number(process.env.SOAK_DURATION_MS) || 60_000);

test.beforeEach(async ({ page }) => {
  await page.route("**/website/default**", async (route) => {
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(portfolioOwner(locale)) });
  });
  await page.route("**/analytics/events", (route) => route.fulfill({ status: 204, body: "" }));
});

test("@soak maintient le Living Ocean World stable pendant une session longue", async ({ page }) => {
  test.setTimeout(SOAK_DURATION_MS + 45_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main#main-content")).toBeVisible();

  const selectors = ["#profile", "#timeline", "#abyss-volcano-field", "#projects", "#ocean-outro", "#projects", "#timeline"];
  const deadline = Date.now() + SOAK_DURATION_MS;
  let pass = 0;

  while (Date.now() < deadline) {
    const selector = selectors[pass % selectors.length];
    const target = page.locator(selector);
    if (selector === "#abyss-volcano-field") await expect(target).toBeAttached({ timeout: 10_000 });
    await target.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "auto" }));
    await page.waitForTimeout(110);
    pass += 1;
  }

  const runtime = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    aquariumFps: Number(document.querySelector(".global-aquarium")?.dataset.simulationFps || 0),
    mineCanvases: document.querySelectorAll(".treasure-mine-canvas").length,
    mineMode: document.querySelector(".treasure-mine-field")?.dataset.renderMode,
    biome: document.documentElement.dataset.oceanBiome,
  }));

  expect(runtime.horizontalOverflow).toBeLessThanOrEqual(1);
  expect(runtime.aquariumFps).toBeGreaterThan(0);
  expect(runtime.aquariumFps).toBeLessThanOrEqual(60);
  expect(runtime.mineCanvases).toBe(2);
  expect(runtime.mineMode).toBe("static-base-dynamic-fx");
  expect(runtime.biome).toBeTruthy();
  expect(errors, `Erreurs runtime pendant le soak: ${errors.join(" | ")}`).toEqual([]);
});
