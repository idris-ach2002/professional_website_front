import { Badge, Card, Group, Progress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
import { CATEGORY_LABELS, collectStacks, getAvailableStatuses, getPublicProjects } from "../utils/portfolio";

function ArchitectureNode({ label, value, active }) {
  return (
    <div className={`architecture-node coral-node ${active ? "active" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ExpertisePanel({ projects, experiences }) {
  const rootRef = useRef(null);
  const publicProjects = getPublicProjects(projects);
  const stacks = collectStacks(publicProjects);
  const statuses = getAvailableStatuses(publicProjects);
  const categories = experiences.reduce((acc, experience) => {
    const key = experience.category ?? "OTHER";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;
    gsap.from(".expertise-card, .architecture-card, .system-card", {
      autoAlpha: 0,
      y: 48,
      scale: 0.94,
      rotate: (index) => (index % 2 ? 1.6 : -1.6),
      duration: 0.78,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: rootRef.current, start: "top 76%" },
    });

    gsap.from(".coral-node", {
      autoAlpha: 0,
      y: 20,
      scale: 0.82,
      stagger: 0.08,
      duration: 0.48,
      ease: "back.out(1.7)",
      scrollTrigger: { trigger: ".architecture-flow", start: "top 82%" },
    });

    gsap.to(".coral-node.active", {
      y: (index) => (index % 2 ? -5 : 6),
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.1,
    });
  }, [stacks.length, experiences.length]);

  return (
    <section ref={rootRef} id="expertise" className="page-section expertise-section island-section">
      <SectionTitle
        eyebrow="Coraux techniques"
        title="Un système générique, mais une présence visuelle singulière"
        description="Le front reste découplé des données exactes, mais il transforme les stacks, statuts et catégories en récifs techniques plutôt qu’en simples cards alignées."
      />

      <div className="expertise-layout">
        <Card className="expertise-card island-card" radius="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap={3}>
              <Text className="card-kicker">Cartographie stack</Text>
              <Title order={3}>Technologies dominantes</Title>
            </Stack>
            <Badge className="executive-badge">{stacks.length}</Badge>
          </Group>
          <Stack gap="md" mt="lg">
            {stacks.slice(0, 12).map((stack, index) => (
              <div key={stack.label} className="stack-meter" style={{ "--reef-index": index }}>
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
          <Card className="architecture-card island-card" radius="xl">
            <Text className="card-kicker">Architecture fonctionnelle</Text>
            <Title order={3}>Backend Spring → API → Archipel SEO</Title>
            <div className="architecture-flow">
              <ArchitectureNode label="Owner" value="identité" active />
              <ArchitectureNode label="Profile" value="pitch" active />
              <ArchitectureNode label="Timeline" value="route" active />
              <ArchitectureNode label="Project" value="îles" active />
              <ArchitectureNode label="Contact" value="port" active />
            </div>
          </Card>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" className="system-grid">
            <Card className="system-card island-card" radius="xl">
              <Text className="card-kicker">Publication</Text>
              <Title order={3}>{publicProjects.length}</Title>
              <Text>projets visibles après filtrage du champ <strong>published</strong>.</Text>
            </Card>
            <Card className="system-card island-card" radius="xl">
              <Text className="card-kicker">Statuts projet</Text>
              <Title order={3}>{statuses.length}</Title>
              <Text>{statuses.map((status) => status).join(" · ") || "Aucun statut"}</Text>
            </Card>
            <Card className="system-card island-card" radius="xl">
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
