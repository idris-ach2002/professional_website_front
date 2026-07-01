import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { inferClickEvent, trackPortfolioEvent } from "../services/analyticsApi";

function projectSlugFromPath(pathname) {
  const match = pathname.match(/^\/projects\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AnalyticsTracker({ source }) {
  const location = useLocation();
  const previousKeyRef = useRef(null);

  useEffect(() => {
    if (source === "demo") return;
    if (location.pathname.startsWith("/admin")) return;

    const key = `${location.pathname}${location.search}`;
    if (previousKeyRef.current === key) return;
    previousKeyRef.current = key;

    const projectSlug = projectSlugFromPath(location.pathname);

    window.setTimeout(() => {
      trackPortfolioEvent({
        eventType: projectSlug ? "project_view" : "page_view",
        pagePath: key,
        projectSlug,
      });
    }, 300);
  }, [location.pathname, location.search, source]);

  useEffect(() => {
    function handleDocumentClick(event) {
      const anchor = event.target?.closest?.("a[href]");
      const inferredEvent = inferClickEvent(anchor);
      if (!inferredEvent) return;
      trackPortfolioEvent(inferredEvent);
    }

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => document.removeEventListener("click", handleDocumentClick, { capture: true });
  }, []);

  return null;
}
