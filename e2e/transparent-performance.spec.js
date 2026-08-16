import { expect, test } from "./support/test-fixtures";
import { CONTRACT_TIMEOUT_MS, openPortfolioContract } from "./support/runtime-contract";
import { reconcileWorldAtAnchor } from "./support/world-contract";

test("@transparent-performance déporte les surfaces Canvas compatibles sans changer le contrat DOM", async ({ context, page }) => {
  // This dedicated probe must exercise the full-render path. The shared E2E fixture
  // intentionally advertises 2 logical CPUs to test low-power fallbacks, which
  // would otherwise resolve automatic animations to `lite` and correctly keep
  // these canvases on the main-thread fallback.
  await context.addInitScript(() => {
    window.localStorage.setItem("portfolio-animation-preference", "full");
    window.localStorage.setItem("portfolio-animation-paused", "false");
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPortfolioContract(page, "fr");
  await expect(page.locator("html")).toHaveAttribute("data-performance-profile", "full");

  const oceanCanvas = page.locator("canvas.ocean-transition-stage");
  await expect(oceanCanvas).toBeAttached({ timeout: CONTRACT_TIMEOUT_MS });

  const offscreenSupported = await page.evaluate(() => (
    typeof OffscreenCanvas !== "undefined"
    && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
    && typeof Worker !== "undefined"
  ));

  if (offscreenSupported) {
    await expect.poll(
      () => oceanCanvas.getAttribute("data-render-thread"),
      { timeout: CONTRACT_TIMEOUT_MS, message: "OceanTransitionStage doit céder son Canvas au Worker" },
    ).toBe("worker");
  } else {
    await expect(oceanCanvas).toHaveAttribute("data-render-thread", "main");
  }

  // Reuse the same deterministic warm-up path as the Main Thread Laboratory.
  // The volcano is lazy-mounted from a 1200px IntersectionObserver preload zone;
  // scrollIntoViewIfNeeded() on the placeholder alone is not a reliable lifecycle contract.
  await reconcileWorldAtAnchor(page, "#ocean-transition-caldera", {
    reason: "transparent-performance-volcano-warmup",
    timeout: CONTRACT_TIMEOUT_MS,
  });
  const volcano = page.locator("#abyss-volcano-field");
  await expect(volcano, "volcan chargé après l'ancre caldera")
    .toBeAttached({ timeout: CONTRACT_TIMEOUT_MS * 2 });
  await reconcileWorldAtAnchor(page, "#abyss-volcano-field", {
    reason: "transparent-performance-volcano-active",
    timeout: CONTRACT_TIMEOUT_MS * 2,
  });

  if (offscreenSupported) {
    await expect.poll(
      () => volcano.getAttribute("data-volcano-canvas-renderer"),
      { timeout: CONTRACT_TIMEOUT_MS * 2, message: "les particules/débris volcan doivent être OffscreenCanvas" },
    ).toBe("worker");

    // A transferred canvas cannot be reclaimed. Force the lazy volcano out of
    // its preload zone long enough to suspend it, then re-enter: the remount
    // must provide fresh canvases and transfer them again without a boundary error.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
    await expect(volcano).toHaveClass(/is-suspended/, { timeout: 5_000 });
    await reconcileWorldAtAnchor(page, "#abyss-volcano-field", {
      reason: "transparent-performance-volcano-reentry",
      timeout: CONTRACT_TIMEOUT_MS * 2,
    });
    await expect.poll(
      () => volcano.getAttribute("data-volcano-canvas-renderer"),
      { timeout: CONTRACT_TIMEOUT_MS * 2, message: "le volcan doit retransférer des canvases frais après suspension" },
    ).toBe("worker");
  } else {
    await expect(volcano).toHaveAttribute("data-volcano-canvas-renderer", "main");
  }

  // Contract: optimization is render-thread-only; public content and navigation stay intact.
  await expect(page.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeVisible();
  await expect(page.locator("#main-content")).toBeAttached();
});
