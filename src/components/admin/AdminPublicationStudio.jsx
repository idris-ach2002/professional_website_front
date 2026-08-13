import { useEffect } from "react";
import {
  Alert, Badge, Button, Card, Divider, Group, Paper, Progress, Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput, Timeline,
} from "@mantine/core";
import { getEntityId } from "./adminCoreUtils";

const lifecycle = ["DRAFT", "READY", "SCHEDULED", "PUBLISHING", "PUBLISHED", "SUPERSEDED"];
const statusColor = { DRAFT: "gray", READY: "blue", SCHEDULED: "yellow", PUBLISHING: "cyan", PUBLISHED: "green", SUPERSEDED: "violet", FAILED: "red" };
const jobColor = { QUEUED: "gray", RUNNING: "blue", SUCCEEDED: "green", FAILED: "red", RETRYING: "yellow", CANCELLED: "gray" };
const auditColor = {
  VERSION_PUBLISHED: "green",
  VERSION_PUBLISHED_SCHEDULED: "green",
  VERSION_PUBLISHED_RETRY: "green",
  VERSION_PUBLICATION_FAILED: "red",
  WEBSITE_VERSION_ROLLED_BACK: "orange",
  VERSION_DRAFT_AUTOSAVED: "cyan",
};

function fmt(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}


function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AutosaveBadge({ state }) {
  const status = state?.status ?? "idle";
  const config = {
    idle: ["gray", "Autosave en attente"],
    dirty: ["yellow", "Modifications locales"],
    saving: ["blue", "Autosave…"],
    saved: ["green", state?.lastSavedAt ? `Sauvegardé ${fmt(state.lastSavedAt)}` : "Brouillon synchronisé"],
    conflict: ["red", "Conflit de révision"],
    error: ["red", "Autosave en erreur"],
  }[status] ?? ["gray", status];
  return <Badge color={config[0]} variant="light">{config[1]}</Badge>;
}

export default function AdminPublicationStudio({ controller }) {
  const {
    selectedOwnerId, selectedVersionId, selectedVersion, versions,
    publicationJobs, publicationEvents, publicationAudit, publicationDiff,
    publicationCompareVersionId, setPublicationCompareVersionId, publicationScheduleAt, setPublicationScheduleAt,
    publicationDraftMeta, publicationAutosaveState, updatePublicationDraftMeta,
    publishValidationReport, validatePublicationReadiness,
    markVersionReady, publishVersionNow, schedulePublication, cancelScheduledPublication,
    retryPublicationJob, cancelPublicationJob, retryPublicationEvent,
    comparePublicationVersions, rollbackToVersion, refreshPublicationOperationalState, loading,
  } = controller;

  const status = selectedVersion?.publicationStatus ?? (selectedVersion?.active ? "PUBLISHED" : "DRAFT");
  const activeIndex = lifecycle.indexOf(status);
  const scheduleValue = publicationScheduleAt || toLocalDateTimeInput(selectedVersion?.scheduledAt);
  const editableDraft = ["DRAFT", "READY", "FAILED"].includes(status);
  const lifecycleLocked = ["PUBLISHED", "SUPERSEDED", "PUBLISHING"].includes(status);
  const previewUrl = selectedOwnerId && selectedVersionId
    ? `/admin/preview/${encodeURIComponent(selectedOwnerId)}/${encodeURIComponent(selectedVersionId)}?locale=fr`
    : null;
  const compareOptions = versions
    .filter((version) => String(getEntityId(version)) !== String(selectedVersionId))
    .map((version) => ({ value: String(getEntityId(version)), label: `${version.versionTag ?? "version"} — ${version.label ?? "Sans label"}` }));

  useEffect(() => {
    if (!selectedOwnerId) return undefined;
    const refresh = () => {
      if (document.visibilityState === "visible") refreshPublicationOperationalState(selectedOwnerId, selectedVersionId);
    };
    const intervalId = window.setInterval(refresh, 4000);
    return () => window.clearInterval(intervalId);
  }, [selectedOwnerId, selectedVersionId, refreshPublicationOperationalState]);

  return <div data-admin-publication-studio>
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={900} size="lg">Publication Studio</Text>
          <Text size="sm" c="dimmed">Prépare, prévisualise, valide, programme et publie une version sans réécrire l’historique.</Text>
        </div>
        <Group gap="xs"><AutosaveBadge state={publicationAutosaveState} /><Badge color={statusColor[status] ?? "gray"} variant="light">{status}</Badge></Group>
      </Group>

      {!selectedOwnerId || !selectedVersionId ? <Alert color="gray">Sélectionne d’abord un profil et une version.</Alert> : <>
        <Paper withBorder p="lg" radius="lg">
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text fw={800}>{selectedVersion?.versionTag} — {selectedVersion?.label}</Text>
                <Text size="xs" c="dimmed">Révision {selectedVersion?.contentRevision ?? 0} · dernière modification {fmt(selectedVersion?.updatedAt)}</Text>
              </div>
              <Badge variant="outline">{selectedVersion?.active ? "Production active" : "Hors production"}</Badge>
            </Group>
            <Group gap="xs" wrap="wrap">
              {lifecycle.map((step, index) => <Badge key={step} color={activeIndex >= 0 && index <= activeIndex ? (statusColor[step] ?? "blue") : "gray"} variant={step === status ? "filled" : "light"}>{index + 1}. {step}</Badge>)}
            </Group>
            {selectedVersion?.publicationError && <Alert color="red">{selectedVersion.publicationError}</Alert>}
          </Stack>
        </Paper>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Card withBorder radius="lg" padding="lg">
            <Stack gap="md">
              <Group justify="space-between"><Text fw={800}>Brouillon & autosave</Text><AutosaveBadge state={publicationAutosaveState} /></Group>
              <TextInput
                label="Libellé du brouillon"
                value={publicationDraftMeta?.label ?? ""}
                onChange={(event) => updatePublicationDraftMeta("label", event.currentTarget.value)}
                disabled={!editableDraft}
                maxLength={160}
              />
              <Textarea
                label="Description interne"
                value={publicationDraftMeta?.description ?? ""}
                onChange={(event) => updatePublicationDraftMeta("description", event.currentTarget.value)}
                disabled={!editableDraft}
                autosize
                minRows={3}
                maxLength={500}
              />
              {!editableDraft && <Text size="xs" c="dimmed">Les versions programmées/publiées sont figées. Annule la programmation ou crée un nouveau brouillon pour les modifier.</Text>}
              {publicationAutosaveState?.message && <Alert color="red">{publicationAutosaveState.message}</Alert>}
              <Button component="a" href={previewUrl ?? "#"} target="_blank" rel="noopener noreferrer" variant="light" disabled={!previewUrl}>
                Ouvrir l’aperçu sécurisé
              </Button>
            </Stack>
          </Card>

          <Card withBorder radius="lg" padding="lg">
            <Stack gap="md">
              <Group justify="space-between"><Text fw={800}>Pre-Publish Center</Text>{publishValidationReport && <Badge color={publishValidationReport.publishable ? "green" : "red"}>{publishValidationReport.score}/100</Badge>}</Group>
              <Button variant="light" onClick={validatePublicationReadiness}>Lancer toutes les validations</Button>
              {publishValidationReport ? <>
                <Group gap="xs">
                  <Badge color="red" variant="light">{publishValidationReport.blockersCount} blockers</Badge>
                  <Badge color="yellow" variant="light">{publishValidationReport.warningsCount} warnings</Badge>
                  <Badge color="blue" variant="light">{publishValidationReport.suggestionsCount} suggestions</Badge>
                </Group>
                <Stack gap="xs">
                  {publishValidationReport.checks?.map((check) => <Group key={check.id} justify="space-between" align="flex-start" wrap="nowrap">
                    <div><Text size="sm" fw={700}>{check.label}</Text><Text size="xs" c="dimmed">{check.message}</Text></div>
                    <Badge size="xs" color={check.status === "PASS" ? "green" : check.severity === "BLOCKER" ? "red" : "yellow"}>{check.status}</Badge>
                  </Group>)}
                </Stack>
              </> : <Text size="sm" c="dimmed">Contrôle le contenu, les projets, les slugs, les dates, les contacts et les assets avant toute publication.</Text>}
              <Group>
                <Button variant="light" onClick={markVersionReady} loading={loading} disabled={lifecycleLocked || status === "SCHEDULED"}>Valider & marquer READY</Button>
                <Button color="green" onClick={publishVersionNow} loading={loading} disabled={lifecycleLocked || (publishValidationReport && !publishValidationReport.publishable)}>Publier maintenant</Button>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Card withBorder radius="lg" padding="lg"><Stack gap="md"><Text fw={800}>Publication programmée</Text><TextInput type="datetime-local" label="Date et heure locales" value={scheduleValue} onChange={(event) => setPublicationScheduleAt(event.currentTarget.value)} /><Group><Button onClick={schedulePublication} disabled={!publicationScheduleAt || lifecycleLocked} loading={loading}>Programmer</Button><Button variant="light" color="red" onClick={cancelScheduledPublication} disabled={status !== "SCHEDULED"}>Annuler</Button></Group>{selectedVersion?.scheduledAt && <Text size="sm" c="dimmed">Planifiée : {fmt(selectedVersion.scheduledAt)}</Text>}</Stack></Card>
          <Card withBorder radius="lg" padding="lg"><Stack gap="md"><Text fw={800}>Historique, diff & rollback</Text><Select data={compareOptions} value={publicationCompareVersionId} onChange={setPublicationCompareVersionId} placeholder="Version historique" searchable /><Group><Button variant="light" onClick={comparePublicationVersions} disabled={!publicationCompareVersionId}>Calculer le diff</Button><Button color="orange" variant="light" onClick={() => rollbackToVersion()} disabled={!publicationCompareVersionId}>Rollback vers cette version</Button></Group>{publicationDiff && <Text size="sm"><b>{publicationDiff.changeCount}</b> changement(s) détecté(s).</Text>}</Stack></Card>
        </SimpleGrid>

        {publicationDiff?.changes?.length > 0 && <Paper withBorder p="lg" radius="lg"><Stack gap="sm"><Text fw={800}>Diff structurel</Text><Table.ScrollContainer minWidth={720}><Table striped highlightOnHover><Table.Thead><Table.Tr><Table.Th>Chemin</Table.Th><Table.Th>Avant</Table.Th><Table.Th>Après</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{publicationDiff.changes.slice(0, 100).map((change) => <Table.Tr key={`${change.path}-${change.beforeValue}-${change.afterValue}`}><Table.Td><Text size="xs" ff="monospace">{change.path}</Text></Table.Td><Table.Td><Text size="xs" lineClamp={3}>{change.beforeValue ?? "∅"}</Text></Table.Td><Table.Td><Text size="xs" lineClamp={3}>{change.afterValue ?? "∅"}</Text></Table.Td></Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer>{publicationDiff.changeCount > 100 && <Text size="xs" c="dimmed">Affichage limité aux 100 premiers changements.</Text>}</Stack></Paper>}

        <Divider label="Background Job Center" labelPosition="left" />
        <Group justify="space-between"><Text size="sm" c="dimmed">Les opérations longues restent persistées et peuvent reprendre après interruption.</Text><Button size="xs" variant="subtle" onClick={() => refreshPublicationOperationalState()}>Actualiser</Button></Group>
        <Stack gap="sm">{publicationJobs.length === 0 ? <Alert color="gray">Aucun job pour ce profil.</Alert> : publicationJobs.slice(0, 30).map((job) => <Card key={job.id} withBorder padding="md" radius="md"><Stack gap="xs"><Group justify="space-between"><Group gap="xs"><Text fw={800}>{job.type}</Text><Badge color={jobColor[job.status] ?? "gray"} variant="light">{job.status}</Badge><Badge variant="outline">P{job.priority ?? 50}</Badge></Group><Text size="xs" c="dimmed">{fmt(job.createdAt)}</Text></Group><Progress value={job.progress ?? 0} animated={job.status === "RUNNING"} /><Group justify="space-between"><Text size="xs" c="dimmed">Tentative {job.attempts}/{job.maxAttempts} · exécution {fmt(job.executeAfter)} · heartbeat {fmt(job.heartbeatAt)}</Text><Group gap="xs">{job.status === "FAILED" && <Button size="compact-xs" variant="light" onClick={() => retryPublicationJob(job.id)}>Retry</Button>}{["QUEUED", "RETRYING"].includes(job.status) && <Button size="compact-xs" color="red" variant="subtle" onClick={() => cancelPublicationJob(job.id)}>Annuler</Button>}</Group></Group>{job.lastError && <Alert color="red" py="xs">{job.lastError}</Alert>}</Stack></Card>)}</Stack>

        <Divider label="Transactional Outbox / Event Stream" labelPosition="left" />
        <Timeline active={publicationEvents.length ? 0 : -1} bulletSize={18} lineWidth={2}>{publicationEvents.slice(0, 40).map((event) => <Timeline.Item key={event.id} title={<Group gap="xs"><Text size="sm" fw={800}>{event.eventType}</Text><Badge size="xs" variant="light" color={event.status === "DEAD" ? "red" : event.status === "DISPATCHED" ? "green" : "blue"}>{event.status}</Badge>{event.status === "DEAD" && <Button size="compact-xs" variant="light" color="red" onClick={() => retryPublicationEvent(event.id)}>Rejouer</Button>}</Group>}><Text size="xs" c="dimmed">{fmt(event.createdAt)} · tentative {event.attempts} · prochain essai {fmt(event.nextAttemptAt)}</Text><Text size="xs" ff="monospace" lineClamp={2}>{event.payloadJson}</Text>{event.lastError && <Text size="xs" c="red">{event.lastError}</Text>}</Timeline.Item>)}</Timeline>

        <Divider label="Audit immuable" labelPosition="left" />
        <Timeline active={publicationAudit.length ? 0 : -1} bulletSize={18} lineWidth={2}>{publicationAudit.slice(0, 50).map((entry) => <Timeline.Item key={entry.id} title={<Group gap="xs"><Text size="sm" fw={800}>{entry.action}</Text><Badge size="xs" color={auditColor[entry.action] ?? "gray"} variant="light">{entry.actor}</Badge></Group>}><Stack gap={4}><Text size="xs" c="dimmed">{fmt(entry.createdAt)} · correlation {entry.correlationId ?? "—"}</Text>{entry.metadataJson && entry.metadataJson !== "{}" && <Text size="xs" ff="monospace" lineClamp={2}>{entry.metadataJson}</Text>}{(entry.beforeJson || entry.afterJson) && <details><summary>Inspecter avant / après</summary><Stack gap={4} mt="xs"><Text size="xs" fw={700}>Avant</Text><Text size="xs" ff="monospace" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{entry.beforeJson ?? "∅"}</Text><Text size="xs" fw={700}>Après</Text><Text size="xs" ff="monospace" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{entry.afterJson ?? "∅"}</Text></Stack></details>}</Stack></Timeline.Item>)}</Timeline>
      </>}
    </Stack>
  </div>;
}
