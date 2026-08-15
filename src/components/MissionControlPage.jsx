import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getClientImpactSnapshot, measurePageMemory } from "../engineering/clientImpactTelemetry";
import { frameVerdict } from "../engineering/engineeringTelemetry";
import useLanguage from "../localization/useLanguage";
import usePerformanceRuntime from "../performance/usePerformanceRuntime";
import { fetchMissionControlSnapshot, fetchPerformanceHistory, recordPerformanceSample, tracePortfolioPublic } from "../services/engineeringApi";
import MetadataHead from "./MetadataHead";
import TopNavigation from "./TopNavigation";
import ArchitectureObservatory from "./mission-control/ArchitectureObservatory";
import LiveTraceObservatory from "./mission-control/LiveTraceObservatory";
import PerformanceObservatory from "./mission-control/PerformanceObservatory";
import RequestTraceWaterfall from "./mission-control/RequestTraceWaterfall";
import { VisibilityGate } from "../visibility/ItemVisibilityContext";
import { useItemVisibility } from "../visibility/useItemVisibility";
import "../styles/pages/mission-control.css";
import "../styles/pages/architecture-graph-canvas.css";

const LOCAL_SAMPLE_LIMIT = 120;
const BUILD_ID = import.meta.env.VITE_BUILD_ID ?? import.meta.env.VITE_COMMIT_SHA ?? "development";
const VIEWS = Object.freeze([
  { id: "system", key: "architecture.system", label: "System", description: "topologie vivante" },
  { id: "trace", key: "architecture.trace", label: "Live Trace", description: "requêtes en mouvement" },
  { id: "performance", key: "architecture.performance", label: "Performance", description: "profiler live" },
]);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function ratio(used, total) {
  const safeUsed = Number(used);
  const safeTotal = Number(total);
  return Number.isFinite(safeUsed) && safeTotal > 0 ? safeUsed / safeTotal * 100 : Number.NaN;
}

function formatTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

export default function MissionControlPage({ owner, projects = [], experiences = [] }) {
  const { localizedPath, locale } = useLanguage();
  const { isVisible } = useItemVisibility();
  const { getRuntimeSnapshot } = usePerformanceRuntime();
  const [view, setView] = useState("system");
  const [backendSnapshot, setBackendSnapshot] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState(null);
  const [activeTrace, setActiveTrace] = useState(null);
  const [runningFeature, setRunningFeature] = useState(null);
  const [samples, setSamples] = useState([]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [followLive, setFollowLive] = useState(true);
  const apiLatencyRef = useRef(0);
  const apiRequestCountRef = useRef(0);
  const samplesRef = useRef([]);
  const backendRef = useRef(null);
  const backendProbeOkRef = useRef(false);
  const appMemoryRef = useRef({ supported: false, bytes: Number.NaN, breakdown: [] });

  const refreshBackend = useCallback(async (signal, captureTrace = true) => {
    const startedAt = performance.now();
    try {
      const snapshot = await fetchMissionControlSnapshot({ signal, onTrace: captureTrace ? setActiveTrace : undefined });
      apiLatencyRef.current = performance.now() - startedAt;
      apiRequestCountRef.current += 1;
      backendRef.current = snapshot;
      backendProbeOkRef.current = true;
      setBackendSnapshot(snapshot);
      setBackendError(null);
      return snapshot;
    } catch (error) {
      if (error?.name !== "AbortError") {
        backendProbeOkRef.current = false;
        setBackendError(error?.message ?? "Backend observable indisponible");
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) refreshBackend(controller.signal, true).catch(() => {}); });
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      refreshBackend(controller.signal, false).catch(() => {});
    }, 2000);
    return () => { controller.abort(); window.clearInterval(intervalId); };
  }, [refreshBackend]);

  useEffect(() => {
    const controller = new AbortController();
    const load = () => fetchPerformanceHistory(80, { signal: controller.signal }).then(setPerformanceHistory).catch(() => {});
    load();
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      load();
    }, 30000);
    return () => { controller.abort(); window.clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    let active = true;
    const measure = async () => {
      const memory = await measurePageMemory();
      if (active) appMemoryRef.current = memory;
    };
    measure();
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      measure();
    }, 6000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, []);


  useEffect(() => {
    const sample = () => {
      const runtime = getRuntimeSnapshot();
      const metrics = runtime?.metrics ?? {};
      const median = finite(metrics.medianFrameMs);
      const estimatedHz = finite(metrics.estimatedHz);
      const fps = median > 0 ? Math.min(estimatedHz || Infinity, 1000 / median) : estimatedHz;
      const browserMemory = performance.memory;
      const system = backendRef.current?.system;
      const displayHz = finite(runtime?.capabilities?.displayHz, 60);
      const frameTarget = 1000 / Math.max(30, displayHz);
      const droppedFrames = finite(metrics.droppedFrameRatio);
      const frameBudgetUsed = Math.min(200, median > 0 ? median / frameTarget * 100 : 0);
      const uiThreadLoad = Math.min(100, Math.max(0, frameBudgetUsed * .62 + droppedFrames * 100 * .38));
      const jsHeapUsed = finite(browserMemory?.usedJSHeapSize);
      const jsHeapLimit = finite(browserMemory?.jsHeapSizeLimit);
      const clientImpact = getClientImpactSnapshot();
      const gpuSources = clientImpact.gpu?.sources?.filter((source) => Date.now() - Number(source.sampledAt || 0) < 5000) ?? [];
      const gpuFrameMs = Number.isFinite(Number(clientImpact.gpu?.averageMs)) ? Number(clientImpact.gpu.averageMs) : Number.NaN;
      const next = {
        at: Date.now(),
        route: window.location.pathname,
        fps: Number.isFinite(fps) ? fps : 0,
        p95: finite(metrics.p95FrameMs),
        p99: finite(metrics.p99FrameMs, Number.NaN),
        medianFrame: median,
        longTasks: finite(metrics.longTaskCount),
        maxLongTaskMs: finite(metrics.maxLongTaskMs, Number.NaN),
        longAnimationFrames: finite(metrics.longAnimationFrameCount),
        maxLongAnimationFrameMs: finite(metrics.maxLongAnimationFrameMs, Number.NaN),
        severeFrameRatio: finite(metrics.severeFrameRatio, Number.NaN),
        droppedFrames,
        frameBudgetUsed,
        uiThreadLoad,
        workerLatency: finite(window.__portfolioMarineWorker?.latencyMs),
        workerStatus: window.__portfolioMarineWorker?.status ?? "fallback",
        apiLatency: finite(apiLatencyRef.current),
        apiRequestCount: apiRequestCountRef.current,
        profile: runtime?.profile ?? "unknown",
        quality: runtime?.quality ?? "unknown",
        memoryState: runtime?.memory?.state ?? "normal",
        resources: finite(runtime?.resources?.activeCount),
        jsHeapUsed,
        jsHeapTotal: finite(browserMemory?.totalJSHeapSize),
        jsHeapLimit,
        jsHeapPercent: jsHeapLimit > 0 ? jsHeapUsed / jsHeapLimit * 100 : Number.NaN,
        appMemoryBytes: finite(appMemoryRef.current?.bytes, Number.NaN),
        appMemorySupported: Boolean(appMemoryRef.current?.supported),
        gpuFrameMs,
        gpuFrameP95Ms: finite(clientImpact.gpu?.p95Ms, Number.NaN),
        gpuSource: gpuSources.map((source) => source.name).join(" + ") || null,
        networkRequestCount: finite(clientImpact.network?.requestCount),
        networkTransferBytes: finite(clientImpact.network?.transferBytes),
        networkDecodedBytes: finite(clientImpact.network?.decodedBytes),
        serverAvailable: Boolean(system) && backendProbeOkRef.current,
        systemCpu: finite(system?.cpu?.systemLoadPercent, Number.NaN),
        processCpu: finite(system?.cpu?.processLoadPercent, Number.NaN),
        systemMemoryUsed: finite(system?.memory?.physicalUsedBytes, Number.NaN),
        systemMemoryPercent: ratio(system?.memory?.physicalUsedBytes, system?.memory?.physicalTotalBytes),
        jvmHeapUsed: finite(system?.memory?.heapUsedBytes, Number.NaN),
        jvmHeapPercent: ratio(system?.memory?.heapUsedBytes, system?.memory?.heapMaxBytes),
        hardwareConcurrency: runtime?.capabilities?.hardwareConcurrency,
        deviceMemoryGb: runtime?.capabilities?.deviceMemoryGb,
        latestDecision: runtime?.decisions?.at(-1) ?? null,
        runtime: {
          profile: runtime?.profile,
          quality: runtime?.quality,
          capabilityProfile: runtime?.capabilityProfile,
          preferenceMode: runtime?.preferenceMode,
          budget: runtime?.budget,
          capabilities: runtime?.capabilities,
          metrics: runtime?.metrics,
          memory: runtime?.memory,
          resources: runtime?.resources,
        },
      };
      setSamples((current) => {
        const updated = [...current, next].slice(-LOCAL_SAMPLE_LIMIT);
        samplesRef.current = updated;
        return updated;
      });
    };
    sample();
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      sample();
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [getRuntimeSnapshot]);

  useEffect(() => {
    const publish = () => {
      if (document.hidden) return;
      const latest = samplesRef.current.at(-1);
      if (!latest || latest.fps <= 0) return;
      recordPerformanceSample({
        buildId: BUILD_ID,
        runtimeProfile: latest.profile,
        memoryState: latest.memoryState,
        fps: latest.fps,
        frameP95Ms: latest.p95,
        longTaskCount: latest.longTasks,
        workerLatencyMs: latest.workerLatency,
        apiLatencyMs: latest.apiLatency,
        activeResources: latest.resources,
      }).catch(() => {});
    };
    const timeoutId = window.setTimeout(publish, 10000);
    const intervalId = window.setInterval(publish, 30000);
    return () => { window.clearTimeout(timeoutId); window.clearInterval(intervalId); };
  }, []);

  const runFeature = useCallback(async (feature) => {
    setRunningFeature(feature);
    try {
      if (feature === "mission") await refreshBackend(undefined, true);
      if (feature === "history") {
        const history = await fetchPerformanceHistory(80, { onTrace: setActiveTrace });
        setPerformanceHistory(history);
      }
      if (feature === "portfolio") await tracePortfolioPublic(locale, { onTrace: setActiveTrace });
      if (feature === "render") {
        setActiveTrace((current) => ({ ...(current ?? {}), id: `render-${Date.now()}`, operation: "Boucle de rendu locale", source: "browser-runtime" }));
      }
    } catch {
      // The existing status panels surface network failures without breaking playback.
    } finally {
      setRunningFeature(null);
    }
  }, [locale, refreshBackend]);

  const visibleViews = VIEWS.filter((item) => isVisible(item.key));
  const activeView = visibleViews.some((item) => item.id === view) ? view : (visibleViews[0]?.id ?? "system");

  const effectiveCursorIndex = followLive ? Math.max(0, samples.length - 1) : cursorIndex;
  const selected = samples[Math.max(0, Math.min(effectiveCursorIndex, samples.length - 1))] ?? {};
  const runtime = selected.runtime ?? getRuntimeSnapshot();
  const displayHz = finite(runtime?.capabilities?.displayHz, 60);
  const verdict = frameVerdict(selected.p95, displayHz);
  const traced = activeTrace ? { ...activeTrace, renderMs: selected.p95 } : null;

  return (
    <main id="main-content" className="mission-control-page" tabIndex={-1}>
      <MetadataHead owner={owner} projects={projects} experiences={experiences} />
      <TopNavigation owner={owner} />
      <div className="mission-control-ambient" aria-hidden="true"><span /><span /></div>
      <div className="mission-control-shell">
        <header className="mission-hero">
          <div>
            <span className="mission-kicker"><i /> architecture technique · mesures en direct</span>
            <h1 aria-label="Architecture technique du portfolio"><span>Front + back</span> Architecture technique du portfolio</h1>
            <p>Explorer la topologie vivante des deux projets, suivre une requête à travers les services réellement appelés et observer les performances qui influencent directement l’architecture.</p>
          </div>
          <div className="mission-hero-status">
            <span className={backendSnapshot ? "is-connected" : "is-waiting"}><i />{backendSnapshot ? "Front + back connectés" : "Front mesuré · back en attente"}</span>
            <strong>{verdict.label}</strong>
            <small>échantillon {formatTime(selected.at)}</small>
          </div>
        </header>

        {backendError && <div className="mission-backend-warning">{backendError}. Les mesures locales restent actives pendant la reconnexion.</div>}

        <section className="mission-time-control" aria-label="Curseur temporel global">
          <div><span className="mission-kicker">Fenêtre de mesure</span><strong>{formatTime(selected.at)}</strong></div>
          <input type="range" min="0" max={Math.max(0, samples.length - 1)} value={Math.max(0, Math.min(effectiveCursorIndex, samples.length - 1))} onChange={(event) => { setFollowLive(false); setCursorIndex(Number(event.currentTarget.value)); }} aria-label="Revenir à une mesure précédente" />
          <button type="button" className={followLive ? "is-live" : ""} onClick={() => setFollowLive(true)}><span />{followLive ? "Direct" : "Revenir au direct"}</button>
        </section>

        <nav className="mission-view-tabs architecture-subnav" aria-label="Navigation Architecture">
          <div className="mission-view-brand" aria-hidden="true">
            <span className="architecture-subnav-orbit"><i /><i /><i /></span>
            <span>Architecture</span>
            <strong>Exploration live</strong>
          </div>
          <div className="mission-view-links" style={{ "--architecture-view-count": visibleViews.length }}>
            {visibleViews.map((item, index) => <button type="button" key={item.id} className={activeView === item.id ? "is-active" : ""} aria-current={activeView === item.id ? "page" : undefined} onClick={() => setView(item.id)}><span className="architecture-subnav-index">0{index + 1}</span><strong>{item.label}</strong><small>{item.description}</small><i className="architecture-subnav-marker" /></button>)}
          </div>
          <div className="architecture-subnav-live" aria-hidden="true"><i /> LIVE</div>
        </nav>

        {activeView === "system" && <VisibilityGate item="architecture.system"><section className="mission-panel mission-architecture-panel">
          <header className="mission-panel-heading">
            <div><span className="mission-kicker">Carte système</span><h2>Architecture vivante du portfolio</h2></div>
            <span className="mission-panel-count">ForceAtlas · communautés · flux réels</span>
          </header>
          <ArchitectureObservatory snapshot={backendSnapshot} liveSample={selected} activeTrace={activeTrace} />
        </section></VisibilityGate>}

        {activeView === "trace" && <VisibilityGate item="architecture.trace"><section className="mission-panel mission-trace-panel">
          <header className="mission-panel-heading">
            <div><span className="mission-kicker">Trace instrumentée</span><h2>Exécution d’une requête de bout en bout</h2></div>
            <span className={activeTrace ? "mission-live-pill" : "mission-panel-count"}>{activeTrace ? "trace capturée" : "écoute"}</span>
          </header>
          <LiveTraceObservatory trace={traced} selected={selected} onRunFeature={runFeature} runningFeature={runningFeature} />
          <VisibilityGate item="architecture.trace.waterfall"><RequestTraceWaterfall trace={activeTrace} renderMs={selected.p95} /></VisibilityGate>
        </section></VisibilityGate>}

        {activeView === "performance" && <VisibilityGate item="architecture.performance"><section className="mission-panel mission-performance-panel">
          <header className="mission-panel-heading">
            <div><span className="mission-kicker">Profiler live</span><h2>Performance de l’architecture en temps réel</h2></div>
            <span className="mission-panel-count">frames · main thread · GPU · API</span>
          </header>
          <PerformanceObservatory samples={samples} selected={selected} history={performanceHistory} displayHz={displayHz} buildId={BUILD_ID} />
        </section></VisibilityGate>}



        <footer className="mission-footer">
          <div><strong>Architecture technique du portfolio</strong><span>Topologie, traces et performances sont affichées uniquement quand une source mesurable permet de les attribuer.</span></div>
          <Link to={localizedPath("/")}>Retour au portfolio</Link>
        </footer>
      </div>
    </main>
  );
}
