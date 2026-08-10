import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BIOME_ORDER,
  BIOME_PROFILES,
  OCEAN_BIOMES,
  biomeFromSectionId,
  createMarinePopulation,
  resolveMarinePopulation,
  resolveRareOceanEvent,
  resolveBiomeTransitionDuration,
  stepMarinePopulation,
} from "../ocean/oceanWorldEngine";

const OBSERVED_SECTIONS = ["profile", "ocean-transition-deep", "timeline", "ocean-transition-caldera", "abyss-volcano-field", "ocean-transition-projects", "projects", "ocean-transition-outro", "ocean-outro"];

const PALETTES = Object.freeze({
  reef: ["#8fe8ff", "#0ea5c6", "#f0fbff"],
  silver: ["#dff8ff", "#7db7c9", "#ffffff"],
  deep: ["#345276", "#14233d", "#8edfff"],
  lantern: ["#16314a", "#071927", "#78f5ff"],
  vent: ["#3c5660", "#14272d", "#b2ecdc"],
});

function resolveDpr(runtimeQuality) {
  const device = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  if (runtimeQuality === "constrained") return Math.min(device, 0.90);
  if (runtimeQuality === "balanced") return Math.min(device, 1.05);
  return Math.min(device, 1.22);
}

function resizeCanvas(canvas, dpr) {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return { width, height, dpr };
}

function drawFish(context, agent, x, y, size, opacity) {
  const [light, dark, accent] = PALETTES[agent.species] ?? PALETTES.reef;
  const direction = agent.heading >= 0 ? 1 : -1;
  context.save();
  context.translate(x, y);
  context.scale(direction, 1);
  context.globalAlpha = opacity;

  const gradient = context.createLinearGradient(-size * 0.7, 0, size * 0.75, 0);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.55, light);
  gradient.addColorStop(1, accent);
  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(0, 0, size * 0.72, size * 0.34, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(-size * 0.62, 0);
  context.lineTo(-size * 1.04, -size * 0.42);
  context.lineTo(-size * 0.92, size * 0.42);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255,255,255,.92)";
  context.beginPath();
  context.arc(size * 0.42, -size * 0.08, Math.max(1.2, size * 0.055), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(3,18,29,.9)";
  context.beginPath();
  context.arc(size * 0.44, -size * 0.08, Math.max(0.8, size * 0.026), 0, Math.PI * 2);
  context.fill();

  if (agent.species === "lantern") {
    context.globalCompositeOperation = "lighter";
    context.fillStyle = "rgba(104,245,255,.72)";
    context.beginPath();
    context.arc(size * 0.15, size * 0.17, size * 0.06, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawRay(context, agent, x, y, size, opacity, manta = false) {
  const direction = agent.heading >= 0 ? 1 : -1;
  context.save();
  context.translate(x, y);
  context.scale(direction, 1);
  context.globalAlpha = opacity;
  context.fillStyle = manta ? "rgba(10,32,49,.88)" : "rgba(45,104,126,.72)";
  context.beginPath();
  context.moveTo(size * 0.72, 0);
  context.bezierCurveTo(size * 0.15, -size * 0.54, -size * 0.48, -size * 0.46, -size * 0.62, -size * 0.04);
  context.bezierCurveTo(-size * 0.45, size * 0.42, size * 0.14, size * 0.50, size * 0.72, 0);
  context.fill();
  context.strokeStyle = manta ? "rgba(117,210,227,.28)" : "rgba(163,235,246,.32)";
  context.lineWidth = Math.max(1, size * 0.018);
  context.beginPath();
  context.moveTo(-size * 0.54, 0);
  context.quadraticCurveTo(-size * 0.94, size * 0.10, -size * 1.20, size * 0.30);
  context.stroke();
  context.restore();
}

function drawJelly(context, x, y, size, opacity, phase) {
  context.save();
  context.translate(x, y);
  context.globalAlpha = opacity;
  const pulse = 0.92 + Math.sin(phase) * 0.08;
  context.scale(pulse, 1 / pulse);
  const gradient = context.createLinearGradient(0, -size * 0.5, 0, size * 0.35);
  gradient.addColorStop(0, "rgba(178,238,255,.58)");
  gradient.addColorStop(1, "rgba(71,151,194,.12)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, size * 0.44, Math.PI, 0);
  context.quadraticCurveTo(size * 0.28, size * 0.34, 0, size * 0.26);
  context.quadraticCurveTo(-size * 0.28, size * 0.34, -size * 0.44, 0);
  context.fill();
  context.strokeStyle = "rgba(130,225,249,.32)";
  context.lineWidth = Math.max(0.8, size * 0.018);
  for (let index = -2; index <= 2; index += 1) {
    context.beginPath();
    context.moveTo(index * size * 0.12, size * 0.22);
    context.bezierCurveTo(
      index * size * 0.10 + Math.sin(phase + index) * size * 0.06,
      size * 0.52,
      index * size * 0.15,
      size * 0.72,
      index * size * 0.09 + Math.sin(phase * 0.7 + index) * size * 0.08,
      size * 0.90,
    );
    context.stroke();
  }
  context.restore();
}

function drawSquid(context, agent, x, y, size, opacity) {
  const direction = agent.heading >= 0 ? 1 : -1;
  context.save();
  context.translate(x, y);
  context.scale(direction, 1);
  context.globalAlpha = opacity;
  context.fillStyle = "rgba(77,129,158,.72)";
  context.beginPath();
  context.ellipse(0, 0, size * 0.52, size * 0.27, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(127,203,224,.58)";
  context.beginPath();
  context.moveTo(size * 0.12, -size * 0.18);
  context.lineTo(-size * 0.22, -size * 0.46);
  context.lineTo(-size * 0.14, -size * 0.10);
  context.fill();
  context.strokeStyle = "rgba(154,226,239,.45)";
  context.lineWidth = Math.max(0.8, size * 0.015);
  for (let index = -1; index <= 1; index += 1) {
    context.beginPath();
    context.moveTo(-size * 0.46, index * size * 0.08);
    context.quadraticCurveTo(-size * 0.72, index * size * 0.15, -size * 0.92, index * size * 0.22);
    context.stroke();
  }
  context.restore();
}

function drawAgent(context, agent, viewport, elapsed, biomeOpacity) {
  const layerScale = agent.depthLayer === "near" ? 1.28 : agent.depthLayer === "far" ? 0.68 : 0.92;
  const layerOpacity = agent.depthLayer === "near" ? 0.74 : agent.depthLayer === "far" ? 0.34 : 0.58;
  const minDimension = Math.min(viewport.width, viewport.height);
  const size = Math.max(12, minDimension * agent.size * layerScale);
  const x = agent.x * viewport.width;
  const y = agent.y * viewport.height;
  const opacity = agent.opacity * layerOpacity * biomeOpacity;

  if (agent.species === "ray") drawRay(context, agent, x, y, size, opacity);
  else if (agent.species === "jelly") drawJelly(context, x, y, size, opacity, agent.wanderPhase + elapsed * 1.3);
  else if (agent.species === "squid") drawSquid(context, agent, x, y, size, opacity);
  else drawFish(context, agent, x, y, size, opacity);
}

function drawRareEvent(context, event, viewport) {
  if (!event) return;
  const p = event.progress;
  const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  if (event.type === "manta") {
    const agent = { heading: 1 };
    drawRay(
      context,
      agent,
      (-0.18 + eased * 1.36) * viewport.width,
      viewport.height * (0.26 + Math.sin(p * Math.PI) * 0.05),
      Math.min(viewport.width, viewport.height) * 0.18,
      Math.sin(Math.PI * p) * 0.42,
      true,
    );
    return;
  }
  if (event.type === "school") {
    for (let index = 0; index < 6; index += 1) {
      const local = Math.max(0, Math.min(1, p * 1.25 - index * 0.035));
      const agent = { heading: 1, species: "silver" };
      drawFish(
        context,
        agent,
        (-0.12 + local * 1.24) * viewport.width,
        viewport.height * (0.36 + index * 0.025 + Math.sin(index * 1.7) * 0.02),
        Math.min(viewport.width, viewport.height) * 0.032,
        Math.sin(Math.PI * local) * 0.34,
      );
    }
    return;
  }
  for (let index = 0; index < 3; index += 1) {
    drawJelly(
      context,
      viewport.width * (0.28 + index * 0.19 + Math.sin(p * Math.PI * 2 + index) * 0.02),
      viewport.height * (0.74 - p * 0.22 + index * 0.025),
      Math.min(viewport.width, viewport.height) * (0.045 + index * 0.008),
      Math.sin(Math.PI * p) * 0.30,
      p * Math.PI * 2 + index,
    );
  }
}

function chooseBiome(entries, currentBiome) {
  // V21.18: the observer uses a narrow decision band instead of asking large
  // sections to compete by intersection ratio. This makes direct jumps and
  // Chromium/Firefox agree on the biome without binding animation progress to
  // scroll pixels: scroll only selects the next world, then the transition is
  // autonomous and time based.
  const decisionY = window.innerHeight * 0.43;
  let winner = null;
  let winnerDistance = Number.POSITIVE_INFINITY;
  let winnerOrder = -1;

  for (const entry of entries.values()) {
    // Do not trust a stale IntersectionObserver isIntersecting flag after a
    // programmatic/very large jump. Chromium can deliver the enter/exit
    // records in separate batches. Geometry is read only when the observer
    // fires; it selects a world but never drives frame-by-frame motion.
    const rect = entry.target.getBoundingClientRect();
    const containsDecisionBand = rect.top <= decisionY && rect.bottom >= decisionY;
    const distance = containsDecisionBand
      ? 0
      : Math.min(Math.abs(rect.top - decisionY), Math.abs(rect.bottom - decisionY));
    const order = BIOME_ORDER.indexOf(biomeFromSectionId(entry.target.id));

    if (distance < winnerDistance - 0.5 || (Math.abs(distance - winnerDistance) <= 0.5 && order > winnerOrder)) {
      winner = biomeFromSectionId(entry.target.id);
      winnerDistance = distance;
      winnerOrder = order;
    }
  }

  return winner ?? currentBiome;
}

export default function GlobalAquarium({
  isMobile = false,
  reducedMotion = false,
  performanceMode = "full",
  paused = false,
  runtimeQuality = "high",
}) {
  const canvasRef = useRef(null);
  const agentsRef = useRef([]);
  const previousAgentsRef = useRef([]);
  const transitionRef = useRef({ from: OCEAN_BIOMES.SURFACE, to: OCEAN_BIOMES.SURFACE, startedAt: 0, duration: 0 });
  const viewportRef = useRef({ width: 1, height: 1, dpr: 1 });
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const elapsedRef = useRef(0);
  const dangerRef = useRef(0);
  const entriesRef = useRef(new Map());
  const biomeRef = useRef(OCEAN_BIOMES.SURFACE);
  const transitionTimerRef = useRef(0);
  const [biome, setBiome] = useState(OCEAN_BIOMES.SURFACE);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" ? true : !document.hidden);

  const population = useMemo(
    () => resolveMarinePopulation(runtimeQuality, performanceMode, isMobile),
    [isMobile, performanceMode, runtimeQuality],
  );
  const dpr = useMemo(() => resolveDpr(runtimeQuality), [runtimeQuality]);
  const active = pageVisible && !paused;

  const rebuildPopulation = useCallback((targetBiome = biomeRef.current) => {
    agentsRef.current = createMarinePopulation(population, targetBiome, 0x5183 + population * 13);
  }, [population]);

  useEffect(() => {
    const previousBiome = biomeRef.current;
    biomeRef.current = biome;
    document.documentElement.dataset.oceanBiome = biome;

    const duration = previousBiome === biome ? 0.38 : resolveBiomeTransitionDuration(previousBiome, biome);
    const transitionName = `${previousBiome}-${biome}`;
    if (previousBiome !== biome) {
      window.clearTimeout(transitionTimerRef.current);
      document.documentElement.dataset.oceanTransition = transitionName;
      window.dispatchEvent(new CustomEvent("portfolio:ocean-transition", {
        detail: { from: previousBiome, to: biome, duration },
      }));
      transitionTimerRef.current = window.setTimeout(() => {
        if (document.documentElement.dataset.oceanTransition === transitionName) {
          delete document.documentElement.dataset.oceanTransition;
        }
      }, Math.ceil(duration * 1000 + 180));
    }

    if (!agentsRef.current.length) {
      rebuildPopulation(biome);
    } else if (previousBiome !== biome || agentsRef.current.length !== population) {
      previousAgentsRef.current = agentsRef.current;
      agentsRef.current = createMarinePopulation(population, biome, 0x5183 + population * 13 + BIOME_ORDER.indexOf(biome) * 97);
      transitionRef.current = {
        from: previousBiome,
        to: biome,
        startedAt: elapsedRef.current,
        duration,
      };
    }

    return () => {
      window.clearTimeout(transitionTimerRef.current);
      if (document.documentElement.dataset.oceanTransition === transitionName) delete document.documentElement.dataset.oceanTransition;
      if (document.documentElement.dataset.oceanBiome === biome) delete document.documentElement.dataset.oceanBiome;
    };
  }, [biome, population, rebuildPopulation]);

  useEffect(() => {
    const handleVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleVolcano = (event) => {
      if (event.detail?.reaction) dangerRef.current = 1.35;
    };
    window.addEventListener("portfolio:volcano-stage", handleVolcano);
    return () => window.removeEventListener("portfolio:volcano-stage", handleVolcano);
  }, []);

  useEffect(() => {
    const observed = new Set();
    const observer = new IntersectionObserver((records) => {
      for (const record of records) entriesRef.current.set(record.target.id, record);
      const nextBiome = chooseBiome(entriesRef.current, biomeRef.current);
      if (nextBiome !== biomeRef.current) {
        setBiome(nextBiome);
      }
    }, {
      rootMargin: "-42% 0px -56% 0px",
      threshold: [0, 0.01],
    });

    const discoverSections = () => {
      for (const id of OBSERVED_SECTIONS) {
        const target = document.getElementById(id);
        if (!target || observed.has(target)) continue;
        observed.add(target);
        observer.observe(target);
      }
    };

    discoverSections();
    const mutationObserver = new MutationObserver(discoverSections);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return undefined;

    const resize = () => {
      viewportRef.current = resizeCanvas(canvas, dpr);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });

    if (!agentsRef.current.length) rebuildPopulation();

    const paint = (timestamp) => {
      const previous = lastFrameRef.current || timestamp;
      const delta = Math.min(0.05, Math.max(1 / 240, (timestamp - previous) / 1000));
      lastFrameRef.current = timestamp;
      elapsedRef.current += delta;
      dangerRef.current = Math.max(0, dangerRef.current - delta * 0.72);

      const viewport = viewportRef.current;
      context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);
      context.imageSmoothingEnabled = true;

      const profile = BIOME_PROFILES[biomeRef.current] ?? BIOME_PROFILES.surface;
      const transition = transitionRef.current;
      const transitionProgress = transition.duration > 0
        ? Math.min(1, Math.max(0, (elapsedRef.current - transition.startedAt) / transition.duration))
        : 1;
      const easedTransition = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
      if (!reducedMotion) {
        stepMarinePopulation(
          agentsRef.current,
          delta,
          elapsedRef.current,
          biomeRef.current,
          { danger: dangerRef.current, dangerX: 0.5, dangerY: 0.56 },
        );
        if (transitionProgress < 1 && previousAgentsRef.current.length) {
          stepMarinePopulation(
            previousAgentsRef.current,
            delta,
            elapsedRef.current,
            transition.from,
            { danger: dangerRef.current, dangerX: 0.5, dangerY: 0.56 },
          );
        }
      }
      if (transitionProgress < 1 && previousAgentsRef.current.length) {
        const previousProfile = BIOME_PROFILES[transition.from] ?? BIOME_PROFILES.surface;
        for (const agent of previousAgentsRef.current) {
          drawAgent(context, agent, viewport, elapsedRef.current, previousProfile.visibility * (1 - easedTransition));
        }
      } else if (previousAgentsRef.current.length) {
        previousAgentsRef.current = [];
      }
      for (const agent of agentsRef.current) {
        drawAgent(context, agent, viewport, elapsedRef.current, profile.visibility * easedTransition);
      }

      if (!isMobile && !reducedMotion && runtimeQuality !== "constrained") {
        drawRareEvent(context, resolveRareOceanEvent(elapsedRef.current), viewport);
      }

      if (active && !reducedMotion) rafRef.current = requestAnimationFrame(paint);
    };

    if (active) {
      if (reducedMotion) paint(performance.now());
      else rafRef.current = requestAnimationFrame(paint);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, [active, biome, dpr, isMobile, rebuildPopulation, reducedMotion, runtimeQuality]);

  return (
    <div className={`global-aquarium ocean-world-runtime${paused ? " is-paused" : ""}`} data-biome={biome} aria-hidden="true">
      <div className="ocean-biome-transition-layer" data-world-director="intersection-decision-band">
        <span className="ocean-biome-haze" />
        <span className="ocean-biome-mineral" />
        <span className="ocean-biome-project-light" />
        <span className="ocean-biome-surface-light" />
        <span className="ocean-transition-thermocline" />
        <span className="ocean-transition-hydrothermal">
          <i /><i /><i /><i />
        </span>
        <span className="ocean-transition-data-cooling">
          {Array.from({ length: 12 }, (_, index) => (
            <i
              key={`cooling-node-${index}`}
              style={{
                "--transition-x": `${8 + index * 7.4}%`,
                "--transition-y": `${72 - (index % 4) * 13}%`,
                "--transition-delay": `${index * 0.035}s`,
              }}
            />
          ))}
        </span>
      </div>
      <canvas ref={canvasRef} className="ocean-world-canvas" />
    </div>
  );
}
