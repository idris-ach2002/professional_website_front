import { Badge, Button, Card, Group, Select } from "@mantine/core";

export default function AdminContextCard({ controller }) {
  const {
    owners, versions, selectedOwnerId, selectedVersionId, selectedVersion,
    activeVersionsCount, selectedVersionProjectsCount, selectedVersionExperiencesCount,
    getEntityId, getOwnerLabel, handleOwnerChange, selectVersion, refreshVersions,
    refreshProjects, downloadCurrentVersionJson, openCurrentVersionJsonEditor,
    activateVersionWithValidation, deleteVersion,
  } = controller;

  return (
    <Card padding="md" radius="xl" className="admin-context-card">
      <div className="admin-context-main">
        <div className="admin-context-label"><span>Contexte</span><strong>Où modifiez-vous ?</strong></div>
        <div className="admin-context-selectors">
          <Select
            aria-label="Profil à modifier"
            placeholder="Choisir un profil"
            data={owners.map((owner) => ({ value: String(getEntityId(owner)), label: getOwnerLabel(owner) }))}
            value={selectedOwnerId}
            onChange={handleOwnerChange}
            searchable
          />
          <Select
            aria-label="Version à modifier"
            placeholder="Choisir une version"
            data={versions.map((version) => ({
              value: String(getEntityId(version)),
              label: `${version.versionTag ?? "version"} — ${version.label ?? "Sans label"}${version.active ? " — active" : ""}`,
            }))}
            value={selectedVersionId}
            onChange={(value) => selectVersion(value)}
            searchable
          />
        </div>
        <div className="admin-context-status">
          <Badge color={activeVersionsCount === 1 ? "green" : "red"} variant="light">{activeVersionsCount} active</Badge>
          <span>{selectedVersionProjectsCount} projets · {selectedVersionExperiencesCount} expériences</span>
        </div>
        <details className="admin-context-more">
          <summary>Actions</summary>
          <Group gap="xs">
            <Button size="xs" variant="light" onClick={() => refreshVersions(selectedOwnerId)} disabled={!selectedOwnerId}>Versions</Button>
            <Button size="xs" variant="light" onClick={() => refreshProjects()} disabled={!selectedVersionId}>Projets</Button>
            <Button size="xs" variant="light" onClick={downloadCurrentVersionJson} disabled={!selectedVersionId}>Télécharger JSON</Button>
            <Button size="xs" onClick={openCurrentVersionJsonEditor} disabled={!selectedVersionId}>Éditer JSON</Button>
            <Button size="xs" color="green" onClick={() => activateVersionWithValidation()} disabled={!selectedVersionId || selectedVersion?.active}>Valider & activer</Button>
            <Button size="xs" color="red" variant="light" onClick={() => deleteVersion()} disabled={!selectedVersionId || selectedVersion?.active}>Supprimer</Button>
          </Group>
        </details>
      </div>
    </Card>
  );
}
