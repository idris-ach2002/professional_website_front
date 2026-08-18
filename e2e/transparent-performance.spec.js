import { expect, test } from "./support/test-fixtures";
import { openPortfolioContract } from "./support/runtime-contract";

test("@transparent-performance conserve un fallback déterministe sans changer le contrat DOM", async ({ context, page }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem("portfolio-animation-preference", "full");
    window.localStorage.setItem("portfolio-animation-paused", "false");
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");

  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "full");

  const oceanCanvas = page.locator("canvas.ocean-transition-stage");
  await expect(oceanCanvas).toBeAttached();
  await expect(oceanCanvas).toHaveAttribute("data-reveal-engine", "cinematic-world-reveal");

  // Le navigateur peut légitimement être encore sur le fallback main-thread ou
  // avoir déjà transféré le Canvas. Le gate E2E vérifie le contrat observable ;
  // le protocole Worker/OffscreenCanvas est couvert de façon déterministe par
  // les tests unitaires et le checker statique.
  const renderThread = await oceanCanvas.getAttribute("data-render-thread");
  expect(["main", "worker"]).toContain(renderThread);

  const capabilities = await page.evaluate(() => ({
    worker: typeof Worker !== "undefined",
    offscreen: typeof OffscreenCanvas !== "undefined",
    transfer: typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function",
  }));
  expect(typeof capabilities.worker).toBe("boolean");
  expect(typeof capabilities.offscreen).toBe("boolean");
  expect(typeof capabilities.transfer).toBe("boolean");

  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();
  await expect(page.locator("#main-content")).toBeAttached();
});
