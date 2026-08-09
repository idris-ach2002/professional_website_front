import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { clamp, damp } from "../animations/timelineMotion";

const PATH_COUNT = 2;
const POINT_COUNT = 8;
const BALANCED_POINT_COUNT = 6;
const BALANCED_MORPH_PATH_COUNT = 1;
const FULL_MORPH_FPS = 60;
const BALANCED_MORPH_FPS = 45;
const DEEP_FULL_MORPH_FPS = 45;
const DEEP_BALANCED_MORPH_FPS = 30;
const FULL_DEPTH_PAINT_FPS = 90;
const BALANCED_DEPTH_PAINT_FPS = 60;
const GLOBAL_DEPTH_PAINT_FPS = 45;
const FULL_PARTICLE_COUNT = 10;
const BALANCED_PARTICLE_COUNT = 7;

function getWavePoint(pathIndex, pointIndex, phase = 0, pointCount = POINT_COUNT) {
  const normalized = pointIndex / (pointCount - 1);
  const base = 54 + pathIndex * 9;
  const amplitude = 8 + pathIndex * 2.2;
  const frequency = 1.35 + pathIndex * 0.22;
  const drift = Math.sin((normalized * Math.PI * 2 * frequency) + phase + pathIndex * 0.7) * amplitude;
  const secondary = Math.sin((normalized * Math.PI * 4.2) - phase * 0.72 + pathIndex) * (amplitude * 0.28);

  return Math.max(18, Math.min(96, base + drift + secondary));
}

function renderPath(path, points) {
  const pointCount = points.length;
  const overscan = 10;
  const startX = -overscan;
  const endX = 100 + overscan;
  const span = endX - startX;
  const segmentWidth = span / (pointCount - 1);
  let d = `M ${startX} 100 V ${points[0]} C`;

  for (let index = 0; index < pointCount - 1; index += 1) {
    const p = startX + ((index + 1) / (pointCount - 1)) * span;
    const cp = p - segmentWidth / 2;
    d += ` ${cp} ${points[index]} ${cp} ${points[index + 1]} ${p} ${points[index + 1]}`;
  }

  d += ` V 100 H ${startX} Z`;
  path.setAttribute("d", d);
}

export default function OceanMorphBackground({ staticMode = false, depthOnly = false, performanceMode = "full" }) {
  const rootRef = useRef(null);
  const balancedMode = performanceMode === "balanced";
  const particleCount = staticMode || depthOnly
    ? 0
    : balancedMode
      ? BALANCED_PARTICLE_COUNT
      : FULL_PARTICLE_COUNT;

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (staticMode) return undefined;
    const root = rootRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const paths = gsap.utils.toArray(root.querySelectorAll(".ocean-morph-path"));
    const particles = gsap.utils.toArray(root.querySelectorAll(".ocean-depth-particle"));

    if (paths.length === 0) return undefined;

    const initialPoints = paths.map((_, pathIndex) => (
      Array.from(
        { length: POINT_COUNT },
        (_, pointIndex) => getWavePoint(pathIndex, pointIndex, balancedMode ? pathIndex * 0.44 : 0),
      )
    ));
    paths.forEach((path, pathIndex) => renderPath(path, initialPoints[pathIndex]));

    gsap.set(root, { autoAlpha: 1, "--ocean-depth": 0, "--surface-opacity": 1 });
    document.documentElement.style.setProperty("--global-ocean-depth", "0");

    const glows = root.querySelectorAll(".ocean-glow");
    if (!depthOnly && glows.length > 0 && !reducedMotion) {
      gsap.to(glows, {
        xPercent: (index) => (index % 2 === 0 ? 3 : -3),
        yPercent: (index) => (index % 2 === 0 ? -2 : 2),
        scale: balancedMode ? 1.025 : 1.06,
        duration: balancedMode ? 11 : 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.9,
      });
    }

    if (!depthOnly && particles.length > 0 && !reducedMotion) {
      gsap.to(particles, {
        y: (index) => -42 - (index % 5) * (balancedMode ? 12 : 22),
        x: (index) => (index % 2 === 0 ? 12 : -10),
        autoAlpha: (index) => 0.28 + (index % 4) * 0.08,
        duration: (index) => (balancedMode ? 10 : 7) + (index % 6) * 1.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: balancedMode ? 0.18 : 0.09,
        force3D: true,
      });
    }

    let depthTrigger;
    let targetDepth = 0;
    let currentDepth = 0;
    let lastDepthPaint = 0;
    let lastGlobalDepthPaint = 0;
    let lastPaintedDepth = Number.NaN;
    let lastGlobalDepth = Number.NaN;
    const depthResponse = depthOnly ? 13 : balancedMode ? 11 : 9.5;
    const depthPaintFps = balancedMode || depthOnly
      ? BALANCED_DEPTH_PAINT_FPS
      : FULL_DEPTH_PAINT_FPS;
    const depthPaintInterval = 1000 / depthPaintFps;
    const globalDepthPaintInterval = 1000 / GLOBAL_DEPTH_PAINT_FPS;

    const toDepth = (progress) => clamp(Math.pow(progress * 1.5, 0.92), 0, 1);
    const paintDepth = (depth, now = performance.now(), forceGlobal = false) => {
      const roundedDepth = Number(depth.toFixed(4));
      if (roundedDepth !== lastPaintedDepth) {
        lastPaintedDepth = roundedDepth;
        root.style.setProperty("--ocean-depth", String(roundedDepth));
        root.style.setProperty("--surface-opacity", String(Math.max(0, 1 - roundedDepth * 2.05)));
      }

      const shouldPublishGlobal = forceGlobal
        || now - lastGlobalDepthPaint >= globalDepthPaintInterval
        || roundedDepth === 0
        || roundedDepth === 1;

      if (shouldPublishGlobal && roundedDepth !== lastGlobalDepth) {
        lastGlobalDepthPaint = now;
        lastGlobalDepth = roundedDepth;
        document.documentElement.style.setProperty("--global-ocean-depth", String(roundedDepth));
      }
    };

    if (ScrollTrigger) {
      depthTrigger = ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          targetDepth = toDepth(self.progress);
        },
        onRefresh: (self) => {
          targetDepth = toDepth(self.progress);
          if (Math.abs(currentDepth - targetDepth) > 0.35) currentDepth = targetDepth;
          paintDepth(currentDepth, performance.now(), true);
        },
      });
      targetDepth = toDepth(depthTrigger.progress);
      currentDepth = targetDepth;
      paintDepth(currentDepth, performance.now(), true);
    }

    if (reducedMotion) {
      return () => {
        depthTrigger?.kill();
        document.documentElement.style.removeProperty("--global-ocean-depth");
      };
    }

    let phase = 0;
    let lastMorphFrame = 0;
    const morphPaths = balancedMode
      ? paths.slice(0, BALANCED_MORPH_PATH_COUNT)
      : paths;
    const morphPointCount = balancedMode ? BALANCED_POINT_COUNT : POINT_COUNT;
    const pointBuffers = morphPaths.map(() => new Float32Array(morphPointCount));
    const phasePerSecond = balancedMode ? 1.15 : 0.72;
    const resolveMorphInterval = (depth) => {
      const deep = depth >= 0.62;
      const fps = balancedMode
        ? (deep ? DEEP_BALANCED_MORPH_FPS : BALANCED_MORPH_FPS)
        : (deep ? DEEP_FULL_MORPH_FPS : FULL_MORPH_FPS);
      return 1000 / fps;
    };

    const onTick = (tickerTime, deltaTime = 8.333) => {
      const now = typeof tickerTime === "number"
        ? tickerTime * 1000
        : performance.now();
      const deltaSeconds = clamp(deltaTime / 1000, 1 / 240, 0.05);

      currentDepth = damp(currentDepth, targetDepth, depthResponse, deltaSeconds);
      if (Math.abs(targetDepth - currentDepth) < 0.00008) currentDepth = targetDepth;
      if (now - lastDepthPaint >= depthPaintInterval) {
        lastDepthPaint = now;
        paintDepth(currentDepth, now);
      }

      if (depthOnly) return;

      const morphFrameInterval = resolveMorphInterval(currentDepth);
      if (now - lastMorphFrame < morphFrameInterval) return;
      const morphDeltaSeconds = lastMorphFrame > 0
        ? clamp((now - lastMorphFrame) / 1000, 1 / 240, 0.05)
        : deltaSeconds;
      lastMorphFrame = now;

      // Expensive SVG geometry is intentionally decoupled from display Hz.
      // Compositor transforms can still render at 90/120/144 Hz while the
      // morph mesh is rebuilt at 60 Hz (or less when deep/low-power).
      phase += phasePerSecond * morphDeltaSeconds;

      morphPaths.forEach((path, pathIndex) => {
        const currentPoints = pointBuffers[pathIndex];
        for (let pointIndex = 0; pointIndex < morphPointCount; pointIndex += 1) {
          currentPoints[pointIndex] = getWavePoint(
            pathIndex,
            pointIndex,
            phase + pointIndex * 0.08,
            morphPointCount,
          );
        }
        renderPath(path, currentPoints);
      });
    };

    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      depthTrigger?.kill();
      document.documentElement.style.removeProperty("--global-ocean-depth");
    };
  }, [staticMode, depthOnly, performanceMode], {
    allowOnMobile: depthOnly,
    allowOnLite: depthOnly,
  });

  return (
    <div
      ref={rootRef}
      className={`ocean-background${staticMode || depthOnly ? " is-static" : ""}${depthOnly ? " is-depth-only" : ""}${balancedMode ? " is-balanced" : ""}`}
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
              "--particle-size": `${3 + (index % 6)}px`,
              "--particle-delay": `${index * 0.12}s`,
            }}
          />
        ))}
      </div>
      <svg className="ocean-map" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oceanMorphA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="oceanMorphB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        {Array.from({ length: PATH_COUNT }, (_, index) => (
          <path key={index} className={`ocean-morph-path ocean-morph-path-${index + 1}`} fill={`url(#oceanMorph${String.fromCharCode(65 + index)})`} />
        ))}
      </svg>
      <div className="ocean-abyss-floor" />
    </div>
  );
}
