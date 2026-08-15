function node(key, label, type = "item", children = []) {
  return { key, label, type, children };
}

export const ITEM_VISIBILITY_TREE = Object.freeze([
  node("global", "Éléments globaux", "group", [
    node("global.navbar", "Navbar principale", "section", [
      node("global.navbar.profile", "À propos"),
      node("global.navbar.journey", "Expérience"),
      node("global.navbar.projects", "Réalisations"),
      node("global.navbar.skills", "Expertise"),
      node("global.navbar.architecture", "Architecture"),
      node("global.navbar.contact", "Contact"),
      node("global.navbar.recruiter", "Vue recruteur"),
      node("global.navbar.animations", "Animations"),
      node("global.navbar.language", "Langue"),
      node("global.navbar.cv", "Télécharger CV"),
    ]),
    node("global.ambient", "Scénographie globale", "section", [
      node("global.ambient.background", "Fond océan"),
      node("global.ambient.aquarium", "Aquarium global"),
      node("global.ambient.transitions", "Transitions océaniques"),
    ]),
  ]),
  node("home", "Accueil", "route", [
    node("home.status", "État des données"),
    node("home.owner-selector", "Sélecteur de profil"),
    node("home.profile", "Présentation", "section", [
      node("home.profile.headline", "Carte titre"),
      node("home.profile.lead", "Carte introduction"),
      node("home.profile.description", "Carte description"),
      node("home.profile.panel", "Panneau profil"),
    ]),
    node("home.skills", "Expertise prouvée", "section"),
    node("home.timeline", "Parcours", "section"),
    node("home.volcano", "Scène volcan"),
    node("home.projects", "Réalisations", "section"),
    node("home.footer", "Contact / footer"),
  ]),
  node("recruiter", "Vue recruteur", "route", [
    node("recruiter.hero", "Introduction"),
    node("recruiter.facts", "Indicateurs rapides"),
    node("recruiter.skills", "Compétences", "section"),
    node("recruiter.experience", "Expériences", "section"),
    node("recruiter.projects", "Projets", "section"),
    node("recruiter.education", "Formation", "section"),
    node("recruiter.contact", "Contact"),
  ]),
  node("cv", "Route CV", "route", [node("cv.heading", "En-tête CV"), node("cv.actions", "Actions CV"), node("cv.preview", "Aperçu CV")]),
  node("project", "Étude de cas", "route", [
    node("project.hero", "Hero projet"),
    node("project.summary", "Résumé recruteur"),
    node("project.navigation", "Navigation interne"),
    node("project.evidence", "Preuves"),
    node("project.map", "Contenu détaillé"),
    node("project.stack", "Stack technique"),
    node("project.resources", "Ressources"),
    node("project.footer", "Footer"),
  ]),
  node("architecture", "Architecture", "route", [
    node("architecture.system", "System", "view", [
      node("architecture.system.toolbar", "Filtres et contrôles"),
      node("architecture.system.graph", "Graphe dynamique"),
      node("architecture.system.analysis", "Analyse de topologie"),
    ]),
    node("architecture.trace", "Live Trace", "view", [
      node("architecture.trace.controls", "Sélection de requête"),
      node("architecture.trace.automaton", "Automate d'exécution"),
      node("architecture.trace.request", "Requête capturée"),
      node("architecture.trace.waterfall", "Chronologie HTTP"),
      node("architecture.trace.analysis", "Analyse de trace"),
    ]),
    node("architecture.performance", "Performance", "view", [
      node("architecture.performance.toolbar", "Contrôles du profiler"),
      node("architecture.performance.summary", "Résumé live"),
      node("architecture.performance.timeline", "Timeline profiler"),
      node("architecture.performance.hot-path", "Pression dominante"),
      node("architecture.performance.events", "Événements"),
      node("architecture.performance.statistics", "Statistiques"),
      node("architecture.performance.histograms", "Histogrammes"),
      node("architecture.performance.budgets", "Budgets"),
      node("architecture.performance.history", "Historique builds"),
      node("architecture.performance.analysis", "Analyse performance"),
    ]),
  ]),
]);

function slugIdentity(value, fallback = "unknown") {
  return String(value ?? fallback).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

export function projectVisibilityKey(project) {
  const identity = project?.slug ?? project?.projectSlug ?? project?.id ?? project?.projectId ?? project?.title ?? "unknown";
  return `home.projects.item:${slugIdentity(identity)}`;
}

export function experienceVisibilityKey(experience, index = 0) {
  const identity = experience?.id ?? experience?.experienceId ?? `${experience?.organization ?? "experience"}-${experience?.title ?? index}`;
  return `home.timeline.item:${slugIdentity(identity)}`;
}

export function skillVisibilityKey(skill, scope = "home.skills") {
  const identity = skill?.id ?? skill?.key ?? skill?.shortLabel ?? skill?.label ?? "skill";
  return `${scope}.item:${slugIdentity(identity, "skill")}`;
}

export function recruiterProjectVisibilityKey(project) {
  const identity = project?.slug ?? project?.projectSlug ?? project?.id ?? project?.projectId ?? project?.title ?? "project";
  return `recruiter.projects.item:${slugIdentity(identity, "project")}`;
}

export function recruiterExperienceVisibilityKey(experience, index = 0) {
  const identity = experience?.id ?? experience?.experienceId ?? `${experience?.organization ?? "experience"}-${experience?.title ?? index}`;
  return `recruiter.experience.item:${slugIdentity(identity, `experience-${index}`)}`;
}

export function buildAdminVisibilityTree({ projects = [], experiences = [], skills = [] } = {}) {
  const clone = (item) => ({ ...item, children: (item.children ?? []).map(clone) });
  const tree = ITEM_VISIBILITY_TREE.map(clone);
  const home = tree.find((item) => item.key === "home");
  const projectsNode = home?.children.find((item) => item.key === "home.projects");
  const timelineNode = home?.children.find((item) => item.key === "home.timeline");
  const skillsNode = home?.children.find((item) => item.key === "home.skills");
  const recruiter = tree.find((item) => item.key === "recruiter");
  const recruiterSkillsNode = recruiter?.children.find((item) => item.key === "recruiter.skills");
  const recruiterExperienceNode = recruiter?.children.find((item) => item.key === "recruiter.experience");
  const recruiterProjectsNode = recruiter?.children.find((item) => item.key === "recruiter.projects");
  if (projectsNode) {
    projectsNode.children = projects.map((project) => node(projectVisibilityKey(project), project?.title || "Projet", "dynamic"));
  }
  if (timelineNode) {
    timelineNode.children = experiences.map((experience, index) => node(experienceVisibilityKey(experience, index), experience?.organization || experience?.title || `Expérience ${index + 1}`, "dynamic"));
  }
  if (skillsNode) {
    skillsNode.children = skills.map((skill) => node(skillVisibilityKey(skill), skill?.label || "Compétence", "dynamic"));
  }
  if (recruiterSkillsNode) {
    recruiterSkillsNode.children = skills.map((skill) => node(skillVisibilityKey(skill, "recruiter.skills"), skill?.label || "Compétence", "dynamic"));
  }
  if (recruiterExperienceNode) {
    recruiterExperienceNode.children = experiences.map((experience, index) => node(recruiterExperienceVisibilityKey(experience, index), experience?.organization || experience?.title || `Expérience ${index + 1}`, "dynamic"));
  }
  if (recruiterProjectsNode) {
    recruiterProjectsNode.children = projects.map((project) => node(recruiterProjectVisibilityKey(project), project?.title || "Projet", "dynamic"));
  }
  return tree;
}

export function flattenVisibilityTree(tree = ITEM_VISIBILITY_TREE) {
  const result = [];
  const walk = (items, depth = 0) => items.forEach((item) => {
    result.push({ ...item, depth });
    walk(item.children ?? [], depth + 1);
  });
  walk(tree);
  return result;
}
