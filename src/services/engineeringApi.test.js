import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchEngineeringQueuePage,
  fetchMissionControlSnapshot,
  fetchPerformanceHistory,
  recordPerformanceSample,
} from "./engineeringApi";

function response(payload, status = 200, headers = {}) {
  const normalized = new Headers(headers);
  return { ok: status >= 200 && status < 300, status, url: "http://localhost:8080/api/engineering/mission-control", headers: normalized, json: vi.fn().mockResolvedValue(payload) };
}

describe("engineeringApi", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("charge le snapshot et l'historique de performance", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ status: "operational" }))
      .mockResolvedValueOnce(response({ builds: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMissionControlSnapshot()).resolves.toEqual({ status: "operational" });
    await expect(fetchPerformanceHistory(42)).resolves.toEqual({ builds: [] });
    expect(fetchMock.mock.calls[0][0]).toContain("/api/engineering/mission-control");
    expect(fetchMock.mock.calls[1][0]).toContain("limit=42");
  });

  it("envoie les samples sous forme JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ id: "sample-1" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await recordPerformanceSample({ buildId: "build-1", fps: 60 });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ buildId: "build-1", fps: 60 });
  });

  it("expose les erreurs HTTP avec le statut", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 503)));
    await expect(fetchMissionControlSnapshot()).rejects.toThrow("Engineering API HTTP 503");
  });

  it("trace l’identité, le volume et le découpage serveur d’une requête", async () => {
    const onTrace = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(
      { system: {}, database: {}, analyticsQueue: {}, jobs: {}, outbox: {} },
      200,
      { "Content-Type": "application/json", "Server-Timing": "security;dur=2, spring;dur=8;desc=Service" },
    )));
    await fetchMissionControlSnapshot({ onTrace });
    expect(onTrace).toHaveBeenCalledWith(expect.objectContaining({
      operation: "État technique du backend",
      initiator: "MissionControlPage",
      contentType: "application/json",
      payloadSignals: expect.arrayContaining(["JVM + système", "PostgreSQL", "Analytics queue", "Jobs", "Outbox"]),
      calledComponents: ["security", "Service"],
    }));
    expect(onTrace.mock.calls[0][0].serverTiming).toHaveLength(2);
    expect(onTrace.mock.calls[0][0].decodedBodyBytes).toBeGreaterThan(0);
  });


  it("pagine une file backend sans charger tous les éléments", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ kind: "jobs", page: 3, totalElements: 1000, items: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchEngineeringQueuePage("jobs", 3, 10)).resolves.toMatchObject({ kind: "jobs", page: 3 });
    expect(fetchMock.mock.calls[0][0]).toContain("/api/engineering/mission-control/queue?kind=jobs&page=3&size=10");
  });
});
