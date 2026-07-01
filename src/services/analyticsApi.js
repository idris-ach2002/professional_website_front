const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SHOULD_USE_DIRECT_BACKEND = !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = SHOULD_USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";
const ANALYTICS_DISABLED = import.meta.env.VITE_ANALYTICS_DISABLED === "true";
const STORAGE_KEYS = {
  visitorId: "portfolio_analytics_visitor_id",
  recruiterCode: "portfolio_analytics_recruiter_code",
  sessionId: "portfolio_analytics_session_id",
};

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function safeStorage(storage, key, fallbackFactory) {
  try {
    const current = storage.getItem(key);
    if (current) return current;
    const next = fallbackFactory();
    storage.setItem(key, next);
    return next;
  } catch {
    return fallbackFactory();
  }
}

export function getAnalyticsVisitorId() {
  return safeStorage(window.localStorage, STORAGE_KEYS.visitorId, () => createId("visitor"));
}

export function getAnalyticsSessionId() {
  return safeStorage(window.sessionStorage, STORAGE_KEYS.sessionId, () => createId("session"));
}

function getQueryParam(names) {
  const params = new URLSearchParams(window.location.search);
  for (const name of names) {
    const value = params.get(name);
    if (value && value.trim()) return value.trim();
  }
  return null;
}

export function getRecruiterCode() {
  const fromUrl = getQueryParam(["rid", "recruiter", "recruiterCode", "ref"]);
  if (fromUrl) {
    try {
      window.localStorage.setItem(STORAGE_KEYS.recruiterCode, fromUrl);
    } catch {
      // Ignore localStorage errors.
    }
    return fromUrl;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEYS.recruiterCode) || null;
  } catch {
    return null;
  }
}

function getDeviceType() {
  const width = window.innerWidth || window.screen?.width || 0;
  const userAgent = navigator.userAgent || "";
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
  const isMobile = /mobi|android|iphone|ipod/i.test(userAgent);

  if (isTablet || (width >= 768 && width <= 1024 && isMobile)) return "tablet";
  if (isMobile || width < 768) return "mobile";
  return "desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome|chromium/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Autre";
}

function detectOs() {
  const ua = navigator.userAgent || "";
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Autre";
}

function sourceFromReferrer(referrer) {
  const utmSource = getQueryParam(["utm_source"]);
  if (utmSource) return utmSource;
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("linkedin")) return "linkedin";
    if (host.includes("github")) return "github";
    if (host.includes("google")) return "google";
    if (host.includes("bing")) return "bing";
    if (host.includes("idris-achabou.fit")) return "portfolio";
    return host;
  } catch {
    return "unknown";
  }
}

function projectSlugFromPath(pathname) {
  const match = pathname.match(/^\/projects\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function analyticsAllowed() {
  if (ANALYTICS_DISABLED) return false;
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return false;
  return typeof window !== "undefined";
}

export async function trackPortfolioEvent(event = {}) {
  if (!analyticsAllowed()) return;

  const pagePath = event.pagePath ?? `${window.location.pathname}${window.location.search}`;
  if (pagePath.startsWith("/admin")) return;

  const referrer = event.referrer ?? document.referrer ?? null;
  const payload = {
    eventType: event.eventType ?? "event",
    pagePath,
    pageTitle: event.pageTitle ?? document.title ?? null,
    projectSlug: event.projectSlug ?? projectSlugFromPath(window.location.pathname),
    referrer,
    source: event.source ?? sourceFromReferrer(referrer),
    medium: event.medium ?? getQueryParam(["utm_medium"]),
    campaign: event.campaign ?? getQueryParam(["utm_campaign"]),
    recruiterCode: event.recruiterCode ?? getRecruiterCode(),
    visitorId: getAnalyticsVisitorId(),
    sessionId: getAnalyticsSessionId(),
    deviceType: event.deviceType ?? getDeviceType(),
    browser: event.browser ?? detectBrowser(),
    os: event.os ?? detectOs(),
    language: navigator.language ?? null,
    screenWidth: window.screen?.width ?? null,
    screenHeight: window.screen?.height ?? null,
  };

  const body = JSON.stringify(payload);
  const url = buildApiUrl("/analytics/events");

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      keepalive: true,
    });
  } catch {
    // Le tracking ne doit jamais casser le portfolio.
  }
}

export function inferClickEvent(anchor) {
  if (!anchor) return null;
  const href = anchor.getAttribute("href") || "";
  const absoluteHref = anchor.href || href;
  const label = anchor.textContent?.trim() || anchor.getAttribute("aria-label") || null;

  if (!href || href.startsWith("#")) return null;

  if (/\.pdf(?:$|[?#])/i.test(absoluteHref) || /\/cv(?:$|[?#/])/i.test(absoluteHref)) {
    return { eventType: "cv_click", source: "portfolio", pageTitle: label };
  }

  if (/github\.com/i.test(absoluteHref)) {
    return { eventType: "github_click", source: "portfolio", pageTitle: label };
  }

  if (/linkedin\.com/i.test(absoluteHref)) {
    return { eventType: "linkedin_click", source: "portfolio", pageTitle: label };
  }

  if (/^mailto:/i.test(absoluteHref) || /^tel:/i.test(absoluteHref)) {
    return { eventType: "contact_click", source: "portfolio", pageTitle: label };
  }

  try {
    const url = new URL(absoluteHref);
    if (url.pathname.startsWith("/projects/")) {
      return {
        eventType: "project_click",
        source: "portfolio",
        pageTitle: label,
        projectSlug: projectSlugFromPath(url.pathname),
      };
    }
  } catch {
    // Ignore invalid URLs.
  }

  return null;
}
