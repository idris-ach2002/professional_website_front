import { Anchor, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { Link } from "react-router-dom";

import MetadataHead from "./MetadataHead";
import OceanMorphBackground from "./OceanMorphBackground";
import TopNavigation from "./TopNavigation";
import useLanguage from "../localization/useLanguage";
import {
  buildProvenSkills,
  formatPeriod,
  getContactHref,
  getFeaturedProjects,
  getOwnerFullName,
  getPrimaryContact,
  getProjectSlug,
  getPublicProjects,
  sortByDisplayOrder,
} from "../utils/portfolio";
import "../styles/pages/recruiter-page.css";

async function copyCurrentUrl() {
  const url = window.location.href;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function RecruiterProjectCard({ project, localizedPath, t }) {
  return (
    <Card className="recruiter-project-card" radius="xl">
      <Group justify="space-between" gap="sm" align="flex-start">
        <div>
          <Text className="recruiter-card-kicker">{t("projects.caseStudy")}</Text>
          <Title order={3}>{project.title}</Title>
        </div>
        {project.featured && <Badge className="featured-badge">{t("case.focus")}</Badge>}
      </Group>

      {project.subtitle && <Text className="recruiter-project-subtitle">{project.subtitle}</Text>}
      <Text className="recruiter-project-description">{project.shortDescription || project.description}</Text>

      <Group gap={7} className="recruiter-stack-row">
        {(project.stacks ?? []).slice(0, 6).map((stack) => (
          <Badge key={`${project.id ?? project.title}-${stack}`} className="stack-badge" variant="outline">
            {stack}
          </Badge>
        ))}
      </Group>

      <Button
        component={Link}
        to={localizedPath(`/projects/${getProjectSlug(project)}`)}
        radius="xl"
        variant="light"
        className="recruiter-project-link"
      >
        {t("recruiter.openCaseStudy")}
      </Button>
    </Card>
  );
}

export default function RecruiterPage({ owner, profile, projects = [], experiences = [] }) {
  const { locale, localizedPath, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const ownerName = getOwnerFullName(owner);
  const currentYear = new Date().getFullYear();
  const email = getPrimaryContact(owner, "EMAIL");
  const github = getPrimaryContact(owner, "GITHUB");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");
  const publicProjects = getPublicProjects(sortByDisplayOrder(projects));
  const priorityProjects = [...getFeaturedProjects(publicProjects), ...publicProjects]
    .filter((project, index, list) => list.findIndex((item) => getProjectSlug(item) === getProjectSlug(project)) === index)
    .slice(0, 3);
  const priorityExperiences = sortByDisplayOrder(experiences)
    .filter((experience) => ["INTERNSHIP", "SCHOOL", "ALTERNANCE", "CDI"].includes(experience.category))
    .slice(0, 3);
  const configuredSkills = Array.isArray(owner?.provenSkills) ? owner.provenSkills : [];
  const provenSkills = configuredSkills.length > 0
    ? configuredSkills
    : buildProvenSkills(projects, experiences);

  const handleCopy = async () => {
    try {
      await copyCurrentUrl();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main id="main-content" className="app-shell recruiter-page-shell" tabIndex={-1}>
      <MetadataHead owner={owner} projects={projects} experiences={experiences} page="recruiter" />
      <OceanMorphBackground staticMode />
      <TopNavigation owner={owner} />

      <Stack gap="xl" className="content-shell recruiter-page-content">
        <section className="recruiter-hero island-card">
          <div className="recruiter-hero-copy">
            <Text className="recruiter-eyebrow">{t("recruiter.eyebrow")}</Text>
            <Title order={1}>{ownerName}</Title>
            <Text className="recruiter-role">{profile?.title}</Text>
            <Title order={2} className="recruiter-main-title">{t("recruiter.title")}</Title>
            <Text className="recruiter-intro">{t("recruiter.intro")}</Text>
          </div>

          <Group gap="sm" className="recruiter-hero-actions">
            {profile?.cvUrl && (
              <Button component={Link} to={localizedPath("/cv")} radius="xl" className="primary-action">
                {t("recruiter.cv")}
              </Button>
            )}
            {email && (
              <Button component="a" href={getContactHref(email)} radius="xl" variant="light">
                {t("recruiter.contact")}
              </Button>
            )}
            <Button type="button" onClick={() => window.print()} radius="xl" variant="outline">
              {t("recruiter.print")}
            </Button>
            <Button type="button" onClick={handleCopy} radius="xl" variant="subtle">
              {copied ? t("recruiter.linkCopied") : t("recruiter.copyLink")}
            </Button>
          </Group>
        </section>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" className="recruiter-facts-grid">
          <Card className="recruiter-fact-card" radius="xl">
            <Text>{t("recruiter.availability")}</Text>
            <strong>{profile?.availability || t("hero.openOpportunities")}</strong>
          </Card>
          <Card className="recruiter-fact-card" radius="xl">
            <Text>{t("recruiter.location")}</Text>
            <strong>{profile?.location || owner?.address}</strong>
          </Card>
          <Card className="recruiter-fact-card" radius="xl">
            <Text>{t("recruiter.education")}</Text>
            <strong>{priorityExperiences.find((experience) => experience.category === "SCHOOL")?.title || "Master Informatique"}</strong>
          </Card>
          <Card className="recruiter-fact-card" radius="xl">
            <Text>{t("recruiter.target")}</Text>
            <strong>{t("recruiter.targetValue")}</strong>
          </Card>
        </SimpleGrid>

        <section className="recruiter-section island-card">
          <div className="recruiter-section-heading">
            <Text className="recruiter-card-kicker">01</Text>
            <Title order={2}>{t("recruiter.provenSkills")}</Title>
          </div>
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {provenSkills.slice(0, 6).map((skill) => (
              <article key={skill.id ?? skill.label} className="recruiter-skill-card">
                <Group justify="space-between" gap="sm" align="flex-start">
                  <strong>{skill.label}</strong>
                  {skill.evidenceCount ? <Badge variant="light">{skill.evidenceCount}</Badge> : null}
                </Group>
                <p>{skill.description || skill.summary}</p>
              </article>
            ))}
          </SimpleGrid>
        </section>

        <section className="recruiter-section island-card">
          <div className="recruiter-section-heading">
            <Text className="recruiter-card-kicker">02</Text>
            <Title order={2}>{t("recruiter.experience")}</Title>
          </div>
          <Stack gap="sm" className="recruiter-experience-list">
            {priorityExperiences.length > 0 ? priorityExperiences.map((experience) => (
              <article key={`${experience.displayOrder}-${experience.title}`} className="recruiter-experience-item">
                <div>
                  <Text className="recruiter-experience-category">{t(`category.${experience.category}`, { fallback: experience.category })}</Text>
                  <Title order={3}>{experience.title}</Title>
                  <Text>{experience.organization}</Text>
                </div>
                <div className="recruiter-experience-summary">
                  <Text>{experience.summary || experience.description}</Text>
                  <small>{formatPeriod(experience.startDate, experience.endDate, experience.currentPosition, locale)}</small>
                </div>
              </article>
            )) : <Text>{t("recruiter.noExperience")}</Text>}
          </Stack>
        </section>

        <section className="recruiter-section island-card">
          <div className="recruiter-section-heading">
            <Text className="recruiter-card-kicker">03</Text>
            <Title order={2}>{t("recruiter.projects")}</Title>
          </div>
          {priorityProjects.length > 0 ? (
            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
              {priorityProjects.map((project) => (
                <RecruiterProjectCard
                  key={project.id ?? project.title}
                  project={project}
                  localizedPath={localizedPath}
                  t={t}
                />
              ))}
            </SimpleGrid>
          ) : <Text>{t("recruiter.noProject")}</Text>}
        </section>

        <footer className="recruiter-contact-footer island-card">
          <div className="recruiter-contact-footer__identity">
            <Text className="recruiter-card-kicker">{t("recruiter.contact")}</Text>
            <Title order={2}>{ownerName}</Title>
            {profile?.title && <Text>{profile.title}</Text>}
          </div>

          <Group gap="sm" className="recruiter-contact-footer__links">
            {email && <Anchor href={getContactHref(email)}>{email.value}</Anchor>}
            {github && <Anchor href={getContactHref(github)} target="_blank" rel="noreferrer">{t("recruiter.github")}</Anchor>}
            {linkedin && <Anchor href={getContactHref(linkedin)} target="_blank" rel="noreferrer">{t("recruiter.linkedin")}</Anchor>}
            <Button component={Link} to={localizedPath("/")} radius="xl" variant="light">
              {t("recruiter.fullPortfolio")}
            </Button>
          </Group>

          <Text className="recruiter-contact-footer__copyright">
            © {currentYear} {ownerName}
          </Text>
        </footer>
      </Stack>
    </main>
  );
}
