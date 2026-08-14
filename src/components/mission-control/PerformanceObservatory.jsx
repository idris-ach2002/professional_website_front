import { useMemo, useState } from "react";
import { bytes } from "../../engineering/engineeringTelemetry";
import ObservabilityGuide from "./ObservabilityGuide";
import { VisibilityGate } from "../../visibility/ItemVisibilityContext";


function finite(value, fallback = Number.NaN) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percentile(values, ratio = .95) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return Number.NaN;
  return clean[Math.min(clean.length - 1, Math.max(0, Math.ceil(clean.length * ratio) - 1))];
}

function stats(samples, accessor) {
  const values = samples.map(accessor).map((value) => Number(value)).filter(Number.isFinite);
  if (!values.length) return { min: Number.NaN, avg: Number.NaN, p95: Number.NaN, max: Number.NaN };
  return {
    min: Math.min(...values),
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    p95: percentile(values),
    max: Math.max(...values),
  };
}

function Metric({ label, value, detail, tone = "normal" }) {
  return <div className={`performance-metric is-${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Histogram({ samples, field, label, unit, ceiling }) {
  const values = samples.slice(-42).map((sample) => Math.max(0, finite(sample?.[field], 0)));
  const max = Math.max(ceiling ?? 0, ...values, 1);
  return (
    <figure className="performance-histogram">
      <figcaption><span>{label}</span><strong>{values.at(-1)?.toFixed(field === "fps" ? 0 : 1) ?? "—"} {unit}</strong></figcaption>
      <svg viewBox="0 0 420 110" preserveAspectRatio="none" role="img" aria-label={`Histogramme animé ${label}`}>
        {values.map((value, index) => {
          const width = 420 / Math.max(1, values.length);
          const height = Math.max(2, value / max * 94);
          return <rect key={`${index}-${value}`} x={index * width + 1} y={104 - height} width={Math.max(2, width - 2)} height={height} rx="1.5" />;
        })}
        <line x1="0" x2="420" y1="104" y2="104" />
      </svg>
    </figure>
  );
}

function Budget({ label, current, target, pass }) {
  return <div className={`performance-budget-row ${pass ? "is-pass" : "is-watch"}`}><span>{label}</span><strong>{current}</strong><small>{target}</small><em>{pass ? "PASS" : "WATCH"}</em></div>;
}

function laneValue(sample, lane) {
  const raw = finite(lane.read(sample));
  return Number.isFinite(raw) ? raw : Number.NaN;
}

function ProfilerTimeline({ samples, frameBudgetMs }) {
  const width = 1180;
  const height = 500;
  const left = 135;
  const right = 26;
  const top = 28;
  const laneHeight = 82;
  const plotWidth = width - left - right;
  const latest = samples.at(-1) ?? {};
  const memoryMb = (sample) => finite(sample?.appMemoryBytes, finite(sample?.jsHeapUsed)) / 1024 ** 2;
  const lanes = [
    { id: "frame", label: "Frame p95", unit: "ms", read: (s) => s?.p95, ceiling: Math.max(frameBudgetMs * 3, 25), budget: frameBudgetMs * 1.35, tone: "frame" },
    { id: "thread", label: "Main thread", unit: "%", read: (s) => s?.uiThreadLoad, ceiling: 100, budget: 75, tone: "thread" },
    { id: "gpu", label: "GPU frame", unit: "ms", read: (s) => s?.gpuFrameMs, ceiling: Math.max(frameBudgetMs * 2, 16), budget: frameBudgetMs * .75, tone: "gpu" },
    { id: "api", label: "API", unit: "ms", read: (s) => s?.apiLatency, ceiling: 300, budget: 250, tone: "api" },
    { id: "memory", label: "Page memory", unit: "MB", read: memoryMb, ceiling: 300, budget: 250, tone: "memory" },
  ];
  const count = Math.max(2, samples.length);
  const xAt = (index) => left + index / Math.max(1, count - 1) * plotWidth;

  return (
    <figure className="live-profiler" aria-label="Profiler live du rendu, du GPU, de l’API et de la mémoire">
      <figcaption>
        <div><span className="mission-kicker">Chronologie d’exécution</span><strong>Frames · main thread · GPU · API · mémoire</strong></div>
        <div><span className="profiler-rec-dot" />{samples.length} échantillons</div>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Profiler live multi-pistes du navigateur">
        <rect className="profiler-background" x="0" y="0" width={width} height={height} rx="16" />
        {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} className="profiler-time-grid" x1={left + ratio * plotWidth} x2={left + ratio * plotWidth} y1={top - 8} y2={height - 22} />)}
        {samples.map((sample, index) => {
          const hasEvent = finite(sample?.longTasks, 0) > 0 || finite(sample?.droppedFrames, 0) > .08;
          return hasEvent ? <rect key={`event-${index}`} className="profiler-event-band" x={xAt(index) - 2} y={top - 8} width="4" height={height - top - 14} /> : null;
        })}
        {lanes.map((lane, laneIndex) => {
          const yTop = top + laneIndex * laneHeight;
          const yBase = yTop + laneHeight - 22;
          const points = samples.map((sample, index) => {
            const value = laneValue(sample, lane);
            if (!Number.isFinite(value)) return null;
            const y = yBase - clamp(value / lane.ceiling, 0, 1.18) * (laneHeight - 34);
            return `${xAt(index)},${y}`;
          }).filter(Boolean).join(" ");
          const budgetY = yBase - clamp(lane.budget / lane.ceiling, 0, 1) * (laneHeight - 34);
          const current = laneValue(latest, lane);
          return <g key={lane.id} className={`profiler-lane is-${lane.tone}`}>
            <rect className="profiler-lane-bg" x={left} y={yTop} width={plotWidth} height={laneHeight - 8} rx="8" />
            <line className="profiler-budget-line" x1={left} x2={width - right} y1={budgetY} y2={budgetY} />
            <text className="profiler-lane-label" x="20" y={yTop + 24}>{lane.label}</text>
            <text className="profiler-lane-value" x="20" y={yTop + 47}>{Number.isFinite(current) ? `${current.toFixed(lane.id === "thread" ? 0 : 1)} ${lane.unit}` : "non exposé"}</text>
            {points && <polyline className="profiler-signal-line" points={points} fill="none" />}
            {samples.map((sample, index) => {
              const value = laneValue(sample, lane);
              if (!Number.isFinite(value)) return null;
              const y = yBase - clamp(value / lane.ceiling, 0, 1.18) * (laneHeight - 34);
              return <circle key={`${lane.id}-${index}`} className="profiler-sample-dot" cx={xAt(index)} cy={y} r={index === samples.length - 1 ? 3.8 : 1.6} />;
            })}
          </g>;
        })}
        <line className="profiler-live-cursor" x1={width - right} x2={width - right} y1={top - 8} y2={height - 22} />
      </svg>
    </figure>
  );
}

function formatStat(value, decimals = 1) {
  return Number.isFinite(value) ? value.toFixed(decimals) : "—";
}

export default function PerformanceObservatory({ samples = [], selected = {}, history = null, displayHz = 60, buildId = "development" }) {
  const [recording, setRecording] = useState(true);
  const [windowSeconds, setWindowSeconds] = useState(30);
  const [frozenSamples, setFrozenSamples] = useState([]);
  const previousBuild = history?.builds?.find((build) => build.buildId && build.buildId !== buildId) ?? null;
  const frameBudgetMs = 1000 / Math.max(30, Number(displayHz || 60));
  const windowSize = Math.max(10, windowSeconds * 2);
  const liveWindow = samples.slice(-windowSize);
  const displaySamples = recording ? liveWindow : frozenSamples;
  const current = displaySamples.at(-1) ?? selected;


  const budgets = useMemo(() => {
    const fps = finite(current.fps);
    const p95 = finite(current.p95);
    const api = finite(current.apiLatency);
    const memory = finite(current.appMemoryBytes, finite(current.jsHeapUsed));
    const gpu = finite(current.gpuFrameMs);
    return [
      ["FPS", Number.isFinite(fps) && fps > 0 ? `${fps.toFixed(0)} fps` : "—", "objectif ≥ 90 fps", !Number.isFinite(fps) || fps <= 0 || fps >= 90],
      ["Frame p95", Number.isFinite(p95) && p95 > 0 ? `${p95.toFixed(1)} ms` : "—", `budget écran ${frameBudgetMs.toFixed(1)} ms`, !Number.isFinite(p95) || p95 <= 0 || p95 <= frameBudgetMs * 1.35],
      ["Long tasks", `${Number(current.longTasks || 0)}`, "objectif 0 nouvelle tâche longue", Number(current.longTasks || 0) === 0],
      ["Mémoire page", Number.isFinite(memory) ? bytes(memory) : "—", "budget 250 MB", !Number.isFinite(memory) || memory <= 250 * 1024 ** 2],
      ["API", Number.isFinite(api) && api > 0 ? `${api.toFixed(0)} ms` : "—", "objectif < 250 ms", !Number.isFinite(api) || api <= 0 || api < 250],
      ["GPU frame", Number.isFinite(gpu) ? `${gpu.toFixed(2)} ms` : "non exposé", `budget < ${(frameBudgetMs * .75).toFixed(1)} ms`, !Number.isFinite(gpu) || gpu < frameBudgetMs * .75],
    ];
  }, [current, frameBudgetMs]);
  const passed = budgets.filter((item) => item[3]).length;

  const seriesStats = useMemo(() => {
    const memoryMb = (sample) => finite(sample?.appMemoryBytes, finite(sample?.jsHeapUsed)) / 1024 ** 2;
    return [
      { label: "FPS", unit: "fps", values: stats(displaySamples, (s) => finite(s.fps)), decimals: 0 },
      { label: "Frame p95", unit: "ms", values: stats(displaySamples, (s) => finite(s.p95)), decimals: 1 },
      { label: "Main thread", unit: "%", values: stats(displaySamples, (s) => finite(s.uiThreadLoad)), decimals: 0 },
      { label: "GPU", unit: "ms", values: stats(displaySamples, (s) => finite(s.gpuFrameMs)), decimals: 2 },
      { label: "API", unit: "ms", values: stats(displaySamples, (s) => finite(s.apiLatency)), decimals: 1 },
      { label: "Mémoire", unit: "MB", values: stats(displaySamples, memoryMb), decimals: 1 },
    ];
  }, [displaySamples]);

  const hotPaths = useMemo(() => {
    const memoryBytes = finite(current.appMemoryBytes, finite(current.jsHeapUsed));
    const entries = [
      { label: "Main thread", value: finite(current.uiThreadLoad, 0), note: "pression frame / dropped frames" },
      { label: "Frame p95", value: finite(current.p95, 0) / Math.max(.1, frameBudgetMs * 1.35) * 100, note: `budget ${frameBudgetMs.toFixed(1)} ms` },
      { label: "GPU", value: finite(current.gpuFrameMs, 0) / Math.max(.1, frameBudgetMs * .75) * 100, note: current.gpuSource || "timer GPU non exposé" },
      { label: "API", value: finite(current.apiLatency, 0) / 250 * 100, note: "budget 250 ms" },
      { label: "Mémoire", value: Number.isFinite(memoryBytes) ? memoryBytes / (250 * 1024 ** 2) * 100 : 0, note: "budget 250 MB" },
    ];
    return entries.sort((a, b) => b.value - a.value);
  }, [current, frameBudgetMs]);

  const events = useMemo(() => {
    const result = [];
    displaySamples.forEach((sample, index) => {
      if (finite(sample.longTasks, 0) > 0) result.push({ at: sample.at, type: "Long task", detail: `${finite(sample.maxLongTaskMs, 0).toFixed(1)} ms max`, index });
      if (finite(sample.droppedFrames, 0) > .08) result.push({ at: sample.at, type: "Dropped frames", detail: `${(finite(sample.droppedFrames, 0) * 100).toFixed(0)} %`, index });
      if (finite(sample.severeFrameRatio, 0) > .03) result.push({ at: sample.at, type: "Severe frame", detail: `${(finite(sample.severeFrameRatio, 0) * 100).toFixed(1)} %`, index });
      const previous = displaySamples[index - 1];
      if (previous && finite(sample.apiRequestCount, 0) > finite(previous.apiRequestCount, 0)) result.push({ at: sample.at, type: "API request", detail: `${finite(sample.apiLatency, 0).toFixed(0)} ms`, index });
    });
    return result.slice(-10).reverse();
  }, [displaySamples]);

  const hottest = hotPaths[0];
  const analysis = hottest
    ? `${hottest.label} est actuellement le signal le plus proche de son budget (${clamp(hottest.value, 0, 999).toFixed(0)} % du seuil de référence). ${events.length ? `${events.length} événement(s) notable(s) apparaissent dans la fenêtre.` : "Aucun événement de jank significatif n’est marqué dans la fenêtre."}`
    : "Le profiler attend des échantillons runtime.";

  const toggleRecording = () => {
    if (recording) setFrozenSamples(liveWindow);
    setRecording((value) => !value);
  };

  return (
    <div className="performance-observatory">
      <VisibilityGate item="architecture.performance.toolbar"><div className="profiler-toolbar">
        <button type="button" className={recording ? "is-recording" : ""} onClick={toggleRecording}><span />{recording ? "REC · Pause" : "Reprendre"}</button>
        <label>Fenêtre<select value={windowSeconds} onChange={(event) => setWindowSeconds(Number(event.currentTarget.value))}><option value="10">10 s</option><option value="30">30 s</option><option value="60">60 s</option></select></label>
        <div><small>Échantillonnage</small><strong>2 Hz</strong></div>
        <div><small>Écran estimé</small><strong>{Number(displayHz || 60).toFixed(0)} Hz</strong></div>
        <div><small>Frame budget</small><strong>{frameBudgetMs.toFixed(2)} ms</strong></div>
      </div></VisibilityGate>

      <VisibilityGate item="architecture.performance.summary"><div className="performance-summary-grid">
        <Metric label="Frame rate" value={`${finite(current.fps, 0).toFixed(0)} fps`} detail={`${finite(current.p95, 0).toFixed(1)} ms p95 · ${Number.isFinite(finite(current.p99)) ? `${finite(current.p99).toFixed(1)} ms p99` : "p99 non exposé"}`} tone={finite(current.fps, 0) >= 90 ? "good" : "watch"} />
        <Metric label="Main-thread pressure" value={`${finite(current.uiThreadLoad, 0).toFixed(0)} %`} detail="indice de pression, pas CPU système" />
        <Metric label="GPU frame" value={Number.isFinite(finite(current.gpuFrameMs)) ? `${finite(current.gpuFrameMs).toFixed(2)} ms` : "non exposé"} detail={current.gpuSource ?? "EXT_disjoint_timer_query_webgl2"} />
        <Metric label="Mémoire page" value={current.appMemoryBytes ? bytes(current.appMemoryBytes) : current.jsHeapUsed ? bytes(current.jsHeapUsed) : "masquée"} detail={current.appMemoryBytes ? "User-Agent specific memory" : "heap JS fallback"} />
      </div></VisibilityGate>

      <VisibilityGate item="architecture.performance.timeline"><ProfilerTimeline samples={displaySamples} frameBudgetMs={frameBudgetMs} /></VisibilityGate>

      <div className="profiler-analysis-grid">
        <VisibilityGate item="architecture.performance.hot-path"><section className="profiler-hot-path">
          <header><div><span className="mission-kicker">Saturation des budgets</span><h3>Signal le plus proche de sa limite</h3></div><span>{hottest ? `${clamp(hottest.value, 0, 999).toFixed(0)} %` : "—"}</span></header>
          <div>{hotPaths.map((item) => <div key={item.label}><div><strong>{item.label}</strong><span>{item.note}</span><b>{clamp(item.value, 0, 999).toFixed(0)} %</b></div><i><b style={{ width: `${clamp(item.value, 0, 100)}%` }} /></i></div>)}</div>
        </section></VisibilityGate>
        <VisibilityGate item="architecture.performance.events"><section className="profiler-event-log">
          <header><div><span className="mission-kicker">Événements détectés</span><h3>Long tasks, frames perdues et requêtes</h3></div><span>{events.length}</span></header>
          <div>{events.length ? events.map((event, index) => <div key={`${event.at}-${event.type}-${index}`}><time>{event.at ? new Date(event.at).toLocaleTimeString("fr-FR") : "—"}</time><strong>{event.type}</strong><span>{event.detail}</span></div>) : <p>Aucune long task, chute de frames sévère ou nouvelle requête API détectée dans cette fenêtre.</p>}</div>
        </section></VisibilityGate>
      </div>

      <VisibilityGate item="architecture.performance.statistics"><section className="profiler-statistics">
        <header><span className="mission-kicker">Statistiques fenêtre</span><h3>Min · moyenne · p95 · max</h3></header>
        <div className="profiler-stat-table" role="table" aria-label="Statistiques du profiler sur la fenêtre sélectionnée">
          <div className="profiler-stat-row is-head" role="row"><span>Signal</span><span>Min</span><span>Moy.</span><span>p95</span><span>Max</span></div>
          {seriesStats.map((series) => <div className="profiler-stat-row" role="row" key={series.label}><strong>{series.label}</strong><span>{formatStat(series.values.min, series.decimals)} {series.unit}</span><span>{formatStat(series.values.avg, series.decimals)} {series.unit}</span><span>{formatStat(series.values.p95, series.decimals)} {series.unit}</span><span>{formatStat(series.values.max, series.decimals)} {series.unit}</span></div>)}
        </div>
      </section></VisibilityGate>

      <VisibilityGate item="architecture.performance.histograms"><section className="performance-signal-strips">
        <header><span className="mission-kicker">Mesures échantillonnées</span><h3>Histogrammes de la fenêtre courante</h3></header>
        <div className="performance-chart-grid">
          <Histogram samples={displaySamples} field="fps" label="Frame throughput" unit="fps" ceiling={120} />
          <Histogram samples={displaySamples} field="p95" label="Frame p95" unit="ms" ceiling={frameBudgetMs * 2} />
          <Histogram samples={displaySamples} field="uiThreadLoad" label="Main-thread pressure" unit="%" ceiling={100} />
        </div>
      </section></VisibilityGate>

      <VisibilityGate item="architecture.performance.budgets"><section className="performance-budget-panel">
        <header><div><span className="mission-kicker">Seuils de performance</span><h3>{passed} / {budgets.length} cibles sous contrôle</h3></div><strong>{Math.round(passed / budgets.length * 100)} %</strong></header>
        <div>{budgets.map(([label, currentValue, target, pass]) => <Budget key={label} label={label} current={currentValue} target={target} pass={pass} />)}</div>
      </section></VisibilityGate>

      <VisibilityGate item="architecture.performance.history"><section className="performance-comparison">
        <header><div><span className="mission-kicker">Régression entre builds</span><h3>Build courant comparé au dernier build mesuré</h3></div></header>
        {previousBuild ? (
          <div className="performance-comparison-grid">
            <span><small>FPS historique</small><strong>{Number(previousBuild.averageFps || 0).toFixed(1)}</strong><em>courant {finite(current.fps, 0).toFixed(1)}</em></span>
            <span><small>p95 historique</small><strong>{Number(previousBuild.averageFrameP95Ms || 0).toFixed(1)} ms</strong><em>courant {finite(current.p95, 0).toFixed(1)} ms</em></span>
            <span><small>API historique</small><strong>{Number(previousBuild.averageApiLatencyMs || 0).toFixed(1)} ms</strong><em>courant {finite(current.apiLatency, 0).toFixed(1)} ms</em></span>
            <span><small>Échantillons</small><strong>{Number(previousBuild.sampleCount || 0)}</strong><em>{previousBuild.buildId}</em></span>
          </div>
        ) : <p className="performance-empty">Pas encore assez de builds historiques pour afficher une comparaison crédible. Aucun chiffre n’est inventé.</p>}
      </section></VisibilityGate>

      <VisibilityGate item="architecture.performance.analysis"><ObservabilityGuide
        title="Analyse du profil courant"
        analysis={`${analysis} La timeline doit être lue par corrélation temporelle : un pic Frame p95 n’est attribué au main thread, au GPU ou à l’API que si le signal correspondant augmente au même instant. Les traits de budget sont des seuils d’ingénierie ; ils ne transforment pas une estimation de pression en pourcentage CPU. Le tableau min/moyenne/p95/max décrit toute la fenêtre sélectionnée, tandis que le journal isole les événements susceptibles d’expliquer une saccade.`}
        note={recording ? "capture live" : "capture figée"}
      /></VisibilityGate>
    </div>
  );
}
