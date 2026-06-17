import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  FileInput,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";
import { FilePreviewButton } from "./FilePreview";
import { normalizeAdminPortfolioJson } from "../utils/adminJsonImport";
import {
  apiRequest,
  isAuthRequiredError,
  logoutAdmin,
  uploadProtectedFile,
  buildBackendUrl
} from "../services/authApi";

const contactTypeOptions = [
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


const applicationStatusOptions = [
  { value: "DRAFT", label: "À préparer" },
  { value: "TO_SEND", label: "Prête à envoyer" },
  { value: "SENT", label: "Envoyée" },
  { value: "FOLLOW_UP", label: "Relance à faire" },
  { value: "INTERVIEW", label: "Entretien" },
  { value: "REJECTED", label: "Refus" },
  { value: "ACCEPTED", label: "Acceptée" },
  { value: "ARCHIVED", label: "Archivée" },
];

const applicationStatusLabels = Object.fromEntries(applicationStatusOptions.map((item) => [item.value, item.label]));

const applicationStatusColors = {
  DRAFT: "gray",
  TO_SEND: "blue",
  SENT: "cyan",
  FOLLOW_UP: "orange",
  INTERVIEW: "violet",
  REJECTED: "red",
  ACCEPTED: "green",
  ARCHIVED: "dark",
};

const emptyApplicationForm = {
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

const defaultOwnerContacts = [
  { type: "EMAIL", value: "idris.achabou@example.com" },
  { type: "GITHUB", value: "https://github.com/idris-ach2002" },
  { type: "LINKEDIN", value: "https://www.linkedin.com/in/idris-achabou" },
  { type: "PORTFOLIO", value: "https://portfolio.example.com" },
];

const emptyOwnerForm = {
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

const emptyVersionForm = {
  versionTag: "v2",
  label: "Version alternance 2026",
  description: "Version orientée recherche d’alternance.",
  active: false,
  published: true,
};

const emptyProfileForm = {
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

const emptyTimelineForm = {
  title: "Parcours",
  description: "Formation, expériences et projets structurants.",
};

const emptyExperienceForm = {
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

const emptyProjectForm = {
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

const emptyProfileFiles = {
  profileImage: null,
  logo: null,
  cv: null,
};

const emptyExperienceFiles = {
  image: null,
};

const emptyProjectFiles = {
  image: null,
  documentation: null,
};

const experienceCategories = [
  "SCHOOL",
  "INTERNSHIP",
  "ALTERNANCE",
  "VOLUNTEERING",
  "CDI",
  "CDD",
];

const projectStatuses = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "MAINTAINED",
  "ARCHIVED",
];


const cvSectionDefinitions = [
  { key: "profile", label: "Profil" },
  { key: "contacts", label: "Contacts" },
  { key: "skills", label: "Compétences" },
  { key: "experiences", label: "Expériences" },
  { key: "education", label: "Formation" },
  { key: "projects", label: "Projets" },
  { key: "languages", label: "Langues" },
  { key: "qualities", label: "Qualités" },
];

const cvContentSections = [
  { value: "profile", label: "Profil" },
  { value: "experiences", label: "Expériences" },
  { value: "education", label: "Formation" },
  { value: "projects", label: "Projets" },
  { value: "skills", label: "Compétences" },
  { value: "languages", label: "Langues" },
  { value: "qualities", label: "Qualités" },
  { value: "contacts", label: "Contacts" },
];

const cvTargetPresets = [
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

function createCvId(prefix = "cv") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneDeep(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function ensureCvId(item, prefix) {
  return {
    ...item,
    id: item?.id ?? createCvId(prefix),
    enabled: item?.enabled ?? true,
  };
}

function normalizeCvString(value) {
  return String(value ?? "").trim();
}

function collectSkillLabels(...sources) {
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

function sortByDisplayOrder(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftOrder = Number(left?.displayOrder ?? 9999);
    const rightOrder = Number(right?.displayOrder ?? 9999);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return normalizeCvString(right?.startDate).localeCompare(normalizeCvString(left?.startDate));
  });
}

function createEmptyCvDocument() {
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

function createCvDocumentFromVersionData({ ownerForm, profileForm, experiences, projects }) {
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

function normalizeCvDocument(document) {
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

function escapeLatex(value) {
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

function sanitizeHexColor(value, fallback = "6E877E") {
  const color = String(value ?? "").replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(color) ? color.toUpperCase() : fallback;
}

function safeCvAssetFilename(value, fallback) {
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

function cvFileExtension(file, fallback = "jpg") {
  const filename = normalizeCvString(file?.name).toLowerCase();
  if (filename.endsWith(".png")) return "png";
  if (filename.endsWith(".jpeg")) return "jpeg";
  if (filename.endsWith(".jpg")) return "jpg";
  if (String(file?.type ?? "").includes("png")) return "png";
  if (String(file?.type ?? "").includes("jpeg")) return "jpg";
  return fallback;
}

function cvAssetMimeFromDataUrl(dataUrl, fallback = "image/jpeg") {
  const match = String(dataUrl ?? "").match(/^data:([^;,]+)[;,]/);
  return match?.[1] || fallback;
}

function readCvAssetFile(file) {
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

function inferSchoolDefaults(item, index = 0) {
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

function latexSchoolLinks(item, defaults) {
  const officialUrl = normalizeCvString(item.officialUrl ?? item.websiteUrl ?? defaults.officialUrl);
  const programUrl = normalizeCvString(item.programUrl ?? defaults.programUrl);
  const officialLabel = normalizeCvString(item.officialLabel ?? defaults.officialLabel ?? "parcours officiel");
  const programLabel = normalizeCvString(item.programLabel ?? defaults.programLabel ?? "programme");
  const links = [];

  if (officialUrl) links.push(latexHref(officialUrl, officialLabel));
  if (programUrl) links.push(latexHref(programUrl, programLabel));

  return links.join("\\enspace|\\enspace");
}

function buildCvAssetsPayload(document) {
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

function latexItemize(items) {
  const cleanItems = items.filter(Boolean);
  if (cleanItems.length === 0) return "";

  return `\\begin{itemize}\n${cleanItems.map((item) => `    \\item ${escapeLatex(item)}`).join("\n")}\n  \\end{itemize}`;
}

function latexSection(title, content) {
  if (!content.trim()) return "";
  return `\\sectiontitle{${escapeLatex(title)}}\n${content}\n`;
}

function enabledItems(items, limit = Infinity) {
  return (items ?? []).filter((item) => item?.enabled !== false).slice(0, Number(limit) || Infinity);
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function latexSize(value, fallback, min = 6, max = 30) {
  const size = clampNumber(value, min, max, fallback);
  return Number(size.toFixed(2)).toString();
}

function latexLeading(value, fallback, factor = 1) {
  const size = Number(latexSize(value, fallback));
  return Number((size * factor).toFixed(2)).toString();
}

function shortenCvText(value, enabled, maxLength = 155) {
  const text = normalizeCvString(value);
  if (!enabled || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim().replace(/[,. ;:]+$/, "")}…`;
}

function cvMonthYear(value) {
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

function cvDateLabel(startDate, endDate, currentPosition) {
  const start = cvMonthYear(startDate);
  const end = currentPosition ? "présent" : cvMonthYear(endDate);
  return [start, end].filter(Boolean).join(" - ");
}

function cvYearRange(startDate, endDate, currentPosition) {
  const start = normalizeCvString(startDate).slice(0, 4);
  const end = currentPosition ? "présent" : normalizeCvString(endDate).slice(0, 4);
  return [start, end].filter(Boolean).join(" - ");
}

function latexHref(url, label, light = false) {
  const cleanUrl = normalizeCvString(url);
  const cleanLabel = normalizeCvString(label);
  if (!cleanLabel) return "";
  if (!cleanUrl) return escapeLatex(cleanLabel);
  return `${light ? "\\cvhreflight" : "\\cvhref"}{${escapeLatex(cleanUrl)}}{${escapeLatex(cleanLabel)}}`;
}

function contactValueFromDocument(document, typeNames, fallback = "") {
  const types = Array.isArray(typeNames) ? typeNames : [typeNames];
  const found = (document.contacts ?? []).find((contact) => types.includes(contact?.type) || types.includes(contact?.label));
  return normalizeCvString(found?.value) || fallback;
}

function buildLatexContact(contact) {
  const type = String(contact?.type ?? contact?.label ?? "CONTACT").replace(/_/g, " ");
  const value = normalizeCvString(contact?.value);
  if (!value) return "";
  return `\\textbf{${escapeLatex(type)}} : ${escapeLatex(value)}\\par`;
}

function buildDefaultSkillCards(document) {
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

function buildLatexSkillCards(document) {
  return buildDefaultSkillCards(document)
    .map((card) => `\\skillcard\n  {${escapeLatex(card.title)}}\n  {${escapeLatex(card.stack)}}\n  {${escapeLatex(card.text)}}\n  {${card.proof}}`)
    .join("\n\n");
}

function buildLatexExperience(experience, featuresLimit, reduceDescriptions = false) {
  const titleLine = [experience.title, experience.organization].filter(Boolean).join(" \\textbar\\ ");
  const dateLine = cvDateLabel(experience.startDate, experience.endDate, experience.currentPosition);
  const skills = toArray(experience.skills).slice(0, 8).join(" · ");
  const bullets = [experience.summary, experience.description]
    .filter(Boolean)
    .slice(0, featuresLimit)
    .map((text) => shortenCvText(text, reduceDescriptions, 155));

  return `\\experienceentry\n  {${escapeLatex(titleLine || "Expérience")}}\n  {${escapeLatex(dateLine)}}\n  {${escapeLatex(skills || experience.location || "")}}\n  {${latexItemize(bullets)}}`;
}

function buildLatexProject(project, featuresLimit, reduceDescriptions = false) {
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

function buildLatexEducationEntry(item, index = 0) {
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

function buildLatexSectionContent(sectionKey, document) {
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

function buildColumnLatex(document, column) {
  const settings = document.settings ?? createEmptyCvDocument().settings;
  const placements = settings.sectionColumns ?? createEmptyCvDocument().settings.sectionColumns;
  const orderedSections = ["languages", "skills", "qualities", "experiences", "projects", "education"];
  return orderedSections
    .filter((sectionKey) => (placements?.[sectionKey] ?? (['languages', 'skills', 'qualities'].includes(sectionKey) ? 'left' : 'right')) === column)
    .map((sectionKey) => buildLatexSectionContent(sectionKey, document))
    .filter(Boolean)
    .join(`\n\\vspace{${settings.sectionSpacing ?? 0.3}cm}\n`);
}

function buildCvLatexFromDocument(inputDocument) {
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

function moveCvItem(items, itemId, direction) {
  const list = [...items];
  const index = list.findIndex((item) => item.id === itemId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return list;

  const [item] = list.splice(index, 1);
  list.splice(targetIndex, 0, item);
  return list.map((entry, order) => ({ ...entry, displayOrder: order + 1 }));
}


function cvTextSignature(item) {
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

function scoreCvItemForKeywords(item, keywords = []) {
  const signature = cvTextSignature(item);
  return keywords.reduce((score, keyword, index) => {
    const cleanKeyword = String(keyword ?? "").toLowerCase().trim();
    return score + (cleanKeyword && signature.includes(cleanKeyword) ? 100 - index * 4 : 0);
  }, item?.featured ? 80 : 0);
}

function buildLocalCvQualityReport(document, latexSource = "") {
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

function extractOfferKeywords(text) {
  const normalized = String(text ?? "").toLowerCase();
  const dictionary = [
    "java", "spring", "spring boot", "postgresql", "sql", "api rest", "react", "javascript", "typescript",
    "docker", "kubernetes", "linux", "ci/cd", "git", "maven", "junit", "tests", "architecture",
    "symfony", "python", "data", "devops", "cloud", "render", "neon", "tailwind", "mantine"
  ];
  return dictionary.filter((keyword) => normalized.includes(keyword));
}

function buildOfferAnalysis(document, offerText) {
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

function diffCvDocuments(leftDocument, rightDocument) {
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

function toArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCsv(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function getEntityId(entity) {
  return entity?.ownerId ?? entity?.id ?? entity?.websiteVersionId;
}

function getProjectId(project) {
  return project?.projectId ?? project?.id;
}

function getOwnerLabel(owner) {
  const fullName = [owner?.firstName, owner?.name].filter(Boolean).join(" ");
  return fullName || `Owner ${getEntityId(owner)}`;
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function nullIfBlank(value) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function createEmptyContact() {
  return { type: "EMAIL", value: "" };
}

function cloneContactRows(contacts) {
  return (contacts ?? [])
    .map((contact) => ({
      type: contact?.type ?? "EMAIL",
      value: contact?.value ?? "",
    }))
    .filter((contact) => contact.type);
}

function sanitizeContactRows(contacts) {
  return cloneContactRows(contacts)
    .map((contact) => ({
      type: contact.type,
      value: String(contact.value ?? "").trim(),
    }))
    .filter((contact) => contact.value.length > 0);
}

function hydrateOwnerForm(owner) {
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

function normalizeGeneratedFileUrl(url) {
  const value = normalizeCvString(url);
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) return value;
  return buildBackendUrl(value.startsWith("/") ? value : `/${value}`);
}

function normalizeUrlFromUpload(data) {
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

async function uploadFile(file) {
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

function hydrateProfileForm(profile) {
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

function hydrateTimelineForm(timeline) {
  return {
    title: timeline?.title ?? emptyTimelineForm.title,
    description: timeline?.description ?? emptyTimelineForm.description,
  };
}

function hydrateExperiences(timeline) {
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


function getProjectArchitectureUrl(project) {
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

function hydrateProjectForm(project) {
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

function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlightJson(value) {
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

function getLineColumnFromPosition(value, position) {
  const safePosition = Math.max(0, Math.min(Number(position) || 0, value.length));
  const beforeError = value.slice(0, safePosition);
  const lines = beforeError.split("\n");

  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  };
}

function getJsonSyntaxLocation(error, value) {
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

function buildJsonEditorAnalysis(value) {
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

function JsonCodeEditor({ value, onChange, highlightRef, lineNumbersRef, analysis }) {
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

function FileLink({ label, url, mode = "modal" }) {
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

function AdminAuthShell({ children }) {
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

function AdminChecking() {
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

function AdminLoginRedirect() {
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

export default function Admin() {
  const rootRef = useRef(null);
  const jsonHighlightRef = useRef(null);
  const jsonLineNumbersRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [authStatus, setAuthStatus] = useState("checking");

  const [owners, setOwners] = useState([]);
  const [versions, setVersions] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectMode, setProjectMode] = useState("create");
  const [cloneSourceVersionId, setCloneSourceVersionId] = useState(null);

  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [timelineForm, setTimelineForm] = useState(emptyTimelineForm);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);
  const [experiences, setExperiences] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  const [profileFiles, setProfileFiles] = useState(emptyProfileFiles);
  const [experienceFiles, setExperienceFiles] = useState(emptyExperienceFiles);
  const [projectFiles, setProjectFiles] = useState(emptyProjectFiles);

  const [jsonImportFile, setJsonImportFile] = useState(null);
  const [jsonImportText, setJsonImportText] = useState("");
  const [jsonImportSummary, setJsonImportSummary] = useState(null);

  const [jsonEditorOpened, setJsonEditorOpened] = useState(false);
  const [jsonEditorText, setJsonEditorText] = useState("");
  const [jsonEditorError, setJsonEditorError] = useState(null);

  const [cvEditorState, setCvEditorState] = useState(() => ({
    past: [],
    present: createEmptyCvDocument(),
    future: [],
    commandLog: [],
  }));
  const [cvSelectedSection, setCvSelectedSection] = useState("profile");
  const [cvActiveEditorTab, setCvActiveEditorTab] = useState("content");
  const [cvDraggingItem, setCvDraggingItem] = useState(null);
  const [cvManualLatexDirty, setCvManualLatexDirty] = useState(false);
  const [cvLatexSource, setCvLatexSource] = useState("");
  const [cvPreviewUrl, setCvPreviewUrl] = useState("");
  const [cvCompileLogs, setCvCompileLogs] = useState("");
  const [cvCompileWarnings, setCvCompileWarnings] = useState([]);
  const [cvCompileSuccess, setCvCompileSuccess] = useState(null);
  const [cvTemplateLocked, setCvTemplateLocked] = useState(true);
  const [cvQualityReport, setCvQualityReport] = useState(null);
  const [cvVariants, setCvVariants] = useState([]);
  const [selectedCvVariantId, setSelectedCvVariantId] = useState(null);
  const [cvVariantName, setCvVariantName] = useState("CV ciblé");
  const [cvDiffReport, setCvDiffReport] = useState(null);
  const [cvOfferText, setCvOfferText] = useState("");
  const [cvOfferAnalysis, setCvOfferAnalysis] = useState(null);
  const [cvPresetName, setCvPresetName] = useState("Preset personnalisé");
  const [cvCommandPresets, setCvCommandPresets] = useState([]);
  const [cvExportZipUrl, setCvExportZipUrl] = useState("");
  const [cvAsyncJob, setCvAsyncJob] = useState(null);
  const [cvRegressionReport, setCvRegressionReport] = useState(null);

  const [portfolioHealthReport, setPortfolioHealthReport] = useState(null);
  const [publishValidationReport, setPublishValidationReport] = useState(null);
  const [portfolioBackupUrl, setPortfolioBackupUrl] = useState("");
  const [portfolioBackupJson, setPortfolioBackupJson] = useState("");
  const [portfolioRestoreText, setPortfolioRestoreText] = useState("");
  const [portfolioRestoreLabel, setPortfolioRestoreLabel] = useState("Version restaurée depuis backup");

  const [applications, setApplications] = useState([]);
  const [applicationsDashboard, setApplicationsDashboard] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const [offerAnalysis, setOfferAnalysis] = useState(null);
  const [coverLetterPreviewUrl, setCoverLetterPreviewUrl] = useState("");
  const [coverLetterLogs, setCoverLetterLogs] = useState("");
  const [coverLetterWarnings, setCoverLetterWarnings] = useState([]);
  const [applicationZipUrl, setApplicationZipUrl] = useState("");

  const jsonEditorAnalysis = useMemo(
    () => buildJsonEditorAnalysis(jsonEditorText),
    [jsonEditorText],
  );

  const cvDocument = cvEditorState.present;
  const cvCanUndo = cvEditorState.past.length > 0;
  const cvCanRedo = cvEditorState.future.length > 0;

  const cvSelectedItems = useMemo(() => {
    if (["experiences", "education", "projects", "skills", "languages", "qualities", "contacts"].includes(cvSelectedSection)) {
      return cvDocument[cvSelectedSection] ?? [];
    }

    return [];
  }, [cvDocument, cvSelectedSection]);


  const cvQualitySummary = useMemo(
    () => cvQualityReport ?? buildLocalCvQualityReport(cvDocument, cvLatexSource),
    [cvDocument, cvLatexSource, cvQualityReport],
  );

  const selectedVersion = useMemo(
    () =>
      versions.find(
        (version) => String(getEntityId(version)) === String(selectedVersionId),
      ),
    [versions, selectedVersionId],
  );

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(getProjectId(project)) === String(selectedProjectId),
      ),
    [projects, selectedProjectId],
  );

  const selectedApplication = useMemo(
    () => applications.find((application) => String(application.id) === String(selectedApplicationId)),
    [applications, selectedApplicationId],
  );

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    if (!root) return undefined;

    const heroCard = root.querySelector(".admin-hero-card");
    const cards = root.querySelectorAll(".admin-context-card, .admin-tabs-card");
    const orbs = root.querySelectorAll(".admin-orb");

    if (heroCard) {
      gsap.from(heroCard, {
        y: 34,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }

    if (cards.length > 0) {
      gsap.from(cards, {
        y: 30,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.12,
      });
    }

    if (orbs.length > 0) {
      gsap.to(orbs, {
        y: -16,
        x: 12,
        duration: 5.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.45,
      });
    }

    return undefined;
  }, []);

  useEffect(() => {
    const variants = readCvLocalList("variants");
    const presets = readCvLocalList("presets");
    setCvVariants(variants);
    setCvCommandPresets(presets);
    setSelectedCvVariantId(variants[0]?.id ?? null);
    setCvDiffReport(null);
    setCvQualityReport(null);
    setCvExportZipUrl("");
    setCvAsyncJob(null);
    setPortfolioHealthReport(null);
    setPublishValidationReport(null);
    setPortfolioBackupUrl("");
    setPortfolioBackupJson("");
  }, [selectedOwnerId, selectedVersionId]);

  useEffect(() => {
    if (!selectedOwnerId || authStatus !== "authenticated") {
      setApplications([]);
      setApplicationsDashboard(null);
      resetApplicationForm();
      return;
    }
    loadApplications(selectedOwnerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerId, authStatus]);

  function cvLocalStorageKey(kind) {
    return `portfolio-cv-${kind}-${selectedOwnerId ?? "owner"}-${selectedVersionId ?? "version"}`;
  }

  function readCvLocalList(kind) {
    try {
      const raw = localStorage.getItem(cvLocalStorageKey(kind));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCvLocalList(kind, list) {
    localStorage.setItem(cvLocalStorageKey(kind), JSON.stringify(list));
  }

  function updateOwnerForm(field, value) {
    setOwnerForm((current) => ({ ...current, [field]: value }));
  }

  function updateOwnerContact(index, field, value) {
    setOwnerForm((current) => ({
      ...current,
      contacts: current.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact,
      ),
    }));
  }

  function addOwnerContact() {
    setOwnerForm((current) => ({
      ...current,
      contacts: [...current.contacts, createEmptyContact()],
    }));
  }

  function removeOwnerContact(index) {
    setOwnerForm((current) => {
      const contacts = current.contacts.filter((_, contactIndex) => contactIndex !== index);
      return {
        ...current,
        contacts: contacts.length > 0 ? contacts : [createEmptyContact()],
      };
    });
  }

  function updateVersionForm(field, value) {
    setVersionForm((current) => ({ ...current, [field]: value }));
  }

  function updateProfileForm(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function updateTimelineForm(field, value) {
    setTimelineForm((current) => ({ ...current, [field]: value }));
  }

  function updateExperienceForm(field, value) {
    setExperienceForm((current) => ({ ...current, [field]: value }));
  }

  function updateProjectForm(field, value) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function hydrateVersionForms(version, sourceOwner = ownerForm) {
    if (!version) {
      setVersionForm({ ...emptyVersionForm });
      setProfileForm({ ...emptyProfileForm });
      setTimelineForm({ ...emptyTimelineForm });
      setExperiences([]);
      setProjects([]);
      resetProjectForm();
      resetCvEditorFromData({
        owner: sourceOwner,
        profile: emptyProfileForm,
        experiences: [],
        projects: [],
        label: "CV réinitialisé",
      });
      return;
    }

    const nextProfile = hydrateProfileForm(version.prof);
    const nextTimeline = hydrateTimelineForm(version.timeline);
    const nextExperiences = hydrateExperiences(version.timeline);
    const nextProjects = version.projects ?? [];

    setVersionForm({
      versionTag: version.versionTag ?? "",
      label: version.label ?? "",
      description: version.description ?? "",
      active: Boolean(version.active),
      published: Boolean(version.published),
    });

    setProfileForm(nextProfile);
    setTimelineForm(nextTimeline);
    setExperiences(nextExperiences);
    setProjects(nextProjects);
    setCloneSourceVersionId(String(getEntityId(version)));
    resetProjectForm(nextProjects);
    resetCvEditorFromData({
      owner: sourceOwner,
      profile: nextProfile,
      experiences: nextExperiences,
      projects: nextProjects,
      label: "CV synchronisé avec la version sélectionnée",
    });
  }

  function resetProjectForm(sourceProjects = projects) {
    setProjectMode("create");
    setSelectedProjectId(null);
    setProjectForm({
      ...emptyProjectForm,
      displayOrder: (sourceProjects?.length ?? 0) + 1,
    });
    setProjectFiles(emptyProjectFiles);
  }

  function selectProject(projectId, sourceProjects = projects) {
    const project = sourceProjects.find(
      (item) => String(getProjectId(item)) === String(projectId),
    );

    if (!project) {
      resetProjectForm();
      return;
    }

    setProjectMode("edit");
    setSelectedProjectId(String(getProjectId(project)));
    setProjectForm(hydrateProjectForm(project));
    setProjectFiles(emptyProjectFiles);
  }

  function selectVersion(versionId, sourceVersions = versions) {
    const version = sourceVersions.find(
      (item) => String(getEntityId(item)) === String(versionId),
    );

    setSelectedVersionId(versionId ? String(versionId) : null);
    hydrateVersionForms(version);
  }

  function resetCvEditorFromData({ owner = ownerForm, profile = profileForm, experiences: sourceExperiences = experiences, projects: sourceProjects = projects, label = "CV réinitialisé depuis le portfolio" } = {}) {
    const nextDocument = normalizeCvDocument(createCvDocumentFromVersionData({
      ownerForm: owner,
      profileForm: profile,
      experiences: sourceExperiences,
      projects: sourceProjects,
    }));

    setCvEditorState({
      past: [],
      present: nextDocument,
      future: [],
      commandLog: [{ id: createCvId("cmd"), label, timestamp: new Date().toLocaleTimeString("fr-FR") }],
    });
    setCvSelectedSection("profile");
    setCvLatexSource(buildCvLatexFromDocument(nextDocument));
    setCvManualLatexDirty(false);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvCompileSuccess(null);
    setCvPreviewUrl("");
  }

  function applyCvCommand(label, updater) {
    setCvEditorState((current) => {
      const previousDocument = normalizeCvDocument(current.present);
      const draft = cloneDeep(previousDocument);
      const nextDocument = normalizeCvDocument(updater(draft) ?? draft);

      if (JSON.stringify(previousDocument) === JSON.stringify(nextDocument)) {
        return current;
      }

      setCvLatexSource(buildCvLatexFromDocument(nextDocument));
      setCvManualLatexDirty(false);
      setCvCompileSuccess(null);

      return {
        past: [...current.past.slice(-39), previousDocument],
        present: nextDocument,
        future: [],
        commandLog: [
          { id: createCvId("cmd"), label, timestamp: new Date().toLocaleTimeString("fr-FR") },
          ...current.commandLog,
        ].slice(0, 24),
      };
    });
  }

  function undoCvCommand() {
    setCvEditorState((current) => {
      const previousDocument = current.past.at(-1);
      if (!previousDocument) return current;

      setCvLatexSource(buildCvLatexFromDocument(previousDocument));
      setCvManualLatexDirty(false);
      setCvCompileSuccess(null);

      return {
        past: current.past.slice(0, -1),
        present: previousDocument,
        future: [current.present, ...current.future].slice(0, 40),
        commandLog: [
          { id: createCvId("cmd"), label: "Annuler la dernière commande", timestamp: new Date().toLocaleTimeString("fr-FR") },
          ...current.commandLog,
        ].slice(0, 24),
      };
    });
  }

  function redoCvCommand() {
    setCvEditorState((current) => {
      const nextDocument = current.future[0];
      if (!nextDocument) return current;

      setCvLatexSource(buildCvLatexFromDocument(nextDocument));
      setCvManualLatexDirty(false);
      setCvCompileSuccess(null);

      return {
        past: [...current.past, current.present].slice(-40),
        present: nextDocument,
        future: current.future.slice(1),
        commandLog: [
          { id: createCvId("cmd"), label: "Rétablir la commande", timestamp: new Date().toLocaleTimeString("fr-FR") },
          ...current.commandLog,
        ].slice(0, 24),
      };
    });
  }

  function updateCvProfileField(field, value) {
    applyCvCommand(`Modifier le profil : ${field}`, (draft) => ({
      ...draft,
      profile: { ...draft.profile, [field]: value },
    }));
  }

  function updateCvProfileFields(fields, label = "Modifier les assets du profil") {
    applyCvCommand(label, (draft) => ({
      ...draft,
      profile: { ...draft.profile, ...fields },
    }));
  }

  function updateCvItemFields(sectionKey, itemId, fields, label = `Modifier ${sectionKey}`) {
    applyCvCommand(label, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).map((item) =>
        item.id === itemId ? { ...item, ...fields } : item,
      ),
    }));
  }

  async function importCvProfilePhoto(file) {
    if (!file) return;

    try {
      const dataUrl = await readCvAssetFile(file);
      const extension = cvFileExtension(file, "jpg");
      updateCvProfileFields({
        photoFilename: safeCvAssetFilename(`idris.${extension}`, "idris.jpg"),
        photoDataUrl: dataUrl,
        photoMimeType: file.type || cvAssetMimeFromDataUrl(dataUrl),
      }, "Importer la photo du CV");
    } catch (err) {
      setError(err?.message ?? "Import de la photo du CV impossible.");
    }
  }

  async function importCvEducationLogo(item, file) {
    if (!file || !item?.id) return;

    try {
      const dataUrl = await readCvAssetFile(file);
      const defaults = inferSchoolDefaults(item, 0);
      const extension = cvFileExtension(file, defaults.logoFilename.endsWith(".png") ? "png" : "jpg");
      const basename = safeCvAssetFilename(defaults.logoFilename, `school.${extension}`).replace(/\.(png|jpe?g)$/i, "");
      const filename = safeCvAssetFilename(`${basename}.${extension}`, defaults.logoFilename);

      updateCvItemFields("education", item.id, {
        logoFilename: filename,
        logoDataUrl: dataUrl,
        logoMimeType: file.type || cvAssetMimeFromDataUrl(dataUrl, extension === "png" ? "image/png" : "image/jpeg"),
      }, "Importer un logo de formation");
    } catch (err) {
      setError(err?.message ?? "Import du logo de formation impossible.");
    }
  }

  function updateCvSettingsField(field, value) {
    applyCvCommand(`Modifier le style : ${field}`, (draft) => ({
      ...draft,
      settings: { ...draft.settings, [field]: value },
    }));
  }

  function toggleCvSection(sectionKey, checked) {
    applyCvCommand(`${checked ? "Afficher" : "Masquer"} la section ${sectionKey}`, (draft) => ({
      ...draft,
      sections: { ...draft.sections, [sectionKey]: checked },
    }));
  }

  function updateCvItem(sectionKey, itemId, field, value) {
    applyCvCommand(`Modifier ${sectionKey} : ${field}`, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updateCvItemCsv(sectionKey, itemId, field, value) {
    updateCvItem(sectionKey, itemId, field, toArray(value));
  }

  function toggleCvItem(sectionKey, itemId, checked) {
    applyCvCommand(`${checked ? "Afficher" : "Masquer"} un élément ${sectionKey}`, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).map((item) =>
        item.id === itemId ? { ...item, enabled: checked } : item,
      ),
    }));
  }

  function moveCvEditorItem(sectionKey, itemId, direction) {
    applyCvCommand(direction < 0 ? "Monter un bloc" : "Descendre un bloc", (draft) => ({
      ...draft,
      [sectionKey]: moveCvItem(draft[sectionKey] ?? [], itemId, direction),
    }));
  }


  function moveCvEditorItemTo(sectionKey, itemId, position) {
    applyCvCommand(position === "first" ? "Mettre un bloc en premier" : "Mettre un bloc en dernier", (draft) => {
      const list = [...(draft[sectionKey] ?? [])];
      const index = list.findIndex((item) => item.id === itemId);
      if (index < 0) return draft;
      const [item] = list.splice(index, 1);
      if (position === "first") {
        list.unshift(item);
      } else {
        list.push(item);
      }
      return { ...draft, [sectionKey]: list.map((entry, order) => ({ ...entry, displayOrder: order + 1 })) };
    });
  }

  function sortCvItems(sectionKey, mode) {
    applyCvCommand(mode === "date" ? `Réordonner ${sectionKey} par date` : `Réordonner ${sectionKey} par pertinence`, (draft) => {
      const priorityKeywords = ["portfolio", "spring", "java", "ais", "postgres", "docker", "react", "architecture", "test"];
      const scoreItem = (item) => {
        const signature = [item.title, item.subtitle, item.organization, item.summary, item.description, toCsv(item.skills), toCsv(item.stacks)].join(" ").toLowerCase();
        const keywordScore = priorityKeywords.reduce((score, keyword, index) => score + (signature.includes(keyword) ? 30 - index : 0), 0);
        return keywordScore + (item.featured ? 40 : 0) + (item.enabled === false ? -200 : 0);
      };
      const sorted = [...(draft[sectionKey] ?? [])].sort((left, right) => {
        if (mode === "date") {
          const leftDate = left.startDate || left.endDate || "";
          const rightDate = right.startDate || right.endDate || "";
          return String(rightDate).localeCompare(String(leftDate));
        }
        return scoreItem(right) - scoreItem(left);
      });
      return { ...draft, [sectionKey]: sorted.map((entry, order) => ({ ...entry, displayOrder: order + 1 })) };
    });
  }

  function dropCvItem(sectionKey, draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    applyCvCommand("Réordonner manuellement par glisser-déposer", (draft) => {
      const list = [...(draft[sectionKey] ?? [])];
      const draggedIndex = list.findIndex((item) => item.id === draggedId);
      const targetIndex = list.findIndex((item) => item.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return draft;
      const [draggedItem] = list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, draggedItem);
      return { ...draft, [sectionKey]: list.map((entry, order) => ({ ...entry, displayOrder: order + 1 })) };
    });
  }

  function getCvDragProps(sectionKey, itemId) {
    return {
      draggable: true,
      onDragStart: () => setCvDraggingItem({ sectionKey, itemId }),
      onDragEnd: () => setCvDraggingItem(null),
      onDragOver: (event) => event.preventDefault(),
      onDrop: (event) => {
        event.preventDefault();
        if (cvDraggingItem?.sectionKey === sectionKey) {
          dropCvItem(sectionKey, cvDraggingItem.itemId, itemId);
        }
        setCvDraggingItem(null);
      },
    };
  }

  function updateCvSectionColumn(sectionKey, column) {
    applyCvCommand(`Basculer ${sectionKey} en colonne ${column}`, (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        sectionColumns: {
          ...(draft.settings?.sectionColumns ?? {}),
          [sectionKey]: column,
        },
      },
    }));
  }

  function adjustCvSpacing(delta) {
    applyCvCommand(delta > 0 ? "Augmenter l’espacement" : "Réduire l’espacement", (draft) => {
      const scale = clampNumber((draft.settings?.spacingScale ?? 1) + delta, 0.65, 1.5, 1);
      return {
        ...draft,
        settings: {
          ...draft.settings,
          spacingScale: scale,
          sectionSpacing: clampNumber((draft.settings?.sectionSpacing ?? 0.3) + delta * 0.25, 0.05, 0.8, 0.3),
          blockSpacing: clampNumber((draft.settings?.blockSpacing ?? 0.06) + delta * 0.08, 0, 0.35, 0.06),
        },
      };
    });
  }

  function toggleReduceCvDescriptions() {
    applyCvCommand("Réduire les descriptions longues", (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        reduceDescriptions: !draft.settings?.reduceDescriptions,
      },
    }));
  }

  function duplicateCvItem(sectionKey, itemId) {
    applyCvCommand(`Dupliquer un élément ${sectionKey}`, (draft) => {
      const list = draft[sectionKey] ?? [];
      const index = list.findIndex((item) => item.id === itemId);
      if (index < 0) return draft;
      const duplicated = {
        ...cloneDeep(list[index]),
        id: createCvId(sectionKey),
        title: list[index].title ? `${list[index].title} — copie` : list[index].title,
        label: list[index].label ? `${list[index].label} — copie` : list[index].label,
      };
      const nextList = [...list];
      nextList.splice(index + 1, 0, duplicated);
      return { ...draft, [sectionKey]: nextList.map((item, order) => ({ ...item, displayOrder: order + 1 })) };
    });
  }

  function removeCvItem(sectionKey, itemId) {
    applyCvCommand(`Supprimer un élément ${sectionKey}`, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).filter((item) => item.id !== itemId),
    }));
  }

  function addCvItem(sectionKey) {
    const factories = {
      experiences: () => ({ id: createCvId("experience"), enabled: true, title: "Nouvelle expérience", organization: "Organisation", location: "", summary: "Résumé court", description: "Description détaillée", startDate: "", endDate: "", currentPosition: false, skills: [], displayOrder: (cvDocument.experiences ?? []).length + 1 }),
      education: () => ({ id: createCvId("education"), enabled: true, title: "Nouvelle formation", organization: "Établissement", location: "", summary: "Résumé court", description: "Description détaillée", startDate: "", endDate: "", currentPosition: false, skills: [], schoolCode: "ECOLE", logoFilename: "school.png", logoDataUrl: "", logoMimeType: "image/png", logoSize: "1.15cm", officialUrl: "", officialLabel: "parcours officiel", programUrl: "", programLabel: "programme", displayOrder: (cvDocument.education ?? []).length + 1 }),
      projects: () => ({ id: createCvId("project"), enabled: true, title: "Nouveau projet", subtitle: "Stack / contexte", shortDescription: "Résumé court", description: "Description détaillée", stacks: [], features: [], githubUrl: "", documentationUrl: "", architectureUrl: "", displayOrder: (cvDocument.projects ?? []).length + 1 }),
      skills: () => ({ id: createCvId("skill"), enabled: true, label: "Nouvelle compétence" }),
      languages: () => ({ id: createCvId("language"), enabled: true, label: "Langue", level: "Niveau" }),
      qualities: () => ({ id: createCvId("quality"), enabled: true, label: "Qualité" }),
      contacts: () => ({ id: createCvId("contact"), enabled: true, type: "WEBSITE", label: "WEBSITE", value: "https://example.com" }),
    };

    const factory = factories[sectionKey];
    if (!factory) return;

    applyCvCommand(`Ajouter un élément ${sectionKey}`, (draft) => ({
      ...draft,
      [sectionKey]: [...(draft[sectionKey] ?? []), factory()],
    }));
  }

  function applyCvTargetPreset(preset) {
    applyCvCommand(`Adapter le CV : ${preset.label}`, (draft) => {
      const priority = new Set(preset.prioritySkills.map((skill) => skill.toLowerCase()));
      const orderedSkills = [...(draft.skills ?? [])].sort((left, right) => {
        const leftPriority = priority.has(String(left.label ?? "").toLowerCase()) ? 0 : 1;
        const rightPriority = priority.has(String(right.label ?? "").toLowerCase()) ? 0 : 1;
        return leftPriority - rightPriority;
      });

      return {
        ...draft,
        profile: {
          ...draft.profile,
          title: preset.title,
          headline: preset.headline,
        },
        settings: {
          ...draft.settings,
          density: "compact",
          projectLimit: 4,
          experienceLimit: 2,
          skillsLimit: 14,
          featuresLimit: 3,
        },
        skills: orderedSkills,
      };
    });
  }

  function compactCvOnOnePage() {
    applyCvCommand("Compacter le CV sur une page", (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        density: "compact",
        fontScale: 0.94,
        contentScale: 0.72,
        spacingScale: 0.78,
        itemSpacing: 1.15,
        sectionSpacing: 0.18,
        blockSpacing: 0.02,
        reduceDescriptions: true,
        projectLimit: 4,
        experienceLimit: 2,
        skillsLimit: 12,
        featuresLimit: 3,
        leftColumnWidth: 32,
      },
    }));
  }

  function generateLatexFromCvDocument() {
    const source = buildCvLatexFromDocument(cvDocument);
    setCvLatexSource(source);
    setCvManualLatexDirty(false);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvCompileSuccess(null);
    setCvPreviewUrl("");
    setMessage("Source LaTeX générée depuis l’éditeur visuel.");
    setError(null);
  }

  function createCvVariantSnapshot(name = cvVariantName) {
    const source = cvLatexSource || buildCvLatexFromDocument(cvDocument);
    const variant = {
      id: createCvId("variant"),
      name: normalizeCvString(name) || `Variante ${cvVariants.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      document: cloneDeep(cvDocument),
      latexSource: source,
      pdfUrl: cvPreviewUrl,
      qualityScore: buildLocalCvQualityReport(cvDocument, source).score,
    };
    const next = [variant, ...cvVariants].slice(0, 25);
    setCvVariants(next);
    setSelectedCvVariantId(variant.id);
    writeCvLocalList("variants", next);
    setMessage("Variante CV sauvegardée localement.");
  }

  function saveCurrentCvVariant() {
    if (!selectedCvVariantId) {
      createCvVariantSnapshot(cvVariantName);
      return;
    }
    const source = cvLatexSource || buildCvLatexFromDocument(cvDocument);
    const next = cvVariants.map((variant) => variant.id === selectedCvVariantId
      ? { ...variant, name: normalizeCvString(cvVariantName) || variant.name, updatedAt: new Date().toISOString(), document: cloneDeep(cvDocument), latexSource: source, pdfUrl: cvPreviewUrl, qualityScore: buildLocalCvQualityReport(cvDocument, source).score }
      : variant);
    setCvVariants(next);
    writeCvLocalList("variants", next);
    setMessage("Variante CV mise à jour.");
  }

  function loadCvVariant(variantId = selectedCvVariantId) {
    const variant = cvVariants.find((item) => item.id === variantId);
    if (!variant) return;
    const nextDocument = normalizeCvDocument(variant.document);
    setCvEditorState((current) => ({
      past: [...current.past.slice(-39), current.present],
      present: nextDocument,
      future: [],
      commandLog: [{ id: createCvId("cmd"), label: `Charger variante : ${variant.name}`, timestamp: new Date().toLocaleTimeString("fr-FR") }, ...current.commandLog].slice(0, 24),
    }));
    setCvVariantName(variant.name);
    setCvLatexSource(variant.latexSource || buildCvLatexFromDocument(nextDocument));
    setCvPreviewUrl(variant.pdfUrl || "");
    setCvManualLatexDirty(Boolean(variant.latexSource));
    setCvCompileSuccess(null);
    setMessage(`Variante chargée : ${variant.name}.`);
  }

  function deleteCvVariant(variantId = selectedCvVariantId) {
    const next = cvVariants.filter((variant) => variant.id !== variantId);
    setCvVariants(next);
    setSelectedCvVariantId(next[0]?.id ?? null);
    writeCvLocalList("variants", next);
    setMessage("Variante supprimée.");
  }

  function compareCvVariant(variantId = selectedCvVariantId) {
    const variant = cvVariants.find((item) => item.id === variantId);
    if (!variant) return;
    setCvDiffReport({ name: variant.name, changes: diffCvDocuments(variant.document, cvDocument) });
  }

  function saveCvCommandPreset() {
    const preset = {
      id: createCvId("preset"),
      name: normalizeCvString(cvPresetName) || `Preset ${cvCommandPresets.length + 1}`,
      createdAt: new Date().toISOString(),
      settings: cloneDeep(cvDocument.settings),
      sections: cloneDeep(cvDocument.sections),
    };
    const next = [preset, ...cvCommandPresets].slice(0, 20);
    setCvCommandPresets(next);
    writeCvLocalList("presets", next);
    setMessage("Preset de commandes sauvegardé.");
  }

  function applyCvCommandPreset(preset) {
    if (!preset) return;
    applyCvCommand(`Appliquer preset : ${preset.name}`, (draft) => ({
      ...draft,
      settings: { ...draft.settings, ...(preset.settings ?? {}) },
      sections: { ...draft.sections, ...(preset.sections ?? {}) },
    }));
  }

  function runCvQualityCheck() {
    const localReport = buildLocalCvQualityReport(cvDocument, cvLatexSource || buildCvLatexFromDocument(cvDocument));
    setCvQualityReport(localReport);
    setMessage(`Contrôle qualité terminé : score ${localReport.score}/100.`);
  }

  async function runBackendCvQualityCheck() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }
    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/quality`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );
      setCvQualityReport(data);
    }, "Contrôle qualité backend terminé.");
  }

  function analyzeCvOffer() {
    const analysis = buildOfferAnalysis(cvDocument, cvOfferText);
    setCvOfferAnalysis(analysis);
    setMessage(`Analyse d’offre terminée : pertinence ${analysis.score}%.`);
  }

  function applyOfferRecommendations() {
    const analysis = cvOfferAnalysis ?? buildOfferAnalysis(cvDocument, cvOfferText);
    const keywords = analysis.keywords ?? [];
    applyCvCommand("Adapter automatiquement à l’offre", (draft) => {
      const title = keywords.includes("spring boot") || keywords.includes("java")
        ? "Alternance Développeur Java Spring Boot"
        : keywords.includes("devops") || keywords.includes("docker")
          ? "Alternance Développeur Java / DevOps"
          : draft.profile.title;
      const orderedProjects = [...(draft.projects ?? [])].sort((left, right) => scoreCvItemForKeywords(right, keywords) - scoreCvItemForKeywords(left, keywords));
      const orderedExperiences = [...(draft.experiences ?? [])].sort((left, right) => scoreCvItemForKeywords(right, keywords) - scoreCvItemForKeywords(left, keywords));
      const orderedSkills = [...(draft.skills ?? [])].sort((left, right) => scoreCvItemForKeywords(right, keywords) - scoreCvItemForKeywords(left, keywords));
      return {
        ...draft,
        profile: {
          ...draft.profile,
          title,
          headline: keywords.length > 0
            ? `Recherche une alternance ciblée ${keywords.slice(0, 5).join(" · ")}, avec une approche orientée qualité, architecture et impact utilisateur.`
            : draft.profile.headline,
        },
        settings: { ...draft.settings, projectLimit: 4, experienceLimit: 2, featuresLimit: 3, reduceDescriptions: true },
        projects: orderedProjects.map((item, index) => ({ ...item, displayOrder: index + 1 })),
        experiences: orderedExperiences.map((item, index) => ({ ...item, displayOrder: index + 1 })),
        skills: orderedSkills,
      };
    });
  }

  async function exportCvReproducibleZip() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }
    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/export-zip`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );
      setCvExportZipUrl(normalizeGeneratedFileUrl(data?.zipUrl));
      setCvPreviewUrl(normalizeGeneratedFileUrl(data?.pdfUrl) || cvPreviewUrl);
      setCvCompileLogs(data?.logs ?? "");
      setCvCompileWarnings(data?.warnings ?? []);
      setCvCompileSuccess(Boolean(data?.success));
      if (!data?.zipUrl) throw new Error("Export ZIP non généré.");
    }, "Export ZIP reproductible généré.");
  }

  async function startAsyncCvPreview() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }
    await runAction(async () => {
      const job = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/compile-jobs`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );
      setCvAsyncJob(job);
      setCvCompileLogs(`${job?.status ?? "QUEUED"} — ${job?.message ?? "Compilation asynchrone lancée."}`);
      pollAsyncCvJob(job?.jobId);
    }, "Compilation asynchrone lancée.");
  }

  function pollAsyncCvJob(jobId) {
    if (!jobId || !selectedOwnerId || !selectedVersionId) return;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const status = await apiRequest("GET", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/compile-jobs/${jobId}`);
        setCvAsyncJob(status);
        setCvCompileLogs([status?.step, status?.logs].filter(Boolean).join("\n\n"));
        setCvCompileWarnings(status?.warnings ?? []);
        if (status?.latexSource) setCvLatexSource(status.latexSource);
        if (status?.pdfUrl) setCvPreviewUrl(normalizeGeneratedFileUrl(status.pdfUrl));
        if (["SUCCESS", "FAILED", "NOT_FOUND"].includes(status?.status) || attempts > 60) {
          setCvCompileSuccess(status?.status === "SUCCESS");
          window.clearInterval(timer);
        }
      } catch (err) {
        window.clearInterval(timer);
        setError(err?.message ?? "Suivi du job de compilation impossible.");
      }
    }, 1200);
  }

  async function smartCompactAndPreview() {
    applyCvCommand("Auto-compaction intelligente", (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        density: "compact",
        fontScale: Math.min(Number(draft.settings?.fontScale ?? 1), 0.94),
        contentScale: Math.min(Number(draft.settings?.contentScale ?? 0.74), 0.72),
        spacingScale: 0.7,
        sectionSpacing: 0.12,
        blockSpacing: 0,
        itemSpacing: 1,
        reduceDescriptions: true,
        projectLimit: 4,
        experienceLimit: 2,
        skillsLimit: 12,
        featuresLimit: 2,
      },
    }));
    setCvRegressionReport({ status: "READY", message: "Compaction appliquée. Lance une preview asynchrone pour vérifier le rendu PDF final." });
  }

  function updateTemplateLock(checked) {
    setCvTemplateLocked(checked);
    if (checked) {
      setCvLatexSource(buildCvLatexFromDocument(cvDocument));
      setCvManualLatexDirty(false);
    }
  }

  async function fetchOwners() {
    const data = await apiRequest("GET", "/manager");
    return Array.isArray(data) ? data : [];
  }

  async function fetchVersions(ownerId) {
    if (!ownerId) return [];
    const data = await apiRequest("GET", `/manager/${ownerId}/versions`);
    return Array.isArray(data) ? data : [];
  }

  async function fetchProjects(ownerId, versionId) {
    if (!ownerId || !versionId) return [];
    const data = await apiRequest(
      "GET",
      `/manager/${ownerId}/versions/${versionId}/projects`,
    );
    return Array.isArray(data) ? data : [];
  }

  async function runAction(action, successMessage) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await action();
      if (successMessage) setMessage(successMessage);
      return result;
    } catch (err) {
      if (isAuthRequiredError(err)) {
        setAuthStatus("login");
        return null;
      }

      setError(err?.message ?? "Une erreur est survenue.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function refreshOwners({ selectLast = false } = {}) {
    return runAction(async () => {
      const ownerList = await fetchOwners();
      setOwners(ownerList);

      const targetOwner = selectLast ? ownerList.at(-1) : ownerList[0];
      const targetOwnerId = getEntityId(targetOwner);

      setOwnerForm(hydrateOwnerForm(targetOwner));

      if (targetOwnerId) {
        setSelectedOwnerId(String(targetOwnerId));
        const versionList = await fetchVersions(targetOwnerId);
        setVersions(versionList);
        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
      }

      return ownerList;
    }, "Owners chargés.");
  }

  async function refreshVersions(ownerId = selectedOwnerId, preferredVersionId = null) {
    if (!ownerId) {
      setError("Sélectionne d’abord un profil.");
      return null;
    }

    return runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const preferredVersion = versionList.find(
        (version) => String(getEntityId(version)) === String(preferredVersionId),
      );
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(
        String(getEntityId(preferredVersion ?? activeVersion ?? firstVersion ?? {})),
        versionList,
      );
      return versionList;
    }, "Versions chargées.");
  }

  async function refreshProjects(preferredProjectId = null) {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return null;
    }

    return runAction(async () => {
      const projectList = await fetchProjects(selectedOwnerId, selectedVersionId);
      setProjects(projectList);
      setVersions((current) =>
        current.map((version) =>
          String(getEntityId(version)) === String(selectedVersionId)
            ? { ...version, projects: projectList }
            : version,
        ),
      );

      if (preferredProjectId) {
        const project = projectList.find(
          (item) => String(getProjectId(item)) === String(preferredProjectId),
        );
        if (project) selectProject(String(getProjectId(project)), projectList);
      } else {
        resetProjectForm(projectList);
      }

      return projectList;
    }, "Projets chargés.");
  }

  async function handleOwnerChange(ownerId) {
    const selectedOwner = owners.find((owner) => String(getEntityId(owner)) === String(ownerId));

    setSelectedOwnerId(ownerId);
    setOwnerForm(hydrateOwnerForm(selectedOwner));
    setSelectedVersionId(null);
    setSelectedProjectId(null);
    setVersions([]);
    setProjects([]);

    if (!ownerId) return;

    await runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
    }, "Versions du owner chargées.");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setAuthStatus("checking");
      setError(null);

      try {
        const ownerList = await fetchOwners();
        if (cancelled) return;

        const firstOwner = ownerList[0];
        const firstOwnerId = getEntityId(firstOwner);
        let versionList = [];

        if (firstOwnerId) {
          versionList = await fetchVersions(firstOwnerId);
        }

        if (cancelled) return;

        setOwners(ownerList);
        setOwnerForm(hydrateOwnerForm(firstOwner));
        setSelectedOwnerId(firstOwnerId ? String(firstOwnerId) : null);
        setVersions(versionList);

        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        const versionToSelect = activeVersion ?? firstVersion;

        if (versionToSelect) {
          setSelectedVersionId(String(getEntityId(versionToSelect)));
          hydrateVersionForms(versionToSelect, hydrateOwnerForm(firstOwner));
        }

        setAuthStatus("authenticated");
      } catch (err) {
        if (cancelled) return;

        if (isAuthRequiredError(err)) {
          setAuthStatus("login");
          return;
        }

        setAuthStatus("authenticated");
        setError(err?.message ?? "Impossible de charger les données admin.");
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
    // hydrateVersionForms must use the first payload from the initial admin bootstrap only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function applyNormalizedPortfolioData(normalized, { notify = true } = {}) {
    const normalizedExperiences = normalized.experiences;
    const normalizedProjects = normalized.projects;

    setOwnerForm((current) => ({
      ...current,
      ...normalized.ownerForm,
      contacts: normalized.ownerForm.contacts.length > 0
        ? normalized.ownerForm.contacts
        : [createEmptyContact()],
    }));
    setVersionForm((current) => ({ ...current, ...normalized.versionForm }));
    setProfileForm((current) => ({ ...current, ...normalized.profileForm }));
    setTimelineForm((current) => ({ ...current, ...normalized.timelineForm }));
    setExperiences(normalizedExperiences);
    setProjects(normalizedProjects);
    setExperienceForm({
      ...emptyExperienceForm,
      displayOrder: normalizedExperiences.length + 1,
    });
    setExperienceFiles(emptyExperienceFiles);
    setProjectMode("create");
    setSelectedProjectId(null);
    setProjectForm({
      ...emptyProjectForm,
      displayOrder: normalizedProjects.length + 1,
    });
    setProjectFiles(emptyProjectFiles);
    setProfileFiles(emptyProfileFiles);
    setJsonImportSummary(normalized.summary);
    resetCvEditorFromData({
      owner: normalized.ownerForm,
      profile: normalized.profileForm,
      experiences: normalizedExperiences,
      projects: normalizedProjects,
      label: "CV synchronisé avec l’import JSON",
    });

    if (notify) {
      setMessage(
        `JSON importé dans le formulaire : ${normalized.summary.experiences} expérience(s), ${normalized.summary.projects} projet(s), ${normalized.summary.contacts} contact(s).`,
      );
    }

    setError(null);
  }

  function applyImportedPortfolioData(rawPayload) {
    const normalized = normalizeAdminPortfolioJson(rawPayload);
    applyNormalizedPortfolioData(normalized);
  }

  async function importJsonFromFile() {
    if (!jsonImportFile) {
      setError("Sélectionne d’abord un fichier JSON.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const content = await jsonImportFile.text();
      const parsedPayload = JSON.parse(content);
      applyImportedPortfolioData(parsedPayload);
      setJsonImportFile(null);
    } catch (err) {
      setError(err?.message ?? "Import JSON impossible.");
    } finally {
      setLoading(false);
    }
  }

  function importJsonFromText() {
    if (!jsonImportText.trim()) {
      setError("Colle un JSON ou sélectionne un fichier JSON.");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const parsedPayload = JSON.parse(jsonImportText);
      applyImportedPortfolioData(parsedPayload);
    } catch (err) {
      setError(err?.message ?? "Le JSON collé est invalide.");
    }
  }

  function buildOwnerIdentityPayloadFromData(form) {
    return {
      name: form.name,
      firstName: form.firstName,
      age: Number(form.age),
      active: form.active,
      address: form.address,
      contacts: sanitizeContactRows(form.contacts),
      versionTag: null,
      versionLabel: null,
      versionDescription: null,
      versionPublished: null,
      prof: null,
      timeline: null,
      projects: null,
    };
  }

  function buildProfilePayloadFromData(form) {
    return {
      title: form.title,
      subtitle: form.subtitle,
      headline: form.headline,
      shortDescription: form.shortDescription,
      description: form.description,
      location: form.location,
      availability: form.availability,
      profileImageUrl: nullIfBlank(form.profileImageUrl),
      logoUrl: nullIfBlank(form.logoUrl),
      cvUrl: nullIfBlank(form.cvUrl),
      portfolioUrl: nullIfBlank(form.portfolioUrl),
    };
  }

  function normalizeCurrentExperienceForExport(experience, index) {
    const currentPosition = Boolean(experience.currentPosition);

    return {
      category: experience.category ?? "SCHOOL",
      title: experience.title ?? "",
      organization: experience.organization ?? "",
      location: experience.location ?? "",
      summary: experience.summary ?? "",
      description: experience.description ?? "",
      startDate: normalizeDate(experience.startDate),
      endDate: currentPosition ? null : normalizeDate(experience.endDate) || null,
      currentPosition,
      imageUrl: experience.imageUrl ?? "",
      websiteUrl: experience.websiteUrl ?? "",
      skills: toArray(experience.skills),
      displayOrder: Number(experience.displayOrder ?? index + 1),
    };
  }

  function normalizeCurrentProjectForExport(project, index) {
    const githubUrl = project.githubUrl ?? "";
    const architectureUrl = getProjectArchitectureUrl(project);
    const documentationUrl = project.documentationUrl ?? "";

    return {
      title: project.title ?? "",
      subtitle: project.subtitle ?? "",
      shortDescription: project.shortDescription ?? "",
      description: project.description ?? "",
      status: project.status ?? "IN_PROGRESS",
      startDate: normalizeDate(project.startDate),
      endDate: normalizeDate(project.endDate) || null,
      imageUrl: project.imageUrl ?? "",
      demoUrl: project.demoUrl ?? "",
      githubUrl,
      architectureUrl,
      documentationUrl,
      stacks: toArray(project.stacks),
      features: toArray(project.features),
      links: [
        { type: "GITHUB", label: "GitHub", url: githubUrl },
        { type: "ARCHITECTURE", label: "Architecture", url: architectureUrl },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => nullIfBlank(link.url)),
      featured: Boolean(project.featured),
      published: project.published !== false,
      displayOrder: Number(project.displayOrder ?? index + 1),
      websiteVersionId: null,
    };
  }

  function buildCurrentVersionJsonPayload() {
    return {
      name: ownerForm.name,
      firstName: ownerForm.firstName,
      age: Number(ownerForm.age),
      active: ownerForm.active,
      address: ownerForm.address,
      contacts: sanitizeContactRows(ownerForm.contacts),
      versionTag: versionForm.versionTag,
      versionLabel: versionForm.label,
      versionDescription: versionForm.description,
      versionPublished: versionForm.published,
      versionActive: versionForm.active,
      prof: {
        ...profileForm,
        profileImageUrl: profileForm.profileImageUrl ?? "",
        logoUrl: profileForm.logoUrl ?? "",
        cvUrl: profileForm.cvUrl ?? "",
      },
      timeline: {
        ...timelineForm,
        experiences: experiences.map(normalizeCurrentExperienceForExport),
      },
      projects: projects.map(normalizeCurrentProjectForExport),
    };
  }

  function formatJsonPayload(payload) {
    return JSON.stringify(payload, null, 2);
  }

  function createJsonFilename(payload) {
    const ownerSlug = [payload.firstName, payload.name]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "portfolio";
    const versionSlug = String(payload.versionTag ?? "version")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "version";

    return `${ownerSlug}-${versionSlug}.json`;
  }

  function downloadJsonPayload(payload) {
    const blob = new Blob([`${formatJsonPayload(payload)}\n`], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = createJsonFilename(payload);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCurrentVersionJson() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    downloadJsonPayload(buildCurrentVersionJsonPayload());
    setMessage("Version courante téléchargée en JSON.");
    setError(null);
  }

  async function runPortfolioHealthCheck() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    const report = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/health`),
      "Contrôle santé exécuté.",
    );
    if (report) setPortfolioHealthReport(report);
  }

  async function validatePortfolioBeforePublish() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return null;
    }

    const report = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publish-validation`),
      "Validation avant publication exécutée.",
    );
    if (report) setPublishValidationReport(report);
    return report;
  }

  async function activateVersionWithValidation(versionId = selectedVersionId) {
    if (!selectedOwnerId || !versionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    const report = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/versions/${versionId}/publish-validation`),
    );
    if (!report) return;

    setPublishValidationReport(report);
    if (!report.publishable) {
      setError("Publication bloquée : corrige les erreurs critiques avant activation.");
      return;
    }

    await runAction(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/versions/${versionId}/activate-validated`);
      await refreshVersions(selectedOwnerId, versionId);
    }, "Version validée puis activée.");
  }

  async function exportPortfolioBackupZip() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    const backup = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/backup/export`),
      "Backup portfolio généré.",
    );
    if (!backup) return;

    setPortfolioBackupUrl(backup.url ?? "");
    setPortfolioBackupJson(backup.json ?? "");
    if (backup.json) {
      downloadTextFile("portfolio-backup.json", `${backup.json}\n`, "application/json;charset=utf-8");
    }
  }

  async function restorePortfolioBackup() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return;
    }
    if (!portfolioRestoreText.trim()) {
      setError("Colle le contenu portfolio.json du backup avant restauration.");
      return;
    }

    const restored = await runAction(async () => {
      const response = await apiRequest("POST", `/manager/${selectedOwnerId}/versions/backup/restore`, {
        backupJson: portfolioRestoreText,
        restoreLabel: portfolioRestoreLabel,
        active: false,
      });
      await refreshVersions(selectedOwnerId, String(getEntityId(response)));
      return response;
    }, "Backup restauré dans une nouvelle version inactive.");

    if (restored) {
      setPortfolioRestoreText("");
    }
  }

  function hydrateApplicationForm(application) {
    if (!application) {
      return {
        ...emptyApplicationForm,
        versionId: selectedVersionId ?? "",
        cvUrl: profileForm.cvUrl ?? "",
        cvVariantName: cvVariantName ?? "",
      };
    }

    return {
      versionId: application.versionId ? String(application.versionId) : selectedVersionId ?? "",
      companyName: application.companyName ?? "",
      roleTitle: application.roleTitle ?? "",
      location: application.location ?? "",
      offerUrl: application.offerUrl ?? "",
      offerText: application.offerText ?? "",
      status: application.status ?? "DRAFT",
      targetProfile: application.targetProfile ?? "",
      cvVariantName: application.cvVariantName ?? "",
      cvUrl: application.cvUrl ?? "",
      coverLetterUrl: application.coverLetterUrl ?? "",
      mailDraft: application.mailDraft ?? "",
      coverLetterSource: application.coverLetterSource ?? "",
      notes: application.notes ?? "",
      appliedAt: application.appliedAt ?? "",
      followUpAt: application.followUpAt ?? "",
    };
  }

  function resetApplicationForm() {
    setSelectedApplicationId(null);
    setApplicationForm(hydrateApplicationForm(null));
    setOfferAnalysis(null);
    setCoverLetterPreviewUrl("");
    setCoverLetterLogs("");
    setCoverLetterWarnings([]);
    setApplicationZipUrl("");
  }

  function selectApplication(application) {
    setSelectedApplicationId(application?.id ? String(application.id) : null);
    setApplicationForm(hydrateApplicationForm(application));
    setOfferAnalysis(application ? {
      score: application.relevanceScore ?? 0,
      targetProfile: application.targetProfile ?? "",
      matchedKeywords: application.matchedKeywords ?? [],
      missingKeywords: application.missingKeywords ?? [],
      recommendations: application.recommendations ?? [],
      commands: [],
      summary: `${application.companyName ?? "Entreprise"} — ${application.roleTitle ?? "Poste"}`,
    } : null);
    setCoverLetterPreviewUrl(application?.coverLetterUrl ?? "");
    setCoverLetterLogs("");
    setCoverLetterWarnings([]);
    setApplicationZipUrl(application?.applicationZipUrl ?? "");
  }

  function updateApplicationForm(field, value) {
    setApplicationForm((current) => ({ ...current, [field]: value }));
  }

  async function loadApplications(ownerId = selectedOwnerId) {
    if (!ownerId) return;
    const payload = await runAction(async () => {
      const [items, dashboard] = await Promise.all([
        apiRequest("GET", `/manager/${ownerId}/applications`),
        apiRequest("GET", `/manager/${ownerId}/applications/dashboard`),
      ]);
      return { items, dashboard };
    }, "Candidatures chargées.");
    if (!payload) return;
    setApplications(payload.items ?? []);
    setApplicationsDashboard(payload.dashboard ?? null);
    if (payload.items?.length && !selectedApplicationId) {
      selectApplication(payload.items[0]);
    }
  }

  function buildApplicationPayload() {
    return {
      ...applicationForm,
      versionId: applicationForm.versionId ? Number(applicationForm.versionId) : selectedVersionId ? Number(selectedVersionId) : null,
      status: applicationForm.status || "DRAFT",
      cvUrl: applicationForm.cvUrl || profileForm.cvUrl || "",
      cvVariantName: applicationForm.cvVariantName || cvVariantName || "CV courant",
      appliedAt: applicationForm.appliedAt || null,
      followUpAt: applicationForm.followUpAt || null,
    };
  }

  async function analyzeCurrentOffer() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return null;
    }
    if (!applicationForm.offerText.trim()) {
      setError("Colle une offre avant analyse.");
      return null;
    }

    const analysis = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/analyze-offer`, {
        offerText: applicationForm.offerText,
        roleTitle: applicationForm.roleTitle,
        companyName: applicationForm.companyName,
        portfolioSkills: (cvDocument.skills ?? []).map((skill) => skill.label).filter(Boolean),
        projectTitles: (cvDocument.projects ?? []).map((project) => project.title).filter(Boolean),
      }),
      "Offre analysée.",
    );
    if (analysis) {
      setOfferAnalysis(analysis);
      if (!applicationForm.targetProfile && analysis.targetProfile) {
        updateApplicationForm("targetProfile", analysis.targetProfile);
      }
    }
    return analysis;
  }

  async function saveApplication() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return;
    }
    if (!applicationForm.companyName.trim() || !applicationForm.roleTitle.trim()) {
      setError("Entreprise et poste sont obligatoires pour enregistrer la candidature.");
      return;
    }

    const saved = await runAction(async () => {
      const payload = buildApplicationPayload();
      if (selectedApplicationId) {
        return apiRequest("PUT", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}`, payload);
      }
      return apiRequest("POST", `/manager/${selectedOwnerId}/applications`, payload);
    }, selectedApplicationId ? "Candidature mise à jour." : "Candidature créée.");

    if (saved) {
      await loadApplications(selectedOwnerId);
      selectApplication(saved);
    }
  }

  async function deleteApplication() {
    if (!selectedOwnerId || !selectedApplicationId) return;
    await runAction(async () => {
      await apiRequest("DELETE", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}`);
      return null;
    }, "Candidature supprimée.");
    resetApplicationForm();
    await loadApplications(selectedOwnerId);
  }

  async function markApplicationStatus(status) {
    if (!selectedOwnerId || !selectedApplicationId) return;
    const updated = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/status/${status}`),
      "Statut candidature mis à jour.",
    );
    if (updated) {
      await loadApplications(selectedOwnerId);
      selectApplication(updated);
    }
  }

  function buildCoverLetterPayload() {
    return {
      versionId: applicationForm.versionId ? Number(applicationForm.versionId) : selectedVersionId ? Number(selectedVersionId) : null,
      latexSourceOverride: applicationForm.coverLetterSource || null,
      motivationTextOverride: "",
      templateId: "cover-letter-clean",
      assets: [],
    };
  }

  async function previewCoverLetter() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant de générer la lettre.");
      return;
    }
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/cover-letter/preview`, buildCoverLetterPayload()),
      "Lettre de motivation prévisualisée.",
    );
    if (response) {
      setCoverLetterPreviewUrl(response.pdfUrl ?? "");
      setCoverLetterLogs(response.logs ?? "");
      setCoverLetterWarnings(response.warnings ?? []);
      if (response.latexSource) updateApplicationForm("coverLetterSource", response.latexSource);
    }
  }

  async function saveCoverLetter() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant de sauvegarder la lettre.");
      return;
    }
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/cover-letter/save`, buildCoverLetterPayload()),
      "Lettre PDF sauvegardée.",
    );
    if (response) {
      setCoverLetterPreviewUrl(response.pdfUrl ?? "");
      setCoverLetterLogs(response.logs ?? "");
      setCoverLetterWarnings(response.warnings ?? []);
      await loadApplications(selectedOwnerId);
    }
  }

  async function exportApplicationPackage() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant d’exporter le ZIP.");
      return;
    }
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/export-zip`, buildCoverLetterPayload()),
      "Package candidature exporté.",
    );
    if (response) {
      setApplicationZipUrl(response.zipUrl ?? "");
      setCoverLetterPreviewUrl(response.pdfUrl ?? coverLetterPreviewUrl);
      setCoverLetterLogs(response.logs ?? "");
      setCoverLetterWarnings(response.warnings ?? []);
      await loadApplications(selectedOwnerId);
    }
  }

  function applyOfferCommandsToCv() {
    if (!offerAnalysis?.commands?.length) return;
    applyCvCommand("Adapter le CV à l’offre analysée", (draft) => {
      const next = cloneDeep(draft);
      for (const command of offerAnalysis.commands) {
        if (command.type === "SET_TITLE") next.profile.title = command.value;
        if (command.type === "LIMIT_EXPERIENCES") next.settings.experienceLimit = Number(command.value) || 2;
        if (command.type === "LIMIT_PROJECTS") next.settings.projectLimit = Number(command.value) || 4;
        if (command.type === "SET_DENSITY") next.settings.density = command.value || "compact";
      }
      return next;
    });
  }

  function renderApplicationsDashboard() {
    if (!applicationsDashboard) {
      return <Alert color="gray" variant="light">Aucune donnée de suivi chargée.</Alert>;
    }
    return (
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">Total</Text><Text fw={900} size="xl">{applicationsDashboard.total}</Text></Paper>
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">À préparer</Text><Text fw={900} size="xl">{applicationsDashboard.toPrepare}</Text></Paper>
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">Relances</Text><Text fw={900} size="xl">{applicationsDashboard.followUp}</Text></Paper>
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">Score moyen</Text><Text fw={900} size="xl">{applicationsDashboard.averageScore ?? 0}/100</Text></Paper>
      </SimpleGrid>
    );
  }

  function renderOfferAnalysis() {
    if (!offerAnalysis) {
      return <Alert color="gray" variant="light">Analyse une offre pour obtenir le score, les mots-clés et les commandes CV proposées.</Alert>;
    }
    const scoreColor = offerAnalysis.score >= 75 ? "green" : offerAnalysis.score >= 50 ? "yellow" : "red";
    return (
      <Stack gap="sm">
        <Group justify="space-between"><Badge color={scoreColor} size="lg">Score {offerAnalysis.score}/100</Badge><Badge variant="light">{offerAnalysis.targetProfile}</Badge></Group>
        <Text size="sm" c="dimmed">{offerAnalysis.summary}</Text>
        <Group gap="xs">{(offerAnalysis.matchedKeywords ?? []).map((keyword) => <Badge key={keyword} color="green" variant="light">{keyword}</Badge>)}</Group>
        {(offerAnalysis.missingKeywords ?? []).length > 0 && <Group gap="xs">{offerAnalysis.missingKeywords.map((keyword) => <Badge key={keyword} color="orange" variant="light">manque : {keyword}</Badge>)}</Group>}
        <Stack gap={4}>{(offerAnalysis.recommendations ?? []).map((item) => <Text key={item} size="sm">— {item}</Text>)}</Stack>
        <Button variant="light" onClick={applyOfferCommandsToCv}>Appliquer les commandes au CV Studio</Button>
      </Stack>
    );
  }

  function renderPortfolioHealthReport(report) {
    if (!report) {
      return <Alert color="gray" variant="light">Aucun rapport lancé pour cette version.</Alert>;
    }

    const scoreColor = report.score >= 85 ? "green" : report.score >= 65 ? "yellow" : "red";
    return (
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge color={scoreColor} size="lg">Score {report.score}/100</Badge>
            <Badge color={report.publishable ? "green" : "red"} variant="light">
              {report.publishable ? "publiable" : "bloqué"}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {report.blockersCount ?? 0} bloquant(s) · {report.warningsCount ?? 0} alerte(s) · {report.suggestionsCount ?? 0} suggestion(s)
          </Text>
        </Group>
        <Stack gap="xs">
          {(report.checks ?? []).map((check) => {
            const failed = check.status === "FAIL";
            const color = !failed ? "green" : check.severity === "BLOCKER" ? "red" : check.severity === "WARNING" ? "yellow" : "blue";
            return (
              <Alert key={check.id} color={color} variant="light" className="admin-health-check">
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div>
                    <Text fw={800}>{check.label}</Text>
                    <Text size="sm">{check.message}</Text>
                  </div>
                  <Badge color={color} variant="filled">{failed ? check.severity : "OK"}</Badge>
                </Group>
              </Alert>
            );
          })}
        </Stack>
      </Stack>
    );
  }

  function handleJsonEditorTextChange(value) {
    setJsonEditorText(value);
    setJsonEditorError(null);
  }

  function openCurrentVersionJsonEditor() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    setJsonEditorText(formatJsonPayload(buildCurrentVersionJsonPayload()));
    setJsonEditorError(null);
    setJsonEditorOpened(true);
  }

  function formatJsonEditorText() {
    try {
      const parsedPayload = JSON.parse(jsonEditorText);
      setJsonEditorText(formatJsonPayload(parsedPayload));
      setJsonEditorError(null);
    } catch (err) {
      const location = getJsonSyntaxLocation(err, jsonEditorText);
      setJsonEditorError(
        location.line && location.column
          ? `Formatage impossible : erreur ligne ${location.line}, colonne ${location.column}.`
          : err?.message ?? "JSON invalide.",
      );
    }
  }

  function downloadJsonEditorText() {
    try {
      const parsedPayload = JSON.parse(jsonEditorText);
      downloadJsonPayload(parsedPayload);
      setJsonEditorError(null);
    } catch (err) {
      const location = getJsonSyntaxLocation(err, jsonEditorText);
      setJsonEditorError(
        location.line && location.column
          ? `Téléchargement impossible : erreur ligne ${location.line}, colonne ${location.column}.`
          : err?.message ?? "JSON invalide.",
      );
    }
  }

  function buildProjectPayloadFromJsonProject(project) {
    const architectureUrl = nullIfBlank(project.architectureUrl ?? getProjectArchitectureUrl(project));
    const documentationUrl = nullIfBlank(project.documentationUrl);
    const githubUrl = nullIfBlank(project.githubUrl);

    return {
      title: project.title,
      subtitle: project.subtitle,
      shortDescription: project.shortDescription,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate || null,
      imageUrl: nullIfBlank(project.imageUrl),
      demoUrl: nullIfBlank(project.demoUrl),
      githubUrl,
      documentationUrl,
      architectureUrl,
      stacks: toArray(project.stacks),
      features: toArray(project.features),
      links: [
        { type: "GITHUB", label: "GitHub", url: githubUrl },
        { type: "ARCHITECTURE", label: "Architecture", url: architectureUrl },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => link.url),
      featured: project.featured,
      published: project.published,
      displayOrder: Number(project.displayOrder),
      websiteVersionId: selectedVersionId ? Number(selectedVersionId) : null,
    };
  }

  async function saveJsonEditorToCurrentVersion() {
    if (!selectedOwnerId || !selectedVersionId) {
      setJsonEditorError("Sélectionne d’abord un owner et une version.");
      return;
    }

    let parsedPayload;
    let normalized;

    try {
      parsedPayload = JSON.parse(jsonEditorText);
      normalized = normalizeAdminPortfolioJson(parsedPayload);
    } catch (err) {
      const location = getJsonSyntaxLocation(err, jsonEditorText);
      setJsonEditorError(
        location.line && location.column
          ? `Mise à jour impossible : erreur ligne ${location.line}, colonne ${location.column}.`
          : err?.message ?? "JSON invalide.",
      );
      return;
    }

    setJsonEditorError(null);

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}`,
        buildOwnerIdentityPayloadFromData(normalized.ownerForm),
      );

      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}`,
        normalized.versionForm,
      );

      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/profile`,
        buildProfilePayloadFromData(normalized.profileForm),
      );

      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/timeline`,
        {
          ...normalized.timelineForm,
          experiences: normalized.experiences,
        },
      );

      const projectIdsToDelete = projects
        .map(getProjectId)
        .filter((projectId) => projectId !== null && projectId !== undefined);

      for (const projectId of projectIdsToDelete) {
        await apiRequest(
          "DELETE",
          `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects/${projectId}`,
        );
      }

      for (const project of normalized.projects) {
        await apiRequest(
          "POST",
          `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects`,
          buildProjectPayloadFromJsonProject(project),
        );
      }

      applyNormalizedPortfolioData(normalized, { notify: false });
      setJsonEditorText(formatJsonPayload(parsedPayload));
      setJsonEditorOpened(false);

      const ownerList = await fetchOwners();
      const versionList = await fetchVersions(selectedOwnerId);

      setOwners(ownerList);
      setVersions(versionList);
      selectVersion(selectedVersionId, versionList);
    }, "Version mise à jour depuis l’éditeur JSON.");
  }

  function buildCvGenerationPayload({ includeLatexOverride = true } = {}) {
    const settings = cvDocument.settings ?? createEmptyCvDocument().settings;

    return {
      templateId: settings.templateId,
      language: settings.language,
      theme: {
        primaryColor: settings.primaryColor,
        density: settings.density,
        showPhoto: settings.showPhoto,
        headline: nullIfBlank(cvDocument.profile?.headline),
      },
      sections: {
        profile: Boolean(cvDocument.sections?.profile),
        skills: Boolean(cvDocument.sections?.skills),
        experiences: Boolean(cvDocument.sections?.experiences),
        education: Boolean(cvDocument.sections?.education),
        projects: Boolean(cvDocument.sections?.projects),
        qualities: Boolean(cvDocument.sections?.qualities),
        languages: Boolean(cvDocument.sections?.languages),
      },
      projectLimit: Number(settings.projectLimit || 4),
      experienceLimit: Number(settings.experienceLimit || 2),
      latexSourceOverride: includeLatexOverride ? nullIfBlank(cvLatexSource || buildCvLatexFromDocument(cvDocument)) : null,
      assets: buildCvAssetsPayload(cvDocument),
    };
  }

  async function generateCvLatexSource() {
    const source = buildCvLatexFromDocument(cvDocument);
    setCvLatexSource(source);
    setCvManualLatexDirty(false);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvCompileSuccess(null);
    setCvPreviewUrl("");
    setMessage("Source LaTeX recalculée depuis le modèle CV fait à la main.");
    setError(null);
  }

  async function previewGeneratedCv() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/preview`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );

      setCvLatexSource(data?.latexSource ?? cvLatexSource);
      setCvPreviewUrl(normalizeGeneratedFileUrl(data?.pdfUrl));
      setCvCompileLogs(data?.logs ?? "");
      setCvCompileWarnings(data?.warnings ?? []);
      setCvCompileSuccess(Boolean(data?.success));

      if (!data?.success) {
        throw new Error("Compilation LaTeX échouée. Consulte les logs dans l’onglet CV Builder.");
      }
    }, "Preview PDF générée.");
  }

  async function saveGeneratedCvToVersion() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/save`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );

      setCvLatexSource(data?.latexSource ?? cvLatexSource);
      setCvPreviewUrl(normalizeGeneratedFileUrl(data?.pdfUrl));
      setCvCompileLogs(data?.logs ?? "");
      setCvCompileWarnings(data?.warnings ?? []);
      setCvCompileSuccess(Boolean(data?.success));

      if (!data?.success) {
        throw new Error("Sauvegarde impossible : la compilation LaTeX a échoué.");
      }

      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "CV généré et enregistré dans la version actuelle.");
  }

  async function buildProfilePayload() {
    const uploadedProfileImageUrl = await uploadFile(profileFiles.profileImage);
    const uploadedLogoUrl = await uploadFile(profileFiles.logo);
    const uploadedCvUrl = await uploadFile(profileFiles.cv);

    return {
      ...profileForm,
      profileImageUrl: nullIfBlank(uploadedProfileImageUrl ?? profileForm.profileImageUrl),
      logoUrl: nullIfBlank(uploadedLogoUrl ?? profileForm.logoUrl),
      cvUrl: nullIfBlank(uploadedCvUrl ?? profileForm.cvUrl),
      portfolioUrl: nullIfBlank(profileForm.portfolioUrl),
    };
  }

  async function buildOwnerPayload() {
    const profilePayload = await buildProfilePayload();

    return {
      name: ownerForm.name,
      firstName: ownerForm.firstName,
      age: Number(ownerForm.age),
      active: ownerForm.active,
      address: ownerForm.address,
      contacts: sanitizeContactRows(ownerForm.contacts),
      versionTag: ownerForm.versionTag,
      versionLabel: ownerForm.versionLabel,
      versionDescription: ownerForm.versionDescription,
      versionPublished: ownerForm.versionPublished,
      prof: profilePayload,
      timeline: {
        ...timelineForm,
        experiences,
      },
      projects,
    };
  }

  function buildOwnerIdentityPayload() {
    return {
      name: ownerForm.name,
      firstName: ownerForm.firstName,
      age: Number(ownerForm.age),
      active: ownerForm.active,
      address: ownerForm.address,
      contacts: sanitizeContactRows(ownerForm.contacts),
      versionTag: null,
      versionLabel: null,
      versionDescription: null,
      versionPublished: null,
      prof: null,
      timeline: null,
      projects: null,
    };
  }

  async function buildVersionPayload({ includeContent = true } = {}) {
    const profilePayload = includeContent ? await buildProfilePayload() : null;

    return {
      versionTag: versionForm.versionTag,
      label: versionForm.label,
      description: versionForm.description,
      active: versionForm.active,
      published: versionForm.published,
      prof: includeContent ? profilePayload : null,
      timeline: includeContent
        ? {
            ...timelineForm,
            experiences,
          }
        : null,
      projects: includeContent ? projects : null,
    };
  }

  async function buildExperiencePayload() {
    const uploadedImageUrl = await uploadFile(experienceFiles.image);

    return {
      category: experienceForm.category,
      title: experienceForm.title,
      organization: experienceForm.organization,
      location: experienceForm.location,
      summary: experienceForm.summary,
      description: experienceForm.description,
      startDate: experienceForm.startDate,
      endDate: experienceForm.currentPosition ? null : experienceForm.endDate || null,
      currentPosition: experienceForm.currentPosition,
      imageUrl: nullIfBlank(uploadedImageUrl ?? experienceForm.imageUrl),
      websiteUrl: nullIfBlank(experienceForm.websiteUrl),
      skills: toArray(experienceForm.skills),
      displayOrder: Number(experienceForm.displayOrder),
    };
  }

  async function buildProjectPayload() {
    const uploadedImageUrl = await uploadFile(projectFiles.image);
    const uploadedDocumentationUrl = await uploadFile(projectFiles.documentation);

    const documentationUrl = nullIfBlank(
      uploadedDocumentationUrl ?? projectForm.documentationUrl,
    );
    const architectureUrl = nullIfBlank(projectForm.architectureUrl);

    return {
      title: projectForm.title,
      subtitle: projectForm.subtitle,
      shortDescription: projectForm.shortDescription,
      description: projectForm.description,
      status: projectForm.status,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate || null,
      imageUrl: nullIfBlank(uploadedImageUrl ?? projectForm.imageUrl),
      demoUrl: nullIfBlank(projectForm.demoUrl),
      githubUrl: nullIfBlank(projectForm.githubUrl),
      documentationUrl,
      stacks: toArray(projectForm.stacks),
      features: toArray(projectForm.features),
      links: [
        { type: "GITHUB", label: "GitHub", url: nullIfBlank(projectForm.githubUrl) },
        { type: "ARCHITECTURE", label: "Architecture", url: architectureUrl },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => link.url),
      featured: projectForm.featured,
      published: projectForm.published,
      displayOrder: Number(projectForm.displayOrder),
      websiteVersionId: selectedVersionId ? Number(selectedVersionId) : null,
    };
  }

  async function createOwner() {
    await runAction(async () => {
      const payload = await buildOwnerPayload();
      await apiRequest("POST", "/manager", payload);
      await refreshOwners({ selectLast: true });
    }, "Owner créé avec sa première version.");
  }

  async function updateOwner() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un profil.");
      return;
    }

    await runAction(async () => {
      const payload = buildOwnerIdentityPayload();
      await apiRequest("PUT", `/manager/${selectedOwnerId}`, payload);

      const ownerList = await fetchOwners();
      const updatedOwner = ownerList.find(
        (owner) => String(getEntityId(owner)) === String(selectedOwnerId),
      );

      setOwners(ownerList);
      setOwnerForm(hydrateOwnerForm(updatedOwner));
    }, "Identité et contacts enregistrés.");
  }

  async function createVersion() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un profil.");
      return;
    }

    await runAction(async () => {
      const payload = await buildVersionPayload({ includeContent: true });
      const createdVersion = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions`,
        payload,
      );
      await refreshVersions(selectedOwnerId, getEntityId(createdVersion));
    }, "Version créée avec le contenu du formulaire.");
  }

  async function cloneVersion() {
    if (!selectedOwnerId || !cloneSourceVersionId) {
      setError("Sélectionne un owner et une version source à importer.");
      return;
    }

    await runAction(async () => {
      const payload = await buildVersionPayload({ includeContent: false });
      const createdVersion = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/from/${cloneSourceVersionId}`,
        payload,
      );
      await refreshVersions(selectedOwnerId, getEntityId(createdVersion));
    }, "Nouvelle version créée en important le contenu de la version source.");
  }

  async function updateVersionMetadata() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}`,
        versionForm,
      );
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Métadonnées de version mises à jour.");
  }

  async function activateVersion(versionId = selectedVersionId) {
    if (!selectedOwnerId || !versionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${versionId}/activate`,
      );
      await refreshVersions(selectedOwnerId, versionId);
    }, "Version activée.");
  }

  async function deleteVersion(versionId = selectedVersionId) {
    if (!selectedOwnerId || !versionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "DELETE",
        `/manager/${selectedOwnerId}/versions/${versionId}`,
      );
      await refreshVersions(selectedOwnerId);
    }, "Version supprimée.");
  }

  async function saveProfile() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      const payload = await buildProfilePayload();
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/profile`,
        payload,
      );
      setProfileForm(payload);
      setProfileFiles(emptyProfileFiles);
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Profil enregistré avec les fichiers uploadés.");
  }

  async function saveTimeline() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/timeline`,
        {
          ...timelineForm,
          experiences,
        },
      );
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Timeline enregistrée.");
  }

  async function addProject() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      const payload = await buildProjectPayload();
      await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects`,
        payload,
      );
      setProjectFiles(emptyProjectFiles);
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Projet ajouté à la version.");
  }

  async function updateProject() {
    if (!selectedOwnerId || !selectedVersionId || !selectedProjectId) {
      setError("Sélectionne un owner, une version et un projet à modifier.");
      return;
    }

    await runAction(async () => {
      const payload = await buildProjectPayload();
      const updatedProject = await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects/${selectedProjectId}`,
        payload,
      );
      setProjectFiles(emptyProjectFiles);
      await refreshVersions(selectedOwnerId, selectedVersionId);
      setSelectedProjectId(String(getProjectId(updatedProject)));
      setProjectForm(hydrateProjectForm(updatedProject));
      setProjectMode("edit");
    }, "Projet mis à jour.");
  }

  async function deleteProject() {
    if (!selectedOwnerId || !selectedVersionId || !selectedProjectId) {
      setError("Sélectionne un projet à supprimer.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "DELETE",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects/${selectedProjectId}`,
      );
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Projet supprimé de la version.");
  }

  async function addExperienceLocally() {
    await runAction(async () => {
      const payload = await buildExperiencePayload();
      setExperiences((current) => [...current, payload]);
      setExperienceForm((current) => ({
        ...emptyExperienceForm,
        displayOrder: Number(current.displayOrder) + 1,
      }));
      setExperienceFiles(emptyExperienceFiles);
    }, "Expérience ajoutée localement. Pense à enregistrer la timeline.");
  }

  function removeExperience(indexToRemove) {
    setExperiences((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  }

  function resetAdminState() {
    setOwners([]);
    setVersions([]);
    setProjects([]);
    setSelectedOwnerId(null);
    setSelectedVersionId(null);
    setSelectedProjectId(null);
    setCloneSourceVersionId(null);
    setOwnerForm(hydrateOwnerForm(null));
    setExperiences([]);
    resetProjectForm([]);
  }


  async function handleLogout() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await logoutAdmin();
      resetAdminState();
      window.location.replace(buildBackendUrl("/login?logout"));
    } catch (err) {
      setError(err?.message ?? "Déconnexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  function renderCvProfileEditor() {
    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <TextInput label="Nom affiché" value={cvDocument.profile.fullName} onChange={(event) => updateCvProfileField("fullName", event.currentTarget.value)} />
          <TextInput label="Titre CV" value={cvDocument.profile.title} onChange={(event) => updateCvProfileField("title", event.currentTarget.value)} />
          <TextInput label="Sous-titre" value={cvDocument.profile.subtitle} onChange={(event) => updateCvProfileField("subtitle", event.currentTarget.value)} />
          <TextInput label="Localisation" value={cvDocument.profile.location} onChange={(event) => updateCvProfileField("location", event.currentTarget.value)} />
        </SimpleGrid>
        <Textarea label="Phrase d’accroche" minRows={3} value={cvDocument.profile.headline} onChange={(event) => updateCvProfileField("headline", event.currentTarget.value)} />
        <Textarea label="Description" minRows={4} value={cvDocument.profile.description} onChange={(event) => updateCvProfileField("description", event.currentTarget.value)} />
        <TextInput label="Âge / tag header" value={cvDocument.profile.availability} onChange={(event) => updateCvProfileField("availability", event.currentTarget.value)} />
        <Paper withBorder radius="lg" p="md" className="cv-asset-import-card">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={800}>Photo du CV</Text>
                <Text size="xs" c="dimmed">Importée dans la compilation LaTeX sous le nom <code>{cvDocument.profile.photoFilename || "idris.jpg"}</code>.</Text>
              </div>
              {cvDocument.profile.photoDataUrl ? <Badge color="green" variant="light">photo chargée</Badge> : <Badge color="gray" variant="light">placeholder</Badge>}
            </Group>
            <FileInput
              label="Importer la photo ronde du header"
              placeholder="idris.jpg / png"
              accept="image/png,image/jpeg"
              clearable
              onChange={importCvProfilePhoto}
            />
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              <TextInput label="Nom fichier LaTeX" value={cvDocument.profile.photoFilename ?? "idris.jpg"} onChange={(event) => updateCvProfileField("photoFilename", safeCvAssetFilename(event.currentTarget.value, "idris.jpg"))} />
              <TextInput label="MIME" value={cvDocument.profile.photoMimeType ?? "image/jpeg"} onChange={(event) => updateCvProfileField("photoMimeType", event.currentTarget.value)} />
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  function renderCvSimpleItemEditor(item, sectionKey) {
    const isLanguage = sectionKey === "languages";
    const isContact = sectionKey === "contacts";

    return (
      <Card key={item.id} withBorder radius="lg" className={item.enabled === false ? "cv-editor-muted-item" : ""} {...getCvDragProps(sectionKey, item.id)}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Switch
              label={item.enabled === false ? "Masqué" : "Visible"}
              checked={item.enabled !== false}
              onChange={(event) => toggleCvItem(sectionKey, item.id, event.currentTarget.checked)}
            />
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, -1)}>↑</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, 1)}>↓</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "first")}>1er</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "last")}>Dernier</Button>
              <Button size="xs" variant="light" onClick={() => duplicateCvItem(sectionKey, item.id)}>Dupliquer</Button>
              <Button size="xs" color="red" variant="subtle" onClick={() => removeCvItem(sectionKey, item.id)}>Supprimer</Button>
            </Group>
          </Group>

          {isContact ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              <Select
                label="Type"
                data={contactTypeOptions}
                value={item.type ?? "WEBSITE"}
                onChange={(value) => updateCvItem(sectionKey, item.id, "type", value ?? "WEBSITE")}
              />
              <TextInput label="Valeur" value={item.value ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "value", event.currentTarget.value)} />
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 1, md: isLanguage ? 2 : 1 }} spacing="sm">
              <TextInput label={isLanguage ? "Langue" : "Libellé"} value={item.label ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "label", event.currentTarget.value)} />
              {isLanguage && (
                <TextInput label="Niveau" value={item.level ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "level", event.currentTarget.value)} />
              )}
            </SimpleGrid>
          )}
        </Stack>
      </Card>
    );
  }

  function renderCvExperienceEditor(item, sectionKey) {
    return (
      <Card key={item.id} withBorder radius="lg" className={item.enabled === false ? "cv-editor-muted-item" : ""} {...getCvDragProps(sectionKey, item.id)}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>{item.title || "Bloc sans titre"}</Text>
              <Text size="xs" c="dimmed">{item.organization || item.subtitle || "À compléter"}</Text>
            </div>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, -1)}>↑</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, 1)}>↓</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "first")}>1er</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "last")}>Dernier</Button>
              <Button size="xs" variant="light" onClick={() => duplicateCvItem(sectionKey, item.id)}>Dupliquer</Button>
              <Button size="xs" color="red" variant="subtle" onClick={() => removeCvItem(sectionKey, item.id)}>Supprimer</Button>
            </Group>
          </Group>

          <Switch
            label={item.enabled === false ? "Masqué du CV" : "Visible dans le CV"}
            checked={item.enabled !== false}
            onChange={(event) => toggleCvItem(sectionKey, item.id, event.currentTarget.checked)}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            <TextInput label="Titre" value={item.title ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "title", event.currentTarget.value)} />
            <TextInput label="Organisation" value={item.organization ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "organization", event.currentTarget.value)} />
            <TextInput label="Lieu" value={item.location ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "location", event.currentTarget.value)} />
            <TextInput label="Compétences CSV" value={toCsv(item.skills)} onChange={(event) => updateCvItemCsv(sectionKey, item.id, "skills", event.currentTarget.value)} />
            <TextInput label="Date début" value={item.startDate ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "startDate", event.currentTarget.value)} />
            <TextInput label="Date fin" value={item.endDate ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "endDate", event.currentTarget.value)} />
          </SimpleGrid>
          <Switch
            label="Poste / formation en cours"
            checked={Boolean(item.currentPosition)}
            onChange={(event) => updateCvItem(sectionKey, item.id, "currentPosition", event.currentTarget.checked)}
          />

          {sectionKey === "education" && (
            <Paper withBorder radius="lg" p="md" className="cv-asset-import-card">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={800}>Logo formation</Text>
                    <Text size="xs" c="dimmed">Même structure que ton bloc LaTeX <code>{"\\schoollogo"}</code>.</Text>
                  </div>
                  {item.logoDataUrl ? <Badge color="green" variant="light">logo chargé</Badge> : <Badge color="gray" variant="light">fallback LaTeX</Badge>}
                </Group>
                <FileInput
                  label="Importer le logo de l’université / école"
                  placeholder={item.logoFilename || inferSchoolDefaults(item, 0).logoFilename}
                  accept="image/png,image/jpeg"
                  clearable
                  onChange={(file) => importCvEducationLogo(item, file)}
                />
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                  <TextInput label="Code badge" value={item.schoolCode ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "schoolCode", event.currentTarget.value)} />
                  <TextInput label="Nom fichier LaTeX" value={item.logoFilename ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "logoFilename", safeCvAssetFilename(event.currentTarget.value, inferSchoolDefaults(item, 0).logoFilename))} />
                  <TextInput label="Taille logo" value={item.logoSize ?? inferSchoolDefaults(item, 0).logoSize} onChange={(event) => updateCvItem(sectionKey, item.id, "logoSize", event.currentTarget.value)} />
                  <TextInput label="MIME logo" value={item.logoMimeType ?? "image/png"} onChange={(event) => updateCvItem(sectionKey, item.id, "logoMimeType", event.currentTarget.value)} />
                  <TextInput label="Lien parcours officiel" value={item.officialUrl ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "officialUrl", event.currentTarget.value)} />
                  <TextInput label="Lien maquette / programme" value={item.programUrl ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "programUrl", event.currentTarget.value)} />
                </SimpleGrid>
              </Stack>
            </Paper>
          )}

          <Textarea label="Résumé" minRows={2} value={item.summary ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "summary", event.currentTarget.value)} />
          <Textarea label="Description" minRows={3} value={item.description ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "description", event.currentTarget.value)} />
        </Stack>
      </Card>
    );
  }

  function renderCvProjectEditor(item) {
    return (
      <Card key={item.id} withBorder radius="lg" className={item.enabled === false ? "cv-editor-muted-item" : ""} {...getCvDragProps("projects", item.id)}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>{item.title || "Projet sans titre"}</Text>
              <Text size="xs" c="dimmed">{item.subtitle || toCsv(item.stacks) || "À compléter"}</Text>
            </div>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem("projects", item.id, -1)}>↑</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem("projects", item.id, 1)}>↓</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo("projects", item.id, "first")}>1er</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo("projects", item.id, "last")}>Dernier</Button>
              <Button size="xs" variant="light" onClick={() => duplicateCvItem("projects", item.id)}>Dupliquer</Button>
              <Button size="xs" color="red" variant="subtle" onClick={() => removeCvItem("projects", item.id)}>Supprimer</Button>
            </Group>
          </Group>

          <Switch
            label={item.enabled === false ? "Masqué du CV" : "Visible dans le CV"}
            checked={item.enabled !== false}
            onChange={(event) => toggleCvItem("projects", item.id, event.currentTarget.checked)}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            <TextInput label="Titre" value={item.title ?? ""} onChange={(event) => updateCvItem("projects", item.id, "title", event.currentTarget.value)} />
            <TextInput label="Sous-titre" value={item.subtitle ?? ""} onChange={(event) => updateCvItem("projects", item.id, "subtitle", event.currentTarget.value)} />
            <TextInput label="Stacks CSV" value={toCsv(item.stacks)} onChange={(event) => updateCvItemCsv("projects", item.id, "stacks", event.currentTarget.value)} />
            <TextInput label="Fonctionnalités CSV" value={toCsv(item.features)} onChange={(event) => updateCvItemCsv("projects", item.id, "features", event.currentTarget.value)} />
          </SimpleGrid>
          <Textarea label="Résumé court" minRows={2} value={item.shortDescription ?? ""} onChange={(event) => updateCvItem("projects", item.id, "shortDescription", event.currentTarget.value)} />
          <Textarea label="Description" minRows={3} value={item.description ?? ""} onChange={(event) => updateCvItem("projects", item.id, "description", event.currentTarget.value)} />
        </Stack>
      </Card>
    );
  }

  function renderCvSelectedContentEditor() {
    if (cvSelectedSection === "profile") return renderCvProfileEditor();

    if (["skills", "languages", "qualities", "contacts"].includes(cvSelectedSection)) {
      return (
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={800}>{cvContentSections.find((section) => section.value === cvSelectedSection)?.label}</Text>
            <Button size="xs" variant="light" onClick={() => addCvItem(cvSelectedSection)}>Ajouter</Button>
          </Group>
          {cvSelectedItems.length > 0 ? cvSelectedItems.map((item) => renderCvSimpleItemEditor(item, cvSelectedSection)) : (
            <Alert color="gray" variant="light">Aucun élément dans cette section.</Alert>
          )}
        </Stack>
      );
    }

    if (["experiences", "education"].includes(cvSelectedSection)) {
      return (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={800}>{cvContentSections.find((section) => section.value === cvSelectedSection)?.label}</Text>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => sortCvItems(cvSelectedSection, "date")}>Date</Button>
              <Button size="xs" variant="subtle" onClick={() => sortCvItems(cvSelectedSection, "relevance")}>Pertinence</Button>
              <Button size="xs" variant="light" onClick={() => addCvItem(cvSelectedSection)}>Ajouter</Button>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">Glisse-dépose les cartes pour réordonner manuellement.</Text>
          {cvSelectedItems.length > 0 ? cvSelectedItems.map((item) => renderCvExperienceEditor(item, cvSelectedSection)) : (
            <Alert color="gray" variant="light">Aucun bloc à éditer.</Alert>
          )}
        </Stack>
      );
    }

    if (cvSelectedSection === "projects") {
      return (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={800}>Projets</Text>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => sortCvItems("projects", "date")}>Date</Button>
              <Button size="xs" variant="subtle" onClick={() => sortCvItems("projects", "relevance")}>Pertinence</Button>
              <Button size="xs" variant="light" onClick={() => addCvItem("projects")}>Ajouter</Button>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">Glisse-dépose les cartes pour réordonner manuellement.</Text>
          {cvSelectedItems.length > 0 ? cvSelectedItems.map(renderCvProjectEditor) : (
            <Alert color="gray" variant="light">Aucun projet à éditer.</Alert>
          )}
        </Stack>
      );
    }

    return null;
  }

  const activeVersionsCount = versions.filter((version) => version.active).length;
  const selectedVersionProjectsCount = projects.length;
  const selectedVersionExperiencesCount = experiences.length;
  const jsonEditorLineCount = Math.max(jsonEditorText.split("\n").length, 1);
  const jsonEditorSizeKb = Math.max(
    1,
    Math.ceil(new Blob([jsonEditorText]).size / 1024),
  );
  const jsonEditorDiagnosticMessage = jsonEditorError ?? jsonEditorAnalysis.message;
  const jsonEditorStatusColor = jsonEditorAnalysis.valid ? "green" : "red";
  const jsonEditorCanUpdate = jsonEditorAnalysis.valid && !loading;
  const cvCurrentPdfUrl = cvPreviewUrl || profileForm.cvUrl || "";
  const cvCompileStatusColor = cvCompileSuccess === null ? "gray" : cvCompileSuccess ? "green" : "red";
  const cvCompileStatusLabel = cvCompileSuccess === null ? "Non compilé" : cvCompileSuccess ? "Compilation OK" : "Compilation KO";

  if (authStatus === "checking") {
    return <AdminChecking />;
  }

  if (authStatus === "login") {
    return <AdminLoginRedirect />;
  }

  return (
    <main ref={rootRef} className="admin-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />

      <Stack gap="xl" className="admin-shell">
        <Paper withBorder radius="xl" p="xl" className="admin-hero-card">
          <Group justify="space-between" align="flex-start" gap="xl">
            <Stack gap="xs" maw={860}>
              <Badge variant="light" className="admin-kicker">
                Administration portfolio
              </Badge>
              <Title order={1} className="admin-title">
                Console de contenu, versions & projets
              </Title>
              <Text c="dimmed" size="lg">
                Gère le contenu complet du portfolio : versions clonables,
                profils, fichiers uploadés, expériences et projets éditables un
                par un.
              </Text>
            </Stack>

            <Stack gap="xs" className="admin-hero-actions">
              <Button onClick={() => refreshOwners()} loading={loading} variant="light">
                Recharger les données
              </Button>
              <Button component="a" href="/" variant="subtle">
                Voir le site public
              </Button>
              <Button onClick={handleLogout} loading={loading} variant="outline">
                Se déconnecter
              </Button>
            </Stack>
          </Group>
        </Paper>

        {(loading || message || error) && (
          <Stack gap="sm">
            {loading && (
              <Alert variant="light" className="admin-alert">
                <Group>
                  <Loader size="sm" />
                  <Text>Traitement en cours…</Text>
                </Group>
              </Alert>
            )}

            {message && (
              <Alert color="green" variant="light" className="admin-alert">
                {message}
              </Alert>
            )}

            {error && (
              <Alert color="red" variant="light" className="admin-alert">
                {error}
              </Alert>
            )}
          </Stack>
        )}

        <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-context-card">
          <Stack>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>Contexte de modification</Text>
                <Text size="sm" c="dimmed">
                  Sélectionne un profil, une version, puis modifie ses blocs de contenu.
                </Text>
              </div>

              <Group gap="xs">
                <Badge color={activeVersionsCount === 1 ? "green" : "red"} variant="light">
                  {activeVersionsCount} active
                </Badge>
                <Badge variant="light">
                  {versions.length} version{versions.length > 1 ? "s" : ""}
                </Badge>
                <Badge variant="light">
                  {selectedVersionProjectsCount} projet{selectedVersionProjectsCount > 1 ? "s" : ""}
                </Badge>
                <Badge variant="light">
                  {selectedVersionExperiencesCount} expérience{selectedVersionExperiencesCount > 1 ? "s" : ""}
                </Badge>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Select
                label="Profil"
                placeholder="Choisir un profil"
                data={owners.map((owner) => ({
                  value: String(getEntityId(owner)),
                  label: getOwnerLabel(owner),
                }))}
                value={selectedOwnerId}
                onChange={handleOwnerChange}
                searchable
              />

              <Select
                label="Version"
                placeholder="Choisir une version"
                data={versions.map((version) => ({
                  value: String(getEntityId(version)),
                  label: `${version.versionTag ?? "version"} — ${
                    version.label ?? "Sans label"
                  }${version.active ? " — active" : ""}`,
                }))}
                value={selectedVersionId}
                onChange={(value) => selectVersion(value)}
                searchable
              />
            </SimpleGrid>

            <Group>
              <Button
                variant="light"
                onClick={() => refreshVersions(selectedOwnerId)}
                disabled={!selectedOwnerId}
              >
                Recharger versions
              </Button>

              <Button
                variant="light"
                onClick={() => refreshProjects()}
                disabled={!selectedOwnerId || !selectedVersionId}
              >
                Recharger projets
              </Button>

              <Button
                variant="light"
                onClick={downloadCurrentVersionJson}
                disabled={!selectedOwnerId || !selectedVersionId}
              >
                Télécharger JSON
              </Button>

              <Button
                variant="filled"
                onClick={openCurrentVersionJsonEditor}
                disabled={!selectedOwnerId || !selectedVersionId}
              >
                Éditer JSON
              </Button>

              <Button
                color="green"
                onClick={() => activateVersionWithValidation()}
                disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}
              >
                Valider & activer
              </Button>

              <Button
                color="red"
                variant="light"
                onClick={() => deleteVersion()}
                disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}
              >
                Supprimer version inactive
              </Button>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-tabs-card">
          <Tabs defaultValue="version" variant="outline" radius="md" className="admin-tabs">
            <Tabs.List>
              <Tabs.Tab value="import">Import JSON</Tabs.Tab>
              <Tabs.Tab value="owner">Profil principal</Tabs.Tab>
              <Tabs.Tab value="version">Versions</Tabs.Tab>
              <Tabs.Tab value="safety">Santé & backup</Tabs.Tab>
              <Tabs.Tab value="applications">Candidatures</Tabs.Tab>
              <Tabs.Tab value="profile">Profil & fichiers</Tabs.Tab>
              <Tabs.Tab value="cv">CV Builder</Tabs.Tab>
              <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
              <Tabs.Tab value="project">Projets</Tabs.Tab>
            </Tabs.List>


            <Tabs.Panel value="import" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Import automatique depuis un JSON</Text>
                    <Text size="sm" c="dimmed">
                      Le JSON préremplit les formulaires owner, version, profil, timeline et projets. Les images et PDF restent remplaçables avec les champs d’upload existants.
                    </Text>
                  </div>
                  <Badge variant="light">Préremplissage</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                    <Stack gap="md">
                      <Text fw={800}>Importer un fichier</Text>
                      <Text size="sm" c="dimmed">
                        Utilise un fichier JSON complet pour automatiser la saisie, puis ajuste les champs avant de créer ou sauvegarder la version.
                      </Text>
                      <FileInput
                        label="Fichier JSON"
                        placeholder="portfolio-import.json"
                        accept="application/json,.json"
                        value={jsonImportFile}
                        onChange={setJsonImportFile}
                      />
                      <Group>
                        <Button onClick={importJsonFromFile} loading={loading} disabled={!jsonImportFile}>
                          Importer dans le formulaire
                        </Button>
                        <Button
                          component="a"
                          href="/examples/portfolio-import-idris-complet.json"
                          download
                          variant="light"
                        >
                          Télécharger un exemple complet
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>

                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                    <Stack gap="md">
                      <Text fw={800}>Ou coller un JSON</Text>
                      <Text size="sm" c="dimmed">
                        Pratique pour tester rapidement un contenu généré avant de l’enregistrer côté backend.
                      </Text>
                      <Textarea
                        label="JSON brut"
                        placeholder='{"name":"ACHABOU","firstName":"Idris","projects":[]}'
                        minRows={9}
                        value={jsonImportText}
                        onChange={(event) => setJsonImportText(event.currentTarget.value)}
                      />
                      <Group>
                        <Button variant="light" onClick={importJsonFromText}>
                          Importer le JSON collé
                        </Button>
                        <Button variant="subtle" onClick={() => setJsonImportText("")}>
                          Vider
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                {jsonImportSummary && (
                  <Alert color="green" variant="light" className="admin-alert">
                    Import chargé : version {jsonImportSummary.versionTag} — {jsonImportSummary.versionLabel}. {jsonImportSummary.contacts} contact(s), {jsonImportSummary.experiences} expérience(s), {jsonImportSummary.projects} projet(s), dont {jsonImportSummary.featuredProjects} featured et {jsonImportSummary.publishedProjects} publié(s).
                  </Alert>
                )}

                <Alert variant="light" className="admin-alert">
                  Après import, va dans les onglets Profil & fichiers, Timeline et Projets pour contrôler les champs. Ensuite tu peux créer un owner, créer une nouvelle version, ou activer la version selon ton workflow habituel.
                </Alert>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="owner" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Identité, contacts et création du profil principal</Text>
                    <Text size="sm" c="dimmed">
                      Modifie les coordonnées du profil sélectionné ou crée une nouvelle fiche avec une première version.
                    </Text>
                  </div>
                  <Badge variant="light">Création</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Nom" value={ownerForm.name} onChange={(event) => updateOwnerForm("name", event.currentTarget.value)} />
                  <TextInput label="Prénom" value={ownerForm.firstName} onChange={(event) => updateOwnerForm("firstName", event.currentTarget.value)} />
                  <NumberInput label="Âge" value={ownerForm.age} onChange={(value) => updateOwnerForm("age", value ?? 0)} />
                  <TextInput label="Adresse" value={ownerForm.address} onChange={(event) => updateOwnerForm("address", event.currentTarget.value)} />
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Contacts publics</Text>
                        <Text size="sm" c="dimmed">
                          Ces contacts alimentent les boutons, les liens publics et la carte de coordonnées du portfolio.
                        </Text>
                      </div>
                      <Button size="xs" variant="light" onClick={addOwnerContact}>
                        Ajouter contact
                      </Button>
                    </Group>

                    <Stack gap="sm">
                      {ownerForm.contacts.map((contact, index) => (
                        <SimpleGrid key={`${contact.type}-${index}`} cols={{ base: 1, md: 3 }} spacing="sm" className="admin-contact-row">
                          <Select
                            label="Type"
                            data={contactTypeOptions}
                            value={contact.type}
                            onChange={(value) => updateOwnerContact(index, "type", value ?? "EMAIL")}
                          />
                          <TextInput
                            label="Valeur"
                            placeholder="Email, téléphone ou URL"
                            value={contact.value}
                            onChange={(event) => updateOwnerContact(index, "value", event.currentTarget.value)}
                          />
                          <Button
                            color="red"
                            variant="light"
                            onClick={() => removeOwnerContact(index)}
                          >
                            Retirer
                          </Button>
                        </SimpleGrid>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                <Group>
                  <Switch label="Owner actif" checked={ownerForm.active} onChange={(event) => updateOwnerForm("active", event.currentTarget.checked)} />
                  <Button onClick={updateOwner} loading={loading} disabled={!selectedOwnerId}>
                    Enregistrer identité et contacts
                  </Button>
                </Group>

                <Divider label="Création d’une nouvelle fiche" labelPosition="center" />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Tag première version" value={ownerForm.versionTag} onChange={(event) => updateOwnerForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label première version" value={ownerForm.versionLabel} onChange={(event) => updateOwnerForm("versionLabel", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description première version" minRows={3} value={ownerForm.versionDescription} onChange={(event) => updateOwnerForm("versionDescription", event.currentTarget.value)} />

                <Checkbox label="Publier la première version" checked={ownerForm.versionPublished} onChange={(event) => updateOwnerForm("versionPublished", event.currentTarget.checked)} />

                <Button onClick={createOwner} loading={loading} size="md" variant="light">
                  Créer profil + version initiale
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="version" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Créer, cloner ou modifier une version</Text>
                    <Text size="sm" c="dimmed">
                      Pour éviter de retaper profil, timeline et projets, crée une version en important le contenu d’une version source.
                    </Text>
                  </div>
                  <Badge variant="light">Version</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Version tag" value={versionForm.versionTag} onChange={(event) => updateVersionForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label" value={versionForm.label} onChange={(event) => updateVersionForm("label", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description" minRows={3} value={versionForm.description} onChange={(event) => updateVersionForm("description", event.currentTarget.value)} />

                <Group>
                  <Switch label="Active à la création" checked={versionForm.active} onChange={(event) => updateVersionForm("active", event.currentTarget.checked)} />
                  <Switch label="Published" checked={versionForm.published} onChange={(event) => updateVersionForm("published", event.currentTarget.checked)} />
                </Group>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Créer une version depuis une version existante</Text>
                        <Text size="sm" c="dimmed">
                          Copie automatiquement le profil, le CV, les images, la timeline et tous les projets.
                        </Text>
                      </div>
                      <Badge variant="light">Import</Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <Select
                        label="Version source à importer"
                        placeholder="Choisir une version source"
                        data={versions.map((version) => ({
                          value: String(getEntityId(version)),
                          label: `${version.versionTag ?? "version"} — ${version.label ?? "Sans label"}`,
                        }))}
                        value={cloneSourceVersionId}
                        onChange={setCloneSourceVersionId}
                        searchable
                      />

                      <Button
                        onClick={cloneVersion}
                        disabled={!selectedOwnerId || !cloneSourceVersionId}
                      >
                        Créer en important la version source
                      </Button>
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <Group>
                  <Button onClick={createVersion} disabled={!selectedOwnerId} variant="light">
                    Créer depuis les formulaires actuels
                  </Button>
                  <Button variant="light" onClick={updateVersionMetadata} disabled={!selectedOwnerId || !selectedVersionId}>
                    Modifier métadonnées
                  </Button>
                </Group>

                <Divider />

                <Stack gap="sm">
                  {versions.map((version) => (
                    <Card key={getEntityId(version)} withBorder padding="md" radius="lg" className="admin-version-card">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Group gap="xs">
                            <Text fw={800}>{version.versionTag} — {version.label}</Text>
                            {version.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}
                          </Group>
                          <Text size="sm" c="dimmed">{version.description}</Text>
                          <Text size="xs" c="dimmed">
                            {(version.projects ?? []).length} projet(s) · {(version.timeline?.experiences ?? []).length} expérience(s)
                          </Text>
                        </div>

                        <Group>
                          <Button size="xs" variant="light" onClick={() => selectVersion(String(getEntityId(version)))}>
                            Sélectionner
                          </Button>
                          <Button size="xs" color="green" variant="light" disabled={version.active} onClick={() => activateVersionWithValidation(getEntityId(version))}>
                            Valider & activer
                          </Button>
                          <Button size="xs" variant="subtle" onClick={() => setCloneSourceVersionId(String(getEntityId(version)))}>
                            Source
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="applications" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={900}>Assistant candidature</Text>
                    <Text size="sm" c="dimmed">
                      Analyse une offre, crée une candidature suivie, génère une lettre de motivation LaTeX/PDF et exporte un package complet.
                    </Text>
                  </div>
                  <Group>
                    <Button variant="light" onClick={() => loadApplications(selectedOwnerId)} disabled={!selectedOwnerId}>Rafraîchir</Button>
                    <Button onClick={resetApplicationForm} disabled={!selectedOwnerId}>Nouvelle candidature</Button>
                  </Group>
                </Group>

                {renderApplicationsDashboard()}

                <SimpleGrid cols={{ base: 1, xl: 3 }} spacing="lg">
                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-list-panel">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={900}>Pipeline candidatures</Text>
                        <Badge variant="light">{applications.length} item(s)</Badge>
                      </Group>
                      {applications.length === 0 ? (
                        <Alert color="gray" variant="light">Aucune candidature enregistrée pour ce owner.</Alert>
                      ) : (
                        <Stack gap="sm">
                          {applications.map((application) => (
                            <Paper
                              key={application.id}
                              withBorder
                              radius="lg"
                              p="md"
                              className={String(application.id) === String(selectedApplicationId) ? "application-card is-selected" : "application-card"}
                              onClick={() => selectApplication(application)}
                            >
                              <Group justify="space-between" align="flex-start">
                                <div>
                                  <Text fw={900}>{application.companyName}</Text>
                                  <Text size="sm" c="dimmed">{application.roleTitle}</Text>
                                </div>
                                <Badge color={applicationStatusColors[application.status] ?? "gray"} variant="light">
                                  {applicationStatusLabels[application.status] ?? application.status}
                                </Badge>
                              </Group>
                              <Group gap="xs" mt="xs">
                                <Badge color={(application.relevanceScore ?? 0) >= 75 ? "green" : "yellow"} variant="light">{application.relevanceScore ?? 0}/100</Badge>
                                {application.followUpAt && <Badge color="orange" variant="light">relance {application.followUpAt}</Badge>}
                              </Group>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Paper>

                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-editor-panel">
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Text fw={900}>{selectedApplicationId ? "Éditer la candidature" : "Créer une candidature"}</Text>
                        {selectedApplicationId && <Badge variant="light">#{selectedApplicationId}</Badge>}
                      </Group>

                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        <TextInput label="Entreprise" value={applicationForm.companyName} onChange={(event) => updateApplicationForm("companyName", event.currentTarget.value)} />
                        <TextInput label="Poste" value={applicationForm.roleTitle} onChange={(event) => updateApplicationForm("roleTitle", event.currentTarget.value)} />
                        <TextInput label="Lieu" value={applicationForm.location} onChange={(event) => updateApplicationForm("location", event.currentTarget.value)} />
                        <Select label="Statut" data={applicationStatusOptions} value={applicationForm.status} onChange={(value) => updateApplicationForm("status", value ?? "DRAFT")} />
                        <Select
                          label="Version portfolio associée"
                          data={versions.map((version) => ({ value: String(getEntityId(version)), label: `${version.label ?? version.versionTag} ${version.active ? "· active" : ""}` }))}
                          value={applicationForm.versionId ? String(applicationForm.versionId) : selectedVersionId}
                          onChange={(value) => updateApplicationForm("versionId", value ?? "")}
                        />
                        <TextInput label="Variante CV" value={applicationForm.cvVariantName} onChange={(event) => updateApplicationForm("cvVariantName", event.currentTarget.value)} />
                        <TextInput label="URL offre" value={applicationForm.offerUrl} onChange={(event) => updateApplicationForm("offerUrl", event.currentTarget.value)} />
                        <TextInput label="Profil ciblé" value={applicationForm.targetProfile} onChange={(event) => updateApplicationForm("targetProfile", event.currentTarget.value)} />
                        <TextInput label="Date envoi" placeholder="YYYY-MM-DD" value={applicationForm.appliedAt} onChange={(event) => updateApplicationForm("appliedAt", event.currentTarget.value)} />
                        <TextInput label="Date relance" placeholder="YYYY-MM-DD" value={applicationForm.followUpAt} onChange={(event) => updateApplicationForm("followUpAt", event.currentTarget.value)} />
                      </SimpleGrid>

                      <Textarea minRows={8} label="Offre collée" value={applicationForm.offerText} onChange={(event) => updateApplicationForm("offerText", event.currentTarget.value)} />
                      <Textarea minRows={5} label="Notes internes" value={applicationForm.notes} onChange={(event) => updateApplicationForm("notes", event.currentTarget.value)} />
                      <Textarea minRows={5} label="Mail de candidature" value={applicationForm.mailDraft} onChange={(event) => updateApplicationForm("mailDraft", event.currentTarget.value)} />

                      <Group>
                        <Button variant="light" onClick={analyzeCurrentOffer}>Analyser l’offre</Button>
                        <Button onClick={saveApplication}>{selectedApplicationId ? "Mettre à jour" : "Créer"}</Button>
                        {selectedApplicationId && <Button color="red" variant="subtle" onClick={deleteApplication}>Supprimer</Button>}
                      </Group>

                      {selectedApplicationId && (
                        <Group gap="xs">
                          <Button size="xs" variant="light" onClick={() => markApplicationStatus("SENT")}>Marquer envoyée</Button>
                          <Button size="xs" variant="light" onClick={() => markApplicationStatus("FOLLOW_UP")}>Relance</Button>
                          <Button size="xs" variant="light" onClick={() => markApplicationStatus("INTERVIEW")}>Entretien</Button>
                          <Button size="xs" variant="light" color="green" onClick={() => markApplicationStatus("ACCEPTED")}>Acceptée</Button>
                        </Group>
                      )}
                    </Stack>
                  </Paper>

                  <Stack gap="lg">
                    <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-analysis-panel">
                      <Stack gap="md">
                        <Text fw={900}>Analyse et adaptation CV</Text>
                        {renderOfferAnalysis()}
                      </Stack>
                    </Paper>

                    <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-letter-panel">
                      <Stack gap="md">
                        <Group justify="space-between" align="center">
                          <Text fw={900}>Lettre de motivation LaTeX</Text>
                          {coverLetterPreviewUrl && <Badge color="green" variant="light">PDF prêt</Badge>}
                        </Group>
                        <Textarea
                          minRows={10}
                          label="Source LaTeX de la lettre"
                          value={applicationForm.coverLetterSource}
                          onChange={(event) => updateApplicationForm("coverLetterSource", event.currentTarget.value)}
                          placeholder="Laisse vide pour générer automatiquement depuis l’offre et la version portfolio."
                        />
                        <Group>
                          <Button variant="light" onClick={previewCoverLetter} disabled={!selectedApplicationId}>Prévisualiser PDF</Button>
                          <Button onClick={saveCoverLetter} disabled={!selectedApplicationId}>Sauvegarder lettre</Button>
                          <Button variant="light" onClick={exportApplicationPackage} disabled={!selectedApplicationId}>Exporter ZIP candidature</Button>
                        </Group>
                        <Group>
                          {coverLetterPreviewUrl && <Button component="a" href={coverLetterPreviewUrl} target="_blank" rel="noreferrer">Ouvrir PDF</Button>}
                          {applicationZipUrl && <Button component="a" href={applicationZipUrl} target="_blank" rel="noreferrer" variant="light">Télécharger ZIP</Button>}
                        </Group>
                        {coverLetterWarnings.length > 0 && <Alert color="orange" variant="light">{coverLetterWarnings.join(" · ")}</Alert>}
                        {coverLetterLogs && <Textarea minRows={7} label="Logs LaTeX" value={coverLetterLogs} readOnly />}
                      </Stack>
                    </Paper>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="safety" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={900}>Santé, sauvegarde et publication contrôlée</Text>
                    <Text size="sm" c="dimmed">
                      Contrôle la qualité d’une version avant activation, exporte un backup reproductible et restaure une version sans écraser l’existant.
                    </Text>
                  </div>
                  <Badge variant="light">Qualité admin</Badge>
                </Group>

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel admin-safety-panel">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>Contrôle santé portfolio</Text>
                          <Text size="sm" c="dimmed">Vérifie profil, contacts, timeline, projets publiés, images, liens et cohérence de publication.</Text>
                        </div>
                        {portfolioHealthReport && <Badge color={portfolioHealthReport.publishable ? "green" : "red"}>{portfolioHealthReport.score}/100</Badge>}
                      </Group>
                      <Group>
                        <Button variant="light" onClick={runPortfolioHealthCheck} disabled={!selectedOwnerId || !selectedVersionId}>Lancer le contrôle</Button>
                        <Button variant="light" onClick={validatePortfolioBeforePublish} disabled={!selectedOwnerId || !selectedVersionId}>Validation publication</Button>
                        <Button color="green" onClick={() => activateVersionWithValidation()} disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}>Valider & activer</Button>
                      </Group>
                      {renderPortfolioHealthReport(portfolioHealthReport ?? publishValidationReport)}
                    </Stack>
                  </Paper>

                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel admin-safety-panel">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>Backup complet version</Text>
                          <Text size="sm" c="dimmed">Génère un ZIP backend contenant portfolio.json, metadata.json et un snapshot restaurable.</Text>
                        </div>
                        {portfolioBackupUrl && <Badge color="green" variant="light">backup prêt</Badge>}
                      </Group>
                      <Group>
                        <Button variant="light" onClick={exportPortfolioBackupZip} disabled={!selectedOwnerId || !selectedVersionId}>Exporter backup ZIP</Button>
                        {portfolioBackupUrl && <Button component="a" href={portfolioBackupUrl} target="_blank" rel="noreferrer">Télécharger ZIP</Button>}
                        {portfolioBackupJson && <Button variant="subtle" onClick={() => downloadTextFile("portfolio-backup.json", `${portfolioBackupJson}\n`, "application/json;charset=utf-8")}>Télécharger JSON</Button>}
                      </Group>
                      <Alert color="blue" variant="light">Le JSON est aussi téléchargé séparément pour une restauration rapide ou une revue Git.</Alert>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel admin-safety-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Restore backup vers une nouvelle version</Text>
                        <Text size="sm" c="dimmed">Colle le contenu de portfolio.json depuis un backup. La restauration crée une nouvelle version inactive pour éviter d’écraser la production.</Text>
                      </div>
                      <Badge variant="light">Restore sûr</Badge>
                    </Group>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <TextInput label="Label de la version restaurée" value={portfolioRestoreLabel} onChange={(event) => setPortfolioRestoreLabel(event.currentTarget.value)} />
                      <Button mt="xl" onClick={restorePortfolioBackup} disabled={!selectedOwnerId || !portfolioRestoreText.trim()}>Restaurer en version inactive</Button>
                    </SimpleGrid>
                    <Textarea
                      label="portfolio.json du backup"
                      minRows={10}
                      value={portfolioRestoreText}
                      onChange={(event) => setPortfolioRestoreText(event.currentTarget.value)}
                      placeholder="Colle ici le fichier portfolio.json contenu dans le ZIP de backup..."
                    />
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="cv" pt="lg">
              <Stack gap="lg">
                <Paper withBorder p="lg" radius="xl" className="cv-builder-photoshop-shell">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Group gap="xs" align="center">
                          <Text fw={900}>CV Studio</Text>
                          <Badge variant="light">Command Pattern</Badge>
                          <Badge color={cvCompileStatusColor} variant="light">{cvCompileStatusLabel}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          Éditeur visuel type Photoshop : commandes, contenu, style, layout, LaTeX, preview PDF et historique undo/redo.
                        </Text>
                      </div>

                      <Group gap="xs" justify="flex-end">
                        <Button size="xs" variant="light" disabled={!cvCanUndo} onClick={undoCvCommand}>Annuler</Button>
                        <Button size="xs" variant="light" disabled={!cvCanRedo} onClick={redoCvCommand}>Rétablir</Button>
                        <Button size="xs" variant="subtle" onClick={() => resetCvEditorFromData()}>Reset portfolio</Button>
                        <Button size="xs" variant="light" onClick={generateLatexFromCvDocument}>Générer LaTeX</Button>
                        <Button size="xs" variant="subtle" onClick={generateCvLatexSource} disabled={!selectedOwnerId || !selectedVersionId}>Recharger modèle</Button>
                        <Button size="xs" onClick={previewGeneratedCv} disabled={!selectedOwnerId || !selectedVersionId}>Compiler preview</Button>
                        <Button size="xs" color="green" onClick={saveGeneratedCvToVersion} disabled={!selectedOwnerId || !selectedVersionId}>Sauvegarder CV</Button>
                      </Group>
                    </Group>

                    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                      <Paper withBorder p="md" radius="lg" className="cv-command-panel">
                        <Tabs value={cvActiveEditorTab} onChange={(value) => setCvActiveEditorTab(value ?? "content")}>
                          <Tabs.List grow>
                            <Tabs.Tab value="content">Contenu</Tabs.Tab>
                            <Tabs.Tab value="sections">Sections</Tabs.Tab>
                            <Tabs.Tab value="style">Style</Tabs.Tab>
                            <Tabs.Tab value="typography">Typo</Tabs.Tab>
                            <Tabs.Tab value="layout">Layout</Tabs.Tab>
                            <Tabs.Tab value="assets">Assets</Tabs.Tab>
                            <Tabs.Tab value="quality">Qualité</Tabs.Tab>
                            <Tabs.Tab value="variants">Variantes</Tabs.Tab>
                            <Tabs.Tab value="offer">Offre</Tabs.Tab>
                            <Tabs.Tab value="advanced">Avancé</Tabs.Tab>
                            <Tabs.Tab value="latex">LaTeX</Tabs.Tab>
                            <Tabs.Tab value="history">Historique</Tabs.Tab>
                          </Tabs.List>

                          <Tabs.Panel value="content" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between" align="center">
                                <Select
                                  label="Bloc à éditer"
                                  data={cvContentSections}
                                  value={cvSelectedSection}
                                  onChange={(value) => setCvSelectedSection(value ?? "profile")}
                                  className="cv-section-selector"
                                />
                                <Badge variant="light">
                                  {cvSelectedSection === "profile" ? "1 bloc" : `${cvSelectedItems.filter((item) => item.enabled !== false).length}/${cvSelectedItems.length} visibles`}
                                </Badge>
                              </Group>
                              {renderCvSelectedContentEditor()}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="sections" pt="md">
                            <Stack gap="md">
                              <Text fw={800}>Visibilité des sections</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                {cvSectionDefinitions.map((section) => (
                                  <Switch
                                    key={section.key}
                                    label={section.label}
                                    checked={Boolean(cvDocument.sections?.[section.key])}
                                    onChange={(event) => toggleCvSection(section.key, event.currentTarget.checked)}
                                  />
                                ))}
                              </SimpleGrid>
                              <Divider />
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <NumberInput label="Limite projets" min={1} max={12} value={cvDocument.settings.projectLimit} onChange={(value) => updateCvSettingsField("projectLimit", value ?? 4)} />
                                <NumberInput label="Limite expériences" min={1} max={10} value={cvDocument.settings.experienceLimit} onChange={(value) => updateCvSettingsField("experienceLimit", value ?? 2)} />
                                <NumberInput label="Limite compétences" min={4} max={40} value={cvDocument.settings.skillsLimit} onChange={(value) => updateCvSettingsField("skillsLimit", value ?? 16)} />
                                <NumberInput label="Bullets par projet / expérience" min={1} max={8} value={cvDocument.settings.featuresLimit} onChange={(value) => updateCvSettingsField("featuresLimit", value ?? 4)} />
                              </SimpleGrid>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="style" pt="md">
                            <Stack gap="md">
                              <Text fw={800}>Style global du modèle LaTeX conservé</Text>
                              <Text size="sm" c="dimmed">
                                Ces commandes ne reconstruisent pas un nouveau CV : elles modifient les variables du modèle LaTeX fait à la main.
                              </Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput label="Couleur principale" value={cvDocument.settings.primaryColor} onChange={(event) => updateCvSettingsField("primaryColor", event.currentTarget.value)} />
                                <TextInput label="Couleur secondaire" value={cvDocument.settings.secondaryColor} onChange={(event) => updateCvSettingsField("secondaryColor", event.currentTarget.value)} />
                                <Select
                                  label="Densité"
                                  data={[{ value: "compact", label: "Compact" }, { value: "detailed", label: "Détaillé" }]}
                                  value={cvDocument.settings.density}
                                  onChange={(value) => updateCvSettingsField("density", value ?? "compact")}
                                />
                                <Select
                                  label="Langue"
                                  data={[{ value: "fr", label: "Français" }, { value: "en", label: "Anglais" }]}
                                  value={cvDocument.settings.language}
                                  onChange={(value) => updateCvSettingsField("language", value ?? "fr")}
                                />
                                <NumberInput label="Échelle globale" min={0.86} max={1.12} step={0.01} value={cvDocument.settings.fontScale} onChange={(value) => updateCvSettingsField("fontScale", value ?? 1)} />
                                <NumberInput label="Taille contenu global" min={8.5} max={13.5} step={0.1} value={cvDocument.settings.globalContentSize} onChange={(value) => updateCvSettingsField("globalContentSize", value ?? 11)} />
                              </SimpleGrid>
                              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                <Switch label="Photo" checked={Boolean(cvDocument.settings.showPhoto)} onChange={(event) => updateCvSettingsField("showPhoto", event.currentTarget.checked)} />
                                <Switch label="Icônes" checked={Boolean(cvDocument.settings.showIcons)} onChange={(event) => updateCvSettingsField("showIcons", event.currentTarget.checked)} />
                                <Switch label="Liens soulignés" checked={Boolean(cvDocument.settings.underlineLinks)} onChange={(event) => updateCvSettingsField("underlineLinks", event.currentTarget.checked)} />
                              </SimpleGrid>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="typography" pt="md">
                            <Stack gap="lg">
                              <div>
                                <Text fw={800}>Typographie précise par zone</Text>
                                <Text size="sm" c="dimmed">Commandes de taille de police comme dans un éditeur visuel : header, sections, textes, sous-titres et liens.</Text>
                              </div>
                              <Paper withBorder p="md" radius="lg" className="cv-typography-group">
                                <Text fw={800} mb="xs">Header</Text>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                  <NumberInput label="Nom" min={16} max={30} step={0.1} value={cvDocument.settings.headerNameSize} onChange={(value) => updateCvSettingsField("headerNameSize", value ?? 24)} />
                                  <NumberInput label="Titre" min={10} max={22} step={0.1} value={cvDocument.settings.headerTitleSize} onChange={(value) => updateCvSettingsField("headerTitleSize", value ?? 15.2)} />
                                  <NumberInput label="Accroche" min={8} max={14} step={0.1} value={cvDocument.settings.headerHeadlineSize} onChange={(value) => updateCvSettingsField("headerHeadlineSize", value ?? 10)} />
                                  <NumberInput label="Contacts header" min={8} max={14} step={0.1} value={cvDocument.settings.headerContactSize} onChange={(value) => updateCvSettingsField("headerContactSize", value ?? 10)} />
                                </SimpleGrid>
                              </Paper>
                              <Paper withBorder p="md" radius="lg" className="cv-typography-group">
                                <Text fw={800} mb="xs">Sections</Text>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                  <NumberInput label="Titre de section" min={11} max={22} step={0.1} value={cvDocument.settings.sectionTitleSize} onChange={(value) => updateCvSettingsField("sectionTitleSize", value ?? 16.3)} />
                                  <NumberInput label="Sous-titres / métas" min={8} max={14} step={0.1} value={cvDocument.settings.sectionSubtitleSize} onChange={(value) => updateCvSettingsField("sectionSubtitleSize", value ?? 10)} />
                                  <NumberInput label="Texte de section" min={8} max={14} step={0.1} value={cvDocument.settings.sectionTextSize} onChange={(value) => updateCvSettingsField("sectionTextSize", value ?? 11)} />
                                  <NumberInput label="Liens / preuves" min={7} max={13} step={0.1} value={cvDocument.settings.sectionLinkSize} onChange={(value) => updateCvSettingsField("sectionLinkSize", value ?? 9.24)} />
                                </SimpleGrid>
                              </Paper>
                              <Paper withBorder p="md" radius="lg" className="cv-typography-group">
                                <Text fw={800} mb="xs">Expériences et projets</Text>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                  <NumberInput label="Titre expérience" min={8} max={16} step={0.1} value={cvDocument.settings.experienceTitleSize} onChange={(value) => updateCvSettingsField("experienceTitleSize", value ?? 12)} />
                                  <NumberInput label="Texte expérience" min={8} max={14} step={0.1} value={cvDocument.settings.experienceTextSize} onChange={(value) => updateCvSettingsField("experienceTextSize", value ?? 11)} />
                                  <NumberInput label="Titre projet" min={8} max={16} step={0.1} value={cvDocument.settings.projectTitleSize} onChange={(value) => updateCvSettingsField("projectTitleSize", value ?? 12)} />
                                  <NumberInput label="Texte projet" min={8} max={14} step={0.1} value={cvDocument.settings.projectTextSize} onChange={(value) => updateCvSettingsField("projectTextSize", value ?? 11)} />
                                  <NumberInput label="Liens projet" min={7} max={13} step={0.1} value={cvDocument.settings.projectLinkSize} onChange={(value) => updateCvSettingsField("projectLinkSize", value ?? 10)} />
                                  <NumberInput label="Texte formation" min={8} max={14} step={0.1} value={cvDocument.settings.educationTextSize} onChange={(value) => updateCvSettingsField("educationTextSize", value ?? 10)} />
                                </SimpleGrid>
                              </Paper>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="layout" pt="md">
                            <Stack gap="lg">
                              <div>
                                <Text fw={800}>Mise en page contrôlée</Text>
                                <Text size="sm" c="dimmed">Structure, espacement, limites et bascule colonne gauche / droite sans casser le modèle LaTeX.</Text>
                              </div>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <Select
                                  label="Structure"
                                  data={[{ value: "two-column", label: "Deux colonnes" }, { value: "one-column", label: "Une colonne" }]}
                                  value={cvDocument.settings.layout}
                                  onChange={(value) => updateCvSettingsField("layout", value ?? "two-column")}
                                />
                                <NumberInput label="Largeur colonne gauche" min={25} max={45} step={0.1} value={cvDocument.settings.leftColumnWidth} onChange={(value) => updateCvSettingsField("leftColumnWidth", value ?? 33.8)} />
                                <NumberInput label="Scale contenu" min={0.68} max={0.9} step={0.01} value={cvDocument.settings.contentScale} onChange={(value) => updateCvSettingsField("contentScale", value ?? 0.74)} />
                                <NumberInput label="Padding header" min={6} max={22} step={0.5} value={cvDocument.settings.headerPadding} onChange={(value) => updateCvSettingsField("headerPadding", value ?? 12)} />
                              </SimpleGrid>
                              <Group>
                                <Button variant="light" onClick={compactCvOnOnePage}>Compacter sur une page</Button>
                                <Button variant="subtle" onClick={() => updateCvSettingsField("density", "detailed")}>Rendu détaillé</Button>
                                <Button variant="subtle" onClick={() => adjustCvSpacing(0.12)}>Augmenter l’espacement</Button>
                                <Button variant="subtle" onClick={() => adjustCvSpacing(-0.12)}>Réduire l’espacement</Button>
                                <Button variant={cvDocument.settings.reduceDescriptions ? "filled" : "light"} onClick={toggleReduceCvDescriptions}>Réduire descriptions longues</Button>
                              </Group>
                              <Divider />
                              <Text fw={800}>Limiter les contenus</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <NumberInput label="Limiter projets à N" min={1} max={12} value={cvDocument.settings.projectLimit} onChange={(value) => updateCvSettingsField("projectLimit", value ?? 4)} />
                                <NumberInput label="Limiter expériences à N" min={1} max={10} value={cvDocument.settings.experienceLimit} onChange={(value) => updateCvSettingsField("experienceLimit", value ?? 2)} />
                                <NumberInput label="Limiter compétences à N" min={4} max={40} value={cvDocument.settings.skillsLimit} onChange={(value) => updateCvSettingsField("skillsLimit", value ?? 16)} />
                                <NumberInput label="Bullets par bloc" min={1} max={8} value={cvDocument.settings.featuresLimit} onChange={(value) => updateCvSettingsField("featuresLimit", value ?? 4)} />
                              </SimpleGrid>
                              <Divider />
                              <Text fw={800}>Basculer les sections gauche / droite</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                {["languages", "skills", "qualities", "experiences", "projects", "education"].map((sectionKey) => (
                                  <Select
                                    key={sectionKey}
                                    label={cvSectionDefinitions.find((section) => section.key === sectionKey)?.label ?? sectionKey}
                                    data={[{ value: "left", label: "Colonne gauche" }, { value: "right", label: "Colonne droite" }]}
                                    value={cvDocument.settings.sectionColumns?.[sectionKey] ?? "right"}
                                    onChange={(value) => updateCvSectionColumn(sectionKey, value ?? "right")}
                                  />
                                ))}
                              </SimpleGrid>
                              <Divider />
                              <Text fw={800}>Adaptations rapides candidature</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                {cvTargetPresets.map((preset) => (
                                  <Button key={preset.key} variant="light" onClick={() => applyCvTargetPreset(preset)}>
                                    Mode {preset.label}
                                  </Button>
                                ))}
                              </SimpleGrid>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="assets" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Asset Manager CV</Text>
                                  <Text size="sm" c="dimmed">Photo, logos de formation et assets envoyés au backend pour une compilation LaTeX reproductible.</Text>
                                </div>
                                <Badge variant="light">{buildCvAssetsPayload(cvDocument).length} asset(s)</Badge>
                              </Group>
                              <Paper withBorder radius="lg" p="md" className="cv-asset-card">
                                <Group justify="space-between" align="flex-start">
                                  <div>
                                    <Text fw={800}>Photo du header</Text>
                                    <Text size="xs" c="dimmed">Fichier LaTeX : {cvDocument.profile.photoFilename || "idris.jpg"}</Text>
                                  </div>
                                  {cvDocument.profile.photoDataUrl ? <Badge color="green" variant="light">chargée</Badge> : <Badge color="yellow" variant="light">placeholder</Badge>}
                                </Group>
                                {cvDocument.profile.photoDataUrl && <img className="cv-asset-preview" src={cvDocument.profile.photoDataUrl} alt="Photo CV" />}
                                <FileInput mt="sm" label="Remplacer la photo" accept="image/png,image/jpeg,image/webp" onChange={importCvProfilePhoto} />
                              </Paper>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                {cvDocument.education.map((item, index) => (
                                  <Paper key={item.id} withBorder radius="lg" p="md" className="cv-asset-card">
                                    <Group justify="space-between" align="flex-start">
                                      <div>
                                        <Text fw={800}>{item.title}</Text>
                                        <Text size="xs" c="dimmed">{safeCvAssetFilename(item.logoFilename, inferSchoolDefaults(item, index).logoFilename)}</Text>
                                      </div>
                                      {item.logoDataUrl ? <Badge color="green" variant="light">logo chargé</Badge> : <Badge color="yellow" variant="light">placeholder</Badge>}
                                    </Group>
                                    {item.logoDataUrl && <img className="cv-asset-preview cv-asset-logo-preview" src={item.logoDataUrl} alt={item.organization || item.title} />}
                                    <FileInput mt="sm" label="Importer / remplacer le logo" accept="image/png,image/jpeg,image/webp" onChange={(file) => importCvEducationLogo(item, file)} />
                                  </Paper>
                                ))}
                              </SimpleGrid>
                              <Alert color="blue" variant="light">Le ZIP reproductible inclura main.tex, cv.pdf, compile.log, metadata.json et ces assets.</Alert>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="quality" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Contrôle qualité CV</Text>
                                  <Text size="sm" c="dimmed">Détection des risques de rendu, de contenu, d’assets manquants et de dépassement d’une page.</Text>
                                </div>
                                <Badge color={cvQualitySummary.score >= 80 ? "green" : cvQualitySummary.score >= 60 ? "yellow" : "red"} variant="light">Score {cvQualitySummary.score}/100</Badge>
                              </Group>
                              <Group>
                                <Button variant="light" onClick={runCvQualityCheck}>Analyser localement</Button>
                                <Button variant="subtle" onClick={runBackendCvQualityCheck} disabled={!selectedOwnerId || !selectedVersionId}>Analyse backend</Button>
                                <Button variant="light" onClick={smartCompactAndPreview}>Auto-compaction intelligente</Button>
                              </Group>
                              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                <Card withBorder radius="lg"><Text size="xs" c="dimmed">Pages estimées</Text><Text fw={900}>{cvQualitySummary.estimatedPages}</Text></Card>
                                <Card withBorder radius="lg"><Text size="xs" c="dimmed">Bloquants</Text><Text fw={900}>{cvQualitySummary.blockers?.length ?? 0}</Text></Card>
                                <Card withBorder radius="lg"><Text size="xs" c="dimmed">Alertes</Text><Text fw={900}>{cvQualitySummary.warnings?.length ?? 0}</Text></Card>
                              </SimpleGrid>
                              {[...(cvQualitySummary.blockers ?? []).map((text) => ["red", text]), ...(cvQualitySummary.warnings ?? []).map((text) => ["yellow", text]), ...(cvQualitySummary.suggestions ?? []).map((text) => ["blue", text])].map(([color, text], index) => (
                                <Alert key={`${color}-${index}`} color={color} variant="light">{text}</Alert>
                              ))}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="variants" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Variantes et historique applicatif</Text>
                                  <Text size="sm" c="dimmed">Sauvegarde locale de CV ciblés : Java Backend, offre spécifique, version compacte, etc.</Text>
                                </div>
                                <Badge variant="light">{cvVariants.length} variante(s)</Badge>
                              </Group>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput label="Nom de variante" value={cvVariantName} onChange={(event) => setCvVariantName(event.currentTarget.value)} />
                                <Select label="Variante existante" data={cvVariants.map((variant) => ({ value: variant.id, label: `${variant.name} · score ${variant.qualityScore ?? "?"}` }))} value={selectedCvVariantId} onChange={setSelectedCvVariantId} />
                              </SimpleGrid>
                              <Group>
                                <Button variant="light" onClick={() => createCvVariantSnapshot()}>Nouvelle variante</Button>
                                <Button variant="light" onClick={saveCurrentCvVariant}>Mettre à jour</Button>
                                <Button variant="subtle" onClick={() => loadCvVariant()} disabled={!selectedCvVariantId}>Charger</Button>
                                <Button variant="subtle" onClick={() => compareCvVariant()} disabled={!selectedCvVariantId}>Diff avec courant</Button>
                                <Button color="red" variant="light" onClick={() => deleteCvVariant()} disabled={!selectedCvVariantId}>Supprimer</Button>
                              </Group>
                              {cvDiffReport && (
                                <Paper withBorder radius="lg" p="md">
                                  <Text fw={800}>Diff avec {cvDiffReport.name}</Text>
                                  {cvDiffReport.changes.length > 0 ? cvDiffReport.changes.map((change, index) => (
                                    <Card key={`${change.label}-${index}`} withBorder radius="md" p="sm" mt="xs">
                                      <Text size="sm" fw={800}>{change.label}</Text>
                                      <Text size="xs" c="dimmed">{change.type}</Text>
                                    </Card>
                                  )) : <Alert color="green" variant="light" mt="sm">Aucune différence structurée détectée.</Alert>}
                                </Paper>
                              )}
                              <Divider />
                              <Text fw={800}>Presets de commandes</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput label="Nom du preset" value={cvPresetName} onChange={(event) => setCvPresetName(event.currentTarget.value)} />
                                <Button mt="xl" variant="light" onClick={saveCvCommandPreset}>Sauvegarder preset actuel</Button>
                              </SimpleGrid>
                              {cvCommandPresets.map((preset) => (
                                <Card key={preset.id} withBorder radius="md" p="sm">
                                  <Group justify="space-between">
                                    <Text fw={800}>{preset.name}</Text>
                                    <Button size="xs" variant="light" onClick={() => applyCvCommandPreset(preset)}>Appliquer</Button>
                                  </Group>
                                </Card>
                              ))}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="offer" pt="md">
                            <Stack gap="md">
                              <div>
                                <Text fw={800}>Analyse d’offre et adaptation par commandes</Text>
                                <Text size="sm" c="dimmed">Colle une offre : le Studio calcule un score, détecte les mots-clés manquants et applique des commandes structurées.</Text>
                              </div>
                              <Textarea minRows={8} label="Offre d’alternance" value={cvOfferText} onChange={(event) => setCvOfferText(event.currentTarget.value)} placeholder="Colle ici l'offre Java / Spring Boot / React / DevOps..." />
                              <Group>
                                <Button variant="light" onClick={analyzeCvOffer}>Analyser l’offre</Button>
                                <Button onClick={applyOfferRecommendations} disabled={!cvOfferText.trim()}>Appliquer les recommandations</Button>
                              </Group>
                              {cvOfferAnalysis && (
                                <Paper withBorder radius="lg" p="md">
                                  <Group justify="space-between"><Text fw={800}>Pertinence offre</Text><Badge color={cvOfferAnalysis.score >= 75 ? "green" : cvOfferAnalysis.score >= 45 ? "yellow" : "red"}>{cvOfferAnalysis.score}%</Badge></Group>
                                  <Text size="sm" mt="sm"><strong>Mots-clés trouvés :</strong> {cvOfferAnalysis.matched.join(", ") || "aucun"}</Text>
                                  <Text size="sm"><strong>Mots-clés manquants :</strong> {cvOfferAnalysis.missing.join(", ") || "aucun"}</Text>
                                  <Stack gap="xs" mt="sm">{cvOfferAnalysis.recommendations.map((item) => <Alert key={item} color="blue" variant="light">{item}</Alert>)}</Stack>
                                </Paper>
                              )}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="advanced" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Architecture avancée</Text>
                                  <Text size="sm" c="dimmed">Compilation asynchrone, cache backend, export ZIP reproductible et rapport de non-régression léger.</Text>
                                </div>
                                {cvAsyncJob && <Badge variant="light">{cvAsyncJob.status} · {cvAsyncJob.progress ?? 0}%</Badge>}
                              </Group>
                              <Group>
                                <Button variant="light" onClick={startAsyncCvPreview} disabled={!selectedOwnerId || !selectedVersionId}>Compiler en job asynchrone</Button>
                                <Button variant="light" onClick={exportCvReproducibleZip} disabled={!selectedOwnerId || !selectedVersionId}>Exporter ZIP reproductible</Button>
                                <Button variant="subtle" onClick={() => setCvRegressionReport({ status: "BASELINE", message: "Baseline locale enregistrée : compare les prochains rendus via les variantes et le score qualité." })}>Créer baseline visuelle</Button>
                              </Group>
                              {cvExportZipUrl && <Button component="a" href={cvExportZipUrl} target="_blank" rel="noreferrer" variant="filled">Télécharger le ZIP</Button>}
                              {cvAsyncJob && <Alert color={cvAsyncJob.status === "FAILED" ? "red" : cvAsyncJob.status === "SUCCESS" ? "green" : "blue"} variant="light">{cvAsyncJob.step || cvAsyncJob.message}</Alert>}
                              {cvRegressionReport && <Alert color="violet" variant="light">{cvRegressionReport.message}</Alert>}
                              <Alert color="gray" variant="light">Le backend garde un cache SHA-256 par source LaTeX + assets. Si tu recompiles le même CV, le PDF est réutilisé.</Alert>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="latex" pt="md">
                            <Stack gap="sm">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Source LaTeX générée</Text>
                                  <Text size="xs" c="dimmed">Tu peux encore éditer à la main avant compilation.</Text>
                                </div>
                                <Group gap="xs">
                                  <Badge variant="light">{Math.max(cvLatexSource.split("\n").length, 1)} lignes</Badge>
                                  {cvManualLatexDirty && <Badge color="yellow" variant="light">modifié à la main</Badge>}
                                  <Button size="xs" variant="light" onClick={generateLatexFromCvDocument}>Recalculer</Button>
                                </Group>
                              </Group>
                              <Switch
                                label="Template verrouillé : édition LaTeX directe désactivée"
                                checked={cvTemplateLocked}
                                onChange={(event) => updateTemplateLock(event.currentTarget.checked)}
                              />
                              <Textarea
                                className="cv-latex-editor"
                                minRows={22}
                                autosize={false}
                                readOnly={cvTemplateLocked}
                                value={cvLatexSource}
                                onChange={(event) => {
                                  if (cvTemplateLocked) return;
                                  setCvLatexSource(event.currentTarget.value);
                                  setCvManualLatexDirty(true);
                                }}
                              />
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="history" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <Text fw={800}>Historique des commandes</Text>
                                <Badge variant="light">{cvEditorState.past.length} undo · {cvEditorState.future.length} redo</Badge>
                              </Group>
                              {cvEditorState.commandLog.length > 0 ? cvEditorState.commandLog.map((command) => (
                                <Card key={command.id} withBorder radius="md" p="sm">
                                  <Group justify="space-between">
                                    <Text size="sm" fw={700}>{command.label}</Text>
                                    <Text size="xs" c="dimmed">{command.timestamp}</Text>
                                  </Group>
                                </Card>
                              )) : (
                                <Alert color="gray" variant="light">Aucune commande exécutée.</Alert>
                              )}
                              <Divider />
                              <Text fw={800}>Logs compilation</Text>
                              {cvCompileWarnings.length > 0 && (
                                <Alert color="yellow" variant="light">{cvCompileWarnings.join(" — ")}</Alert>
                              )}
                              <Textarea className="cv-logs-editor" minRows={12} autosize={false} readOnly value={cvCompileLogs} placeholder="Les logs latexmk / pdflatex apparaîtront ici." />
                            </Stack>
                          </Tabs.Panel>
                        </Tabs>
                      </Paper>

                      <Stack gap="lg">
                        <Paper withBorder p="lg" radius="lg" className="cv-live-preview-panel">
                          <Group justify="space-between" align="center" mb="md">
                            <div>
                              <Text fw={900}>Aperçu PDF</Text>
                              <Text size="sm" c="dimmed">Compile le LaTeX pour rafraîchir le rendu final.</Text>
                            </div>
                            {cvCurrentPdfUrl && (
                              <Group gap="xs">
                                <FilePreviewButton url={cvCurrentPdfUrl} label="Ouvrir" title="CV généré" mode="page" size="xs" variant="light" />
                                <Button component="a" href={cvCurrentPdfUrl} target="_blank" rel="noreferrer" size="xs" variant="subtle">Télécharger</Button>
                              </Group>
                            )}
                          </Group>

                          {cvCurrentPdfUrl ? (
                            <iframe className="cv-preview-frame" src={cvCurrentPdfUrl} title="Aperçu du CV PDF" />
                          ) : (
                            <div className="cv-preview-empty cv-preview-empty-advanced">
                              <Text fw={900}>Aucune preview compilée</Text>
                              <Text size="sm" c="dimmed" ta="center">L’éditeur a déjà généré une source LaTeX. Clique sur Compiler preview pour voir le PDF.</Text>
                            </div>
                          )}
                        </Paper>

                        <Paper withBorder p="lg" radius="lg" className="cv-mini-inspector">
                          <Stack gap="sm">
                            <Group justify="space-between">
                              <Text fw={900}>Inspecteur du document</Text>
                              <Badge variant="light">{cvDocument.settings.layout}</Badge>
                            </Group>
                            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Expériences</Text><Text fw={900}>{cvDocument.experiences.filter((item) => item.enabled !== false).length}</Text></Card>
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Formations</Text><Text fw={900}>{cvDocument.education.filter((item) => item.enabled !== false).length}</Text></Card>
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Projets</Text><Text fw={900}>{cvDocument.projects.filter((item) => item.enabled !== false).length}</Text></Card>
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Skills</Text><Text fw={900}>{cvDocument.skills.filter((item) => item.enabled !== false).length}</Text></Card>
                            </SimpleGrid>
                          </Stack>
                        </Paper>
                      </Stack>
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="profile" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Profil de la version sélectionnée</Text>
                    <Text size="sm" c="dimmed">
                      Les fichiers sont uploadés avant l’envoi du DTO profile.
                    </Text>
                  </div>
                  <Badge variant="light">Profil</Badge>
                </Group>

                <Divider />

                <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    <Stack gap="xs">
                      <FileInput label="Photo de profil" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={profileFiles.profileImage} onChange={(file) => setProfileFiles((current) => ({ ...current, profileImage: file }))} />
                      <FileLink label="Image actuelle" url={profileForm.profileImageUrl} />
                    </Stack>
                    <Stack gap="xs">
                      <FileInput label="Logo" placeholder="Uploader un logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={profileFiles.logo} onChange={(file) => setProfileFiles((current) => ({ ...current, logo: file }))} />
                      <FileLink label="Logo actuel" url={profileForm.logoUrl} />
                    </Stack>
                    <Stack gap="xs">
                      <FileInput label="CV PDF" placeholder="Uploader un PDF" accept="application/pdf" value={profileFiles.cv} onChange={(file) => setProfileFiles((current) => ({ ...current, cv: file }))} />
                      <FileLink label="CV actuel" url={profileForm.cvUrl} mode="page" />
                    </Stack>
                  </SimpleGrid>
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Job recherché / titre affiché" value={profileForm.title} onChange={(event) => updateProfileForm("title", event.currentTarget.value)} />
                  <TextInput label="Sous-titre" value={profileForm.subtitle} onChange={(event) => updateProfileForm("subtitle", event.currentTarget.value)} />
                  <TextInput label="Mots-clés affichés sous le titre" value={profileForm.headline} onChange={(event) => updateProfileForm("headline", event.currentTarget.value)} />
                  <TextInput label="Description courte" value={profileForm.shortDescription} onChange={(event) => updateProfileForm("shortDescription", event.currentTarget.value)} />
                  <TextInput label="Localisation" value={profileForm.location} onChange={(event) => updateProfileForm("location", event.currentTarget.value)} />
                  <TextInput label="Disponibilité" value={profileForm.availability} onChange={(event) => updateProfileForm("availability", event.currentTarget.value)} />
                  <TextInput label="Portfolio URL" value={profileForm.portfolioUrl} onChange={(event) => updateProfileForm("portfolioUrl", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description complète" minRows={5} value={profileForm.description} onChange={(event) => updateProfileForm("description", event.currentTarget.value)} />

                <Button onClick={saveProfile} disabled={!selectedOwnerId || !selectedVersionId}>
                  Enregistrer profil
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Timeline et expériences</Text>
                    <Text size="sm" c="dimmed">
                      Ajoute les expériences localement, puis sauvegarde la timeline complète.
                    </Text>
                  </div>
                  <Badge variant="light">Timeline</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Titre timeline" value={timelineForm.title} onChange={(event) => updateTimelineForm("title", event.currentTarget.value)} />
                  <TextInput label="Description timeline" value={timelineForm.description} onChange={(event) => updateTimelineForm("description", event.currentTarget.value)} />
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={800}>Nouvelle expérience</Text>
                      <Badge variant="light">Image uploadée</Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <Select label="Catégorie" data={experienceCategories} value={experienceForm.category} onChange={(value) => updateExperienceForm("category", value ?? "SCHOOL")} />
                      <TextInput label="Titre" value={experienceForm.title} onChange={(event) => updateExperienceForm("title", event.currentTarget.value)} />
                      <TextInput label="Organisation" value={experienceForm.organization} onChange={(event) => updateExperienceForm("organization", event.currentTarget.value)} />
                      <TextInput label="Localisation" value={experienceForm.location} onChange={(event) => updateExperienceForm("location", event.currentTarget.value)} />
                      <TextInput label="Date début" value={experienceForm.startDate} onChange={(event) => updateExperienceForm("startDate", event.currentTarget.value)} />
                      <TextInput label="Date fin" value={experienceForm.endDate} disabled={experienceForm.currentPosition} onChange={(event) => updateExperienceForm("endDate", event.currentTarget.value)} />
                      <FileInput label="Image expérience" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={experienceFiles.image} onChange={(file) => setExperienceFiles({ image: file })} />
                      <TextInput label="Site URL" value={experienceForm.websiteUrl} onChange={(event) => updateExperienceForm("websiteUrl", event.currentTarget.value)} />
                      <NumberInput label="Ordre d’affichage" value={experienceForm.displayOrder} onChange={(value) => updateExperienceForm("displayOrder", value ?? 1)} />
                      <TextInput label="Compétences séparées par des virgules" value={experienceForm.skills} onChange={(event) => updateExperienceForm("skills", event.currentTarget.value)} />
                    </SimpleGrid>

                    <Textarea label="Résumé" minRows={2} value={experienceForm.summary} onChange={(event) => updateExperienceForm("summary", event.currentTarget.value)} />
                    <Textarea label="Description" minRows={4} value={experienceForm.description} onChange={(event) => updateExperienceForm("description", event.currentTarget.value)} />
                    <Checkbox label="Poste actuel" checked={experienceForm.currentPosition} onChange={(event) => updateExperienceForm("currentPosition", event.currentTarget.checked)} />

                    <Group>
                      <Button variant="light" onClick={addExperienceLocally}>Ajouter expérience localement</Button>
                      <Button onClick={saveTimeline} disabled={!selectedOwnerId || !selectedVersionId}>Enregistrer timeline complète</Button>
                    </Group>
                  </Stack>
                </Paper>

                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={800}>Expériences de la timeline</Text>
                    <Badge variant="light">{experiences.length}</Badge>
                  </Group>

                  {experiences.map((experience, index) => (
                    <Card key={`${experience.title}-${index}`} withBorder padding="md" radius="lg" className="admin-list-card">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={700}>{experience.displayOrder}. {experience.title}</Text>
                          <Text size="sm" c="dimmed">{experience.organization} — {experience.category}</Text>
                          <Text size="sm">{experience.summary}</Text>
                          {experience.imageUrl && <FileLink label="Image" url={experience.imageUrl} />}
                        </div>
                        <Button size="xs" color="red" variant="light" onClick={() => removeExperience(index)}>Retirer</Button>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="project" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Projets de la version</Text>
                    <Text size="sm" c="dimmed">
                      Affiche, sélectionne, modifie ou supprime chaque projet de la version sélectionnée.
                    </Text>
                  </div>
                  <Badge variant="light">Projets</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" className="admin-project-editor-grid">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={800}>Liste des projets</Text>
                      <Group gap="xs">
                        <Badge variant="light">{projects.length}</Badge>
                        <Button size="xs" variant="light" onClick={() => resetProjectForm()}>
                          Nouveau
                        </Button>
                      </Group>
                    </Group>

                    {projects.length === 0 && (
                      <Alert variant="light">
                        Aucun projet dans cette version pour le moment.
                      </Alert>
                    )}

                    {projects.map((project) => {
                      const projectId = getProjectId(project);
                      const isSelected = String(projectId) === String(selectedProjectId);

                      return (
                        <Card
                          key={projectId}
                          withBorder
                          padding="md"
                          radius="lg"
                          className={`admin-list-card admin-project-row ${isSelected ? "is-selected" : ""}`}
                        >
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                              <Group gap="xs">
                                <Text fw={800}>{project.displayOrder ?? "—"}. {project.title}</Text>
                                {project.featured && <Badge color="cyan" variant="light">Featured</Badge>}
                                {!project.published && <Badge color="gray" variant="light">Draft</Badge>}
                              </Group>
                              <Text size="sm" c="dimmed">{project.subtitle}</Text>
                              <Text size="xs" c="dimmed">
                                {(project.stacks ?? []).slice(0, 5).join(" · ")}
                              </Text>
                              <Group gap="xs">
                                {project.imageUrl && <FileLink label="Image" url={project.imageUrl} />}
                                {project.documentationUrl && <FileLink label="Doc" url={project.documentationUrl} />}
                              </Group>
                            </Stack>

                            <Stack gap="xs" align="flex-end">
                              <Button size="xs" variant={isSelected ? "filled" : "light"} onClick={() => selectProject(String(projectId))}>
                                Modifier
                              </Button>
                              <Button size="xs" variant="subtle" onClick={() => {
                                const copiedProject = hydrateProjectForm(project);
                                setProjectMode("create");
                                setSelectedProjectId(null);
                                setProjectForm({
                                  ...copiedProject,
                                  title: copiedProject.title
                                    ? `${copiedProject.title} — copie`
                                    : emptyProjectForm.title,
                                  displayOrder: projects.length + 1,
                                });
                                setProjectFiles(emptyProjectFiles);
                              }}>
                                Copier
                              </Button>
                            </Stack>
                          </Group>
                        </Card>
                      );
                    })}
                  </Stack>

                  <Stack gap="lg">
                    <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>{projectMode === "edit" ? "Modifier le projet" : "Ajouter un projet"}</Text>
                          <Text size="sm" c="dimmed">
                            {projectMode === "edit"
                              ? `Projet sélectionné : ${selectedProject?.title ?? selectedProjectId}`
                              : "Le nouveau projet sera ajouté à la version courante."}
                          </Text>
                        </div>
                        <Badge color={projectMode === "edit" ? "blue" : "green"} variant="light">
                          {projectMode === "edit" ? "édition" : "création"}
                        </Badge>
                      </Group>

                      <Divider my="md" />

                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Stack gap="xs">
                          <FileInput label="Image du projet" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={projectFiles.image} onChange={(file) => setProjectFiles((current) => ({ ...current, image: file }))} />
                          <FileLink label="Image actuelle" url={projectForm.imageUrl} />
                        </Stack>
                        <Stack gap="xs">
                          <FileInput label="Documentation PDF" placeholder="Uploader un PDF" accept="application/pdf" value={projectFiles.documentation} onChange={(file) => setProjectFiles((current) => ({ ...current, documentation: file }))} />
                          <FileLink label="Documentation actuelle" url={projectForm.documentationUrl} />
                        </Stack>
                      </SimpleGrid>
                    </Paper>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <TextInput label="Titre" value={projectForm.title} onChange={(event) => updateProjectForm("title", event.currentTarget.value)} />
                      <TextInput label="Sous-titre" value={projectForm.subtitle} onChange={(event) => updateProjectForm("subtitle", event.currentTarget.value)} />
                      <Select label="Statut" data={projectStatuses} value={projectForm.status} onChange={(value) => updateProjectForm("status", value ?? "IN_PROGRESS")} />
                      <NumberInput label="Ordre d’affichage" value={projectForm.displayOrder} onChange={(value) => updateProjectForm("displayOrder", value ?? 1)} />
                      <TextInput label="Date début" value={projectForm.startDate} onChange={(event) => updateProjectForm("startDate", event.currentTarget.value)} />
                      <TextInput label="Date fin" value={projectForm.endDate} onChange={(event) => updateProjectForm("endDate", event.currentTarget.value)} />
                      <TextInput label="Demo URL" value={projectForm.demoUrl} onChange={(event) => updateProjectForm("demoUrl", event.currentTarget.value)} />
                      <TextInput label="GitHub URL" value={projectForm.githubUrl} onChange={(event) => updateProjectForm("githubUrl", event.currentTarget.value)} />
                      <TextInput label="Architecture URL" value={projectForm.architectureUrl} onChange={(event) => updateProjectForm("architectureUrl", event.currentTarget.value)} />
                      <TextInput label="Stacks séparées par des virgules" value={projectForm.stacks} onChange={(event) => updateProjectForm("stacks", event.currentTarget.value)} />
                      <TextInput label="Features séparées par des virgules" value={projectForm.features} onChange={(event) => updateProjectForm("features", event.currentTarget.value)} />
                    </SimpleGrid>

                    <Textarea label="Description courte" minRows={2} value={projectForm.shortDescription} onChange={(event) => updateProjectForm("shortDescription", event.currentTarget.value)} />
                    <Textarea label="Description complète" minRows={5} value={projectForm.description} onChange={(event) => updateProjectForm("description", event.currentTarget.value)} />

                    <Group>
                      <Checkbox label="Featured" checked={projectForm.featured} onChange={(event) => updateProjectForm("featured", event.currentTarget.checked)} />
                      <Checkbox label="Published" checked={projectForm.published} onChange={(event) => updateProjectForm("published", event.currentTarget.checked)} />
                    </Group>

                    <Group>
                      {projectMode === "edit" ? (
                        <>
                          <Button onClick={updateProject} disabled={!selectedOwnerId || !selectedVersionId || !selectedProjectId}>
                            Enregistrer les modifications
                          </Button>
                          <Button color="red" variant="light" onClick={deleteProject} disabled={!selectedProjectId}>
                            Supprimer ce projet
                          </Button>
                          <Button variant="subtle" onClick={() => resetProjectForm()}>
                            Repasser en création
                          </Button>
                        </>
                      ) : (
                        <Button onClick={addProject} disabled={!selectedOwnerId || !selectedVersionId}>
                          Ajouter projet à la version
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>

      <Modal
        opened={jsonEditorOpened}
        onClose={() => setJsonEditorOpened(false)}
        size="95vw"
        centered
        radius="xl"
        zIndex={13000}
        overlayProps={{ opacity: 0.6, blur: 12 }}
        className="json-editor-modal"
        title={
          <Group gap="sm">
            <Badge variant="light" className="json-editor-file-badge">.json</Badge>
            <Text fw={900}>Éditeur JSON de la version courante</Text>
          </Group>
        }
      >
        <Stack gap="md" className="json-editor-shell">
          <Group justify="space-between" align="flex-start" gap="md" className="json-editor-toolbar">
            <div>
              <Text fw={800}>Export, correction et sauvegarde directe</Text>
              <Text size="sm" c="dimmed">
                Modifie le même format que l’import JSON. L’enregistrement remplace le contenu de la version sélectionnée : métadonnées, profil, timeline et projets.
              </Text>
            </div>
            <Group gap="xs">
              <Badge color={jsonEditorStatusColor} variant="light">
                {jsonEditorAnalysis.label}
              </Badge>
              <Badge variant="light">{jsonEditorLineCount} lignes</Badge>
              <Badge variant="light">{jsonEditorSizeKb} Ko</Badge>
              {selectedVersion?.active && <Badge color="green" variant="light">Active</Badge>}
            </Group>
          </Group>

          <Group justify="space-between" align="center" gap="sm" className="json-editor-actionbar">
            <Group gap="xs">
              <Badge color={jsonEditorStatusColor} variant="filled">
                Analyse live
              </Badge>
              <Text size="sm" fw={700} className="json-editor-diagnostic-text">
                {jsonEditorDiagnosticMessage}
              </Text>
            </Group>

            <Group gap="xs" className="json-editor-action-buttons">
              <Button
                variant="subtle"
                onClick={() => handleJsonEditorTextChange(formatJsonPayload(buildCurrentVersionJsonPayload()))}
              >
                Recharger depuis formulaire
              </Button>
              <Button variant="light" onClick={formatJsonEditorText}>
                Indenter / formater JSON
              </Button>
              <Button variant="light" onClick={downloadJsonEditorText} disabled={!jsonEditorAnalysis.valid}>
                Télécharger ce JSON
              </Button>
              <Button
                color="green"
                onClick={saveJsonEditorToCurrentVersion}
                loading={loading}
                disabled={!jsonEditorCanUpdate}
              >
                Mettre à jour la version actuelle
              </Button>
            </Group>
          </Group>

          {jsonEditorError && (
            <Alert color="red" variant="light" className="admin-alert">
              {jsonEditorError}
            </Alert>
          )}

          <JsonCodeEditor
            value={jsonEditorText}
            onChange={handleJsonEditorTextChange}
            highlightRef={jsonHighlightRef}
            lineNumbersRef={jsonLineNumbersRef}
            analysis={jsonEditorAnalysis}
          />

          <Group justify="space-between" align="center" className="json-editor-footer">
            <Text size="xs" c="dimmed">
              Les fichiers restent des URL dans le JSON. Pour remplacer physiquement une image ou un PDF, garde les champs d’upload existants.
            </Text>
            <Text size="xs" fw={800} c={jsonEditorAnalysis.valid ? "green" : "red"}>
              {jsonEditorAnalysis.valid ? "Prêt à sauvegarder" : "Sauvegarde bloquée tant que le JSON est invalide"}
            </Text>
          </Group>
        </Stack>
      </Modal>
    </main>
  );
}
