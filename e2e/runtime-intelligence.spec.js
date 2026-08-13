import { expect, test } from "./support/test-fixtures";
import { openPortfolioContract } from "./support/runtime-contract";

test.describe.configure({ mode: "parallel", timeout: 60_000 });

test("@runtime expose un snapshot adaptatif cohérent sans sacrifier le contenu", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");

  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-runtime-profile", /ultra|high|balanced|reduced|survival/);
  await expect(page.locator("html")).toHaveAttribute("data-runtime-quality", /high|balanced|constrained/);
  await expect(page.locator("html")).toHaveAttribute("data-runtime-memory", /normal|watch|pressure|critical|recovering/);

  const snapshot = await page.evaluate(() => window.__portfolioGetRuntimeSnapshot?.());
  expect(snapshot).toBeTruthy();
  expect(snapshot.profile).toMatch(/ultra|high|balanced|reduced|survival/);
  expect(snapshot.budget.aquariumFps).toBeGreaterThan(0);
  expect(snapshot.budget.marinePopulationScale).toBeGreaterThan(0);
  expect(snapshot.capabilities.hardwareConcurrency).toBeGreaterThan(0);
  expect(typeof snapshot.capabilities.webgl2Supported).toBe("boolean");
  expect(snapshot.resources.activeCount).toBeGreaterThan(0);
  expect(Array.isArray(snapshot.decisions)).toBe(true);
});

test("@runtime libère les ressources du monde océanique lors d'une navigation SPA", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPortfolioContract(page, "fr");

  await expect.poll(() => page.evaluate(() => {
    const snapshot = window.__portfolioGetRuntimeSnapshot?.();
    return snapshot?.resources?.active?.some((resource) => resource.owner === "GlobalAquarium") ?? false;
  })).toBe(true);

  await page.evaluate(() => {
    history.pushState({}, "", "/recruiter");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/recruiter$/);

  await expect.poll(() => page.evaluate(() => {
    const snapshot = window.__portfolioGetRuntimeSnapshot?.();
    return snapshot?.resources?.active?.filter((resource) => resource.owner === "GlobalAquarium").length ?? -1;
  })).toBe(0);

  const leakCount = await page.evaluate(() => window.__portfolioGetRuntimeSnapshot?.().resources.possibleLeaks.length ?? -1);
  expect(leakCount).toBe(0);
});
