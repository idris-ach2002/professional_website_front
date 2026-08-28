import { useEffect, useMemo, useState } from "react";
import AnimationPreferencesContext from "./animationPreferencesContextValue";
import {
  DEFAULT_OCEAN_TRANSITION_PREFERENCES,
  normalizeOceanTransitionPreferences,
} from "../animations/oceanTransitionPreferences";

const MOBILE_QUERY = "(max-width: 820px), (hover: none) and (pointer: coarse) and (max-width: 1366px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const STORAGE_KEY = "portfolio-animation-preference";
const PAUSE_STORAGE_KEY = "portfolio-animation-paused";
const TRANSITION_STORAGE_KEY = "portfolio-animation-transitions-v1";
const SCENE_STORAGE_KEY = "portfolio-animation-scenes-v1";
const VALID_PREFERENCES = new Set(["auto", "full", "reduced", "off"]);
const VALID_VOLCANO_MODES = new Set(["auto", "animated", "static", "off"]);
const VALID_VOLCANO_QUALITIES = new Set(["auto", "eco", "balanced", "high"]);
const VALID_MOTION_MODES = new Set(["auto", "animated", "static"]);
const VALID_PROFILE_FRAME_INTENSITIES = new Set(["subtle", "elegant", "expressive"]);

const DEFAULT_SCENE_PREFERENCES = Object.freeze({
  volcanoMode: "auto",
  volcanoQuality: "auto",
  volcanoEffects: Object.freeze({
    smoke: true,
    embers: true,
    bubbles: true,
    debris: true,
  }),
  navbarMotion: "auto",
  profileMotion: "auto",
  profileFrame: Object.freeze({
    reflection: true,
    parallax: true,
    featherMotion: true,
    intensity: "elegant",
  }),
});

function cloneDefaultScenePreferences() {
  return {
    ...DEFAULT_SCENE_PREFERENCES,
    volcanoEffects: { ...DEFAULT_SCENE_PREFERENCES.volcanoEffects },
    profileFrame: { ...DEFAULT_SCENE_PREFERENCES.profileFrame },
  };
}

function normalizeScenePreferences(value) {
  const source = value && typeof value === "object" ? value : {};
  const effects = source.volcanoEffects && typeof source.volcanoEffects === "object"
    ? source.volcanoEffects
    : {};
  const profileFrame = source.profileFrame && typeof source.profileFrame === "object"
    ? source.profileFrame
    : {};
  return {
    volcanoMode: VALID_VOLCANO_MODES.has(source.volcanoMode) ? source.volcanoMode : "auto",
    volcanoQuality: VALID_VOLCANO_QUALITIES.has(source.volcanoQuality) ? source.volcanoQuality : "auto",
    volcanoEffects: {
      smoke: effects.smoke !== false,
      embers: effects.embers !== false,
      bubbles: effects.bubbles !== false,
      debris: effects.debris !== false,
    },
    navbarMotion: VALID_MOTION_MODES.has(source.navbarMotion) ? source.navbarMotion : "auto",
    profileMotion: VALID_MOTION_MODES.has(source.profileMotion) ? source.profileMotion : "auto",
    profileFrame: {
      reflection: profileFrame.reflection !== false,
      parallax: profileFrame.parallax !== false,
      featherMotion: profileFrame.featherMotion !== false,
      intensity: VALID_PROFILE_FRAME_INTENSITIES.has(profileFrame.intensity)
        ? profileFrame.intensity
        : "elegant",
    },
  };
}

function readMedia(query) {
  return typeof window !== "undefined" && window.matchMedia?.(query).matches;
}

function readStoredPreference() {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.has(stored) ? stored : "auto";
  } catch {
    return "auto";
  }
}

function readStoredPaused() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PAUSE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function readStoredTransitionPreferences() {
  if (typeof window === "undefined") return { ...DEFAULT_OCEAN_TRANSITION_PREFERENCES };
  try {
    const stored = window.localStorage.getItem(TRANSITION_STORAGE_KEY);
    return normalizeOceanTransitionPreferences(stored ? JSON.parse(stored) : null);
  } catch {
    return { ...DEFAULT_OCEAN_TRANSITION_PREFERENCES };
  }
}

function readStoredScenePreferences() {
  if (typeof window === "undefined") return cloneDefaultScenePreferences();
  try {
    const stored = window.localStorage.getItem(SCENE_STORAGE_KEY);
    return normalizeScenePreferences(stored ? JSON.parse(stored) : null);
  } catch {
    return cloneDefaultScenePreferences();
  }
}

function readBrowserSignals() {
  if (typeof navigator === "undefined") {
    return { isFirefox: false, isGecko: false, hardwareConcurrency: 8, deviceMemory: null, lowPowerDevice: false };
  }
  const userAgent = navigator.userAgent ?? "";
  const hardwareConcurrency = Number(navigator.hardwareConcurrency || 8);
  const deviceMemory = Number.isFinite(Number(navigator.deviceMemory)) ? Number(navigator.deviceMemory) : null;
  return {
    isFirefox: /Firefox|FxiOS/i.test(userAgent),
    isGecko: /Firefox/i.test(userAgent) && !/Seamonkey/i.test(userAgent),
    hardwareConcurrency,
    deviceMemory,
    lowPowerDevice: hardwareConcurrency <= 4 || (deviceMemory !== null && deviceMemory <= 4),
  };
}

function fallbackGpuTier(browserSignals) {
  if (browserSignals.lowPowerDevice) return "low";
  if (browserSignals.hardwareConcurrency >= 8 && (browserSignals.deviceMemory === null || browserSignals.deviceMemory >= 8)) return "high";
  return "medium";
}

function resolveAutomaticMode({ isMobile, systemReducedMotion, isFirefox, lowPowerDevice, gpuTier }) {
  if (systemReducedMotion) return "ultra-lite";
  if (isMobile || lowPowerDevice || gpuTier === "low") return "lite";
  if (isFirefox || gpuTier === "medium") return "balanced";
  return "full";
}

function resolvePerformanceMode(preference, automaticMode, systemReducedMotion, isMobile, lowPowerDevice) {
  if (systemReducedMotion) return "ultra-lite";
  if (preference === "off") return "ultra-lite";
  if (preference === "reduced") return "lite";
  if (preference === "full") {
    if (isMobile || lowPowerDevice) return "lite";
    return "full";
  }
  return automaticMode;
}

function resolveEffectiveVolcanoMode({
  requested,
  animationsEnabled,
  isMobile,
  systemReducedMotion,
  performanceMode,
}) {
  if (!animationsEnabled || requested === "off") return "off";
  if (requested === "static") return "static";
  if (systemReducedMotion) return "static";

  // Mobile keeps the original zero-GPU default. An explicit user request may
  // reveal the scene, but it is clamped to a static SVG for thermal safety.
  if (isMobile) return requested === "auto" ? "off" : "static";
  if (["lite", "ultra-lite"].includes(performanceMode)) return requested === "auto" ? "off" : "static";
  return "animated";
}

function resolveEffectiveVolcanoQuality(requested, performanceMode) {
  if (requested !== "auto") return requested;
  if (performanceMode === "full") return "high";
  if (performanceMode === "balanced") return "balanced";
  return "eco";
}

function resolveEffectiveMotionMode({ requested, animationsEnabled, animationsPaused, isMobile, systemReducedMotion, performanceMode }) {
  if (!animationsEnabled || animationsPaused || systemReducedMotion || isMobile) return "static";
  if (requested === "static") return "static";
  if (["lite", "ultra-lite"].includes(performanceMode)) return "static";
  return "animated";
}

export default function AnimationPreferencesProvider({ children }) {
  const [browserSignals] = useState(readBrowserSignals);
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const [paused, setPausedState] = useState(readStoredPaused);
  const [transitionPreferences, setTransitionPreferencesState] = useState(readStoredTransitionPreferences);
  const [scenePreferences, setScenePreferencesState] = useState(readStoredScenePreferences);
  const [mediaState, setMediaState] = useState(() => ({
    isMobile: readMedia(MOBILE_QUERY),
    systemReducedMotion: readMedia(REDUCED_MOTION_QUERY),
  }));
  const [gpuTier, setGpuTier] = useState(() => fallbackGpuTier(browserSignals));

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setMediaState({ isMobile: mobile.matches, systemReducedMotion: reduced.matches });
    mobile.addEventListener?.("change", update);
    reduced.addEventListener?.("change", update);
    return () => {
      mobile.removeEventListener?.("change", update);
      reduced.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const adapterPromise = navigator?.gpu?.requestAdapter?.({ powerPreference: "low-power" });
    if (!adapterPromise?.then) return undefined;
    adapterPromise.then((adapter) => {
      if (cancelled || !adapter) return;
      const textureSize = Number(adapter.limits?.maxTextureDimension2D || 0);
      if (textureSize > 0 && textureSize < 8192) setGpuTier("low");
      else if (textureSize >= 16384 && !browserSignals.lowPowerDevice) setGpuTier("high");
      else setGpuTier("medium");
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [browserSignals.lowPowerDevice]);

  const automaticMode = resolveAutomaticMode({ ...mediaState, ...browserSignals, gpuTier });
  const performanceMode = resolvePerformanceMode(
    preference,
    automaticMode,
    mediaState.systemReducedMotion,
    mediaState.isMobile,
    browserSignals.lowPowerDevice,
  );
  const animationsEnabled = performanceMode !== "ultra-lite";
  const animationsPaused = animationsEnabled && paused;
  const ultraLite = performanceMode === "ultra-lite";

  const effectiveVolcanoMode = resolveEffectiveVolcanoMode({
    requested: scenePreferences.volcanoMode,
    animationsEnabled,
    isMobile: mediaState.isMobile,
    systemReducedMotion: mediaState.systemReducedMotion,
    performanceMode,
  });
  const effectiveVolcanoQuality = resolveEffectiveVolcanoQuality(scenePreferences.volcanoQuality, performanceMode);
  const effectiveNavbarMotion = resolveEffectiveMotionMode({
    requested: scenePreferences.navbarMotion,
    animationsEnabled,
    animationsPaused,
    isMobile: mediaState.isMobile,
    systemReducedMotion: mediaState.systemReducedMotion,
    performanceMode,
  });
  const effectiveProfileMotion = resolveEffectiveMotionMode({
    requested: scenePreferences.profileMotion,
    animationsEnabled,
    animationsPaused,
    isMobile: mediaState.isMobile,
    systemReducedMotion: mediaState.systemReducedMotion,
    performanceMode,
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, preference); } catch { /* storage is optional */ }
  }, [preference]);

  useEffect(() => {
    try { window.localStorage.setItem(PAUSE_STORAGE_KEY, String(paused)); } catch { /* storage is optional */ }
  }, [paused]);

  useEffect(() => {
    try { window.localStorage.setItem(TRANSITION_STORAGE_KEY, JSON.stringify(transitionPreferences)); } catch { /* storage is optional */ }
  }, [transitionPreferences]);

  useEffect(() => {
    try { window.localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(scenePreferences)); } catch { /* storage is optional */ }
  }, [scenePreferences]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.performanceProfile = performanceMode;
    root.dataset.animationPreference = preference;
    root.dataset.animationState = animationsEnabled ? (animationsPaused ? "paused" : "running") : "off";
    root.dataset.gpuTier = gpuTier;
    root.dataset.browserEngine = browserSignals.isFirefox ? "firefox" : "other";
    root.dataset.volcanoMode = effectiveVolcanoMode;
    root.dataset.volcanoQuality = effectiveVolcanoQuality;
    root.dataset.navbarMotion = effectiveNavbarMotion;
    root.dataset.profileMotion = effectiveProfileMotion;
    root.classList.toggle("is-firefox", browserSignals.isFirefox);
    root.classList.toggle("is-gecko", browserSignals.isGecko);
    root.classList.toggle("is-mobile-profile", mediaState.isMobile);
    return () => {
      delete root.dataset.performanceProfile;
      delete root.dataset.animationPreference;
      delete root.dataset.animationState;
      delete root.dataset.gpuTier;
      delete root.dataset.browserEngine;
      delete root.dataset.volcanoMode;
      delete root.dataset.volcanoQuality;
      delete root.dataset.navbarMotion;
      delete root.dataset.profileMotion;
      root.classList.remove("is-firefox", "is-gecko", "is-mobile-profile");
    };
  }, [
    animationsEnabled,
    animationsPaused,
    browserSignals.isFirefox,
    browserSignals.isGecko,
    effectiveNavbarMotion,
    effectiveProfileMotion,
    effectiveVolcanoMode,
    effectiveVolcanoQuality,
    gpuTier,
    mediaState.isMobile,
    performanceMode,
    preference,
  ]);

  const value = useMemo(() => ({
    ...browserSignals,
    ...mediaState,
    reducedMotion: mediaState.systemReducedMotion,
    preference,
    setPreference: (nextPreference) => {
      if (VALID_PREFERENCES.has(nextPreference)) setPreferenceState(nextPreference);
    },
    paused,
    setPaused: setPausedState,
    togglePaused: () => setPausedState((current) => !current),
    automaticMode,
    performanceMode,
    animationsEnabled,
    animationsPaused,
    ultraLite,
    gpuTier,
    transitionPreferences,
    setTransitionEnabled: (key, enabled) => {
      if (!(key in DEFAULT_OCEAN_TRANSITION_PREFERENCES)) return;
      setTransitionPreferencesState((current) => ({ ...current, [key]: Boolean(enabled) }));
    },
    resetTransitionPreferences: () => setTransitionPreferencesState({ ...DEFAULT_OCEAN_TRANSITION_PREFERENCES }),
    scenePreferences,
    effectiveVolcanoMode,
    effectiveVolcanoQuality,
    effectiveNavbarMotion,
    effectiveProfileMotion,
    setVolcanoMode: (mode) => {
      if (!VALID_VOLCANO_MODES.has(mode)) return;
      setScenePreferencesState((current) => ({ ...current, volcanoMode: mode }));
    },
    setVolcanoQuality: (quality) => {
      if (!VALID_VOLCANO_QUALITIES.has(quality)) return;
      setScenePreferencesState((current) => ({ ...current, volcanoQuality: quality }));
    },
    setVolcanoEffect: (effect, enabled) => {
      if (!(effect in DEFAULT_SCENE_PREFERENCES.volcanoEffects)) return;
      setScenePreferencesState((current) => ({
        ...current,
        volcanoEffects: { ...current.volcanoEffects, [effect]: Boolean(enabled) },
      }));
    },
    setNavbarMotion: (mode) => {
      if (!VALID_MOTION_MODES.has(mode)) return;
      setScenePreferencesState((current) => ({ ...current, navbarMotion: mode }));
    },
    setProfileMotion: (mode) => {
      if (!VALID_MOTION_MODES.has(mode)) return;
      setScenePreferencesState((current) => ({ ...current, profileMotion: mode }));
    },
    setProfileFrameEffect: (effect, enabled) => {
      if (!(effect in DEFAULT_SCENE_PREFERENCES.profileFrame) || effect === "intensity") return;
      setScenePreferencesState((current) => ({
        ...current,
        profileFrame: { ...current.profileFrame, [effect]: Boolean(enabled) },
      }));
    },
    setProfileFrameIntensity: (intensity) => {
      if (!VALID_PROFILE_FRAME_INTENSITIES.has(intensity)) return;
      setScenePreferencesState((current) => ({
        ...current,
        profileFrame: { ...current.profileFrame, intensity },
      }));
    },
    resetScenePreferences: () => setScenePreferencesState(cloneDefaultScenePreferences()),
  }), [
    animationsEnabled,
    animationsPaused,
    automaticMode,
    browserSignals,
    effectiveNavbarMotion,
    effectiveProfileMotion,
    effectiveVolcanoMode,
    effectiveVolcanoQuality,
    gpuTier,
    mediaState,
    paused,
    performanceMode,
    preference,
    scenePreferences,
    transitionPreferences,
    ultraLite,
  ]);

  return <AnimationPreferencesContext.Provider value={value}>{children}</AnimationPreferencesContext.Provider>;
}
