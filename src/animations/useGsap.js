import { useEffect } from "react";

let gsapPromise;

function waitForGsap(timeout = 5000) {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.gsap) return Promise.resolve({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger });

  if (!gsapPromise) {
    gsapPromise = new Promise((resolve) => {
      const startedAt = performance.now();
      const tick = () => {
        if (window.gsap) {
          resolve({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger });
          return;
        }
        if (performance.now() - startedAt > timeout) {
          resolve(null);
          return;
        }
        window.requestAnimationFrame(tick);
      };
      tick();
    });
  }

  return gsapPromise;
}

export function useGsap(rootRef, setup, deps = []) {
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    waitForGsap().then((runtime) => {
      if (disposed || !runtime?.gsap || !rootRef.current) return;
      const { gsap, ScrollTrigger } = runtime;
      if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

      let localCleanup = () => {};
      const context = gsap.context(() => {
        const returnedCleanup = setup(gsap, ScrollTrigger);
        if (typeof returnedCleanup === "function") localCleanup = returnedCleanup;
      }, rootRef.current);

      cleanup = () => {
        localCleanup();
        context.revert();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function gsapReady() {
  return waitForGsap();
}
