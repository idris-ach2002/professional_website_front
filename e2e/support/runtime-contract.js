import process from "node:process";
import { expect } from "@playwright/test";
import { portfolioOwner } from "../fixtures/owner";
import { classifyConsoleError, classifyNetworkFailure } from "./runtime-fault-policy";

export const CI_FACTOR = process.env.CI ? 1.5 : 1;
export const CONTRACT_TIMEOUT_MS = Math.round(10_000 * CI_FACTOR);
export const PROBE_DEADLINE_MS = Math.round(15_000 * CI_FACTOR);
export const RUNTIME_WATCHDOG_INTERVAL_MS = 500;
export const RUNTIME_WATCHDOG_SEVERE_DELAY_MS = 8_000;
export const RUNTIME_WATCHDOG_KEY = "__portfolioE2ERuntimeWatchdog";

const PUBLIC_WEBSITE_PATH = "/website/default";
export const PUBLIC_WEBSITE_ROUTE = /\/website\/default(?:\?.*)?$/;
const ANALYTICS_EVENTS_ROUTE = /\/analytics\/events(?:\?.*)?$/;
const GOOGLE_FONTS_CSS_ROUTE = /^https:\/\/fonts\.googleapis\.com\//;
const GOOGLE_FONTS_BINARY_ROUTE = /^https:\/\/fonts\.gstatic\.com\//;
const CLOUDINARY_ASSET_ROUTE = /^https:\/\/res\.cloudinary\.com\//;
const HTTP_ROUTE = /^https?:\/\//;
const TRANSPARENT_MEDIA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="E2E media fixture"><rect width="1200" height="800" fill="transparent"/></svg>`;

function describeRequest(request) {
  return `${request.method()} ${request.url()} [${request.resourceType()}]`;
}

function isLoopback(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost" || parsed.hostname === "::1";
  } catch {
    return false;
  }
}

export function isPublicWebsiteRequest(url, locale) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith(PUBLIC_WEBSITE_PATH)
      && parsed.searchParams.get("locale") === locale;
  } catch {
    return false;
  }
}

/**
 * E2E network precondition: browser execution must be hermetic.
 * Known third-party font CSS is replaced by an empty deterministic stylesheet;
 * every other unexpected external HTTP request is blocked and recorded.
 */
export async function installHermeticNetworkContract(context) {
  const violations = [];

  // Register the catch-all first. Playwright evaluates the most recently
  // registered matching route first, so the explicit Google routes below win.
  await context.route(HTTP_ROUTE, async (route) => {
    const request = route.request();
    if (isLoopback(request.url())) {
      await route.fallback();
      return;
    }

    violations.push({
      type: "external-network",
      message: describeRequest(request),
      at: Date.now(),
    });
    await route.abort("blockedbyclient");
  });

  await context.route(GOOGLE_FONTS_BINARY_ROUTE, async (route) => {
    // No real font is required because the stylesheet below exposes no
    // @font-face rule. Return a deterministic no-content response instead of
    // aborting: engine-specific cancellation codes must not pollute runtime
    // diagnostics when a speculative font request happens.
    await route.fulfill({ status: 204, body: "" });
  });

  await context.route(CLOUDINARY_ASSET_ROUTE, async (route) => {
    const request = route.request();
    if (request.resourceType() === "image") {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        headers: { "cache-control": "no-store" },
        body: TRANSPARENT_MEDIA_SVG,
      });
      return;
    }
    // PDF/document links are not part of the browser contract unless a scenario
    // clicks them. Prevent accidental Internet access without fabricating data.
    await route.fulfill({ status: 204, body: "" });
  });

  await context.route(GOOGLE_FONTS_CSS_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css; charset=utf-8",
      headers: { "cache-control": "no-store" },
      body: "/* E2E hermetic font contract: system fallback intentionally used. */\n",
    });
  });

  return { violations };
}

export async function installPublicApiContract(context) {
  await context.route(PUBLIC_WEBSITE_ROUTE, async (route) => {
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(portfolioOwner(locale)),
    });
  });

  await context.route(ANALYTICS_EVENTS_ROUTE, async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
}


export async function installRuntimeWatchdogContract(context) {
  await context.addInitScript(({ key, intervalMs, severeDelayMs }) => {
    const startedAt = performance.now();
    const state = {
      schema: 1,
      intervalMs,
      severeDelayMs,
      startedAt,
      lastTickAt: startedAt,
      ticks: 0,
      maxDelayMs: 0,
      severeDelayCount: 0,
      longTaskSupported: false,
      longTaskCount: 0,
      longTaskTotalMs: 0,
      maxLongTaskMs: 0,
      recentDelays: [],
    };

    Object.defineProperty(window, key, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: state,
    });

    window.setInterval(() => {
      const now = performance.now();
      const delay = Math.max(0, now - state.lastTickAt - intervalMs);
      state.lastTickAt = now;
      state.ticks += 1;
      state.maxDelayMs = Math.max(state.maxDelayMs, delay);
      if (delay >= severeDelayMs) state.severeDelayCount += 1;
      if (delay >= 1_000) {
        state.recentDelays.push({ at: now, delayMs: delay });
        if (state.recentDelays.length > 16) state.recentDelays.shift();
      }
    }, intervalMs);

    if (typeof PerformanceObserver === "function"
      && PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      state.longTaskSupported = true;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = Number(entry.duration || 0);
            state.longTaskCount += 1;
            state.longTaskTotalMs += duration;
            state.maxLongTaskMs = Math.max(state.maxLongTaskMs, duration);
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        state.longTaskSupported = false;
      }
    }
  }, {
    key: RUNTIME_WATCHDOG_KEY,
    intervalMs: RUNTIME_WATCHDOG_INTERVAL_MS,
    severeDelayMs: RUNTIME_WATCHDOG_SEVERE_DELAY_MS,
  });
}

export async function forceHostedRunnerBrowserHardwareFloor(context) {
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
      configurable: true,
      get: () => 2,
    });
  });
}

export function classifyRequestFailure(request) {
  const classified = classifyNetworkFailure({
    method: request.method(),
    url: request.url(),
    resourceType: request.resourceType(),
    errorText: request.failure()?.errorText ?? "unknown",
  });
  return {
    ...classified,
    fault: { ...classified.fault, at: Date.now() },
  };
}

export function captureRuntimeFaults(page) {
  const fatal = [];
  const diagnostics = [];
  const all = [];
  const allowedHttpResponses = [];
  let armed = true;

  const push = (severity, fault) => {
    all.push(fault);
    (severity === "fatal" ? fatal : diagnostics).push(fault);
  };

  const onPageError = (error) => push("fatal", {
    type: "pageerror",
    message: error.message,
    at: Date.now(),
  });
  const onRequestFailed = (request) => {
    const classified = classifyRequestFailure(request);
    push(classified.severity, classified.fault);
  };
  const onConsole = (message) => {
    if (message.type() !== "error") return;
    const classified = classifyConsoleError(message.text());
    push(classified.severity, { ...classified.fault, at: Date.now() });
  };
  const onResponse = (response) => {
    if (response.status() < 400) return;
    const allowed = allowedHttpResponses.some((predicate) => {
      try {
        return predicate(response);
      } catch {
        return false;
      }
    });
    push(allowed ? "diagnostic" : "fatal", {
      type: allowed ? "http-response-allowed" : "http-response",
      message: `${response.status()} ${response.request().method()} ${response.url()}`,
      at: Date.now(),
    });
  };
  const onCrash = () => push("fatal", {
    type: "crash",
    message: "Le renderer du navigateur a planté.",
    at: Date.now(),
  });
  const onClose = () => {
    if (!armed) return;
    push("fatal", {
      type: "close",
      message: "La page a été fermée avant la fin du contrat de test.",
      at: Date.now(),
    });
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);
  page.on("crash", onCrash);
  page.on("close", onClose);

  return {
    fatal,
    diagnostics,
    all,
    allowHttpResponse(predicate) {
      allowedHttpResponses.push(predicate);
    },
    dispose() {
      armed = false;
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
      page.off("crash", onCrash);
      page.off("close", onClose);
    },
  };
}

function fatalFaults(input) {
  if (Array.isArray(input)) return input;
  return input?.fatal ?? [];
}

export function assertNoRuntimeFaults(input, phase) {
  const faults = fatalFaults(input);
  const formatted = faults.map((fault) => `${fault.type}: ${fault.message}`).join(" | ");
  expect(faults, `${phase} — erreurs navigateur fatales: ${formatted}`).toEqual([]);
}

export function assertHermeticNetwork(network, phase = "Postcondition réseau") {
  const violations = network?.violations ?? [];
  const formatted = violations.map((fault) => fault.message).join(" | ");
  expect(violations, `${phase} — accès réseau externe non déclaré: ${formatted}`).toEqual([]);
}

export async function openPublicRouteContract(page, route, {
  locale = route.startsWith("/en") ? "en" : "fr",
  requireDirector = false,
} = {}) {
  const responsePromise = page.waitForResponse(
    (response) => isPublicWebsiteRequest(response.url(), locale) && response.status() === 200,
    { timeout: CONTRACT_TIMEOUT_MS },
  );

  await page.goto(route, {
    waitUntil: "domcontentloaded",
    timeout: CONTRACT_TIMEOUT_MS,
  });
  await responsePromise;

  expect(new URL(page.url()).pathname, "postcondition: route publique exacte").toBe(route);

  const html = page.locator("html");
  await expect(page.locator("main#main-content:not(.loading-shell)"), "précondition: main prêt")
    .toBeVisible({ timeout: CONTRACT_TIMEOUT_MS });
  await expect(html, "précondition: langue stabilisée")
    .toHaveAttribute("lang", locale, { timeout: CONTRACT_TIMEOUT_MS });

  if (requireDirector) {
    await expect(html, "précondition: World Director prêt")
      .toHaveAttribute("data-ocean-director-ready", "true", { timeout: CONTRACT_TIMEOUT_MS });
  }
}

export async function openPortfolioContract(page, locale = "fr", { requireDirector = true } = {}) {
  return openPublicRouteContract(page, locale === "en" ? "/en" : "/", { locale, requireDirector });
}

/**
 * Single-flight bounded renderer probe. Never retry a timed-out evaluation:
 * protocol retries can queue duplicate work behind a saturated renderer and
 * turn a short scheduling hiccup into self-inflicted pressure. `page.evaluate`
 * is used directly so renderer liveness is not coupled to Locator actionability.
 * The runner owns the one deadline; after expiry the caller must fail, not retry.
 */
export async function probeHtml(page, probe, arg, {
  label = "runtime probe",
  deadlineMs = PROBE_DEADLINE_MS,
} = {}) {
  const startedAt = Date.now();
  let timeoutId = null;
  const deadlineError = new Error(`__renderer_probe_deadline__:${deadlineMs}`);

  try {
    const deadline = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(deadlineError), deadlineMs);
    });
    const value = await Promise.race([page.evaluate(probe, arg), deadline]);
    return {
      value,
      probe: {
        attempts: 1,
        elapsedMs: Date.now() - startedAt,
        delayedAttempts: 0,
      },
    };
  } catch (error) {
    if (page.isClosed() || error !== deadlineError) throw error;
    throw new Error(
      `${label} — liveness violée: le renderer n'a pas répondu à une sonde unique dans ${deadlineMs} ms.`,
      { cause: error },
    );
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}
