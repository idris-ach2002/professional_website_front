import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Group, Loader, Paper, SimpleGrid, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { apiRequest, isAbortError, isAuthRequiredError } from "../../services/authApi";
import { fetchPerformanceHistory } from "../../services/engineeringApi";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}


async function fetchAnalyticsSummary(from, to, signal) {
  const params = new URLSearchParams({ recentLimit: "80" });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return apiRequest("GET", `/manager/analytics/summary?${params.toString()}`, null, { signal });
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function MetricCard({ label, value, detail }) {
  return (
    <Paper withBorder radius="xl" p="lg" className="analytics-metric-card">
      <Text size="xs" tt="uppercase" fw={800} c="dimmed" className="analytics-metric-label">{label}</Text>
      <Text fw={900} className="analytics-metric-value">{value ?? 0}</Text>
      {detail && <Text size="sm" c="dimmed">{detail}</Text>}
    </Paper>
  );
}

function MetricList({ title, items = [] }) {
  const max = Math.max(...items.map((item) => item.value ?? 0), 1);

  return (
    <Card withBorder radius="xl" p="lg" className="analytics-list-card">
      <Title order={4}>{title}</Title>
      <Stack gap="sm" mt="md">
        {items.length === 0 && <Text c="dimmed">Aucune donnée.</Text>}
        {items.map((item) => (
          <div className="analytics-bar-row" key={`${title}-${item.label}`}>
            <Group justify="space-between" gap="sm" wrap="nowrap">
              <Text size="sm" fw={700} className="analytics-bar-label">{item.label || "Non renseigné"}</Text>
              <Badge variant="light" color="cyan">{item.value}</Badge>
            </Group>
            <div className="analytics-bar-track">
              <div className="analytics-bar-fill" style={{ width: `${Math.max(6, ((item.value ?? 0) / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </Stack>
    </Card>
  );
}

function AdvancedJourneyAnalytics({ summary, performanceHistory }) {
  const actions = Number(summary.cvClicks || 0) + Number(summary.githubClicks || 0) + Number(summary.linkedinClicks || 0);
  const funnel = [
    { label: "Visiteurs", value: Number(summary.uniqueVisitors || 0) },
    { label: "Projets consultés", value: Number(summary.projectViews || 0) },
    { label: "Actions qualifiées", value: actions },
  ];
  const maxFunnel = Math.max(...funnel.map((item) => item.value), 1);
  const sources = (summary.topSources ?? []).slice(0, 4);
  const sourceTotal = Math.max(sources.reduce((total, item) => total + Number(item.value || 0), 0), 1);
  const latestBuild = performanceHistory?.builds?.[0];

  return (
    <section className="advanced-analytics-grid" aria-label="Parcours et performance croisés">
      <Card withBorder radius="xl" p="lg" className="advanced-funnel-card">
        <Group justify="space-between"><Title order={4}>Funnel d’engagement</Title><Badge variant="light">signaux réels</Badge></Group>
        <Text size="sm" c="dimmed" mt={4}>Du premier contact aux actions à forte intention.</Text>
        <div className="advanced-funnel">
          {funnel.map((stage, index) => (
            <div key={stage.label} style={{ "--funnel-width": `${Math.max(34, stage.value / maxFunnel * 100)}%` }}>
              <span>{index + 1}</span><strong>{stage.label}</strong><b>{stage.value}</b>
              <small>{index === 0 ? "base" : `${Math.round(stage.value / Math.max(funnel[0].value, 1) * 100)} % des visiteurs`}</small>
            </div>
          ))}
        </div>
      </Card>

      <Card withBorder radius="xl" p="lg" className="advanced-flow-card">
        <Group justify="space-between"><Title order={4}>Flux d’acquisition</Title><Badge color="cyan" variant="light">Sankey</Badge></Group>
        <Text size="sm" c="dimmed" mt={4}>Les sources observées convergent vers le contenu puis vers les actions.</Text>
        <div className="advanced-flow">
          <div className="advanced-flow-sources">
            {sources.length === 0 && <span>Aucune source</span>}
            {sources.map((source) => <span key={source.label} style={{ "--flow": Math.max(2, Math.round(source.value / sourceTotal * 12)) }}>{source.label || "Direct"}<b>{source.value}</b></span>)}
          </div>
          <i aria-hidden="true" />
          <strong>Portfolio<small>{summary.pageViews ?? 0} vues</small></strong>
          <i aria-hidden="true" />
          <div className="advanced-flow-outcomes"><span>Projets <b>{summary.projectViews ?? 0}</b></span><span>CV <b>{summary.cvClicks ?? 0}</b></span><span>Réseaux <b>{Number(summary.githubClicks || 0) + Number(summary.linkedinClicks || 0)}</b></span></div>
        </div>
      </Card>

      <Card withBorder radius="xl" p="lg" className="advanced-correlation-card">
        <Group justify="space-between"><Title order={4}>Performance × usage</Title><Badge color={latestBuild ? "teal" : "gray"} variant="light">{latestBuild?.buildId ?? "aucun build"}</Badge></Group>
        <Text size="sm" c="dimmed" mt={4}>La qualité technique du dernier build rapprochée de l’usage sur la période.</Text>
        <div className="advanced-correlation-matrix">
          <article><span>FPS moyen</span><strong>{latestBuild?.averageFps?.toFixed?.(1) ?? "—"}</strong><small>{Number(latestBuild?.averageFps || 0) >= 55 ? "fluide" : "à surveiller"}</small></article>
          <article><span>Frame p95</span><strong>{latestBuild ? `${latestBuild.averageFrameP95Ms.toFixed(1)} ms` : "—"}</strong><small>rendu navigateur</small></article>
          <article><span>Latence API</span><strong>{latestBuild ? `${latestBuild.averageApiLatencyMs.toFixed(1)} ms` : "—"}</strong><small>{summary.pageViews ?? 0} pages vues</small></article>
          <article><span>Intention</span><strong>{actions}</strong><small>{summary.projectViews ?? 0} vues projets</small></article>
        </div>
      </Card>
    </section>
  );
}

export default function AdminAnalyticsPanel() {
  const [from, setFrom] = useState(addDays(new Date(), -30));
  const [to, setTo] = useState(todayIso());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState(null);
  const initialRangeRef = useRef({ from, to });
  const requestRef = useRef(null);

  const dailyMax = useMemo(
    () => Math.max(...(summary?.dailyVisits ?? []).map((item) => item.pageViews ?? 0), 1),
    [summary?.dailyVisits],
  );

  const loadAnalyticsRange = useCallback(async (rangeFrom, rangeTo) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsSummary(rangeFrom, rangeTo, controller.signal);
      if (!controller.signal.aborted && requestRef.current === controller) setSummary(data);
    } catch (loadError) {
      if (isAbortError(loadError)) return;
      if (requestRef.current !== controller) return;
      if (isAuthRequiredError(loadError)) {
        setError("Connexion admin requise pour consulter les analytics.");
      } else {
        setError(loadError?.message ?? "Impossible de charger les analytics.");
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  const loadAnalytics = useCallback(() => loadAnalyticsRange(from, to), [from, loadAnalyticsRange, to]);

  useEffect(() => {
    const initialRange = initialRangeRef.current;
    loadAnalyticsRange(initialRange.from, initialRange.to);
    const controller = new AbortController();
    fetchPerformanceHistory(120, { signal: controller.signal }).then(setPerformanceHistory).catch(() => {});
    return () => {
      controller.abort();
      requestRef.current?.abort();
    };
  }, [loadAnalyticsRange]);

  return (
    <TabsPanelShell>
      <Stack gap="xl" className="admin-analytics-panel">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={3}>Analytics portfolio</Title>
            <Text c="dimmed" mt={4}>
              Visites, sources, devices, clics CV/GitHub/LinkedIn et liens recruteurs personnalisés.
            </Text>
          </div>
          <Group align="flex-end">
            <TextInput type="date" label="Du" value={from} onChange={(event) => setFrom(event.currentTarget.value)} />
            <TextInput type="date" label="Au" value={to} onChange={(event) => setTo(event.currentTarget.value)} />
            <Button onClick={loadAnalytics} loading={loading}>Actualiser</Button>
          </Group>
        </Group>

        {error && <Alert color="red" radius="lg">{error}</Alert>}
        {loading && !summary && (
          <Group justify="center" py="xl">
            <Loader />
            <Text>Chargement des analytics…</Text>
          </Group>
        )}

        {summary && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              <MetricCard label="Visiteurs uniques" value={summary.uniqueVisitors} detail="IDs anonymisés" />
              <MetricCard label="Pages vues" value={summary.pageViews} detail="hors admin" />
              <MetricCard label="Sessions" value={summary.sessions} detail="session navigateur" />
              <MetricCard label="Événements" value={summary.totalEvents} detail={`${summary.from} → ${summary.to}`} />
              <MetricCard label="Clics CV" value={summary.cvClicks} />
              <MetricCard label="Clics GitHub" value={summary.githubClicks} />
              <MetricCard label="Clics LinkedIn" value={summary.linkedinClicks} />
              <MetricCard label="Vues projets" value={summary.projectViews} />
            </SimpleGrid>

            <AdvancedJourneyAnalytics summary={summary} performanceHistory={performanceHistory} />

            <Card withBorder radius="xl" p="lg" className="analytics-list-card">
              <Group justify="space-between" align="center">
                <Title order={4}>Évolution journalière</Title>
                <Badge variant="light" color="blue">{summary.dailyVisits?.length ?? 0} jours</Badge>
              </Group>
              <div className="analytics-daily-chart">
                {(summary.dailyVisits ?? []).map((item) => (
                  <div className="analytics-daily-column" key={item.date} title={`${item.date} — ${item.pageViews} vues`}>
                    <div
                      className="analytics-daily-bar"
                      style={{ height: `${Math.max(4, ((item.pageViews ?? 0) / dailyMax) * 100)}%` }}
                    />
                    <span>{String(item.date).slice(5)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
              <MetricList title="Pages principales" items={summary.topPages} />
              <MetricList title="Projets consultés" items={summary.topProjects} />
              <MetricList title="Sources" items={summary.topSources} />
              <MetricList title="Devices" items={summary.devices} />
              <MetricList title="Navigateurs" items={summary.browsers} />
              <MetricList title="Liens recruteurs" items={summary.recruiters} />
            </SimpleGrid>

            <Card withBorder radius="xl" p="lg" className="analytics-list-card">
              <Title order={4}>Dernières visites</Title>
              <Table.ScrollContainer minWidth={900} mt="md">
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Événement</Table.Th>
                      <Table.Th>Page</Table.Th>
                      <Table.Th>Source</Table.Th>
                      <Table.Th>Device</Table.Th>
                      <Table.Th>Recruteur</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(summary.recentEvents ?? []).map((event) => (
                      <Table.Tr key={event.id}>
                        <Table.Td>{formatDateTime(event.createdAt)}</Table.Td>
                        <Table.Td><Badge variant="light">{event.eventType}</Badge></Table.Td>
                        <Table.Td>{event.pagePath || "—"}</Table.Td>
                        <Table.Td>{event.source || "—"}</Table.Td>
                        <Table.Td>{event.deviceType || "—"} / {event.browser || "—"}</Table.Td>
                        <Table.Td>{event.recruiterCode || "—"}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Card>
          </>
        )}
      </Stack>
    </TabsPanelShell>
  );
}

function TabsPanelShell({ children }) {
  return children;
}
