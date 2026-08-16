import { useEffect } from "react";
import useAnimationPreferences from "../../contexts/useAnimationPreferences";

const DESKTOP_QUERY = "(min-width: 1241px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetShellPointer(shell) {
  shell.style.setProperty("--nav-shell-pointer-x", "50%");
  shell.style.setProperty("--nav-shell-pointer-y", "22%");
  shell.classList.remove("is-shell-pointer-active");
}

export default function usePremiumNavigationShellMotion(shellRef) {
  const { animationsEnabled, animationsPaused, performanceMode } = useAnimationPreferences();

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof window === "undefined") return undefined;

    const desktopMedia = window.matchMedia(DESKTOP_QUERY);
    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    const canAnimate = () => animationsEnabled
      && !animationsPaused
      && performanceMode === "full"
      && desktopMedia.matches
      && !reducedMotionMedia.matches;

    let pointerFrame = 0;
    let shellRect = shell.getBoundingClientRect();

    const refreshShellGeometry = () => {
      shellRect = shell.getBoundingClientRect();
    };

    const updatePointer = (event) => {
      if (!canAnimate()) return;
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);

      const clientX = event.clientX;
      const clientY = event.clientY;
      pointerFrame = window.requestAnimationFrame(() => {
        const rect = shellRect;
        if (!rect.width || !rect.height) return;

        const ratioX = clamp((clientX - rect.left) / rect.width, 0, 1);
        const ratioY = clamp((clientY - rect.top) / rect.height, 0, 1);

        shell.style.setProperty("--nav-shell-pointer-x", `${(ratioX * 100).toFixed(2)}%`);
        shell.style.setProperty("--nav-shell-pointer-y", `${(ratioY * 100).toFixed(2)}%`);
        shell.classList.add("is-shell-pointer-active");
      });
    };

    const onPointerEnter = (event) => {
      if (!canAnimate()) return;
      refreshShellGeometry();
      shell.classList.add("is-shell-pointer-active");
      updatePointer(event);
    };

    const onPointerLeave = () => {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => resetShellPointer(shell));
    };

    const onPreferenceChange = () => {
      if (!canAnimate()) resetShellPointer(shell);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refreshShellGeometry) : null;
    resizeObserver?.observe(shell);
    window.addEventListener("resize", refreshShellGeometry, { passive: true });

    resetShellPointer(shell);
    shell.addEventListener("pointerenter", onPointerEnter, { passive: true });
    shell.addEventListener("pointermove", updatePointer, { passive: true });
    shell.addEventListener("pointerleave", onPointerLeave, { passive: true });
    desktopMedia.addEventListener?.("change", onPreferenceChange);
    reducedMotionMedia.addEventListener?.("change", onPreferenceChange);

    return () => {
      shell.removeEventListener("pointerenter", onPointerEnter);
      shell.removeEventListener("pointermove", updatePointer);
      shell.removeEventListener("pointerleave", onPointerLeave);
      desktopMedia.removeEventListener?.("change", onPreferenceChange);
      reducedMotionMedia.removeEventListener?.("change", onPreferenceChange);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", refreshShellGeometry);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      resetShellPointer(shell);
    };
  }, [animationsEnabled, animationsPaused, performanceMode, shellRef]);
}
