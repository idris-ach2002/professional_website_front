import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let runtimePromise = null;

async function getGsapRuntime() {
  if (!runtimePromise) {
    runtimePromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollModule]) => {
      const gsap = gsapModule.gsap ?? gsapModule.default;
      const ScrollTrigger = scrollModule.ScrollTrigger ?? scrollModule.default;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    });
  }

  return runtimePromise;
}

export function useGsap(rootRef, setup, deps = [], options = {}) {
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia?.(MOBILE_QUERY).matches;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION_QUERY).matches;

    if (isMobile && !options.allowOnMobile) return undefined;
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
  }, deps);
}

export function gsapReady() {
  return getGsapRuntime();
}
