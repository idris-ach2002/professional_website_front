const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const USE_DIRECT_BACKEND = !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";
const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT ?? "/uploads/";

let csrfTokenCache = null;
let csrfTokenInFlight = null;

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = null, requestId = null } = {}) {
    super(message || "Action impossible.");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export class AuthRequiredError extends ApiError {
  constructor(message = "Connexion requise.") {
    super(message, { status: 401, code: "AUTH_REQUIRED" });
    this.name = "AuthRequiredError";
  }
}

export class ConcurrencyConflictError extends ApiError {
  constructor(message = "Ces données ont été modifiées ailleurs. Recharge les données avant de réessayer.", options = {}) {
    super(message, options);
    this.name = "ConcurrencyConflictError";
  }
}

export function isAuthRequiredError(error) {
  return error instanceof AuthRequiredError || error?.name === "AuthRequiredError";
}

export function isConcurrencyConflictError(error) {
  return error instanceof ConcurrencyConflictError || error?.name === "ConcurrencyConflictError";
}

export function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildBackendUrl(path) {
  return buildApiUrl(path);
}

export function versionEntityTag(versionOrId, revision) {
  const id = typeof versionOrId === "object" ? versionOrId?.id : versionOrId;
  const value = typeof versionOrId === "object" ? versionOrId?.contentRevision : revision;
  if (id === null || id === undefined || value === null || value === undefined) return null;
  return `"version-${id}-${value}"`;
}

export function ownerEntityTag(ownerOrId, revision) {
  const id = typeof ownerOrId === "object" ? ownerOrId?.ownerId : ownerOrId;
  const value = typeof ownerOrId === "object" ? ownerOrId?.rowVersion : revision;
  if (id === null || id === undefined || value === null || value === undefined) return null;
  return `"owner-${id}-${value}"`;
}

function invalidateCsrfToken() {
  csrfTokenCache = null;
  csrfTokenInFlight = null;
}

function isUnsafeMethod(method) {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
}

async function readResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let data = null;

  if (text && contentType.includes("application/json")) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  return { contentType, data, text };
}

function isLoginResponse(response, text, contentType) {
  if (response.type === "opaqueredirect" || response.status === 0) return true;

  const responseUrl = response.url || "";
  const landedOnLogin = /\/login(?:\?|$)/.test(responseUrl);
  const htmlLoginPage =
    contentType.includes("text/html") &&
    /name=["']username["']|name=["']password["']|<form[^>]+action=["']\/login/i.test(text ?? "");

  return landedOnLogin || htmlLoginPage;
}

async function requestCsrfToken() {
  const response = await fetch(buildApiUrl("/csrf"), {
    method: "GET",
    credentials: "include",
    redirect: "manual",
    headers: { Accept: "application/json" },
  });

  const { contentType, data, text } = await readResponse(response);
  if (isLoginResponse(response, text, contentType) || response.status === 401 || response.status === 403) {
    invalidateCsrfToken();
    throw new AuthRequiredError();
  }
  if (!response.ok || !data?.token) {
    throw new ApiError(data?.message ?? "Impossible d’obtenir le jeton CSRF.", {
      status: response.status,
      code: data?.code ?? "CSRF_UNAVAILABLE",
      requestId: data?.requestId ?? response.headers.get("X-Request-ID"),
    });
  }
  return {
    token: data.token,
    headerName: data.headerName ?? "X-CSRF-TOKEN",
    parameterName: data.parameterName ?? "_csrf",
  };
}

function waitForPromiseWithSignal(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));

  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export function resetAuthSessionCache() {
  invalidateCsrfToken();
}

export async function getCsrfToken(forceRefresh = false, signal) {
  if (csrfTokenCache && !forceRefresh) return csrfTokenCache;
  if (forceRefresh) csrfTokenCache = null;

  // Deduplicate concurrent unsafe mutations. A single CSRF round-trip is enough
  // for every request waiting in the same authenticated session.
  if (!csrfTokenInFlight) {
    csrfTokenInFlight = requestCsrfToken()
      .then((token) => {
        csrfTokenCache = token;
        return token;
      })
      .finally(() => {
        csrfTokenInFlight = null;
      });
  }
  return waitForPromiseWithSignal(csrfTokenInFlight, signal);
}

async function parseApiResponse(response) {
  const { contentType, data, text } = await readResponse(response);

  if (isLoginResponse(response, text, contentType) || response.status === 401 || response.status === 403) {
    invalidateCsrfToken();
    throw new AuthRequiredError();
  }

  if (!response.ok) {
    const options = {
      status: response.status,
      code: data?.code ?? null,
      details: data?.details ?? null,
      requestId: data?.requestId ?? response.headers.get("X-Request-ID"),
    };
    const message = data?.message ?? `Action impossible (HTTP ${response.status}).`;
    if (response.status === 409 || response.status === 412 || response.status === 428) {
      throw new ConcurrencyConflictError(message, options);
    }
    throw new ApiError(message, options);
  }

  if (!text) return null;
  if (contentType.includes("application/json")) return data;
  throw new ApiError("Réponse API inattendue.", { status: response.status });
}

export async function apiRequest(method, path, body, options = {}) {
  const methodUpper = method.toUpperCase();
  const shouldSendBody = body !== undefined && body !== null;
  const headers = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (shouldSendBody) headers["Content-Type"] = "application/json";
  if (options.ifMatch) headers["If-Match"] = options.ifMatch;

  if (isUnsafeMethod(methodUpper)) {
    const csrf = await getCsrfToken(options.forceCsrfRefresh, options.signal);
    headers[csrf.headerName] = csrf.token;
  }

  const response = await fetch(buildApiUrl(path), {
    method: methodUpper,
    credentials: "include",
    redirect: "manual",
    headers,
    body: shouldSendBody ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  try {
    return await parseApiResponse(response);
  } catch (error) {
    if (isAuthRequiredError(error) && isUnsafeMethod(methodUpper) && !options.forceCsrfRefresh) {
      invalidateCsrfToken();
      return apiRequest(methodUpper, path, body, { ...options, forceCsrfRefresh: true });
    }
    throw error;
  }
}

export async function uploadProtectedFile(file, options = {}) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);

  const csrf = await getCsrfToken(options.forceCsrfRefresh, options.signal);
  const response = await fetch(buildApiUrl(UPLOAD_ENDPOINT), {
    method: "POST",
    credentials: "include",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: formData,
    signal: options.signal,
  });

  try {
    return await parseApiResponse(response);
  } catch (error) {
    if (isAuthRequiredError(error) && !options.forceCsrfRefresh) {
      invalidateCsrfToken();
      return uploadProtectedFile(file, { ...options, forceCsrfRefresh: true });
    }
    throw error;
  }
}

export async function logoutAdmin(options = {}) {
  try {
    const csrf = await getCsrfToken(false, options.signal);
    await fetch(buildApiUrl("/logout"), {
      method: "POST",
      credentials: "include",
      redirect: "manual",
      headers: {
        Accept: "text/html, */*;q=0.8",
        [csrf.headerName]: csrf.token,
      },
      signal: options.signal,
    });
  } finally {
    invalidateCsrfToken();
  }
}
