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
    const published = {
      width: null,
      height: null,
      top: null,
      scale: null,
      mode: null,
    };

    const publishStyle = (property, key, value) => {
      if (published[key] === value) return;
      published[key] = value;
      root.style.setProperty(property, value);
    };

    const update = () => {
      frame = 0;
      const viewportWidth = `${Math.round(visualViewport?.width ?? window.innerWidth)}px`;
      const viewportHeight = `${Math.round(visualViewport?.height ?? window.innerHeight)}px`;
      const viewportTop = `${Math.round(visualViewport?.offsetTop ?? 0)}px`;
      const viewportScale = String(visualViewport?.scale ?? 1);
      const viewportMode = compactQuery.matches ? "compact" : "wide";

      // visualViewport can dispatch scroll/resize events even when its rounded
      // geometry did not change. Avoid rewriting <html> in that case: root
      // custom-property writes invalidate style across most of the document.
      publishStyle("--visual-viewport-width", "width", viewportWidth);
      publishStyle("--visual-viewport-height", "height", viewportHeight);
      publishStyle("--visual-viewport-top", "top", viewportTop);
      publishStyle("--visual-viewport-scale", "scale", viewportScale);
      if (published.mode !== viewportMode) {
        published.mode = viewportMode;
        root.dataset.viewport = viewportMode;
      }
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
