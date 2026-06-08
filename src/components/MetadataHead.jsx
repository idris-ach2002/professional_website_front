import { useEffect } from "react";
import { collectStacks, getOwnerFullName, getPrimaryContact, getPublicProjects, normalizeUrl } from "../utils/portfolio";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

export default function MetadataHead({ owner, projects, experiences }) {
  useEffect(() => {
    if (!owner) return;

    const fullName = getOwnerFullName(owner);
    const profile = owner.prof ?? {};
    const title = `${fullName} — ${profile.title ?? "Portfolio professionnel"}`;
    const description = (profile.shortDescription || profile.description || "Portfolio professionnel dynamique généré depuis un backend Spring.").slice(0, 165);
    const canonical = normalizeUrl(profile.portfolioUrl || window.location.origin);
    const stacks = collectStacks(projects).map((stack) => stack.label).slice(0, 12);
    const email = getPrimaryContact(owner, "EMAIL")?.value;
    const sameAs = (owner.contacts ?? [])
      .filter((contact) => ["LINKEDIN", "GITHUB", "PORTFOLIO", "WEBSITE"].includes(contact.type))
      .map((contact) => normalizeUrl(contact.value));

    document.documentElement.lang = "fr";
    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: "index, follow, max-image-preview:large" });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: [fullName, profile.title, profile.subtitle, ...stacks].filter(Boolean).join(", ") });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "profile" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: fullName,
      jobTitle: profile.title,
      description,
      email,
      url: canonical,
      address: owner.address || profile.location,
      sameAs,
      knowsAbout: stacks,
      alumniOf: experiences
        .filter((experience) => experience.category === "SCHOOL")
        .map((experience) => ({ "@type": "CollegeOrUniversity", name: experience.organization })),
      hasCredential: experiences
        .filter((experience) => experience.category === "CERTIFICATION")
        .map((experience) => ({ "@type": "EducationalOccupationalCredential", name: experience.title })),
      workExample: getPublicProjects(projects).slice(0, 6).map((project) => ({
        "@type": "CreativeWork",
        name: project.title,
        description: project.shortDescription || project.description,
        url: normalizeUrl(project.demoUrl || project.githubUrl || project.documentationUrl || canonical),
        keywords: (project.stacks ?? []).join(", "),
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
  }, [owner, projects, experiences]);

  return null;
}
