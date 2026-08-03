import { useEffect, useMemo, useState } from "react";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readMedia(query) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function readBrowserSignals() {
  if (typeof navigator === "undefined") {
    return {
      isFirefox: false,
      isGecko: false,
      lowPowerDevice: false,
      hardwareConcurrency: 8,
      deviceMemory: null,
    };
  }

  const userAgent = navigator.userAgent ?? "";
  const isFirefox = /Firefox|FxiOS/i.test(userAgent);
  const isGecko = /Firefox/i.test(userAgent) && !/Seamonkey/i.test(userAgent);
  const hardwareConcurrency = Number(navigator.hardwareConcurrency || 8);
  const deviceMemory = Number.isFinite(Number(navigator.deviceMemory))
    ? Number(navigator.deviceMemory)
    : null;
  const lowPowerDevice = hardwareConcurrency <= 4 || (deviceMemory !== null && deviceMemory <= 4);

  return {
    isFirefox,
    isGecko,
    lowPowerDevice,
    hardwareConcurrency,
    deviceMemory,
  };
}

function resolvePerformanceMode({ isMobile, reducedMotion, isFirefox, lowPowerDevice }) {
  if (isMobile || reducedMotion) return "lite";
  if (isFirefox || lowPowerDevice) return "balanced";
  return "full";
}

export default function useResponsiveProfile() {
  const browserSignals = useMemo(readBrowserSignals, []);
  const [mediaState, setMediaState] = useState(() => ({
    isMobile: readMedia(MOBILE_QUERY),
    reducedMotion: readMedia(REDUCED_MOTION_QUERY),
  }));

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setMediaState({ isMobile: mobile.matches, reducedMotion: reduced.matches });

    mobile.addEventListener?.("change", update);
    reduced.addEventListener?.("change", update);
    update();

    return () => {
      mobile.removeEventListener?.("change", update);
      reduced.removeEventListener?.("change", update);
    };
  }, []);

  const performanceMode = resolvePerformanceMode({ ...mediaState, ...browserSignals });
  const profile = {
    ...mediaState,
    ...browserSignals,
    performanceMode,
  };

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.performanceProfile = performanceMode;
    root.dataset.browserEngine = browserSignals.isFirefox ? "firefox" : "other";
    root.classList.toggle("is-firefox", browserSignals.isFirefox);
    root.classList.toggle("is-gecko", browserSignals.isGecko);
    root.classList.toggle("is-mobile-profile", mediaState.isMobile);

    return () => {
      delete root.dataset.performanceProfile;
      delete root.dataset.browserEngine;
      root.classList.remove("is-firefox", "is-gecko", "is-mobile-profile");
    };
  }, [browserSignals.isFirefox, browserSignals.isGecko, mediaState.isMobile, performanceMode]);

  return profile;
}
