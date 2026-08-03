const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SHOULD_USE_DIRECT_BACKEND =
  !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = SHOULD_USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";

const REQUEST_TIMEOUT = 9000;
const RETRY_REQUEST_TIMEOUT = 4500;
const REQUEST_RETRY_DELAY = 450;
const PORTFOLIO_CACHE_KEY = "portfolio:last-known-good:v1";
const PORTFOLIO_CACHE_VERSION = 1;

let inFlightPortfolioRequest = null;

class PortfolioHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "PortfolioHttpError";
    this.status = status;
  }
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

function readStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_CACHE_KEY);
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

function writeStorage(owner) {
  if (typeof window === "undefined" || !isPortfolioOwner(owner)) return;

  try {
    window.localStorage.setItem(
      PORTFOLIO_CACHE_KEY,
      JSON.stringify({
        version: PORTFOLIO_CACHE_VERSION,
        cachedAt: new Date().toISOString(),
        owner,
      }),
    );
  } catch {
    // Une restriction de stockage ne doit jamais empêcher l’affichage du site.
  }
}

export function readCachedPortfolio() {
  return readStorage();
}

export async function fetchWebsite() {
  const owner = await requestJson("/website/default");
  if (!isPortfolioOwner(owner)) {
    throw new Error("Aucun owner valide retourné par l’API.");
  }
  return owner;
}

export async function fetchDefaultProvenSkills() {
  return requestJson("/website/default/proven-skills", { retries: 0, timeoutMs: 4500 });
}

export async function fetchProjectCaseStudy(projectSlug, ownerId) {
  if (!projectSlug) {
    throw new Error("Slug projet manquant");
  }

  const encodedSlug = encodeURIComponent(projectSlug);
  const path = ownerId
    ? `/website/${ownerId}/projects/${encodedSlug}`
    : `/website/default/projects/${encodedSlug}`;

  return requestJson(path);
}

async function requestPortfolioFromApi() {
  const owner = await fetchWebsite();
  let provenSkills = owner.provenSkills;

  // L’endpoint principal contient normalement les compétences. L’ancien endpoint
  // n’est appelé qu’en compatibilité avec une ancienne version du backend.
  if (!Array.isArray(provenSkills)) {
    try {
      provenSkills = await fetchDefaultProvenSkills();
    } catch {
      provenSkills = [];
    }
  }

  const enrichedOwner = {
    ...owner,
    provenSkills,
  };

  writeStorage(enrichedOwner);
  return normalizePayload(enrichedOwner, "api", null);
}

export function refreshPortfolio() {
  if (!inFlightPortfolioRequest) {
    inFlightPortfolioRequest = requestPortfolioFromApi().finally(() => {
      inFlightPortfolioRequest = null;
    });
  }

  return inFlightPortfolioRequest;
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

// Compatibilité avec les appels existants hors de App.jsx.
export async function loadPortfolio() {
  try {
    return await refreshPortfolio();
  } catch (error) {
    const cached = readCachedPortfolio();
    if (cached) {
      return {
        ...cached,
        error: error instanceof Error ? error.message : "API indisponible",
      };
    }
    return loadDemoPortfolio(error);
  }
}
