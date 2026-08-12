import { expect } from "@playwright/test";
import { CONTRACT_TIMEOUT_MS } from "./runtime-contract";

/**
 * Deterministically place a persistent world anchor at the decision point,
 * wait for real paint barriers, then request synchronous World Director
 * reconciliation. No fixed-duration sleep is involved.
 */
export async function reconcileWorldAtAnchor(page, selector, {
  align = "center",
  reason = "e2e-world-anchor",
  timeout = CONTRACT_TIMEOUT_MS,
  metadata = {},
} = {}) {
  const target = page.locator(selector);
  await expect(target, `précondition: ancre ${selector} montée`).toBeAttached({ timeout });
  await expect(page.locator("html"), "précondition: World Director prêt")
    .toHaveAttribute("data-ocean-director-ready", "true", { timeout });

  const result = await target.evaluate(async (element, navigation) => {
    const root = document.documentElement;
    const body = document.body;
    const scrollingElement = document.scrollingElement ?? root;
    const viewportHeight = Math.max(1, window.innerHeight);
    const focusY = viewportHeight / 2;
    const previousRootBehavior = root.style.getPropertyValue("scroll-behavior");
    const previousRootPriority = root.style.getPropertyPriority("scroll-behavior");
    const previousBodyBehavior = body?.style.getPropertyValue("scroll-behavior") ?? "";
    const previousBodyPriority = body?.style.getPropertyPriority("scroll-behavior") ?? "";
    const nextPaint = () => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    const restoreScrollBehavior = () => {
      if (previousRootBehavior) root.style.setProperty("scroll-behavior", previousRootBehavior, previousRootPriority);
      else root.style.removeProperty("scroll-behavior");
      if (!body) return;
      if (previousBodyBehavior) body.style.setProperty("scroll-behavior", previousBodyBehavior, previousBodyPriority);
      else body.style.removeProperty("scroll-behavior");
    };

    root.style.setProperty("scroll-behavior", "auto", "important");
    body?.style.setProperty("scroll-behavior", "auto", "important");

    let geometry = null;
    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (!element.isConnected) throw new Error(`Detached E2E anchor: ${navigation.selector}`);

        const rect = element.getBoundingClientRect();
        const maxScroll = Math.max(0, scrollingElement.scrollHeight - viewportHeight);
        const absoluteCenter = scrollingElement.scrollTop + rect.top + rect.height / 2;
        const requestedTop = navigation.align === "start"
          ? 0
          : navigation.align === "end"
            ? maxScroll
            : absoluteCenter - focusY;
        const expectedScrollTop = Math.max(0, Math.min(maxScroll, requestedTop));

        scrollingElement.scrollTop = expectedScrollTop;
        await nextPaint();

        const settledRect = element.getBoundingClientRect();
        const settledMaxScroll = Math.max(0, scrollingElement.scrollHeight - viewportHeight);
        const scrollTop = scrollingElement.scrollTop;
        const targetCenterY = settledRect.top + settledRect.height / 2;
        const targetVisible = settledRect.top < viewportHeight && settledRect.bottom > 0;
        const scrollError = Math.abs(scrollTop - Math.max(0, Math.min(settledMaxScroll, expectedScrollTop)));
        const centerError = Math.abs(targetCenterY - focusY);
        const reachedStart = scrollTop <= 2;
        const reachedEnd = scrollTop >= settledMaxScroll - 2;

        geometry = {
          connected: element.isConnected,
          focusY,
          maxScroll: settledMaxScroll,
          scrollTop,
          targetCenterY,
          targetVisible,
          centerError,
          scrollError,
          reachedStart,
          reachedEnd,
        };

        if (navigation.align === "start") {
          if (reachedStart && scrollError <= 2) break;
        } else if (navigation.align === "end") {
          if (reachedEnd && targetVisible) break;
        } else if (centerError <= 2 && scrollError <= 2) {
          break;
        }
      }

      window.dispatchEvent(new CustomEvent("portfolio:ocean-world-reconcile", {
        detail: { reason: navigation.reason, ...navigation.metadata },
      }));
      await nextPaint();

      return {
        ...geometry,
        path: window.location.pathname,
        language: root.lang,
        mainReady: Boolean(document.querySelector("main#main-content:not(.loading-shell)")),
        animationPreference: root.dataset.animationPreference ?? null,
        performanceProfile: root.dataset.performanceProfile ?? null,
        animationState: root.dataset.animationState ?? null,
        runtimeQuality: root.dataset.runtimeQuality ?? null,
        directorReady: root.dataset.oceanDirectorReady ?? null,
        biome: root.dataset.oceanBiome ?? null,
        targetCount: document.querySelectorAll(navigation.selector).length,
        aquariumFps: Number(document.querySelector(".global-aquarium")?.dataset.simulationFps || 0),
      };
    } finally {
      restoreScrollBehavior();
    }
  }, { selector, align, reason, metadata }, { timeout });

  expect(result, `postcondition: résultat de navigation ${selector}`).not.toBeNull();
  expect(result.connected, `postcondition: ancre ${selector} toujours connectée`).toBe(true);
  expect(result.targetCount, `postcondition: ancre ${selector} unique`).toBe(1);

  if (align === "start") {
    expect(result.reachedStart, `postcondition: début de document atteint pour ${selector}`).toBe(true);
    expect(result.scrollError, `postcondition: scroll stable pour ${selector}`).toBeLessThanOrEqual(2);
  } else if (align === "end") {
    expect(result.reachedEnd, `postcondition: fin de document atteinte pour ${selector}`).toBe(true);
    expect(result.targetVisible, `postcondition: ${selector} visible à la fin`).toBe(true);
  } else {
    expect(result.scrollError, `postcondition: scroll stable pour ${selector}`).toBeLessThanOrEqual(2);
    expect(result.centerError, `postcondition: ${selector} centré`).toBeLessThanOrEqual(2);
  }

  return result;
}

export async function expectWorldBiome(page, selector, expectedBiome, options = {}) {
  const result = await reconcileWorldAtAnchor(page, selector, options);
  expect(result.biome, `postcondition: ${selector} => biome ${expectedBiome}`).toBe(expectedBiome);
  await expect(page.locator("html")).toHaveAttribute("data-ocean-biome", expectedBiome);
  return result;
}
