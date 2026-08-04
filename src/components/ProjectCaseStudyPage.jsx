import { Anchor, Badge, Button, Card, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import MetadataHead from "./MetadataHead";
import OceanMorphBackground from "./OceanMorphBackground";
import NotFoundPage from "./NotFoundPage";
import { FilePreviewButton, PreviewableImage } from "./FilePreview";
import SiteFooter from "./SiteFooter";
import TopNavigation from "./TopNavigation";
import useLanguage from "../localization/useLanguage";
import { isPreviewableFile } from "../utils/filePreview";
import { fetchProjectCaseStudy } from "../services/portfolioApi";
import {
  LINK_LABELS,
  downloadText,
  findProjectBySlug,
  formatPeriod,
  getCaseStudySections,
  getProjectSlug,
  normalizeUrl,
} from "../utils/portfolio";

function getProjectLinks(project) {
  return [
    project?.githubUrl && { label: "GitHub", url: project.githubUrl, type: "GITHUB" },
    project?.demoUrl && { label: "Demo", url: project.demoUrl, type: "DEMO" },
    project?.architectureUrl && { label: "Architecture", url: project.architectureUrl, type: "ARCHITECTURE" },
    project?.documentationUrl && { label: "Documentation", url: project.documentationUrl, type: "DOCUMENTATION" },
    ...(project?.links ?? []).map((link) => ({
      label: link.label || LINK_LABELS[link.type] || "Link",
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
          <Anchor key={key} href={normalizeUrl(link.url)} target="_blank" rel="noreferrer" className="project-link">
            {link.label}
          </Anchor>
        );
      })}
    </Group>
  );
}

function CaseStudySection({ section }) {
  return (
    <Card id={`case-${section.id}`} className="island-card case-study-section-card" radius="xl">
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

function summaryValue(section, fallback = "—") {
  if (!section) return fallback;
  if (section.body) return section.body;
  return section.items?.[0] || fallback;
}

export default function ProjectCaseStudyPage({ owner, projects = [] }) {
  const { projectSlug } = useParams();
  const { language, locale, localizedPath, t } = useLanguage();
  const localProject = useMemo(() => findProjectBySlug(projects, projectSlug), [projects, projectSlug]);
  const requestKey = projectSlug ? `${owner?.ownerId ?? "default"}:${projectSlug}:${language}` : "";
  const [apiState, setApiState] = useState({ key: "", project: null });
  const [linkCopied, setLinkCopied] = useState(false);
  const apiProject = apiState.key === requestKey ? apiState.project : null;
  const loadingProject = Boolean(projectSlug) && apiState.key !== requestKey;
  const project = apiProject ?? localProject;
  const sections = useMemo(() => getCaseStudySections(project, t), [project, t]);
  const sectionMap = useMemo(() => Object.fromEntries(sections.map((section) => [section.id, section])), [sections]);

  useEffect(() => {
    let mounted = true;

    if (!projectSlug) return undefined;

    fetchProjectCaseStudy(projectSlug, owner?.ownerId, language)
      .then((payload) => {
        if (!mounted) return;
        setApiState({ key: requestKey, project: payload });
      })
      .catch(() => {
        if (!mounted) return;
        setApiState({ key: requestKey, project: null });
      });

    return () => {
      mounted = false;
    };
  }, [language, owner?.ownerId, projectSlug, requestKey]);

  if (!project && loadingProject) {
    return (
      <main className="app-shell loading-shell">
        <Loader size="lg" />
        <Text>{t("case.loading")}</Text>
      </main>
    );
  }

  if (!project) {
    return <NotFoundPage />;
  }

  const current = project.status === "IN_PROGRESS" || project.status === "MAINTAINED";
  const proofTags = [...new Set([...(project.stacks ?? []), ...(project.proofTags ?? [])])].slice(0, 12);

  const exportCaseStudy = () => {
    const content = [
      `# ${project.title}`,
      project.subtitle ? `\n${project.subtitle}` : "",
      project.shortDescription ? `\n## ${t("projects.presentation")}\n${project.shortDescription}` : "",
      ...sections.map((section) => [
        `\n## ${section.label}`,
        section.body || "",
        ...(section.items ?? []).map((item) => `- ${item}`),
      ].filter(Boolean).join("\n")),
      project.githubUrl ? `\nGitHub: ${project.githubUrl}` : "",
      project.demoUrl ? `Demo: ${project.demoUrl}` : "",
    ].filter(Boolean).join("\n");

    downloadText(`${getProjectSlug(project)}-case-study.md`, content, "text/markdown;charset=utf-8");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setLinkCopied(false);
    }
  };

  return (
    <main id="top" className="app-shell project-case-page-shell">
      <MetadataHead
        owner={owner}
        projects={projects}
        experiences={owner?.timeline?.experiences ?? []}
        page="project"
        project={project}
      />
      <OceanMorphBackground />
      <TopNavigation owner={owner} />

      <Stack gap="xl" className="content-shell project-case-content">
        <div className="project-case-breadcrumb">
          <Link to={localizedPath("/#projects")}>← {t("case.back")}</Link>
          <span>/</span>
          <span>{project.title}</span>
        </div>

        <section className="project-case-hero island-card">
          <div className="project-case-hero-copy">
            <Group gap="xs" className="project-case-meta">
              <Badge className="project-status">{t(`status.${project.status}`, { fallback: project.status })}</Badge>
              {project.featured && <Badge className="featured-badge">{t("case.focus")}</Badge>}
              <Badge className="executive-badge">{t("case.label")}</Badge>
            </Group>

            <Title order={1}>{project.title}</Title>
            {project.subtitle && <Text className="project-case-subtitle">{project.subtitle}</Text>}
            <Text className="project-case-lead">{project.shortDescription || project.description}</Text>
            <Text className="project-case-period">{formatPeriod(project.startDate, project.endDate, current, locale)}</Text>

            <Group gap="sm" className="project-case-actions">
              <Button onClick={exportCaseStudy} radius="xl" className="primary-action">
                {t("case.export")}
              </Button>
              <Button onClick={copyLink} radius="xl" variant="outline">
                {linkCopied ? t("case.linkCopied") : t("case.copyLink")}
              </Button>
              <Button component={Link} to={localizedPath("/#projects")} radius="xl" variant="light">
                {t("case.gallery")}
              </Button>
            </Group>
          </div>

          {project.imageUrl && (
            <PreviewableImage
              src={project.imageUrl}
              alt={project.title}
              className="project-case-image-preview-trigger"
              imageClassName="project-case-image"
              modalTitle={t("projects.modalTitle", { title: project.title })}
              showOverlay={false}
            />
          )}
        </section>

        <Card className="island-card case-study-recruiter-summary" radius="xl">
          <Text className="case-study-section-kicker">{t("case.summaryTitle")}</Text>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <article>
              <small>{t("case.summaryProblem")}</small>
              <p>{summaryValue(sectionMap.problem)}</p>
            </article>
            <article>
              <small>{t("case.summaryContribution")}</small>
              <p>{summaryValue(sectionMap.role)}</p>
            </article>
            <article>
              <small>{t("case.summaryImpact")}</small>
              <p>{summaryValue(sectionMap.outcomes)}</p>
            </article>
          </SimpleGrid>
        </Card>

        <nav className="case-study-jump-nav island-card" aria-label={t("case.navigation")}>
          {sections.map((section) => (
            <a key={section.id} href={`#case-${section.id}`}>{section.label}</a>
          ))}
        </nav>

        {proofTags.length > 0 && (
          <Card className="island-card case-study-evidence-card" radius="xl">
            <Text className="case-study-section-kicker">{t("case.evidence")}</Text>
            <Group gap={8} className="case-study-stack-row">
              {proofTags.map((proof) => (
                <Badge key={proof} className="stack-badge" variant="outline">{proof}</Badge>
              ))}
            </Group>
          </Card>
        )}

        <section className="case-study-map" aria-label={t("case.detailedLabel")}>
          {sections.map((section) => (
            <CaseStudySection key={section.id} section={section} />
          ))}
        </section>

        {project.stacks?.length > 0 && (
          <Card className="island-card case-study-stack-card" radius="xl">
            <Text className="case-study-section-kicker">{t("case.stack")}</Text>
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
          <Text className="case-study-section-kicker">{t("case.resources")}</Text>
          <ProjectCaseLinks project={project} />
        </Card>

        <SiteFooter owner={owner} />
      </Stack>
    </main>
  );
}
