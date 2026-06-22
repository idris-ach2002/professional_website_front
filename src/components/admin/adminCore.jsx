import { useEffect, useMemo } from "react";
import { Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { FilePreviewButton } from "../FilePreview";
import { normalizeAdminPortfolioJson } from "../../utils/adminJsonImport";
import { buildBackendUrl, uploadProtectedFile } from "../../services/authApi";

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


export const applicationStatusOptions = [
  { value: "DRAFT", label: "À préparer" },
  { value: "TO_SEND", label: "Prête à envoyer" },
  { value: "SENT", label: "Envoyée" },
  { value: "FOLLOW_UP", label: "Relance à faire" },
  { value: "INTERVIEW", label: "Entretien" },
  { value: "REJECTED", label: "Refus" },
  { value: "ACCEPTED", label: "Acceptée" },
  { value: "ARCHIVED", label: "Archivée" },
];

export const applicationStatusLabels = Object.fromEntries(applicationStatusOptions.map((item) => [item.value, item.label]));

export const applicationStatusColors = {
  DRAFT: "gray",
  TO_SEND: "blue",
  SENT: "cyan",
  FOLLOW_UP: "orange",
  INTERVIEW: "violet",
  REJECTED: "red",
  ACCEPTED: "green",
  ARCHIVED: "dark",
};

export const emptyApplicationForm = {
  versionId: "",
  companyName: "",
  roleTitle: "",
  location: "",
  offerUrl: "",
  offerText: "",
  status: "DRAFT",
  targetProfile: "",
  cvVariantName: "",
  cvUrl: "",
  coverLetterUrl: "",
  mailDraft: "",
  coverLetterSource: "",
  notes: "",
  appliedAt: "",
  followUpAt: "",
};

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
  stacks: "Java, Spring Boot, React, PostgreSQL, Docker",
  features: "Versioning, Version active unique, Admin panel, API REST",
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


export const cvSectionDefinitions = [
  { key: "profile", label: "Profil" },
  { key: "contacts", label: "Contacts" },
  { key: "skills", label: "Compétences" },
  { key: "experiences", label: "Expériences" },
  { key: "education", label: "Formation" },
  { key: "projects", label: "Projets" },
  { key: "languages", label: "Langues" },
  { key: "qualities", label: "Qualités" },
];

export const cvContentSections = [
  { value: "profile", label: "Profil" },
  { value: "experiences", label: "Expériences" },
  { value: "education", label: "Formation" },
  { value: "projects", label: "Projets" },
  { value: "skills", label: "Compétences" },
  { value: "languages", label: "Langues" },
  { value: "qualities", label: "Qualités" },
  { value: "contacts", label: "Contacts" },
];

export const cvTargetPresets = [
  {
    key: "java-backend",
    label: "Java Backend",
    title: "Alternance Développeur Java Full Stack",
    headline: "Développeur Java full stack orienté backend, qualité logicielle, API REST et données relationnelles.",
    prioritySkills: ["Java", "Java 21", "Spring Boot", "PostgreSQL", "API REST", "Maven", "Docker"],
  },
  {
    key: "fullstack",
    label: "Full stack",
    title: "Alternance Développeur Full Stack",
    headline: "Profil full stack capable de concevoir un backend robuste, une interface React maintenable et une expérience utilisateur claire.",
    prioritySkills: ["React", "JavaScript", "Spring Boot", "Java", "PostgreSQL", "Tailwind", "Mantine"],
  },
  {
    key: "data",
    label: "Data / pipelines",
    title: "Alternance Développeur Logiciel & Data",
    headline: "Développeur orienté pipelines de données, ingestion fiable, modélisation PostgreSQL et interfaces métier exploitables.",
    prioritySkills: ["PostgreSQL", "SQL", "Python", "Java", "CSV", "ETL", "Linux", "systemd"],
  },
  {
    key: "devops",
    label: "DevOps applicatif",
    title: "Alternance Développeur Java / DevOps",
    headline: "Profil logiciel avec une sensibilité DevOps : Docker, déploiement, automatisation, supervision et environnements reproductibles.",
    prioritySkills: ["Docker", "Kubernetes", "Cloudflare Tunnel", "Linux", "systemd", "Spring Boot", "PostgreSQL"],
  },
];

export function createCvId(prefix = "cv") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cloneDeep(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function ensureCvId(item, prefix) {
  return {
    ...item,
    id: item?.id ?? createCvId(prefix),
    enabled: item?.enabled ?? true,
  };
}

export function normalizeCvString(value) {
  return String(value ?? "").trim();
}

export function collectSkillLabels(...sources) {
  const seen = new Set();
  const labels = [];

  sources.flat().forEach((value) => {
    toArray(value).forEach((label) => {
      const key = label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        labels.push(label);
      }
    });
  });

  return labels;
}

export function sortByDisplayOrder(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftOrder = Number(left?.displayOrder ?? 9999);
    const rightOrder = Number(right?.displayOrder ?? 9999);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return normalizeCvString(right?.startDate).localeCompare(normalizeCvString(left?.startDate));
  });
}

export function createEmptyCvDocument() {
  return {
    settings: {
      templateId: "software-engineer-latex",
      language: "fr",
      primaryColor: "#6E877E",
      secondaryColor: "#202A2E",
      density: "compact",
      layout: "two-column",
      fontScale: 1,
      globalContentSize: 11,
      headerNameSize: 24,
      headerTitleSize: 15.2,
      headerHeadlineSize: 10,
      headerTagSize: 9,
      headerContactSize: 10,
      sectionTitleSize: 16.3,
      sectionTitleLineHeight: 16.8,
      sectionSubtitleSize: 10,
      sectionTextSize: 11,
      sectionLinkSize: 9.24,
      skillTitleSize: 12,
      skillStackSize: 10,
      skillTextSize: 10,
      skillProofSize: 9,
      experienceTitleSize: 12,
      experienceDateSize: 11,
      experienceMetaSize: 11,
      experienceTextSize: 11,
      projectTitleSize: 12,
      projectMetaSize: 11,
      projectTextSize: 11,
      projectLinkSize: 10,
      educationTitleSize: 12,
      educationMetaSize: 10.15,
      educationTextSize: 10,
      leftColumnWidth: 33.8,
      rightColumnWidth: 64.2,
      showPhoto: true,
      showIcons: true,
      underlineLinks: true,
      reduceDescriptions: false,
      spacingScale: 1,
      itemSpacing: 1.6,
      sectionSpacing: 0.3,
      blockSpacing: 0.06,
      lineSpacing: 1,
      headerPadding: 12,
      contentScale: 0.74,
      projectLimit: 4,
      experienceLimit: 2,
      skillsLimit: 16,
      featuresLimit: 4,
      sectionColumns: {
        contacts: "header",
        languages: "left",
        skills: "left",
        qualities: "left",
        experiences: "right",
        projects: "right",
        education: "right",
      },
    },
    sections: cvSectionDefinitions.reduce((acc, section) => ({ ...acc, [section.key]: true }), {}),
    profile: {
      fullName: "Idris ACHABOU",
      title: "Alternance Développeur Java Full Stack",
      subtitle: "Java / Spring Boot / React",
      headline: "Recherche une alternance en développement Java full stack.",
      description: "Profil orienté développement logiciel, qualité applicative et interfaces métier.",
      location: "Île-de-France",
      availability: "23 ans",
      photoFilename: "idris.jpg",
      photoDataUrl: "",
      photoMimeType: "image/jpeg",
    },
    contacts: [],
    skills: [],
    languages: [],
    qualities: [],
    experiences: [],
    education: [],
    projects: [],
  };
}

export function createCvDocumentFromVersionData({ ownerForm, profileForm, experiences, projects }) {
  const base = createEmptyCvDocument();
  const allExperiences = sortByDisplayOrder(experiences);
  const education = allExperiences.filter((experience) => experience?.category === "SCHOOL");
  const professionalExperiences = allExperiences.filter((experience) => experience?.category !== "SCHOOL");
  const projectList = sortByDisplayOrder(projects).filter((project) => project?.published !== false);
  const contactRows = sanitizeContactRows(ownerForm?.contacts ?? []);
  const skillLabels = collectSkillLabels(
    projectList.flatMap((project) => project?.stacks ?? []),
    allExperiences.flatMap((experience) => experience?.skills ?? []),
    ["Java", "Spring Boot", "React", "PostgreSQL", "Docker", "Qualité logicielle"],
  );

  return {
    ...base,
    profile: {
      ...base.profile,
      fullName: [ownerForm?.firstName, ownerForm?.name].filter(Boolean).join(" ") || base.profile.fullName,
      title: profileForm?.title || base.profile.title,
      subtitle: profileForm?.subtitle || base.profile.subtitle,
      headline: profileForm?.headline || profileForm?.shortDescription || base.profile.headline,
      description: profileForm?.description || profileForm?.shortDescription || base.profile.description,
      location: profileForm?.location || ownerForm?.address || base.profile.location,
      availability: "23 ans",
      photoFilename: base.profile.photoFilename,
      photoDataUrl: "",
      photoMimeType: base.profile.photoMimeType,
    },
    contacts: contactRows.map((contact) => ensureCvId({ ...contact, label: contact.type, enabled: true }, "contact")),
    skills: skillLabels.map((label) => ({ id: createCvId("skill"), label, enabled: true })),
    languages: [
      { id: createCvId("language"), label: "Français", level: "Bilingue", enabled: true },
      { id: createCvId("language"), label: "Anglais", level: "B2", enabled: true },
      { id: createCvId("language"), label: "Kabyle", level: "Langue maternelle", enabled: true },
    ],
    qualities: ["Autonomie", "Rigueur", "Engagement", "Priorisation", "Communication technique", "Travail en équipe"].map((label) => ({
      id: createCvId("quality"),
      label,
      enabled: true,
    })),
    experiences: professionalExperiences.map((experience) => ensureCvId({
      sourceId: experience?.experienceId ?? experience?.id ?? null,
      category: experience?.category ?? "CDI",
      title: experience?.title ?? "Expérience",
      organization: experience?.organization ?? "",
      location: experience?.location ?? "",
      summary: experience?.summary ?? "",
      description: experience?.description ?? "",
      startDate: normalizeDate(experience?.startDate),
      endDate: normalizeDate(experience?.endDate),
      currentPosition: Boolean(experience?.currentPosition),
      skills: toArray(experience?.skills),
      displayOrder: experience?.displayOrder ?? 1,
    }, "experience")),
    education: education.map((experience, index) => {
      const defaults = inferSchoolDefaults(experience, index);
      return ensureCvId({
        sourceId: experience?.experienceId ?? experience?.id ?? null,
        category: experience?.category ?? "SCHOOL",
        title: experience?.title ?? "Formation",
        organization: experience?.organization || defaults.organization,
        location: experience?.location ?? "",
        summary: experience?.summary ?? "",
        description: experience?.description ?? "",
        startDate: normalizeDate(experience?.startDate),
        endDate: normalizeDate(experience?.endDate),
        currentPosition: Boolean(experience?.currentPosition),
        skills: toArray(experience?.skills),
        schoolCode: defaults.code,
        logoFilename: defaults.logoFilename,
        logoDataUrl: "",
        logoMimeType: defaults.logoFilename.endsWith(".png") ? "image/png" : "image/jpeg",
        logoSize: defaults.logoSize,
        officialUrl: defaults.officialUrl,
        officialLabel: defaults.officialLabel,
        programUrl: defaults.programUrl,
        programLabel: defaults.programLabel,
        displayOrder: experience?.displayOrder ?? 1,
      }, "education");
    }),
    projects: projectList.map((project) => ensureCvId({
      sourceId: getProjectId(project) ?? null,
      title: project?.title ?? "Projet",
      subtitle: project?.subtitle ?? "",
      shortDescription: project?.shortDescription ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "COMPLETED",
      startDate: normalizeDate(project?.startDate),
      endDate: normalizeDate(project?.endDate),
      stacks: toArray(project?.stacks),
      features: toArray(project?.features),
      githubUrl: project?.githubUrl ?? "",
      documentationUrl: project?.documentationUrl ?? "",
      architectureUrl: project?.architectureUrl ?? getProjectArchitectureUrl(project) ?? "",
      featured: Boolean(project?.featured),
      displayOrder: project?.displayOrder ?? 1,
    }, "project")),
  };
}

export function normalizeCvDocument(document) {
  const base = createEmptyCvDocument();
  const current = document ?? base;

  return {
    ...base,
    ...current,
    settings: {
      ...base.settings,
      ...(current.settings ?? {}),
      sectionColumns: {
        ...(base.settings.sectionColumns ?? {}),
        ...((current.settings ?? {}).sectionColumns ?? {}),
      },
    },
    sections: { ...base.sections, ...(current.sections ?? {}) },
    profile: { ...base.profile, ...(current.profile ?? {}) },
    contacts: (current.contacts ?? []).map((item) => ensureCvId(item, "contact")),
    skills: (current.skills ?? []).map((item) => ensureCvId(typeof item === "string" ? { label: item } : item, "skill")),
    languages: (current.languages ?? []).map((item) => ensureCvId(item, "language")),
    qualities: (current.qualities ?? []).map((item) => ensureCvId(typeof item === "string" ? { label: item } : item, "quality")),
    experiences: (current.experiences ?? []).map((item) => ensureCvId(item, "experience")),
    education: (current.education ?? []).map((item) => ensureCvId(item, "education")),
    projects: (current.projects ?? []).map((item) => ensureCvId(item, "project")),
  };
}

export function escapeLatex(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\n+/g, "\\par ");
}

export function sanitizeHexColor(value, fallback = "6E877E") {
  const color = String(value ?? "").replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(color) ? color.toUpperCase() : fallback;
}

export function safeCvAssetFilename(value, fallback) {
  const raw = normalizeCvString(value || fallback).replace(/\\/g, "/").split("/").pop();
  const clean = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  if (!clean || !/\.(png|jpe?g)$/i.test(clean)) return fallback;
  return clean.slice(0, 96);
}

export function cvFileExtension(file, fallback = "jpg") {
  const filename = normalizeCvString(file?.name).toLowerCase();
  if (filename.endsWith(".png")) return "png";
  if (filename.endsWith(".jpeg")) return "jpeg";
  if (filename.endsWith(".jpg")) return "jpg";
  if (String(file?.type ?? "").includes("png")) return "png";
  if (String(file?.type ?? "").includes("jpeg")) return "jpg";
  return fallback;
}

export function cvAssetMimeFromDataUrl(dataUrl, fallback = "image/jpeg") {
  const match = String(dataUrl ?? "").match(/^data:([^;,]+)[;,]/);
  return match?.[1] || fallback;
}

export function readCvAssetFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Lecture du fichier image impossible."));
    reader.readAsDataURL(file);
  });
}

export function inferSchoolDefaults(item, index = 0) {
  const signature = [item?.title, item?.organization, item?.summary, item?.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (signature.includes("sorbonne") || signature.includes("stl")) {
    return {
      code: "SU",
      organization: item?.organization || "Sorbonne Université",
      logoFilename: "sorbonne.png",
      logoSize: "1.15cm",
      officialUrl: "https://sciences.sorbonne-universite.fr/formation-sciences/masters/master-informatique/parcours-stl",
      officialLabel: "parcours officiel",
      programUrl: "https://sciences.sorbonne-universite.fr/sites/default/files/media/2025-06/MonMaster-Informatique-STL-arr%C3%AAt%C3%A9-sign%C3%A9-2024.pdf",
      programLabel: "maquette / arrêté",
      introVspace: "0.8cm",
      endingVspace: "",
    };
  }

  if (signature.includes("havre") || signature.includes("ulhn")) {
    return {
      code: "ULHN",
      organization: item?.organization || "Université Le Havre Normandie",
      logoFilename: "ulhn.jpg",
      logoSize: "1.28cm",
      officialUrl: "https://www.univ-lehavre.fr/fr/formations/licence-informatique/",
      officialLabel: "parcours officiel",
      programUrl: "https://www.univ-lehavre.fr/wp-content/uploads/2023/12/licenceinfo2022-1.pdf",
      programLabel: "fiche / programme",
      introVspace: "",
      endingVspace: "0.8cm",
    };
  }

  return {
    code: normalizeCvString(item?.schoolCode) || `F${index + 1}`,
    organization: item?.organization || "Établissement",
    logoFilename: `school-${index + 1}.png`,
    logoSize: "1.15cm",
    officialUrl: "",
    officialLabel: "parcours officiel",
    programUrl: "",
    programLabel: "programme",
    introVspace: index === 0 ? "0.8cm" : "",
    endingVspace: "",
  };
}

export function latexSchoolLinks(item, defaults) {
  const officialUrl = normalizeCvString(item.officialUrl ?? item.websiteUrl ?? defaults.officialUrl);
  const programUrl = normalizeCvString(item.programUrl ?? defaults.programUrl);
  const officialLabel = normalizeCvString(item.officialLabel ?? defaults.officialLabel ?? "parcours officiel");
  const programLabel = normalizeCvString(item.programLabel ?? defaults.programLabel ?? "programme");
  const links = [];

  if (officialUrl) links.push(latexHref(officialUrl, officialLabel));
  if (programUrl) links.push(latexHref(programUrl, programLabel));

  return links.join("\\enspace|\\enspace");
}

export function buildCvAssetsPayload(document) {
  const normalized = normalizeCvDocument(document);
  const assets = [];
  const profileFilename = safeCvAssetFilename(normalized.profile?.photoFilename, "idris.jpg");
  const profileDataUrl = normalizeCvString(normalized.profile?.photoDataUrl);

  if (profileDataUrl) {
    assets.push({
      filename: profileFilename,
      mimeType: normalized.profile?.photoMimeType || cvAssetMimeFromDataUrl(profileDataUrl),
      dataUrl: profileDataUrl,
    });
  }

  (normalized.education ?? []).forEach((item, index) => {
    const defaults = inferSchoolDefaults(item, index);
    const filename = safeCvAssetFilename(item.logoFilename, defaults.logoFilename);
    const dataUrl = normalizeCvString(item.logoDataUrl);

    if (dataUrl) {
      assets.push({
        filename,
        mimeType: item.logoMimeType || cvAssetMimeFromDataUrl(dataUrl, filename.endsWith(".png") ? "image/png" : "image/jpeg"),
        dataUrl,
      });
    }
  });

  return assets;
}

export function latexItemize(items) {
  const cleanItems = items.filter(Boolean);
  if (cleanItems.length === 0) return "";

  return `\\begin{itemize}\n${cleanItems.map((item) => `    \\item ${escapeLatex(item)}`).join("\n")}\n  \\end{itemize}`;
}

export function latexSection(title, content) {
  if (!content.trim()) return "";
  return `\\sectiontitle{${escapeLatex(title)}}\n${content}\n`;
}

export function enabledItems(items, limit = Infinity) {
  return (items ?? []).filter((item) => item?.enabled !== false).slice(0, Number(limit) || Infinity);
}

export function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function latexSize(value, fallback, min = 6, max = 30) {
  const size = clampNumber(value, min, max, fallback);
  return Number(size.toFixed(2)).toString();
}

export function latexLeading(value, fallback, factor = 1) {
  const size = Number(latexSize(value, fallback));
  return Number((size * factor).toFixed(2)).toString();
}

export function shortenCvText(value, enabled, maxLength = 155) {
  const text = normalizeCvString(value);
  if (!enabled || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim().replace(/[,. ;:]+$/, "")}…`;
}

export function cvMonthYear(value) {
  const date = normalizeCvString(value);
  if (!date) return "";
  const parts = date.split("-");
  const year = parts[0];
  const month = parts[1];
  const months = {
    "01": "janv.", "02": "févr.", "03": "mars", "04": "avr.", "05": "mai", "06": "juin",
    "07": "juil.", "08": "août", "09": "sept.", "10": "oct.", "11": "nov.", "12": "déc.",
  };
  if (!year) return date;
  return [months[month], year].filter(Boolean).join(" ") || year;
}

export function cvDateLabel(startDate, endDate, currentPosition) {
  const start = cvMonthYear(startDate);
  const end = currentPosition ? "présent" : cvMonthYear(endDate);
  return [start, end].filter(Boolean).join(" - ");
}

export function cvYearRange(startDate, endDate, currentPosition) {
  const start = normalizeCvString(startDate).slice(0, 4);
  const end = currentPosition ? "présent" : normalizeCvString(endDate).slice(0, 4);
  return [start, end].filter(Boolean).join(" - ");
}

export function latexHref(url, label, light = false) {
  const cleanUrl = normalizeCvString(url);
  const cleanLabel = normalizeCvString(label);
  if (!cleanLabel) return "";
  if (!cleanUrl) return escapeLatex(cleanLabel);
  return `${light ? "\\cvhreflight" : "\\cvhref"}{${escapeLatex(cleanUrl)}}{${escapeLatex(cleanLabel)}}`;
}

export function contactValueFromDocument(document, typeNames, fallback = "") {
  const types = Array.isArray(typeNames) ? typeNames : [typeNames];
  const found = (document.contacts ?? []).find((contact) => types.includes(contact?.type) || types.includes(contact?.label));
  return normalizeCvString(found?.value) || fallback;
}

export function buildLatexContact(contact) {
  const type = String(contact?.type ?? contact?.label ?? "CONTACT").replace(/_/g, " ");
  const value = normalizeCvString(contact?.value);
  if (!value) return "";
  return `\\textbf{${escapeLatex(type)}} : ${escapeLatex(value)}\\par`;
}

export function buildDefaultSkillCards(document) {
  const labels = enabledItems(document.skills, 24).map((item) => item.label).filter(Boolean);
  const has = (patterns) => labels.filter((label) => patterns.some((pattern) => label.toLowerCase().includes(pattern)));
  const java = has(["java", "spring", "jpa", "hibernate", "maven", "flyway"]);
  const data = has(["postgres", "sql", "json", "xml", "bdd", "database"]);
  const infra = has(["docker", "linux", "render", "cloudflare", "neon", "kubernetes", "systemd"]);
  const quality = has(["junit", "quickcheck", "hspec", "test", "qualité", "invariant"]);

  return [
    {
      title: "Java Backend · Spring Boot",
      stack: (java.length ? java : ["Java 21", "Spring Boot", "JPA/Hibernate", "Flyway", "Validation"]).slice(0, 6).join(", "),
      text: "Services REST, persistance PostgreSQL, migrations, validation des entrées, structuration multicouche et robustesse applicative.",
      proof: `${latexHref("https://github.com/idris-ach2002/professional_website", "professional_website")} + ${latexHref("https://github.com/idris-ach2002/ais-java-2025/tree/main/Ais_Project", "ais-java")}`,
    },
    {
      title: "Base de données · SQL",
      stack: (data.length ? data : ["PostgreSQL", "SQL", "JPA", "JSON / XML"]).slice(0, 6).join(", "),
      text: "MCD / MLD, normalisation 2NF/3NF/BCNF, requêtes avancées, triggers SQL et données structurées.",
      proof: `${latexHref("https://github.com/idris-ach2002/bdd-ais", "bdd-ais")} + UE MLBDA`,
    },
    {
      title: "Linux · Docker · Déploiement",
      stack: (infra.length ? infra : ["Linux", "systemd", "Docker", "Render", "Cloudflare", "Neon DB"]).slice(0, 6).join(", "),
      text: "Ligne de commande, supervision, conteneurisation backend, configuration d'environnements et déploiement cloud.",
      proof: `${latexHref("https://github.com/idris-ach2002/professional_website", "back")} + ${latexHref("https://github.com/idris-ach2002/professional_website_front", "front")}`,
    },
    {
      title: "Qualité logicielle · Tests",
      stack: (quality.length ? quality : ["JUnit", "QuickCheck", "Hspec", "Invariants"]).slice(0, 6).join(", "),
      text: "Tests unitaires et de propriétés, validation d'invariants, analyse d'anomalies et fiabilisation des traitements.",
      proof: `${latexHref("https://github.com/idris-ach2002/Megablast", "Megablast")} + ${latexHref("https://github.com/idris-ach2002/Composant_BCM4JAVA", "Composant_BCM4JAVA")}`,
    },
  ];
}

export function buildLatexSkillCards(document) {
  return buildDefaultSkillCards(document)
    .map((card) => `\\skillcard\n  {${escapeLatex(card.title)}}\n  {${escapeLatex(card.stack)}}\n  {${escapeLatex(card.text)}}\n  {${card.proof}}`)
    .join("\n\n");
}

export function buildLatexExperience(experience, featuresLimit, reduceDescriptions = false) {
  const titleLine = [experience.title, experience.organization].filter(Boolean).join(" \\textbar\\ ");
  const dateLine = cvDateLabel(experience.startDate, experience.endDate, experience.currentPosition);
  const skills = toArray(experience.skills).slice(0, 8).join(" · ");
  const bullets = [experience.summary, experience.description]
    .filter(Boolean)
    .slice(0, featuresLimit)
    .map((text) => shortenCvText(text, reduceDescriptions, 155));

  return `\\experienceentry\n  {${escapeLatex(titleLine || "Expérience")}}\n  {${escapeLatex(dateLine)}}\n  {${escapeLatex(skills || experience.location || "")}}\n  {${latexItemize(bullets)}}`;
}

export function buildLatexProject(project, featuresLimit, reduceDescriptions = false) {
  const stacks = toArray(project.stacks).slice(0, 8).join(" · ");
  const bullets = [project.shortDescription, project.description, ...toArray(project.features)]
    .filter(Boolean)
    .slice(0, Math.max(1, featuresLimit))
    .map((text) => shortenCvText(text, reduceDescriptions, 135));
  const link = project.githubUrl
    ? latexHref(project.githubUrl, "repo GitHub")
    : project.documentationUrl
      ? latexHref(project.documentationUrl, "documentation")
      : project.architectureUrl
        ? latexHref(project.architectureUrl, "architecture")
        : "";

  return `\\projectentry\n  {${escapeLatex(project.title || "Projet")}}{${escapeLatex(stacks || project.subtitle || "")}}\n  {${escapeLatex(bullets[0] || project.description || "")}}\n  {${link}}`;
}

export function buildLatexEducationEntry(item, index = 0) {
  const defaults = inferSchoolDefaults(item, index);
  const logoFilename = safeCvAssetFilename(item.logoFilename, defaults.logoFilename);
  const logoSize = normalizeCvString(item.logoSize) || defaults.logoSize;
  const schoolCode = normalizeCvString(item.schoolCode) || defaults.code;
  const organization = normalizeCvString(item.organization) || defaults.organization;
  const description = item.description || item.summary || "";
  const links = latexSchoolLinks(item, defaults);
  const introVspace = normalizeCvString(item.introVspace ?? defaults.introVspace);
  const endingVspace = normalizeCvString(item.endingVspace ?? defaults.endingVspace);
  const introVspaceLatex = introVspace ? `\\vspace{${escapeLatex(introVspace)}}` : "";
  const linksLatex = links ? `{\\color{muted}\\fontsize{9.24}{9.66}\\selectfont ${links}}\\par` : "";
  const endingVspaceLatex = endingVspace ? `\\vspace{${escapeLatex(endingVspace)}}` : "";

  return String.raw`\noindent
\begin{minipage}[c]{0.12\linewidth}\centering\schoollogo{${logoFilename}}{${escapeLatex(logoSize)}}\end{minipage}\hfill
\begin{minipage}[c]{0.84\linewidth}${introVspaceLatex}
\entrytitle{${escapeLatex(item.title || "Formation")}}{${escapeLatex(cvYearRange(item.startDate, item.endDate, item.currentPosition))}}{\schoolbadge{${escapeLatex(schoolCode)}}{${escapeLatex(organization)}}}
${linksLatex}
{\fontsize{${latexSize(item.textSize, 10)}}{${latexSize(item.textLineHeight, 10)}}\selectfont ${escapeLatex(description)}}\par
${endingVspaceLatex}
\end{minipage}`;
}

export function buildLatexSectionContent(sectionKey, document) {
  const settings = document.settings ?? createEmptyCvDocument().settings;
  const sections = document.sections ?? {};
  if (!sections[sectionKey]) return "";

  const featuresLimit = Number(settings.featuresLimit || 4);
  const reduce = Boolean(settings.reduceDescriptions);

  switch (sectionKey) {
    case "languages": {
      const languages = enabledItems(document.languages, 8);
      if (languages.length === 0) return "";
      return `\\begin{tcolorbox}[colback=soft,arc=2.8mm]\n\\sectiontitle{Langues}\n${languages.map((item) => `\\langrow{${escapeLatex(item.label)}}{${escapeLatex(item.level ?? "")}}`).join(" \\vspace{0.2cm}\n")}\n\\end{tcolorbox}`;
    }
    case "skills": {
      const cards = buildLatexSkillCards(document);
      if (!cards) return "";
      return `\\begin{tcolorbox}[colback=soft,arc=2.8mm]\n\\sectiontitle{Compétences clés}\n\n${cards}\n\n\\end{tcolorbox}`;
    }
    case "qualities": {
      const qualities = enabledItems(document.qualities, 12).map((item) => item.label).filter(Boolean);
      if (qualities.length === 0) return "";
      const rows = [];
      for (let index = 0; index < qualities.length; index += 2) {
        const pair = qualities.slice(index, index + 2).map((label) => `\\softchip{${escapeLatex(label)}}`).join("\\hspace{7pt}");
        rows.push(`${pair}\\par\\vspace{2.4pt}`);
      }
      return `\\begin{tcolorbox}[colback=soft,arc=2.8mm]\n\\sectiontitle{Qualités}\n\\begin{center}\n${rows.join("\n")}\n\\end{center}\n\\end{tcolorbox}`;
    }
    case "experiences": {
      const experiences = enabledItems(document.experiences, settings.experienceLimit);
      if (experiences.length === 0) return "";
      return `\\begin{tcolorbox}[colback=white,colframe=line,boxrule=0.75pt,arc=2.8mm,top=7pt,bottom=8pt,left=8pt,right=8pt]\n\\sectiontitle{Expérience et projets récents}\n\n${experiences.map((item) => buildLatexExperience(item, featuresLimit, reduce)).join("\n\n")}\n\\end{tcolorbox}`;
    }
    case "projects": {
      const projects = enabledItems(document.projects, settings.projectLimit);
      if (projects.length === 0) return "";
      return `\\begin{tcolorbox}[colback=white,colframe=line,boxrule=0.75pt,arc=2.8mm,top=6pt,bottom=6pt,left=8pt,right=8pt]\n\\sectiontitle{Réalisations académiques ciblées}\n\n${projects.map((item) => `${buildLatexProject(item, featuresLimit, reduce)}\n  \\vspace{${settings.blockSpacing ?? 0.06}cm}`).join("\n\n")}\n\\end{tcolorbox}`;
    }
    case "education": {
      const education = enabledItems(document.education, 4);
      if (education.length === 0) return "";
      return `\\begin{tcolorbox}[colback=white,colframe=line,boxrule=0.7pt,arc=2.7mm,top=7pt,bottom=9pt,left=8pt,right=8pt]\n\\sectiontitle{Formation}\n${education.map((item, index) => buildLatexEducationEntry(item, index)).join("\n\n\\vspace{1cm}\n\n")}\n\\end{tcolorbox}`;
    }
    default:
      return "";
  }
}

export function buildColumnLatex(document, column) {
  const settings = document.settings ?? createEmptyCvDocument().settings;
  const placements = settings.sectionColumns ?? createEmptyCvDocument().settings.sectionColumns;
  const orderedSections = ["languages", "skills", "qualities", "experiences", "projects", "education"];
  return orderedSections
    .filter((sectionKey) => (placements?.[sectionKey] ?? (['languages', 'skills', 'qualities'].includes(sectionKey) ? 'left' : 'right')) === column)
    .map((sectionKey) => buildLatexSectionContent(sectionKey, document))
    .filter(Boolean)
    .join(`\n\\vspace{${settings.sectionSpacing ?? 0.3}cm}\n`);
}

export function buildCvLatexFromDocument(inputDocument) {
  const document = normalizeCvDocument(inputDocument);
  const settings = document.settings;
  const primaryColor = sanitizeHexColor(settings.primaryColor);
  const secondaryColor = sanitizeHexColor(settings.secondaryColor, "202A2E");
  const accent = primaryColor;
  const fontScale = clampNumber(settings.fontScale, 0.86, 1.12, 1);
  const globalSize = clampNumber(settings.globalContentSize, 8.5, 13.5, 11) * fontScale;
  const itemSpacing = clampNumber(settings.itemSpacing, 0.2, 4, 1.6) * clampNumber(settings.spacingScale, 0.65, 1.5, 1);
  const leftWidth = clampNumber(settings.leftColumnWidth, 25, 45, 33.8) / 100;
  const rightWidth = clampNumber(98.6 - (leftWidth * 100), 50, 72, 64.2) / 100;
  const contentScale = clampNumber(settings.contentScale, 0.68, 0.9, 0.74);
  const headerPadding = clampNumber(settings.headerPadding, 6, 22, 12);
  const fullName = document.profile.fullName || "Idris ACHABOU";
  const title = document.profile.title || "Alternance Java / Spring Boot";
  const headline = document.profile.headline || document.profile.description || "Recherche une alternance en développement logiciel.";
  const phone = contactValueFromDocument(document, ["PHONE_NUMBER", "PHONE"], "07 44 75 85 10");
  const email = contactValueFromDocument(document, "EMAIL", "achabou02idris@gmail.com");
  const linkedin = contactValueFromDocument(document, "LINKEDIN", "https://www.linkedin.com/in/idris-achabou/");
  const portfolio = contactValueFromDocument(document, ["PORTFOLIO", "WEBSITE"], "https://portfolio-xko4.vercel.app/fr");
  const location = document.profile.location || "Choisy-le-Roi";
  const ageText = /ans/i.test(String(document.profile.availability ?? "")) ? document.profile.availability : "23 ans";
  const profilePhotoFilename = safeCvAssetFilename(document.profile.photoFilename, "idris.jpg");
  const leftColumn = buildColumnLatex(document, "left");
  const rightColumn = buildColumnLatex(document, "right");
  const singleColumn = [leftColumn, rightColumn].filter(Boolean).join("\n\\vspace{0.18cm}\n");
  const body = settings.layout === "one-column"
    ? `\\begin{minipage}[t]{0.96\\textwidth}\\vspace{0pt}\n${singleColumn}\n\\end{minipage}`
    : `\\begin{minipage}[t]{${leftWidth.toFixed(3)}\\textwidth}\\vspace{0pt}\n${leftColumn}\n\\end{minipage}\n\\hfill\n\\begin{minipage}[t]{${rightWidth.toFixed(3)}\\textwidth}\\vspace{0pt}\n${rightColumn}\n\\end{minipage}`;

  return String.raw`
\documentclass[17pt,a4paper]{article}
\usepackage[a4paper,margin=0.68cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[french]{babel}
\usepackage[scaled=0.97]{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage{microtype}
\usepackage{xcolor}
\usepackage{enumitem}
\usepackage{graphicx}
\usepackage[most]{tcolorbox}
\usepackage[hidelinks]{hyperref}
\usepackage{ragged2e}
\usepackage{fontawesome5}
\usepackage{tabularx}
\usepackage{array}
\usepackage{tikz}
\usepackage[normalem]{ulem}
\usetikzlibrary{calc}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\setlength{\tabcolsep}{0pt}
\setlist[itemize]{leftmargin=10pt,itemsep=${itemSpacing.toFixed(2)}pt,topsep=${itemSpacing.toFixed(2)}pt,parsep=0pt,partopsep=0pt}
\definecolor{ink}{HTML}{1C232A}
\definecolor{ink2}{HTML}{${secondaryColor}}
\definecolor{accent}{HTML}{${accent}}
\definecolor{muted}{HTML}{667680}
\definecolor{line}{HTML}{D8E1E4}
\definecolor{soft}{HTML}{F6F8F8}
\definecolor{chip}{HTML}{E9EFED}
\definecolor{cardbg}{HTML}{FCFDFD}
\color{ink}
\hypersetup{colorlinks=true,urlcolor=accent}
\tcbset{sharp corners,boxrule=0pt,left=8pt,right=8pt,top=6pt,bottom=6pt}
\urlstyle{same}
\renewcommand{\ULdepth}{1.2pt}
\newcommand{\cvhref}[2]{\href{#1}{\textcolor{accent!95!black}{\uline{#2}}}}
\newcommand{\cvhreflight}[2]{\href{#1}{\textcolor{white!92}{\uline{#2}}}}
\newcommand{\sectiontitle}[1]{{\color{accent!95!black}\bfseries\fontsize{${latexSize(settings.sectionTitleSize, 16.3)}}{${latexSize(settings.sectionTitleLineHeight, 16.8)}}\selectfont #1}\par\vspace{1pt}{\color{line}\rule{\linewidth}{0.65pt}}\par\vspace{2pt}}
\newcommand{\tagitem}[1]{\tikz[baseline=(x.base)]\node[rounded corners=5pt,fill=chip,draw=line,inner xsep=6pt,inner ysep=3pt,font=\fontsize{${latexSize(settings.headerTagSize, 9)}}{${latexSize(settings.headerTagSize, 9)}}\selectfont\bfseries,text=ink] (x) {#1};}
\newcommand{\softchip}[1]{\tikz[baseline=(x.base)]\node[rounded corners=5pt,fill=white,draw=line,inner xsep=5pt,inner ysep=5pt,font=\fontsize{10}{10}\selectfont\bfseries,text=ink] (x) {#1};}
\newcommand{\contactrow}[3]{{\color{white}\fontsize{${latexSize(settings.headerContactSize, 10)}}{${latexSize(settings.headerContactSize, 10)}}\selectfont\makebox[1.15em][c]{\color{accent!55}#1}\hspace{0.1em}\textbf{#2}\hspace{0.1em}#3}\par\vspace{1.9pt}}
\newcommand{\skillcard}[4]{\begin{tcolorbox}[colback=cardbg,colframe=line,boxrule=0.62pt,arc=2.2mm,left=7pt,right=7pt,top=4.8pt,bottom=10pt]{\bfseries\fontsize{${latexSize(settings.skillTitleSize, 12)}}{${latexSize(settings.skillTitleSize, 12)}}\selectfont #1}\par{\color{muted}\fontsize{${latexSize(settings.skillStackSize, 10)}}{${latexSize(settings.skillStackSize, 10)}}\selectfont #2}\par\vspace{2.7pt}{\fontsize{${latexSize(settings.skillTextSize, 10)}}{${latexSize(settings.skillTextSize, 10)}}\selectfont #3}\par\vspace{8pt}{\color{muted}\fontsize{${latexSize(settings.skillProofSize, 9)}}{${latexLeading(settings.skillProofSize, 9, 1.05)}}\selectfont \textbf{Preuves :} #4}\par\end{tcolorbox}\vspace{8pt}}
\newcommand{\experienceentry}[4]{\noindent\begin{tabularx}{\linewidth}{@{}X>{\RaggedLeft\arraybackslash}p{2.28cm}@{}}{\bfseries\fontsize{${latexSize(settings.experienceTitleSize, 12)}}{${latexSize(settings.experienceTitleSize, 12)}}\selectfont #1} & {\color{accent!95!black}\bfseries\fontsize{${latexSize(settings.experienceDateSize, 11)}}{${latexSize(settings.experienceDateSize, 11)}}\selectfont #2}\end{tabularx}\par{\color{muted}\fontsize{${latexSize(settings.experienceMetaSize, 11)}}{${latexSize(settings.experienceMetaSize, 11)}}\selectfont #3}\par\vspace{10pt}{\fontsize{${latexSize(settings.experienceTextSize, globalSize)}}{${latexSize(settings.experienceTextSize, globalSize)}}\selectfont #4}\vspace{14pt}}
\newcommand{\projectentry}[4]{{\bfseries\fontsize{${latexSize(settings.projectTitleSize, 12)}}{${latexSize(settings.projectTitleSize, 12)}}\selectfont #1\hfill\color{muted}\fontsize{${latexSize(settings.projectMetaSize, 11)}}{${latexSize(settings.projectMetaSize, 11)}}\selectfont #2}\par{\fontsize{${latexSize(settings.projectTextSize, 11)}}{${latexSize(settings.projectTextSize, 11)}}\selectfont #3}\par{\color{muted}\fontsize{${latexSize(settings.projectLinkSize, 10)}}{${latexSize(settings.projectLinkSize, 10)}}\selectfont #4}\par\vspace{10pt}}
\newcommand{\entrytitle}[3]{\noindent\begin{tabularx}{\linewidth}{@{}X>{\RaggedLeft\arraybackslash}p{2.25cm}@{}}{\bfseries\fontsize{${latexSize(settings.educationTitleSize, 12)}}{${latexSize(settings.educationTitleSize, 12)}}\selectfont #1} & {\color{accent!95!black}\bfseries\fontsize{9.87}{10.22}\selectfont #2}\end{tabularx}\par{\color{muted}\fontsize{9.66}{10.01}\selectfont #3}\par\vspace{1.4pt}}
\newcommand{\schoolbadge}[2]{\tikz[baseline=(x.base)]\node[rounded corners=2.4pt,fill=soft,draw=line,inner xsep=4.5pt,inner ysep=3pt,font=\fontsize{${latexSize(settings.educationMetaSize, 10.15)}}{${latexLeading(settings.educationMetaSize, 10.15, 1.04)}}\selectfont\bfseries,text=ink] (x) {#1\hspace{3pt}{\color{muted}#2}};}
\newcommand{\schoollogo}[2]{\IfFileExists{#1}{\includegraphics[width=#2]{#1}}{\fbox{\rule{0pt}{1.1cm}\rule{1.1cm}{0pt}}}}
\newcommand{\langrow}[2]{\noindent\begin{tabularx}{\linewidth}{@{}X r@{}}{\bfseries\fontsize{10.36}{10.79}\selectfont #1} & {\color{muted}\fontsize{10}{10}\selectfont #2}\end{tabularx}\par\vspace{0.8pt}}
\newlength{\headerpad}\setlength{\headerpad}{${headerPadding}pt}
\newlength{\headergap}\setlength{\headergap}{12pt}
\newlength{\headerinnerheight}\setlength{\headerinnerheight}{3.3cm}

\begin{document}
\enlargethispage{1.4cm}
\begin{tcolorbox}[enhanced,colback=ink,colframe=ink,arc=4mm,left=\headerpad,right=\headerpad,top=\headerpad,bottom=\headerpad,overlay={\shade[inner color=ink2!60!ink, outer color=ink] (frame.north west) rectangle (frame.south east);\begin{scope}[shift={(frame.south east)}, xshift=-2cm, yshift=1cm]\foreach \i in {1,...,15}{\pgfmathsetseed{\i*7}\pgfmathsetmacro{\xa}{rand*3.5}\pgfmathsetmacro{\ya}{rand*1.5}\pgfmathsetmacro{\xb}{rand*3.5}\pgfmathsetmacro{\yb}{rand*1.5}\draw[accent, opacity=0.12, line width=0.4pt] (\xa,\ya) -- (\xb,\yb);\fill[accent!60, opacity=0.2] (\xa,\ya) circle (1.2pt);}\end{scope}\draw[accent, opacity=0.3, line width=1pt] ([xshift=15pt, yshift=-5pt]frame.north west) -- ([xshift=60pt, yshift=-5pt]frame.north west);}]
\begin{tabularx}{\linewidth}{@{}m{2.7cm}@{\hspace{\headergap}}X@{\hspace{\headergap}}>{\raggedleft\arraybackslash}m{4.5cm}@{}}
\begin{minipage}[c][\headerinnerheight][c]{2.7cm}\centering
\begin{tikzpicture}\draw[accent, line width=1.5pt] (0,0) circle (1.25cm);\draw[white!20, line width=0.5pt] (0,0) circle (1.35cm);\begin{scope}\clip (0,0) circle (1.2cm);\IfFileExists{${profilePhotoFilename}}{\node at (0,0) {\includegraphics[width=2.5cm]{${profilePhotoFilename}}};}{\fill[white!10] (-1.2,-1.2) rectangle (1.2,1.2);\node[white!70] at (0,0) {\fontsize{9}{9}\selectfont Photo};}\end{scope}\fill[green!60!accent] (0.85,-0.85) circle (5pt);\draw[ink, line width=1.5pt] (0.85,-0.85) circle (5pt);\end{tikzpicture}
\end{minipage} &
\begin{minipage}[c][\headerinnerheight][c]{\linewidth}
{\fontsize{${latexSize(settings.headerNameSize, 24)}}{${latexSize(settings.headerNameSize, 24)}}\selectfont\color{white}\bfseries ${escapeLatex(fullName)}}\par
\vspace{4pt}
{\fontsize{${latexSize(settings.headerTitleSize, 15.2)}}{${latexLeading(settings.headerTitleSize, 15.2, 1.05)}}\selectfont\color{accent!90}\bfseries\MakeUppercase{${escapeLatex(title)}}}\par
\vspace{4pt}
{\color{white!85}\fontsize{${latexSize(settings.headerHeadlineSize, 10)}}{${latexLeading(settings.headerHeadlineSize, 10, 1.08)}}\selectfont ${escapeLatex(headline)}}\par
\vspace{6pt}
\tagitem{\faCalendar* \hspace{2pt} Sept. 2026}\hspace{0.5cm}
\tagitem{\faCalendar* \hspace{2pt} 12 mois}\hspace{0.5cm}
\tagitem{\faBirthdayCake \hspace{2pt} ${escapeLatex(ageText)}}
\end{minipage} &
\begin{minipage}[c][\headerinnerheight][c]{4.8cm}\raggedleft
\contactrow{\faPhone}{}{\textcolor{white}{${escapeLatex(phone)}}}
\contactrow{\faHome}{}{${escapeLatex(location)}}
\contactrow{\faEnvelope}{}{${latexHref(`mailto:${email}`, email, true)}}
\contactrow{\faLinkedin}{LinkedIn}{${latexHref(linkedin, "/idris-achabou", true)}}
\contactrow{\faGlobe}{Portfolio}{${latexHref(portfolio, "site-web", true)}}
\vspace{2pt}\tikz \draw[accent, line width=1pt] (0,0) -- (-1.5,0);
\end{minipage}
\end{tabularx}
\end{tcolorbox}
\vspace{0.02cm}
\noindent\makebox[\textwidth][c]{\scalebox{${contentScale.toFixed(2)}}{\begin{minipage}{1.351\textwidth}
\noindent
${body}
\end{minipage}}}
\end{document}
`;
}

export function moveCvItem(items, itemId, direction) {
  const list = [...items];
  const index = list.findIndex((item) => item.id === itemId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return list;

  const [item] = list.splice(index, 1);
  list.splice(targetIndex, 0, item);
  return list.map((entry, order) => ({ ...entry, displayOrder: order + 1 }));
}


export function cvTextSignature(item) {
  return [
    item?.title,
    item?.subtitle,
    item?.organization,
    item?.summary,
    item?.description,
    item?.shortDescription,
    toCsv(item?.skills),
    toCsv(item?.stacks),
    toCsv(item?.features),
  ].filter(Boolean).join(" ").toLowerCase();
}

export function scoreCvItemForKeywords(item, keywords = []) {
  const signature = cvTextSignature(item);
  return keywords.reduce((score, keyword, index) => {
    const cleanKeyword = String(keyword ?? "").toLowerCase().trim();
    return score + (cleanKeyword && signature.includes(cleanKeyword) ? 100 - index * 4 : 0);
  }, item?.featured ? 80 : 0);
}

export function buildLocalCvQualityReport(document, latexSource = "") {
  const normalized = normalizeCvDocument(document);
  const blockers = [];
  const warnings = [];
  const suggestions = [];
  const enabledProjects = enabledItems(normalized.projects, Infinity);
  const enabledExperiences = enabledItems(normalized.experiences, Infinity);
  const enabledEducation = enabledItems(normalized.education, Infinity);
  const assets = buildCvAssetsPayload(normalized);

  if (!normalizeCvString(normalized.profile?.fullName)) blockers.push("Nom/prénom manquant dans le header CV.");
  if (!normalizeCvString(normalized.profile?.headline)) warnings.push("Phrase d’accroche vide ou trop faible.");
  if (normalized.settings?.showPhoto && !normalizeCvString(normalized.profile?.photoDataUrl)) warnings.push("Photo CV absente : le modèle affichera un placeholder.");
  if (enabledEducation.length > 0 && enabledEducation.some((item) => !normalizeCvString(item.logoDataUrl))) warnings.push("Au moins un logo de formation est absent.");
  if (Number(normalized.settings?.projectLimit ?? 4) > 4) suggestions.push("Limiter les projets à 4 pour rester proche du modèle une page.");
  if (Number(normalized.settings?.experienceLimit ?? 2) > 2) suggestions.push("Limiter les expériences à 2 par défaut comme dans le CV de référence.");
  if (enabledProjects.length === 0) blockers.push("Aucun projet visible.");
  if (enabledExperiences.length === 0) warnings.push("Aucune expérience professionnelle visible.");
  if (latexSource && !latexSource.includes("\\schoollogo")) warnings.push("La source LaTeX ne contient pas la macro schoollogo du modèle fait main.");
  if (latexSource && !latexSource.includes("\\begin{tcolorbox}")) warnings.push("Le rendu risque de s’éloigner du template CV car tcolorbox est absent.");
  if (assets.length < 2) suggestions.push("Ajoute la photo et les logos école dans l’Asset Manager pour un export reproductible complet.");

  const pressure = (latexSource?.length ?? 0) / 24000 + Math.max(0, Number(normalized.settings?.projectLimit ?? 4) - 4) / 2 + Math.max(0, Number(normalized.settings?.experienceLimit ?? 2) - 2);
  const estimatedPages = Math.max(1, Math.ceil(pressure));
  if (estimatedPages > 1) warnings.push("Le CV est estimé à plus d’une page. Active la compaction intelligente.");

  const score = Math.max(0, 100 - blockers.length * 35 - warnings.length * 8 - suggestions.length * 3);
  return { score, estimatedPages, blockers, warnings, suggestions };
}

export function extractOfferKeywords(text) {
  const normalized = String(text ?? "").toLowerCase();
  const dictionary = [
    "java", "spring", "spring boot", "postgresql", "sql", "api rest", "react", "javascript", "typescript",
    "docker", "kubernetes", "linux", "ci/cd", "git", "maven", "junit", "tests", "architecture",
    "symfony", "python", "data", "devops", "cloud", "render", "neon", "tailwind", "mantine"
  ];
  return dictionary.filter((keyword) => normalized.includes(keyword));
}

export function buildOfferAnalysis(document, offerText) {
  const normalized = normalizeCvDocument(document);
  const offerKeywords = extractOfferKeywords(offerText);
  const visibleText = [
    normalized.profile?.title,
    normalized.profile?.headline,
    ...enabledItems(normalized.skills, normalized.settings?.skillsLimit).map((item) => item.label),
    ...enabledItems(normalized.experiences, normalized.settings?.experienceLimit).map(cvTextSignature),
    ...enabledItems(normalized.projects, normalized.settings?.projectLimit).map(cvTextSignature),
  ].join(" ").toLowerCase();
  const matched = offerKeywords.filter((keyword) => visibleText.includes(keyword));
  const missing = offerKeywords.filter((keyword) => !visibleText.includes(keyword));
  const score = offerKeywords.length ? Math.round((matched.length / offerKeywords.length) * 100) : 0;

  return {
    score,
    matched,
    missing,
    keywords: offerKeywords,
    recommendations: [
      missing.length > 0 ? `Ajouter ou remonter les mots-clés : ${missing.slice(0, 6).join(", ")}.` : "Les mots-clés majeurs de l’offre sont déjà visibles.",
      "Réordonner les projets et compétences par pertinence avec l’offre.",
      "Limiter le CV à 2 expériences et 4 projets pour rester dense et lisible.",
    ],
  };
}

export function diffCvDocuments(leftDocument, rightDocument) {
  const left = normalizeCvDocument(leftDocument);
  const right = normalizeCvDocument(rightDocument);
  const changes = [];
  const push = (type, label, before, after) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ type, label, before, after });
  };

  push("profile", "Titre CV", left.profile.title, right.profile.title);
  push("profile", "Accroche", left.profile.headline, right.profile.headline);
  push("settings", "Limite projets", left.settings.projectLimit, right.settings.projectLimit);
  push("settings", "Limite expériences", left.settings.experienceLimit, right.settings.experienceLimit);
  push("settings", "Densité", left.settings.density, right.settings.density);

  ["experiences", "education", "projects", "skills", "languages", "qualities"].forEach((section) => {
    const leftIds = (left[section] ?? []).map((item) => item.id ?? item.title ?? item.label);
    const rightIds = (right[section] ?? []).map((item) => item.id ?? item.title ?? item.label);
    push("order", `Ordre ${section}`, leftIds, rightIds);
    push("visibility", `Visibilité ${section}`, (left[section] ?? []).map((item) => item.enabled !== false), (right[section] ?? []).map((item) => item.enabled !== false));
  });

  return changes;
}

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

export function normalizeGeneratedFileUrl(url) {
  const value = normalizeCvString(url);
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) return value;
  return buildBackendUrl(value.startsWith("/") ? value : `/${value}`);
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
    stacks: toCsv(project.stacks),
    features: toCsv(project.features),
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

export function JsonCodeEditor({ value, onChange, highlightRef, lineNumbersRef, analysis }) {
  const highlightedValue = useMemo(() => highlightJson(value), [value]);
  const lineCount = Math.max(value.split("\n").length, 1);

  function syncScroll(event) {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }

  return (
    <div className="json-editor-codearea">
      <div ref={lineNumbersRef} className="json-editor-line-numbers" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => (
          <span
            key={index}
            className={analysis?.line === index + 1 ? "json-line-error" : undefined}
          >
            {index + 1}
          </span>
        ))}
      </div>
      <div className="json-editor-input-layer">
        <pre
          ref={highlightRef}
          className="json-editor-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedValue }}
        />
        <textarea
          className="json-editor-textarea"
          aria-label="Éditeur JSON de la version courante"
          aria-invalid={analysis?.valid === false}
          spellCheck="false"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onScroll={syncScroll}
        />
        {analysis?.valid === false && analysis.line && analysis.column && (
          <div className="json-editor-inline-diagnostic" aria-hidden="true">
            Ligne {analysis.line}, colonne {analysis.column}
          </div>
        )}
      </div>
    </div>
  );
}

export function FileLink({ label, url, mode = "modal" }) {
  if (!url) return null;

  return (
    <Group gap="xs" align="center" className="admin-file-current-line">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <FilePreviewButton
        url={url}
        label="Voir"
        title={label}
        mode={mode}
        size="xs"
        variant="light"
        className="admin-file-preview-button"
      />
    </Group>
  );
}

export function AdminAuthShell({ children }) {
  return (
    <main className="admin-page admin-auth-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />
      <Stack gap="xl" className="admin-shell admin-auth-shell">
        {children}
      </Stack>
    </main>
  );
}

export function AdminChecking() {
  return (
    <AdminAuthShell>
      <Paper withBorder radius="xl" p="xl" className="admin-hero-card admin-auth-card">
        <Stack gap="md" align="center">
          <Loader size="md" />
          <Text fw={800}>Chargement du panel…</Text>
          <Text size="sm" c="dimmed" ta="center">
            Vérification de l’accès en cours.
          </Text>
        </Stack>
      </Paper>
    </AdminAuthShell>
  );
}

export function AdminLoginRedirect() {
  useEffect(() => {
    const redirectTarget = `${window.location.origin}/admin`;
    const loginUrl = buildBackendUrl(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    window.location.replace(loginUrl);
  }, []);

  return (
    <AdminAuthShell>
      <Paper withBorder radius="xl" p="xl" className="admin-hero-card admin-auth-card">
        <Stack gap="md" align="center">
          <Loader size="md" />
          <Text fw={800}>Redirection vers la connexion…</Text>
        </Stack>
      </Paper>
    </AdminAuthShell>
  );
}

