import { Badge, Card, Group, Progress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import SectionTitle from "./SectionTitle";
import { CATEGORY_LABELS, collectStacks, getAvailableStatuses, getPublicProjects } from "../utils/portfolio";

function ArchitectureNode({ label, value, active }) {
  return (
    <div className={`architecture-node ${active ? "active" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ExpertisePanel({ projects, experiences }) {
  const publicProjects = getPublicProjects(projects);
  const stacks = collectStacks(publicProjects);
  const statuses = getAvailableStatuses(publicProjects);
  const categories = experiences.reduce((acc, experience) => {
    const key = experience.category ?? "OTHER";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section id="expertise" className="page-section expertise-section">
      <SectionTitle
        eyebrow="Système générique"
        title="Un front dense, mais découplé du contenu exact"
        description="Les composants ne supposent pas une personne précise. Ils exploitent Owner, Profile, Timeline, Experience, Project, ContactInfo et ProjectLink."
      />

      <div className="expertise-layout">
        <Card className="expertise-card" radius="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap={3}>
              <Text className="card-kicker">Cartographie stack</Text>
              <Title order={3}>Technologies dominantes</Title>
            </Stack>
            <Badge className="executive-badge">{stacks.length}</Badge>
          </Group>
          <Stack gap="md" mt="lg">
            {stacks.slice(0, 12).map((stack) => (
              <div key={stack.label} className="stack-meter">
                <Group justify="space-between">
                  <Text>{stack.label}</Text>
                  <Badge variant="light">{stack.count}</Badge>
                </Group>
                <Progress value={Math.min(100, 35 + stack.count * 22)} radius="xl" size="sm" />
              </div>
            ))}
          </Stack>
        </Card>

        <div className="architecture-board">
          <Card className="architecture-card" radius="xl">
            <Text className="card-kicker">Architecture fonctionnelle</Text>
            <Title order={3}>Backend Spring → API → Portfolio SEO</Title>
            <div className="architecture-flow">
              <ArchitectureNode label="Owner" value="identité" active />
              <ArchitectureNode label="Profile" value="pitch" active />
              <ArchitectureNode label="Timeline" value="parcours" active />
              <ArchitectureNode label="Project" value="preuves" active />
              <ArchitectureNode label="Contact" value="conversion" active />
            </div>
          </Card>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" className="system-grid">
            <Card className="system-card" radius="xl">
              <Text className="card-kicker">Publication</Text>
              <Title order={3}>{publicProjects.length}</Title>
              <Text>projets visibles après filtrage du champ <strong>published</strong>.</Text>
            </Card>
            <Card className="system-card" radius="xl">
              <Text className="card-kicker">Statuts projet</Text>
              <Title order={3}>{statuses.length}</Title>
              <Text>{statuses.map((status) => status).join(" · ") || "Aucun statut"}</Text>
            </Card>
            <Card className="system-card" radius="xl">
              <Text className="card-kicker">Catégories parcours</Text>
              <Group gap="xs" mt="md">
                {Object.entries(categories).map(([category, count]) => (
                  <Badge key={category} className="category-chip">
                    {CATEGORY_LABELS[category] ?? category} · {count}
                  </Badge>
                ))}
              </Group>
            </Card>
          </SimpleGrid>
        </div>
      </div>
    </section>
  );
}
