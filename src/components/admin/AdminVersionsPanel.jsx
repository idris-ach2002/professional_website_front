import { Badge, Button, Card, Divider, Group, Paper, Select, SimpleGrid, Stack, Switch, Tabs, Text, Textarea, TextInput } from "@mantine/core";
import { getEntityId } from "./adminCore";

export default function AdminVersionsPanel(props) {
  const {
    versionForm,
    updateVersionForm,
    versions,
    cloneSourceVersionId,
    setCloneSourceVersionId,
    cloneVersion,
    selectedOwnerId,
    createVersion,
    updateVersionMetadata,
    selectedVersionId,
    selectVersion,
    activateVersionWithValidation
  } = props;

  return (
            <Tabs.Panel value="version" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Créer, cloner ou modifier une version</Text>
                    <Text size="sm" c="dimmed">
                      Pour éviter de retaper profil, timeline et projets, crée une version en important le contenu d’une version source.
                    </Text>
                  </div>
                  <Badge variant="light">Version</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Version tag" value={versionForm.versionTag} onChange={(event) => updateVersionForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label" value={versionForm.label} onChange={(event) => updateVersionForm("label", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description" minRows={3} value={versionForm.description} onChange={(event) => updateVersionForm("description", event.currentTarget.value)} />

                <Group>
                  <Switch label="Active à la création" checked={versionForm.active} onChange={(event) => updateVersionForm("active", event.currentTarget.checked)} />
                  <Switch label="Published" checked={versionForm.published} onChange={(event) => updateVersionForm("published", event.currentTarget.checked)} />
                </Group>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Créer une version depuis une version existante</Text>
                        <Text size="sm" c="dimmed">
                          Copie automatiquement le profil, le CV, les images, la timeline et tous les projets.
                        </Text>
                      </div>
                      <Badge variant="light">Import</Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <Select
                        label="Version source à importer"
                        placeholder="Choisir une version source"
                        data={versions.map((version) => ({
                          value: String(getEntityId(version)),
                          label: `${version.versionTag ?? "version"} — ${version.label ?? "Sans label"}`,
                        }))}
                        value={cloneSourceVersionId}
                        onChange={setCloneSourceVersionId}
                        searchable
                      />

                      <Button
                        onClick={cloneVersion}
                        disabled={!selectedOwnerId || !cloneSourceVersionId}
                      >
                        Créer en important la version source
                      </Button>
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <Group>
                  <Button onClick={createVersion} disabled={!selectedOwnerId} variant="light">
                    Créer depuis les formulaires actuels
                  </Button>
                  <Button variant="light" onClick={updateVersionMetadata} disabled={!selectedOwnerId || !selectedVersionId}>
                    Modifier métadonnées
                  </Button>
                </Group>

                <Divider />

                <Stack gap="sm">
                  {versions.map((version) => (
                    <Card key={getEntityId(version)} withBorder padding="md" radius="lg" className="admin-version-card">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Group gap="xs">
                            <Text fw={800}>{version.versionTag} — {version.label}</Text>
                            {version.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}
                          </Group>
                          <Text size="sm" c="dimmed">{version.description}</Text>
                          <Text size="xs" c="dimmed">
                            {(version.projects ?? []).length} projet(s) · {(version.timeline?.experiences ?? []).length} expérience(s)
                          </Text>
                        </div>

                        <Group>
                          <Button size="xs" variant="light" onClick={() => selectVersion(String(getEntityId(version)))}>
                            Sélectionner
                          </Button>
                          <Button size="xs" color="green" variant="light" disabled={version.active} onClick={() => activateVersionWithValidation(getEntityId(version))}>
                            Valider & activer
                          </Button>
                          <Button size="xs" variant="subtle" onClick={() => setCloneSourceVersionId(String(getEntityId(version)))}>
                            Source
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

  );
}
