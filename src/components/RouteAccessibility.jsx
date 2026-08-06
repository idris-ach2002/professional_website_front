import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import useLanguage from "../localization/useLanguage";

export function SkipToContent() {
  const { t } = useLanguage();

  return (
    <a className="skip-to-content" href="#main-content">
      {t("accessibility.skipToContent")}
    </a>
  );
}

export function RouteFocusManager() {
  const location = useLocation();
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return undefined;
    }

    if (location.hash) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById("main-content");
      const target = main?.querySelector("h1") ?? main;
      if (!target) return;

      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: false });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname, location.search]);

  return null;
}
