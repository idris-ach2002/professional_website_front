const BACKEND_ROUTE_PREFIXES = [
  "/website",
  "/manager",
  "/api",
  "/uploads",
  "/csrf",
  "/login",
  "/logout",
  "/error",
];

function isBackendRoute(pathname) {
  return BACKEND_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getBackendOrigin(env) {
  return (env.BACKEND_ORIGIN || env.VITE_API_BASE_URL || "").replace(/\/$/, "");
}

function createBackendRequest(request, backendOrigin) {
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, backendOrigin);
  const headers = new Headers(request.headers);

  headers.delete("host");

  return new Request(backendUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });
}

function rewriteRedirectLocation(location, requestUrl, backendOrigin) {
  if (!location) return location;

  const publicOrigin = new URL(requestUrl).origin;

  if (location.startsWith(backendOrigin)) {
    return `${publicOrigin}${location.slice(backendOrigin.length) || "/"}`;
  }

  return location;
}

async function proxyToBackend(request, env) {
  const backendOrigin = getBackendOrigin(env);

  if (!backendOrigin) {
    return new Response("Configuration backend manquante.", { status: 500 });
  }

  const backendRequest = createBackendRequest(request, backendOrigin);
  const backendResponse = await fetch(backendRequest);
  const headers = new Headers(backendResponse.headers);
  const location = headers.get("location");

  if (location) {
    headers.set("location", rewriteRedirectLocation(location, request.url, backendOrigin));
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (isBackendRoute(pathname)) {
      return proxyToBackend(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
