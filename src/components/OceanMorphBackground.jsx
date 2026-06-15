import { useRef } from "react";
import { useGsap } from "../animations/useGsap";

const PATH_COUNT = 4;
const POINT_COUNT = 12;
const PARTICLE_COUNT = 34;

function getWavePoint(pathIndex, pointIndex, phase = 0) {
  const normalized = pointIndex / (POINT_COUNT - 1);
  const base = 54 + pathIndex * 9;
  const amplitude = 8 + pathIndex * 2.2;
  const frequency = 1.35 + pathIndex * 0.22;
  const drift = Math.sin((normalized * Math.PI * 2 * frequency) + phase + pathIndex * 0.7) * amplitude;
  const secondary = Math.sin((normalized * Math.PI * 4.2) - phase * 0.72 + pathIndex) * (amplitude * 0.28);

  return Math.max(18, Math.min(96, base + drift + secondary));
}

function renderPath(path, points) {
  let d = `M 0 100 V ${points[0]} C`;

  for (let index = 0; index < POINT_COUNT - 1; index += 1) {
    const p = ((index + 1) / (POINT_COUNT - 1)) * 100;
    const cp = p - (100 / (POINT_COUNT - 1)) / 2;
    d += ` ${cp} ${points[index]} ${cp} ${points[index + 1]} ${p} ${points[index + 1]}`;
  }

  d += " V 100 H 0 Z";
  path.setAttribute("d", d);
}

export default function OceanMorphBackground() {
  const rootRef = useRef(null);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const paths = gsap.utils.toArray(root.querySelectorAll(".ocean-morph-path"));
    const surfaceWaves = gsap.utils.toArray(root.querySelectorAll(".ocean-surface-wave"));
    const particles = gsap.utils.toArray(root.querySelectorAll(".ocean-depth-particle"));

    if (paths.length === 0) return undefined;

    const initialPoints = paths.map((_, pathIndex) => (
      Array.from({ length: POINT_COUNT }, (_, pointIndex) => getWavePoint(pathIndex, pointIndex, 0))
    ));
    paths.forEach((path, pathIndex) => renderPath(path, initialPoints[pathIndex]));

    gsap.set(root, { autoAlpha: 1, "--ocean-depth": 0, "--surface-opacity": 1 });
    document.documentElement.style.setProperty("--global-ocean-depth", "0");

    const glows = root.querySelectorAll(".ocean-glow");
    if (glows.length > 0 && !reducedMotion) {
      gsap.to(glows, {
        xPercent: (index) => (index % 2 === 0 ? 4 : -4),
        yPercent: (index) => (index % 2 === 0 ? -3 : 3),
        scale: 1.06,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.9,
      });
    }

    if (surfaceWaves.length > 0 && !reducedMotion) {
      gsap.to(surfaceWaves, {
        xPercent: (index) => (index % 2 === 0 ? -10 : 12),
        duration: (index) => 8 + index * 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.22,
      });
    }

    if (particles.length > 0 && !reducedMotion) {
      gsap.to(particles, {
        y: (index) => -60 - (index % 5) * 22,
        x: (index) => (index % 2 === 0 ? 16 : -14),
        autoAlpha: (index) => 0.35 + (index % 4) * 0.1,
        duration: (index) => 7 + (index % 6) * 1.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.09,
      });
    }

    let depthTrigger;
    if (ScrollTrigger) {
      depthTrigger = ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const depth = Number(Math.min(1, Math.pow(self.progress * 1.5, 0.92)).toFixed(4));
          root.style.setProperty("--ocean-depth", String(depth));
          root.style.setProperty("--surface-opacity", String(Math.max(0, 1 - depth * 2.05)));
          document.documentElement.style.setProperty("--global-ocean-depth", String(depth));
        },
      });
    }

    if (reducedMotion) {
      return () => {
        depthTrigger?.kill();
        document.documentElement.style.removeProperty("--global-ocean-depth");
      };
    }

    let phase = 0;

    const onTick = () => {
      phase += 0.015;

      paths.forEach((path, pathIndex) => {
        const currentPoints = Array.from({ length: POINT_COUNT }, (_, pointIndex) =>
          getWavePoint(pathIndex, pointIndex, phase + pointIndex * 0.08),
        );
        renderPath(path, currentPoints);
      });
    };

    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      depthTrigger?.kill();
      document.documentElement.style.removeProperty("--global-ocean-depth");
    };
  }, []);

  return (
    <div ref={rootRef} className="ocean-background" aria-hidden="true">
      <div className="ocean-depth-gradient" />
      <div className="ocean-surface-layer">
        <svg className="ocean-surface-waves" viewBox="0 0 1200 260" preserveAspectRatio="none">
          <path className="ocean-surface-wave ocean-surface-wave-a" d="M0 118 C90 70 155 170 250 118 C350 62 420 174 525 116 C630 58 720 170 820 112 C930 50 1010 172 1200 108 V260 H0 Z" />
          <path className="ocean-surface-wave ocean-surface-wave-b" d="M0 148 C120 96 200 184 320 142 C430 104 510 190 650 138 C770 94 860 186 990 140 C1080 108 1130 138 1200 122 V260 H0 Z" />
          <path className="ocean-surface-wave ocean-surface-wave-c" d="M0 94 C150 50 250 136 394 92 C520 54 660 138 790 92 C930 44 1010 126 1200 84" />
        </svg>
      </div>
      <div className="ocean-sky-glow ocean-glow" />
      <div className="ocean-deep-glow ocean-glow" />
      <div className="ocean-depth-particles">
        {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
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
          <linearGradient id="oceanMorphC" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#155e75" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="oceanMorphD" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.16" />
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
