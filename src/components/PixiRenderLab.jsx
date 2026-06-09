import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useEffect, useRef } from "react";
import SectionTitle from "./SectionTitle";

const COLORS = {
  ink: 0x132033,
  slate: 0x586b78,
  paper: 0xfffbf3,
  teal: 0x00b4d8,   // Cyan percutant
  sky: 0x0077b6,    // Bleu azur
  indigo: 0x5a189a, // Violet profond
  sage: 0x2d6a4f,   // Vert émeraude
  amber: 0xf48c06,  // Orange vif
  rose: 0xd00000,   // Rouge intense
  white: 0xffffff,
};

const FLOW = [
  { label: "React", detail: "UI / SEO", x: 0.12, y: 0.28, color: COLORS.teal },
  { label: "Spring", detail: "API / DTO", x: 0.38, y: 0.66, color: COLORS.indigo },
  { label: "PixiJS", detail: "Canvas GPU", x: 0.64, y: 0.32, color: COLORS.sage },
  { label: "Portfolio", detail: "preuve", x: 0.86, y: 0.58, color: COLORS.amber },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLabQualityProfile() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isFirefox = userAgent.includes("firefox");
  const cores = window.navigator.hardwareConcurrency || 4;
  const deviceMemory = window.navigator.deviceMemory || 4;
  const narrow = window.innerWidth < 720;
  const lowPower = isFirefox || cores <= 4 || deviceMemory <= 4 || narrow;

  return {
    isFirefox,
    antialias: true,
    maxFPS: isFirefox ? 60 : lowPower ? 36 : 50,
    constellationCount: isFirefox ? 14 : lowPower ? 20 : 34,
    resolution: Math.min(window.devicePixelRatio || 1, isFirefox ? 1 : lowPower ? 1.05 : 1.25),
    preference: isFirefox ? "webgl" : "webgpu",
  };
}

function drawNode(graphics, node, width, height, time, pointer, index) {
  const x = width * node.x + Math.sin(time * 0.36 + index) * 10 + pointer.x * (index + 1) * 8;
  const y = height * node.y + Math.cos(time * 0.31 + index) * 8 + pointer.y * (index + 1) * 7;
  const pulse = 1 + Math.sin(time * 1.3 + index) * 0.035;
  const nodeWidth = 136 * pulse;
  const nodeHeight = 74 * pulse;

  // Augmentation massive des opacités et bordures
  graphics.roundRect(x - nodeWidth / 2, y - nodeHeight / 2, nodeWidth, nodeHeight, 24).fill({ color: COLORS.white, alpha: 0.8 }).stroke({ color: node.color, alpha: 0.9, width: 2.5 });
  graphics.circle(x - nodeWidth * 0.32, y, 6).fill({ color: node.color, alpha: 1.0 });
  graphics.roundRect(x - nodeWidth * 0.19, y - 12, nodeWidth * 0.38, 7, 4).fill({ color: node.color, alpha: 0.5 });
  graphics.roundRect(x - nodeWidth * 0.19, y + 6, nodeWidth * 0.5, 5, 3).fill({ color: COLORS.ink, alpha: 0.3 });

  return { x, y, color: node.color };
}

function drawLab(graphics, width, height, time, pointer, quality) {
  graphics.clear();
  graphics.rect(0, 0, width, height).fill({ color: COLORS.paper, alpha: 0 });

  const points = FLOW.map((node, index) => ({ ...drawNode(graphics, node, width, height, time, pointer, index), node }));

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const mx = (a.x + b.x) / 2 + Math.sin(time * 0.42 + i) * 22;
    const my = (a.y + b.y) / 2 + Math.cos(time * 0.38 + i) * 18;
    // Liens plus épais et opaques
    graphics.moveTo(a.x, a.y).quadraticCurveTo(mx, my, b.x, b.y).stroke({ color: a.color, alpha: 0.6, width: 2.5 });

    const packetT = (time * (0.11 + i * 0.015) + i * 0.21) % 1;
    const x = (1 - packetT) * (1 - packetT) * a.x + 2 * (1 - packetT) * packetT * mx + packetT * packetT * b.x;
    const y = (1 - packetT) * (1 - packetT) * a.y + 2 * (1 - packetT) * packetT * my + packetT * packetT * b.y;
    // Particules de flux très visibles
    graphics.circle(x, y, 5.5).fill({ color: b.color, alpha: 1.0 });
    graphics.circle(x, y, 16).stroke({ color: b.color, alpha: 0.5, width: 2.0 });
  }

  for (let i = 0; i < quality.constellationCount; i += 1) {
    const x = (width * ((i * 29) % 100)) / 100 + Math.sin(time * 0.34 + i) * 10 + pointer.x * 18;
    const y = (height * ((i * 47) % 100)) / 100 + Math.cos(time * 0.29 + i) * 8 + pointer.y * 16;
    const color = [COLORS.teal, COLORS.indigo, COLORS.sage, COLORS.amber][i % 4];
    graphics.circle(x, y, 2.5 + (i % 3) * 0.8).fill({ color, alpha: 0.5 }); // Constellation plus dense
  }

  const ringX = width * 0.5 + pointer.x * 52;
  const ringY = height * 0.5 + pointer.y * 38;
  // Anneaux centraux
  graphics.circle(ringX, ringY, Math.min(width, height) * 0.24).stroke({ color: COLORS.teal, alpha: 0.4, width: 2.0 });
  graphics.circle(ringX, ringY, Math.min(width, height) * 0.15).stroke({ color: COLORS.indigo, alpha: 0.3, width: 1.5 });
}

function usePixiLab(hostRef) {
  useEffect(() => {
    const host = hostRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!host || reducedMotion) return undefined;

    let app;
    let cancelled = false;
    let cleanupPointer = () => {};

    async function mount() {
      const { Application, Graphics } = await import("pixi.js");
      const quality = getLabQualityProfile();
      app = new Application();
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: quality.antialias,
        autoDensity: true,
        resolution: quality.resolution,
        preference: quality.preference,
        powerPreference: "high-performance",
      });

      app.ticker.maxFPS = quality.maxFPS;

      if (cancelled) {
        app.destroy(false);
        return;
      }

      host.replaceChildren(app.canvas);
      app.canvas.setAttribute("aria-hidden", "true");
      app.canvas.setAttribute("role", "presentation");

      // Mode normal par défaut sur un nouveau Graphics PixiJS
      const graphics = new Graphics();
      app.stage.addChild(graphics);
      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };

      const onPointerMove = (event) => {
        const rect = host.getBoundingClientRect();
        target.x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
        target.y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
      };
      host.addEventListener("pointermove", onPointerMove, { passive: true });
      let observer;
      const onVisibilityChange = () => {
        if (!app?.ticker) return;
        if (document.hidden) app.ticker.stop();
        else app.ticker.start();
      };

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(([entry]) => {
          if (!app?.ticker) return;
          if (entry.isIntersecting && !document.hidden) app.ticker.start();
          else app.ticker.stop();
        }, { threshold: 0.06 });
        observer.observe(host);
      }

      document.addEventListener("visibilitychange", onVisibilityChange);
      cleanupPointer = () => {
        host.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        observer?.disconnect();
      };

      let elapsed = 0;
      app.ticker.add(({ deltaMS }) => {
        elapsed += deltaMS * 0.001;
        pointer.x += (target.x - pointer.x) * 0.08;
        pointer.y += (target.y - pointer.y) * 0.08;
        drawLab(graphics, app.screen.width, app.screen.height, elapsed, pointer, quality);
      });
    }

    mount().catch(() => {
      if (app) app.destroy(false);
    });

    return () => {
      cancelled = true;
      cleanupPointer();
      if (app) {
        app.destroy(false);
        app = undefined;
      }
      host.replaceChildren();
    };
  }, [hostRef]);
}

export default function PixiRenderLab({ projects, experiences }) {
  const hostRef = useRef(null);
  const publishedCount = projects?.filter((project) => project.published !== false).length ?? 0;
  const experienceCount = experiences?.length ?? 0;

  usePixiLab(hostRef);

  return (
    <section id="render-lab" className="page-section render-lab-section">
      <SectionTitle
        eyebrow="PixiJS showcase"
        title="Une couche graphique démonstrative, pas un simple décor"
        description="Cette section ajoute un second canvas PixiJS autonome. Il illustre le flux React / API / rendu GPU / portfolio sans déclencher de rerender React à chaque frame."
      />

      <div className="render-lab-layout">
        <Card className="render-lab-canvas-card" radius="xl">
          <div ref={hostRef} className="render-lab-canvas" />
          <div className="render-lab-label">
            <Badge className="executive-badge">WebGPU preferred</Badge>
            <Text>Pipeline visuel interactif</Text>
          </div>
        </Card>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" className="render-lab-feature-grid">
          <Card className="render-lab-feature" radius="xl">
            <Text className="card-kicker">Canvas isolé</Text>
            <Title order={3}>React ne pilote pas les frames</Title>
            <Text>La scène est montée une fois, puis PixiJS anime ses objets via ticker, refs et objets locaux.</Text>
          </Card>
          <Card className="render-lab-feature" radius="xl">
            <Text className="card-kicker">Contenu vivant</Text>
            <Title order={3}>{publishedCount} projets visibles</Title>
            <Text>Les compteurs restent issus du modèle portfolio, mais l’animation reste décorative et performante.</Text>
          </Card>
          <Card className="render-lab-feature" radius="xl">
            <Text className="card-kicker">Signal parcours</Text>
            <Title order={3}>{experienceCount} entrées timeline</Title>
            <Text>Le rendu combine nœuds, packets, courbes et particules, inspiré des showcases PixiJS.</Text>
          </Card>
        </SimpleGrid>

        <Group gap="xs" className="render-lab-tags">
          <Badge className="category-chip">Application</Badge>
          <Badge className="category-chip">Graphics</Badge>
          <Badge className="category-chip">Container</Badge>
          <Badge className="category-chip">Ticker</Badge>
          <Badge className="category-chip">Fallback CSS</Badge>
        </Group>
      </div>
    </section>
  );
}