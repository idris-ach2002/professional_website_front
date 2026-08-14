import { useCallback, useEffect, useMemo, useState } from "react";
import ItemVisibilityContext from "./itemVisibilityContext";
import { useItemVisibility } from "./useItemVisibility";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SHOULD_USE_DIRECT_BACKEND = !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = SHOULD_USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";



function normalizeHidden(payload) {
  return new Set(Object.entries(payload?.items ?? {}).filter(([, visible]) => visible === false).map(([key]) => key));
}

export function ItemVisibilityProvider({ children }) {
  const [hidden, setHidden] = useState(() => new Set());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/website/items-visibility`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setHidden(normalizeHidden(await response.json()));
    } catch {
      // Visibility is fail-open: a configuration outage must never blank the site.
      setHidden(new Set());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 30000);
    const onVisibility = () => { if (!document.hidden) refresh(); };
    const onPublished = () => refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("portfolio:visibility-updated", onPublished);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("portfolio:visibility-updated", onPublished);
    };
  }, [refresh]);

  const isVisible = useCallback((key) => {
    if (!key) return true;
    const parts = String(key).toLowerCase().split(".");
    for (let index = 1; index <= parts.length; index += 1) {
      if (hidden.has(parts.slice(0, index).join("."))) return false;
    }
    return !hidden.has(String(key).toLowerCase());
  }, [hidden]);

  const value = useMemo(() => ({ ready, hidden, isVisible, refresh }), [hidden, isVisible, ready, refresh]);
  return <ItemVisibilityContext.Provider value={value}>{children}</ItemVisibilityContext.Provider>;
}


export function VisibilityGate({ item, children, fallback = null }) {
  const { isVisible } = useItemVisibility();
  return isVisible(item) ? children : fallback;
}
