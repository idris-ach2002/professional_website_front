import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./languageContext";
import { UI_MESSAGES, SUPPORTED_LANGUAGES } from "./uiMessages";

const LANGUAGE_STORAGE_KEY = "portfolio-language";
const ENGLISH_PREFIX = "/en";

function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "fr";
}

function languageFromPath(pathname = "/") {
  return pathname === ENGLISH_PREFIX || pathname.startsWith(`${ENGLISH_PREFIX}/`) ? "en" : null;
}

function stripLanguagePrefix(pathname = "/") {
  if (pathname === ENGLISH_PREFIX) return "/";
  if (pathname.startsWith(`${ENGLISH_PREFIX}/`)) return pathname.slice(ENGLISH_PREFIX.length) || "/";
  return pathname || "/";
}

function prefixPath(pathname, language) {
  const normalizedPath = stripLanguagePrefix(pathname);
  if (language !== "en") return normalizedPath;
  return normalizedPath === "/" ? ENGLISH_PREFIX : `${ENGLISH_PREFIX}${normalizedPath}`;
}

function readInitialLanguage() {
  if (typeof window === "undefined") return "fr";

  const pathLanguage = languageFromPath(window.location.pathname);
  if (pathLanguage) return pathLanguage;

  const urlLanguage = new URLSearchParams(window.location.search).get("lang");
  if (SUPPORTED_LANGUAGES.includes(urlLanguage)) return urlLanguage;

  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    // The language preference is optional.
  }
  return "fr";
}

function interpolate(message, variables = {}) {
  return String(message).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
  ));
}

function updateLanguageInUrl(language) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.pathname = prefixPath(url.pathname, language);
  url.searchParams.delete("lang");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
}

function localizePath(path, language) {
  if (!path || /^(https?:|mailto:|tel:|blob:|data:)/i.test(path)) return path;

  const base = typeof window === "undefined" ? "https://portfolio.local" : window.location.origin;
  const url = new URL(path, base);
  const legacyLanguage = url.searchParams.get("lang");
  const resolvedLanguage = legacyLanguage === "en" ? "en" : language;

  url.pathname = prefixPath(url.pathname, resolvedLanguage);
  url.searchParams.delete("lang");
  return `${url.pathname}${url.search}${url.hash}`;
}

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    setLanguageState(normalized);
    updateLanguageInUrl(normalized);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    } catch {
      // The site still works when localStorage is disabled.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handlePopState = () => {
      const pathLanguage = languageFromPath(window.location.pathname);
      const queryLanguage = new URLSearchParams(window.location.search).get("lang");
      setLanguageState(pathLanguage ?? (SUPPORTED_LANGUAGES.includes(queryLanguage) ? queryLanguage : "fr"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const t = useCallback((key, variables = {}) => {
    const fallback = variables.fallback;
    const message = UI_MESSAGES[language]?.[key] ?? UI_MESSAGES.fr[key] ?? fallback ?? key;
    return interpolate(message, variables);
  }, [language]);

  const localizedPath = useCallback((path) => localizePath(path, language), [language]);

  const value = useMemo(() => ({
    language,
    locale: language === "en" ? "en-GB" : "fr-FR",
    setLanguage,
    t,
    localizedPath,
  }), [language, localizedPath, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
