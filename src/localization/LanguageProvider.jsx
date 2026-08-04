import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./languageContext";
import { UI_MESSAGES, SUPPORTED_LANGUAGES } from "./uiMessages";

const LANGUAGE_STORAGE_KEY = "portfolio-language";

function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "fr";
}

function readInitialLanguage() {
  if (typeof window === "undefined") return "fr";
  const urlLanguage = new URLSearchParams(window.location.search).get("lang");
  if (SUPPORTED_LANGUAGES.includes(urlLanguage)) return urlLanguage;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    // The language preference is optional.
  }
  return window.navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

function interpolate(message, variables = {}) {
  return String(message).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
  ));
}

function updateLanguageInUrl(language) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (language === "fr") url.searchParams.delete("lang");
  else url.searchParams.set("lang", language);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function localizePath(path, language) {
  if (!path || /^(https?:|mailto:|tel:|blob:|data:)/i.test(path)) return path;
  const base = typeof window === "undefined" ? "https://portfolio.local" : window.location.origin;
  const url = new URL(path, base);
  if (language === "fr") url.searchParams.delete("lang");
  else url.searchParams.set("lang", language);
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
      const value = new URLSearchParams(window.location.search).get("lang");
      setLanguageState(SUPPORTED_LANGUAGES.includes(value) ? value : "fr");
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
