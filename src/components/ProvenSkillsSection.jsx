import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SectionTitle from "./SectionTitle";
import { buildProvenSkills, getProjectSlug } from "../utils/portfolio";

function normalizeApiSkill(skill, projects = [], experiences = []) {
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
    description: skill.description ?? skill.summary ?? "Compétence appuyée par des projets et expériences publiés.",
    evidenceCount: skill.evidenceCount ?? uniqueProjects.length + uniqueExperiences.length,
    projects: uniqueProjects.slice(0, 4),
    experiences: uniqueExperiences.slice(0, 3),
    stacks,
    proofPoints: skill.proofPoints ?? [],
  };
}

export default function ProvenSkillsSection({ projects = [], experiences = [], provenSkills = [] }) {
  const skills = useMemo(() => {
    const apiSkills = (provenSkills ?? [])
      .map((skill) => normalizeApiSkill(skill, projects, experiences))
      .filter((skill) => skill && skill.evidenceCount > 0);

    return apiSkills.length > 0 ? apiSkills : buildProvenSkills(projects, experiences);
  }, [projects, experiences, provenSkills]);
  const [selectedSkillId, setSelectedSkillId] = useState(null);

  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) ?? skills[0];

  if (skills.length === 0) return null;

  return (
    <section id="skills" className="page-section proven-skills-section">
      <SectionTitle
        reveal="soft"
        eyebrow="Preuves concrètes"
        title="Compétences prouvées"
        description="Chaque compétence est reliée à des projets et expériences réels pour éviter une simple liste de technologies."
      />

      <div className="proven-skills-grid">
        <div className="proven-skills-list" aria-label="Compétences prouvées">
          {skills.map((skill, index) => {
            const selected = skill.id === selectedSkill?.id;

            return (
              <button
                key={skill.id}
                type="button"
                className={`proven-skill-button ${selected ? "is-selected" : ""}`}
                onClick={() => setSelectedSkillId(skill.id)}
                aria-pressed={selected}
              >
                <span className="proven-skill-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="proven-skill-copy">
                  <strong>{skill.label}</strong>
                  <span>{skill.description}</span>
                </span>
                <span className="proven-skill-count">{skill.evidenceCount}</span>
              </button>
            );
          })}
        </div>

        {selectedSkill && (
          <Card className="island-card proven-skill-detail-card" radius="xl">
            <div className="proven-skill-detail-orb" aria-hidden="true" />
            <Stack gap="lg" className="proven-skill-detail-content">
              <Group justify="space-between" gap="md" align="flex-start">
                <div>
                  <Badge className="executive-badge">{selectedSkill.shortLabel}</Badge>
                  <Title order={3}>{selectedSkill.label}</Title>
                  <Text className="proven-skill-detail-text">{selectedSkill.description}</Text>
                </div>
                <div className="proven-skill-score">
                  <strong>{selectedSkill.evidenceCount}</strong>
                  <span>preuve{selectedSkill.evidenceCount > 1 ? "s" : ""}</span>
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
                  <Text className="proven-proof-kicker">Projets associés</Text>
                  <Stack gap="xs">
                    {selectedSkill.projects.map((project) => (
                      <Link key={project.id ?? project.title} to={`/projects/${getProjectSlug(project)}`} className="proven-proof-item">
                        <span>{project.title}</span>
                        <small>{project.subtitle || project.shortDescription}</small>
                      </Link>
                    ))}
                  </Stack>
                </div>

                <div className="proven-proof-column">
                  <Text className="proven-proof-kicker">Expériences liées</Text>
                  <Stack gap="xs">
                    {selectedSkill.experiences.length > 0 ? (
                      selectedSkill.experiences.map((experience) => (
                        <a key={experience.id ?? experience.title} href="#timeline" className="proven-proof-item">
                          <span>{experience.title}</span>
                          <small>{experience.organization}</small>
                        </a>
                      ))
                    ) : (
                      <div className="proven-proof-empty">Les preuves viennent surtout des projets publics.</div>
                    )}
                  </Stack>
                </div>
              </div>

              <Group gap="sm" className="proven-skill-actions">
                {selectedSkill.projects[0] && (
                  <Button component={Link} to={`/projects/${getProjectSlug(selectedSkill.projects[0])}`} radius="xl" className="primary-action">
                    Voir l’étude de cas principale
                  </Button>
                )}
                <Button component="a" href="#projects" radius="xl" variant="light">
                  Explorer les projets
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </div>
    </section>
  );
}
