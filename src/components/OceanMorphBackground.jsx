import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { clamp } from "../animations/timelineMotion";

const FULL_PARTICLE_COUNT = 8;
const BALANCED_PARTICLE_COUNT = 5;
const CONSTRAINED_PARTICLE_COUNT = 3;
const GLOBAL_DEPTH_PAINT_FPS = 45;

const STATIC_OCEAN_PATHS = [
  "M -10 100 V 54 C 2 54 8 64 18 63 C 28 62 31 53 39 51 C 48 48 57 54 66 57 C 76 61 84 54 92 53 C 101 52 108 58 110 62 V 100 H -10 Z",
  "M -10 100 V 70 C 0 67 7 73 17 72 C 27 71 32 58 42 56 C 51 54 58 65 67 69 C 76 73 83 67 92 63 C 101 59 106 57 110 58 V 100 H -10 Z",
];

export default function OceanMorphBackground({
  staticMode = false,
  depthOnly = false,
  performanceMode = "full",
  runtimeQuality = "high",
}) {
  const rootRef = useRef(null);
  const depthOverlayRef = useRef(null);
  const balancedMode = performanceMode === "balanced";
  const runtimeBalanced = runtimeQuality === "balanced";
  const runtimeConstrained = runtimeQuality === "constrained";
  const adaptiveBalanced = balancedMode || runtimeBalanced || runtimeConstrained;
  const particleCount = staticMode || depthOnly
    ? 0
    : runtimeConstrained
      ? CONSTRAINED_PARTICLE_COUNT
      : adaptiveBalanced
        ? BALANCED_PARTICLE_COUNT
        : FULL_PARTICLE_COUNT;

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    const depthOverlay = depthOverlayRef.current;
    if (!root || !depthOverlay) return undefined;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    gsap.set(root, { autoAlpha: 1, "--ocean-depth": 0, "--surface-opacity": 1 });
    depthOverlay.style.opacity = "0.48";

    if (staticMode) return undefined;

    const glows = root.querySelectorAll(".ocean-glow");
    const particles = root.querySelectorAll(".ocean-depth-particle");
    const animations = [];

    if (!depthOnly && glows.length > 0 && !reducedMotion) {
      animations.push(gsap.to(glows, {
        xPercent: (index) => (index % 2 === 0 ? 2.2 : -2.2),
        yPercent: (index) => (index % 2 === 0 ? -1.4 : 1.4),
        scale: adaptiveBalanced ? 1.018 : 1.035,
        duration: adaptiveBalanced ? 13 : 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 1.1,
      }));
    }

    if (!depthOnly && particles.length > 0 && !reducedMotion) {
      animations.push(gsap.to(particles, {
        y: (index) => -28 - (index % 4) * (adaptiveBalanced ? 8 : 14),
        x: (index) => (index % 2 === 0 ? 8 : -7),
        autoAlpha: (index) => 0.22 + (index % 3) * 0.08,
        duration: (index) => (adaptiveBalanced ? 12 : 9) + (index % 5) * 1.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: adaptiveBalanced ? 0.24 : 0.15,
        force3D: true,
      }));
    }

    let depthFrame = 0;
    let rangeFrame = 0;
    let maxScroll = 1;
    let lastGlobalPublish = 0;
    let lastDepth = Number.NaN;
    const minGlobalInterval = 1000 / GLOBAL_DEPTH_PAINT_FPS;
    const toDepth = (progress) => clamp(Math.pow(progress * 1.5, 0.92), 0, 1);

    const paintDepth = (progress, force = false) => {
      const now = performance.now();
      const depth = Number(toDepth(progress).toFixed(4));
      if (depth === lastDepth && !force) return;
      lastDepth = depth;
      root.style.setProperty("--ocean-depth", String(depth));
      root.style.setProperty("--surface-opacity", String(Math.max(0, 1 - depth * 2.05)));

      if (force || now - lastGlobalPublish >= minGlobalInterval || depth === 0 || depth === 1) {
        lastGlobalPublish = now;
        // Keep the global depth veil compositor-local. Publishing an inherited
        // custom property on <html> invalidated style across the whole portfolio.
        depthOverlay.style.opacity = String(0.48 - depth * 0.34);
      }
    };

    const scrollingElement = document.scrollingElement ?? document.documentElement;
    const readProgress = () => clamp(scrollingElement.scrollTop / Math.max(1, maxScroll), 0, 1);

    const paintCurrentDepth = (force = false) => {
      depthFrame = 0;
      paintDepth(readProgress(), force);
    };

    const scheduleDepthPaint = () => {
      if (depthFrame) return;
      depthFrame = window.requestAnimationFrame(() => paintCurrentDepth(false));
    };

    const refreshScrollRange = () => {
      rangeFrame = 0;
      if (depthFrame) {
        window.cancelAnimationFrame(depthFrame);
        depthFrame = 0;
      }
      maxScroll = Math.max(1, scrollingElement.scrollHeight - (window.innerHeight || 1));
      paintCurrentDepth(true);
    };

    const scheduleRangeRefresh = () => {
      if (rangeFrame) return;
      rangeFrame = window.requestAnimationFrame(refreshScrollRange);
    };

    // The global depth mapping is a simple document-scroll ratio. Running it
    // through ScrollTrigger made every wheel event enter the plugin's global
    // update path and was the largest forced-style/layout source in the V9
    // trace. A passive scroll wake-up + one RAF preserves the exact formula and
    // 45 FPS publication cap without a layout-querying trigger.
    const documentResizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleRangeRefresh)
      : null;
    documentResizeObserver?.observe(document.body);
    window.addEventListener("scroll", scheduleDepthPaint, { passive: true });
    window.addEventListener("resize", scheduleRangeRefresh, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleRangeRefresh, { passive: true });
    refreshScrollRange();

    return () => {
      animations.forEach((animation) => animation.kill());
      documentResizeObserver?.disconnect();
      window.removeEventListener("scroll", scheduleDepthPaint);
      window.removeEventListener("resize", scheduleRangeRefresh);
      window.visualViewport?.removeEventListener("resize", scheduleRangeRefresh);
      window.cancelAnimationFrame(depthFrame);
      window.cancelAnimationFrame(rangeFrame);
    };
  }, [staticMode, depthOnly, performanceMode, runtimeQuality], {
    allowOnMobile: depthOnly,
    allowOnLite: depthOnly,
    needsScrollTrigger: false,
  });

  return (
    <>
      <div ref={depthOverlayRef} className="global-ocean-depth-overlay" aria-hidden="true" />
      <div
        ref={rootRef}
        className={`ocean-background${staticMode || depthOnly ? " is-static" : ""}${depthOnly ? " is-depth-only" : ""}${adaptiveBalanced ? " is-balanced" : ""}${runtimeConstrained ? " is-runtime-constrained" : ""}`}
        aria-hidden="true"
      >
      <div className="ocean-depth-gradient" />
      <div className="ocean-surface-layer">
        <svg className="ocean-surface-waves" viewBox="0 0 2400 260" preserveAspectRatio="none">
          <path
            className="ocean-surface-wave ocean-surface-wave-main"
            d="M0 120 C120 75 220 165 340 120 C460 75 560 165 680 120 C800 75 900 165 1020 120 C1080 96 1140 110 1200 120 C1320 75 1420 165 1540 120 C1660 75 1760 165 1880 120 C2000 75 2100 165 2220 120 C2280 96 2340 110 2400 120 V260 H0 Z"
          />
        </svg>
      </div>
      <div className="ocean-sky-glow ocean-glow" />
      <div className="ocean-deep-glow ocean-glow" />
      <div className="ocean-depth-particles">
        {Array.from({ length: particleCount }, (_, index) => (
          <span
            key={index}
            className="ocean-depth-particle"
            style={{
              "--particle-left": `${(index * 29) % 100}%`,
              "--particle-top": `${12 + ((index * 17) % 82)}%`,
              "--particle-size": `${3 + (index % 5)}px`,
              "--particle-delay": `${index * 0.12}s`,
            }}
          />
        ))}
      </div>
      <svg className="ocean-map" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oceanStaticA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="oceanStaticB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <path className="ocean-static-layer ocean-static-layer-1" d={STATIC_OCEAN_PATHS[0]} fill="url(#oceanStaticA)" />
        {!runtimeConstrained && (
          <path className="ocean-static-layer ocean-static-layer-2" d={STATIC_OCEAN_PATHS[1]} fill="url(#oceanStaticB)" />
        )}
      </svg>
        <div className="ocean-abyss-floor" />
      </div>
    </>
  );
}
