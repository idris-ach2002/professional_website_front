import { Alert, Group, Loader, Stack, Text } from "@mantine/core";

export default function AdminFeedbackAlerts({ controller }) {
  const { loading, message, error } = controller;

  if (!loading && !message && !error) {
    return null;
  }

  return (
    <Stack gap="sm">
      {loading && (
        <Alert variant="light" className="admin-alert">
          <Group>
            <Loader size="sm" />
            <Text>Traitement en cours…</Text>
          </Group>
        </Alert>
      )}

      {message && (
        <Alert color="green" variant="light" className="admin-alert">
          {message}
        </Alert>
      )}

      {error && (
        <Alert color="red" variant="light" className="admin-alert">
          {error}
        </Alert>
      )}
    </Stack>
  );
}
