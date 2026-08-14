import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Loader } from "@mantine/core";
import { fetchMissionControlSnapshot, fetchPerformanceHistory } from "../../services/engineeringApi";
import ArchitectureObservatory from "../mission-control/ArchitectureObservatory";

function metric(value, suffix = "") {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(number >= 100 ? 0 : 1)}${suffix}` : "—";
}

export default function AdminMissionControlPanel() {
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const [nextSnapshot, nextHistory] = await Promise.all([
        fetchMissionControlSnapshot({ signal }),
        fetchPerformanceHistory(120, { signal }),
      ]);
      setSnapshot(nextSnapshot);
      setHistory(nextHistory);
    } catch (loadError) {
      if (loadError?.name !== "AbortError") setError(loadError?.message ?? "Mission Control indisponible");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const latestBuild = history?.builds?.[0];
  const totalJobs = Object.values(snapshot?.jobs ?? {}).reduce((sum, value) => sum + Number(value || 0), 0);

  return (
    <div className="admin-mission-panel">
      <header className="admin-panel-heading">
        <div><span className="admin-section-kicker">Observabilité réelle</span><h2>Engineering Mission Control</h2><p>Une lecture exploitable du système, sans métrique simulée.</p></div>
        <div className="admin-panel-actions"><Badge color={snapshot?.status === "operational" ? "teal" : "yellow"} variant="light">{snapshot?.status ?? "connexion…"}</Badge><Button variant="light" loading={loading} onClick={() => load()}>Actualiser</Button><Button component="a" href="/engineering">Vue plein écran</Button></div>
      </header>
      {error && <Alert color="orange">{error}</Alert>}
      {loading && !snapshot ? <div className="admin-panel-loader"><Loader /><span>Connexion aux signaux du système…</span></div> : (
        <>
          <section className="admin-mission-metrics">
            <article><span>Base de données</span><strong>{metric(snapshot?.database?.latencyMs, " ms")}</strong><small>{snapshot?.database?.engine ?? "PostgreSQL"}</small></article>
            <article><span>Jobs observés</span><strong>{totalJobs}</strong><small>{snapshot?.jobs?.RUNNING ?? 0} en cours</small></article>
            <article><span>Événements récents</span><strong>{snapshot?.recentEvents?.length ?? 0}</strong><small>transactional outbox</small></article>
            <article><span>Build FPS</span><strong>{metric(latestBuild?.averageFps)}</strong><small>{latestBuild?.buildId ?? "en attente de samples"}</small></article>
          </section>
          <section className="admin-mission-architecture"><div><span className="admin-section-kicker">Chemins actifs</span><h3>Architecture Observatory</h3></div><ArchitectureObservatory snapshot={snapshot} compact /></section>
          <section className="admin-build-history">
            <header><h3>Performance par build</h3><Badge variant="light">{history?.builds?.length ?? 0} builds</Badge></header>
            <div>{(history?.builds ?? []).slice(0, 6).map((build) => <article key={build.buildId}><strong>{build.buildId}</strong><span>{build.sampleCount} samples</span><dl><div><dt>FPS</dt><dd>{metric(build.averageFps)}</dd></div><div><dt>p95</dt><dd>{metric(build.averageFrameP95Ms, " ms")}</dd></div><div><dt>API</dt><dd>{metric(build.averageApiLatencyMs, " ms")}</dd></div></dl></article>)}</div>
          </section>
        </>
      )}
    </div>
  );
}
