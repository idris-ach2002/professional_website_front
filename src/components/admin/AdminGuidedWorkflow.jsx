import { Alert, Badge, Button, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";

function stepState(enabled, done) {
  if (!enabled) return { color: "gray", label: "bloqué" };
  if (done) return { color: "green", label: "ok" };
  return { color: "blue", label: "à faire" };
}

export default function AdminGuidedWorkflow({
  selectedOwnerId,
  selectedVersionId,
  selectedVersion,
  profileForm,
  projects,
  experiences,
  activeVersionsCount,
  onOpenTab,
}) {
  const hasContext = Boolean(selectedOwnerId && selectedVersionId);
  const hasProfile = Boolean(profileForm?.title?.trim() || profileForm?.headline?.trim() || profileForm?.description?.trim());
  const hasTimeline = experiences.length > 0;
  const hasPublishedProject = projects.some((project) => project?.published !== false);
  const hasFeaturedProject = projects.some((project) => project?.featured === true);

  const steps = [
    {
      title: "1. Choisir la version courante",
      text: "Toutes les modifications des onglets Profil, Timeline et Projets sont appliquées à cette version sélectionnée.",
      action: "Versions",
      tab: "version",
      ...stepState(true, hasContext),
    },
    {
      title: "2. Remplir le profil public",
      text: "Titre, accroche, description, photo, logo et CV. C’est le bloc qui alimente le haut du portfolio.",
      action: "Profil",
      tab: "profile",
      ...stepState(hasContext, hasProfile),
    },
    {
      title: "3. Construire la timeline",
      text: "Ajoute, modifie, duplique ou retire les expériences, puis enregistre la timeline complète.",
      action: "Timeline",
      tab: "timeline",
      ...stepState(hasContext, hasTimeline),
    },
    {
      title: "4. Publier les projets",
      text: "Ajoute les projets un par un, coche Published pour les afficher et Featured pour les mettre en avant.",
      action: "Projets",
      tab: "project",
      ...stepState(hasContext, hasPublishedProject && hasFeaturedProject),
    },
  ];

  return (
    <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-context-card admin-guided-workflow-card">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={900}>Mode guidé de modification</Text>
            <Text size="sm" c="dimmed">
              Parcours recommandé pour un utilisateur non technique : sélection de version, profil, timeline, projets, puis activation.
            </Text>
          </div>
          <Group gap="xs">
            <Badge color={selectedVersion?.active ? "green" : "gray"} variant="light">
              {selectedVersion?.active ? "version active" : "version brouillon"}
            </Badge>
            <Badge color={activeVersionsCount === 1 ? "green" : "red"} variant="light">
              {activeVersionsCount} active
            </Badge>
          </Group>
        </Group>

        {!hasContext && (
          <Alert color="yellow" variant="light">
            Commence par sélectionner un profil et une version dans le bloc “Contexte de modification”. Les boutons d’écriture restent désactivés tant que ce contexte n’est pas choisi.
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="md">
          {steps.map((step) => (
            <Card key={step.title} withBorder radius="lg" p="md" className="admin-guide-step-card">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Text fw={850}>{step.title}</Text>
                  <Badge color={step.color} variant="light">{step.label}</Badge>
                </Group>
                <Text size="sm" c="dimmed">{step.text}</Text>
                <Button size="xs" variant="light" disabled={!step.tab} onClick={() => onOpenTab(step.tab)}>
                  Ouvrir {step.action}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
