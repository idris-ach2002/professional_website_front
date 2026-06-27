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
  buildProjectCaseStudyPayload,
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

export default function useAdminJsonWorkspace(ctx) {
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
    commandTraceEntries, setCommandTraceEntries, cvDocument, cvCanUndo,
    cvCanRedo, cvSelectedItems, cvQualitySummary, selectedVersion,
    selectedProject, selectedApplication, resetCvEditorFromData, applyCvCommand,
    createCvVariantSnapshot, applyCvTargetPreset, previewGeneratedCv, generateCvLatexSource,
    saveGeneratedCvToVersion, buildCvGenerationPayload, runAction, fetchOwners,
    fetchVersions, fetchProjects, refreshOwners, refreshVersions,
    refreshProjects, selectVersion, selectProject, resetProjectForm,
    resetExperienceForm, selectExperience
  } = ctx;

  const jsonEditorAnalysis = useMemo(
    () => buildJsonEditorAnalysis(jsonEditorText),
    [jsonEditorText],
  );

  function applyNormalizedPortfolioData(normalized, { notify = true } = {}) {
    const normalizedExperiences = normalized.experiences;
    const normalizedProjects = normalized.projects;

    setOwnerForm((current) => ({
      ...current,
      ...normalized.ownerForm,
      contacts: normalized.ownerForm.contacts.length > 0
        ? normalized.ownerForm.contacts
        : [createEmptyContact()],
    }));
    setVersionForm((current) => ({ ...current, ...normalized.versionForm }));
    setProfileForm((current) => ({ ...current, ...normalized.profileForm }));
    setTimelineForm((current) => ({ ...current, ...normalized.timelineForm }));
    setExperiences(normalizedExperiences);
    setProjects(normalizedProjects);
    setExperienceForm({
      ...emptyExperienceForm,
      displayOrder: normalizedExperiences.length + 1,
    });
    setExperienceFiles(emptyExperienceFiles);
    setProjectMode("create");
    setSelectedProjectId(null);
    setProjectForm({
      ...emptyProjectForm,
      displayOrder: normalizedProjects.length + 1,
    });
    setProjectFiles(emptyProjectFiles);
    setProfileFiles(emptyProfileFiles);
    setJsonImportSummary(normalized.summary);
    resetCvEditorFromData({
      owner: normalized.ownerForm,
      profile: normalized.profileForm,
      experiences: normalizedExperiences,
      projects: normalizedProjects,
      label: "CV synchronisé avec l’import JSON",
    });

    if (notify) {
      setMessage(
        `JSON importé dans le formulaire : ${normalized.summary.experiences} expérience(s), ${normalized.summary.projects} projet(s), ${normalized.summary.contacts} contact(s).`,
      );
    }

    setError(null);
  }

  function applyImportedPortfolioData(rawPayload) {
    const normalized = normalizeAdminPortfolioJson(rawPayload);
    applyNormalizedPortfolioData(normalized);
  }

  async function importJsonFromFile() {
    if (!jsonImportFile) {
      setError("Sélectionne d’abord un fichier JSON.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const content = await jsonImportFile.text();
      const parsedPayload = JSON.parse(content);
      applyImportedPortfolioData(parsedPayload);
      setJsonImportFile(null);
    } catch (err) {
      setError(err?.message ?? "Import JSON impossible.");
    } finally {
      setLoading(false);
    }
  }

  function importJsonFromText() {
    if (!jsonImportText.trim()) {
      setError("Colle un JSON ou sélectionne un fichier JSON.");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const parsedPayload = JSON.parse(jsonImportText);
      applyImportedPortfolioData(parsedPayload);
    } catch (err) {
      setError(err?.message ?? "Le JSON collé est invalide.");
    }
  }

  function buildOwnerIdentityPayloadFromData(form) {
    return {
      name: form.name,
      firstName: form.firstName,
      age: Number(form.age),
      active: form.active,
      address: form.address,
      contacts: sanitizeContactRows(form.contacts),
      versionTag: null,
      versionLabel: null,
      versionDescription: null,
      versionPublished: null,
      prof: null,
      timeline: null,
      projects: null,
    };
  }

  function buildProfilePayloadFromData(form) {
    return {
      title: form.title,
      subtitle: form.subtitle,
      headline: form.headline,
      shortDescription: form.shortDescription,
      description: form.description,
      location: form.location,
      availability: form.availability,
      profileImageUrl: nullIfBlank(form.profileImageUrl),
      logoUrl: nullIfBlank(form.logoUrl),
      cvUrl: nullIfBlank(form.cvUrl),
      portfolioUrl: nullIfBlank(form.portfolioUrl),
    };
  }

  function normalizeCurrentExperienceForExport(experience, index) {
    const currentPosition = Boolean(experience.currentPosition);

    return {
      category: experience.category ?? "SCHOOL",
      title: experience.title ?? "",
      organization: experience.organization ?? "",
      location: experience.location ?? "",
      summary: experience.summary ?? "",
      description: experience.description ?? "",
      startDate: normalizeDate(experience.startDate),
      endDate: currentPosition ? null : normalizeDate(experience.endDate) || null,
      currentPosition,
      imageUrl: experience.imageUrl ?? "",
      websiteUrl: experience.websiteUrl ?? "",
      skills: toArray(experience.skills),
      displayOrder: Number(experience.displayOrder ?? index + 1),
    };
  }

  function normalizeCaseStudyForJson(caseStudy) {
    const payload = buildProjectCaseStudyPayload(caseStudy);
    return payload ? {
      problem: payload.problem ?? "",
      context: payload.context ?? "",
      role: payload.role ?? "",
      architecture: payload.architecture ?? "",
      technicalChoices: payload.technicalChoices ?? [],
      challenges: payload.challenges ?? [],
      solutions: payload.solutions ?? [],
      outcomes: payload.outcomes ?? [],
      results: payload.results ?? [],
      limits: payload.limits ?? [],
      nextSteps: payload.nextSteps ?? "",
    } : null;
  }

  function normalizeCurrentProjectForExport(project, index) {
    const githubUrl = project.githubUrl ?? "";
    const architectureUrl = getProjectArchitectureUrl(project);
    const documentationUrl = project.documentationUrl ?? "";

    return {
      title: project.title ?? "",
      subtitle: project.subtitle ?? "",
      shortDescription: project.shortDescription ?? "",
      description: project.description ?? "",
      status: project.status ?? "IN_PROGRESS",
      startDate: normalizeDate(project.startDate),
      endDate: normalizeDate(project.endDate) || null,
      imageUrl: project.imageUrl ?? "",
      demoUrl: project.demoUrl ?? "",
      githubUrl,
      architectureUrl,
      documentationUrl,
      slug: nullIfBlank(project.slug),
      stacks: toArray(project.stacks),
      features: toArray(project.features),
      proofTags: toArray(project.proofTags),
      caseStudy: normalizeCaseStudyForJson(project.caseStudy),
      links: [
        { type: "GITHUB", label: "GitHub", url: githubUrl },
        { type: "ARCHITECTURE", label: "Architecture", url: architectureUrl },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => nullIfBlank(link.url)),
      featured: Boolean(project.featured),
      published: project.published !== false,
      displayOrder: Number(project.displayOrder ?? index + 1),
      websiteVersionId: null,
    };
  }

  function buildCurrentVersionJsonPayload() {
    return {
      name: ownerForm.name,
      firstName: ownerForm.firstName,
      age: Number(ownerForm.age),
      active: ownerForm.active,
      address: ownerForm.address,
      contacts: sanitizeContactRows(ownerForm.contacts),
      versionTag: versionForm.versionTag,
      versionLabel: versionForm.label,
      versionDescription: versionForm.description,
      versionPublished: versionForm.published,
      versionActive: versionForm.active,
      prof: {
        ...profileForm,
        profileImageUrl: profileForm.profileImageUrl ?? "",
        logoUrl: profileForm.logoUrl ?? "",
        cvUrl: profileForm.cvUrl ?? "",
      },
      timeline: {
        ...timelineForm,
        experiences: experiences.map(normalizeCurrentExperienceForExport),
      },
      projects: projects.map(normalizeCurrentProjectForExport),
    };
  }

  function formatJsonPayload(payload) {
    return JSON.stringify(payload, null, 2);
  }

  function createJsonFilename(payload) {
    const ownerSlug = [payload.firstName, payload.name]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "portfolio";
    const versionSlug = String(payload.versionTag ?? "version")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "version";

    return `${ownerSlug}-${versionSlug}.json`;
  }

  function downloadJsonPayload(payload) {
    const blob = new Blob([`${formatJsonPayload(payload)}\n`], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = createJsonFilename(payload);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCurrentVersionJson() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    downloadJsonPayload(buildCurrentVersionJsonPayload());
    setMessage("Version courante téléchargée en JSON.");
    setError(null);
  }

  function handleJsonEditorTextChange(value) {
    setJsonEditorText(value);
    setJsonEditorError(null);
  }

  function openCurrentVersionJsonEditor() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    setJsonEditorText(formatJsonPayload(buildCurrentVersionJsonPayload()));
    setJsonEditorError(null);
    setJsonEditorOpened(true);
  }

  function formatJsonEditorText() {
    try {
      const parsedPayload = JSON.parse(jsonEditorText);
      setJsonEditorText(formatJsonPayload(parsedPayload));
      setJsonEditorError(null);
    } catch (err) {
      const location = getJsonSyntaxLocation(err, jsonEditorText);
      setJsonEditorError(
        location.line && location.column
          ? `Formatage impossible : erreur ligne ${location.line}, colonne ${location.column}.`
          : err?.message ?? "JSON invalide.",
      );
    }
  }

  function downloadJsonEditorText() {
    try {
      const parsedPayload = JSON.parse(jsonEditorText);
      downloadJsonPayload(parsedPayload);
      setJsonEditorError(null);
    } catch (err) {
      const location = getJsonSyntaxLocation(err, jsonEditorText);
      setJsonEditorError(
        location.line && location.column
          ? `Téléchargement impossible : erreur ligne ${location.line}, colonne ${location.column}.`
          : err?.message ?? "JSON invalide.",
      );
    }
  }

  function buildProjectPayloadFromJsonProject(project) {
    const architectureUrl = nullIfBlank(project.architectureUrl ?? getProjectArchitectureUrl(project));
    const documentationUrl = nullIfBlank(project.documentationUrl);
    const githubUrl = nullIfBlank(project.githubUrl);

    return {
      title: project.title,
      subtitle: project.subtitle,
      shortDescription: project.shortDescription,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate || null,
      imageUrl: nullIfBlank(project.imageUrl),
      demoUrl: nullIfBlank(project.demoUrl),
      githubUrl,
      documentationUrl,
      architectureUrl,
      slug: nullIfBlank(project.slug),
      stacks: toArray(project.stacks),
      features: toArray(project.features),
      links: [
        { type: "GITHUB", label: "GitHub", url: githubUrl },
        { type: "ARCHITECTURE", label: "Architecture", url: architectureUrl },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => link.url),
      proofTags: toArray(project.proofTags),
      caseStudy: buildProjectCaseStudyPayload(project.caseStudy),
      featured: project.featured,
      published: project.published,
      displayOrder: Number(project.displayOrder),
      websiteVersionId: selectedVersionId ? Number(selectedVersionId) : null,
    };
  }

  async function saveJsonEditorToCurrentVersion() {
    if (!selectedOwnerId || !selectedVersionId) {
      setJsonEditorError("Sélectionne d’abord un owner et une version.");
      return;
    }

    let parsedPayload;
    let normalized;

    try {
      parsedPayload = JSON.parse(jsonEditorText);
      normalized = normalizeAdminPortfolioJson(parsedPayload);
    } catch (err) {
      const location = getJsonSyntaxLocation(err, jsonEditorText);
      setJsonEditorError(
        location.line && location.column
          ? `Mise à jour impossible : erreur ligne ${location.line}, colonne ${location.column}.`
          : err?.message ?? "JSON invalide.",
      );
      return;
    }

    setJsonEditorError(null);

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}`,
        buildOwnerIdentityPayloadFromData(normalized.ownerForm),
      );

      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}`,
        normalized.versionForm,
      );

      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/profile`,
        buildProfilePayloadFromData(normalized.profileForm),
      );

      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/timeline`,
        {
          ...normalized.timelineForm,
          experiences: normalized.experiences,
        },
      );

      const projectIdsToDelete = projects
        .map(getProjectId)
        .filter((projectId) => projectId !== null && projectId !== undefined);

      for (const projectId of projectIdsToDelete) {
        await apiRequest(
          "DELETE",
          `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects/${projectId}`,
        );
      }

      for (const project of normalized.projects) {
        await apiRequest(
          "POST",
          `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects`,
          buildProjectPayloadFromJsonProject(project),
        );
      }

      applyNormalizedPortfolioData(normalized, { notify: false });
      setJsonEditorText(formatJsonPayload(parsedPayload));
      setJsonEditorOpened(false);

      const ownerList = await fetchOwners();
      const versionList = await fetchVersions(selectedOwnerId);

      setOwners(ownerList);
      setVersions(versionList);
      selectVersion(selectedVersionId, versionList);
    }, "Version mise à jour depuis l’éditeur JSON.");
  }

  const jsonEditorLineCount = Math.max(jsonEditorText.split("\n").length, 1);
  const jsonEditorSizeKb = Math.max(
    1,
    Math.ceil(new Blob([jsonEditorText]).size / 1024),
  );
  const jsonEditorDiagnosticMessage = jsonEditorError ?? jsonEditorAnalysis.message;
  const jsonEditorStatusColor = jsonEditorAnalysis.valid ? "green" : "red";
  const jsonEditorCanUpdate = jsonEditorAnalysis.valid && !loading;

  return {
    jsonEditorAnalysis,
    jsonEditorLineCount,
    jsonEditorSizeKb,
    jsonEditorDiagnosticMessage,
    jsonEditorStatusColor,
    jsonEditorCanUpdate,
    applyNormalizedPortfolioData,
    applyImportedPortfolioData,
    importJsonFromFile,
    importJsonFromText,
    buildOwnerIdentityPayloadFromData,
    buildProfilePayloadFromData,
    normalizeCurrentExperienceForExport,
    normalizeCurrentProjectForExport,
    buildCurrentVersionJsonPayload,
    formatJsonPayload,
    createJsonFilename,
    downloadJsonPayload,
    downloadCurrentVersionJson,
    handleJsonEditorTextChange,
    openCurrentVersionJsonEditor,
    formatJsonEditorText,
    downloadJsonEditorText,
    buildProjectPayloadFromJsonProject,
    saveJsonEditorToCurrentVersion
  };
}
