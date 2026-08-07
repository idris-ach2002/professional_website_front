import { useEffect, useState } from "react";
import AnimationPreferencesContext from "./animationPreferencesContextValue";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const STORAGE_KEY = "portfolio-animation-preference";
const PAUSE_STORAGE_KEY = "portfolio-animation-paused";
const VALID_PREFERENCES = new Set(["auto", "full", "reduced", "off"]);


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

function resolvePerformanceMode(preference, automaticMode, systemReducedMotion) {
  if (systemReducedMotion) return "ultra-lite";
  if (preference === "full") return "full";
  if (preference === "reduced") return "lite";
  if (preference === "off") return "ultra-lite";
  return automaticMode;
}

export default function AnimationPreferencesProvider({ children }) {
  const [browserSignals] = useState(readBrowserSignals);
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const [paused, setPausedState] = useState(readStoredPaused);
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
  const performanceMode = resolvePerformanceMode(preference, automaticMode, mediaState.systemReducedMotion);
  const animationsEnabled = performanceMode !== "ultra-lite";
  const animationsPaused = animationsEnabled && paused;
  const ultraLite = performanceMode === "ultra-lite";

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, preference); } catch { /* storage is optional */ }
  }, [preference]);

  useEffect(() => {
    try { window.localStorage.setItem(PAUSE_STORAGE_KEY, String(paused)); } catch { /* storage is optional */ }
  }, [paused]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.performanceProfile = performanceMode;
    root.dataset.animationPreference = preference;
    root.dataset.animationState = animationsEnabled ? (animationsPaused ? "paused" : "running") : "off";
    root.dataset.gpuTier = gpuTier;
    root.dataset.browserEngine = browserSignals.isFirefox ? "firefox" : "other";
    root.classList.toggle("is-firefox", browserSignals.isFirefox);
    root.classList.toggle("is-gecko", browserSignals.isGecko);
    root.classList.toggle("is-mobile-profile", mediaState.isMobile);
    return () => {
      delete root.dataset.performanceProfile;
      delete root.dataset.animationPreference;
      delete root.dataset.animationState;
      delete root.dataset.gpuTier;
      delete root.dataset.browserEngine;
      root.classList.remove("is-firefox", "is-gecko", "is-mobile-profile");
    };
  }, [animationsEnabled, animationsPaused, browserSignals.isFirefox, browserSignals.isGecko, gpuTier, mediaState.isMobile, performanceMode, preference]);

  const value = {
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
  };

  return <AnimationPreferencesContext.Provider value={value}>{children}</AnimationPreferencesContext.Provider>;
}
