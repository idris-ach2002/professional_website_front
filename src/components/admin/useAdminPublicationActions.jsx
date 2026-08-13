import { useEffect, useRef } from "react";
import {
  apiRequest,
  isConcurrencyConflictError,
  versionEntityTag,
} from "../../services/authApi";

function draftFingerprint(value) {
  return JSON.stringify({
    label: value?.label?.trim?.() ?? "",
    description: value?.description ?? "",
  });
}

function draftFromVersion(version) {
  return {
    label: version?.label ?? "",
    description: version?.description ?? "",
  };
}

export default function useAdminPublicationActions(ctx) {
  const {
    selectedOwnerId, selectedVersionId, selectedVersion, versions, setVersions,
    publicationJobs, setPublicationJobs, publicationEvents, setPublicationEvents,
    publicationAudit, setPublicationAudit,
    publicationDiff, setPublicationDiff, publicationCompareVersionId, setPublicationCompareVersionId,
    publicationScheduleAt, setPublicationScheduleAt,
    publicationDraftMeta, setPublicationDraftMeta, publicationAutosaveState, setPublicationAutosaveState,
    publishValidationReport, setPublishValidationReport,
    runLatest, runMutation, refreshVersions, setError,
  } = ctx;

  const autosaveRevisionRef = useRef(null);
  const lastSavedFingerprintRef = useRef("");
  const draftRef = useRef(publicationDraftMeta);
  const autosaveTimerRef = useRef(null);
  const publishIntentRef = useRef(null);

  useEffect(() => {
    draftRef.current = publicationDraftMeta;
  }, [publicationDraftMeta]);

  useEffect(() => {
    if (!selectedVersionId || !selectedVersion) {
      autosaveRevisionRef.current = null;
      lastSavedFingerprintRef.current = "";
      return;
    }
    autosaveRevisionRef.current = selectedVersion.contentRevision;
    lastSavedFingerprintRef.current = draftFingerprint(draftFromVersion(selectedVersion));
  }, [selectedVersionId, selectedVersion]);

  async function fetchOperationalState(ownerId = selectedOwnerId, versionId = selectedVersionId, signal) {
    if (!ownerId) return { jobs: [], events: [], audit: [] };
    const auditPath = versionId
      ? `/manager/${ownerId}/publication-audit?versionId=${encodeURIComponent(versionId)}`
      : `/manager/${ownerId}/publication-audit`;
    const [jobs, events, audit] = await Promise.all([
      apiRequest("GET", `/manager/${ownerId}/jobs`, undefined, { signal }),
      apiRequest("GET", `/manager/${ownerId}/events`, undefined, { signal }),
      apiRequest("GET", auditPath, undefined, { signal }),
    ]);
    return { jobs: jobs ?? [], events: events ?? [], audit: audit ?? [] };
  }

  async function refreshPublicationOperationalState(ownerId = selectedOwnerId, versionId = selectedVersionId) {
    if (!ownerId) {
      setPublicationJobs([]);
      setPublicationEvents([]);
      setPublicationAudit([]);
      return null;
    }
    return runLatest(`publication-state:${ownerId}:${versionId ?? "all"}`, async ({ signal, commit }) => {
      const result = await fetchOperationalState(ownerId, versionId, signal);
      commit(() => {
        setPublicationJobs(result.jobs);
        setPublicationEvents(result.events);
        setPublicationAudit(result.audit);
      });
      return result;
    });
  }

  async function refreshAfterMutation(versionId = selectedVersionId) {
    await refreshVersions(selectedOwnerId, versionId);
    await refreshPublicationOperationalState(selectedOwnerId, versionId);
  }

  function currentIfMatch() {
    return versionEntityTag(selectedVersionId, autosaveRevisionRef.current ?? selectedVersion?.contentRevision);
  }

  function updatePublicationDraftMeta(field, value) {
    setPublicationDraftMeta((current) => ({ ...current, [field]: value }));
    setPublicationAutosaveState((current) => (
      current.status === "conflict"
        ? current
        : { ...current, status: "dirty", message: null }
    ));
  }

  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (!selectedOwnerId || !selectedVersionId || !selectedVersion) return undefined;
    if (["PUBLISHED", "SUPERSEDED", "SCHEDULED", "PUBLISHING"].includes(selectedVersion.publicationStatus)) return undefined;
    if (["conflict", "saving"].includes(publicationAutosaveState.status)) return undefined;

    const fingerprint = draftFingerprint(publicationDraftMeta);
    if (!publicationDraftMeta.label?.trim() || fingerprint === lastSavedFingerprintRef.current) return undefined;

    autosaveTimerRef.current = setTimeout(() => {
      const payload = {
        label: draftRef.current.label.trim(),
        description: draftRef.current.description,
      };
      const payloadFingerprint = draftFingerprint(payload);
      setPublicationAutosaveState((current) => ({ ...current, status: "saving", message: null }));

      runMutation(async () => {
        try {
          const saved = await apiRequest(
            "PUT",
            `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publication/draft-metadata`,
            payload,
            { ifMatch: versionEntityTag(selectedVersionId, autosaveRevisionRef.current) },
          );
          autosaveRevisionRef.current = saved.contentRevision;
          lastSavedFingerprintRef.current = payloadFingerprint;
          setVersions((current) => current.map((version) => (
            String(version.id) === String(saved.id) ? saved : version
          )));
          const stillCurrent = draftFingerprint(draftRef.current) === payloadFingerprint;
          setPublicationAutosaveState({
            status: stillCurrent ? "saved" : "dirty",
            lastSavedAt: new Date().toISOString(),
            message: null,
          });
          return saved;
        } catch (error) {
          if (isConcurrencyConflictError(error)) {
            setPublicationAutosaveState({
              status: "conflict",
              lastSavedAt: null,
              message: "Le brouillon a été modifié ailleurs. Recharge la version avant de continuer.",
            });
          } else {
            setPublicationAutosaveState({
              status: "error",
              lastSavedAt: null,
              message: error?.message ?? "Échec de l’autosave.",
            });
          }
          throw error;
        }
      });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [
    publicationDraftMeta,
    selectedOwnerId,
    selectedVersionId,
    selectedVersion,
    publicationAutosaveState.status,
    runMutation,
    setPublicationAutosaveState,
    setVersions,
  ]);

  async function validatePublicationReadiness() {
    if (!selectedOwnerId || !selectedVersionId) return setError("Sélectionne un owner et une version.");
    return runLatest(`publication-validation:${selectedVersionId}`, async ({ signal, commit }) => {
      const report = await apiRequest(
        "GET",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publish-validation`,
        undefined,
        { signal },
      );
      commit(() => setPublishValidationReport(report));
      return report;
    });
  }

  async function markVersionReady() {
    if (!selectedOwnerId || !selectedVersionId) return setError("Sélectionne un owner et une version.");
    await runMutation(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publication/ready`, undefined, { ifMatch: currentIfMatch() });
      await refreshAfterMutation();
      await validatePublicationReadiness();
    }, "Version validée et prête à publier.");
  }

  async function publishVersionNow() {
    if (!selectedOwnerId || !selectedVersionId) return setError("Sélectionne un owner et une version.");

    const intentId = `${selectedOwnerId}:${selectedVersionId}`;
    let intent = publishIntentRef.current;
    if (!intent || intent.intentId !== intentId) {
      intent = {
        intentId,
        key: globalThis.crypto?.randomUUID?.() ?? `publish-${Date.now()}-${selectedVersionId}`,
        callers: 0,
      };
      publishIntentRef.current = intent;
    }
    intent.callers += 1;
    const idempotencyKey = intent.key;

    try {
      await runMutation(async () => {
        await apiRequest("PUT", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publication/publish`, undefined, {
          ifMatch: currentIfMatch(),
          headers: { "Idempotency-Key": idempotencyKey },
        });
        await refreshAfterMutation();
      }, "Version publiée.");
    } finally {
      intent.callers -= 1;
      if (intent.callers === 0 && publishIntentRef.current === intent) {
        publishIntentRef.current = null;
      }
    }
  }

  async function schedulePublication() {
    if (!selectedOwnerId || !selectedVersionId || !publicationScheduleAt) return setError("Choisis une version et une date de publication.");
    const localDate = new Date(publicationScheduleAt);
    if (Number.isNaN(localDate.getTime()) || localDate.getTime() <= Date.now()) return setError("La date de publication doit être dans le futur.");
    const publishAt = localDate.toISOString();
    await runMutation(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publication/schedule`, { publishAt }, { ifMatch: currentIfMatch() });
      await refreshAfterMutation();
    }, "Publication programmée.");
  }

  async function cancelScheduledPublication() {
    if (!selectedOwnerId || !selectedVersionId) return setError("Sélectionne un owner et une version.");
    await runMutation(async () => {
      await apiRequest("DELETE", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publication/schedule`, undefined, { ifMatch: currentIfMatch() });
      setPublicationScheduleAt("");
      await refreshAfterMutation();
    }, "Publication programmée annulée.");
  }

  async function retryPublicationJob(jobId) {
    await runMutation(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/jobs/${jobId}/retry`);
      await refreshPublicationOperationalState();
    }, "Job remis en file d’attente.");
  }

  async function cancelPublicationJob(jobId) {
    await runMutation(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/jobs/${jobId}/cancel`);
      await refreshPublicationOperationalState();
    }, "Job annulé.");
  }

  async function retryPublicationEvent(eventId) {
    await runMutation(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/events/${eventId}/retry`);
      await refreshPublicationOperationalState();
    }, "Événement outbox remis en attente.");
  }

  async function comparePublicationVersions() {
    if (!selectedOwnerId || !selectedVersionId || !publicationCompareVersionId) {
      setPublicationDiff(null);
      return null;
    }
    return runLatest(`publication-diff:${selectedVersionId}:${publicationCompareVersionId}`, async ({ signal, commit }) => {
      const diff = await apiRequest("GET", `/manager/${selectedOwnerId}/versions/${publicationCompareVersionId}/diff/${selectedVersionId}`, undefined, { signal });
      commit(() => setPublicationDiff(diff));
      return diff;
    });
  }

  async function rollbackToVersion(sourceVersionId = publicationCompareVersionId) {
    if (!selectedOwnerId || !sourceVersionId) return setError("Choisis la version historique à restaurer.");
    const source = versions.find((version) => String(version.id) === String(sourceVersionId));
    await runMutation(async () => {
      const restored = await apiRequest("POST", `/manager/${selectedOwnerId}/versions/${sourceVersionId}/publication/rollback`, undefined, {
        ifMatch: versionEntityTag(source),
      });
      setPublicationCompareVersionId(null);
      setPublicationDiff(null);
      await refreshAfterMutation(restored?.id ?? selectedVersionId);
    }, "Rollback créé et publié comme nouvelle version.");
  }

  return {
    refreshPublicationOperationalState,
    validatePublicationReadiness,
    updatePublicationDraftMeta,
    markVersionReady,
    publishVersionNow,
    schedulePublication,
    cancelScheduledPublication,
    retryPublicationJob,
    cancelPublicationJob,
    retryPublicationEvent,
    comparePublicationVersions,
    rollbackToVersion,
    setPublicationCompareVersionId,
    versions,
    publicationJobs,
    publicationEvents,
    publicationAudit,
    publicationDiff,
    publicationCompareVersionId,
    publicationScheduleAt,
    setPublicationScheduleAt,
    publicationDraftMeta,
    publicationAutosaveState,
    publishValidationReport,
  };
}
