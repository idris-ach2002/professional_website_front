const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const USE_DIRECT_BACKEND = !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";
const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT ?? "/uploads/";

let csrfTokenCache = null;

export class AuthRequiredError extends Error {
  constructor(message = "Connexion requise.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export function isAuthRequiredError(error) {
  return error instanceof AuthRequiredError || error?.name === "AuthRequiredError";
}

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function invalidateCsrfToken() {
  csrfTokenCache = null;
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

export async function getCsrfToken(forceRefresh = false) {
  if (csrfTokenCache && !forceRefresh) return csrfTokenCache;

  const response = await fetch(buildApiUrl("/csrf"), {
    method: "GET",
    credentials: "include",
    redirect: "manual",
    headers: {
      Accept: "application/json",
    },
  });

  const { contentType, data, text } = await readResponse(response);

  if (isLoginResponse(response, text, contentType) || response.status === 401 || response.status === 403) {
    invalidateCsrfToken();
    throw new AuthRequiredError();
  }

  if (!response.ok || !data?.token) {
    throw new Error("Action impossible.");
  }

  csrfTokenCache = {
    token: data.token,
    headerName: data.headerName ?? "X-CSRF-TOKEN",
    parameterName: data.parameterName ?? "_csrf",
  };

  return csrfTokenCache;
}

async function parseApiResponse(response) {
  const { contentType, data, text } = await readResponse(response);

  if (isLoginResponse(response, text, contentType) || response.status === 401 || response.status === 403) {
    invalidateCsrfToken();
    throw new AuthRequiredError();
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Action impossible.");
  }

  if (!text) return null;
  if (contentType.includes("application/json")) return data;

  throw new Error("Action impossible.");
}

export async function apiRequest(method, path, body, options = {}) {
  const methodUpper = method.toUpperCase();
  const shouldSendBody = body !== undefined && body !== null;
  const headers = {
    Accept: "application/json",
  };

  if (shouldSendBody) {
    headers["Content-Type"] = "application/json";
  }

  if (isUnsafeMethod(methodUpper)) {
    const csrf = await getCsrfToken(options.forceCsrfRefresh);
    headers[csrf.headerName] = csrf.token;
  }

  const response = await fetch(buildApiUrl(path), {
    method: methodUpper,
    credentials: "include",
    redirect: "manual",
    headers,
    body: shouldSendBody ? JSON.stringify(body) : undefined,
  });

  try {
    return await parseApiResponse(response);
  } catch (error) {
    if (isAuthRequiredError(error) && isUnsafeMethod(methodUpper) && !options.forceCsrfRefresh) {
      invalidateCsrfToken();
      return apiRequest(methodUpper, path, body, { forceCsrfRefresh: true });
    }

    throw error;
  }
}

export async function uploadProtectedFile(file, options = {}) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);

  const csrf = await getCsrfToken(options.forceCsrfRefresh);
  const response = await fetch(buildApiUrl(UPLOAD_ENDPOINT), {
    method: "POST",
    credentials: "include",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: formData,
  });

  try {
    return await parseApiResponse(response);
  } catch (error) {
    if (isAuthRequiredError(error) && !options.forceCsrfRefresh) {
      invalidateCsrfToken();
      return uploadProtectedFile(file, { forceCsrfRefresh: true });
    }

    throw error;
  }
}

export async function logoutAdmin() {
  try {
    const csrf = await getCsrfToken();

    await fetch(buildApiUrl("/logout"), {
      method: "POST",
      credentials: "include",
      redirect: "manual",
      headers: {
        Accept: "text/html, */*;q=0.8",
        [csrf.headerName]: csrf.token,
      },
    });
  } finally {
    invalidateCsrfToken();
  }
}
