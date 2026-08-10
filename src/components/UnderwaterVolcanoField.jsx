import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsapReady } from "../animations/useGsap";
import {
  createVolcanoParticles,
  createVolcanoSimulation,
  resolveVolcanoParticleCounts,
  resolveVolcanoStageProfile,
  stepVolcanoParticles,
  stepVolcanoSimulation,
} from "../animations/volcanoSimulationEngine";
import { createVolcanoWebGLRenderer } from "../rendering/volcanoWebGLRenderer";
import { paintVolcanoSmokeTexture } from "../rendering/volcanoSmokeTexture";
import {
  scheduleBackgroundTask,
  scheduleUserVisibleTask,
} from "../performance/runtimeScheduler";

const VOLCANO_FALLBACK_PATH = "/scenes/abyss-volcano.svg";
const VOLCANO_ENVIRONMENT_PATH = "/scenes/abyss-volcano-environment.svg";

function resolveDpr(performanceMode, runtimeQuality) {
  const deviceDpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const maxDpr = runtimeQuality === "constrained"
    ? 0.92
    : performanceMode === "balanced" || runtimeQuality === "balanced"
      ? 1.04
      : 1.16;
  return Math.min(deviceDpr, maxDpr);
}

function resolveRenderFps(performanceMode, runtimeQuality) {
  if (runtimeQuality === "constrained") return 28;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return 42;
  return 60;
}

function resizeCanvas(canvas, stage, dpr) {
  const rect = stage.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
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

function createTextureSurface(size) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const surface = document.createElement("canvas");
  surface.width = size;
  surface.height = size;
  return surface;
}

function createTexture(size, painter) {
  const surface = createTextureSurface(size);
  const context = surface.getContext("2d");
  painter(context, size);
  return surface;
}

function createLocalParticleTextures() {
  const smoke = [0, 1, 2, 3, 4, 5].map((variant) => createTexture(192, (context, size) => {
    paintVolcanoSmokeTexture(context, size, variant, "cold");
  }));

  const hotSmoke = createTexture(168, (context, size) => {
    paintVolcanoSmokeTexture(context, size, 0, "hot");
  });

  const ember = createTexture(40, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,218,1)");
    gradient.addColorStop(0.18, "rgba(255,185,46,.98)");
    gradient.addColorStop(0.52, "rgba(255,72,7,.62)");
    gradient.addColorStop(1, "rgba(255,36,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });

  const bubble = createTexture(64, (context, size) => {
    const center = size / 2;
    const radius = size * 0.39;
    const gradient = context.createRadialGradient(center * 0.72, center * 0.68, 1, center, center, radius);
    gradient.addColorStop(0, "rgba(255,255,255,.34)");
    gradient.addColorStop(0.34, "rgba(126,226,255,.11)");
    gradient.addColorStop(0.70, "rgba(44,177,224,.08)");
    gradient.addColorStop(1, "rgba(190,244,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(199,245,255,.82)";
    context.lineWidth = Math.max(1, size * 0.035);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.78)";
    context.beginPath();
    context.ellipse(center * 0.72, center * 0.67, size * 0.075, size * 0.045, -0.5, 0, Math.PI * 2);
    context.fill();
  });

  const bio = createTexture(28, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(214,255,255,.96)");
    gradient.addColorStop(0.26, "rgba(64,222,255,.70)");
    gradient.addColorStop(1, "rgba(0,165,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });

  return { smoke, hotSmoke, ember, bubble, bio };
}

function requestWorkerParticleTextures() {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    return Promise.resolve(createLocalParticleTextures());
  }

  return new Promise((resolve) => {
    const worker = new Worker(new URL("../workers/volcanoTexture.worker.js", import.meta.url), { type: "module" });
    let settled = false;
    const finish = (textures) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(textures);
    };
    const timeout = window.setTimeout(() => finish(createLocalParticleTextures()), 1400);
    worker.onmessage = (event) => {
      if (event.data?.type === "volcano-textures-ready") finish(event.data);
      else if (event.data?.type === "volcano-textures-error") finish(createLocalParticleTextures());
    };
    worker.onerror = () => finish(createLocalParticleTextures());
    worker.postMessage({ type: "build-volcano-textures" });
  });
}

function drawParticleField(context, particles, textures, viewport, elapsedSeconds, profile) {
  const { width, height, dpr } = viewport;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const smokeDensity = Math.min(1.5, profile?.smokeDensity ?? 1.34);
  const emberStrength = Math.min(1.8, profile?.embers ?? 0.055);
  const ashStrength = Math.min(1.65, profile?.ash ?? 0.01);
  const bubbleStrength = Math.min(1.8, profile?.bubbles ?? 0.84);
  const sedimentStrength = Math.min(1.5, profile?.sediment ?? 0.12);
  const debrisStrength = Math.min(1.8, profile?.debris ?? 0.03);

  for (const particle of particles) {
    const lifeRatio = Math.min(1, particle.life / Math.max(0.001, particle.ttl));
    const fade = Math.sin(Math.PI * lifeRatio);
    const pulse = 0.84 + Math.sin(particle.phase + elapsedSeconds * 2.1) * 0.16;

    if (particle.type === "smoke" || particle.type === "vent") {
      const texture = textures.smoke[particle.variant % textures.smoke.length];
      const isVent = particle.type === "vent";
      const layer = isVent ? "vent" : particle.plumeLayer ?? "main";
      const layerScale = layer === "vent"
        ? 0.74
        : layer === "hot"
          ? 0.82
          : layer === "diffuse"
            ? 1.08
            : 0.96;
      const densityScale = isVent ? 1 : 0.94 + smokeDensity * 0.08;
      const size = particle.size * layerScale * densityScale;
      const horizontalStretch = layer === "diffuse" ? 1.10 : layer === "main" ? 1.02 : 0.96;
      const verticalStretch = layer === "diffuse" ? 0.96 : 1.05;
      const layerOpacity = layer === "hot"
        ? 0.78
        : layer === "main"
          ? 0.68
          : layer === "diffuse"
            ? 0.46
            : 0.42;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.scale(horizontalStretch, verticalStretch);
      context.filter = "none";
      context.globalCompositeOperation = "source-over";
      const smokeFade = Math.min(
        1,
        Math.max(0, lifeRatio / 0.08),
        Math.max(0, (1 - lifeRatio) / 0.12),
      );
      context.globalAlpha = Math.min(
        0.82,
        particle.alpha * Math.max(0.30, smokeFade) * layerOpacity * (0.92 + smokeDensity * 0.10),
      );
      context.drawImage(texture, -size / 2, -size / 2, size, size);

      if (!isVent && layer === "hot" && textures.hotSmoke && lifeRatio < 0.70) {
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = Math.min(
          0.38,
          particle.alpha * Math.max(0.10, 1 - lifeRatio * 1.15),
        );
        context.drawImage(textures.hotSmoke, -size * 0.34, -size * 0.30, size * 0.68, size * 0.68);
      }
      context.restore();
      continue;
    }

    if (particle.type === "bubble") {
      const wobble = Math.sin(particle.phase + elapsedSeconds * 2.4);
      const size = particle.size * 2.25;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(wobble * 0.12);
      context.scale(1 + wobble * 0.10, 1 - wobble * 0.07);
      context.globalAlpha = particle.alpha * Math.max(0.12, fade) * (0.45 + bubbleStrength * 0.62);
      context.drawImage(textures.bubble, -size / 2, -size / 2, size, size);
      context.restore();
      continue;
    }

    if (particle.type === "ash") {
      if (ashStrength < 0.025) continue;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = particle.alpha * Math.max(0.05, fade) * ashStrength;
      context.fillStyle = "rgba(31,38,47,.76)";
      context.beginPath();
      context.ellipse(0, 0, particle.size * 1.45, particle.size * 0.55, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      continue;
    }

    if (particle.type === "sediment") {
      if (sedimentStrength < 0.08) continue;
      context.save();
      context.translate(particle.x, particle.y);
      context.globalAlpha = particle.alpha * Math.max(0.04, fade) * sedimentStrength;
      context.fillStyle = "rgba(118,103,82,.54)";
      context.beginPath();
      context.arc(0, 0, particle.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
      continue;
    }

    if (particle.type === "fragment") {
      if (debrisStrength < 0.10) continue;
      const r = particle.size;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = particle.alpha * Math.max(0.06, fade) * debrisStrength;
      context.fillStyle = "rgba(9,18,24,.94)";
      context.strokeStyle = "rgba(255,104,30,.20)";
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(-r, r * 0.15);
      context.lineTo(-r * 0.22, -r * 0.86);
      context.lineTo(r * 0.84, -r * 0.34);
      context.lineTo(r * 0.48, r * 0.76);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
      continue;
    }

    const texture = particle.type === "ember" ? textures.ember : textures.bio;
    const strength = particle.type === "ember" ? emberStrength : Math.max(0.45, 0.86 - (profile?.lava ?? 0) * 0.18);
    if (strength < 0.02) continue;
    const scale = particle.type === "ember" ? 4.1 : 4.2;
    const size = particle.size * scale;
    context.save();
    context.globalAlpha = particle.alpha * Math.max(0.08, fade) * pulse * strength;
    if (particle.type === "ember") context.globalCompositeOperation = "lighter";
    context.drawImage(texture, particle.x - size / 2, particle.y - size / 2, size, size);
    context.restore();
  }
}

function qualityScalar(runtimeQuality, performanceMode) {
  if (runtimeQuality === "constrained") return 0.45;
  if (runtimeQuality === "balanced" || performanceMode === "balanced") return 0.72;
  return 1;
}

export default function UnderwaterVolcanoField({
  performanceMode = "full",
  paused = false,
  runtimeQuality = "high",
}) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const webglCanvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef([]);
  const texturesRef = useRef(null);
  const viewportRef = useRef({ width: 1, height: 1, dpr: 1 });
  const simulationRef = useRef(createVolcanoSimulation(0x8218));
  const profileRef = useRef(resolveVolcanoStageProfile(simulationRef.current));
  const reportedPulseRef = useRef("base");
  const reportedReactionRef = useRef(false);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastPaintRef = useRef(0);
  const unmountTimerRef = useRef(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [insideActiveZone, setInsideActiveZone] = useState(false);
  const [rendererKind, setRendererKind] = useState("pending");
  const [pulseName, setPulseName] = useState("base");
  const [eruptionReaction, setEruptionReaction] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" ? true : !document.hidden);

  const counts = useMemo(
    () => resolveVolcanoParticleCounts(runtimeQuality, performanceMode),
    [performanceMode, runtimeQuality],
  );
  const active = sceneReady && insideActiveZone && pageVisible && !paused;
  const dpr = resolveDpr(performanceMode, runtimeQuality);
  const targetFps = resolveRenderFps(performanceMode, runtimeQuality);
  const quality = qualityScalar(runtimeQuality, performanceMode);

  const rebuildParticles = useCallback(() => {
    const { width, height } = viewportRef.current;
    if (width <= 1 || height <= 1) return;
    const seed = 0x7610 + counts.smoke * 31 + counts.ember * 17 + counts.ash * 13 + counts.sediment * 11 + counts.fragment * 19;
    particlesRef.current = createVolcanoParticles(width, height, counts, seed);
  }, [counts]);

  const resize = useCallback(() => {
    const particleCanvas = particleCanvasRef.current;
    const webglCanvas = webglCanvasRef.current;
    const stage = stageRef.current;
    if (!particleCanvas || !webglCanvas || !stage) return;
    const viewport = resizeCanvas(particleCanvas, stage, dpr);
    viewportRef.current = viewport;
    rendererRef.current?.resize(viewport.width, viewport.height, dpr);
    rebuildParticles();
  }, [dpr, rebuildParticles]);

  useEffect(() => {
    const handleVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(unmountTimerRef.current);
        if (entry.isIntersecting) {
          if (texturesRef.current) {
            scheduleUserVisibleTask(() => setSceneReady(true)).catch(() => setSceneReady(true));
            return;
          }
          scheduleBackgroundTask(() => requestWorkerParticleTextures())
            .then((textures) => scheduleUserVisibleTask(() => {
              texturesRef.current = textures;
              setSceneReady(true);
            }))
            .catch(() => {
              texturesRef.current = createLocalParticleTextures();
              setSceneReady(true);
            });
          return;
        }
        unmountTimerRef.current = window.setTimeout(() => setSceneReady(false), 1800);
      },
      { rootMargin: "1100px 0px", threshold: 0.01 },
    );

    const activeObserver = new IntersectionObserver(
      ([entry]) => setInsideActiveZone(entry.isIntersecting),
      { rootMargin: "180px 0px", threshold: 0.01 },
    );

    preloadObserver.observe(root);
    activeObserver.observe(root);
    return () => {
      window.clearTimeout(unmountTimerRef.current);
      preloadObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!sceneReady || !webglCanvasRef.current) return undefined;
    const renderer = createVolcanoWebGLRenderer(webglCanvasRef.current);
    rendererRef.current = renderer;
    setRendererKind(renderer ? "webgl2" : "fallback");
    resize();

    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.visualViewport?.addEventListener("resize", resize, { passive: true });

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", resize);
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [resize, sceneReady]);

  useEffect(() => {
    if (!sceneReady) return;
    rebuildParticles();
  }, [rebuildParticles, sceneReady]);

  useEffect(() => {
    const particleCanvas = particleCanvasRef.current;
    const context = particleCanvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!particleCanvas || !context || !active || !texturesRef.current) {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
      return undefined;
    }

    const paintInterval = 1000 / targetFps;
    const tick = (timestamp) => {
      const previous = lastFrameRef.current || timestamp;
      const deltaSeconds = Math.min(1 / 20, Math.max(1 / 240, (timestamp - previous) / 1000));
      lastFrameRef.current = timestamp;

      stepVolcanoSimulation(simulationRef.current, deltaSeconds);
      const profile = resolveVolcanoStageProfile(simulationRef.current);
      profileRef.current = profile;
      if (profile.pulseType !== reportedPulseRef.current) {
        reportedPulseRef.current = profile.pulseType;
        setPulseName(profile.pulseType);
      }
      const reacting = profile.shock > 0.52 || (profile.pulseType === "mega" && profile.pulse > 0.92);
      if (reacting !== reportedReactionRef.current) {
        reportedReactionRef.current = reacting;
        setEruptionReaction(reacting);
      }

      if (!lastPaintRef.current || timestamp - lastPaintRef.current >= paintInterval - 0.5) {
        lastPaintRef.current = timestamp;
        stepVolcanoParticles(
          particlesRef.current,
          Math.min(0.05, Math.max(deltaSeconds, paintInterval / 1000)),
          viewportRef.current.width,
          viewportRef.current.height,
          simulationRef.current.elapsed,
          profile,
        );
        rendererRef.current?.render(simulationRef.current.elapsed, profile, quality);
        drawParticleField(
          context,
          particlesRef.current,
          texturesRef.current,
          viewportRef.current,
          simulationRef.current.elapsed,
          profile,
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
    };
  }, [active, quality, targetFps]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    window.dispatchEvent(new CustomEvent("portfolio:volcano-stage", {
      detail: {
        stage: active ? "eruption" : "idle",
        pulseType: active ? pulseName : "base",
        reaction: active && eruptionReaction,
      },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent("portfolio:volcano-stage", {
        detail: { stage: "idle", pulseType: "base", reaction: false },
      }));
    };
  }, [active, eruptionReaction, pulseName]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (paused) return undefined;

    gsapReady().then((runtime) => {
      if (disposed || !runtime?.gsap || !rootRef.current || !stageRef.current) return;
      const { gsap, ScrollTrigger } = runtime;
      const context = gsap.context(() => {
        gsap.fromTo(
          stageRef.current,
          { y: 34, autoAlpha: 0, scale: 0.994 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: performanceMode === "balanced" ? 0.54 : 0.72,
            ease: "expo.out",
            force3D: true,
            scrollTrigger: ScrollTrigger ? { trigger: rootRef.current, start: "top 84%" } : undefined,
          },
        );
      }, rootRef.current);
      cleanup = () => context.revert();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [paused, performanceMode]);

  useEffect(() => () => {
    const textures = texturesRef.current;
    if (!textures) return;
    for (const texture of [...(textures.smoke ?? []), textures.hotSmoke, textures.ember, textures.bubble, textures.bio]) {
      texture?.close?.();
    }
  }, []);

  return (
    <section
      ref={rootRef}
      id="abyss-volcano-field"
      className={`volcano-field-section${active ? " is-active" : ""}${sceneReady ? " is-mounted" : " is-suspended"}`}
      data-volcano-stage={active ? "eruption" : "idle"}
      data-volcano-pulse={active ? pulseName : "base"}
      data-volcano-renderer={rendererKind}
      aria-hidden="true"
    >
      <div ref={stageRef} className="volcano-field-stage" aria-hidden="true">
        <div className="volcano-light-rays" />
        <img
          className="volcano-environment-vector"
          src={VOLCANO_ENVIRONMENT_PATH}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="volcano-render-stack">
          {rendererKind === "fallback" && (
            <img
              className="volcano-fallback-vector"
              src={VOLCANO_FALLBACK_PATH}
              alt=""
              loading="lazy"
              decoding="async"
            />
          )}
          <canvas ref={webglCanvasRef} className="volcano-webgl-canvas" />
          {sceneReady ? (
            <canvas ref={particleCanvasRef} className="volcano-particle-canvas" />
          ) : (
            <div className="volcano-field-placeholder" />
          )}
        </div>
        <img
          className="volcano-foreground-vector"
          src="/scenes/abyss-volcano-foreground.svg"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="volcano-seabed-vignette" />
      </div>
    </section>
  );
}
