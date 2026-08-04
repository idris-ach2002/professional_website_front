const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SHOULD_USE_DIRECT_BACKEND =
  !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = SHOULD_USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";

const REQUEST_TIMEOUT = 9000;
const RETRY_REQUEST_TIMEOUT = 4500;
const REQUEST_RETRY_DELAY = 450;
const PORTFOLIO_CACHE_VERSION = 3;

const inFlightPortfolioRequests = new Map();

class PortfolioHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "PortfolioHttpError";
    this.status = status;
  }
}

function normalizeLocale(locale) {
  return locale === "en" ? "en" : "fr";
}

function cacheKey(locale) {
  return `portfolio:last-known-good:v${PORTFOLIO_CACHE_VERSION}:${normalizeLocale(locale)}`;
}

function withLocale(path, locale) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}locale=${encodeURIComponent(normalizeLocale(locale))}`;
}

function sleep(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function shouldRetry(error) {
  if (error?.name === "AbortError") return true;
  if (error instanceof PortfolioHttpError) return error.status >= 500;
  return true;
}

async function requestJson(path, { retries = 1, timeoutMs } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const attemptTimeout = timeoutMs ?? (attempt === 0 ? REQUEST_TIMEOUT : RETRY_REQUEST_TIMEOUT);
    const timeout = window.setTimeout(() => controller.abort(), attemptTimeout);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new PortfolioHttpError(response.status, `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      const canRetry = attempt < retries && shouldRetry(error);
      if (!canRetry) throw error;
      await sleep(REQUEST_RETRY_DELAY * (attempt + 1));
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("La requête API a échoué.");
}

function isPortfolioOwner(value) {
  return Boolean(value && typeof value === "object" && value.ownerId != null);
}

function normalizePayload(owner, source = "api", error = null) {
  return {
    owners: owner ? [owner] : [],
    owner: owner ?? null,
    source,
    error,
  };
}

function readStorage(locale) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(cacheKey(locale));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (cached?.version !== PORTFOLIO_CACHE_VERSION) return null;
    if (!isPortfolioOwner(cached.owner)) return null;

    return {
      ...normalizePayload(cached.owner, "cache", null),
      cachedAt: cached.cachedAt ?? null,
    };
  } catch {
    return null;
  }
}

function writeStorage(owner, locale) {
  if (typeof window === "undefined" || !isPortfolioOwner(owner)) return;

  try {
    window.localStorage.setItem(
      cacheKey(locale),
      JSON.stringify({
        version: PORTFOLIO_CACHE_VERSION,
        cachedAt: new Date().toISOString(),
        owner,
      }),
    );
  } catch {
    // Storage restrictions must never prevent rendering.
  }
}

export function readCachedPortfolio(locale = "fr") {
  return readStorage(locale);
}

export async function fetchWebsite(locale = "fr") {
  const owner = await requestJson(withLocale("/website/default", locale));
  if (!isPortfolioOwner(owner)) {
    throw new Error("Aucun owner valide retourné par l’API.");
  }
  return owner;
}

export async function fetchProjectCaseStudy(projectSlug, ownerId, locale = "fr") {
  if (!projectSlug) throw new Error("Slug projet manquant");

  const encodedSlug = encodeURIComponent(projectSlug);
  const path = ownerId
    ? `/website/${ownerId}/projects/${encodedSlug}`
    : `/website/default/projects/${encodedSlug}`;

  return requestJson(withLocale(path, locale));
}

async function requestPortfolioFromApi(locale) {
  const owner = await fetchWebsite(locale);
  const enrichedOwner = {
    ...owner,
    provenSkills: Array.isArray(owner.provenSkills) ? owner.provenSkills : [],
  };

  writeStorage(enrichedOwner, locale);
  return normalizePayload(enrichedOwner, "api", null);
}

export function refreshPortfolio(locale = "fr") {
  const normalizedLocale = normalizeLocale(locale);
  if (!inFlightPortfolioRequests.has(normalizedLocale)) {
    const request = requestPortfolioFromApi(normalizedLocale).finally(() => {
      inFlightPortfolioRequests.delete(normalizedLocale);
    });
    inFlightPortfolioRequests.set(normalizedLocale, request);
  }

  return inFlightPortfolioRequests.get(normalizedLocale);
}

export async function loadDemoPortfolio(error) {
  const { demoOwner, demoOwners } = await import("../data/demoPortfolio");

  return {
    owners: demoOwners,
    owner: demoOwner,
    source: "demo",
    error: error instanceof Error ? error.message : "API indisponible",
  };
}

export async function loadPortfolio(locale = "fr") {
  try {
    return await refreshPortfolio(locale);
  } catch (error) {
    const cached = readCachedPortfolio(locale);
    if (cached) {
      return {
        ...cached,
        error: error instanceof Error ? error.message : "API indisponible",
      };
    }
    return loadDemoPortfolio(error);
  }
}
