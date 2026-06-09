import { Anchor, Badge, Button, Card, Group, Image, MultiSelect, SegmentedControl, Stack, Text, TextInput, Title } from "@mantine/core";
import { useMemo, useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";
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

function ProjectVisual({ project, index }) {
  if (project.imageUrl) {
    return <Image src={project.imageUrl} alt={project.title} className="project-image" />;
  }

  return (
    <div className="project-visual">
      <svg viewBox="0 0 180 130" aria-hidden="true">
        <path d="M22 81 C34 21 117 6 153 49 C185 88 122 130 63 121 C33 116 16 103 22 81Z" />
        <circle cx="61" cy="62" r="12" />
        <path d="M72 81 C96 51 126 55 146 79" />
      </svg>
      <span>Île 0{index + 1}</span>
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

function ProjectIsland({ project, index, featured }) {
  return (
    <article className={`project-island island-card ${featured ? "featured-project-island" : ""}`}>
      <div className="project-island-topline">
        <Badge className="project-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
        {project.featured}
      </div>
      <ProjectVisual project={project} index={index} />
      <Stack gap="sm" className="project-content">
        <Text className="project-period">{formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED")}</Text>
        <Title order={3}>{project.title}</Title>
        {project.subtitle && <Text className="project-subtitle">{project.subtitle}</Text>}
        <Text className="project-description">{project.shortDescription ?? project.description}</Text>
        {project.features?.length > 0 && (
          <ul className="feature-list two-columns">
            {project.features.slice(0, featured ? 6 : 4).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}
        {project.stacks?.length > 0 && (
          <Group gap={7} className="stack-row">
            {project.stacks.slice(0, featured ? 10 : 7).map((stack) => (
              <Badge key={stack} variant="outline" className="stack-badge">{stack}</Badge>
            ))}
          </Group>
        )}
        <ProjectLinks project={project} />
      </Stack>
    </article>
  );
}

export default function ProjectsShowcase({ projects }) {
  const rootRef = useRef(null);
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

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;

    gsap.from(".project-toolbar", {
      autoAlpha: 0,
      y: 22,
      duration: 0.55,
      ease: "power3.out",
      scrollTrigger: { trigger: ".projects-section", start: "top 78%" },
    });

    gsap.from(".project-island", {
      autoAlpha: 0,
      y: 66,
      scale: 0.9,
      rotate: (index) => (index % 2 ? 3 : -3),
      duration: 0.86,
      stagger: { each: 0.1, from: "center" },
      ease: "power3.out",
      scrollTrigger: { trigger: ".project-archipelago", start: "top 75%" },
    });

    gsap.to(".project-island", {
      y: (index) => (index % 2 ? -9 : 11),
      rotate: (index) => (index % 2 ? -0.9 : 0.9),
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.18,
    });
  }, [filteredProjects.length]);

  const exportProjects = () => {
    downloadText("portfolio-projects.json", JSON.stringify(filteredProjects, null, 2), "application/json;charset=utf-8");
  };

  return (
    <section ref={rootRef} id="projects" className="page-section projects-section">
      <SectionTitle
        title="Mes projets"
        rightSlot={<Button onClick={exportProjects} radius="xl" variant="light">Exporter JSON</Button>}
      />

      <div className="project-toolbar island-card">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Rechercher un projet, une stack, une feature…"
          radius="xl"
          className="project-search"
          aria-label="Rechercher dans les projets"
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
        <Badge className="executive-badge">{filteredProjects.length} île{filteredProjects.length > 1 ? "s" : ""}</Badge>
        {selectedStacks.map((stack) => (
          <Badge key={stack} className="filter-chip">{stack}</Badge>
        ))}
      </Group>

      {filteredProjects.length > 0 ? (
        <div className="project-archipelago">
          {filteredProjects.map((project, index) => (
            <ProjectIsland key={project.id ?? project.title} project={project} index={index} featured={project.featured || index === 0} />
          ))}
        </div>
      ) : (
        <Card className="empty-card island-card" radius="xl">
          <Title order={3}>Aucune île ne correspond aux filtres.</Title>
          <Text>Réduis la recherche ou retire une stack pour retrouver les projets disponibles.</Text>
        </Card>
      )}
    </section>
  );
}
