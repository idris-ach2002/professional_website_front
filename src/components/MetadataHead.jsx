import { useEffect } from "react";
import useLanguage from "../localization/useLanguage";
import {
  collectStacks,
  getOwnerFullName,
  getPrimaryContact,
  getProjectSlug,
  getPublicProjects,
  normalizeUrl,
} from "../utils/portfolio";
import { buildCloudinaryImageUrl } from "../utils/responsiveImage";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) element.setAttribute(key, value);
    else element.removeAttribute(key);
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function absoluteUrl(value, base) {
  if (!value) return "";
  try {
    return new URL(normalizeUrl(value), base).toString();
  } catch {
    return "";
  }
}

function buildPagePath(page, project) {
  if (page === "recruiter") return "/recruiter";
  if (page === "cv") return "/cv";
  if (page === "project" && project) return `/projects/${getProjectSlug(project)}`;
  return "/";
}

export default function MetadataHead({ owner, projects = [], experiences = [], page = "home", project = null }) {
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!owner) return;

    const fullName = getOwnerFullName(owner);
    const profile = owner.prof ?? owner.profile ?? {};
    const baseUrl = absoluteUrl(profile.portfolioUrl || window.location.origin, window.location.origin) || window.location.origin;
    const pagePath = buildPagePath(page, project);
    const localizedPagePath = language === "en"
      ? (pagePath === "/" ? "/en" : `/en${pagePath}`)
      : pagePath;
    const canonicalUrl = new URL(localizedPagePath, baseUrl);

    const homeDescription = profile.shortDescription || profile.description || t("hero.professionalPortfolio");
    const pageTitle = page === "project" && project
      ? `${project.title} — ${t("case.label")} | ${fullName}`
      : page === "recruiter"
        ? `${fullName} — ${t("nav.recruiter")}`
        : page === "cv"
          ? `${t("cv.document")} — ${fullName}`
          : `${fullName} — ${profile.title ?? t("hero.professionalPortfolio")}`;
    const description = (
      page === "project" && project
        ? project.shortDescription || project.description || t("case.label")
        : page === "recruiter"
          ? t("recruiter.intro")
          : page === "cv"
            ? t("cv.description")
            : homeDescription
    ).slice(0, 165);

    const stacks = collectStacks(projects).map((stack) => stack.label).slice(0, 12);
    const email = getPrimaryContact(owner, "EMAIL")?.value;
    const sameAs = (owner.contacts ?? [])
      .filter((contact) => ["LINKEDIN", "GITHUB", "PORTFOLIO", "WEBSITE"].includes(contact.type))
      .map((contact) => absoluteUrl(contact.value, baseUrl))
      .filter(Boolean);
    const imageSource = buildCloudinaryImageUrl(project?.imageUrl || profile.profileImageUrl, { width: 1200 });
    const image = absoluteUrl(imageSource, baseUrl);
    const canonical = canonicalUrl.toString();

    document.documentElement.lang = language;
    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: "index, follow, max-image-preview:large" });
    upsertMeta('meta[name="keywords"]', {
      name: "keywords",
      content: [fullName, profile.title, profile.subtitle, ...(project?.stacks ?? stacks)].filter(Boolean).join(", "),
    });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: page === "project" ? "article" : "profile" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: language === "en" ? "en_GB" : "fr_FR" });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: image ? "summary_large_image" : "summary" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

    const frUrl = new URL(pagePath, baseUrl);
    const enUrl = new URL(pagePath === "/" ? "/en" : `/en${pagePath}`, baseUrl);
    upsertLink('link[rel="alternate"][hreflang="fr"]', { rel: "alternate", hreflang: "fr", href: frUrl.toString() });
    upsertLink('link[rel="alternate"][hreflang="en"]', { rel: "alternate", hreflang: "en", href: enUrl.toString() });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: "alternate", hreflang: "x-default", href: frUrl.toString() });

    const jsonLd = page === "project" && project
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name: project.title,
          description,
          url: canonical,
          image: image || undefined,
          author: { "@type": "Person", name: fullName, url: baseUrl },
          programmingLanguage: project.stacks ?? [],
          codeRepository: absoluteUrl(project.githubUrl, baseUrl) || undefined,
          keywords: (project.stacks ?? []).join(", "),
        }
      : {
          "@context": "https://schema.org",
          "@type": "Person",
          name: fullName,
          jobTitle: profile.title,
          description,
          email,
          url: canonical,
          image: image || undefined,
          address: owner.address || profile.location,
          sameAs,
          knowsAbout: stacks,
          alumniOf: experiences
            .filter((experience) => experience.category === "SCHOOL")
            .map((experience) => ({ "@type": "CollegeOrUniversity", name: experience.organization })),
          workExample: getPublicProjects(projects).slice(0, 6).map((item) => ({
            "@type": "CreativeWork",
            name: item.title,
            description: item.shortDescription || item.description,
            url: new URL(
              language === "en"
                ? `/en/projects/${getProjectSlug(item)}`
                : `/projects/${getProjectSlug(item)}`,
              baseUrl,
            ).toString(),
            keywords: (item.stacks ?? []).join(", "),
          })),
        };

    let script = document.head.querySelector('script[data-seo="portfolio-jsonld"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "portfolio-jsonld";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }, [experiences, language, owner, page, project, projects, t]);

  return null;
}
