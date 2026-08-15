import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createGpuTimerQuery } from "../../engineering/gpuProfiler";
import ObservabilityGuide from "./ObservabilityGuide";
import { VisibilityGate } from "../../visibility/ItemVisibilityContext";

const NODES = Object.freeze([
  { id: "visitor", technology: "Visiteur", role: "Entrée publique", layer: "expérience", community: "front", status: "local", detail: "Le visiteur ouvre le portfolio. Ce nœud représente l’origine humaine de la navigation et non une ressource système." },
  { id: "browser", technology: "Navigateur", role: "Web APIs · GPU · réseau", layer: "expérience", community: "front", status: "local", detail: "Exécute React, les animations, les mesures Performance API, les requêtes HTTP et le rendu graphique." },
  { id: "react", technology: "React 19", role: "Runtime de l’interface", layer: "expérience", community: "front", status: "local", detail: "Construit l’interface, réconcilie l’état, pilote les interactions et déclenche les appels vers l’API." },
  { id: "edge", technology: "Cloudflare", role: "Pages · assets · edge", layer: "expérience", community: "front", status: "configured", detail: "Distribue le build Vite, les assets statiques et le routage du frontend déployé." },
  { id: "frontRepo", technology: "GitHub Front", role: "professional_website_front", layer: "livraison", community: "front", status: "configured", detail: "Dépôt source du frontend. Un push sur main alimente la chaîne de vérification puis le déploiement Cloudflare." },
  { id: "frontCi", technology: "CI Front", role: "Vitest · Playwright · Vite", layer: "livraison", community: "front", status: "configured", detail: "Quality gates du frontend : tests, contrôles statiques, build Vite et livraison vers Cloudflare." },

  { id: "security", technology: "Spring Security", role: "FilterChain · CORS · JWT", layer: "application", community: "back", status: "waiting", detail: "Premier filtre applicatif de l’API. Il contrôle les routes, CORS, CSRF et l’authentification avant le contrôleur." },
  { id: "api", technology: "Spring Boot 4", role: "Controllers REST", layer: "application", community: "back", status: "waiting", detail: "Expose les endpoints publics, administratifs et Engineering. Les traces serveur commencent ici après la chaîne de filtres." },
  { id: "services", technology: "Services métier", role: "Versions · publication", layer: "application", community: "back", status: "waiting", detail: "Orchestre les règles métier, les transactions, les publications, les traductions et les appels aux repositories." },
  { id: "monitor", technology: "Télémétrie backend", role: "JVM · DB · caches · files", layer: "application", community: "back", status: "waiting", detail: "Produit le snapshot Engineering : CPU serveur, mémoire JVM, stockage, base, cache et files asynchrones." },
  { id: "cache", technology: "Caffeine", role: "Caches de lecture", layer: "données", community: "back", status: "waiting", detail: "Conserve les lectures fréquentes en mémoire et expose les statistiques hits, misses et taille estimée." },
  { id: "postgres", technology: "PostgreSQL", role: "Données versionnées", layer: "données", community: "back", status: "waiting", detail: "Persiste le portfolio, ses versions, les mesures runtime, les jobs et les événements transactionnels." },
  { id: "cloudinary", technology: "Cloudinary", role: "Médias", layer: "données", community: "back", status: "configured", detail: "Service externe utilisé par le backend pour les images et documents référencés dans le contenu publié." },
  { id: "translate", technology: "LibreTranslate", role: "Traductions", layer: "données", community: "back", status: "configured", detail: "Service de traduction appelé par les workflows administratifs avant validation et publication." },
  { id: "outbox", technology: "Transactional Outbox", role: "Événements persistés", layer: "asynchrone", community: "back", status: "waiting", detail: "Enregistre l’événement dans la même transaction que la donnée métier afin d’éviter les publications perdues." },
  { id: "jobs", technology: "Background Jobs", role: "Scheduler · retries", layer: "asynchrone", community: "back", status: "waiting", detail: "Exécute les tâches longues, reprises et opérations différées avec statut, progression et nombre de tentatives." },
  { id: "backRepo", technology: "GitHub Back", role: "professional_website", layer: "livraison", community: "back", status: "configured", detail: "Dépôt source du backend Spring Boot. Sa chaîne de livraison est indépendante de celle du frontend." },
  { id: "backCi", technology: "CI Back", role: "Tests · Maven · Docker", layer: "livraison", community: "back", status: "configured", detail: "Valide le backend puis construit l’image Docker destinée à l’environnement Render." },
  { id: "docker", technology: "Docker / Render", role: "API déployée", layer: "livraison", community: "back", status: "configured", detail: "Exécute l’application Spring Boot en production et relie l’API aux services de données." },
]);

const LINKS = Object.freeze([
  { source: "visitor", target: "browser", channel: "navigation", flows: ["request"], active: true },
  { source: "browser", target: "edge", channel: "HTTPS", flows: ["request"], active: true },
  { source: "edge", target: "react", channel: "assets Vite", flows: ["request", "deploy"], active: true },
  { source: "react", target: "security", channel: "fetch HTTPS / JSON", flows: ["request"] },
  { source: "security", target: "api", channel: "Security FilterChain", flows: ["request"] },
  { source: "api", target: "services", channel: "appel métier", flows: ["request", "publish"] },
  { source: "services", target: "cache", channel: "Spring Cache", flows: ["request"] },
  { source: "services", target: "postgres", channel: "JPA · Hibernate · JDBC", flows: ["request", "publish"] },
  { source: "services", target: "cloudinary", channel: "API média", flows: ["request", "publish"] },
  { source: "services", target: "translate", channel: "HTTP traduction", flows: ["publish"] },
  { source: "services", target: "outbox", channel: "transaction SQL", flows: ["publish"] },
  { source: "outbox", target: "jobs", channel: "dispatch · retry", flows: ["publish"] },
  { source: "api", target: "monitor", channel: "snapshot runtime", flows: ["request"] },
  { source: "postgres", target: "monitor", channel: "latence · état", flows: ["request"] },

  { source: "frontRepo", target: "frontCi", channel: "push main", flows: ["deploy"] },
  { source: "frontCi", target: "edge", channel: "Vite → Cloudflare", flows: ["deploy"] },
  { source: "backRepo", target: "backCi", channel: "push main", flows: ["deploy"] },
  { source: "backCi", target: "docker", channel: "Maven → image Docker", flows: ["deploy"] },
  { source: "docker", target: "api", channel: "release Render", flows: ["deploy"] },
]);

const LAYOUT_ROWS = Object.freeze([
  { community: "front", layer: "expérience", y: 13 },
  { community: "front", layer: "livraison", y: 29 },
  { community: "back", layer: "application", y: 47 },
  { community: "back", layer: "données", y: 63 },
  { community: "back", layer: "asynchrone", y: 78 },
  { community: "back", layer: "livraison", y: 92 },
]);

function computeArchitectureLayout(nodes, links, { width = 1440, height = 1580 } = {}) {
  const indexById = new Map(nodes.map((item, index) => [item.id, index]));
  const depth = new Map(nodes.map((item) => [item.id, 0]));
  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    links.forEach((link) => {
      const sourceDepth = depth.get(link.source) ?? 0;
      const targetDepth = depth.get(link.target) ?? 0;
      if (sourceDepth + 1 > targetDepth) {
        depth.set(link.target, sourceDepth + 1);
        changed = true;
      }
    });
    if (!changed) break;
  }

  const neighbours = new Map(nodes.map((item) => [item.id, []]));
  links.forEach((link) => {
    neighbours.get(link.source)?.push(link.target);
    neighbours.get(link.target)?.push(link.source);
  });

  const rows = LAYOUT_ROWS.map((row) => ({
    ...row,
    nodes: nodes.filter((item) => item.community === row.community && item.layer === row.layer),
  }));
  const positions = {};
  const anchors = {};
  const spreadRow = (items, y) => {
    const count = items.length;
    if (!count) return;
    const left = count <= 2 ? 28 : 12;
    const right = count <= 2 ? 72 : 88;
    const rowXs = count === 1 ? [50] : items.map((_, index) => left + ((right - left) * index / Math.max(1, count - 1)));
    items.forEach((item, index) => {
      positions[item.id] = [rowXs[index], y];
      anchors[item.id] = [rowXs[index], y];
    });
  };

  rows.forEach((row) => {
    row.nodes.sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0));
    spreadRow(row.nodes, row.y);
  });

  // First pass: Sugiyama-style barycentric ordering inside each semantic layer.
  for (let pass = 0; pass < 8; pass += 1) {
    rows.forEach((row) => {
      if (row.nodes.length < 2) return;
      row.nodes.sort((a, b) => {
        const barycenter = (item) => {
          const connected = neighbours.get(item.id) ?? [];
          if (!connected.length) return positions[item.id]?.[0] ?? 50;
          return connected.reduce((sum, id) => sum + (positions[id]?.[0] ?? 50), 0) / connected.length;
        };
        return (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || barycenter(a) - barycenter(b) || (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0);
      });
      spreadRow(row.nodes, row.y);
    });
  }

  // Second pass: deterministic force refinement in pixel space. It preserves the
  // frontend/backend communities but reacts to the current topology, viewport and
  // selected flow instead of relying on hard-coded coordinates.
  const scaleX = Math.max(720, Number(width) || 1440) / 100;
  const scaleY = Math.max(900, Number(height) || 1580) / 100;
  const nodeWidth = Math.min(270, Math.max(220, width * .175));
  const nodeHeight = 150;
  const gapX = 26;
  const gapY = 24;
  const minDx = (nodeWidth + gapX) / scaleX;
  const minDy = (nodeHeight + gapY) / scaleY;
  const velocities = Object.fromEntries(nodes.map((node) => [node.id, [0, 0]]));
  const clampNode = (node, point) => {
    const front = node.community === "front";
    const minY = front ? 5 : 40;
    const maxY = front ? 34 : 95;
    return [Math.max(10, Math.min(90, point[0])), Math.max(minY, Math.min(maxY, point[1]))];
  };

  for (let iteration = 0; iteration < 150; iteration += 1) {
    const cooling = 1 - iteration / 180;
    nodes.forEach((node) => {
      const current = positions[node.id] ?? [50, 50];
      const anchor = anchors[node.id] ?? current;
      const velocity = velocities[node.id];
      velocity[0] += (anchor[0] - current[0]) * .018 * cooling;
      velocity[1] += (anchor[1] - current[1]) * .032 * cooling;
    });

    links.forEach((link) => {
      const source = positions[link.source];
      const target = positions[link.target];
      if (!source || !target) return;
      const dx = target[0] - source[0];
      const dy = target[1] - source[1];
      const distancePx = Math.hypot(dx * scaleX, dy * scaleY) || 1;
      const targetDistance = link.flows?.includes("deploy") ? 310 : 255;
      const force = (distancePx - targetDistance) / targetDistance * .055 * cooling;
      const ux = dx * scaleX / distancePx;
      const uy = dy * scaleY / distancePx;
      velocities[link.source][0] += ux * force;
      velocities[link.source][1] += uy * force * .55;
      velocities[link.target][0] -= ux * force;
      velocities[link.target][1] -= uy * force * .55;
    });

    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const leftNode = nodes[leftIndex];
        const rightNode = nodes[rightIndex];
        const leftPoint = positions[leftNode.id];
        const rightPoint = positions[rightNode.id];
        if (!leftPoint || !rightPoint) continue;
        let dx = rightPoint[0] - leftPoint[0];
        let dy = rightPoint[1] - leftPoint[1];
        if (Math.abs(dx) < .01 && Math.abs(dy) < .01) dx = (rightIndex - leftIndex) * .03;
        const px = dx * scaleX;
        const py = dy * scaleY;
        const distance = Math.max(1, Math.hypot(px, py));
        const repulsion = Math.min(.12, 15000 / (distance * distance) * .012) * cooling;
        const ux = px / distance;
        const uy = py / distance;
        velocities[leftNode.id][0] -= ux * repulsion;
        velocities[leftNode.id][1] -= uy * repulsion;
        velocities[rightNode.id][0] += ux * repulsion;
        velocities[rightNode.id][1] += uy * repulsion;

        if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
          const overlapX = minDx - Math.abs(dx);
          const overlapY = minDy - Math.abs(dy);
          if (overlapX < overlapY) {
            const direction = dx >= 0 ? 1 : -1;
            const push = overlapX * .11 * cooling;
            velocities[leftNode.id][0] -= direction * push;
            velocities[rightNode.id][0] += direction * push;
          } else {
            const direction = dy >= 0 ? 1 : -1;
            const push = overlapY * .11 * cooling;
            velocities[leftNode.id][1] -= direction * push;
            velocities[rightNode.id][1] += direction * push;
          }
        }
      }
    }

    nodes.forEach((node) => {
      const velocity = velocities[node.id];
      velocity[0] *= .72;
      velocity[1] *= .72;
      const current = positions[node.id] ?? [50, 50];
      positions[node.id] = clampNode(node, [current[0] + velocity[0], current[1] + velocity[1]]);
    });
  }

  return positions;
}

const AUTO_POSITIONS = Object.freeze({
  visitor: [12, 14], browser: [34, 14], edge: [58, 14], react: [82, 14],
  frontRepo: [27, 30], frontCi: [69, 30],
  security: [14, 48], api: [38, 48], services: [62, 48], monitor: [84, 48],
  cache: [14, 64], postgres: [38, 64], cloudinary: [64, 64], translate: [86, 64],
  outbox: [32, 79], jobs: [68, 79],
  backRepo: [18, 92], backCi: [49, 92], docker: [80, 92],
});

const COMPACT_IDS = new Set(["browser", "react", "api", "cache", "postgres", "outbox", "jobs"]);
const COMPACT_POSITIONS = Object.freeze({
  browser: [9, 46], react: [25, 46], api: [44, 46], cache: [65, 24],
  postgres: [65, 70], outbox: [82, 70], jobs: [94, 70],
});

const COMPACT_LINKS = Object.freeze([
  { source: "browser", target: "react", channel: "DOM", flows: ["request"], active: true, activity: 1 },
  { source: "react", target: "api", channel: "HTTPS / JSON", flows: ["request"], active: true, activity: .8 },
  { source: "api", target: "cache", channel: "cache lookup", flows: ["request"], active: true, activity: .6 },
  { source: "api", target: "postgres", channel: "JDBC", flows: ["request"], active: true, activity: .7 },
  { source: "postgres", target: "outbox", channel: "transaction", flows: ["publish"], active: true, activity: .5 },
  { source: "outbox", target: "jobs", channel: "dispatch", flows: ["publish"], active: true, activity: .4 },
]);


const CANVAS_SHADES = Object.freeze([
  { id: "slate", label: "Ardoise", a: "#66717c", b: "#545f6a", grid: "rgba(244, 248, 250, .13)" },
  { id: "steel", label: "Acier", a: "#63788a", b: "#536879", grid: "rgba(237, 247, 252, .13)" },
  { id: "sage", label: "Sauge", a: "#6f7d75", b: "#5c6b63", grid: "rgba(242, 248, 242, .13)" },
  { id: "lavender", label: "Lavande", a: "#746f82", b: "#625d70", grid: "rgba(248, 244, 252, .13)" },
  { id: "mist", label: "Brume", a: "#788087", b: "#656e75", grid: "rgba(250, 250, 250, .13)" },
  { id: "sand", label: "Sable froid", a: "#7d786f", b: "#69645d", grid: "rgba(251, 247, 239, .13)" },
]);


const SCOPES = Object.freeze([
  { id: "all", label: "Vue complète" },
  { id: "request", label: "Requête web" },
  { id: "publish", label: "Publication" },
  { id: "deploy", label: "Déploiement" },
]);

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute vec4 a_color;
  varying vec4 v_color;
  void main(){gl_Position=vec4(a_position,0.0,1.0);gl_PointSize=a_size;v_color=a_color;}
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec4 v_color;
  void main(){vec2 p=gl_PointCoord-vec2(.5);float a=smoothstep(.5,.08,length(p))*v_color.a;gl_FragColor=vec4(v_color.rgb,a);}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function isHealthy(status) {
  return ["active", "healthy", "online", "operational", "ready", "running", "local"].includes(String(status).toLowerCase());
}

function statusLabel(status) {
  if (isHealthy(status)) return status === "local" ? "local" : "mesuré";
  if (status === "configured") return "configuré";
  if (status === "idle") return "au repos";
  return status === "degraded" ? "dégradé" : "en attente";
}

function nodeActivity(node, sample) {
  if (Number.isFinite(Number(node.activity))) return Number(node.activity);
  if (["visitor", "browser", "react", "edge"].includes(node.id)) return Math.min(1, Number(sample?.fps || 0) / 60);
  if (node.status === "configured") return .28;
  return isHealthy(node.status) ? .78 : .08;
}

function clampPercent(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : fallback;
}

function telemetryFor(node, snapshot, sample) {
  const cache = snapshot?.caches?.[0];
  const cacheReads = Number(cache?.hits || 0) + Number(cache?.misses || 0);
  const queues = {
    jobs: Number(snapshot?.jobs?.QUEUED || 0) + Number(snapshot?.jobs?.RUNNING || 0) + Number(snapshot?.jobs?.RETRYING || 0),
    outbox: Number(snapshot?.outbox?.PENDING || 0) + Number(snapshot?.outbox?.PROCESSING || 0),
  };
  const configurations = {
    visitor: { saturation: sample?.uiThreadLoad, metric: `${clampPercent(sample?.uiThreadLoad).toFixed(0)} % thread UI`, throughput: Number(sample?.fps || 0), unit: "fps" },
    browser: { saturation: sample?.frameBudgetUsed, metric: `${Number(sample?.p95 || 0).toFixed(1)} ms rendu`, throughput: Number(sample?.fps || 0), unit: "fps" },
    react: { saturation: sample?.frameBudgetUsed, metric: `${Number(sample?.p95 || 0).toFixed(1)} ms p95`, throughput: Number(sample?.fps || 0), unit: "fps" },
    security: { saturation: sample?.systemCpu, metric: snapshot ? `${Number(sample?.apiLatency || 0).toFixed(0)} ms API` : "télémétrie requise", throughput: Number(sample?.apiRequestCount || 0), unit: "sondes" },
    api: { saturation: sample?.systemCpu, metric: snapshot ? `${clampPercent(sample?.systemCpu).toFixed(0)} % CPU` : "API en attente", throughput: Number(sample?.apiRequestCount || 0), unit: "sondes" },
    services: { saturation: sample?.processCpu, metric: snapshot ? `${clampPercent(sample?.processCpu).toFixed(0)} % Java` : "API en attente", throughput: Number(sample?.apiRequestCount || 0), unit: "sondes" },
    cache: { saturation: cache ? (1 - Number(cache.hitRate || 0)) * 100 : 0, metric: cache ? `${(Number(cache.hitRate || 0) * 100).toFixed(0)} % hit` : "sans mesure", throughput: cacheReads, unit: "lectures" },
    postgres: { saturation: Number(snapshot?.database?.latencyMs || 0) / 50 * 100, metric: snapshot?.database?.reachable ? `${snapshot.database.latencyMs} ms` : "connexion inconnue", throughput: snapshot?.database?.reachable ? 1 : 0, unit: "check" },
    outbox: { saturation: queues.outbox / 20 * 100, metric: `${queues.outbox} en attente`, throughput: Number(snapshot?.outbox?.DISPATCHED || 0), queue: queues.outbox, unit: "events" },
    jobs: { saturation: queues.jobs / 20 * 100, metric: `${queues.jobs} actifs`, throughput: Number(snapshot?.jobs?.SUCCEEDED || 0), queue: queues.jobs, unit: "jobs" },
    monitor: { saturation: sample?.systemMemoryPercent, metric: snapshot ? `${clampPercent(sample?.systemMemoryPercent).toFixed(0)} % RAM` : "sans signal", throughput: 1, unit: "snapshot" },
  };
  const result = configurations[node.id] ?? { saturation: node.status === "degraded" ? 86 : 0, metric: node.status === "configured" ? "configuré" : "signal discret", throughput: 0, unit: "ops" };
  const saturation = clampPercent(result.saturation);
  return { ...result, saturation, heat: saturation >= 85 ? "critical" : saturation >= 65 ? "pressure" : saturation >= 38 ? "watch" : isHealthy(node.status) ? "healthy" : "unknown" };
}

function rawNodes(snapshot) {
  if (Array.isArray(snapshot?.architecture)) return snapshot.architecture;
  if (Array.isArray(snapshot?.architecture?.nodes)) return snapshot.architecture.nodes;
  return [];
}

function rawLinks(snapshot) {
  if (Array.isArray(snapshot?.links)) return snapshot.links;
  if (Array.isArray(snapshot?.architecture?.links)) return snapshot.architecture.links;
  return [];
}

function normalizeGraph(snapshot) {
  const connected = Boolean(snapshot);
  const backendNodes = new Map(rawNodes(snapshot).map((node) => [String(node.id), node]));
  const nodes = NODES.map((node) => {
    const received = backendNodes.get(node.id);
    if (received) return { ...node, ...received, id: node.id, role: node.role, detail: node.detail };
    if (connected && ["security", "services", "monitor"].includes(node.id)) return { ...node, status: "operational", activity: .72 };
    return node;
  });
  const receivedLinks = rawLinks(snapshot);
  const cacheTraffic = (snapshot?.caches ?? []).reduce((total, cache) => total + Number(cache.hits || 0) + Number(cache.misses || 0), 0);
  const activeJobs = Number(snapshot?.jobs?.QUEUED || 0) + Number(snapshot?.jobs?.RUNNING || 0) + Number(snapshot?.jobs?.RETRYING || 0);
  const activeOutbox = Number(snapshot?.outbox?.PENDING || 0) + Number(snapshot?.outbox?.PROCESSING || 0);
  const measuredLink = (link) => {
    const key = `${link.source}:${link.target}`;
    if (["react:security", "security:api", "api:services", "api:monitor"].includes(key)) return connected;
    if (key === "services:cache") return cacheTraffic > 0;
    if (["services:postgres", "postgres:monitor"].includes(key)) return Boolean(snapshot?.database?.reachable);
    if (key === "services:outbox") return activeOutbox > 0;
    if (key === "outbox:jobs") return activeJobs + activeOutbox > 0;
    return Boolean(link.active);
  };
  const links = LINKS.map((link) => {
    const received = receivedLinks.find((item) => String(item.source) === link.source && String(item.target) === link.target);
    return {
      ...link,
      ...(received ?? {}),
      flows: link.flows,
      active: received?.active ?? measuredLink(link),
      activity: received?.activity ?? (measuredLink(link) ? .72 : .2),
    };
  });
  return { nodes, links, connected };
}

function toClip([x, y]) {
  return [x / 50 - 1, 1 - y / 50];
}

function ArchitectureCanvas({ nodes, links, positions, sample, onStatus, showParticles = true, paintStyle }) {
  const canvasRef = useRef(null);
  const dataRef = useRef({ nodes, links, positions, sample, showParticles });

  useEffect(() => { dataRef.current = { nodes, links, positions, sample, showParticles }; }, [links, nodes, positions, sample, showParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext?.("webgl", { alpha: true, antialias: false, depth: false, powerPreference: "low-power" });
    if (!gl) { onStatus?.("fallback"); return undefined; }
    const program = createProgram(gl);
    if (!program) { onStatus?.("fallback"); return undefined; }
    onStatus?.("active");
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const sizeLocation = gl.getAttribLocation(program, "a_size");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const buffer = gl.createBuffer();
    const gpuTimer = createGpuTimerQuery(gl, "architecture-graph");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let frame = 0;
    let visible = true;
    let lastPaint = 0;

    const render = (time = 0) => {
      frame = 0;
      if (!visible) return;
      if (!reduced && time - lastPaint < 33) { frame = requestAnimationFrame(render); return; }
      lastPaint = time;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gpuTimer?.begin();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const vertices = [];
      const current = dataRef.current;
      current.links.forEach((link, linkIndex) => {
        if (!link.active || !current.showParticles) return;
        const start = toClip(current.positions[link.source] ?? [50, 50]);
        const end = toClip(current.positions[link.target] ?? [50, 50]);
        const strength = Math.max(.2, Number(link.activity || .6));
        const count = reduced ? 1 : 4;
        for (let index = 0; index < count; index += 1) {
          const progress = reduced ? .5 : ((time * (.00012 + strength * .00012) + index / count + linkIndex * .09) % 1);
          const x = start[0] + (end[0] - start[0]) * progress;
          const y = start[1] + (end[1] - start[1]) * progress;
          vertices.push(x, y, 8, .18, .88, .77, .9, x, y, 22, .48, .31, .98, .16);
        }
      });
      current.nodes.forEach((node) => {
        const [x, y] = toClip(current.positions[node.id] ?? [50, 50]);
        const activity = nodeActivity(node, current.sample);
        vertices.push(x, y, 35 + activity * 32, .18, .88, .77, .05 + activity * .1);
      });
      if (vertices.length > 0) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
        const stride = 7 * Float32Array.BYTES_PER_ELEMENT;
        gl.enableVertexAttribArray(positionLocation);
        gl.enableVertexAttribArray(sizeLocation);
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.drawArrays(gl.POINTS, 0, vertices.length / 7);
      }
      gpuTimer?.end();
      if (!reduced) frame = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible && !frame) frame = requestAnimationFrame(render);
    });
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !frame) frame = requestAnimationFrame(render);
    };
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gpuTimer?.destroy();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext?.();
    };
  }, [onStatus]);

  return <canvas ref={canvasRef} className="architecture-webgl" aria-hidden="true" style={paintStyle} />;
}

const TRACE_EDGES = new Set([
  "visitor:browser", "browser:edge", "edge:react", "react:security",
  "security:api", "api:services", "services:cache", "services:postgres", "api:monitor",
]);

const GRAPH_LAYOUTS = Object.freeze([
  { id: "architecture", label: "Architecture", description: "Répartit le graphe par couches techniques et communautés, puis réduit les croisements avant de figer les positions." },
  { id: "flow", label: "Flux", description: "Ordonne les composants de gauche à droite selon la profondeur du chemin de requête." },
  { id: "communities", label: "Communautés", description: "Regroupe fortement frontend et backend afin de rendre les dépendances entre sous-systèmes immédiatement visibles." },
  { id: "radial", label: "Radial", description: "Place le composant le plus connecté au centre et distribue les autres autour de lui." },
  { id: "deployment", label: "Déploiement", description: "Met en avant les deux chaînes GitHub → CI → hébergement et leur raccordement au runtime." },
  { id: "compact", label: "Compact", description: "Cherche à faire tenir l’ensemble de la topologie dans le minimum d’espace vertical." },
]);

const DENSITIES = Object.freeze([
  { id: "simple", label: "Simple" },
  { id: "standard", label: "Standard" },
  { id: "expert", label: "Expert" },
]);

function edgeKey(link) { return `${link.source}:${link.target}`; }

function shortestPath(start, end, links, { directed = true } = {}) {
  if (!start || !end || start === end) return start && end ? { nodes: [start], edges: [] } : null;
  const adjacency = new Map();
  const add = (from, to, link) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push({ to, link });
  };
  links.forEach((link) => {
    add(link.source, link.target, link);
    if (!directed) add(link.target, link.source, link);
  });
  const queue = [start];
  const previous = new Map([[start, null]]);
  const previousLink = new Map();
  while (queue.length) {
    const current = queue.shift();
    for (const step of adjacency.get(current) ?? []) {
      if (previous.has(step.to)) continue;
      previous.set(step.to, current);
      previousLink.set(step.to, step.link);
      if (step.to === end) {
        const nodes = [end];
        const edges = [];
        let cursor = end;
        while (cursor !== start) {
          const link = previousLink.get(cursor);
          if (link) edges.unshift(link);
          cursor = previous.get(cursor);
          nodes.unshift(cursor);
        }
        return { nodes, edges };
      }
      queue.push(step.to);
    }
  }
  return null;
}

function resolvePath(start, end, links) {
  return shortestPath(start, end, links, { directed: true }) ?? shortestPath(start, end, links, { directed: false });
}

function edgeReason(link) {
  const reasons = {
    "visitor:browser": "Le visiteur déclenche la navigation et les événements d’interface dans le navigateur.",
    "browser:edge": "Le navigateur récupère le frontend et ses ressources depuis l’edge Cloudflare en HTTPS.",
    "edge:react": "Cloudflare livre les assets générés par Vite qui démarrent le runtime React.",
    "react:security": "React appelle l’API ; la requête entre d’abord dans la chaîne Spring Security.",
    "security:api": "Après les filtres HTTP/CORS/authentification, la requête est remise au contrôleur Spring MVC.",
    "api:services": "Le contrôleur délègue la logique fonctionnelle aux services métier.",
    "services:cache": "Le service consulte le cache de lecture avant ou autour d’un accès persistant.",
    "services:postgres": "Les données persistantes sont lues ou écrites via JPA, Hibernate puis JDBC.",
    "services:cloudinary": "Le service délègue les opérations média au fournisseur Cloudinary.",
    "services:translate": "Les workflows de traduction appellent le service LibreTranslate via HTTP.",
    "services:outbox": "La publication fiable d’événements est inscrite dans l’outbox dans la transaction métier.",
    "outbox:jobs": "Les événements prêts sont repris par le traitement asynchrone et son mécanisme de retry.",
    "api:monitor": "L’endpoint Engineering agrège les signaux JVM, base, caches et files.",
    "postgres:monitor": "La télémétrie corrèle la disponibilité PostgreSQL et sa latence avec le snapshot serveur.",
    "frontRepo:frontCi": "Un push frontend déclenche les contrôles et le build de la chaîne CI.",
    "frontCi:edge": "Le build Vite validé est publié vers Cloudflare Pages.",
    "backRepo:backCi": "Un push backend déclenche tests Maven et construction de l’artefact serveur.",
    "backCi:docker": "La CI produit l’image Docker destinée au runtime Render.",
    "docker:api": "Render exécute l’image et expose l’API Spring Boot déployée.",
  };
  return reasons[edgeKey(link)] ?? `Cette liaison représente le canal ${link.channel} entre ${link.source} et ${link.target}.`;
}

function bundledPath(start, end, bundled) {
  if (!bundled) {
    const middle = (start[0] + end[0]) / 2;
    return Math.abs(start[1] - end[1]) > 4
      ? `M ${start[0]} ${start[1]} C ${middle} ${start[1]}, ${middle} ${end[1]}, ${end[0]} ${end[1]}`
      : `M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`;
  }
  const direction = Math.sign(end[0] - start[0]) || 1;
  const lead = Math.min(8, Math.max(3.5, Math.abs(end[0] - start[0]) * .22));
  const startBus = start[0] + direction * lead;
  const endBus = end[0] - direction * lead;
  const middle = (startBus + endBus) / 2;
  return `M ${start[0]} ${start[1]} L ${startBus} ${start[1]} C ${middle} ${start[1]}, ${middle} ${end[1]}, ${endBus} ${end[1]} L ${end[0]} ${end[1]}`;
}

function GraphLinks({ links, positions, compact, activeTrace = null, scope = "all", highlightedEdges = new Set(), bundleEdges = true, renderMode = "architecture" }) {
  const gradientId = compact ? "graph-flow-compact" : "graph-flow-full";
  const flowColor = { request: "#51e1c1", publish: "#b196ff", deploy: "#55bdf0" };
  return (
    <svg className="architecture-link-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1"><stop offset="0" stopColor="#7567f7" /><stop offset="1" stopColor="#2dd4bf" /></linearGradient>
        {Object.entries(flowColor).map(([flow, color]) => <marker key={flow} id={`${gradientId}-arrow-${flow}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill={color} /></marker>)}
      </defs>
      {links.map((link, index) => {
        const start = positions[link.source] ?? [50, 50];
        const end = positions[link.target] ?? [50, 50];
        const path = bundledPath(start, end, bundleEdges && !compact);
        const flow = scope !== "all" && link.flows?.includes(scope) ? scope : (link.flows?.[0] ?? "request");
        const key = edgeKey(link);
        const traced = Boolean(activeTrace) && link.active && TRACE_EDGES.has(key);
        const highlighted = highlightedEdges.has(key);
        const runtimeDimmed = renderMode === "runtime" && !link.active;
        return (
          <g key={`${link.source}-${link.target}-${index}`} className={`${link.active ? "is-active" : "is-configured"} flow-${flow}${traced ? " is-traced" : ""}${highlighted ? " is-path-highlighted" : ""}${runtimeDimmed ? " is-runtime-dimmed" : ""}`}>
            <title>{link.channel}</title>
            <path className="architecture-link-base" d={path} markerEnd={`url(#${gradientId}-arrow-${flow})`} />
            {link.active && <path className="architecture-link-pulse" d={path} />}
          </g>
        );
      })}
    </svg>
  );
}

export default function ArchitectureObservatory({ snapshot, liveSample, activeTrace = null, compact = false }) {
  const normalized = useMemo(() => normalizeGraph(snapshot), [snapshot]);
  const basePositions = compact ? COMPACT_POSITIONS : AUTO_POSITIONS;
  const [positions, setPositions] = useState(() => ({ ...basePositions }));
  const [scope, setScope] = useState("all");
  const [canvasShade, setCanvasShade] = useState("sage");
  const [selectedId, setSelectedId] = useState(compact ? "api" : null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [webglStatus, setWebglStatus] = useState("checking");
  const [layoutId, setLayoutId] = useState("architecture");
  const [layoutStats, setLayoutStats] = useState({ state: "prêt", durationMs: 0, source: "initial" });
  const [renderMode, setRenderMode] = useState("architecture");
  const [density, setDensity] = useState("standard");
  const [semanticZoom, setSemanticZoom] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showCommunities, setShowCommunities] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [bundleEdges, setBundleEdges] = useState(true);
  const [showLayoutHelp, setShowLayoutHelp] = useState(false);
  const [search, setSearch] = useState("");
  const [focusId, setFocusId] = useState(null);
  const [pathStartId, setPathStartId] = useState(null);
  const [pathEndId, setPathEndId] = useState(null);
  const scrollRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const positionsRef = useRef({ ...basePositions });
  const layoutWorkerRef = useRef(null);
  const layoutCacheRef = useRef(new Map());
  const animationFrameRef = useRef(0);

  const nodes = useMemo(() => compact ? normalized.nodes.filter((node) => COMPACT_IDS.has(node.id)) : normalized.nodes, [compact, normalized.nodes]);
  const scopeLinks = useMemo(() => {
    const links = compact ? COMPACT_LINKS : normalized.links;
    return scope === "all" || compact ? links : links.filter((link) => link.flows.includes(scope));
  }, [compact, normalized.links, scope]);
  const activeNodeIds = useMemo(() => new Set(scopeLinks.flatMap((link) => [link.source, link.target])), [scopeLinks]);
  const runtimeNodeIds = useMemo(() => new Set(scopeLinks.filter((link) => link.active).flatMap((link) => [link.source, link.target])), [scopeLinks]);
  const selectedNode = selectedId ? (nodes.find((node) => node.id === selectedId) ?? null) : null;
  const activeLinks = scopeLinks.filter((link) => link.active).length;
  const palette = CANVAS_SHADES.find((item) => item.id === canvasShade) ?? CANVAS_SHADES.find((item) => item.id === "sage") ?? CANVAS_SHADES[0];
  const scopeLabel = SCOPES.find((item) => item.id === scope)?.label ?? "Vue complète";
  const layoutDefinition = GRAPH_LAYOUTS.find((item) => item.id === layoutId) ?? GRAPH_LAYOUTS[0];
  const graphDegrees = useMemo(() => {
    const degree = Object.fromEntries(nodes.map((node) => [node.id, { in: 0, out: 0 }]));
    scopeLinks.forEach((link) => {
      if (degree[link.source]) degree[link.source].out += 1;
      if (degree[link.target]) degree[link.target].in += 1;
    });
    return degree;
  }, [nodes, scopeLinks]);
  const pathResult = useMemo(() => resolvePath(pathStartId, pathEndId, scopeLinks), [pathEndId, pathStartId, scopeLinks]);
  const highlightedEdges = useMemo(() => new Set(pathResult?.edges?.map(edgeKey) ?? []), [pathResult]);
  const pathNodeIds = useMemo(() => new Set(pathResult?.nodes ?? []), [pathResult]);
  const focusNodeIds = useMemo(() => {
    if (!focusId) return null;
    const ids = new Set([focusId]);
    scopeLinks.forEach((link) => {
      if (link.source === focusId) ids.add(link.target);
      if (link.target === focusId) ids.add(link.source);
    });
    const fromVisitor = resolvePath("visitor", focusId, scopeLinks);
    fromVisitor?.nodes?.forEach((id) => ids.add(id));
    return ids;
  }, [focusId, scopeLinks]);
  const searchNodeIds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;
    return new Set(nodes.filter((node) => `${node.technology} ${node.role} ${node.layer} ${node.community}`.toLowerCase().includes(query)).map((node) => node.id));
  }, [nodes, search]);
  const effectiveDensity = semanticZoom ? (zoom < .92 ? "simple" : zoom > 1.08 ? "expert" : density) : density;

  const canvasBackground = `linear-gradient(${showGrid ? palette.grid : "transparent"} 1px, transparent 1px), linear-gradient(90deg, ${showGrid ? palette.grid : "transparent"} 1px, transparent 1px), radial-gradient(circle at 20% 20%, ${palette.a}aa, transparent 36%), radial-gradient(circle at 78% 68%, ${palette.a}77, transparent 34%), linear-gradient(145deg, ${palette.a}, ${palette.b})`;
  const canvasStyle = {
    "--canvas-a": palette.a,
    "--canvas-b": palette.b,
    "--canvas-grid": palette.grid,
    "--canvas-background": canvasBackground,
    "--graph-zoom": zoom,
    "--graph-grid-size": `${Math.round(34 * zoom)}px`,
    backgroundColor: palette.b,
    backgroundImage: canvasBackground,
  };

  // V28: same canvas model as V20. The graph background belongs directly to
  // the stage; there is no full-size intermediary surface that can mask it.

  useEffect(() => { positionsRef.current = positions; }, [positions]);

  const animateToPositions = useCallback((target, duration = 430) => {
    cancelAnimationFrame(animationFrameRef.current);
    const source = { ...positionsRef.current };
    const startedAt = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const k = ease(t);
      const next = {};
      Object.keys(target).forEach((id) => {
        const from = source[id] ?? target[id];
        next[id] = [from[0] + (target[id][0] - from[0]) * k, from[1] + (target[id][1] - from[1]) * k];
      });
      positionsRef.current = next;
      setPositions(next);
      if (t < 1) animationFrameRef.current = requestAnimationFrame(frame);
    };
    animationFrameRef.current = requestAnimationFrame(frame);
  }, []);

  const requestLayout = useCallback((nextLayout = layoutId, force = false) => {
    if (compact) {
      setPositions({ ...COMPACT_POSITIONS });
      return;
    }
    setLayoutId(nextLayout);
    const rect = stageRef.current?.getBoundingClientRect();
    const width = rect?.width || 1440;
    const height = rect?.height || 1580;
    const widthBucket = Math.round(width / 160);
    const cacheKey = `${scope}:${nextLayout}:${widthBucket}`;
    const cached = !force ? layoutCacheRef.current.get(cacheKey) : null;
    if (cached) {
      animateToPositions(cached, 360);
      setLayoutStats({ state: "figé", durationMs: 0, source: "cache" });
      return;
    }
    layoutWorkerRef.current?.terminate?.();
    if (typeof Worker === "undefined") {
      const fallback = computeArchitectureLayout(NODES, scopeLinks, { width, height });
      layoutCacheRef.current.set(cacheKey, fallback);
      animateToPositions(fallback);
      setLayoutStats({ state: "figé", durationMs: 0, source: "fallback" });
      return;
    }
    setLayoutStats({ state: "calcul", durationMs: 0, source: "worker" });
    const worker = new Worker(new URL("../../engineering/architectureForceAtlas.worker.js", import.meta.url), { type: "module" });
    layoutWorkerRef.current = worker;
    worker.onmessage = ({ data }) => {
      if (data?.type !== "result" || !data.positions) return;
      layoutCacheRef.current.set(cacheKey, data.positions);
      animateToPositions(data.positions, 470);
      setLayoutStats({ state: "figé", durationMs: Number(data.meta?.durationMs || 0), source: "calcul" });
      worker.terminate();
      if (layoutWorkerRef.current === worker) layoutWorkerRef.current = null;
    };
    worker.onerror = () => {
      const fallback = computeArchitectureLayout(NODES, scopeLinks, { width, height });
      layoutCacheRef.current.set(cacheKey, fallback);
      animateToPositions(fallback);
      setLayoutStats({ state: "figé", durationMs: 0, source: "fallback" });
      worker.terminate();
      if (layoutWorkerRef.current === worker) layoutWorkerRef.current = null;
    };
    worker.postMessage({
      type: "compute",
      layout: nextLayout,
      nodes: nodes.map(({ id, community, layer }) => ({ id, community, layer })),
      links: scopeLinks,
      width,
      height,
    });
  }, [animateToPositions, compact, layoutId, nodes, scope, scopeLinks]);

  useEffect(() => {
    if (compact) return undefined;
    const frame = requestAnimationFrame(() => requestLayout(layoutId));
    return () => cancelAnimationFrame(frame);
    // Layout is recomputed only after an explicit graph-scope change, never on telemetry polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, scope]);

  useEffect(() => () => {
    cancelAnimationFrame(animationFrameRef.current);
    layoutWorkerRef.current?.terminate?.();
  }, []);

  useEffect(() => {
    if (!selectedId || compact) return undefined;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      const remaining = Math.max(0, 10 - Math.floor((Date.now() - startedAt) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        setSelectedId(null);
        window.clearInterval(intervalId);
      }
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [compact, selectedId]);

  useEffect(() => {
    if ((!selectedId && !selectedEdge) || compact) return undefined;
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedId(null);
        setSelectedEdge(null);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [compact, selectedEdge, selectedId]);

  const moveNode = useCallback((id, clientX, clientY) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return;
    const candidate = [
      Math.max(8, Math.min(92, (clientX - rect.left) / rect.width * 100)),
      Math.max(4, Math.min(96, (clientY - rect.top) / rect.height * 100)),
    ];
    positionsRef.current = { ...positionsRef.current, [id]: candidate };
    setPositions(positionsRef.current);
  }, []);

  const onPointerDown = (event, id) => {
    dragRef.current = { id, x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event, id) => {
    if (dragRef.current?.id === id) {
      if (Math.hypot(event.clientX - dragRef.current.x, event.clientY - dragRef.current.y) > 5) dragRef.current.moved = true;
      moveNode(id, event.clientX, event.clientY);
    }
  };
  const stopDragging = (event) => {
    const drag = dragRef.current;
    if (drag && !drag.moved) {
      setCountdown(10);
      setSelectedEdge(null);
      setSelectedId(drag.id);
    }
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  const onNodeKeyDown = (event, id) => {
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      setCountdown(10);
      setSelectedEdge(null);
      setSelectedId(id);
      return;
    }
    const delta = event.shiftKey ? 4 : 1;
    const direction = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const point = positionsRef.current[id] ?? [50, 50];
    const next = [Math.max(8, Math.min(92, point[0] + direction[0])), Math.max(4, Math.min(96, point[1] + direction[1]))];
    positionsRef.current = { ...positionsRef.current, [id]: next };
    setPositions(positionsRef.current);
  };

  const choosePathPoint = (id) => {
    if (!pathStartId || (pathStartId && pathEndId)) {
      setPathStartId(id);
      setPathEndId(null);
    } else if (pathStartId === id) {
      setPathStartId(null);
      setPathEndId(null);
    } else {
      setPathEndId(id);
    }
  };

  const clearExploration = () => {
    setFocusId(null);
    setPathStartId(null);
    setPathEndId(null);
    setSearch("");
  };

  const nodeIsDimmed = (node) => {
    if (scope !== "all" && !compact && !activeNodeIds.has(node.id)) return true;
    if (renderMode === "runtime" && !runtimeNodeIds.has(node.id)) return true;
    if (pathResult && !pathNodeIds.has(node.id)) return true;
    if (!pathResult && focusNodeIds && !focusNodeIds.has(node.id)) return true;
    if (!pathResult && !focusNodeIds && searchNodeIds && !searchNodeIds.has(node.id)) return true;
    return false;
  };

  const selectedEdgeSource = selectedEdge ? nodes.find((node) => node.id === selectedEdge.source) : null;
  const selectedEdgeTarget = selectedEdge ? nodes.find((node) => node.id === selectedEdge.target) : null;

  return (
    <div className={`architecture-observatory${compact ? " is-compact" : ""} density-${effectiveDensity}`} aria-label="Graphe exploratoire de l’architecture réelle du portfolio">
      {!compact && <VisibilityGate item="architecture.system.toolbar"><div className="architecture-graph-toolbar architecture-graph-toolbar-v25">
        <div className="architecture-toolbar-primary">
          <div className="architecture-scope-tabs" role="group" aria-label="Choisir le flux architectural">
            {SCOPES.map((item) => <button type="button" key={item.id} className={scope === item.id ? "is-active" : ""} onClick={() => setScope(item.id)}>{item.label}</button>)}
          </div>
          <div className="architecture-runtime-switch" role="group" aria-label="Mode du graphe">
            <button type="button" className={renderMode === "architecture" ? "is-active" : ""} onClick={() => setRenderMode("architecture")}>Architecture</button>
            <button type="button" className={renderMode === "runtime" ? "is-active" : ""} onClick={() => setRenderMode("runtime")}>Runtime</button>
          </div>
          <div className="architecture-search">
            <label htmlFor="architecture-component-search">Composant</label>
            <input id="architecture-component-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="React, cache, PostgreSQL…" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche">×</button>}
          </div>
        </div>
        <div className="architecture-toolbar-secondary">
          <details className="architecture-menu">
            <summary>Disposition <b>{layoutDefinition.label}</b></summary>
            <div className="architecture-menu-panel architecture-layout-menu">
              <header><strong>Disposition du graphe</strong><small>Calcul ponctuel puis worker libéré.</small></header>
              {GRAPH_LAYOUTS.map((item) => <button type="button" key={item.id} className={layoutId === item.id ? "is-active" : ""} onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); requestLayout(item.id); }}><span>{item.label}</span><small>{item.description}</small></button>)}
              <div className="architecture-menu-footer"><button type="button" onClick={() => requestLayout(layoutId, true)}>↻ Recalculer</button><button type="button" onClick={() => { layoutCacheRef.current.clear(); requestLayout("architecture", true); }}>⌂ Réinitialiser</button></div>
            </div>
          </details>
          <details className="architecture-menu">
            <summary>Affichage <b>{effectiveDensity}</b></summary>
            <div className="architecture-menu-panel architecture-display-menu">
              <header><strong>Canvas & information</strong><small>Ces options ne relancent aucun calcul de layout.</small></header>
              <div className="architecture-display-grid">
                <label><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} /> Grille technique</label>
                <label><input type="checkbox" checked={showCommunities} onChange={(event) => setShowCommunities(event.target.checked)} /> Communautés</label>
                <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> Labels d’arêtes</label>
                <label><input type="checkbox" checked={showParticles} onChange={(event) => setShowParticles(event.target.checked)} /> Flux live</label>
                <label><input type="checkbox" checked={bundleEdges} onChange={(event) => setBundleEdges(event.target.checked)} /> Regrouper les arêtes</label>
                <label><input type="checkbox" checked={semanticZoom} onChange={(event) => setSemanticZoom(event.target.checked)} /> Zoom sémantique</label>
              </div>
              <div className="architecture-density-picker" role="group" aria-label="Densité d'information">
                <span>Densité</span>{DENSITIES.map((item) => <button type="button" key={item.id} className={density === item.id ? "is-active" : ""} onClick={() => setDensity(item.id)}>{item.label}</button>)}
              </div>
              <div className="architecture-canvas-shades" role="group" aria-label="Nuance du canevas">
                <span>Canvas</span>{CANVAS_SHADES.map((item) => <button type="button" key={item.id} className={canvasShade === item.id ? "is-active" : ""} onClick={() => setCanvasShade(item.id)} aria-label={`Canvas ${item.label}`} title={item.label}><i style={{ "--shade-a": item.a, "--shade-b": item.b }} /><b>{item.label}</b></button>)}
              </div>
            </div>
          </details>
          <div className="architecture-semantic-zoom">
            <button type="button" onClick={() => setZoom((value) => Math.max(.8, Number((value - .08).toFixed(2))))} aria-label="Réduire le zoom sémantique">−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.2, Number((value + .08).toFixed(2))))} aria-label="Augmenter le zoom sémantique">+</button>
          </div>
          <button type="button" className="architecture-explain-button" onClick={() => setShowLayoutHelp((value) => !value)}>? Comprendre</button>
        </div>
        <div className="architecture-graph-statusline">
          <span><i />{activeLinks}/{scopeLinks.length} liens actifs</span>
          <span>{webglStatus === "active" ? "flux WebGL" : "flux SVG"}</span>
          <span className={`architecture-layout-status is-${layoutStats.state === "calcul" ? "moving" : "stable"}`}>{layoutStats.state === "calcul" ? "calcul de disposition…" : `${layoutDefinition.label} · figé · CPU layout libéré`}{layoutStats.durationMs > 0 ? ` · ${layoutStats.durationMs.toFixed(0)} ms` : ""}</span>
          {(focusId || pathStartId || search) && <button type="button" className="architecture-clear-focus" onClick={clearExploration}>Effacer exploration</button>}
        </div>
      </div></VisibilityGate>}

      {!compact && showLayoutHelp && <div className="architecture-layout-explainer"><strong>{layoutDefinition.label}</strong><p>{layoutDefinition.description} Après le calcul, les positions sont mises en cache et le Web Worker est détruit : seules les interactions, le rendu des flux et les données live restent actives.</p></div>}

      {!compact && (pathStartId || focusId) && <div className="architecture-focus-bar" aria-live="polite">
        {pathStartId && !pathEndId && <><span>Chemin</span><strong>{nodes.find((node) => node.id === pathStartId)?.technology} → choisissez une arrivée</strong></>}
        {pathResult && <><span>Chemin calculé</span><strong>{pathResult.nodes.map((id) => nodes.find((node) => node.id === id)?.technology ?? id).join(" → ")}</strong><b>{pathResult.edges.length} transition{pathResult.edges.length > 1 ? "s" : ""}</b></>}
        {pathStartId && pathEndId && !pathResult && <><span>Chemin</span><strong>Aucun chemin dans la vue {scopeLabel.toLowerCase()}</strong></>}
        {!pathStartId && focusId && <><span>Focus</span><strong>{nodes.find((node) => node.id === focusId)?.technology}</strong><b>{focusNodeIds?.size ?? 1} composants reliés</b></>}
      </div>}

      {!compact && <div className="architecture-heat-legend" aria-label="Légende de saturation"><span className="is-healthy">Sain</span><span className="is-watch">Surveillance</span><span className="is-pressure">Pression</span><span className="is-critical">Saturé</span><span className="is-unknown">Inconnu</span><b>particules = débit · points = file</b></div>}

      <VisibilityGate item="architecture.system.graph"><div id="architecture-system-canvas" ref={scrollRef} className={`architecture-scroll${showGrid ? " has-grid" : " no-grid"}`} data-canvas-shade={canvasShade} style={{ "--canvas-b": palette.b }}>
        <div id="architecture-system-stage" className="architecture-stage" data-canvas-shade={canvasShade} ref={stageRef} style={canvasStyle}>
          {!compact && showCommunities && <div className="architecture-community-layer" aria-hidden="true">
            <div className="architecture-community is-front"><span>COMMUNAUTÉ FRONTEND</span><strong>professional_website_front</strong><small>React · Vite · Cloudflare · CI frontend</small></div>
            <div className="architecture-community is-back"><span>COMMUNAUTÉ BACKEND</span><strong>professional_website</strong><small>Spring Boot · PostgreSQL · jobs · Docker / Render</small></div>
          </div>}
          {!compact && showCommunities && <div className="architecture-layer-labels" aria-hidden="true"><span>Exécution client</span><span>Application serveur</span><span>Données & asynchrone</span><span>Livraison backend</span></div>}
          <GraphLinks links={scopeLinks} positions={positions} compact={compact} activeTrace={activeTrace} scope={scope} highlightedEdges={highlightedEdges} bundleEdges={bundleEdges} renderMode={renderMode} />
          {!compact && showLabels && <div className="architecture-edge-label-layer">{scopeLinks.map((link, index) => {
            const start = positions[link.source] ?? [50, 50];
            const end = positions[link.target] ?? [50, 50];
            const flow = scope !== "all" && link.flows?.includes(scope) ? scope : (link.flows?.[0] ?? "request");
            const highlighted = highlightedEdges.has(edgeKey(link));
            const runtimeDimmed = renderMode === "runtime" && !link.active;
            return <button type="button" key={`${link.source}-${link.target}-${index}`} className={`flow-${flow}${link.active ? " is-active" : ""}${highlighted ? " is-path-highlighted" : ""}${runtimeDimmed ? " is-runtime-dimmed" : ""}`} style={{ left: `${(start[0] + end[0]) / 2}%`, top: `${(start[1] + end[1]) / 2}%` }} onClick={() => { setSelectedId(null); setSelectedEdge(link); }}>{link.channel}</button>;
          })}</div>}
          <ArchitectureCanvas nodes={nodes} links={scopeLinks} positions={positions} sample={liveSample} onStatus={setWebglStatus} showParticles={showParticles} paintStyle={canvasStyle} />
          <div className="architecture-node-layer">
            {nodes.map((node) => {
              const telemetry = telemetryFor(node, snapshot, liveSample);
              const degree = graphDegrees[node.id] ?? { in: 0, out: 0 };
              const dimmed = nodeIsDimmed(node);
              const isPathNode = pathNodeIds.has(node.id);
              const isFocus = focusId === node.id;
              return (
                <button
                  type="button"
                  className={`architecture-node community-${node.community ?? "neutral"} is-${String(node.status).toLowerCase()} heat-${telemetry.heat}${selectedId === node.id ? " is-selected" : ""}${dimmed ? " is-dimmed" : ""}${isPathNode ? " is-path-node" : ""}${isFocus ? " is-focus-node" : ""}`}
                  key={node.id}
                  data-node={node.id}
                  style={{ left: `${positions[node.id]?.[0] ?? 50}%`, top: `${positions[node.id]?.[1] ?? 50}%`, "--node-activity": nodeActivity(node, liveSample), "--node-scale": Math.min(1.18, 1 + (degree.in + degree.out) * .018) * (0.98 + (zoom - 1) * .22) }}
                  aria-label={`${node.technology}, ${node.role}. Déplacer le nœud`}
                  onPointerDown={(event) => onPointerDown(event, node.id)}
                  onPointerMove={(event) => onPointerMove(event, node.id)}
                  onPointerUp={stopDragging}
                  onPointerCancel={stopDragging}
                  onClick={() => {
                    if (dragRef.current?.moved) return;
                    setCountdown(10);
                    setSelectedEdge(null);
                    setSelectedId(node.id);
                  }}
                  onKeyDown={(event) => onNodeKeyDown(event, node.id)}
                >
                  <span className="architecture-node-symbol" aria-hidden="true">{node.technology.slice(0, 2).toUpperCase()}</span>
                  <span className="architecture-node-copy"><strong>{node.technology}</strong><small>{node.role}</small></span>
                  <em>{telemetry.heat === "unknown" ? statusLabel(node.status) : telemetry.heat}</em>
                  <span className="architecture-node-metric">{telemetry.metric}</span>
                  <span className="architecture-node-extra">Entrantes {degree.in} · Sortantes {degree.out} · {node.layer}</span>
                  <span className="architecture-node-load" aria-hidden="true"><i style={{ width: `${Math.max(4, telemetry.saturation)}%` }} /></span>
                  {telemetry.queue > 0 && <span className="architecture-node-queue" aria-label={`${telemetry.queue} éléments en attente`}>{Array.from({ length: Math.min(5, telemetry.queue) }, (_, index) => <i key={index} />)}<b>{telemetry.queue}</b></span>}
                </button>
              );
            })}
          </div>
        </div>
      </div></VisibilityGate>

      {!compact && selectedNode && (
        <div className="architecture-popup" role="dialog" aria-modal="false" aria-label={`Détails ${selectedNode.technology}`} aria-live="polite">
          <button type="button" className="architecture-popup-close" onClick={() => setSelectedId(null)} aria-label="Fermer la fiche">×</button>
          <span>{selectedNode.layer}</span>
          <h3>{selectedNode.technology}</h3>
          <p>{selectedNode.detail}</p>
          <dl>
            <div><dt>Rôle</dt><dd>{selectedNode.role}</dd></div>
            <div><dt>État</dt><dd>{statusLabel(selectedNode.status)}</dd></div>
            <div><dt>Pression</dt><dd>{telemetryFor(selectedNode, snapshot, liveSample).saturation.toFixed(0)} %</dd></div>
            <div><dt>Connexions</dt><dd>{(graphDegrees[selectedNode.id]?.in ?? 0) + (graphDegrees[selectedNode.id]?.out ?? 0)}</dd></div>
          </dl>
          <div className="architecture-popup-actions">
            <button type="button" className={focusId === selectedNode.id ? "is-active" : ""} onClick={() => setFocusId((value) => value === selectedNode.id ? null : selectedNode.id)}>{focusId === selectedNode.id ? "Quitter le focus" : "Focus"}</button>
            <button type="button" className={pathStartId === selectedNode.id || pathEndId === selectedNode.id ? "is-active" : ""} onClick={() => choosePathPoint(selectedNode.id)}>{!pathStartId || pathEndId ? "Départ chemin" : pathStartId === selectedNode.id ? "Annuler départ" : "Arrivée chemin"}</button>
          </div>
          <div className="architecture-popup-timer"><i style={{ "--countdown": countdown / 10 }} /><span>Fermeture dans <b>{countdown} s</b></span></div>
        </div>
      )}

      {!compact && selectedEdge && (
        <div className="architecture-popup architecture-edge-popup" role="dialog" aria-modal="false" aria-label={`Connexion ${selectedEdge.channel}`}>
          <button type="button" className="architecture-popup-close" onClick={() => setSelectedEdge(null)} aria-label="Fermer la fiche">×</button>
          <span>Connexion · {selectedEdge.flows?.join(" / ")}</span>
          <h3>{selectedEdgeSource?.technology ?? selectedEdge.source} → {selectedEdgeTarget?.technology ?? selectedEdge.target}</h3>
          <p>{edgeReason(selectedEdge)}</p>
          <dl>
            <div><dt>Canal</dt><dd>{selectedEdge.channel}</dd></div>
            <div><dt>État</dt><dd>{selectedEdge.active ? "observé / actif" : "configuré"}</dd></div>
            <div><dt>Source</dt><dd>{selectedEdgeSource?.role ?? selectedEdge.source}</dd></div>
            <div><dt>Destination</dt><dd>{selectedEdgeTarget?.role ?? selectedEdge.target}</dd></div>
          </dl>
        </div>
      )}

      {!compact && <VisibilityGate item="architecture.system.analysis"><ObservabilityGuide
        title="Analyse de la topologie"
        analysis={`${scopeLabel} : ${activeLinks} liaison${activeLinks > 1 ? "s" : ""} active${activeLinks > 1 ? "s" : ""} sur ${scopeLinks.length}. La disposition « ${layoutDefinition.label} » est calculée ponctuellement puis figée : elle ne consomme plus de CPU une fois les positions obtenues. ${renderMode === "runtime" ? "Le mode Runtime atténue les composants qui ne participent pas à l’activité actuellement observée." : "Le mode Architecture conserve la topologie complète, y compris les dépendances configurées mais momentanément inactives."} ${pathResult ? `Le chemin sélectionné traverse ${pathResult.nodes.length} composants et ${pathResult.edges.length} transitions.` : focusId ? `Le focus isole ${focusNodeIds?.size ?? 1} composants autour de ${nodes.find((node) => node.id === focusId)?.technology ?? focusId}.` : "Le graphe reste stable pour conserver une carte mentale du système ; les données live modifient uniquement l’état visuel et les flux."}`}
        note={`canvas ${palette.label.toLowerCase()} · ${layoutDefinition.label.toLowerCase()} · ${layoutStats.state}`}
      /></VisibilityGate>}
      {!normalized.connected && <p className="architecture-offline-note">Le plan de déploiement reste visible ; les états Spring, JVM et PostgreSQL s’allument dès que l’API répond.</p>}
    </div>
  );
}
