export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const shouldProxy =
      url.pathname.startsWith("/website") ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/csrf");

    if (shouldProxy) {
      const backend = "https://api.idris-achabou.fit";

      return fetch(
        backend + url.pathname + url.search,
        {
          method: request.method,
          headers: request.headers,
          body:
            request.method === "GET" ||
            request.method === "HEAD"
              ? undefined
              : request.body
        }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
