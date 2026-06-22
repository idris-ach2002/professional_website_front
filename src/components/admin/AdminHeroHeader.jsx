import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";

export default function AdminHeroHeader({ controller }) {
  const { loading, refreshOwners, handleLogout } = controller;

  return (
    <Paper withBorder radius="xl" p="xl" className="admin-hero-card">
      <Group justify="space-between" align="flex-start" gap="xl">
        <Stack gap="xs" maw={860}>
          <Badge variant="light" className="admin-kicker">
            Administration portfolio
          </Badge>
          <Title order={1} className="admin-title">
            Console de contenu, versions & projets
          </Title>
          <Text c="dimmed" size="lg">
            Gère le contenu complet du portfolio : versions clonables,
            profils, fichiers uploadés, expériences et projets éditables un
            par un.
          </Text>
        </Stack>

        <Stack gap="xs" className="admin-hero-actions">
          <Button onClick={() => refreshOwners()} loading={loading} variant="light">
            Recharger les données
          </Button>
          <Button component="a" href="/" variant="subtle">
            Voir le site public
          </Button>
          <Button onClick={handleLogout} loading={loading} variant="outline">
            Se déconnecter
          </Button>
        </Stack>
      </Group>
    </Paper>
  );
}
