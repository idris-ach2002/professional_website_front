import { Badge, Button, Card, Group, Select, SimpleGrid, Stack, Text } from "@mantine/core";

export default function AdminContextCard({ controller }) {
  const {
    owners,
    versions,
    selectedOwnerId,
    selectedVersionId,
    selectedVersion,
    activeVersionsCount,
    selectedVersionProjectsCount,
    selectedVersionExperiencesCount,
    getEntityId,
    getOwnerLabel,
    handleOwnerChange,
    selectVersion,
    refreshVersions,
    refreshProjects,
    downloadCurrentVersionJson,
    openCurrentVersionJsonEditor,
    activateVersionWithValidation,
    deleteVersion,
  } = controller;

  return (
    <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-context-card">
      <Stack>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={800}>Contexte de modification</Text>
            <Text size="sm" c="dimmed">
              Sélectionne un profil, une version, puis modifie ses blocs de contenu.
            </Text>
          </div>

          <Group gap="xs">
            <Badge color={activeVersionsCount === 1 ? "green" : "red"} variant="light">
              {activeVersionsCount} active
            </Badge>
            <Badge variant="light">
              {versions.length} version{versions.length > 1 ? "s" : ""}
            </Badge>
            <Badge variant="light">
              {selectedVersionProjectsCount} projet{selectedVersionProjectsCount > 1 ? "s" : ""}
            </Badge>
            <Badge variant="light">
              {selectedVersionExperiencesCount} expérience{selectedVersionExperiencesCount > 1 ? "s" : ""}
            </Badge>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Select
            label="Profil"
            placeholder="Choisir un profil"
            data={owners.map((owner) => ({
              value: String(getEntityId(owner)),
              label: getOwnerLabel(owner),
            }))}
            value={selectedOwnerId}
            onChange={handleOwnerChange}
            searchable
          />

          <Select
            label="Version"
            placeholder="Choisir une version"
            data={versions.map((version) => ({
              value: String(getEntityId(version)),
              label: `${version.versionTag ?? "version"} — ${
                version.label ?? "Sans label"
              }${version.active ? " — active" : ""}`,
            }))}
            value={selectedVersionId}
            onChange={(value) => selectVersion(value)}
            searchable
          />
        </SimpleGrid>

        <Group>
          <Button
            variant="light"
            onClick={() => refreshVersions(selectedOwnerId)}
            disabled={!selectedOwnerId}
          >
            Recharger versions
          </Button>

          <Button
            variant="light"
            onClick={() => refreshProjects()}
            disabled={!selectedOwnerId || !selectedVersionId}
          >
            Recharger projets
          </Button>

          <Button
            variant="light"
            onClick={downloadCurrentVersionJson}
            disabled={!selectedOwnerId || !selectedVersionId}
          >
            Télécharger JSON
          </Button>

          <Button
            variant="filled"
            onClick={openCurrentVersionJsonEditor}
            disabled={!selectedOwnerId || !selectedVersionId}
          >
            Éditer JSON
          </Button>

          <Button
            color="green"
            onClick={() => activateVersionWithValidation()}
            disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}
          >
            Valider & activer
          </Button>

          <Button
            color="red"
            variant="light"
            onClick={() => deleteVersion()}
            disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}
          >
            Supprimer version inactive
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
