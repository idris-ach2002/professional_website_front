import {
  useEffect,
  } from "react";

import {
  apiRequest,
  isAbortError,
  isAuthRequiredError,
  } from "../../services/authApi";
import {
  emptyVersionForm,
  emptyProfileForm,
  emptyTimelineForm,
  emptyExperienceForm,
  emptyProjectForm,
  emptyExperienceFiles,
  emptyProjectFiles,
  getEntityId,
  getProjectId,
  createEmptyContact,
  hydrateOwnerForm,
  hydrateProfileForm,
  hydrateTimelineForm,
  hydrateExperiences,
  hydrateExperienceFormForEditing,
  hydrateProjectForm,
} from "./adminCoreUtils";

export default function useAdminPortfolioCore(ctx) {
  const {
    setError,
    setAuthStatus,
    runAction,
    runLatest,
    owners,
    setOwners,
    versions,
    setVersions,
    projects,
    setProjects,
    selectedOwnerId,
    setSelectedOwnerId,
    selectedVersionId,
    setSelectedVersionId,
    setSelectedProjectId,
    setProjectMode,
    setCloneSourceVersionId,
    setOwnerForm,
    setVersionForm,
    setProfileForm,
    setTimelineForm,
    setExperienceForm,
    experiences,
    setExperiences,
    setExperienceMode,
    setSelectedExperienceIndex,
    setProjectForm,
    setExperienceFiles,
    setProjectFiles,
    setPublicationScheduleAt,
    setPublicationCompareVersionId,
    setPublicationDiff,
    setPublicationDraftMeta,
    setPublicationAutosaveState
  } = ctx;

  function updateOwnerForm(field, value) {
    setOwnerForm((current) => ({ ...current, [field]: value }));
  }

  function updateOwnerContact(index, field, value) {
    setOwnerForm((current) => ({
      ...current,
      contacts: current.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact,
      ),
    }));
  }

  function addOwnerContact() {
    setOwnerForm((current) => ({
      ...current,
      contacts: [...current.contacts, createEmptyContact()],
    }));
  }

  function removeOwnerContact(index) {
    setOwnerForm((current) => {
      const contacts = current.contacts.filter((_, contactIndex) => contactIndex !== index);
      return {
        ...current,
        contacts: contacts.length > 0 ? contacts : [createEmptyContact()],
      };
    });
  }

  function updateVersionForm(field, value) {
    setVersionForm((current) => ({ ...current, [field]: value }));
  }

  function updateProfileForm(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function updateTimelineForm(field, value) {
    setTimelineForm((current) => ({ ...current, [field]: value }));
  }

  function updateExperienceForm(field, value) {
    setExperienceForm((current) => ({ ...current, [field]: value }));
  }

  function resetExperienceForm(sourceExperiences = experiences) {
    setExperienceMode("create");
    setSelectedExperienceIndex(null);
    setExperienceForm({
      ...emptyExperienceForm,
      displayOrder: (sourceExperiences?.length ?? 0) + 1,
    });
    setExperienceFiles(emptyExperienceFiles);
  }

  function selectExperience(index, sourceExperiences = experiences) {
    const numericIndex = Number(index);
    const experience = sourceExperiences[numericIndex];

    if (!experience) {
      resetExperienceForm(sourceExperiences);
      return;
    }

    setExperienceMode("edit");
    setSelectedExperienceIndex(numericIndex);
    setExperienceForm(hydrateExperienceFormForEditing(experience, numericIndex));
    setExperienceFiles(emptyExperienceFiles);
  }

  function updateProjectForm(field, value) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function hydrateVersionForms(version) {
    if (!version) {
      setVersionForm({ ...emptyVersionForm });
      setProfileForm({ ...emptyProfileForm });
      setTimelineForm({ ...emptyTimelineForm });
      setExperiences([]);
      resetExperienceForm([]);
      setProjects([]);
      resetProjectForm();
      return;
    }

    const nextProfile = hydrateProfileForm(version.prof);
    const nextTimeline = hydrateTimelineForm(version.timeline);
    const nextExperiences = hydrateExperiences(version.timeline);
    const nextProjects = version.projects ?? [];

    setVersionForm({
      versionTag: version.versionTag ?? "",
      label: version.label ?? "",
      description: version.description ?? "",
      active: Boolean(version.active),
      published: Boolean(version.published),
    });

    setProfileForm(nextProfile);
    setTimelineForm(nextTimeline);
    setExperiences(nextExperiences);
    resetExperienceForm(nextExperiences);
    setProjects(nextProjects);
    setCloneSourceVersionId(String(getEntityId(version)));
    resetProjectForm(nextProjects);
  }

  function resetProjectForm(sourceProjects = projects) {
    setProjectMode("create");
    setSelectedProjectId(null);
    setProjectForm({
      ...emptyProjectForm,
      caseStudy: { ...(emptyProjectForm.caseStudy ?? {}) },
      displayOrder: (sourceProjects?.length ?? 0) + 1,
    });
    setProjectFiles(emptyProjectFiles);
  }

  function selectProject(projectId, sourceProjects = projects) {
    const project = sourceProjects.find(
      (item) => String(getProjectId(item)) === String(projectId),
    );

    if (!project) {
      resetProjectForm();
      return;
    }

    setProjectMode("edit");
    setSelectedProjectId(String(getProjectId(project)));
    setProjectForm(hydrateProjectForm(project));
    setProjectFiles(emptyProjectFiles);
  }

  function selectVersion(versionId, sourceVersions = versions) {
    const version = sourceVersions.find(
      (item) => String(getEntityId(item)) === String(versionId),
    );

    setSelectedVersionId(versionId ? String(versionId) : null);
    setPublicationScheduleAt?.("");
    setPublicationCompareVersionId?.(null);
    setPublicationDiff?.(null);
    setPublicationDraftMeta?.({
      label: version?.label ?? "",
      description: version?.description ?? "",
    });
    setPublicationAutosaveState?.({ status: version ? "saved" : "idle", lastSavedAt: null, message: null });
    hydrateVersionForms(version);
  }

  async function fetchOwners(signal) {
    const data = await apiRequest("GET", "/manager", undefined, { signal });
    return Array.isArray(data) ? data : [];
  }

  async function fetchVersions(ownerId, signal) {
    if (!ownerId) return [];
    const data = await apiRequest("GET", `/manager/${ownerId}/versions`, undefined, { signal });
    return Array.isArray(data) ? data : [];
  }

  async function fetchProjects(ownerId, versionId, signal) {
    if (!ownerId || !versionId) return [];
    const data = await apiRequest(
      "GET",
      `/manager/${ownerId}/versions/${versionId}/projects`,
      undefined,
      { signal },
    );
    return Array.isArray(data) ? data : [];
  }

  async function refreshOwners({ selectLast = false } = {}) {
    return runLatest("owners", async ({ signal, commit }) => {
      const ownerList = await fetchOwners(signal);
      const targetOwner = selectLast ? ownerList.at(-1) : ownerList[0];
      const targetOwnerId = getEntityId(targetOwner);
      const versionList = targetOwnerId ? await fetchVersions(targetOwnerId, signal) : [];
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];

      commit(() => {
        setOwners(ownerList);
        setOwnerForm(hydrateOwnerForm(targetOwner));
        setSelectedOwnerId(targetOwnerId ? String(targetOwnerId) : null);
        setVersions(versionList);
        selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
      });

      return ownerList;
    }, "Owners chargés.");
  }

  async function refreshVersions(ownerId = selectedOwnerId, preferredVersionId = null) {
    if (!ownerId) {
      setError("Sélectionne d’abord un profil.");
      return null;
    }

    return runLatest(`versions:${ownerId}`, async ({ signal, commit }) => {
      const versionList = await fetchVersions(ownerId, signal);
      const preferredVersion = versionList.find(
        (version) => String(getEntityId(version)) === String(preferredVersionId),
      );
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];

      commit(() => {
        setVersions(versionList);
        selectVersion(
          String(getEntityId(preferredVersion ?? activeVersion ?? firstVersion ?? {})),
          versionList,
        );
      });
      return versionList;
    }, "Versions chargées.");
  }

  async function refreshProjects(preferredProjectId = null) {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return null;
    }

    return runLatest(`projects:${selectedOwnerId}:${selectedVersionId}`, async ({ signal, commit }) => {
      const projectList = await fetchProjects(selectedOwnerId, selectedVersionId, signal);
      const preferredProject = preferredProjectId
        ? projectList.find((item) => String(getProjectId(item)) === String(preferredProjectId))
        : null;

      commit(() => {
        setProjects(projectList);
        setVersions((current) =>
          current.map((version) =>
            String(getEntityId(version)) === String(selectedVersionId)
              ? { ...version, projects: projectList }
              : version,
          ),
        );

        if (preferredProject) {
          selectProject(String(getProjectId(preferredProject)), projectList);
        } else {
          resetProjectForm(projectList);
        }
      });

      return projectList;
    }, "Projets chargés.");
  }

  async function handleOwnerChange(ownerId) {
    const selectedOwner = owners.find((owner) => String(getEntityId(owner)) === String(ownerId));

    setSelectedOwnerId(ownerId);
    setOwnerForm(hydrateOwnerForm(selectedOwner));
    setSelectedVersionId(null);
    setSelectedProjectId(null);
    setVersions([]);
    setProjects([]);

    if (!ownerId) return;

    await runLatest("owner-selection", async ({ signal, commit }) => {
      const versionList = await fetchVersions(ownerId, signal);
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      commit(() => {
        setVersions(versionList);
        selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
      });
    }, "Versions du owner chargées.");
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
      setAuthStatus("checking");
      setError(null);

      try {
        const ownerList = await fetchOwners(controller.signal);
        if (controller.signal.aborted) return;

        const firstOwner = ownerList[0];
        const firstOwnerId = getEntityId(firstOwner);
        let versionList = [];

        if (firstOwnerId) {
          versionList = await fetchVersions(firstOwnerId, controller.signal);
        }

        if (controller.signal.aborted) return;

        setOwners(ownerList);
        setOwnerForm(hydrateOwnerForm(firstOwner));
        setSelectedOwnerId(firstOwnerId ? String(firstOwnerId) : null);
        setVersions(versionList);

        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        const versionToSelect = activeVersion ?? firstVersion;

        if (versionToSelect) {
          setSelectedVersionId(String(getEntityId(versionToSelect)));
          hydrateVersionForms(versionToSelect, hydrateOwnerForm(firstOwner));
        }

        setAuthStatus("authenticated");
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return;

        if (isAuthRequiredError(err)) {
          setAuthStatus("login");
          return;
        }

        setAuthStatus("authenticated");
        setError(err?.message ?? "Impossible de charger les données admin.");
      }
    }

    loadInitialData();

    return () => {
      controller.abort();
    };
    // hydrateVersionForms must use the first payload from the initial admin bootstrap only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    updateOwnerForm,
    updateOwnerContact,
    addOwnerContact,
    removeOwnerContact,
    updateVersionForm,
    updateProfileForm,
    updateTimelineForm,
    updateExperienceForm,
    resetExperienceForm,
    selectExperience,
    updateProjectForm,
    hydrateVersionForms,
    resetProjectForm,
    selectProject,
    selectVersion,
    fetchOwners,
    fetchVersions,
    fetchProjects,
    runAction,
    refreshOwners,
    refreshVersions,
    refreshProjects,
    handleOwnerChange
  };
}
