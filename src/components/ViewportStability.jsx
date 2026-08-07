import { useEffect } from "react";

const MOBILE_VIEWPORT_QUERY = "(max-width: 820px)";

/**
 * Keeps CSS viewport variables aligned with the visual viewport.
 * This avoids mobile browser chrome and virtual-keyboard resize glitches
 * without forcing React renders during resize/scroll.
 */
export default function ViewportStability() {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    const compactQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewportWidth = visualViewport?.width ?? window.innerWidth;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportScale = visualViewport?.scale ?? 1;

      root.style.setProperty("--visual-viewport-width", `${Math.round(viewportWidth)}px`);
      root.style.setProperty("--visual-viewport-height", `${Math.round(viewportHeight)}px`);
      root.style.setProperty("--visual-viewport-top", `${Math.round(viewportTop)}px`);
      root.style.setProperty("--visual-viewport-scale", String(viewportScale));
      root.dataset.viewport = compactQuery.matches ? "compact" : "wide";
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
    visualViewport?.addEventListener("resize", scheduleUpdate, { passive: true });
    visualViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });
    compactQuery.addEventListener?.("change", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      visualViewport?.removeEventListener("resize", scheduleUpdate);
      visualViewport?.removeEventListener("scroll", scheduleUpdate);
      compactQuery.removeEventListener?.("change", scheduleUpdate);
      delete root.dataset.viewport;
      [
        "--visual-viewport-width",
        "--visual-viewport-height",
        "--visual-viewport-top",
        "--visual-viewport-scale",
      ].forEach((property) => root.style.removeProperty(property));
    };
  }, []);

  return null;
}
