import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AdminPublicationStudio from "./AdminPublicationStudio";

function controller(overrides = {}) {
  return {
    selectedOwnerId: "1",
    selectedVersionId: "2",
    selectedVersion: {
      id: 2,
      contentRevision: 4,
      versionTag: "v2",
      label: "Draft",
      active: false,
      published: false,
      publicationStatus: "READY",
      updatedAt: "2026-08-13T09:00:00",
      scheduledAt: null,
    },
    versions: [
      { id: 1, contentRevision: 3, versionTag: "v1", label: "Published" },
      { id: 2, contentRevision: 4, versionTag: "v2", label: "Draft" },
    ],
    publicationJobs: [
      { id: "job-1", type: "PUBLICATION", status: "QUEUED", progress: 0, attempts: 0, maxAttempts: 3, createdAt: "2026-08-13T09:00:00", executeAfter: "2026-08-13T12:00:00" },
    ],
    publicationEvents: [
      { id: "event-1", eventType: "VERSION_PUBLICATION_SCHEDULED", status: "DISPATCHED", attempts: 1, createdAt: "2026-08-13T09:00:00", payloadJson: "{}" },
    ],
    publicationAudit: [
      { id: "audit-1", action: "VERSION_PUBLICATION_SCHEDULED", actor: "admin", createdAt: "2026-08-13T09:00:00", correlationId: "corr-1", metadataJson: "{}" },
    ],
    publicationDraftMeta: { label: "Draft", description: "Description" },
    publicationAutosaveState: { status: "saved", lastSavedAt: null, message: null },
    updatePublicationDraftMeta: vi.fn(),
    publishValidationReport: null,
    validatePublicationReadiness: vi.fn(),
    publicationDiff: null,
    publicationCompareVersionId: "1",
    setPublicationCompareVersionId: vi.fn(),
    publicationScheduleAt: "",
    setPublicationScheduleAt: vi.fn(),
    markVersionReady: vi.fn(),
    publishVersionNow: vi.fn(),
    schedulePublication: vi.fn(),
    cancelScheduledPublication: vi.fn(),
    retryPublicationJob: vi.fn(),
    cancelPublicationJob: vi.fn(),
    retryPublicationEvent: vi.fn(),
    comparePublicationVersions: vi.fn(),
    rollbackToVersion: vi.fn(),
    refreshPublicationOperationalState: vi.fn(),
    loading: false,
    ...overrides,
  };
}

function renderStudio(state) {
  return render(<MantineProvider><AdminPublicationStudio controller={state} /></MantineProvider>);
}

describe("AdminPublicationStudio", () => {
  it("exposes publication lifecycle, jobs and event stream", () => {
    renderStudio(controller());
    expect(screen.getByText("Publication Studio")).toBeInTheDocument();
    expect(screen.getAllByText("READY").length).toBeGreaterThan(0);
    expect(screen.getByText("Background Job Center")).toBeInTheDocument();
    expect(screen.getByText("PUBLICATION")).toBeInTheDocument();
    expect(screen.getAllByText("VERSION_PUBLICATION_SCHEDULED")).toHaveLength(2);
    expect(screen.getByText("Pre-Publish Center")).toBeInTheDocument();
    expect(screen.getByText("Audit immuable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ouvrir l’aperçu sécurisé" })).toHaveAttribute("href", "/admin/preview/1/2?locale=fr");
  });

  it("publishes through the controller action and exposes rollback", async () => {
    const user = userEvent.setup();
    const state = controller();
    renderStudio(state);

    await user.click(screen.getByRole("button", { name: "Publier maintenant" }));
    expect(state.publishVersionNow).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Rollback vers cette version" }));
    expect(state.rollbackToVersion).toHaveBeenCalledOnce();
  });

  it("does not expose cancellation for an already-running publication job", () => {
    renderStudio(controller({
      publicationJobs: [{ id: "job-2", type: "PUBLICATION", status: "RUNNING", progress: 30, attempts: 1, maxAttempts: 3 }],
    }));
    expect(screen.getAllByRole("button", { name: "Annuler" })).toHaveLength(1);
  });
});
