const CONTACT_TYPE_ALIASES = {
  PHONE: "PHONE_NUMBER",
  TELEPHONE: "PHONE_NUMBER",
  TEL: "PHONE_NUMBER",
  MAIL: "EMAIL",
  EMAIL_ADDRESS: "EMAIL",
  WEB: "WEBSITE",
  SITE: "WEBSITE",
  X: "TWITTER",
};

const CONTACT_TYPES = new Set([
  "EMAIL",
  "PHONE_NUMBER",
  "WHATSAPP",
  "LINKEDIN",
  "GITHUB",
  "PORTFOLIO",
  "WEBSITE",
  "TWITTER",
  "FACEBOOK",
  "INSTAGRAM",
]);

const EXPERIENCE_CATEGORIES = new Set([
  "SCHOOL",
  "INTERNSHIP",
  "ALTERNANCE",
  "VOLUNTEERING",
  "CDI",
  "CDD",
]);

const PROJECT_STATUSES = new Set([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "MAINTAINED",
  "ARCHIVED",
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asBoolean(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "oui", "published", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "non", "draft", "inactive"].includes(normalized)) return false;
  return fallback;
}

function asNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function asDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pick(source, keys, fallback = "") {
  if (!isObject(source)) return fallback;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  return fallback;
}

function normalizeContactType(type) {
  const rawType = String(type ?? "EMAIL").trim().toUpperCase();
  const normalizedType = CONTACT_TYPE_ALIASES[rawType] ?? rawType;
  return CONTACT_TYPES.has(normalizedType) ? normalizedType : "WEBSITE";
}

function normalizeContacts(contacts) {
  const contactRows = Array.isArray(contacts) ? contacts : [];

  return contactRows
    .map((contact) => ({
      type: normalizeContactType(contact?.type),
      value: asString(contact?.value ?? contact?.url ?? contact?.href).trim(),
    }))
    .filter((contact) => contact.value.length > 0);
}

function normalizeLink(link) {
  if (!isObject(link)) return null;

  const url = asString(link.url ?? link.href ?? link.value).trim();
  if (!url) return null;

  return {
    type: asString(link.type ?? link.kind ?? "OTHER").trim().toUpperCase() || "OTHER",
    label: asString(link.label ?? link.title ?? link.type ?? "Lien").trim() || "Lien",
    url,
  };
}

function normalizeProjectLinks(project) {
  const directLinks = [
    project.githubUrl && { type: "GITHUB", label: "GitHub", url: project.githubUrl },
    project.architectureUrl && {
      type: "ARCHITECTURE",
      label: "Architecture",
      url: project.architectureUrl,
    },
    project.documentationUrl && {
      type: "DOCUMENTATION",
      label: "Documentation",
      url: project.documentationUrl,
    },
  ].filter(Boolean);

  const customLinks = Array.isArray(project.links)
    ? project.links.map(normalizeLink).filter(Boolean)
    : [];

  const seen = new Set();
  return [...directLinks, ...customLinks].filter((link) => {
    const key = `${link.type}:${link.url}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeExperience(experience, index) {
  const category = asString(experience?.category ?? "SCHOOL").trim().toUpperCase();
  const currentPosition = asBoolean(experience?.currentPosition, false);

  return {
    category: EXPERIENCE_CATEGORIES.has(category) ? category : "SCHOOL",
    title: asString(experience?.title).trim(),
    organization: asString(experience?.organization ?? experience?.company ?? experience?.school).trim(),
    location: asString(experience?.location).trim(),
    summary: asString(experience?.summary ?? experience?.shortDescription).trim(),
    description: asString(experience?.description).trim(),
    startDate: asDate(experience?.startDate ?? experience?.from),
    endDate: currentPosition ? null : asDate(experience?.endDate ?? experience?.to) || null,
    currentPosition,
    imageUrl: asString(experience?.imageUrl ?? experience?.logoUrl).trim(),
    websiteUrl: asString(experience?.websiteUrl ?? experience?.url).trim(),
    skills: asArray(experience?.skills ?? experience?.stacks),
    displayOrder: asNumber(experience?.displayOrder ?? experience?.order, index + 1),
  };
}

function normalizeProject(project, index) {
  const status = asString(project?.status ?? "IN_PROGRESS").trim().toUpperCase();
  const links = normalizeProjectLinks(project ?? {});

  return {
    title: asString(project?.title).trim(),
    subtitle: asString(project?.subtitle).trim(),
    shortDescription: asString(project?.shortDescription ?? project?.summary).trim(),
    description: asString(project?.description).trim(),
    status: PROJECT_STATUSES.has(status) ? status : "IN_PROGRESS",
    startDate: asDate(project?.startDate ?? project?.from),
    endDate: asDate(project?.endDate ?? project?.to) || null,
    imageUrl: asString(project?.imageUrl ?? project?.coverUrl).trim(),
    demoUrl: asString(project?.demoUrl ?? project?.liveUrl).trim(),
    githubUrl: asString(project?.githubUrl ?? project?.repositoryUrl).trim(),
    documentationUrl: asString(project?.documentationUrl ?? project?.docUrl ?? project?.docsUrl).trim(),
    stacks: asArray(project?.stacks ?? project?.stack ?? project?.technologies),
    features: asArray(project?.features ?? project?.functionalities),
    links,
    featured: asBoolean(project?.featured, false),
    published: asBoolean(project?.published, true),
    displayOrder: asNumber(project?.displayOrder ?? project?.order, index + 1),
    websiteVersionId: project?.websiteVersionId ?? null,
  };
}

export function normalizeAdminPortfolioJson(rawPayload) {
  if (!isObject(rawPayload)) {
    throw new Error("Le fichier JSON doit contenir un objet racine.");
  }

  const profile = rawPayload.prof ?? rawPayload.profile ?? {};
  const timeline = rawPayload.timeline ?? {};
  const experiences = Array.isArray(timeline.experiences)
    ? timeline.experiences.map(normalizeExperience)
    : [];
  const projects = Array.isArray(rawPayload.projects)
    ? rawPayload.projects.map(normalizeProject)
    : [];

  const versionObject = isObject(rawPayload.version) ? rawPayload.version : {};
  const versionTag = asString(pick(rawPayload, ["versionTag"], versionObject.versionTag ?? "v1")).trim();
  const versionLabel = asString(
    pick(rawPayload, ["versionLabel", "label"], versionObject.label ?? "Version importée"),
  ).trim();
  const versionDescription = asString(
    pick(
      rawPayload,
      ["versionDescription", "description"],
      versionObject.description ?? "Version générée depuis un import JSON.",
    ),
  ).trim();
  const versionPublished = asBoolean(
    pick(rawPayload, ["versionPublished", "published"], versionObject.published),
    true,
  );
  const versionActive = asBoolean(
    pick(rawPayload, ["versionActive", "activeVersion"], versionObject.active),
    false,
  );

  const contacts = normalizeContacts(rawPayload.contacts);

  return {
    ownerForm: {
      name: asString(rawPayload.name).trim(),
      firstName: asString(rawPayload.firstName).trim(),
      age: asNumber(rawPayload.age, 0),
      active: asBoolean(rawPayload.active, true),
      address: asString(rawPayload.address).trim(),
      contacts,
      versionTag,
      versionLabel,
      versionDescription,
      versionPublished,
    },
    versionForm: {
      versionTag,
      label: versionLabel,
      description: versionDescription,
      active: versionActive,
      published: versionPublished,
    },
    profileForm: {
      title: asString(profile.title).trim(),
      subtitle: asString(profile.subtitle).trim(),
      headline: asString(profile.headline).trim(),
      shortDescription: asString(profile.shortDescription).trim(),
      description: asString(profile.description).trim(),
      location: asString(profile.location).trim(),
      availability: asString(profile.availability).trim(),
      profileImageUrl: asString(profile.profileImageUrl).trim(),
      logoUrl: asString(profile.logoUrl).trim(),
      cvUrl: asString(profile.cvUrl).trim(),
      portfolioUrl: asString(profile.portfolioUrl).trim(),
    },
    timelineForm: {
      title: asString(timeline.title).trim(),
      description: asString(timeline.description).trim(),
    },
    experiences,
    projects,
    summary: {
      contacts: contacts.length,
      experiences: experiences.length,
      projects: projects.length,
      featuredProjects: projects.filter((project) => project.featured).length,
      publishedProjects: projects.filter((project) => project.published).length,
      versionTag,
      versionLabel,
    },
  };
}
