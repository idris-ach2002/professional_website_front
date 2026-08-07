import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPublicSiteUrl, loadPublicPortfolioSnapshot } from "./public-snapshot.mjs";
import { getProjectSlug, getPublicProjects, sortByDisplayOrder } from "../src/utils/portfolio.js";
import { buildCloudinaryImageUrl } from "../src/utils/responsiveImage.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");
const baseUrl = getPublicSiteUrl();

if (!fs.existsSync(indexPath)) {
  console.error("Static page generation failed: dist/index.html is missing. Run Vite first.");
  process.exit(1);
}

const template = fs.readFileSync(indexPath, "utf8");
const snapshot = await loadPublicPortfolioSnapshot();

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("</script", "<\\/script");
}

function localizedPath(pathname, locale) {
  if (locale !== "en") return pathname;
  return pathname === "/" ? "/en" : `/en${pathname}`;
}

function absolute(pathname) {
  return baseUrl ? new URL(pathname, `${baseUrl}/`).toString() : "";
}

function cleanHead(html) {
  return html
    .replace(/\s*<meta\s+(?:name|property)="(?:description|robots|keywords|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, "")
    .replace(/\s*<link\s+rel="(?:canonical|alternate)"[^>]*>/gi, "")
    .replace(/\s*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");
}

function renderStaticBody({ owner, locale, page, project = null, projects = [] }) {
  const profile = owner.prof ?? owner.profile ?? {};
  const fullName = [owner.firstName, owner.name].filter(Boolean).join(" ");
  const homePath = localizedPath("/", locale);
  const recruiterPath = localizedPath("/recruiter", locale);
  const cvPath = localizedPath("/cv", locale);
  const labels = locale === "en"
    ? { projects: "Projects", recruiter: "Recruiter view", cv: "Résumé", stacks: "Technologies", features: "Key features" }
    : { projects: "Projets", recruiter: "Vue recruteur", cv: "CV", stacks: "Technologies", features: "Fonctionnalités clés" };

  const projectList = projects.slice(0, 12).map((item) => {
    const slug = getProjectSlug(item);
    return `<li><a href="${escapeHtml(localizedPath(`/projects/${slug}`, locale))}">${escapeHtml(item.title)}</a>${item.shortDescription ? ` — ${escapeHtml(item.shortDescription)}` : ""}</li>`;
  }).join("");

  const projectContent = project ? `
      <article>
        <h1>${escapeHtml(project.title)}</h1>
        ${project.subtitle ? `<p>${escapeHtml(project.subtitle)}</p>` : ""}
        ${project.shortDescription || project.description ? `<p>${escapeHtml(project.shortDescription || project.description)}</p>` : ""}
        ${project.stacks?.length ? `<h2>${labels.stacks}</h2><ul>${project.stacks.map((stack) => `<li>${escapeHtml(stack)}</li>`).join("")}</ul>` : ""}
        ${project.features?.length ? `<h2>${labels.features}</h2><ul>${project.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>` : ""}
      </article>` : "";

  const defaultContent = `
      <header>
        <p>${escapeHtml(fullName)}</p>
        <h1>${escapeHtml(profile.title || fullName)}</h1>
        ${profile.shortDescription || profile.description ? `<p>${escapeHtml(profile.shortDescription || profile.description)}</p>` : ""}
      </header>
      ${page === "home" && projectList ? `<section><h2>${labels.projects}</h2><ul>${projectList}</ul></section>` : ""}`;

  return `<main id="seo-static-content" data-static-seo="${escapeHtml(page)}" lang="${locale}">
      <nav aria-label="${locale === "en" ? "Main navigation" : "Navigation principale"}">
        <a href="${homePath}">${fullName}</a>
        <a href="${recruiterPath}">${labels.recruiter}</a>
        <a href="${cvPath}">${labels.cv}</a>
      </nav>
      ${projectContent || defaultContent}
    </main>`;
}

function renderHtml({ owner, locale, title, description, logicalPath, image, type = "website", jsonLd, page, project, projects, robots = "index, follow, max-image-preview:large" }) {
  const pathname = localizedPath(logicalPath, locale);
  const canonical = absolute(pathname);
  const frCanonical = absolute(logicalPath);
  const enCanonical = absolute(localizedPath(logicalPath, "en"));
  const optimizedImage = buildCloudinaryImageUrl(image, { width: 1200 });
  const absoluteImage = optimizedImage && baseUrl ? new URL(optimizedImage, `${baseUrl}/`).toString() : optimizedImage || "";
  const metadata = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:locale" content="${locale === "en" ? "en_GB" : "fr_FR"}" />`,
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}" />` : "",
    absoluteImage ? `<meta property="og:image" content="${escapeHtml(absoluteImage)}" />` : "",
    `<meta name="twitter:card" content="${absoluteImage ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    absoluteImage ? `<meta name="twitter:image" content="${escapeHtml(absoluteImage)}" />` : "",
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : "",
    frCanonical ? `<link rel="alternate" hreflang="fr" href="${escapeHtml(frCanonical)}" />` : "",
    enCanonical ? `<link rel="alternate" hreflang="en" href="${escapeHtml(enCanonical)}" />` : "",
    frCanonical ? `<link rel="alternate" hreflang="x-default" href="${escapeHtml(frCanonical)}" />` : "",
    jsonLd ? `<script type="application/ld+json" data-seo="portfolio-jsonld">${safeJson(jsonLd)}</script>` : "",
  ].filter(Boolean).join("\n    ");

  const staticBody = renderStaticBody({ owner, locale, page, project, projects });

  return cleanHead(template)
    .replace(/<html\b[^>]*lang="[^"]*"/i, `<html lang="${locale}"`)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace("</head>", `    ${metadata}\n  </head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${staticBody}</div>`);
}

function writePage(pathname, html) {
  if (pathname === "/") {
    fs.writeFileSync(indexPath, html);
    return;
  }
  const outputDirectory = path.join(dist, pathname.replace(/^\//, ""));
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
}

function projectKey(project) {
  return String(project?.id ?? project?.projectId ?? getProjectSlug(project));
}

function buildLocalePages(locale, owner, referenceProjects) {
  const profile = owner.prof ?? owner.profile ?? {};
  const fullName = [owner.firstName, owner.name].filter(Boolean).join(" ");
  const localeProjects = getPublicProjects(sortByDisplayOrder(owner.projects ?? []));
  const localeByKey = new Map(localeProjects.map((project) => [projectKey(project), project]));
  const projects = referenceProjects.map((reference) => localeByKey.get(projectKey(reference)) ?? reference);
  const homeDescription = (profile.shortDescription || profile.description || (locale === "en" ? "Professional software engineering portfolio." : "Portfolio professionnel en ingénierie logicielle.")).slice(0, 165);

  const homeTitle = `${fullName} — ${profile.title || (locale === "en" ? "Software engineer" : "Ingénieur logiciel")}`;
  writePage(localizedPath("/", locale), renderHtml({
    owner,
    locale,
    title: homeTitle,
    description: homeDescription,
    logicalPath: "/",
    image: profile.profileImageUrl,
    type: "profile",
    page: "home",
    projects,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: fullName,
      jobTitle: profile.title,
      description: homeDescription,
      url: absolute(localizedPath("/", locale)) || undefined,
      image: profile.profileImageUrl || undefined,
    },
  }));

  writePage(localizedPath("/recruiter", locale), renderHtml({
    owner,
    locale,
    title: locale === "en" ? `${fullName} — Recruiter view` : `${fullName} — Vue recruteur`,
    description: locale === "en"
      ? "Condensed profile, demonstrated skills, relevant experience and priority projects."
      : "Profil condensé, compétences démontrées, expériences pertinentes et projets prioritaires.",
    logicalPath: "/recruiter",
    image: profile.profileImageUrl,
    type: "profile",
    page: "recruiter",
    projects,
  }));

  writePage(localizedPath("/cv", locale), renderHtml({
    owner,
    locale,
    title: locale === "en" ? `Résumé — ${fullName}` : `CV — ${fullName}`,
    description: homeDescription,
    logicalPath: "/cv",
    image: profile.profileImageUrl,
    type: "profile",
    page: "cv",
    projects,
  }));

  writePage(localizedPath("/admin", locale), renderHtml({
    owner,
    locale,
    title: locale === "en" ? `Administration — ${fullName}` : `Administration — ${fullName}`,
    description: locale === "en" ? "Private portfolio administration area." : "Espace privé d’administration du portfolio.",
    logicalPath: "/admin",
    image: profile.profileImageUrl,
    type: "website",
    page: "admin",
    projects,
    robots: "noindex, nofollow",
  }));

  referenceProjects.forEach((referenceProject) => {
    const project = localeByKey.get(projectKey(referenceProject)) ?? referenceProject;
    const slug = getProjectSlug(referenceProject);
    const logicalPath = `/projects/${slug}`;
    const description = (project.shortDescription || project.description || (locale === "en" ? "Technical case study" : "Étude de cas technique")).slice(0, 165);
    const title = locale === "en"
      ? `${project.title} — Case study | ${fullName}`
      : `${project.title} — Étude de cas | ${fullName}`;
    const canonical = absolute(localizedPath(logicalPath, locale));

    writePage(localizedPath(logicalPath, locale), renderHtml({
      owner,
      locale,
      title,
      description,
      logicalPath,
      image: project.imageUrl,
      type: "article",
      page: "project",
      project,
      projects,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "SoftwareSourceCode",
        name: project.title,
        description,
        url: canonical || undefined,
        image: project.imageUrl || undefined,
        author: { "@type": "Person", name: fullName, url: absolute(localizedPath("/", locale)) || undefined },
        programmingLanguage: project.stacks ?? [],
        codeRepository: project.githubUrl || undefined,
      },
    }));
  });
}

function render404(locale, owner) {
  const fullName = [owner.firstName, owner.name].filter(Boolean).join(" ");
  const title = locale === "en"
    ? `Page not found — ${fullName}`
    : `Page introuvable — ${fullName}`;
  const description = locale === "en"
    ? "The requested page does not exist."
    : "La page demandée n’existe pas.";
  const staticBody = `<main id="seo-static-content" data-static-seo="404" lang="${locale}">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <a href="${escapeHtml(localizedPath("/", locale))}">${locale === "en" ? "Back to home" : "Retour à l’accueil"}</a>
    </main>`;

  return cleanHead(template)
    .replace(/<html\b[^>]*lang="[^"]*"/i, `<html lang="${locale}"`)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace("</head>", `    <meta name="description" content="${escapeHtml(description)}" />\n    <meta name="robots" content="noindex, follow" />\n  </head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${staticBody}</div>`);
}

const referenceProjects = getPublicProjects(sortByDisplayOrder(snapshot.fr.projects ?? []));
buildLocalePages("fr", snapshot.fr, referenceProjects);
buildLocalePages("en", snapshot.en, referenceProjects);
fs.writeFileSync(path.join(dist, "404.html"), render404("fr", snapshot.fr));
fs.mkdirSync(path.join(dist, "en"), { recursive: true });
fs.writeFileSync(path.join(dist, "en", "404.html"), render404("en", snapshot.en));

fs.writeFileSync(path.join(dist, "public-snapshot-meta.json"), `${JSON.stringify({
  generatedAt: snapshot.generatedAt,
  source: snapshot.source,
  projectCount: referenceProjects.length,
  locales: ["fr", "en"],
}, null, 2)}\n`);

if (baseUrl) {
  const logicalUrls = ["/", "/recruiter", "/cv", ...referenceProjects.map((project) => `/projects/${getProjectSlug(project)}`)];
  const urls = logicalUrls.flatMap((pathname) => [pathname, localizedPath(pathname, "en")]);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((pathname) => [
      "  <url>",
      `    <loc>${escapeHtml(absolute(pathname))}</loc>`,
      `    <priority>${pathname === "/" ? "1.0" : pathname === "/recruiter" || pathname === "/en/recruiter" ? "0.9" : "0.7"}</priority>`,
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
} else {
  console.warn("VITE_PUBLIC_SITE_URL is not configured: canonical URLs and sitemap cannot be finalized.");
}

console.log(`Static pages generated from ${snapshot.source}: ${referenceProjects.length} projects in FR and EN.`);
