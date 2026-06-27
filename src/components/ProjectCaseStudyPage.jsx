import { Anchor, Badge, Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import OceanMorphBackground from "./OceanMorphBackground";
import { FilePreviewButton, PreviewableImage } from "./FilePreview";
import SiteFooter from "./SiteFooter";
import TopNavigation from "./TopNavigation";
import { isPreviewableFile } from "../utils/filePreview";
import { fetchProjectCaseStudy } from "../services/portfolioApi";
import {
  LINK_LABELS,
  STATUS_LABELS,
  downloadText,
  findProjectBySlug,
  formatPeriod,
  getCaseStudySections,
  getOwnerFullName,
  getProjectSlug,
  normalizeUrl,
} from "../utils/portfolio";

function getProjectLinks(project) {
  return [
    project?.githubUrl && { label: "GitHub", url: project.githubUrl, type: "GITHUB" },
    project?.demoUrl && { label: "Démo", url: project.demoUrl, type: "DEMO" },
    project?.architectureUrl && { label: "Architecture", url: project.architectureUrl, type: "ARCHITECTURE" },
    project?.documentationUrl && { label: "Documentation", url: project.documentationUrl, type: "DOCUMENTATION" },
    ...(project?.links ?? []).map((link) => ({
      label: link.label || LINK_LABELS[link.type] || "Lien",
      url: link.url,
      type: link.type || "OTHER",
    })),
  ].filter((link) => link?.url);
}

function ProjectCaseLinks({ project }) {
  const links = getProjectLinks(project);

  if (links.length === 0) return null;

  return (
    <Group gap="xs" className="project-case-links">
      {links.map((link, index) => {
        const key = `${project.id ?? project.title}-${link.label}-${index}-${link.url}`;

        return isPreviewableFile(link.url) ? (
          <FilePreviewButton
            key={key}
            url={link.url}
            label={link.label}
            title={`${link.label} — ${project.title}`}
            mode={link.label?.toLowerCase().includes("cv") ? "page" : "modal"}
            variant="subtle"
            size="xs"
            className="project-link project-link-button"
          />
        ) : (
          <Anchor key={key} href={normalizeUrl(link.url)} target="_blank" className="project-link">
            {link.label}
          </Anchor>
        );
      })}
    </Group>
  );
}

function CaseStudySection({ section }) {
  return (
    <Card className="island-card case-study-section-card" radius="xl">
      <Text className="case-study-section-kicker">{section.label}</Text>
      {section.body && <Text className="case-study-section-body">{section.body}</Text>}
      {section.items?.length > 0 && (
        <ul className="case-study-list">
          {section.items.map((item, index) => (
            <li key={`${section.id}-${index}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ProjectCaseStudyPage({ owner, projects = [] }) {
  const { projectSlug } = useParams();
  const localProject = useMemo(() => findProjectBySlug(projects, projectSlug), [projects, projectSlug]);
  const [apiProject, setApiProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const project = apiProject ?? localProject;
  const sections = useMemo(() => getCaseStudySections(project), [project]);
  const ownerName = getOwnerFullName(owner);

  useEffect(() => {
    let mounted = true;

    if (!projectSlug) return undefined;

    setLoadingProject(true);
    fetchProjectCaseStudy(projectSlug, owner?.ownerId)
      .then((payload) => {
        if (!mounted) return;
        setApiProject(payload);
      })
      .catch(() => {
        if (!mounted) return;
        setApiProject(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingProject(false);
      });

    return () => {
      mounted = false;
    };
  }, [owner?.ownerId, projectSlug]);

  useEffect(() => {
    if (!project) return;

    const title = `${project.title} — étude de cas | ${ownerName}`;
    const description = (project.shortDescription || project.description || "Étude de cas projet").slice(0, 165);

    document.title = title;

    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [ownerName, project]);

  if (!project && loadingProject) {
    return (
      <main className="app-shell loading-shell">
        <Loader size="lg" />
        <Text>Chargement de l’étude de cas…</Text>
      </main>
    );
  }

  if (!project) {
    return <Navigate to="/#projects" replace />;
  }

  const current = project.status === "IN_PROGRESS" || project.status === "MAINTAINED";

  const exportCaseStudy = () => {
    const content = [
      `# ${project.title}`,
      project.subtitle ? `\n${project.subtitle}` : "",
      project.shortDescription ? `\n## Résumé\n${project.shortDescription}` : "",
      ...sections.map((section) => [
        `\n## ${section.label}`,
        section.body || "",
        ...(section.items ?? []).map((item) => `- ${item}`),
      ].filter(Boolean).join("\n")),
      project.githubUrl ? `\nGitHub: ${project.githubUrl}` : "",
      project.demoUrl ? `Démo: ${project.demoUrl}` : "",
    ].filter(Boolean).join("\n");

    downloadText(`${getProjectSlug(project)}-case-study.md`, content, "text/markdown;charset=utf-8");
  };

  return (
    <main id="top" className="app-shell project-case-page-shell">
      <OceanMorphBackground />
      <TopNavigation owner={owner} />

      <Stack gap="xl" className="content-shell project-case-content">
        <div className="project-case-breadcrumb">
          <Link to="/#projects">← Retour aux projets</Link>
          <span>/</span>
          <span>{project.title}</span>
        </div>

        <section className="project-case-hero island-card">
          <div className="project-case-hero-copy">
            <Group gap="xs" className="project-case-meta">
              <Badge className="project-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
              {project.featured && <Badge className="featured-badge">Projet focus</Badge>}
              <Badge className="executive-badge">Étude de cas</Badge>
            </Group>

            <Title order={1}>{project.title}</Title>
            {project.subtitle && <Text className="project-case-subtitle">{project.subtitle}</Text>}
            <Text className="project-case-lead">{project.shortDescription || project.description}</Text>
            <Text className="project-case-period">{formatPeriod(project.startDate, project.endDate, current)}</Text>

            <Group gap="sm" className="project-case-actions">
              <Button onClick={exportCaseStudy} radius="xl" className="primary-action">
                Exporter l’étude de cas
              </Button>
              <Button component={Link} to="/#projects" radius="xl" variant="light">
                Voir la galerie
              </Button>
            </Group>
          </div>

          {project.imageUrl && (
            <PreviewableImage
              src={project.imageUrl}
              alt={project.title}
              className="project-case-image-preview-trigger"
              imageClassName="project-case-image"
              modalTitle={`Projet — ${project.title}`}
              showOverlay={false}
            />
          )}
        </section>

        <section className="case-study-map" aria-label="Étude de cas détaillée">
          {sections.map((section) => (
            <CaseStudySection key={section.id} section={section} />
          ))}
        </section>

        {project.stacks?.length > 0 && (
          <Card className="island-card case-study-stack-card" radius="xl">
            <Text className="case-study-section-kicker">Stack technique</Text>
            <Group gap={8} className="case-study-stack-row">
              {project.stacks.map((stack) => (
                <Badge key={`${project.id}-${stack}`} className="stack-badge" variant="outline">
                  {stack}
                </Badge>
              ))}
            </Group>
          </Card>
        )}

        <Card className="island-card case-study-links-card" radius="xl">
          <Text className="case-study-section-kicker">Ressources</Text>
          <ProjectCaseLinks project={project} />
        </Card>

        <SiteFooter owner={owner} />
      </Stack>
    </main>
  );
}
