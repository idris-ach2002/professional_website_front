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

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "projet";
}

export function getProjectSlug(project) {
  return project?.slug || slugify(project?.title || `project-${project?.id ?? "case-study"}`);
}

export function findProjectBySlug(projects = [], slug) {
  const normalizedSlug = slugify(slug);
  return getPublicProjects(projects).find((project) => getProjectSlug(project) === normalizedSlug) ?? null;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function textContainsAny(text, terms = []) {
  const normalizedText = String(text ?? "").toLowerCase();
  return terms.some((term) => normalizedText.includes(String(term).toLowerCase()));
}

function projectSearchText(project) {
  return [
    project?.title,
    project?.subtitle,
    project?.shortDescription,
    project?.description,
    ...(project?.stacks ?? []),
    ...(project?.features ?? []),
    ...(project?.proofTags ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function experienceSearchText(experience) {
  return [
    experience?.title,
    experience?.organization,
    experience?.summary,
    experience?.description,
    ...(experience?.skills ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

const PROVEN_SKILL_DEFINITIONS = [
  {
    id: "backend-architecture",
    label: "Backend & architecture",
    shortLabel: "Backend",
    description: "API REST, règles métier, persistance, versioning et conception de services maintenables.",
    terms: ["java", "spring", "spring boot", "api", "backend", "jpa", "hibernate", "flyway", "maven", "validation", "architecture"],
  },
  {
    id: "data-pipelines",
    label: "Data pipelines",
    shortLabel: "Data",
    description: "Collecte, ingestion, transformation, stockage PostgreSQL et exploitation de données volumineuses.",
    terms: ["data", "ais", "pipeline", "ingestion", "csv", "postgresql", "python", "systemd", "batch", "export"],
  },
  {
    id: "frontend-product",
    label: "Interfaces produit",
    shortLabel: "Frontend",
    description: "Interfaces React orientées usage, filtres, modales, interactions et lisibilité recruteur.",
    terms: ["react", "mantine", "tailwind", "frontend", "ui", "ux", "web", "gsap", "vite", "interface"],
  },
  {
    id: "graphics-performance",
    label: "Performance graphique",
    shortLabel: "Graphique",
    description: "Rendu natif, visualisation, interactions temps réel et séparation stricte UI / moteur.",
    terms: ["opengl", "jogl", "jni", "javafx", "graph", "graphe", "performance", "rendu", "native", "c"],
  },
  {
    id: "devops-deployment",
    label: "DevOps & déploiement",
    shortLabel: "DevOps",
    description: "Dockerisation, environnements reproductibles, exposition cloud, stockage fichiers et supervision.",
    terms: ["docker", "kubernetes", "cloudflare", "render", "neon", "minio", "redis", "hpa", "ingress", "cloudinary", "systemd"],
  },
  {
    id: "software-quality",
    label: "Qualité logicielle",
    shortLabel: "Qualité",
    description: "Structuration, tests, robustesse, documentation, maintenabilité et gestion des cas limites.",
    terms: ["test", "tests", "documentation", "mvc", "robuste", "qualité", "maintenable", "validation", "refactor", "séparation", "architecture"],
  },
];

export function buildProvenSkills(projects = [], experiences = []) {
  const publicProjects = getPublicProjects(projects);

  return PROVEN_SKILL_DEFINITIONS.map((definition) => {
    const matchingProjects = publicProjects
      .map((project) => {
        const text = projectSearchText(project);
        const matches = definition.terms.filter((term) => textContainsAny(text, [term]));
        return {
          project,
          matches,
          score: matches.length + ((project?.featured && matches.length > 0) ? 1 : 0),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.project?.displayOrder ?? 999) - (b.project?.displayOrder ?? 999));

    const matchingExperiences = experiences
      .map((experience) => {
        const text = experienceSearchText(experience);
        const matches = definition.terms.filter((term) => textContainsAny(text, [term]));
        return { experience, matches, score: matches.length };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.experience?.displayOrder ?? 999) - (b.experience?.displayOrder ?? 999));

    const stacks = uniqueStrings(matchingProjects.flatMap(({ project }) => project?.stacks ?? [])).slice(0, 8);
    const evidenceCount = matchingProjects.length + matchingExperiences.length;

    return {
      ...definition,
      score: matchingProjects.reduce((total, item) => total + item.score, 0) + matchingExperiences.reduce((total, item) => total + item.score, 0),
      evidenceCount,
      projects: matchingProjects.map((item) => item.project).slice(0, 4),
      experiences: matchingExperiences.map((item) => item.experience).slice(0, 3),
      stacks,
    };
  })
    .filter((skill) => skill.evidenceCount > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, 6);
}

export function getCaseStudySections(project) {
  const caseStudy = project?.caseStudy ?? {};
  const features = project?.features ?? [];
  const stacks = project?.stacks ?? [];
  const outcomes = caseStudy.outcomes?.length ? caseStudy.outcomes : caseStudy.results;

  return [
    {
      id: "problem",
      label: "Problème traité",
      body: caseStudy.problem || project?.shortDescription || "Clarifier le besoin, structurer le périmètre et construire une solution exploitable.",
    },
    {
      id: "context",
      label: "Contexte",
      body: caseStudy.context || project?.description,
    },
    {
      id: "role",
      label: "Rôle personnel",
      body: caseStudy.role || "Conception, développement, intégration, documentation et arbitrages techniques sur le périmètre logiciel.",
    },
    {
      id: "architecture",
      label: "Architecture",
      body: caseStudy.architecture || `Architecture construite autour de ${stacks.slice(0, 5).join(", ") || "composants séparés"}, avec une séparation claire entre responsabilité métier, interface et persistance.`,
    },
    {
      id: "choices",
      label: "Choix techniques",
      items: caseStudy.technicalChoices || features.slice(0, 4),
    },
    {
      id: "challenges",
      label: "Difficultés résolues",
      items: caseStudy.challenges || [
        "Maintenir une interface lisible malgré la densité d'information.",
        "Stabiliser les interactions et les états pour éviter les comportements fragiles.",
      ],
    },
    {
      id: "solutions",
      label: "Solutions mises en place",
      items: caseStudy.solutions,
    },
    {
      id: "outcomes",
      label: "Résultats",
      items: outcomes || [
        "Prototype exploitable et présentable dans un contexte professionnel.",
        "Base technique claire pour continuer l'évolution du projet.",
      ],
    },
    {
      id: "limits",
      label: "Limites assumées",
      items: caseStudy.limits,
    },
    {
      id: "next",
      label: "Suite possible",
      body: caseStudy.nextSteps || "Industrialiser les tests, enrichir la documentation et ajouter des scénarios d'usage plus ciblés.",
    },
  ].filter((section) => section.body || section.items?.length > 0);
}
