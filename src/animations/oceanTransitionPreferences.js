export const OCEAN_TRANSITION_PREFERENCE_KEYS = Object.freeze({
  MASTER: "master",
  PROFILE_TIMELINE: "profileTimeline",
  TIMELINE_VOLCANO: "timelineVolcano",
  TIMELINE_PROJECTS: "timelineProjects",
  VOLCANO_PROJECTS: "volcanoProjects",
  PROJECTS_OUTRO: "projectsOutro",
});

export const DEFAULT_OCEAN_TRANSITION_PREFERENCES = Object.freeze({
  [OCEAN_TRANSITION_PREFERENCE_KEYS.MASTER]: true,
  [OCEAN_TRANSITION_PREFERENCE_KEYS.PROFILE_TIMELINE]: true,
  [OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_VOLCANO]: true,
  [OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_PROJECTS]: true,
  [OCEAN_TRANSITION_PREFERENCE_KEYS.VOLCANO_PROJECTS]: true,
  [OCEAN_TRANSITION_PREFERENCE_KEYS.PROJECTS_OUTRO]: true,
});

export const OCEAN_TRANSITION_CONTROLS = Object.freeze([
  Object.freeze({
    key: OCEAN_TRANSITION_PREFERENCE_KEYS.PROFILE_TIMELINE,
    labelKey: "animations.transition.profileTimeline",
    descriptionKey: "animations.transition.profileTimelineDescription",
  }),
  Object.freeze({
    key: OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_VOLCANO,
    labelKey: "animations.transition.timelineVolcano",
    descriptionKey: "animations.transition.timelineVolcanoDescription",
  }),
  Object.freeze({
    key: OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_PROJECTS,
    labelKey: "animations.transition.timelineProjects",
    descriptionKey: "animations.transition.timelineProjectsDescription",
  }),
  Object.freeze({
    key: OCEAN_TRANSITION_PREFERENCE_KEYS.VOLCANO_PROJECTS,
    labelKey: "animations.transition.volcanoProjects",
    descriptionKey: "animations.transition.volcanoProjectsDescription",
  }),
  Object.freeze({
    key: OCEAN_TRANSITION_PREFERENCE_KEYS.PROJECTS_OUTRO,
    labelKey: "animations.transition.projectsOutro",
    descriptionKey: "animations.transition.projectsOutroDescription",
  }),
]);

const SCENE_TO_PREFERENCE = Object.freeze({
  "surface-deep": OCEAN_TRANSITION_PREFERENCE_KEYS.PROFILE_TIMELINE,
  "deep-surface": OCEAN_TRANSITION_PREFERENCE_KEYS.PROFILE_TIMELINE,
  "deep-caldera": OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_VOLCANO,
  "caldera-deep": OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_VOLCANO,
  "deep-projects": OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_PROJECTS,
  "projects-deep": OCEAN_TRANSITION_PREFERENCE_KEYS.TIMELINE_PROJECTS,
  "caldera-projects": OCEAN_TRANSITION_PREFERENCE_KEYS.VOLCANO_PROJECTS,
  "projects-caldera": OCEAN_TRANSITION_PREFERENCE_KEYS.VOLCANO_PROJECTS,
  "projects-outro": OCEAN_TRANSITION_PREFERENCE_KEYS.PROJECTS_OUTRO,
  "outro-projects": OCEAN_TRANSITION_PREFERENCE_KEYS.PROJECTS_OUTRO,
});

export function normalizeOceanTransitionPreferences(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_OCEAN_TRANSITION_PREFERENCES).map(([key, fallback]) => [
      key,
      typeof source[key] === "boolean" ? source[key] : fallback,
    ]),
  );
}

export function preferenceKeyForOceanScene(sceneKey) {
  return SCENE_TO_PREFERENCE[sceneKey] ?? null;
}

export function isOceanTransitionEnabled(preferences, sceneKey) {
  const normalized = normalizeOceanTransitionPreferences(preferences);
  if (!normalized.master) return false;
  const preferenceKey = preferenceKeyForOceanScene(sceneKey);
  return preferenceKey ? normalized[preferenceKey] !== false : true;
}
