import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { demoOwner } from "../src/data/demoPortfolio.js";
import { getProjectSlug, getPublicProjects, sortByDisplayOrder } from "../src/utils/portfolio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");

function readEnvFiles() {
  const values = {};
  const mode = process.env.NODE_ENV === "development" ? "development" : "production";
  const filenames = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  for (const filename of filenames) {
    const fullPath = path.join(root, filename);
    if (!fs.existsSync(fullPath)) continue;

    for (const rawLine of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  }

  return values;
}

const fileEnv = readEnvFiles();
const configuredBase = process.env.PUBLIC_SITE_URL
  || process.env.VITE_PUBLIC_SITE_URL
  || fileEnv.PUBLIC_SITE_URL
  || fileEnv.VITE_PUBLIC_SITE_URL
  || "";
const baseUrl = configuredBase ? new URL(configuredBase).toString().replace(/\/$/, "") : "";

if (!fs.existsSync(indexPath)) {
  console.error("Static page generation failed: dist/index.html is missing. Run Vite first.");
  process.exit(1);
}

const template = fs.readFileSync(indexPath, "utf8");
const ownerName = [demoOwner.firstName, demoOwner.name].filter(Boolean).join(" ");
const profile = demoOwner.prof ?? {};
const projects = getPublicProjects(sortByDisplayOrder(demoOwner.projects ?? []));

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

function absolute(pathname) {
  return baseUrl ? new URL(pathname, `${baseUrl}/`).toString() : "";
}

function renderHtml({ title, description, pathname, image, type = "website", jsonLd }) {
  const canonical = absolute(pathname);
  const absoluteImage = image && baseUrl ? new URL(image, `${baseUrl}/`).toString() : image || "";
  const metadata = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}" />` : "",
    absoluteImage ? `<meta property="og:image" content="${escapeHtml(absoluteImage)}" />` : "",
    `<meta name="twitter:card" content="${absoluteImage ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    absoluteImage ? `<meta name="twitter:image" content="${escapeHtml(absoluteImage)}" />` : "",
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : "",
    baseUrl ? `<link rel="alternate" hreflang="fr" href="${escapeHtml(canonical)}" />` : "",
    baseUrl ? `<link rel="alternate" hreflang="en" href="${escapeHtml(`${canonical}?lang=en`)}" />` : "",
    jsonLd ? `<script type="application/ld+json">${safeJson(jsonLd)}</script>` : "",
  ].filter(Boolean).join("\n    ");

  return template
    .replace(/<html\b[^>]*lang="[^"]*"/i, '<html lang="fr"')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace("</head>", `    ${metadata}\n  </head>`);
}

function writePage(pathname, html) {
  const outputDirectory = path.join(dist, pathname.replace(/^\//, ""));
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
}

for (const project of projects) {
  const slug = getProjectSlug(project);
  const pathname = `/projects/${slug}`;
  const title = `${project.title} — Étude de cas | ${ownerName}`;
  const description = (project.shortDescription || project.description || "Étude de cas technique").slice(0, 165);
  const canonical = absolute(pathname);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.title,
    description,
    url: canonical || undefined,
    image: project.imageUrl || undefined,
    author: { "@type": "Person", name: ownerName, url: baseUrl || undefined },
    programmingLanguage: project.stacks ?? [],
    codeRepository: project.githubUrl || undefined,
  };

  writePage(pathname, renderHtml({
    title,
    description,
    pathname,
    image: project.imageUrl,
    type: "article",
    jsonLd,
  }));
}

writePage("/recruiter", renderHtml({
  title: `${ownerName} — Vue recruteur`,
  description: "Profil condensé, compétences démontrées, expériences pertinentes et projets prioritaires.",
  pathname: "/recruiter",
  image: profile.profileImageUrl,
  type: "profile",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ownerName,
    jobTitle: profile.title,
    description: profile.shortDescription || profile.description,
    url: absolute("/recruiter") || undefined,
    image: profile.profileImageUrl || undefined,
  },
}));

writePage("/cv", renderHtml({
  title: `CV — ${ownerName}`,
  description: profile.shortDescription || `Curriculum vitæ de ${ownerName}`,
  pathname: "/cv",
  image: profile.profileImageUrl,
  type: "profile",
}));

if (baseUrl) {
  const urls = ["/", "/recruiter", "/cv", ...projects.map((project) => `/projects/${getProjectSlug(project)}`)];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((pathname, index) => [
      "  <url>",
      `    <loc>${escapeHtml(absolute(pathname))}</loc>`,
      `    <priority>${index === 0 ? "1.0" : pathname === "/recruiter" ? "0.9" : "0.7"}</priority>`,
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
} else {
  console.warn("VITE_PUBLIC_SITE_URL is not configured: static HTML was generated without canonical URLs and the public sitemap was left unchanged.");
}

console.log(`Static pages generated: ${projects.length} projects, recruiter view and CV page.`);
