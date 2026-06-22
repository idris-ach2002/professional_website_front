import { Alert, Badge, Button, Group, Modal, Paper, Stack, Text } from "@mantine/core";

export default function AdminCommandTraceModal({ controller }) {
  const {
    commandTraceOpened,
    setCommandTraceOpened,
    commandTraceTitle,
    commandTraceStatus,
    commandTraceEntries,
    focusCvStudioAfterSmartApply,
  } = controller;

  return (
    <Modal opened={commandTraceOpened} onClose={() => setCommandTraceOpened(false)} title={commandTraceTitle} size="xl" centered>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Journal temps réel des commandes appliquées au CV Studio.</Text>
          <Badge color={commandTraceStatus === "done" ? "green" : commandTraceStatus === "running" ? "blue" : "gray"} variant="light">
            {commandTraceStatus === "done" ? "Terminé" : commandTraceStatus === "running" ? "En cours" : "Inactif"}
          </Badge>
        </Group>
        <div className="smart-command-trace-list">
          {commandTraceEntries.length === 0 ? (
            <Alert color="gray" variant="light">Aucune trace pour le moment.</Alert>
          ) : commandTraceEntries.map((entry) => (
            <Paper key={entry.id} withBorder radius="md" p="sm" className={`smart-command-trace-entry is-${entry.status}`}>
              <Group justify="space-between" align="flex-start" gap="sm">
                <div>
                  <Text fw={800} size="sm">{entry.title}</Text>
                  <Text size="xs" c="dimmed">{entry.detail}</Text>
                </div>
                <Badge size="xs" color={entry.status === "done" ? "green" : entry.status === "warning" ? "orange" : "blue"} variant="light">
                  {entry.status === "done" ? "OK" : entry.status === "warning" ? "Info" : "Run"}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>{entry.timestamp}</Text>
            </Paper>
          ))}
        </div>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setCommandTraceOpened(false)}>Fermer</Button>
          <Button onClick={() => focusCvStudioAfterSmartApply("profile")}>Ouvrir le CV Builder</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
