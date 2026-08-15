import { Badge, Text, Title } from "@mantine/core";
import { formatPeriod } from "../../utils/portfolio";
import OrganizationBrand from "../OrganizationBrand";

function ExperienceMeta({ experience, locale, t }) {
  return (
    <div className="recruiter-experience-meta">
      <span>{t(`category.${experience.category}`, { fallback: experience.category })}</span>
      <span>{formatPeriod(experience.startDate, experience.endDate, experience.currentPosition, locale)}</span>
      {experience.location && <span>{experience.location}</span>}
    </div>
  );
}

export default function RecruiterExperienceSection({ experiences, locale, t }) {
  if (!experiences?.length) return <Text>{t("recruiter.noExperience")}</Text>;

  const [featured, ...secondary] = experiences;

  return (
    <section className="recruiter-editorial-section recruiter-experience-section">
      <header className="recruiter-section-header">
        <Text className="recruiter-overline">{t("recruiter.experienceContext")}</Text>
        <Title order={2}>{t("recruiter.experience")}</Title>
        <Text>{t("recruiter.experienceIntro")}</Text>
      </header>

      <article className="recruiter-experience-feature">
        <div className="recruiter-experience-feature__heading">
          <ExperienceMeta experience={featured} locale={locale} t={t} />
          <Title order={3}>{featured.title}</Title>
          {featured.organization && <OrganizationBrand organization={featured.organization} className="recruiter-experience-org" />}
        </div>
        <div className="recruiter-experience-feature__body">
          {featured.summary && <Text className="recruiter-experience-lead">{featured.summary}</Text>}
          {featured.description && featured.description !== featured.summary && <Text>{featured.description}</Text>}
          {(featured.skills ?? []).length > 0 && (
            <div className="recruiter-evidence-stack">
              {(featured.skills ?? []).slice(0, 12).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
            </div>
          )}
        </div>
      </article>

      {secondary.length > 0 && (
        <div className="recruiter-experience-secondary">
          {secondary.map((experience) => (
            <article key={`${experience.displayOrder}-${experience.title}`} className="recruiter-experience-row">
              <div>
                <ExperienceMeta experience={experience} locale={locale} t={t} />
                <Title order={3}>{experience.title}</Title>
                {experience.organization && <OrganizationBrand organization={experience.organization} className="recruiter-experience-org recruiter-experience-org--secondary" compact />}
              </div>
              <div>
                <Text>{experience.summary || experience.description}</Text>
                {(experience.skills ?? []).length > 0 && (
                  <div className="recruiter-mini-stack">
                    {(experience.skills ?? []).slice(0, 7).map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
