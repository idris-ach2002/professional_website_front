import { useRef } from "react";
import { useGsap } from "../animations/useGsap";

const PATH_COUNT = 4;
const POINT_COUNT = 12;

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

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const paths = gsap.utils.toArray(root.querySelectorAll(".ocean-morph-path"));
    const ribbon = root.querySelector(".ocean-ribbon-track");

    if (paths.length === 0) return undefined;

    // Rendu initial
    const initialPoints = paths.map((_, pathIndex) => (
      Array.from({ length: POINT_COUNT }, (_, pointIndex) => getWavePoint(pathIndex, pointIndex, 0))
    ));
    paths.forEach((path, pathIndex) => renderPath(path, initialPoints[pathIndex]));

    gsap.set(root, { autoAlpha: 1 });
    
    gsap.to(root.querySelectorAll(".ocean-glow"), {
      xPercent: (index) => (index % 2 === 0 ? 4 : -4),
      yPercent: (index) => (index % 2 === 0 ? -3 : 3),
      scale: 1.06,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.9,
    });

    if (ribbon && !reducedMotion) {
      gsap.to(ribbon, {
        xPercent: -50,
        duration: 24,
        ease: "none",
        repeat: -1,
      });
    }

    if (reducedMotion) return undefined;

    // --- NOUVELLE LOGIQUE INFINIE ---
    let phase = 0;

    const onTick = () => {
      // Ajuste cette valeur pour contrôler la VITESSE de la vague (plus élevé = plus rapide)
      phase += 0.015; 

      paths.forEach((path, pathIndex) => {
        const currentPoints = Array.from({ length: POINT_COUNT }, (_, pointIndex) => 
          // On garde l'effet d'ondulation décalé via "pointIndex * 0.08"
          getWavePoint(pathIndex, pointIndex, phase + pointIndex * 0.08)
        );
        renderPath(path, currentPoints);
      });
    };

    // Ajoute la fonction à la boucle d'animation (60fps ou 120fps selon l'écran)
    gsap.ticker.add(onTick);

    // Fonction de nettoyage (cleanup) lors du démontage du composant
    return () => {
      gsap.ticker.remove(onTick);
    };
  }, []);

  return (
    <div ref={rootRef} className="ocean-background" aria-hidden="true">
      <div className="ocean-sky-glow ocean-glow" />
      <div className="ocean-deep-glow ocean-glow" />
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
        <path className="ocean-morph-path ocean-morph-path-1" fill="url(#oceanMorphA)" />
        <path className="ocean-morph-path ocean-morph-path-2" fill="url(#oceanMorphB)" />
        <path className="ocean-morph-path ocean-morph-path-3" fill="url(#oceanMorphC)" />
        <path className="ocean-morph-path ocean-morph-path-4" fill="url(#oceanMorphD)" />
      </svg>
      <div className="ocean-ribbon">
        <div className="ocean-ribbon-track">
          <span>architecture logicielle</span>
          <span>data pipelines</span>
          <span>React / Spring</span>
          <span>graphes haute performance</span>
          <span>architecture logicielle</span>
          <span>data pipelines</span>
          <span>React / Spring</span>
          <span>graphes haute performance</span>
        </div>
      </div>
    </div>
  );
}