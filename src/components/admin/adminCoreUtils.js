import { normalizeAdminPortfolioJson } from "../../utils/adminJsonImport";
import { uploadProtectedFile } from "../../services/authApi";

export const contactTypeOptions = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE_NUMBER", label: "Téléphone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GITHUB", label: "GitHub" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "WEBSITE", label: "Site web" },
  { value: "TWITTER", label: "Twitter / X" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
];


export const defaultOwnerContacts = [
  { type: "EMAIL", value: "idris.achabou@example.com" },
  { type: "GITHUB", value: "https://github.com/idris-ach2002" },
  { type: "LINKEDIN", value: "https://www.linkedin.com/in/idris-achabou" },
  { type: "PORTFOLIO", value: "https://portfolio.example.com" },
];

export const emptyOwnerForm = {
  name: "ACHABOU",
  firstName: "Idris",
  age: 23,
  active: true,
  address: "Paris, France",
  contacts: defaultOwnerContacts,
  versionTag: "v1",
  versionLabel: "Version initiale",
  versionDescription: "Première version du portfolio.",
  versionPublished: true,
};

export const emptyVersionForm = {
  versionTag: "v2",
  label: "Version alternance 2026",
  description: "Version orientée recherche d’alternance.",
  active: false,
  published: true,
};

export const emptyProfileForm = {
  title: "Alternance ingénierie logicielle",
  subtitle: "Java / Spring Boot / React",
  headline: "Développement logiciel · Architecture backend · Interfaces produit",
  shortDescription: "Portfolio professionnel orienté développement logiciel.",
  description:
    "Je conçois des applications web robustes avec une architecture claire, un backend Spring Boot et un frontend React moderne.",
  location: "Paris, Île-de-France",
  availability: "Disponible pour une alternance à partir de septembre 2026",
  profileImageUrl: "",
  logoUrl: "",
  cvUrl: "",
  portfolioUrl: "https://example.com",
};

export const emptyTimelineForm = {
  title: "Parcours",
  description: "Formation, expériences et projets structurants.",
};

export const emptyExperienceForm = {
  category: "SCHOOL",
  title: "Master Informatique STL",
  organization: "Sorbonne Université",
  location: "Paris",
  summary: "Formation en science et technologie du logiciel.",
  description:
    "Approfondissement en architecture logicielle, développement avancé et systèmes concurrents.",
  startDate: "2025-09-01",
  endDate: "2027-09-01",
  currentPosition: true,
  imageUrl: "",
  websiteUrl: "https://www.sorbonne-universite.fr",
  skills: "Java, Spring Boot, Architecture logicielle",
  displayOrder: 1,
};

export const emptyProjectCaseStudyForm = {
  problem: "",
  context: "",
  role: "",
  architecture: "",
  technicalChoices: "",
  challenges: "",
  solutions: "",
  outcomes: "",
  results: "",
  limits: "",
  nextSteps: "",
};

export const emptyProjectForm = {
  title: "Portfolio professionnel",
  subtitle: "Spring Boot / React / PostgreSQL",
  shortDescription: "Portfolio dynamique alimenté par une API Spring Boot.",
  description:
    "Application permettant de gérer un profil, des expériences, des projets et plusieurs versions du site.",
  status: "IN_PROGRESS",
  startDate: "2026-01-01",
  endDate: "",
  imageUrl: "",
  demoUrl: "https://portfolio.example.com",
  githubUrl: "https://github.com/idris-ach2002/portfolio",
  documentationUrl: "",
  architectureUrl: "",
  slug: "",
  stacks: "Java, Spring Boot, React, PostgreSQL, Docker",
  features: "Versioning, Version active unique, Admin panel, API REST",
  proofTags: "",
  caseStudy: { ...emptyProjectCaseStudyForm },
  featured: true,
  published: true,
  displayOrder: 1,
};

export const emptyProfileFiles = {
  profileImage: null,
  logo: null,
  cv: null,
};

export const emptyExperienceFiles = {
  image: null,
};

export const emptyProjectFiles = {
  image: null,
  documentation: null,
};

export const experienceCategories = [
  "SCHOOL",
  "INTERNSHIP",
  "ALTERNANCE",
  "VOLUNTEERING",
  "CDI",
  "CDD",
];

export const projectStatuses = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "MAINTAINED",
  "ARCHIVED",
];


export function toArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toCsv(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function getEntityId(entity) {
  return entity?.ownerId ?? entity?.id ?? entity?.websiteVersionId;
}

export function getProjectId(project) {
  return project?.projectId ?? project?.id;
}

export function getOwnerLabel(owner) {
  const fullName = [owner?.firstName, owner?.name].filter(Boolean).join(" ");
  return fullName || `Owner ${getEntityId(owner)}`;
}

export function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export function nullIfBlank(value) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createEmptyContact() {
  return { type: "EMAIL", value: "" };
}

export function cloneContactRows(contacts) {
  return (contacts ?? [])
    .map((contact) => ({
      type: contact?.type ?? "EMAIL",
      value: contact?.value ?? "",
    }))
    .filter((contact) => contact.type);
}

export function sanitizeContactRows(contacts) {
  return cloneContactRows(contacts)
    .map((contact) => ({
      type: contact.type,
      value: String(contact.value ?? "").trim(),
    }))
    .filter((contact) => contact.value.length > 0);
}

export function hydrateOwnerForm(owner) {
  const contacts = cloneContactRows(owner?.contacts ?? emptyOwnerForm.contacts);

  return {
    ...emptyOwnerForm,
    name: owner?.name ?? emptyOwnerForm.name,
    firstName: owner?.firstName ?? emptyOwnerForm.firstName,
    age: owner?.age ?? emptyOwnerForm.age,
    active: owner?.active ?? emptyOwnerForm.active,
    address: owner?.address ?? emptyOwnerForm.address,
    contacts: contacts.length > 0 ? contacts : [createEmptyContact()],
  };
}


export function normalizeUrlFromUpload(data) {
  if (!data) return null;

  if (typeof data === "string") {
    if (data.startsWith("http://") || data.startsWith("https://")) return data;
    if (data.startsWith("/")) return `${window.location.origin}${data}`;
    return data;
  }

  return (
    data.directUrl ??
    data.url ??
    data.fileUrl ??
    data.path ??
    data.location ??
    data.href ??
    data.downloadUrl ??
    null
  );
}

export async function uploadFile(file) {
  if (!file) return null;

  const data = await uploadProtectedFile(file);
  const uploadedUrl = normalizeUrlFromUpload(data);

  if (!uploadedUrl || String(uploadedUrl).startsWith("redirect:")) {
    throw new Error(
      "La route d’upload doit retourner une URL JSON exploitable, par exemple { url: \"http://...\" }.",
    );
  }

  return uploadedUrl;
}

export function hydrateProfileForm(profile) {
  if (!profile) return { ...emptyProfileForm };

  return {
    title: profile.title ?? "",
    subtitle: profile.subtitle ?? "",
    headline: profile.headline ?? "",
    shortDescription: profile.shortDescription ?? "",
    description: profile.description ?? "",
    location: profile.location ?? "",
    availability: profile.availability ?? "",
    profileImageUrl: profile.profileImageUrl ?? "",
    logoUrl: profile.logoUrl ?? "",
    cvUrl: profile.cvUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
  };
}

export function hydrateTimelineForm(timeline) {
  return {
    title: timeline?.title ?? emptyTimelineForm.title,
    description: timeline?.description ?? emptyTimelineForm.description,
  };
}

export function hydrateExperiences(timeline) {
  return (timeline?.experiences ?? []).map((experience, index) => ({
    category: experience.category ?? "SCHOOL",
    title: experience.title ?? "",
    organization: experience.organization ?? "",
    location: experience.location ?? "",
    summary: experience.summary ?? "",
    description: experience.description ?? "",
    startDate: normalizeDate(experience.startDate),
    endDate: normalizeDate(experience.endDate),
    currentPosition: Boolean(experience.currentPosition),
    imageUrl: experience.imageUrl ?? "",
    websiteUrl: experience.websiteUrl ?? "",
    skills: experience.skills ?? [],
    displayOrder: experience.displayOrder ?? index + 1,
  }));
}

export function hydrateExperienceFormForEditing(experience, index = 0) {
  return {
    category: experience?.category ?? "SCHOOL",
    title: experience?.title ?? "",
    organization: experience?.organization ?? "",
    location: experience?.location ?? "",
    summary: experience?.summary ?? "",
    description: experience?.description ?? "",
    startDate: normalizeDate(experience?.startDate),
    endDate: normalizeDate(experience?.endDate),
    currentPosition: Boolean(experience?.currentPosition),
    imageUrl: experience?.imageUrl ?? "",
    websiteUrl: experience?.websiteUrl ?? "",
    skills: toArray(experience?.skills).join(", "),
    displayOrder: experience?.displayOrder ?? index + 1,
  };
}

export function normalizeExperienceOrder(items) {
  return items.map((item, index) => ({
    ...item,
    displayOrder: index + 1,
  }));
}

export function toMultiline(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join("\n");
  return String(value);
}

export function toLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);

  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function hydrateProjectCaseStudyForm(caseStudy) {
  if (!caseStudy) return { ...emptyProjectCaseStudyForm };

  return {
    problem: caseStudy.problem ?? caseStudy.issue ?? caseStudy.need ?? "",
    context: caseStudy.context ?? caseStudy.background ?? "",
    role: caseStudy.role ?? caseStudy.personalRole ?? caseStudy.contribution ?? "",
    architecture: caseStudy.architecture ?? caseStudy.design ?? "",
    technicalChoices: toMultiline(caseStudy.technicalChoices ?? caseStudy.choices),
    challenges: toMultiline(caseStudy.challenges ?? caseStudy.difficulties),
    solutions: toMultiline(caseStudy.solutions),
    outcomes: toMultiline(caseStudy.outcomes ?? caseStudy.impacts),
    results: toMultiline(caseStudy.results),
    limits: toMultiline(caseStudy.limits ?? caseStudy.limitations),
    nextSteps: toMultiline(caseStudy.nextSteps ?? caseStudy.next ?? caseStudy.futureWork),
  };
}

export function buildProjectCaseStudyPayload(caseStudy) {
  const source = { ...emptyProjectCaseStudyForm, ...(caseStudy ?? {}) };
  const payload = {
    problem: nullIfBlank(source.problem),
    context: nullIfBlank(source.context),
    role: nullIfBlank(source.role),
    architecture: nullIfBlank(source.architecture),
    technicalChoices: toLines(source.technicalChoices),
    challenges: toLines(source.challenges),
    solutions: toLines(source.solutions),
    outcomes: toLines(source.outcomes),
    results: toLines(source.results),
    limits: toLines(source.limits),
    nextSteps: nullIfBlank(toLines(source.nextSteps).join("\n") || source.nextSteps),
  };

  const hasContent = Object.values(payload).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
  return hasContent ? payload : null;
}

export function slugifyProjectTitle(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function getProjectArchitectureUrl(project) {
  const directArchitectureUrl = project?.architectureUrl;
  if (directArchitectureUrl) return directArchitectureUrl;

  const architectureLink = (project?.links ?? []).find((link) => {
    const signature = `${link?.type ?? ""} ${link?.label ?? ""}`.toLowerCase();
    return [
      "architecture",
      "diagramme",
      "diagram",
      "dataflow",
      "data flow",
      "infrastructure",
      "infra",
      "kubernetes",
      "schéma",
      "schema",
    ].some((keyword) => signature.includes(keyword));
  });

  return architectureLink?.url ?? "";
}

export function hydrateProjectForm(project) {
  if (!project) return { ...emptyProjectForm };

  return {
    title: project.title ?? "",
    subtitle: project.subtitle ?? "",
    shortDescription: project.shortDescription ?? "",
    description: project.description ?? "",
    status: project.status ?? "IN_PROGRESS",
    startDate: normalizeDate(project.startDate),
    endDate: normalizeDate(project.endDate),
    imageUrl: project.imageUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    githubUrl: project.githubUrl ?? "",
    documentationUrl: project.documentationUrl ?? "",
    architectureUrl: getProjectArchitectureUrl(project),
    slug: project.slug ?? slugifyProjectTitle(project.title),
    stacks: toCsv(project.stacks),
    features: toCsv(project.features),
    proofTags: toCsv(project.proofTags),
    caseStudy: hydrateProjectCaseStudyForm(project.caseStudy),
    featured: Boolean(project.featured),
    published: project.published !== false,
    displayOrder: project.displayOrder ?? 1,
  };
}

export function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function highlightJson(value) {
  const escaped = escapeHtml(value);

  return escaped.replace(
    /(&quot;(?:\\.|[^&])*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, stringToken, colon, literal) => {
      if (stringToken) {
        const className = colon ? "json-token-key" : "json-token-string";
        return `<span class="${className}">${stringToken}</span>${colon ?? ""}`;
      }

      if (literal) {
        return `<span class="json-token-literal">${literal}</span>`;
      }

      return `<span class="json-token-number">${match}</span>`;
    },
  );
}

export function getLineColumnFromPosition(value, position) {
  const safePosition = Math.max(0, Math.min(Number(position) || 0, value.length));
  const beforeError = value.slice(0, safePosition);
  const lines = beforeError.split("\n");

  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  };
}

export function getJsonSyntaxLocation(error, value) {
  const message = error?.message ?? "JSON invalide.";
  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (lineColumnMatch) {
    return {
      line: Number(lineColumnMatch[1]),
      column: Number(lineColumnMatch[2]),
    };
  }

  const positionMatch = message.match(/position\s+(\d+)/i);
  if (positionMatch) {
    return getLineColumnFromPosition(value, Number(positionMatch[1]));
  }

  return { line: null, column: null };
}

export function buildJsonEditorAnalysis(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      valid: false,
      label: "JSON vide",
      message: "Colle ou génère un JSON avant de sauvegarder.",
      line: 1,
      column: 1,
      summary: null,
    };
  }

  try {
    const parsedPayload = JSON.parse(value);
    const normalized = normalizeAdminPortfolioJson(parsedPayload);

    return {
      valid: true,
      label: "JSON valide",
      message: `Structure reconnue : ${normalized.summary.experiences} expérience(s), ${normalized.summary.projects} projet(s), ${normalized.summary.contacts} contact(s).`,
      line: null,
      column: null,
      summary: normalized.summary,
    };
  } catch (err) {
    const location = getJsonSyntaxLocation(err, value);
    const hasLocation = location.line && location.column;

    return {
      valid: false,
      label: "JSON invalide",
      message: hasLocation
        ? `Erreur ligne ${location.line}, colonne ${location.column} : ${err?.message ?? "syntaxe invalide"}`
        : err?.message ?? "Syntaxe JSON invalide.",
      line: location.line,
      column: location.column,
      summary: null,
    };
  }
}

