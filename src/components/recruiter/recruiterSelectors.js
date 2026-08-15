import {
  buildProvenSkills,
  getFeaturedProjects,
  getProjectSlug,
  getPublicProjects,
  sortByDisplayOrder,
} from "../../utils/portfolio";

const TECHNICAL_TERMS = [
  "java", "spring", "react", "python", "postgres", "sql", "api", "backend", "frontend",
  "symfony", "twig", "docker", "kubernetes", "redis", "rabbit", "elastic", "grafana",
  "linux", "tcp", "ais", "nmea", "webgl", "opengl", "three", "canvas", "vite", "flyway",
  "jpa", "hibernate", "maven", "git", "test", "playwright", "vitest", "ci", "cloudflare",
  "worker", "data", "pipeline", "architecture", "logiciel", "software", "database",
];

const STACK_GROUPS = [
  {
    id: "backend",
    labelKey: "recruiter.techBackend",
    terms: ["java", "spring", "spring boot", "symfony", "api", "rest", "jpa", "hibernate", "maven", "flyway"],
  },
  {
    id: "frontend",
    labelKey: "recruiter.techFrontend",
    terms: ["react", "mantine", "twig", "tailwind", "three", "three.js", "gsap", "canvas", "webgl", "javafx", "opengl", "jogl"],
  },
  {
    id: "data",
    labelKey: "recruiter.techData",
    terms: ["postgres", "postgresql", "sql", "python", "data", "pipeline", "tcp", "ais", "nmea", "csv"],
  },
  {
    id: "platform",
    labelKey: "recruiter.techPlatform",
    terms: ["docker", "kubernetes", "linux", "systemd", "git", "github", "cloudflare", "worker", "workers", "playwright", "vitest", "test", "ci", "vite"],
  },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function containsTerm(value, term) {
  return normalize(value).includes(term);
}

function isTechnicalExperience(experience) {
  const searchable = [
    experience?.title,
    experience?.organization,
    experience?.summary,
    experience?.description,
    ...(experience?.skills ?? []),
  ].join(" ");

  return TECHNICAL_TERMS.some((term) => containsTerm(searchable, term));
}

function experienceScore(experience) {
  const categoryScore = {
    ALTERNANCE: 12,
    INTERNSHIP: 11,
    CDI: 4,
    CDD: 2,
    FREELANCE: 7,
    VOLUNTEER: 1,
  }[experience?.category] ?? 0;

  const technicalScore = isTechnicalExperience(experience) ? 12 : 0;
  const technicalSkills = (experience?.skills ?? []).filter((skill) =>
    TECHNICAL_TERMS.some((term) => containsTerm(skill, term)),
  ).length;

  return categoryScore + technicalScore + Math.min(technicalSkills, 8);
}

export function selectRecruiterExperiences(owner) {
  const experiences = sortByDisplayOrder(owner?.timeline?.experiences ?? [])
    .filter((experience) => experience?.category !== "SCHOOL");

  return [...experiences]
    .sort((left, right) => {
      const scoreDelta = experienceScore(right) - experienceScore(left);
      if (scoreDelta !== 0) return scoreDelta;
      return (left?.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right?.displayOrder ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 3);
}

export function selectRecruiterEducation(owner) {
  return sortByDisplayOrder(owner?.timeline?.experiences ?? [])
    .filter((experience) => experience?.category === "SCHOOL");
}

export function selectRecruiterProjects(owner) {
  const publicProjects = getPublicProjects(sortByDisplayOrder(owner?.projects ?? []));
  return [...getFeaturedProjects(publicProjects), ...publicProjects]
    .filter((project, index, list) =>
      list.findIndex((item) => getProjectSlug(item) === getProjectSlug(project)) === index,
    )
    .slice(0, 3);
}

export function selectRecruiterSkills(owner) {
  const projects = owner?.projects ?? [];
  const experiences = owner?.timeline?.experiences ?? [];
  const configuredSkills = Array.isArray(owner?.provenSkills) ? owner.provenSkills : [];
  return configuredSkills.length > 0 ? configuredSkills : buildProvenSkills(projects, experiences);
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function selectRecruiterTechGroups(owner) {
  const projects = getPublicProjects(owner?.projects ?? []);
  const projectStacks = projects.flatMap((project) => project?.stacks ?? []);
  const experienceSkills = (owner?.timeline?.experiences ?? [])
    .filter(isTechnicalExperience)
    .flatMap((experience) => experience?.skills ?? []);
  const candidates = uniqueValues([...projectStacks, ...experienceSkills]);

  return STACK_GROUPS.map((group) => ({
    ...group,
    items: candidates
      .filter((candidate) => group.terms.some((term) => containsTerm(candidate, term)))
      .slice(0, 10),
  })).filter((group) => group.items.length > 0);
}
