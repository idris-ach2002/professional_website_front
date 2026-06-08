import { Anchor, Badge, Button, Card, Group, Image, MultiSelect, SegmentedControl, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import {
  LINK_LABELS,
  STATUS_LABELS,
  downloadText,
  formatPeriod,
  getAvailableStacks,
  getAvailableStatuses,
  getPublicProjects,
  normalizeUrl,
} from "../utils/portfolio";

const MotionArticle = motion.article;

function ProjectVisual({ project, index }) {
  if (project.imageUrl) {
    return <Image src={project.imageUrl} alt={project.title} className="project-image" />;
  }

  return (
    <div className="project-visual">
      <span>0{index + 1}</span>
      <strong>{project.title?.slice(0, 2)?.toUpperCase()}</strong>
    </div>
  );
}

function ProjectLinks({ project }) {
  const links = [
    project.githubUrl && { label: "GitHub", url: project.githubUrl },
    project.demoUrl && { label: "Démo", url: project.demoUrl },
    project.documentationUrl && { label: "Docs", url: project.documentationUrl },
    ...(project.links ?? []).map((link) => ({ label: link.label || LINK_LABELS[link.type] || "Lien", url: link.url })),
  ].filter(Boolean);

  if (links.length === 0) return null;

  return (
    <Group gap="xs" className="project-links">
      {links.slice(0, 5).map((link) => (
        <Anchor key={`${link.label}-${link.url}`} href={normalizeUrl(link.url)} target="_blank" className="project-link">
          {link.label}
        </Anchor>
      ))}
    </Group>
  );
}

function ProjectCard({ project, index, compact }) {
  if (!compact) {
    return (
      <Card className="featured-project" radius="xl">
        <ProjectVisual project={project} index={index} />
        <Stack gap="sm" className="project-content">
          <Group justify="space-between" align="center">
            <Badge className="project-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
            <Text className="project-period">{formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED")}</Text>
          </Group>
          <Title order={3}>{project.title}</Title>
          {project.subtitle && <Text className="project-subtitle">{project.subtitle}</Text>}
          <Text className="project-description">{project.shortDescription ?? project.description}</Text>
          {project.features?.length > 0 && (
            <ul className="feature-list two-columns">
              {project.features.slice(0, 6).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}
          {project.stacks?.length > 0 && (
            <Group gap={7} className="stack-row">
              {project.stacks.slice(0, 10).map((stack) => (
                <Badge key={stack} variant="outline" className="stack-badge">{stack}</Badge>
              ))}
            </Group>
          )}
          <ProjectLinks project={project} />
        </Stack>
      </Card>
    );
  }

  return (
    <Card className="project-card" radius="xl">
      <Group justify="space-between" align="flex-start">
        <Badge className="project-mini-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
        {project.featured && <Badge className="featured-badge">Featured</Badge>}
      </Group>
      <Title order={3}>{project.title}</Title>
      <Text className="project-card-subtitle">{project.subtitle}</Text>
      <Text className="project-card-desc">{project.shortDescription ?? project.description}</Text>
      {project.features?.length > 0 && (
        <ul className="feature-list">
          {project.features.slice(0, 4).map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      )}
      <Group gap={7} className="stack-row compact-stack">
        {(project.stacks ?? []).slice(0, 7).map((stack) => (
          <Badge key={stack} variant="outline" className="stack-badge">{stack}</Badge>
        ))}
      </Group>
      <ProjectLinks project={project} />
    </Card>
  );
}

export default function ProjectsShowcase({ projects }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedStacks, setSelectedStacks] = useState([]);
  const [mode, setMode] = useState("all");

  const publicProjects = useMemo(() => getPublicProjects(projects), [projects]);
  const statuses = useMemo(() => getAvailableStatuses(publicProjects), [publicProjects]);
  const stacks = useMemo(() => getAvailableStacks(publicProjects), [publicProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return publicProjects.filter((project) => {
      const haystack = [
        project.title,
        project.subtitle,
        project.shortDescription,
        project.description,
        ...(project.stacks ?? []),
        ...(project.features ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesStatus = status === "ALL" || project.status === status;
      const matchesFeatured = mode !== "featured" || project.featured === true;
      const matchesStacks = selectedStacks.length === 0 || selectedStacks.every((stack) => (project.stacks ?? []).includes(stack));

      return matchesQuery && matchesStatus && matchesFeatured && matchesStacks;
    });
  }, [mode, publicProjects, query, selectedStacks, status]);

  const featured = filteredProjects.filter((project) => project.featured);
  const regular = filteredProjects.filter((project) => !project.featured || featured.length === 0);

  const exportProjects = () => {
    downloadText("portfolio-projects.json", JSON.stringify(filteredProjects, null, 2), "application/json;charset=utf-8");
  };

  return (
    <section id="projects" className="page-section projects-section">
      <SectionTitle
        eyebrow="Réalisations filtrables"
        title="Des preuves techniques consultables comme un produit"
        description="Recherche, filtrage par statut, filtrage par stack et export JSON : la section exploite réellement les champs Project exposés par Spring."
        rightSlot={<Button onClick={exportProjects} radius="xl" variant="light">Exporter JSON</Button>}
      />

      <div className="project-toolbar">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Rechercher un projet, une stack, une feature…"
          radius="xl"
          className="project-search"
          aria-label="Rechercher dans les projets"
        />
        <SegmentedControl
          value={mode}
          onChange={setMode}
          radius="xl"
          data={[
            { label: "Tous", value: "all" },
            { label: "Featured", value: "featured" },
          ]}
          className="project-mode"
        />
        <MultiSelect
          data={[{ value: "ALL", label: "Tous les statuts" }, ...statuses.map((item) => ({ value: item, label: STATUS_LABELS[item] ?? item }))]}
          value={[status]}
          onChange={(values) => setStatus(values.at(-1) ?? "ALL")}
          radius="xl"
          className="status-select"
          maxValues={1}
          searchable={false}
          aria-label="Filtrer par statut"
        />
        <MultiSelect
          data={stacks}
          value={selectedStacks}
          onChange={setSelectedStacks}
          radius="xl"
          className="stack-filter"
          placeholder="Stacks"
          searchable
          clearable
          aria-label="Filtrer par stack"
        />
      </div>

      <Group gap="xs" className="result-line">
        <Badge className="executive-badge">{filteredProjects.length} projet{filteredProjects.length > 1 ? "s" : ""}</Badge>
        {selectedStacks.map((stack) => (
          <Badge key={stack} className="filter-chip">{stack}</Badge>
        ))}
      </Group>

      {featured.length > 0 && (
        <div className="featured-grid">
          {featured.slice(0, 3).map((project, index) => (
            <MotionArticle
              key={project.id ?? project.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <ProjectCard project={project} index={index} />
            </MotionArticle>
          ))}
        </div>
      )}

      {regular.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md" className="project-grid">
          {regular.map((project, index) => (
            <MotionArticle
              key={project.id ?? project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.16) }}
            >
              <ProjectCard project={project} index={index} compact />
            </MotionArticle>
          ))}
        </SimpleGrid>
      ) : (
        <Card className="empty-card" radius="xl">
          <Title order={3}>Aucun projet ne correspond aux filtres.</Title>
          <Text>Réduis la recherche ou retire une stack pour retrouver les projets disponibles.</Text>
        </Card>
      )}
    </section>
  );
}
