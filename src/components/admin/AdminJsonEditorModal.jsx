import { Alert, Badge, Button, Group, Modal, Stack, Text } from "@mantine/core";

export default function AdminJsonEditorModal({ controller }) {
  const {
    jsonEditorOpened,
    setJsonEditorOpened,
    jsonEditorStatusColor,
    jsonEditorAnalysis,
    jsonEditorLineCount,
    jsonEditorSizeKb,
    selectedVersion,
    jsonEditorDiagnosticMessage,
    handleJsonEditorTextChange,
    formatJsonPayload,
    buildCurrentVersionJsonPayload,
    formatJsonEditorText,
    downloadJsonEditorText,
    saveJsonEditorToCurrentVersion,
    loading,
    jsonEditorCanUpdate,
    jsonEditorError,
    JsonCodeEditor,
    jsonEditorText,
    jsonHighlightRef,
    jsonLineNumbersRef,
  } = controller;

  return (
    <Modal
      opened={jsonEditorOpened}
      onClose={() => setJsonEditorOpened(false)}
      size="95vw"
      centered
      radius="xl"
      zIndex={13000}
      overlayProps={{ opacity: 0.6, blur: 12 }}
      className="json-editor-modal"
      title={
        <Group gap="sm">
          <Badge variant="light" className="json-editor-file-badge">.json</Badge>
          <Text fw={900}>Éditeur JSON de la version courante</Text>
        </Group>
      }
    >
      <Stack gap="md" className="json-editor-shell">
        <Group justify="space-between" align="flex-start" gap="md" className="json-editor-toolbar">
          <div>
            <Text fw={800}>Export, correction et sauvegarde directe</Text>
            <Text size="sm" c="dimmed">
              Modifie le même format que l’import JSON. L’enregistrement remplace le contenu de la version sélectionnée : métadonnées, profil, timeline et projets.
            </Text>
          </div>
          <Group gap="xs">
            <Badge color={jsonEditorStatusColor} variant="light">
              {jsonEditorAnalysis.label}
            </Badge>
            <Badge variant="light">{jsonEditorLineCount} lignes</Badge>
            <Badge variant="light">{jsonEditorSizeKb} Ko</Badge>
            {selectedVersion?.active && <Badge color="green" variant="light">Active</Badge>}
          </Group>
        </Group>

        <Group justify="space-between" align="center" gap="sm" className="json-editor-actionbar">
          <Group gap="xs">
            <Badge color={jsonEditorStatusColor} variant="filled">
              Analyse live
            </Badge>
            <Text size="sm" fw={700} className="json-editor-diagnostic-text">
              {jsonEditorDiagnosticMessage}
            </Text>
          </Group>

          <Group gap="xs" className="json-editor-action-buttons">
            <Button
              variant="subtle"
              onClick={() => handleJsonEditorTextChange(formatJsonPayload(buildCurrentVersionJsonPayload()))}
            >
              Recharger depuis formulaire
            </Button>
            <Button variant="light" onClick={formatJsonEditorText}>
              Indenter / formater JSON
            </Button>
            <Button variant="light" onClick={downloadJsonEditorText} disabled={!jsonEditorAnalysis.valid}>
              Télécharger ce JSON
            </Button>
            <Button
              color="green"
              onClick={saveJsonEditorToCurrentVersion}
              loading={loading}
              disabled={!jsonEditorCanUpdate}
            >
              Mettre à jour la version actuelle
            </Button>
          </Group>
        </Group>

        {jsonEditorError && (
          <Alert color="red" variant="light" className="admin-alert">
            {jsonEditorError}
          </Alert>
        )}

        <JsonCodeEditor
          value={jsonEditorText}
          onChange={handleJsonEditorTextChange}
          highlightRef={jsonHighlightRef}
          lineNumbersRef={jsonLineNumbersRef}
          analysis={jsonEditorAnalysis}
        />

        <Group justify="space-between" align="center" className="json-editor-footer">
          <Text size="xs" c="dimmed">
            Les fichiers restent des URL dans le JSON. Pour remplacer physiquement une image ou un PDF, garde les champs d’upload existants.
          </Text>
          <Text size="xs" fw={800} c={jsonEditorAnalysis.valid ? "green" : "red"}>
            {jsonEditorAnalysis.valid ? "Prêt à sauvegarder" : "Sauvegarde bloquée tant que le JSON est invalide"}
          </Text>
        </Group>
      </Stack>
    </Modal>
  );
}
