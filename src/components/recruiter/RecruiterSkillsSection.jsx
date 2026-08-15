import { Text, Title } from "@mantine/core";

export default function RecruiterSkillsSection({ skills, techGroups, t }) {
  return (
    <section className="recruiter-editorial-section recruiter-skills-section">
      <div className="recruiter-skills-layout">
        <div>
          <header className="recruiter-section-header">
            <Text className="recruiter-overline">{t("recruiter.skillsContext")}</Text>
            <Title order={2}>{t("recruiter.provenSkills")}</Title>
            <Text>{t("recruiter.skillsIntro")}</Text>
          </header>

          <div className="recruiter-skill-evidence-list">
            {(skills ?? []).slice(0, 6).map((skill) => (
              <article key={skill.id ?? skill.label} className="recruiter-skill-evidence-row">
                <div className="recruiter-skill-evidence-row__heading">
                  <strong>{skill.label}</strong>
                  {skill.evidenceCount ? <span>{skill.evidenceCount} {t("recruiter.evidence")}</span> : null}
                </div>
                <p>{skill.description || skill.summary}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="recruiter-tech-map">
          <Text className="recruiter-overline">{t("recruiter.technicalLandscape")}</Text>
          <Title order={3}>{t("recruiter.technicalProfile")}</Title>
          <div className="recruiter-tech-map__groups">
            {(techGroups ?? []).map((group) => (
              <div key={group.id} className="recruiter-tech-group">
                <strong>{t(group.labelKey)}</strong>
                <div>
                  {group.items.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
