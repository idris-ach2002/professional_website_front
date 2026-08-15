import { useEffect, useMemo, useState } from "react";
import ObservabilityGuide from "./ObservabilityGuide";
import { VisibilityGate } from "../../visibility/ItemVisibilityContext";

const FEATURES = Object.freeze([
  { id: "mission", label: "GET /api/engineering/mission-control · état backend", kind: "network", service: "MissionControlService" },
  { id: "portfolio", label: "GET /website/default · portfolio public", kind: "network", service: "WebsiteService" },
  { id: "history", label: "GET /api/engineering/performance/history · historique profiler", kind: "network", service: "RuntimePerformanceHistoryService" },
  { id: "render", label: "requestAnimationFrame · boucle de rendu locale", kind: "local", service: "React / Three.js / WebGL" },
]);


function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function timing(trace, name) {
  return finite(trace?.serverTiming?.find((entry) => normalize(entry.name).includes(normalize(name)))?.durationMs, 0);
}

function observedByTrail(trace, ...needles) {
  const haystack = (trace?.componentTrail ?? []).map(normalize).join(" | ");
  return needles.some((needle) => haystack.includes(normalize(needle)));
}

function node(id, x, y, title, plugin, layer, status = "pending", detail = "", ms = 0) {
  return { id, x, y, title, plugin, layer, status, detail, ms };
}

function edge(source, target, label, status = "pending", kind = "call") {
  return { source, target, label, status, kind };
}

function clientIngress(trace) {
  const live = Boolean(trace?.id);
  return [
    node("ui-event", 36, 115, "UI event", "React event handler", "browser", live ? "observed" : "pending", trace?.operation ?? "action utilisateur"),
    node("fetch", 248, 115, "Fetch API", "window.fetch", "browser", live ? "observed" : "pending", trace?.method ? `${trace.method} ${trace.path}` : "construction requête"),
    node("resource-timing", 460, 115, "Resource Timing", "PerformanceResourceTiming", "browser", live ? "observed" : "pending", "DNS · connect · TTFB · download", finite(trace?.dnsMs) + finite(trace?.connectMs) + finite(trace?.ttfbMs) + finite(trace?.downloadMs)),
    node("internet", 672, 115, "Réseau HTTPS", "TLS + HTTP", "network", live ? "observed" : "pending", trace?.cacheStatus ? `cache: ${trace.cacheStatus}` : "transport / edge", finite(trace?.dnsMs) + finite(trace?.connectMs) + finite(trace?.ttfbMs)),
  ];
}

function clientEgress(trace) {
  const live = Boolean(trace?.id);
  return [
    node("response", 1200, 675, "HTTP response", "Fetch Response", "browser", live ? "observed" : "pending", `${finite(trace?.decodedBodyBytes).toLocaleString("fr-FR")} octets décodés`, finite(trace?.downloadMs)),
    node("json", 1410, 675, "JSON decode", "response.json()", "browser", live ? "observed" : "pending", trace?.contentType ?? "application/json"),
    node("react-state", 1410, 515, "React state", "setState / reconciliation", "render", live ? "observed" : "pending", "mise à jour composants"),
    node("paint", 1410, 355, "Layout + paint", "Browser rendering pipeline", "render", live ? "observed" : "pending", "DOM · style · paint · composite", finite(trace?.renderMs)),
  ];
}

function missionGraph(trace) {
  const live = Boolean(trace?.id);
  const has = (...names) => observedByTrail(trace, ...names);
  const serverState = (yes) => (yes ? "observed" : live ? "unverified" : "pending");
  const nodes = [
    ...clientIngress(trace),
    node("security", 884, 115, "Security FilterChain", "Spring Security", "spring", serverState(has("Security FilterChain")), "filtres HTTP / CORS"),
    node("dispatcher", 1096, 115, "DispatcherServlet", "Spring MVC", "spring", serverState(has("DispatcherServlet")), "routing vers le contrôleur"),
    node("controller", 1096, 275, "MissionControlController", "@RestController", "spring", serverState(has("EngineeringMissionControlController")), "/api/engineering/mission-control"),
    node("service", 884, 275, "MissionControlService", "Spring service", "spring", serverState(has("MissionControlService")), "agrège l’observabilité", timing(trace, "spring")),
    node("datasource", 672, 435, "DataSource", "JDBC connection pool", "data", serverState(has("DataSource")), "sonde SQL"),
    node("postgres", 460, 435, "PostgreSQL", "PostgreSQL JDBC", "data", serverState(has("PostgreSQL")), "SELECT 1 + métadonnées", timing(trace, "postgres")),
    node("cache-manager", 884, 435, "CacheManager", "Spring Cache", "cache", serverState(has("CacheManager")), "inventaire des caches"),
    node("caffeine", 884, 595, "Caffeine", "Caffeine native stats", "cache", serverState(has("Caffeine")), "hit / miss / eviction"),
    node("jobs-repo", 1096, 435, "BackgroundJobRepository", "Spring Data JPA", "data", serverState(has("BackgroundJobRepository")), "jobs pending / failed"),
    node("outbox-repo", 1308, 435, "OutboxEventRepository", "Spring Data JPA", "data", serverState(has("OutboxEventRepository")), "events pending"),
    node("version-repo", 1308, 275, "WebsiteVersionRepository", "Spring Data JPA", "data", serverState(has("WebsiteVersionRepository")), "version publiée"),
    node("jackson", 1200, 595, "Jackson", "HttpMessageConverter", "spring", serverState(has("Jackson")), "DTO → JSON"),
    ...clientEgress(trace),
  ];
  const edges = [
    edge("ui-event", "fetch", "event → fetch", live ? "observed" : "pending"),
    edge("fetch", "resource-timing", "instrumentation", live ? "observed" : "pending"),
    edge("resource-timing", "internet", "HTTPS", live ? "observed" : "pending"),
    edge("internet", "security", "HTTP request", live ? "observed" : "pending"),
    edge("security", "dispatcher", "FilterChain", serverState(has("Security FilterChain") && has("DispatcherServlet"))),
    edge("dispatcher", "controller", "HandlerMapping", serverState(has("EngineeringMissionControlController"))),
    edge("controller", "service", "appel Java", serverState(has("MissionControlService"))),
    edge("service", "datasource", "SQL probe", serverState(has("DataSource"))),
    edge("datasource", "postgres", "JDBC", serverState(has("PostgreSQL"))),
    edge("service", "cache-manager", "cache snapshot", serverState(has("CacheManager"))),
    edge("cache-manager", "caffeine", "nativeCache", serverState(has("Caffeine"))),
    edge("service", "jobs-repo", "countByStatus", serverState(has("BackgroundJobRepository"))),
    edge("service", "outbox-repo", "countByPublished", serverState(has("OutboxEventRepository"))),
    edge("service", "version-repo", "find published", serverState(has("WebsiteVersionRepository"))),
    edge("service", "jackson", "snapshot DTO", serverState(has("Jackson"))),
    edge("jobs-repo", "jackson", "metrics", serverState(has("BackgroundJobRepository") && has("Jackson")), "merge"),
    edge("outbox-repo", "jackson", "metrics", serverState(has("OutboxEventRepository") && has("Jackson")), "merge"),
    edge("version-repo", "jackson", "publication", serverState(has("WebsiteVersionRepository") && has("Jackson")), "merge"),
    edge("postgres", "jackson", "database status", serverState(has("PostgreSQL") && has("Jackson")), "return"),
    edge("caffeine", "jackson", "cache stats", serverState(has("Caffeine") && has("Jackson")), "return"),
    edge("jackson", "response", "JSON bytes", serverState(has("Jackson"))),
    edge("response", "json", "body stream", live ? "observed" : "pending"),
    edge("json", "react-state", "payload", live ? "observed" : "pending"),
    edge("react-state", "paint", "commit", live ? "observed" : "pending"),
  ];
  return { nodes, edges };
}

function historyGraph(trace) {
  const live = Boolean(trace?.id);
  const has = (...names) => observedByTrail(trace, ...names);
  const serverState = (yes) => (yes ? "observed" : live ? "unverified" : "pending");
  const nodes = [
    ...clientIngress(trace),
    node("security", 884, 115, "Security FilterChain", "Spring Security", "spring", serverState(has("Security FilterChain")), "route publique Engineering"),
    node("dispatcher", 1096, 115, "DispatcherServlet", "Spring MVC", "spring", serverState(has("DispatcherServlet")), "HandlerMapping"),
    node("controller", 1096, 275, "MissionControlController", "@RestController", "spring", serverState(has("EngineeringMissionControlController")), "performance/history"),
    node("history-service", 884, 275, "PerformanceHistoryService", "Spring service", "spring", serverState(has("RuntimePerformanceHistoryService")), "agrégation des builds", timing(trace, "history") || timing(trace, "spring")),
    node("sample-repo", 672, 435, "SampleRepository", "Spring Data JPA", "data", serverState(has("RuntimePerformanceSampleRepository")), "échantillons persistés"),
    node("spring-data", 884, 435, "Repository proxy", "Spring Data JPA", "data", serverState(has("Spring Data JPA")), "query derivation"),
    node("hibernate", 1096, 435, "Hibernate", "ORM", "data", serverState(has("Hibernate")), "SQL + mapping"),
    node("postgres", 1308, 435, "PostgreSQL", "JDBC", "data", serverState(has("PostgreSQL")), "historique runtime"),
    node("jackson", 1200, 595, "Jackson", "HttpMessageConverter", "spring", serverState(has("Jackson")), "historique → JSON"),
    ...clientEgress(trace),
  ];
  const edges = [
    edge("ui-event", "fetch", "event → fetch", live ? "observed" : "pending"), edge("fetch", "resource-timing", "instrumentation", live ? "observed" : "pending"), edge("resource-timing", "internet", "HTTPS", live ? "observed" : "pending"), edge("internet", "security", "HTTP", live ? "observed" : "pending"),
    edge("security", "dispatcher", "FilterChain", serverState(has("DispatcherServlet"))), edge("dispatcher", "controller", "HandlerMapping", serverState(has("EngineeringMissionControlController"))), edge("controller", "history-service", "service call", serverState(has("RuntimePerformanceHistoryService"))),
    edge("history-service", "sample-repo", "query", serverState(has("RuntimePerformanceSampleRepository"))), edge("sample-repo", "spring-data", "proxy", serverState(has("Spring Data JPA"))), edge("spring-data", "hibernate", "ORM", serverState(has("Hibernate"))), edge("hibernate", "postgres", "SQL/JDBC", serverState(has("PostgreSQL"))),
    edge("postgres", "jackson", "entities → DTO", serverState(has("PostgreSQL") && has("Jackson")), "return"), edge("history-service", "jackson", "response model", serverState(has("Jackson"))), edge("jackson", "response", "JSON bytes", serverState(has("Jackson"))), edge("response", "json", "body stream", live ? "observed" : "pending"), edge("json", "react-state", "payload", live ? "observed" : "pending"), edge("react-state", "paint", "commit", live ? "observed" : "pending"),
  ];
  return { nodes, edges };
}

function portfolioGraph(trace) {
  const live = Boolean(trace?.id);
  const has = (...names) => observedByTrail(trace, ...names);
  const serverState = (yes) => (yes ? "observed" : live ? "unverified" : "pending");
  const nodes = [
    ...clientIngress(trace),
    node("security", 884, 115, "Security FilterChain", "Spring Security", "spring", serverState(has("Security FilterChain")), "route publique"),
    node("dispatcher", 1096, 115, "DispatcherServlet", "Spring MVC", "spring", serverState(has("DispatcherServlet")), "routing MVC"),
    node("controller", 1096, 275, "WebsiteController", "@RestController", "spring", serverState(has("WebsiteController")), "/website/default"),
    node("cache-interceptor", 884, 275, "CacheInterceptor", "Spring Cache AOP", "cache", serverState(has("CacheInterceptor")), "intercepte @Cacheable"),
    node("caffeine", 672, 435, "Caffeine", "@Cacheable website", "cache", serverState(has("Caffeine")), trace?.cacheStatus ? `cache ${trace.cacheStatus}` : "lookup cache"),
    node("website-service", 884, 435, "WebsiteService proxy", "Spring AOP proxy", "spring", serverState(has("WebsiteService proxy")), "calcul si cache miss", timing(trace, "website")),
    node("jackson", 1096, 595, "Jackson", "HttpMessageConverter", "spring", serverState(has("Jackson")), "portfolio DTO → JSON"),
    node("db-boundary", 672, 595, "DB internals", "non exposés par cette route", "data", "unverified", "aucune durée DB attribuée sans preuve"),
    ...clientEgress(trace),
  ];
  const edges = [
    edge("ui-event", "fetch", "event → fetch", live ? "observed" : "pending"), edge("fetch", "resource-timing", "instrumentation", live ? "observed" : "pending"), edge("resource-timing", "internet", "HTTPS", live ? "observed" : "pending"), edge("internet", "security", "HTTP", live ? "observed" : "pending"),
    edge("security", "dispatcher", "FilterChain", serverState(has("DispatcherServlet"))), edge("dispatcher", "controller", "HandlerMapping", serverState(has("WebsiteController"))), edge("controller", "cache-interceptor", "@Cacheable", serverState(has("CacheInterceptor"))), edge("cache-interceptor", "caffeine", "cache lookup", serverState(has("Caffeine"))), edge("cache-interceptor", "website-service", "proceed si miss", serverState(has("WebsiteService proxy"))),
    edge("caffeine", "jackson", "cached value", serverState(has("Caffeine") && has("Jackson")), "return"), edge("website-service", "jackson", "service result", serverState(has("WebsiteService proxy") && has("Jackson")), "return"), edge("website-service", "db-boundary", "non instrumenté", "unverified"), edge("jackson", "response", "JSON bytes", serverState(has("Jackson"))), edge("response", "json", "body stream", live ? "observed" : "pending"), edge("json", "react-state", "payload", live ? "observed" : "pending"), edge("react-state", "paint", "commit", live ? "observed" : "pending"),
  ];
  return { nodes, edges };
}

function renderGraph(sample) {
  const live = Boolean(sample?.at);
  const state = live ? "observed" : "pending";
  const nodes = [
    node("react", 80, 180, "React commit", "React 19", "render", state, "state → component tree"),
    node("raf", 330, 180, "Frame scheduler", "requestAnimationFrame", "render", state, `${finite(sample?.fps).toFixed(0)} fps`, finite(sample?.medianFrame)),
    node("gsap", 580, 80, "Animation timeline", "GSAP", "render", state, "transforms / interpolation"),
    node("three", 580, 280, "Scene graph", "Three.js / R3F", "render", state, "matrices · materials · draw calls"),
    node("webgl", 850, 280, "WebGL command queue", "WebGL2RenderingContext", "gpu", state, sample?.gpuSource ?? "GPU timer extension"),
    node("gpu-query", 1120, 280, "GPU timer query", "EXT_disjoint_timer_query_webgl2", "gpu", Number.isFinite(Number(sample?.gpuFrameMs)) ? "observed" : "unverified", Number.isFinite(Number(sample?.gpuFrameMs)) ? `${Number(sample.gpuFrameMs).toFixed(2)} ms GPU` : "extension non exposée", finite(sample?.gpuFrameMs)),
    node("browser-pipeline", 1120, 500, "Browser pipeline", "style · layout · paint · composite", "render", state, `${finite(sample?.p95).toFixed(1)} ms p95`, finite(sample?.p95)),
    node("screen", 1390, 500, "Display", "compositor → écran", "render", state, `${finite(sample?.fps).toFixed(0)} fps observés`),
  ];
  const edges = [
    edge("react", "raf", "schedule", state), edge("raf", "gsap", "tick", state), edge("raf", "three", "render loop", state), edge("gsap", "three", "scene mutation", state), edge("three", "webgl", "draw calls", state), edge("webgl", "gpu-query", "timestamp", Number.isFinite(Number(sample?.gpuFrameMs)) ? "observed" : "unverified"), edge("gpu-query", "browser-pipeline", "GPU completion", state), edge("webgl", "browser-pipeline", "framebuffer", state), edge("browser-pipeline", "screen", "composite", state),
  ];
  return { nodes, edges };
}


function traceMatchesFeature(feature, trace) {
  if (!trace?.id) return false;
  const path = String(trace.path ?? "");
  if (feature === "mission") return path.startsWith("/api/engineering/mission-control") && !path.includes("/queue");
  if (feature === "history") return path.startsWith("/api/engineering/performance/history");
  if (feature === "portfolio") return path.startsWith("/website/default");
  return feature === "render" && String(trace.source ?? "").includes("browser-runtime");
}

function buildGraph(feature, trace, sample) {
  if (feature === "render") return renderGraph(sample);
  if (feature === "history") return historyGraph(trace);
  if (feature === "portfolio") return portfolioGraph(trace);
  return missionGraph(trace);
}

const TRACE_PHASES = Object.freeze([
  { id: "ingress", label: "Entrée navigateur" },
  { id: "processing", label: "Traitement applicatif" },
  { id: "dependencies", label: "Dépendances et fan-out" },
  { id: "response", label: "Réponse et rendu" },
]);

const INGRESS_IDS = new Set(["ui-event", "fetch", "resource-timing", "internet"]);
const RESPONSE_IDS = new Set(["jackson", "response", "json", "react-state", "paint", "browser-pipeline", "screen"]);

function phaseForNode(item) {
  if (INGRESS_IDS.has(item.id)) return "ingress";
  if (RESPONSE_IDS.has(item.id)) return "response";
  if (["data", "cache", "gpu"].includes(item.layer)) return "dependencies";
  return "processing";
}

function topologicalDepths(graph) {
  const depth = new Map(graph.nodes.map((item) => [item.id, 0]));
  for (let pass = 0; pass < graph.nodes.length; pass += 1) {
    let changed = false;
    graph.edges.forEach((item) => {
      const sourceDepth = depth.get(item.source) ?? 0;
      const targetDepth = depth.get(item.target) ?? 0;
      if (sourceDepth + 1 > targetDepth) {
        depth.set(item.target, sourceDepth + 1);
        changed = true;
      }
    });
    if (!changed) break;
  }
  return depth;
}

function layoutStateMachine(graph) {
  const depth = topologicalDepths(graph);
  const groups = new Map(TRACE_PHASES.map((phase) => [phase.id, []]));
  graph.nodes.forEach((item, index) => groups.get(phaseForNode(item))?.push({ ...item, sourceIndex: index }));

  const phases = TRACE_PHASES
    .map((phase) => {
      const items = groups.get(phase.id) ?? [];
      items.sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || a.sourceIndex - b.sourceIndex);
      const columns = items.length <= 3 ? Math.max(1, items.length) : 4;
      const rows = Math.max(1, Math.ceil(items.length / columns));
      return { ...phase, items, columns, rows, height: 92 + rows * 170 };
    })
    .filter((phase) => phase.items.length > 0);

  const totalHeight = Math.max(760, 36 + phases.reduce((sum, phase) => sum + phase.height, 0));
  let cursor = 18;
  const positioned = [];
  const phaseBands = [];

  phases.forEach((phase) => {
    const start = cursor;
    const end = start + phase.height - 18;
    phaseBands.push({ ...phase, top: start / totalHeight * 100, height: (end - start) / totalHeight * 100 });
    for (let row = 0; row < phase.rows; row += 1) {
      const rowItems = phase.items.slice(row * phase.columns, row * phase.columns + phase.columns);
      const count = rowItems.length;
      rowItems.forEach((item, column) => {
        const x = count === 1 ? 50 : 10 + (80 * (column + .5) / count);
        const yPx = start + 82 + row * 170;
        positioned.push({ ...item, x, y: yPx / totalHeight * 100, phase: phase.id });
      });
    }
    cursor += phase.height;
  });

  return { ...graph, nodes: positioned, phases: phaseBands, height: totalHeight };
}

function pathFor(a, b) {
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  if (Math.abs(by - ay) < 5) {
    const bend = Math.max(4, Math.abs(bx - ax) * .34);
    const direction = bx >= ax ? 1 : -1;
    return `M ${ax} ${ay} C ${ax + bend * direction} ${ay}, ${bx - bend * direction} ${by}, ${bx} ${by}`;
  }
  const verticalBend = Math.max(5, Math.abs(by - ay) * .42);
  return `M ${ax} ${ay} C ${ax} ${ay + verticalBend}, ${bx} ${by - verticalBend}, ${bx} ${by}`;
}

function StateMachine({ graph }) {
  const layout = useMemo(() => layoutStateMachine(graph), [graph]);
  const nodeMap = new Map(layout.nodes.map((item) => [item.id, item]));
  const observedNodes = layout.nodes.filter((item) => item.status === "observed");
  const observedCount = observedNodes.length;
  const [playhead, setPlayhead] = useState(0);
  const activeId = observedNodes[Math.max(0, Math.min(playhead, observedCount - 1))]?.id;

  useEffect(() => {
    if (observedCount <= 1) return undefined;
    let index = 0;
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % observedCount;
      setPlayhead(index);
    }, 420);
    return () => window.clearInterval(intervalId);
  }, [observedCount]);
  return (
    <div className="trace-state-machine-scroll">
      <div className="trace-state-diagram" role="img" aria-label="Diagramme d’état animé complexe de la requête sélectionnée" style={{ "--trace-height": `${layout.height}px` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="trace-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker>
          </defs>
          {layout.edges.map((item, index) => {
            const a = nodeMap.get(item.source);
            const b = nodeMap.get(item.target);
            if (!a || !b) return null;
            return <path key={`${item.source}-${item.target}-${index}`} className={`trace-machine-edge is-${item.status} is-${item.kind}`} d={pathFor(a, b)} markerEnd="url(#trace-arrow)" />;
          })}
        </svg>
        {layout.phases.map((phase) => <div key={phase.id} className={`trace-machine-phase is-${phase.id}`} style={{ top: `${phase.top}%`, height: `${phase.height}%` }}><span>{phase.label}</span></div>)}
        {layout.edges.map((item, index) => {
          const a = nodeMap.get(item.source); const b = nodeMap.get(item.target); if (!a || !b) return null;
          if (item.status !== "observed" && item.status !== "unverified") return null;
          return <span key={`label-${index}`} className={`trace-machine-edge-label is-${item.status}`} style={{ left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2}%` }}>{item.label}</span>;
        })}
        {layout.nodes.map((item) => (
          <div key={item.id} className={`trace-machine-node is-${item.status} is-${item.layer}${activeId === item.id ? " is-current" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }}>
            <i className="trace-node-status" aria-hidden="true" />
            <span>{item.layer}</span>
            <strong>{item.title}</strong>
            <b>{item.plugin}</b>
            <small>{item.detail}</small>
            {item.ms > 0 && <em>{item.ms.toFixed(1)} ms</em>}
          </div>
        ))}
        <div className="trace-machine-playhead" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function LiveTraceObservatory({ trace, selected, onRunFeature, runningFeature }) {
  const [feature, setFeature] = useState("mission");
  const current = FEATURES.find((item) => item.id === feature) ?? FEATURES[0];
  const featureTrace = useMemo(() => traceMatchesFeature(feature, trace) ? trace : null, [feature, trace]);
  const graph = useMemo(() => buildGraph(feature, featureTrace, selected), [feature, featureTrace, selected]);
  const observedCount = graph.nodes.filter((item) => item.status === "observed").length;
  const unverifiedCount = graph.nodes.filter((item) => item.status === "unverified").length;
  const total = current.kind === "local" ? finite(selected?.p95) : finite(featureTrace?.totalMs);
  const componentTrail = current.kind === "local" ? ["React 19", "requestAnimationFrame", "GSAP", "Three.js / R3F", "WebGL"] : featureTrace?.componentTrail ?? [];


  const run = () => onRunFeature?.(feature);
  const analysis = current.kind === "local"
    ? `La boucle locale ne traverse pas le backend : ${finite(selected?.fps).toFixed(0)} fps, p95 ${finite(selected?.p95).toFixed(1)} ms${Number.isFinite(Number(selected?.gpuFrameMs)) ? ` et GPU ${Number(selected.gpuFrameMs).toFixed(2)} ms` : ". Le timer GPU n’est pas exposé par ce navigateur"}.`
    : featureTrace?.id
      ? `${observedCount} états sont confirmés par la trace et ${unverifiedCount} restent volontairement non attribués. Le chemin serveur est alimenté par X-Portfolio-Trace ; les durées ne sont affichées que lorsqu’une source Resource Timing ou Server-Timing les fournit.`
      : "Aucune requête n’a encore été capturée. Lancez la fonction choisie : les états réellement traversés s’allumeront et les dépendances non prouvées resteront grisées.";

  return (
    <div className="live-trace-observatory">
      <VisibilityGate item="architecture.trace.controls"><div className="trace-control-bar">
        <label>Fonction à observer<select value={feature} onChange={(event) => setFeature(event.currentTarget.value)}>{FEATURES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" onClick={run} disabled={Boolean(runningFeature)}>{runningFeature ? "Trace en cours…" : current.kind === "local" ? "Rejouer le profil" : "Lancer une requête réelle"}</button>
        <div><span>Total observé</span><strong>{total > 0 ? `${total.toFixed(1)} ms` : "—"}</strong><small>{current.kind === "local" ? "frame p95" : featureTrace?.source ?? "en attente"}</small></div>
      </div></VisibilityGate>

      <VisibilityGate item="architecture.trace.request"><section className="trace-request-identity" aria-label="Identité de l’exécution observée">
        <div><span>Opération</span><strong>{featureTrace?.operation ?? current.label}</strong></div>
        <div><span>Requête / boucle</span><code>{current.kind === "local" ? "requestAnimationFrame → GPU → paint" : `${featureTrace?.method ?? "GET"} ${featureTrace?.path ?? current.label.split(" · ")[0]}`}</code></div>
        <div><span>Service principal</span><strong>{current.service}</strong></div>
        <div><span>Source de preuve</span><strong>{current.kind === "local" ? "Performance API + WebGL timer" : featureTrace?.componentTrail?.length ? "X-Portfolio-Trace + Server-Timing" : "en attente de trace"}</strong></div>
      </section>

      <section className="trace-component-trail" aria-label="Composants et plugins appelés pendant la trace">
        <header><div><span className="mission-kicker">Composants appelés</span><h3>Frameworks, plugins et services traversés</h3></div><span>{componentTrail.length} composant{componentTrail.length > 1 ? "s" : ""}</span></header>
        <div>{componentTrail.length ? componentTrail.map((item, index) => <span key={`${item}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>) : <p>Lancez une requête : le backend exposera ici son chemin d’exécution instrumenté.</p>}</div>
      </section></VisibilityGate>

      <VisibilityGate item="architecture.trace.automaton"><StateMachine key={`${feature}:${featureTrace?.id ?? "pending"}:${observedCount}`} graph={graph} /></VisibilityGate>

      <VisibilityGate item="architecture.trace.analysis"><div className="trace-live-facts">
        <span><small>Source</small><strong>{current.kind === "local" ? "browser runtime" : featureTrace?.source ?? "en attente"}</strong></span>
        <span><small>HTTP</small><strong>{current.kind === "local" ? "aucun" : featureTrace?.status ?? "—"}</strong></span>
        <span><small>Transfert</small><strong>{current.kind === "local" ? "0 KB" : `${(finite(featureTrace?.transferBytes) / 1024).toFixed(1)} KB`}</strong></span>
        <span><small>Backend</small><strong>{current.kind === "local" ? "non impliqué" : featureTrace?.componentTrail?.length ? `${featureTrace.componentTrail.length} composants exposés` : "trail non exposé"}</strong></span>
      </div>

      <ObservabilityGuide
        title="Analyse de l’exécution sélectionnée"
        analysis={`${analysis} L’automate sépare les états du navigateur, du transport, de Spring et des dépendances. Les courbes représentent les transitions entre états ; elles ne supposent pas un ordre linéaire lorsque le service effectue un fan-out. Le nom de l’opération, la route et le service principal restent visibles au-dessus du diagramme pour éviter de perdre le contexte pendant l’animation.`}
        note="trace instrumentée"
      /></VisibilityGate>
    </div>
  );
}
