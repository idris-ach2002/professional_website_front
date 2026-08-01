import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readMedia(query) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

export default function useResponsiveProfile() {
  const [profile, setProfile] = useState(() => ({
    isMobile: readMedia(MOBILE_QUERY),
    reducedMotion: readMedia(REDUCED_MOTION_QUERY),
  }));

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setProfile({ isMobile: mobile.matches, reducedMotion: reduced.matches });

    mobile.addEventListener?.("change", update);
    reduced.addEventListener?.("change", update);
    update();

    return () => {
      mobile.removeEventListener?.("change", update);
      reduced.removeEventListener?.("change", update);
    };
  }, []);

  return profile;
}
