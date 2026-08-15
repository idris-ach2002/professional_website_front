import { Badge, Button, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { getProjectSlug } from "../../utils/portfolio";

function ProjectStack({ project, limit = 8 }) {
  const stacks = (project?.stacks ?? []).slice(0, limit);
  if (stacks.length === 0) return null;
  return <div className="recruiter-project-stack">{stacks.map((stack) => <span key={stack}>{stack}</span>)}</div>;
}

export default function RecruiterProjectsSection({ projects, localizedPath, t }) {
  if (!projects?.length) return <Text>{t("recruiter.noProject")}</Text>;

  const [featured, ...secondary] = projects;
  const featureItems = (featured?.features ?? []).slice(0, 4);

  return (
    <section className="recruiter-editorial-section recruiter-projects-section">
      <header className="recruiter-section-header recruiter-section-header--wide">
        <div>
          <Text className="recruiter-overline">{t("recruiter.projectsContext")}</Text>
          <Title order={2}>{t("recruiter.projects")}</Title>
        </div>
        <Text>{t("recruiter.projectsIntro")}</Text>
      </header>

      <article className="recruiter-project-feature">
        <div className="recruiter-project-feature__copy">
          <div className="recruiter-project-topline">
            <Text className="recruiter-project-type">{t("projects.caseStudy")}</Text>
            {featured.featured && <Badge variant="light">{t("case.focus")}</Badge>}
          </div>
          <Title order={3}>{featured.title}</Title>
          {featured.subtitle && <Text className="recruiter-project-subtitle">{featured.subtitle}</Text>}
          <Text className="recruiter-project-description">{featured.description || featured.shortDescription}</Text>
          <ProjectStack project={featured} limit={10} />
          <Button component={Link} to={localizedPath(`/projects/${getProjectSlug(featured)}`)} className="recruiter-project-cta">
            {t("recruiter.openCaseStudy")}
          </Button>
        </div>

        <div className="recruiter-project-feature__evidence">
          <Text className="recruiter-overline">{t("recruiter.delivered")}</Text>
          {featureItems.length > 0 ? (
            <ul>
              {featureItems.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          ) : (
            <Text>{featured.shortDescription}</Text>
          )}
        </div>
      </article>

      {secondary.length > 0 && (
        <div className="recruiter-project-secondary-grid">
          {secondary.map((project) => (
            <article key={project.id ?? project.title} className="recruiter-project-brief">
              <div>
                <Text className="recruiter-project-type">{t("projects.caseStudy")}</Text>
                <Title order={3}>{project.title}</Title>
                {project.subtitle && <Text className="recruiter-project-subtitle">{project.subtitle}</Text>}
              </div>
              <Text className="recruiter-project-description">{project.shortDescription || project.description}</Text>
              <ProjectStack project={project} limit={7} />
              <Link className="recruiter-text-link" to={localizedPath(`/projects/${getProjectSlug(project)}`)}>
                {t("recruiter.openCaseStudy")} →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
