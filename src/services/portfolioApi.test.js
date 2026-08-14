import { beforeEach, describe, expect, it, vi } from "vitest";

const CACHE_KEY_FR = "portfolio:last-known-good:v4:fr";
const CACHE_KEY_EN = "portfolio:last-known-good:v4:en";

function owner(overrides = {}) {
  return {
    ownerId: 1,
    name: "ACHABOU",
    firstName: "Idris",
    provenSkills: [],
    ...overrides,
  };
}

function jsonResponse(payload, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => payload,
  };
}

describe("portfolioApi", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("charge le portfolio public avec la locale anglaise", async () => {
    const fetchMock = vi.fn(() => jsonResponse(owner()));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWebsite } = await import("./portfolioApi");

    await expect(fetchWebsite("en")).resolves.toMatchObject({ ownerId: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/website/default?locale=en");
    expect(fetchMock.mock.calls[0][1].headers.Accept).toBe("application/json");
  });

  it("normalise une locale inconnue vers le français", async () => {
    const fetchMock = vi.fn(() => jsonResponse(owner()));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWebsite } = await import("./portfolioApi");

    await fetchWebsite("de");

    expect(fetchMock.mock.calls[0][0]).toBe("/website/default?locale=fr");
  });

  it("rejette une réponse qui ne contient pas un owner valide", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ message: "invalid" })));
    const { fetchWebsite } = await import("./portfolioApi");

    await expect(fetchWebsite("fr")).rejects.toThrow("Aucun owner valide");
  });

  it("enrichit les compétences manquantes et écrit le cache", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse(owner({ provenSkills: undefined }))));
    const { refreshPortfolio, readCachedPortfolio } = await import("./portfolioApi");

    const payload = await refreshPortfolio("fr");
    const cached = readCachedPortfolio("fr");

    expect(payload.source).toBe("api");
    expect(payload.owner.provenSkills).toEqual([]);
    expect(cached.owner.provenSkills).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(CACHE_KEY_FR)).version).toBe(4);
  });

  it("déduplique deux requêtes simultanées pour la même locale", async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => { resolveFetch = resolve; });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal("fetch", fetchMock);
    const { refreshPortfolio } = await import("./portfolioApi");

    const first = refreshPortfolio("en");
    const second = refreshPortfolio("en");
    expect(first).toBe(second);
    resolveFetch(jsonResponse(owner()));

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(CACHE_KEY_EN)).not.toBeNull();
  });

  it("isole les requêtes concurrentes de deux locales différentes", async () => {
    const fetchMock = vi.fn((url) => jsonResponse(owner({ ownerId: url.includes("locale=en") ? 2 : 1 })));
    vi.stubGlobal("fetch", fetchMock);
    const { refreshPortfolio } = await import("./portfolioApi");

    const [fr, en] = await Promise.all([refreshPortfolio("fr"), refreshPortfolio("en")]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fr.owner.ownerId).toBe(1);
    expect(en.owner.ownerId).toBe(2);
  });

  it("nettoie l'in-flight après un échec pour permettre une nouvelle tentative", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => jsonResponse({ error: "bad" }, { status: 400 }))
      .mockImplementationOnce(() => jsonResponse(owner({ ownerId: 9 })));
    vi.stubGlobal("fetch", fetchMock);
    const { refreshPortfolio } = await import("./portfolioApi");

    await expect(refreshPortfolio("fr")).rejects.toThrow("HTTP 400");
    await expect(refreshPortfolio("fr")).resolves.toMatchObject({ owner: { ownerId: 9 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retente une erreur serveur transitoire avec un délai piloté par fake timers", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => jsonResponse({ error: "temporary" }, { status: 503 }))
      .mockImplementationOnce(() => jsonResponse(owner({ ownerId: 7 })));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWebsite } = await import("./portfolioApi");

    const pending = fetchWebsite("fr");
    await vi.advanceTimersByTimeAsync(450);

    await expect(pending).resolves.toMatchObject({ ownerId: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("construit les routes de case study avec et sans ownerId", async () => {
    const fetchMock = vi.fn(() => jsonResponse({ slug: "deep ocean" }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchProjectCaseStudy } = await import("./portfolioApi");

    await fetchProjectCaseStudy("deep ocean", 42, "en");
    await fetchProjectCaseStudy("deep ocean", null, "fr");

    expect(fetchMock.mock.calls[0][0]).toBe("/website/42/projects/deep%20ocean?locale=en");
    expect(fetchMock.mock.calls[1][0]).toBe("/website/default/projects/deep%20ocean?locale=fr");
    await expect(fetchProjectCaseStudy("", 42, "fr")).rejects.toThrow("Slug projet manquant");
  });

  it("retourne le cache après l'échec de l'API", async () => {
    window.localStorage.setItem(CACHE_KEY_FR, JSON.stringify({
      version: 4,
      cachedAt: new Date().toISOString(),
      owner: owner(),
    }));
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ error: "down" }, { status: 400 })));
    const { loadPortfolio } = await import("./portfolioApi");

    const payload = await loadPortfolio("fr");

    expect(payload.source).toBe("cache");
    expect(payload.owner.ownerId).toBe(1);
    expect(payload.error).toBe("HTTP 400");
  });

  it("retombe sur la démo quand API et cache sont indisponibles", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ error: "down" }, { status: 400 })));
    const { loadPortfolio } = await import("./portfolioApi");

    const payload = await loadPortfolio("fr");

    expect(payload.source).toBe("demo");
    expect(payload.owner).toBeTruthy();
    expect(payload.error).toBe("HTTP 400");
  });

  it("supprime un cache expiré de plus de sept jours", async () => {
    window.localStorage.setItem(CACHE_KEY_FR, JSON.stringify({
      version: 4,
      cachedAt: "2020-01-01T00:00:00.000Z",
      owner: owner(),
    }));
    const { readCachedPortfolio } = await import("./portfolioApi");

    expect(readCachedPortfolio("fr")).toBeNull();
    expect(window.localStorage.getItem(CACHE_KEY_FR)).toBeNull();
  });

  it("ignore un cache invalide", async () => {
    window.localStorage.setItem(CACHE_KEY_FR, JSON.stringify({ version: 2, owner: owner() }));
    const { readCachedPortfolio } = await import("./portfolioApi");

    expect(readCachedPortfolio("fr")).toBeNull();
  });
});
