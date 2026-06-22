import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";

export default function AdminSafetyPanel(props) {
  const {
    portfolioHealthReport,
    publishValidationReport,
    runPortfolioHealthCheck,
    validatePortfolioBeforePublish,
    activateVersionWithValidation,
    selectedOwnerId,
    selectedVersionId,
    selectedVersion,
    portfolioBackupUrl,
    portfolioBackupJson,
    exportPortfolioBackupZip,
    downloadTextFile,
    portfolioRestoreLabel,
    setPortfolioRestoreLabel,
    restorePortfolioBackup,
    portfolioRestoreText,
    setPortfolioRestoreText
  } = props;

  function renderPortfolioHealthReport(report) {
    if (!report) {
      return <Alert color="gray" variant="light">Aucun rapport lancé pour cette version.</Alert>;
    }

    const scoreColor = report.score >= 85 ? "green" : report.score >= 65 ? "yellow" : "red";
    return (
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge color={scoreColor} size="lg">Score {report.score}/100</Badge>
            <Badge color={report.publishable ? "green" : "red"} variant="light">
              {report.publishable ? "publiable" : "bloqué"}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {report.blockersCount ?? 0} bloquant(s) · {report.warningsCount ?? 0} alerte(s) · {report.suggestionsCount ?? 0} suggestion(s)
          </Text>
        </Group>
        <Stack gap="xs">
          {(report.checks ?? []).map((check) => {
            const failed = check.status === "FAIL";
            const color = !failed ? "green" : check.severity === "BLOCKER" ? "red" : check.severity === "WARNING" ? "yellow" : "blue";
            return (
              <Alert key={check.id} color={color} variant="light" className="admin-health-check">
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div>
                    <Text fw={800}>{check.label}</Text>
                    <Text size="sm">{check.message}</Text>
                  </div>
                  <Badge color={color} variant="filled">{failed ? check.severity : "OK"}</Badge>
                </Group>
              </Alert>
            );
          })}
        </Stack>
      </Stack>
    );
  }
  return (
            <Tabs.Panel value="safety" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={900}>Santé, sauvegarde et publication contrôlée</Text>
                    <Text size="sm" c="dimmed">
                      Contrôle la qualité d’une version avant activation, exporte un backup reproductible et restaure une version sans écraser l’existant.
                    </Text>
                  </div>
                  <Badge variant="light">Qualité admin</Badge>
                </Group>

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel admin-safety-panel">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>Contrôle santé portfolio</Text>
                          <Text size="sm" c="dimmed">Vérifie profil, contacts, timeline, projets publiés, images, liens et cohérence de publication.</Text>
                        </div>
                        {portfolioHealthReport && <Badge color={portfolioHealthReport.publishable ? "green" : "red"}>{portfolioHealthReport.score}/100</Badge>}
                      </Group>
                      <Group>
                        <Button variant="light" onClick={runPortfolioHealthCheck} disabled={!selectedOwnerId || !selectedVersionId}>Lancer le contrôle</Button>
                        <Button variant="light" onClick={validatePortfolioBeforePublish} disabled={!selectedOwnerId || !selectedVersionId}>Validation publication</Button>
                        <Button color="green" onClick={() => activateVersionWithValidation()} disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}>Valider & activer</Button>
                      </Group>
                      {renderPortfolioHealthReport(portfolioHealthReport ?? publishValidationReport)}
                    </Stack>
                  </Paper>

                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel admin-safety-panel">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>Backup complet version</Text>
                          <Text size="sm" c="dimmed">Génère un ZIP backend contenant portfolio.json, metadata.json et un snapshot restaurable.</Text>
                        </div>
                        {portfolioBackupUrl && <Badge color="green" variant="light">backup prêt</Badge>}
                      </Group>
                      <Group>
                        <Button variant="light" onClick={exportPortfolioBackupZip} disabled={!selectedOwnerId || !selectedVersionId}>Exporter backup ZIP</Button>
                        {portfolioBackupUrl && <Button component="a" href={portfolioBackupUrl} target="_blank" rel="noreferrer">Télécharger ZIP</Button>}
                        {portfolioBackupJson && <Button variant="subtle" onClick={() => downloadTextFile("portfolio-backup.json", `${portfolioBackupJson}\n`, "application/json;charset=utf-8")}>Télécharger JSON</Button>}
                      </Group>
                      <Alert color="blue" variant="light">Le JSON est aussi téléchargé séparément pour une restauration rapide ou une revue Git.</Alert>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel admin-safety-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Restore backup vers une nouvelle version</Text>
                        <Text size="sm" c="dimmed">Colle le contenu de portfolio.json depuis un backup. La restauration crée une nouvelle version inactive pour éviter d’écraser la production.</Text>
                      </div>
                      <Badge variant="light">Restore sûr</Badge>
                    </Group>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <TextInput label="Label de la version restaurée" value={portfolioRestoreLabel} onChange={(event) => setPortfolioRestoreLabel(event.currentTarget.value)} />
                      <Button mt="xl" onClick={restorePortfolioBackup} disabled={!selectedOwnerId || !portfolioRestoreText.trim()}>Restaurer en version inactive</Button>
                    </SimpleGrid>
                    <Textarea
                      label="portfolio.json du backup"
                      minRows={10}
                      value={portfolioRestoreText}
                      onChange={(event) => setPortfolioRestoreText(event.currentTarget.value)}
                      placeholder="Colle ici le fichier portfolio.json contenu dans le ZIP de backup..."
                    />
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

  );
}
