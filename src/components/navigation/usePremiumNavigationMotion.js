import { useEffect } from "react";
import useAnimationPreferences from "../../contexts/useAnimationPreferences";

const DESKTOP_QUERY = "(min-width: 1241px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEFAULT_ACCENT = "79,196,220";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readAccent(item) {
  const group = item.closest(".nav_menu-dropdown-toggle-v2");
  if (!group) return DEFAULT_ACCENT;
  return window.getComputedStyle(group).getPropertyValue("--nav-item-accent").trim() || DEFAULT_ACCENT;
}

function findActiveItem(items, activeSection) {
  if (!activeSection) return items[0] ?? null;
  return items.find((item) => item.dataset.navSection === activeSection) ?? items[0] ?? null;
}

function setStylePropertyIfChanged(element, property, value) {
  if (element.style.getPropertyValue(property) === value) return false;
  element.style.setProperty(property, value);
  return true;
}

function resetPointerMaterial(item) {
  setStylePropertyIfChanged(item, "--nav-pointer-x", "18%");
  setStylePropertyIfChanged(item, "--nav-pointer-y", "50%");
  setStylePropertyIfChanged(item, "--nav-shift-x", "0px");
  setStylePropertyIfChanged(item, "--nav-shift-y", "0px");
}

export default function usePremiumNavigationMotion(rootRef, activeSection) {
  const { animationsEnabled, animationsPaused, performanceMode, effectiveNavbarMotion } = useAnimationPreferences();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return undefined;

    const desktopMedia = window.matchMedia(DESKTOP_QUERY);
    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    const canAnimate = () => animationsEnabled
      && !animationsPaused
      && effectiveNavbarMotion === "animated"
      && performanceMode === "full"
      && desktopMedia.matches
      && !reducedMotionMedia.matches;

    const lens = root.querySelector("[data-nav-lens]");
    const items = Array.from(root.querySelectorAll("[data-nav-primary]"));
    if (!lens || items.length === 0) return undefined;

    let resizeFrame = 0;
    let pointerFrame = 0;
    let activeItem = findActiveItem(items, activeSection);
    let pointedItem = null;
    let focusedItem = null;
    let rootRect = null;
    const geometry = new Map();
    const pointerShift = new Map(items.map((item) => [item, { x: 0, y: 0 }]));

    const refreshGeometry = () => {
      // Read all geometry/computed accents in one phase. The cached rectangle is
      // normalized back to the unshifted magnetic position so pointer tracking
      // never needs a layout read in its RAF hot path.
      rootRect = root.getBoundingClientRect();
      for (const item of items) {
        const rect = item.getBoundingClientRect();
        const shift = pointerShift.get(item) ?? { x: 0, y: 0 };
        geometry.set(item, {
          rect: {
            left: rect.left - shift.x,
            top: rect.top - shift.y,
            width: rect.width,
            height: rect.height,
          },
          accent: readAccent(item),
        });
      }
    };

    const setLensTarget = (item, { hovered = false, instant = false } = {}) => {
      if (!item) {
        lens.classList.remove("is-visible", "is-hovered");
        return;
      }

      const cached = geometry.get(item);
      if (!rootRect || !cached) refreshGeometry();
      const itemGeometry = geometry.get(item);
      if (!rootRect || !itemGeometry) return;
      const itemRect = itemGeometry.rect;

      setStylePropertyIfChanged(lens, "--nav-lens-x", `${itemRect.left - rootRect.left}px`);
      setStylePropertyIfChanged(lens, "--nav-lens-y", `${itemRect.top - rootRect.top}px`);
      setStylePropertyIfChanged(lens, "--nav-lens-width", `${itemRect.width}px`);
      setStylePropertyIfChanged(lens, "--nav-lens-height", `${itemRect.height}px`);
      setStylePropertyIfChanged(lens, "--nav-lens-accent", itemGeometry.accent);
      lens.classList.toggle("is-hovered", hovered);
      lens.classList.add("is-visible");

      if (instant) {
        lens.classList.add("is-instant");
        window.requestAnimationFrame(() => lens.classList.remove("is-instant"));
      }
    };

    const syncLens = ({ instant = false } = {}) => {
      if (!canAnimate()) {
        lens.classList.remove("is-visible", "is-hovered");
        return;
      }

      const interactionItem = pointedItem ?? focusedItem;
      setLensTarget(interactionItem ?? activeItem, {
        hovered: Boolean(interactionItem),
        instant,
      });
    };

    const updatePointerMaterial = (item, event) => {
      if (!canAnimate()) return;
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);

      const clientX = event.clientX;
      const clientY = event.clientY;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        let cached = geometry.get(item);
        if (!cached) {
          refreshGeometry();
          cached = geometry.get(item);
        }
        const rect = cached?.rect;
        if (!rect?.width || !rect?.height) return;

        const previousShift = pointerShift.get(item) ?? { x: 0, y: 0 };
        const ratioX = clamp((clientX - (rect.left + previousShift.x)) / rect.width, 0, 1);
        const ratioY = clamp((clientY - (rect.top + previousShift.y)) / rect.height, 0, 1);
        const shiftX = (ratioX - 0.5) * 2.4;
        const shiftY = (ratioY - 0.5) * 1.25;
        pointerShift.set(item, { x: shiftX, y: shiftY });

        setStylePropertyIfChanged(item, "--nav-pointer-x", `${ratioX * 100}%`);
        setStylePropertyIfChanged(item, "--nav-pointer-y", `${ratioY * 100}%`);
        setStylePropertyIfChanged(item, "--nav-shift-x", `${shiftX.toFixed(2)}px`);
        setStylePropertyIfChanged(item, "--nav-shift-y", `${shiftY.toFixed(2)}px`);
      });
    };

    const cleanupListeners = [];

    items.forEach((item) => {
      const surface = item.closest(".nav_menu-dropdown-toggle-v2") ?? item;
      resetPointerMaterial(item);
      pointerShift.set(item, { x: 0, y: 0 });

      const onPointerEnter = () => {
        pointedItem = item;
        refreshGeometry();
        syncLens();
      };
      const onPointerMove = (event) => updatePointerMaterial(item, event);
      const onPointerLeave = () => {
        if (pointedItem === item) pointedItem = null;
        if (focusedItem !== item) {
          resetPointerMaterial(item);
          pointerShift.set(item, { x: 0, y: 0 });
        }
        syncLens();
      };
      const onFocus = () => {
        focusedItem = item;
        syncLens();
      };
      const onBlur = () => {
        if (focusedItem === item) focusedItem = null;
        if (pointedItem !== item) {
          resetPointerMaterial(item);
          pointerShift.set(item, { x: 0, y: 0 });
        }
        syncLens();
      };

      surface.addEventListener("pointerenter", onPointerEnter);
      surface.addEventListener("pointerleave", onPointerLeave);
      item.addEventListener("pointermove", onPointerMove, { passive: true });
      item.addEventListener("focus", onFocus);
      item.addEventListener("blur", onBlur);

      if (surface.matches(":hover")) pointedItem = item;
      if (document.activeElement === item) focusedItem = item;

      cleanupListeners.push(() => {
        surface.removeEventListener("pointerenter", onPointerEnter);
        surface.removeEventListener("pointerleave", onPointerLeave);
        item.removeEventListener("pointermove", onPointerMove);
        item.removeEventListener("focus", onFocus);
        item.removeEventListener("blur", onBlur);
        resetPointerMaterial(item);
        pointerShift.set(item, { x: 0, y: 0 });
      });
    });

    const onViewportChange = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        activeItem = findActiveItem(items, activeSection);
        refreshGeometry();
        syncLens({ instant: true });
      });
    };

    const ResizeObserverCtor = window.ResizeObserver;
    const resizeObserver = ResizeObserverCtor ? new ResizeObserverCtor(onViewportChange) : null;
    resizeObserver?.observe(root);
    window.addEventListener("resize", onViewportChange, { passive: true });
    desktopMedia.addEventListener?.("change", onViewportChange);
    reducedMotionMedia.addEventListener?.("change", onViewportChange);

    syncLens({ instant: true });

    return () => {
      cleanupListeners.forEach((cleanup) => cleanup());
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onViewportChange);
      desktopMedia.removeEventListener?.("change", onViewportChange);
      reducedMotionMedia.removeEventListener?.("change", onViewportChange);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      lens.classList.remove("is-visible", "is-hovered", "is-instant");
    };
  }, [activeSection, animationsEnabled, animationsPaused, performanceMode, effectiveNavbarMotion, rootRef]);
}
