import { Text, Title } from "@mantine/core";
import { formatPeriod } from "../../utils/portfolio";
import OrganizationBrand from "../OrganizationBrand";

export default function RecruiterEducationSection({ education, locale, t }) {
  if (!education?.length) return null;

  return (
    <section className="recruiter-editorial-section recruiter-education-section">
      <header className="recruiter-section-header">
        <Text className="recruiter-overline">{t("recruiter.educationContext")}</Text>
        <Title order={2}>{t("recruiter.education")}</Title>
      </header>

      <div className="recruiter-education-list">
        {education.map((item) => (
          <article key={`${item.displayOrder}-${item.title}`} className="recruiter-education-row">
            <div className="recruiter-education-period">
              {formatPeriod(item.startDate, item.endDate, item.currentPosition, locale)}
            </div>
            <div>
              <Title order={3}>{item.title}</Title>
              <OrganizationBrand organization={item.organization} className="recruiter-education-org" />
              <Text>{item.summary || item.description}</Text>
            </div>
            {(item.skills ?? []).length > 0 && (
              <div className="recruiter-education-skills">
                {(item.skills ?? []).slice(0, 8).map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
