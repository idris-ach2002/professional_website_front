import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let registered = false;

function getGsapRuntime() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }

  return { gsap, ScrollTrigger };
}

export function useGsap(rootRef, setup, deps = [], options = {}) {
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia?.(MOBILE_QUERY).matches;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION_QUERY).matches;

    if (isMobile && !options.allowOnMobile) return undefined;
    if (reducedMotion && !options.allowOnReducedMotion) return undefined;

    const { gsap: runtimeGsap, ScrollTrigger: runtimeScrollTrigger } = getGsapRuntime();
    if (!rootRef.current) return undefined;

    let localCleanup = () => {};
    const context = runtimeGsap.context(() => {
      const returnedCleanup = setup(runtimeGsap, runtimeScrollTrigger);
      if (typeof returnedCleanup === "function") localCleanup = returnedCleanup;
    }, rootRef.current);

    return () => {
      localCleanup();
      context.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function gsapReady() {
  return Promise.resolve(getGsapRuntime());
}
