export const CONTACT_LABELS = {
  EMAIL: "Email",
  PHONE_NUMBER: "Téléphone",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
  PORTFOLIO: "Portfolio",
  WEBSITE: "Site web",
  TWITTER: "X",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
};

export const CATEGORY_LABELS = {
  SCHOOL: "Formation",
  INTERNSHIP: "Stage",
  ALTERNANCE: "Alternance",
  VOLUNTEERING: "Bénévolat",
  CDI: "CDI",
  CDD: "CDD",
  FREELANCE: "Freelance",
  CERTIFICATION: "Certification",
};

export const STATUS_LABELS = {
  PLANNED: "Prévu",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  MAINTAINED: "Maintenu",
  ARCHIVED: "Archivé",
};

export const LINK_LABELS = {
  GITHUB: "GitHub",
  DEMO: "Démo",
  DOCUMENTATION: "Documentation",
  FIGMA: "Figma",
  VIDEO: "Vidéo",
  ARTICLE: "Article",
  OTHER: "Lien",
};

export function formatDate(date) {
  if (!date) return "Aujourd’hui";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function formatPeriod(startDate, endDate, currentPosition) {
  const start = formatDate(startDate);
  const end = currentPosition ? "Aujourd’hui" : formatDate(endDate);
  return `${start} — ${end}`;
}

export function sortByDisplayOrder(items = []) {
  return [...items].sort((a, b) => {
    const ao = a?.displayOrder ?? 999;
    const bo = b?.displayOrder ?? 999;
    if (ao !== bo) return ao - bo;
    return String(b?.startDate ?? "").localeCompare(String(a?.startDate ?? ""));
  });
}

export function normalizeUrl(value) {
  if (!value || value === "#") return value;

  const url = String(value).trim();

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `https://${url}`;
}

export function getContactHref(contact) {
  const value = contact?.value ?? "";
  if (!value) return "#";
  if (contact.type === "EMAIL") return `mailto:${value}`;
  if (contact.type === "PHONE_NUMBER" || contact.type === "WHATSAPP") return `tel:${value.replaceAll(" ", "")}`;
  return normalizeUrl(value);
}

export function getInitials(owner) {
  const first = owner?.firstName?.trim()?.[0] ?? "";
  const last = owner?.name?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "PF";
}

export function collectStacks(projects = []) {
  const counts = new Map();
  projects.forEach((project) => {
    (project?.stacks ?? []).forEach((stack) => {
      counts.set(stack, (counts.get(stack) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 24)
    .map(([label, count]) => ({ label, count }));
}

export function collectExperienceSkills(experiences = []) {
  const counts = new Map();
  experiences.forEach((experience) => {
    (experience?.skills ?? []).forEach((skill) => {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export function getOwnerFullName(owner) {
  return [owner?.firstName, owner?.name].filter(Boolean).join(" ") || "Portfolio professionnel";
}

export function getPrimaryContact(owner, type) {
  return (owner?.contacts ?? []).find((contact) => contact.type === type);
}

export function getPublicProjects(projects = []) {
  return projects.filter((project) => project?.published !== false);
}

export function getFeaturedProjects(projects = []) {
  return getPublicProjects(projects).filter((project) => project?.featured === true);
}

export function getAvailableStatuses(projects = []) {
  return [...new Set(getPublicProjects(projects).map((project) => project.status).filter(Boolean))];
}

export function getAvailableStacks(projects = []) {
  return collectStacks(getPublicProjects(projects)).map((stack) => stack.label);
}

export function inferSpecialty(projects = [], experiences = []) {
  const text = `${projects.map((project) => `${project.title} ${project.subtitle} ${(project.stacks ?? []).join(" ")}`).join(" ")} ${experiences
    .map((experience) => `${experience.title} ${(experience.skills ?? []).join(" ")}`)
    .join(" ")}`.toLowerCase();

  const specialties = [
    { label: "Backend & architecture", terms: ["java", "spring", "postgresql", "api", "maven", "backend"] },
    { label: "Data pipelines", terms: ["data", "ais", "pipeline", "ingestion", "csv", "python", "systemd"] },
    { label: "Interfaces produit", terms: ["react", "tailwind", "symfony", "ui", "frontend", "web"] },
    { label: "Performance graphique", terms: ["opengl", "jogl", "jni", "javafx", "c", "graphe"] },
    { label: "Systèmes concurrents", terms: ["concurrence", "realtime", "broker", "futures", "thread"] },
  ];

  return specialties
    .map((specialty) => ({
      ...specialty,
      score: specialty.terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0),
    }))
    .filter((specialty) => specialty.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function buildVCard(owner) {
  const fullName = getOwnerFullName(owner);
  const email = getPrimaryContact(owner, "EMAIL")?.value ?? "";
  const phone = getPrimaryContact(owner, "PHONE_NUMBER")?.value ?? "";
  const website = getPrimaryContact(owner, "PORTFOLIO")?.value ?? getPrimaryContact(owner, "WEBSITE")?.value ?? owner?.prof?.portfolioUrl ?? "";
  const title = owner?.prof?.title ?? "Portfolio professionnel";

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName}`,
    `N:${owner?.name ?? ""};${owner?.firstName ?? ""};;;`,
    `TITLE:${title}`,
    email ? `EMAIL;TYPE=INTERNET:${email}` : "",
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    website ? `URL:${normalizeUrl(website)}` : "",
    owner?.address ? `ADR;TYPE=WORK:;;${owner.address}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

export function downloadText(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
