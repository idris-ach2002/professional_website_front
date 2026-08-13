import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useAdminPublicationActions from "./useAdminPublicationActions";
import { apiRequest, isConcurrencyConflictError } from "../../services/authApi";

vi.mock("../../services/authApi", () => ({
  apiRequest: vi.fn(),
  versionEntityTag: vi.fn(() => '"version-2-4"'),
  isConcurrencyConflictError: vi.fn(() => false),
}));

function futureLocalInput(hours = 24) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function context(overrides = {}) {
  return {
    selectedOwnerId: "1",
    selectedVersionId: "2",
    selectedVersion: { id: 2, contentRevision: 4, label: "Draft", description: "Description", publicationStatus: "READY" },
    versions: [{ id: 1, contentRevision: 3 }, { id: 2, contentRevision: 4 }],
    setVersions: vi.fn(),
    publicationJobs: [],
    setPublicationJobs: vi.fn(),
    publicationEvents: [],
    setPublicationEvents: vi.fn(),
    publicationAudit: [],
    setPublicationAudit: vi.fn(),
    publicationDiff: null,
    setPublicationDiff: vi.fn(),
    publicationCompareVersionId: "1",
    setPublicationCompareVersionId: vi.fn(),
    publicationScheduleAt: futureLocalInput(),
    setPublicationScheduleAt: vi.fn(),
    publicationDraftMeta: { label: "Draft", description: "Description" },
    setPublicationDraftMeta: vi.fn(),
    publicationAutosaveState: { status: "saved", lastSavedAt: null, message: null },
    setPublicationAutosaveState: vi.fn(),
    publishValidationReport: null,
    setPublishValidationReport: vi.fn(),
    setError: vi.fn(),
    refreshVersions: vi.fn().mockResolvedValue([]),
    runMutation: vi.fn(async (operation) => {
      try {
        return await operation();
      } catch {
        return null;
      }
    }),
    runLatest: vi.fn(async (_lane, operation) => operation({ signal: undefined, commit: (fn) => fn() })),
    ...overrides,
  };
}

describe("useAdminPublicationActions", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

  it("publishes with If-Match and an idempotency key", async () => {
    apiRequest.mockResolvedValue({ id: 2, contentRevision: 5 });
    const ctx = context();
    const { result } = renderHook(() => useAdminPublicationActions(ctx));

    await act(async () => result.current.publishVersionNow());

    expect(apiRequest).toHaveBeenCalledWith(
      "PUT",
      "/manager/1/versions/2/publication/publish",
      undefined,
      expect.objectContaining({
        ifMatch: '"version-2-4"',
        headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
      }),
    );
  });


  it("reuses the same idempotency key for concurrent publish intent", async () => {
    let releasePublish;
    const publicationGate = new Promise((resolve) => { releasePublish = resolve; });
    apiRequest.mockImplementation(async (method, path) => {
      if (method === "PUT" && path.endsWith("/publication/publish")) {
        await publicationGate;
        return { id: 2, contentRevision: 5 };
      }
      return [];
    });
    const ctx = context();
    const { result } = renderHook(() => useAdminPublicationActions(ctx));

    let first;
    let second;
    await act(async () => {
      first = result.current.publishVersionNow();
      second = result.current.publishVersionNow();
      await Promise.resolve();
      releasePublish();
      await Promise.all([first, second]);
    });

    const publishCalls = apiRequest.mock.calls.filter(([method, path]) => (
      method === "PUT" && path === "/manager/1/versions/2/publication/publish"
    ));
    expect(publishCalls).toHaveLength(2);
    expect(publishCalls[0][3].headers["Idempotency-Key"]).toBe(publishCalls[1][3].headers["Idempotency-Key"]);
  });


  it("sends scheduled publication as an absolute instant with timezone offset", async () => {
    const localValue = futureLocalInput();
    const expectedInstant = new Date(localValue).toISOString();
    apiRequest.mockResolvedValue({ id: 2, contentRevision: 5 });
    const ctx = context({ publicationScheduleAt: localValue });
    const { result } = renderHook(() => useAdminPublicationActions(ctx));

    await act(async () => result.current.schedulePublication());

    expect(apiRequest).toHaveBeenCalledWith(
      "PUT",
      "/manager/1/versions/2/publication/schedule",
      { publishAt: expectedInstant },
      expect.objectContaining({ ifMatch: '"version-2-4"' }),
    );
    expect(expectedInstant).toMatch(/Z$/);
  });

  it("refuses a publication date in the past before hitting the API", async () => {
    const ctx = context({ publicationScheduleAt: "2020-01-01T12:00" });
    const { result } = renderHook(() => useAdminPublicationActions(ctx));

    await act(async () => result.current.schedulePublication());

    expect(ctx.setError).toHaveBeenCalledWith(expect.stringContaining("futur"));
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("requests a structural diff from the historical version to the current version", async () => {
    apiRequest.mockResolvedValue({ changeCount: 2, changes: [] });
    const ctx = context();
    const { result } = renderHook(() => useAdminPublicationActions(ctx));

    await act(async () => result.current.comparePublicationVersions());

    expect(apiRequest).toHaveBeenCalledWith(
      "GET",
      "/manager/1/versions/1/diff/2",
      undefined,
      expect.objectContaining({ signal: undefined }),
    );
    expect(ctx.setPublicationDiff).toHaveBeenCalledWith(expect.objectContaining({ changeCount: 2 }));
  });

  it("coalesces draft metadata into an ETag-protected autosave", async () => {
    vi.useFakeTimers();
    apiRequest.mockResolvedValue({ id: 2, contentRevision: 5, label: "Changed", description: "Description", publicationStatus: "DRAFT" });
    const ctx = context({ publicationDraftMeta: { label: "Changed", description: "Description" } });
    renderHook(() => useAdminPublicationActions(ctx));

    await act(async () => {
      vi.advanceTimersByTime(801);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "PUT",
      "/manager/1/versions/2/publication/draft-metadata",
      { label: "Changed", description: "Description" },
      expect.objectContaining({ ifMatch: '"version-2-4"' }),
    );
    expect(ctx.setPublicationAutosaveState).toHaveBeenCalledWith(expect.objectContaining({ status: expect.stringMatching(/saved|dirty/) }));
  });

  it("surfaces an optimistic-concurrency conflict during autosave", async () => {
    vi.useFakeTimers();
    const conflict = Object.assign(new Error("stale"), { name: "ConcurrencyConflictError" });
    apiRequest.mockRejectedValue(conflict);
    isConcurrencyConflictError.mockReturnValue(true);
    const ctx = context({ publicationDraftMeta: { label: "Changed", description: "Description" } });
    renderHook(() => useAdminPublicationActions(ctx));

    await act(async () => {
      vi.advanceTimersByTime(801);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(ctx.setPublicationAutosaveState).toHaveBeenCalledWith(expect.objectContaining({ status: "conflict" }));
  });

});
