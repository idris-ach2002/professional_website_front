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

const BALANCED_FISH = [DESKTOP_FISH[0], DESKTOP_FISH[1], DESKTOP_FISH[3], DESKTOP_FISH[4]];
const CONSTRAINED_FISH = [DESKTOP_FISH[0], DESKTOP_FISH[3]];

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

function FishRoute({ fish, reacting = false }) {
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
      <span
        className="aquarium-fish-bob"
        style={{
          translate: reacting ? (fish.direction === "ltr" ? "38px -8px" : "-38px -8px") : "0 0",
          transition: "translate .28s cubic-bezier(.2,.8,.2,1)",
          animationDuration: reacting ? "1.05s" : undefined,
        }}
      >
        <img
          src="/assets/ocean/fish-swim-light.svg"
          alt=""
          aria-hidden="true"
          className="aquarium-fish-image"
          draggable="false"
          decoding="async"
          style={{ filter: reacting ? "brightness(1.08) saturate(1.08)" : undefined }}
        />
      </span>
    </span>
  );
}

export default function GlobalAquarium({
  isMobile = false,
  reducedMotion = false,
  performanceMode = "full",
  paused = false,
  runtimeQuality = "high",
}) {
  const [isPageHidden, setIsPageHidden] = useState(() =>
    typeof document !== "undefined" ? document.hidden : false,
  );
  const [volcanoReaction, setVolcanoReaction] = useState(false);

  useEffect(() => {
    const handleVisibility = () => setIsPageHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleVolcanoStage = (event) => setVolcanoReaction(Boolean(event.detail?.reaction));
    window.addEventListener("portfolio:volcano-stage", handleVolcanoStage);
    return () => window.removeEventListener("portfolio:volcano-stage", handleVolcanoStage);
  }, []);
  const fish = useMemo(() => {
    if (reducedMotion) return [MOBILE_FISH[0]];
    if (runtimeQuality === "constrained") return isMobile ? [MOBILE_FISH[0]] : CONSTRAINED_FISH;
    if (isMobile) return MOBILE_FISH;
    if (performanceMode === "lite") return MOBILE_FISH;
    if (performanceMode === "balanced" || runtimeQuality === "balanced") return BALANCED_FISH;
    return DESKTOP_FISH;
  }, [isMobile, performanceMode, reducedMotion, runtimeQuality]);

  return (
    <div
      className={`global-aquarium${isPageHidden || paused ? " is-paused" : ""}${
        reducedMotion ? " is-reduced-motion" : ""
      }${performanceMode === "balanced" ? " is-balanced" : ""}`}
      aria-hidden="true"
    >
      {fish.map((item) => (
        <FishRoute key={item.id} fish={item} reacting={volcanoReaction} />
      ))}
    </div>
  );
}
