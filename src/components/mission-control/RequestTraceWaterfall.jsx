import { useMemo, useState } from "react";
import { bytes } from "../../engineering/engineeringTelemetry";
import ObservabilityGuide from "./ObservabilityGuide";

const LABELS = Object.freeze({ dns: "DNS", connect: "Connexion", server: "Spring", response: "Téléchargement", render: "React" });

function buildSegments(trace, renderMs) {
  if (!trace) return [];
  const fixed = [
    { id: "dns", label: "DNS", durationMs: trace.dnsMs, source: "navigateur" },
    { id: "connect", label: "Connexion", durationMs: trace.connectMs, source: "navigateur" },
  ].filter((item) => item.durationMs > .05);
  const server = trace.serverTiming?.length
    ? trace.serverTiming.map((item) => ({ id: `server-${item.name}`, label: item.description || item.name, durationMs: item.durationMs, source: "Server-Timing" }))
    : [{ id: "server", label: "Réseau + Spring", durationMs: Math.max(0, trace.totalMs - trace.downloadMs - fixed.reduce((sum, item) => sum + item.durationMs, 0)), source: "mesure agrégée" }];
  const download = trace.downloadMs > .05 ? [{ id: "response", label: "JSON", durationMs: trace.downloadMs, source: "navigateur" }] : [];
  return [...fixed, ...server, ...download, { id: "render", label: "React", durationMs: Math.max(.1, Number(renderMs || 0)), source: "navigateur" }];
}

function destination(trace) {
  try { return new URL(trace.url).host; } catch { return "API Spring"; }
}

function requestRoute(trace) {
  if (!trace) return [];
  const dependencies = (trace.calledComponents?.length ? trace.calledComponents : trace.payloadSignals ?? [])
    .filter((label) => !/^spring$/i.test(label))
    .map((label, index) => ({ id: `dependency-${index}`, label, kind: "dependency", detail: "Composant confirmé par la trace backend." }));
  return [
    { id: "browser", label: "Navigateur", kind: "origin", detail: trace.clientOrigin ?? "Origine de la requête" },
    { id: "react", label: "React", kind: "front", detail: trace.initiator ?? "Composant initiateur" },
    { id: "network", label: destination(trace), kind: "network", detail: "Transport HTTPS / JSON" },
    { id: "security", label: "Spring Security", kind: "security", detail: "FilterChain, CORS et contrôles HTTP" },
    { id: "endpoint", label: trace.path, kind: "endpoint", detail: `${trace.method ?? "GET"} · endpoint capturé` },
    ...dependencies,
    { id: "json", label: "JSON", kind: "response", detail: `${bytes(trace.decodedBodyBytes)} décodés` },
    { id: "interface", label: "Interface", kind: "front", detail: "Mise à jour React et rendu navigateur" },
  ];
}

function Fact({ label, value, note }) {
  return <div className="trace-fact"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function orbitPoints(count) {
  const safeCount = Math.max(1, count);
  const cx = 50;
  const cy = 50;
  const rx = 42;
  const ry = 39;
  return Array.from({ length: safeCount }, (_, index) => {
    const angle = -Math.PI / 2 + index / safeCount * Math.PI * 2;
    return {
      angle,
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    };
  });
}

function curvedOrbitPath(a, b) {
  const middleAngle = (a.angle + b.angle) / 2;
  const controlRadiusX = 43;
  const controlRadiusY = 40;
  const controlX = 50 + Math.cos(middleAngle) * controlRadiusX;
  const controlY = 50 + Math.sin(middleAngle) * controlRadiusY;
  return `M ${a.x} ${a.y} Q ${controlX} ${controlY} ${b.x} ${b.y}`;
}

function RequestOrbit({ route, trace, selectedIndex, onSelect }) {
  const points = useMemo(() => orbitPoints(route.length), [route.length]);
  const selected = route[selectedIndex] ?? route[0];
  return (
    <section className="request-orbit" aria-label="Anneau du chemin applicatif de la requête">
      <div className="request-orbit-stage" role="img" aria-label="Anneau interactif des services traversés par la requête capturée">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="request-orbit-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" /></marker>
          </defs>
          <ellipse className="request-orbit-base" cx="50" cy="50" rx="42" ry="39" />
          {route.slice(0, -1).map((step, index) => {
            const a = points[index];
            const b = points[index + 1];
            return <path key={`${step.id}-${route[index + 1]?.id}`} className="request-orbit-flow" d={curvedOrbitPath(a, b)} markerEnd="url(#request-orbit-arrow)" />;
          })}
        </svg>

        <div className="request-orbit-core">
          <span>Requête capturée</span>
          <strong>{trace.operation ?? `${trace.method} ${trace.path}`}</strong>
          <code>{trace.method} {trace.path}</code>
          <div className="request-orbit-selected" aria-live="polite">
            <small>Étape {String(selectedIndex + 1).padStart(2, "0")} / {String(route.length).padStart(2, "0")}</small>
            <b>{selected?.label ?? "—"}</b>
            <p>{selected?.detail ?? "Sélectionnez un service autour de l’anneau."}</p>
          </div>
          <footer><span>{trace.status}</span><span>{trace.totalMs.toFixed(1)} ms</span><span>{bytes(trace.transferBytes)}</span></footer>
        </div>

        {route.map((step, index) => {
          const point = points[index];
          return (
            <button
              type="button"
              key={`${step.id}-${index}`}
              className={`request-orbit-node is-${step.kind}${selectedIndex === index ? " is-selected" : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onSelect(index)}
              aria-label={`Étape ${index + 1}, ${step.label}`}
            >
              <i>{String(index + 1).padStart(2, "0")}</i>
              <b>{step.label}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function RequestTraceWaterfall({ trace, renderMs = 0 }) {
  const traceKey = `${trace?.id ?? "none"}:${trace?.path ?? ""}`;
  const [selection, setSelection] = useState(() => ({ key: traceKey, index: 0 }));
  const selectedStep = selection.key === traceKey ? selection.index : 0;
  const selectStep = (index) => setSelection({ key: traceKey, index });
  const segments = buildSegments(trace, renderMs);
  const route = useMemo(() => requestRoute(trace), [trace]);
  const total = segments.reduce((sum, item) => sum + item.durationMs, 0) || 1;
  const critical = segments.toSorted((a, b) => b.durationMs - a.durationMs)[0];
  const timedSegments = segments.map((segment, index) => ({
    ...segment,
    left: segments.slice(0, index).reduce((sum, item) => sum + item.durationMs, 0) / total * 100,
    width: Math.max(1.5, segment.durationMs / total * 100),
  }));


  return <div className="trace-console">
    <div className="trace-head">
      <div><span className="mission-kicker">Requête capturée</span><h3>{trace?.operation ?? "En attente d’une requête"}</h3>{trace && <code>{trace.method} {trace.path}</code>}</div>
      <div className="trace-response-summary"><strong>{trace ? `${trace.status} · ${trace.totalMs.toFixed(0)} ms` : "—"}</strong><span>{trace?.contentType ?? "aucune réponse"}</span></div>
    </div>
    {trace ? <>
      <div className="trace-facts" aria-label="Identité et consommation de la requête">
        <Fact label="Origine" value={trace.clientOrigin ?? "navigateur"} note={trace.initiator} />
        <Fact label="Destination" value={destination(trace)} note="HTTPS / JSON" />
        <Fact label="Réseau" value={bytes(trace.transferBytes)} note={`${bytes(trace.decodedBodyBytes)} décodés`} />
        <Fact label="Coût observé" value={`${trace.totalMs.toFixed(1)} ms`} note={`rendu ${Number(renderMs || 0).toFixed(1)} ms · CPU exact non exposé`} />
      </div>

      <RequestOrbit route={route} trace={trace} selectedIndex={Math.min(selectedStep, Math.max(0, route.length - 1))} onSelect={selectStep} />

      <div className="trace-route" aria-label="Parcours temporel mesuré">{segments.map((segment) => <span key={segment.id} className={segment.id === critical?.id ? "is-critical" : ""}><i />{LABELS[segment.id] ?? segment.label}<b>{segment.durationMs.toFixed(1)} ms</b></span>)}</div>
      <div className="waterfall" role="img" aria-label="Waterfall full-stack de la dernière requête">
        {timedSegments.map((segment) => <div className={segment.id === critical?.id ? "is-critical" : ""} key={segment.id}><span>{segment.label}<small>{segment.source}</small></span><i><b style={{ marginLeft: `${segment.left}%`, width: `${segment.width}%` }} /></i><strong>{segment.durationMs.toFixed(1)} ms</strong></div>)}
      </div>
      <p className="trace-diagnosis"><b>Analyse :</b> {critical?.label} concentre {Math.round(critical?.durationMs / total * 100)} % du chemin mesuré. {trace.serverTiming?.length ? "Le serveur fournit son découpage interne." : "Le détail interne Spring exige Server-Timing ou OpenTelemetry ; il n’est pas simulé."}</p>
      <ObservabilityGuide
        title="Analyse du temps de réponse"
        analysis={`${critical?.label ?? "Aucune phase"} est la phase dominante de cette trace${critical ? ` avec ${Math.round(critical.durationMs / total * 100)} % du temps mesuré` : ""}. L’anneau répartit ${route.length} étapes sur une seule surface : chaque segment est sélectionnable et la fiche centrale conserve le contexte sans imposer de défilement horizontal. ${trace.serverTiming?.length ? "Le découpage backend provient de Server-Timing." : "Le serveur ne fournit pas encore de sous-durées exploitables pour cette réponse."}`}
        note="trace HTTP"
      />
    </> : <><div className="trace-empty">La prochaine sonde API dessinera son origine, ses appels, sa consommation et sa réponse.</div><ObservabilityGuide title="Analyse du temps de réponse" analysis="Aucune requête n’est encore disponible pour l’analyse." note="en attente" /></>}
  </div>;
}
