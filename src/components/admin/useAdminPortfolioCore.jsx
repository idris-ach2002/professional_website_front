import { useEffect, useMemo } from "react";
import { normalizeAdminPortfolioJson } from "../../utils/adminJsonImport";
import {
  apiRequest,
  isAuthRequiredError,
  logoutAdmin,
  buildBackendUrl
} from "../../services/authApi";
import {
  contactTypeOptions,
  applicationStatusOptions,
  applicationStatusLabels,
  applicationStatusColors,
  emptyApplicationForm,
  defaultOwnerContacts,
  emptyOwnerForm,
  emptyVersionForm,
  emptyProfileForm,
  emptyTimelineForm,
  emptyExperienceForm,
  emptyProjectForm,
  emptyProfileFiles,
  emptyExperienceFiles,
  emptyProjectFiles,
  experienceCategories,
  projectStatuses,
  cvSectionDefinitions,
  cvContentSections,
  cvTargetPresets,
  createCvId,
  cloneDeep,
  ensureCvId,
  normalizeCvString,
  collectSkillLabels,
  sortByDisplayOrder,
  createEmptyCvDocument,
  createCvDocumentFromVersionData,
  normalizeCvDocument,
  escapeLatex,
  sanitizeHexColor,
  safeCvAssetFilename,
  cvFileExtension,
  cvAssetMimeFromDataUrl,
  readCvAssetFile,
  inferSchoolDefaults,
  latexSchoolLinks,
  buildCvAssetsPayload,
  latexItemize,
  latexSection,
  enabledItems,
  clampNumber,
  latexSize,
  latexLeading,
  shortenCvText,
  cvMonthYear,
  cvDateLabel,
  cvYearRange,
  latexHref,
  contactValueFromDocument,
  buildLatexContact,
  buildDefaultSkillCards,
  buildLatexSkillCards,
  buildLatexExperience,
  buildLatexProject,
  buildLatexEducationEntry,
  buildLatexSectionContent,
  buildColumnLatex,
  buildCvLatexFromDocument,
  moveCvItem,
  cvTextSignature,
  scoreCvItemForKeywords,
  buildLocalCvQualityReport,
  extractOfferKeywords,
  buildOfferAnalysis,
  diffCvDocuments,
  toArray,
  toCsv,
  getEntityId,
  getProjectId,
  getOwnerLabel,
  normalizeDate,
  nullIfBlank,
  createEmptyContact,
  cloneContactRows,
  sanitizeContactRows,
  hydrateOwnerForm,
  normalizeGeneratedFileUrl,
  normalizeUrlFromUpload,
  hydrateProfileForm,
  hydrateTimelineForm,
  hydrateExperiences,
  hydrateExperienceFormForEditing,
  normalizeExperienceOrder,
  getProjectArchitectureUrl,
  hydrateProjectForm,
  downloadTextFile,
  escapeHtml,
  highlightJson,
  getLineColumnFromPosition,
  getJsonSyntaxLocation,
  buildJsonEditorAnalysis,
  JsonCodeEditor,
  FileLink,
  AdminAuthShell,
  AdminChecking,
  AdminLoginRedirect,
  uploadFile
} from "./adminCore";

export default function useAdminPortfolioCore(ctx) {
  const {
    loading, setLoading, message, setMessage,
    error, setError, authStatus, setAuthStatus,
    owners, setOwners, versions, setVersions,
    projects, setProjects, selectedOwnerId, setSelectedOwnerId,
    selectedVersionId, setSelectedVersionId, selectedProjectId, setSelectedProjectId,
    projectMode, setProjectMode, cloneSourceVersionId, setCloneSourceVersionId,
    ownerForm, setOwnerForm, versionForm, setVersionForm,
    profileForm, setProfileForm, timelineForm, setTimelineForm,
    experienceForm, setExperienceForm, experiences, setExperiences,
    experienceMode, setExperienceMode, selectedExperienceIndex, setSelectedExperienceIndex,
    projectForm, setProjectForm, profileFiles, setProfileFiles,
    experienceFiles, setExperienceFiles, projectFiles, setProjectFiles,
    jsonImportFile, setJsonImportFile, jsonImportText, setJsonImportText,
    jsonImportSummary, setJsonImportSummary, jsonEditorOpened, setJsonEditorOpened,
    jsonEditorText, setJsonEditorText, jsonEditorError, setJsonEditorError,
    cvEditorState, setCvEditorState, cvSelectedSection, setCvSelectedSection,
    cvActiveEditorTab, setCvActiveEditorTab, cvDraggingItem, setCvDraggingItem,
    cvManualLatexDirty, setCvManualLatexDirty, cvLatexSource, setCvLatexSource,
    cvPreviewUrl, setCvPreviewUrl, cvCompileLogs, setCvCompileLogs,
    cvCompileWarnings, setCvCompileWarnings, cvCompileSuccess, setCvCompileSuccess,
    cvTemplateLocked, setCvTemplateLocked, cvQualityReport, setCvQualityReport,
    cvVariants, setCvVariants, selectedCvVariantId, setSelectedCvVariantId,
    cvVariantName, setCvVariantName, cvDiffReport, setCvDiffReport,
    cvOfferText, setCvOfferText, cvOfferAnalysis, setCvOfferAnalysis,
    cvPresetName, setCvPresetName, cvCommandPresets, setCvCommandPresets,
    cvExportZipUrl, setCvExportZipUrl, cvAsyncJob, setCvAsyncJob,
    cvRegressionReport, setCvRegressionReport, portfolioHealthReport, setPortfolioHealthReport,
    publishValidationReport, setPublishValidationReport, portfolioBackupUrl, setPortfolioBackupUrl,
    portfolioBackupJson, setPortfolioBackupJson, portfolioRestoreText, setPortfolioRestoreText,
    portfolioRestoreLabel, setPortfolioRestoreLabel, applications, setApplications,
    applicationsDashboard, setApplicationsDashboard, selectedApplicationId, setSelectedApplicationId,
    applicationForm, setApplicationForm, offerAnalysis, setOfferAnalysis,
    coverLetterPreviewUrl, setCoverLetterPreviewUrl, coverLetterLogs, setCoverLetterLogs,
    coverLetterWarnings, setCoverLetterWarnings, applicationZipUrl, setApplicationZipUrl,
    smartAnalysis, setSmartAnalysis, letterTemplates, setLetterTemplates,
    selectedLetterVariantId, setSelectedLetterVariantId, selectedCvProposalId, setSelectedCvProposalId,
    smartPackUrl, setSmartPackUrl, adminActiveTab, setAdminActiveTab,
    selectedSmartCommandKeys, setSelectedSmartCommandKeys, commandTraceOpened, setCommandTraceOpened,
    commandTraceStatus, setCommandTraceStatus, commandTraceTitle, setCommandTraceTitle,
    commandTraceEntries, setCommandTraceEntries, jsonEditorAnalysis, cvDocument,
    cvCanUndo, cvCanRedo, cvSelectedItems, cvQualitySummary,
    selectedVersion, selectedProject, selectedApplication, resetCvEditorFromData,
    applyCvCommand, createCvVariantSnapshot, applyCvTargetPreset, previewGeneratedCv,
    generateCvLatexSource, saveGeneratedCvToVersion, buildCvGenerationPayload, applyNormalizedPortfolioData,
    buildCurrentVersionJsonPayload
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
