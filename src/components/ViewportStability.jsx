import { useEffect } from "react";

const MOBILE_VIEWPORT_QUERY = "(max-width: 820px)";
const VIEWPORT_TARGET_SELECTOR = [
  ".nav_fixed.nav_fixed--portfolio",
  ".project-detail-modal-inner",
  ".file-preview-full-image",
  ".file-preview-pdf-frame-shell",
].join(",");

const VIEWPORT_PROPERTIES = [
  ["--visual-viewport-width", "width"],
  ["--visual-viewport-height", "height"],
  ["--visual-viewport-top", "top"],
  ["--visual-viewport-scale", "scale"],
];

/**
 * Keeps the small set of viewport-sensitive UI shells aligned with the visual
 * viewport. Values are scoped to their consumers instead of <html>, so mobile
 * browser chrome cannot invalidate styles for the full portfolio on scroll.
 */
export default function ViewportStability() {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    const compactQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const targets = new Set();
    let frame = 0;
    const published = {
      width: null,
      height: null,
      top: null,
      scale: null,
      mode: null,
    };

    const applyPublishedValues = (target) => {
      if (!(target instanceof HTMLElement)) return;
      for (const [property, key] of VIEWPORT_PROPERTIES) {
        const value = published[key];
        if (value != null && target.style.getPropertyValue(property) !== value) {
          target.style.setProperty(property, value);
        }
      }
    };

    const registerTarget = (target) => {
      if (!(target instanceof HTMLElement) || targets.has(target)) return;
      targets.add(target);
      applyPublishedValues(target);
    };

    const registerTree = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches(VIEWPORT_TARGET_SELECTOR)) registerTarget(node);
      node.querySelectorAll?.(VIEWPORT_TARGET_SELECTOR).forEach(registerTarget);
    };

    document.querySelectorAll(VIEWPORT_TARGET_SELECTOR).forEach(registerTarget);

    const publishStyle = (property, key, value) => {
      if (published[key] === value) return;
      published[key] = value;
      for (const target of targets) {
        if (!target.isConnected) {
          targets.delete(target);
          continue;
        }
        if (target.style.getPropertyValue(property) !== value) {
          target.style.setProperty(property, value);
        }
      }
    };

    const update = () => {
      frame = 0;
      const viewportWidth = `${Math.round(visualViewport?.width ?? window.innerWidth)}px`;
      const viewportHeight = `${Math.round(visualViewport?.height ?? window.innerHeight)}px`;
      const viewportTop = `${Math.round(visualViewport?.offsetTop ?? 0)}px`;
      const viewportScale = String(visualViewport?.scale ?? 1);
      const viewportMode = compactQuery.matches ? "compact" : "wide";

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

    const mutationObserver = typeof MutationObserver !== "undefined"
      ? new MutationObserver((records) => {
        for (const record of records) {
          record.addedNodes.forEach(registerTree);
        }
      })
      : null;
    mutationObserver?.observe(document.body, { childList: true, subtree: true });

    update();
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
    visualViewport?.addEventListener("resize", scheduleUpdate, { passive: true });
    visualViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });
    compactQuery.addEventListener?.("change", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      mutationObserver?.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      visualViewport?.removeEventListener("resize", scheduleUpdate);
      visualViewport?.removeEventListener("scroll", scheduleUpdate);
      compactQuery.removeEventListener?.("change", scheduleUpdate);
      delete root.dataset.viewport;
      for (const target of targets) {
        for (const [property] of VIEWPORT_PROPERTIES) target.style.removeProperty(property);
      }
      targets.clear();
    };
  }, []);

  return null;
}
