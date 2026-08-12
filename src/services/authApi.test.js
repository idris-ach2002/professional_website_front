import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConcurrencyConflictError,
  apiRequest,
  ownerEntityTag,
  resetAuthSessionCache,
  versionEntityTag,
} from "./authApi";

function jsonResponse(body, status = 200, url = "http://api.test/resource") {
  return {
    ok: status >= 200 && status < 300,
    status,
    type: "basic",
    url,
    headers: {
      get(name) {
        const normalized = String(name).toLowerCase();
        if (normalized === "content-type") return "application/json";
        if (normalized === "x-request-id") return "req-test";
        return null;
      },
    },
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

function csrfResponse() {
  return jsonResponse({ token: "csrf-1", headerName: "X-CSRF-TOKEN", parameterName: "_csrf" }, 200, "http://api.test/csrf");
}

describe("authApi concurrency contract", () => {
  beforeEach(() => {
    resetAuthSessionCache();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("deduplicates the CSRF preflight across simultaneous unsafe mutations", async () => {
    fetch.mockImplementation(async (url) => {
      if (String(url).endsWith("/csrf")) return csrfResponse();
      return jsonResponse({ ok: true });
    });

    await Promise.all([
      apiRequest("POST", "/manager/a", { value: 1 }),
      apiRequest("PUT", "/manager/b", { value: 2 }),
    ]);

    const csrfCalls = fetch.mock.calls.filter(([url]) => String(url).endsWith("/csrf"));
    expect(csrfCalls).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not let one aborted waiter cancel the shared CSRF request", async () => {
    let resolveCsrf;
    const csrfPending = new Promise((resolve) => { resolveCsrf = resolve; });
    fetch.mockImplementation((url) => {
      if (String(url).endsWith("/csrf")) return csrfPending;
      return Promise.resolve(jsonResponse({ ok: true }));
    });

    const controller = new AbortController();
    const first = apiRequest("POST", "/manager/a", { value: 1 }, { signal: controller.signal });
    const second = apiRequest("POST", "/manager/b", { value: 2 });
    controller.abort();
    resolveCsrf(csrfResponse());

    await expect(first).rejects.toMatchObject({ name: "AbortError" });
    await expect(second).resolves.toEqual({ ok: true });
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith("/csrf"))).toHaveLength(1);
  });

  it("sends the strong If-Match tag with mutations", async () => {
    fetch.mockImplementation(async (url) => {
      if (String(url).endsWith("/csrf")) return csrfResponse();
      return jsonResponse({ id: 3, contentRevision: 8 });
    });

    await apiRequest("PUT", "/manager/1/versions/3", { label: "V3" }, {
      ifMatch: versionEntityTag({ id: 3, contentRevision: 7 }),
    });

    const [, options] = fetch.mock.calls.find(([url]) => String(url).includes("/versions/3"));
    expect(options.headers["If-Match"]).toBe('"version-3-7"');
    expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf-1");
    expect(ownerEntityTag({ ownerId: 9, rowVersion: 2 })).toBe('"owner-9-2"');
  });

  it("maps stale-write responses to a typed concurrency error", async () => {
    fetch.mockImplementation(async (url) => {
      if (String(url).endsWith("/csrf")) return csrfResponse();
      return jsonResponse({
        code: "CONCURRENT_MODIFICATION",
        message: "Version modifiée ailleurs.",
        details: { reloadRequired: true },
      }, 412);
    });

    await expect(apiRequest("PUT", "/manager/1/versions/3", {}, {
      ifMatch: '"version-3-7"',
    })).rejects.toBeInstanceOf(ConcurrencyConflictError);
  });
});
