import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Group, Loader, Paper, SimpleGrid, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { apiRequest, isAuthRequiredError } from "../../services/authApi";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
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

export default function AdminAnalyticsPanel() {
  const [from, setFrom] = useState(addDays(new Date(), -30));
  const [to, setTo] = useState(todayIso());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dailyMax = useMemo(
    () => Math.max(...(summary?.dailyVisits ?? []).map((item) => item.pageViews ?? 0), 1),
    [summary?.dailyVisits],
  );

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ recentLimit: "80" });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const data = await apiRequest("GET", `/manager/analytics/summary?${params.toString()}`);
      setSummary(data);
    } catch (loadError) {
      if (isAuthRequiredError(loadError)) {
        setError("Connexion admin requise pour consulter les analytics.");
      } else {
        setError(loadError?.message ?? "Impossible de charger les analytics.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
