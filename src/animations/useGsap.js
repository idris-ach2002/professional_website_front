import { useEffect } from "react";
import useAnimationPreferences from "../contexts/useAnimationPreferences";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let runtimePromise = null;
let runtimeConfigured = false;

async function getGsapRuntime() {
  if (!runtimePromise) {
    runtimePromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollModule]) => {
      const gsap = gsapModule.gsap ?? gsapModule.default;
      const ScrollTrigger = scrollModule.ScrollTrigger ?? scrollModule.default;
      gsap.registerPlugin(ScrollTrigger);
      if (!runtimeConfigured) {
        // Keep GSAP attached to the browser's native requestAnimationFrame cadence.
        // Do not call ticker.fps(): that would only cap/skip ticks on high-refresh displays.
        gsap.ticker.lagSmoothing(240, 16);
        runtimeConfigured = true;
      }
      return { gsap, ScrollTrigger };
    });
  }

  return runtimePromise;
}

export function useGsap(rootRef, setup, deps = [], options = {}) {
  const { animationsEnabled, animationsPaused, performanceMode } = useAnimationPreferences();

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia?.(MOBILE_QUERY).matches;
    if (!animationsEnabled || animationsPaused) return undefined;
    if (performanceMode === "lite" && !options.allowOnLite) return undefined;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION_QUERY).matches;

    if (isMobile && performanceMode !== "full" && !options.allowOnMobile) return undefined;
    if (reducedMotion && !options.allowOnReducedMotion) return undefined;

    let cancelled = false;
    let context = null;
    let localCleanup = () => {};

    getGsapRuntime().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !rootRef.current) return;
      context = gsap.context(() => {
        const returnedCleanup = setup(gsap, ScrollTrigger);
        if (typeof returnedCleanup === "function") localCleanup = returnedCleanup;
      }, rootRef.current);
    }).catch(() => {
      // Animations are progressive enhancement: rendering must survive a runtime load failure.
    });

    return () => {
      cancelled = true;
      localCleanup();
      context?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationsEnabled, animationsPaused, performanceMode, ...deps]);
}

export function gsapReady() {
  return getGsapRuntime();
}
