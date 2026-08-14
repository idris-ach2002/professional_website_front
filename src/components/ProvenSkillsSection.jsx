import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import SectionTitle from "./SectionTitle";
import useLanguage from "../localization/useLanguage";
import { buildProvenSkills, getProjectSlug } from "../utils/portfolio";
import { useItemVisibility } from "../visibility/useItemVisibility";
import { skillVisibilityKey } from "../visibility/itemVisibilityRegistry";

function normalizeApiSkill(skill, projects = [], experiences = [], defaultDescription) {
  if (!skill) return null;

  const projectSlugs = skill.projectSlugs ?? skill.evidenceProjects ?? [];
  const experienceTitles = skill.experienceTitles ?? skill.evidenceExperiences ?? [];
  const resolvedProjects = (skill.projects?.length ? skill.projects : [])
    .concat(projects.filter((project) => projectSlugs.includes(getProjectSlug(project))))
    .filter(Boolean);
  const resolvedExperiences = (skill.experiences?.length ? skill.experiences : [])
    .concat(experiences.filter((experience) => experienceTitles.includes(experience.title)))
    .filter(Boolean);

  const seenProjects = new Set();
  const uniqueProjects = resolvedProjects.filter((project) => {
    const key = getProjectSlug(project);
    if (seenProjects.has(key)) return false;
    seenProjects.add(key);
    return true;
  });

  const seenExperiences = new Set();
  const uniqueExperiences = resolvedExperiences.filter((experience) => {
    const key = experience.id ?? `${experience.title}-${experience.organization}`;
    if (seenExperiences.has(key)) return false;
    seenExperiences.add(key);
    return true;
  });

  const stacks = skill.stacks?.length
    ? skill.stacks
    : [...new Set(uniqueProjects.flatMap((project) => project.stacks ?? []))].slice(0, 8);

  return {
    id: skill.id,
    label: skill.label,
    shortLabel: skill.shortLabel ?? skill.category ?? skill.label,
    description: skill.description ?? skill.summary ?? defaultDescription,
    evidenceCount: skill.evidenceCount ?? uniqueProjects.length + uniqueExperiences.length,
    projects: uniqueProjects.slice(0, 4),
    experiences: uniqueExperiences.slice(0, 3),
    stacks,
    proofPoints: skill.proofPoints ?? [],
  };
}

export default function ProvenSkillsSection({ projects = [], experiences = [], provenSkills = [] }) {
  const { localizedPath, t } = useLanguage();
  const { isVisible } = useItemVisibility();
  const skills = useMemo(() => {
    const apiSkills = (provenSkills ?? [])
      .map((skill) => normalizeApiSkill(skill, projects, experiences, t("skills.description")))
      .filter((skill) => skill && skill.evidenceCount > 0);

    const source = apiSkills.length > 0 ? apiSkills : buildProvenSkills(projects, experiences);
    return source.filter((skill) => isVisible(skillVisibilityKey(skill)));
  }, [projects, experiences, provenSkills, t, isVisible]);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const buttonRefs = useRef([]);

  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) ?? skills[0];
  const selectedSkillIndex = Math.max(0, skills.findIndex((skill) => skill.id === selectedSkill?.id));
  const selectedSkillNumber = String(selectedSkillIndex + 1).padStart(2, "0");

  if (skills.length === 0) return null;

  return (
    <section id="skills" className="page-section proven-skills-section">
      <SectionTitle
        reveal="soft"
        eyebrow={t("skills.eyebrow")}
        title={t("skills.title")}
        description={t("skills.description")}
      />

      <div className="proven-skills-grid">
        <div className="proven-skills-list" role="tablist" aria-label={t("skills.tabLabel")}>
          {skills.map((skill, index) => {
            const selected = skill.id === selectedSkill?.id;

            return (
              <button
                key={skill.id}
                ref={(node) => { buttonRefs.current[index] = node; }}
                type="button"
                role="tab"
                id={`skill-tab-${skill.id}`}
                aria-controls={`skill-panel-${skill.id}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={`proven-skill-button ${selected ? "is-selected" : "is-locked"}`}
                onClick={() => setSelectedSkillId(skill.id)}
                onKeyDown={(event) => {
                  if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const lastIndex = skills.length - 1;
                  let nextIndex = index;
                  if (event.key === "Home") nextIndex = 0;
                  else if (event.key === "End") nextIndex = lastIndex;
                  else if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % skills.length;
                  else nextIndex = (index - 1 + skills.length) % skills.length;
                  setSelectedSkillId(skills[nextIndex].id);
                  buttonRefs.current[nextIndex]?.focus();
                }}
              >
                <span className="proven-skill-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="proven-skill-copy">
                  <strong>{skill.label}</strong>
                  <span>{skill.description}</span>
                </span>
                <span className="proven-skill-side">
                  <span className="proven-skill-count">{skill.evidenceCount}</span>
                  <span className="proven-skill-selected-label">{t("skills.detail")}</span>
                </span>
                <span className="proven-skill-connector" aria-hidden="true">
                  <span className="proven-skill-connector-line">
                    <span className="proven-skill-connector-pulse" />
                  </span>
                  <span className="proven-skill-connector-arrow">›</span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedSkill && (
          <>
            <div className="proven-skills-mobile-bridge" aria-hidden="true">
              <span className="proven-skills-mobile-bridge-index">{selectedSkillNumber}</span>
              <span>{t("skills.showsDetail")}</span>
              <span className="proven-skills-mobile-bridge-arrow">↓</span>
            </div>
            <Card key={selectedSkill.id} id={`skill-panel-${selectedSkill.id}`} role="tabpanel" aria-labelledby={`skill-tab-${selectedSkill.id}`} aria-live="polite" className="island-card proven-skill-detail-card" radius="xl">
              <div className="proven-skill-detail-orb" aria-hidden="true" />
              <Stack gap="lg" className="proven-skill-detail-content">
                <div className="proven-skill-detail-context">
                  <span className="proven-skill-detail-index">{selectedSkillNumber}</span>
                  <span className="proven-skill-detail-context-copy">
                    <small>{t("skills.selected")}</small>
                    <strong>{selectedSkill.shortLabel}</strong>
                  </span>
                  <span className="proven-skill-detail-context-line" aria-hidden="true" />
                </div>
                <Group justify="space-between" gap="md" align="flex-start">
                  <div>
                    <Badge className="executive-badge">{selectedSkill.shortLabel}</Badge>
                    <Title order={3}>{selectedSkill.label}</Title>
                    <Text className="proven-skill-detail-text">{selectedSkill.description}</Text>
                  </div>
                  <div className="proven-skill-score">
                    <strong>{selectedSkill.evidenceCount}</strong>
                    <span>{selectedSkill.evidenceCount > 1 ? t("skills.proofs") : t("skills.proof")}</span>
                  </div>
                </Group>

                {selectedSkill.stacks.length > 0 && (
                  <Group gap={8} className="proven-skill-stack-row">
                    {selectedSkill.stacks.map((stack) => (
                      <Badge key={`${selectedSkill.id}-${stack}`} className="stack-badge" variant="outline">
                        {stack}
                      </Badge>
                    ))}
                  </Group>
                )}

                {selectedSkill.proofPoints?.length > 0 && (
                  <div className="proven-proof-points">
                    {selectedSkill.proofPoints.slice(0, 4).map((point) => (
                      <span key={`${selectedSkill.id}-${point}`}>{point}</span>
                    ))}
                  </div>
                )}

                <div className="proven-skill-proof-grid">
                  <div className="proven-proof-column">
                    <Text className="proven-proof-kicker">{t("skills.relatedProjects")}</Text>
                    <Stack gap="xs">
                      {selectedSkill.projects.map((project) => (
                        <Link key={project.id ?? project.title} to={localizedPath(`/projects/${getProjectSlug(project)}`)} className="proven-proof-item">
                          <span>{project.title}</span>
                          <small>{project.subtitle || project.shortDescription}</small>
                        </Link>
                      ))}
                    </Stack>
                  </div>

                  <div className="proven-proof-column">
                    <Text className="proven-proof-kicker">{t("skills.relatedExperiences")}</Text>
                    <Stack gap="xs">
                      {selectedSkill.experiences.length > 0 ? (
                        selectedSkill.experiences.map((experience) => (
                          <a key={experience.id ?? experience.title} href="#timeline" className="proven-proof-item">
                            <span>{experience.title}</span>
                            <small>{experience.organization}</small>
                          </a>
                        ))
                      ) : (
                        <div className="proven-proof-empty">{t("skills.projectEvidenceOnly")}</div>
                      )}
                    </Stack>
                  </div>
                </div>

                <Group gap="sm" className="proven-skill-actions">
                  {selectedSkill.projects[0] && (
                    <Button component={Link} to={localizedPath(`/projects/${getProjectSlug(selectedSkill.projects[0])}`)} radius="xl" className="primary-action">
                      {t("skills.mainCaseStudy")}
                    </Button>
                  )}
                  <Button component="a" href="#projects" radius="xl" variant="light">
                    {t("skills.exploreProjects")}
                  </Button>
                </Group>
              </Stack>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
