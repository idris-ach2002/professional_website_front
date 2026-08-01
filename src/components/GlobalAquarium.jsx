import { useEffect, useMemo, useState } from "react";

const DESKTOP_FISH = [
  {
    id: "reef-scout",
    direction: "ltr",
    top: "12%",
    size: 92,
    duration: 30,
    delay: -7,
    drift: "7vh",
    opacity: 0.34,
    depth: "far",
  },
  {
    id: "surface-runner",
    direction: "rtl",
    top: "25%",
    size: 126,
    duration: 24,
    delay: -16,
    drift: "-5vh",
    opacity: 0.46,
    depth: "mid",
  },
  {
    id: "lagoon-glider",
    direction: "ltr",
    top: "42%",
    size: 78,
    duration: 36,
    delay: -25,
    drift: "9vh",
    opacity: 0.28,
    depth: "far",
  },
  {
    id: "current-rider",
    direction: "rtl",
    top: "58%",
    size: 112,
    duration: 28,
    delay: -4,
    drift: "6vh",
    opacity: 0.4,
    depth: "mid",
  },
  {
    id: "abyss-wanderer",
    direction: "ltr",
    top: "73%",
    size: 148,
    duration: 33,
    delay: -19,
    drift: "-8vh",
    opacity: 0.34,
    depth: "near",
  },
  {
    id: "deep-sentinel",
    direction: "rtl",
    top: "88%",
    size: 88,
    duration: 40,
    delay: -31,
    drift: "-5vh",
    opacity: 0.25,
    depth: "far",
  },
];

const MOBILE_FISH = [
  {
    ...DESKTOP_FISH[0],
    id: "mobile-scout",
    top: "24%",
    size: 74,
    duration: 33,
    delay: -11,
    drift: "5vh",
    opacity: 0.28,
  },
  {
    ...DESKTOP_FISH[3],
    id: "mobile-glider",
    top: "70%",
    size: 88,
    duration: 38,
    delay: -28,
    drift: "-5vh",
    opacity: 0.3,
  },
];

function FishRoute({ fish }) {
  const driftValue = Number.parseFloat(fish.drift);
  const driftMid = Number.isFinite(driftValue) ? `${driftValue * 0.45}vh` : fish.drift;

  const style = {
    "--fish-top": fish.top,
    "--fish-size": `${fish.size}px`,
    "--fish-duration": `${fish.duration}s`,
    "--fish-delay": `${fish.delay}s`,
    "--fish-drift": fish.drift,
    "--fish-drift-mid": driftMid,
    "--fish-opacity": fish.opacity,
    "--fish-bob-delay": `${fish.delay * 0.35}s`,
  };

  return (
    <span
      className={`aquarium-route aquarium-route--${fish.direction} aquarium-route--${fish.depth}`}
      style={style}
    >
      <span className="aquarium-fish-bob">
        <img
          src="/assets/ocean/fish-swim-light.svg"
          alt=""
          aria-hidden="true"
          className="aquarium-fish-image"
          draggable="false"
          decoding="async"
        />
      </span>
    </span>
  );
}

export default function GlobalAquarium({ isMobile = false, reducedMotion = false }) {
  const [isPageHidden, setIsPageHidden] = useState(() =>
    typeof document !== "undefined" ? document.hidden : false,
  );

  useEffect(() => {
    const handleVisibility = () => setIsPageHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const fish = useMemo(() => {
    if (reducedMotion) return [MOBILE_FISH[0]];
    return isMobile ? MOBILE_FISH : DESKTOP_FISH;
  }, [isMobile, reducedMotion]);

  return (
    <div
      className={`global-aquarium${isPageHidden ? " is-paused" : ""}${
        reducedMotion ? " is-reduced-motion" : ""
      }`}
      aria-hidden="true"
    >
      {fish.map((item) => (
        <FishRoute key={item.id} fish={item} />
      ))}
    </div>
  );
}
