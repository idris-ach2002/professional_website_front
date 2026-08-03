import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

import OceanMorphBackground from "./OceanMorphBackground";
import "../styles/pages/not-found.css";

export default function NotFoundPage() {
  return (
    <main className="app-shell not-found-page">
      <OceanMorphBackground staticMode />
      <Stack className="not-found-content" gap="lg" align="flex-start">
        <Text className="card-kicker">Erreur 404</Text>
        <Title order={1}>Cette profondeur n’existe pas.</Title>
        <Text className="not-found-description">
          L’adresse demandée ne correspond à aucune page publiée du portfolio.
        </Text>
        <Group gap="sm">
          <Button component={Link} to="/" radius="xl">
            Retour à l’accueil
          </Button>
          <Button component={Link} to="/#projects" variant="light" radius="xl">
            Voir les projets
          </Button>
          <Button component={Link} to="/cv" variant="subtle" radius="xl">
            Consulter le CV
          </Button>
        </Group>
      </Stack>
    </main>
  );
}
