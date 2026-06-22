import { Alert, Badge, Button, Divider, FileInput, Group, Paper, SimpleGrid, Stack, Tabs, Text, Textarea } from "@mantine/core";

export default function AdminImportPanel(props) {
  const {
    jsonImportFile,
    setJsonImportFile,
    importJsonFromFile,
    loading,
    jsonImportText,
    setJsonImportText,
    importJsonFromText,
    jsonImportSummary
  } = props;

  return (
            <Tabs.Panel value="import" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Import automatique depuis un JSON</Text>
                    <Text size="sm" c="dimmed">
                      Le JSON préremplit les formulaires owner, version, profil, timeline et projets. Les images et PDF restent remplaçables avec les champs d’upload existants.
                    </Text>
                  </div>
                  <Badge variant="light">Préremplissage</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                    <Stack gap="md">
                      <Text fw={800}>Importer un fichier</Text>
                      <Text size="sm" c="dimmed">
                        Utilise un fichier JSON complet pour automatiser la saisie, puis ajuste les champs avant de créer ou sauvegarder la version.
                      </Text>
                      <FileInput
                        label="Fichier JSON"
                        placeholder="portfolio-import.json"
                        accept="application/json,.json"
                        value={jsonImportFile}
                        onChange={setJsonImportFile}
                      />
                      <Group>
                        <Button onClick={importJsonFromFile} loading={loading} disabled={!jsonImportFile}>
                          Importer dans le formulaire
                        </Button>
                        <Button
                          component="a"
                          href="/examples/portfolio-import-idris-complet.json"
                          download
                          variant="light"
                        >
                          Télécharger un exemple complet
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>

                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                    <Stack gap="md">
                      <Text fw={800}>Ou coller un JSON</Text>
                      <Text size="sm" c="dimmed">
                        Pratique pour tester rapidement un contenu généré avant de l’enregistrer côté backend.
                      </Text>
                      <Textarea
                        label="JSON brut"
                        placeholder='{"name":"ACHABOU","firstName":"Idris","projects":[]}'
                        minRows={9}
                        value={jsonImportText}
                        onChange={(event) => setJsonImportText(event.currentTarget.value)}
                      />
                      <Group>
                        <Button variant="light" onClick={importJsonFromText}>
                          Importer le JSON collé
                        </Button>
                        <Button variant="subtle" onClick={() => setJsonImportText("")}>
                          Vider
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                {jsonImportSummary && (
                  <Alert color="green" variant="light" className="admin-alert">
                    Import chargé : version {jsonImportSummary.versionTag} — {jsonImportSummary.versionLabel}. {jsonImportSummary.contacts} contact(s), {jsonImportSummary.experiences} expérience(s), {jsonImportSummary.projects} projet(s), dont {jsonImportSummary.featuredProjects} featured et {jsonImportSummary.publishedProjects} publié(s).
                  </Alert>
                )}

                <Alert variant="light" className="admin-alert">
                  Après import, va dans les onglets Profil & fichiers, Timeline et Projets pour contrôler les champs. Ensuite tu peux créer un owner, créer une nouvelle version, ou activer la version selon ton workflow habituel.
                </Alert>
              </Stack>
            </Tabs.Panel>

  );
}
