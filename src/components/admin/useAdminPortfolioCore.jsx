import {
  useEffect,
  } from "react";

import {
  apiRequest,
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
    setLoading,
    setMessage,
    setError,
    setAuthStatus,
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
    ownerForm,
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
    resetCvEditorFromData
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

  function hydrateVersionForms(version, sourceOwner = ownerForm) {
    if (!version) {
      setVersionForm({ ...emptyVersionForm });
      setProfileForm({ ...emptyProfileForm });
      setTimelineForm({ ...emptyTimelineForm });
      setExperiences([]);
      resetExperienceForm([]);
      setProjects([]);
      resetProjectForm();
      resetCvEditorFromData({
        owner: sourceOwner,
        profile: emptyProfileForm,
        experiences: [],
        projects: [],
        label: "CV réinitialisé",
      });
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
    resetCvEditorFromData({
      owner: sourceOwner,
      profile: nextProfile,
      experiences: nextExperiences,
      projects: nextProjects,
      label: "CV synchronisé avec la version sélectionnée",
    });
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
    hydrateVersionForms(version);
  }

  async function fetchOwners() {
    const data = await apiRequest("GET", "/manager");
    return Array.isArray(data) ? data : [];
  }

  async function fetchVersions(ownerId) {
    if (!ownerId) return [];
    const data = await apiRequest("GET", `/manager/${ownerId}/versions`);
    return Array.isArray(data) ? data : [];
  }

  async function fetchProjects(ownerId, versionId) {
    if (!ownerId || !versionId) return [];
    const data = await apiRequest(
      "GET",
      `/manager/${ownerId}/versions/${versionId}/projects`,
    );
    return Array.isArray(data) ? data : [];
  }

  async function runAction(action, successMessage) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await action();
      if (successMessage) setMessage(successMessage);
      return result;
    } catch (err) {
      if (isAuthRequiredError(err)) {
        setAuthStatus("login");
        return null;
      }

      setError(err?.message ?? "Une erreur est survenue.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function refreshOwners({ selectLast = false } = {}) {
    return runAction(async () => {
      const ownerList = await fetchOwners();
      setOwners(ownerList);

      const targetOwner = selectLast ? ownerList.at(-1) : ownerList[0];
      const targetOwnerId = getEntityId(targetOwner);

      setOwnerForm(hydrateOwnerForm(targetOwner));

      if (targetOwnerId) {
        setSelectedOwnerId(String(targetOwnerId));
        const versionList = await fetchVersions(targetOwnerId);
        setVersions(versionList);
        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
      }

      return ownerList;
    }, "Owners chargés.");
  }

  async function refreshVersions(ownerId = selectedOwnerId, preferredVersionId = null) {
    if (!ownerId) {
      setError("Sélectionne d’abord un profil.");
      return null;
    }

    return runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const preferredVersion = versionList.find(
        (version) => String(getEntityId(version)) === String(preferredVersionId),
      );
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(
        String(getEntityId(preferredVersion ?? activeVersion ?? firstVersion ?? {})),
        versionList,
      );
      return versionList;
    }, "Versions chargées.");
  }

  async function refreshProjects(preferredProjectId = null) {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return null;
    }

    return runAction(async () => {
      const projectList = await fetchProjects(selectedOwnerId, selectedVersionId);
      setProjects(projectList);
      setVersions((current) =>
        current.map((version) =>
          String(getEntityId(version)) === String(selectedVersionId)
            ? { ...version, projects: projectList }
            : version,
        ),
      );

      if (preferredProjectId) {
        const project = projectList.find(
          (item) => String(getProjectId(item)) === String(preferredProjectId),
        );
        if (project) selectProject(String(getProjectId(project)), projectList);
      } else {
        resetProjectForm(projectList);
      }

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

    await runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
    }, "Versions du owner chargées.");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setAuthStatus("checking");
      setError(null);

      try {
        const ownerList = await fetchOwners();
        if (cancelled) return;

        const firstOwner = ownerList[0];
        const firstOwnerId = getEntityId(firstOwner);
        let versionList = [];

        if (firstOwnerId) {
          versionList = await fetchVersions(firstOwnerId);
        }

        if (cancelled) return;

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
        if (cancelled) return;

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
      cancelled = true;
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
