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

export default function useAdminSafetyActions(ctx) {
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
    generateCvLatexSource, saveGeneratedCvToVersion, buildCvGenerationPayload, runAction,
    fetchOwners, fetchVersions, fetchProjects, refreshOwners,
    refreshVersions, refreshProjects, selectVersion, selectProject,
    resetProjectForm, resetExperienceForm, selectExperience, applyNormalizedPortfolioData,
    buildCurrentVersionJsonPayload
  } = ctx;

  async function runPortfolioHealthCheck() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    const report = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/health`),
      "Contrôle santé exécuté.",
    );
    if (report) setPortfolioHealthReport(report);
  }

  async function validatePortfolioBeforePublish() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return null;
    }

    const report = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/publish-validation`),
      "Validation avant publication exécutée.",
    );
    if (report) setPublishValidationReport(report);
    return report;
  }

  async function activateVersionWithValidation(versionId = selectedVersionId) {
    if (!selectedOwnerId || !versionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    const report = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/versions/${versionId}/publish-validation`),
    );
    if (!report) return;

    setPublishValidationReport(report);
    if (!report.publishable) {
      setError("Publication bloquée : corrige les erreurs critiques avant activation.");
      return;
    }

    await runAction(async () => {
      await apiRequest("PUT", `/manager/${selectedOwnerId}/versions/${versionId}/activate-validated`);
      await refreshVersions(selectedOwnerId, versionId);
    }, "Version validée puis activée.");
  }

  async function exportPortfolioBackupZip() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    const backup = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/backup/export`),
      "Backup portfolio généré.",
    );
    if (!backup) return;

    setPortfolioBackupUrl(backup.url ?? "");
    setPortfolioBackupJson(backup.json ?? "");
    if (backup.json) {
      downloadTextFile("portfolio-backup.json", `${backup.json}\n`, "application/json;charset=utf-8");
    }
  }

  async function restorePortfolioBackup() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return;
    }
    if (!portfolioRestoreText.trim()) {
      setError("Colle le contenu portfolio.json du backup avant restauration.");
      return;
    }

    const restored = await runAction(async () => {
      const response = await apiRequest("POST", `/manager/${selectedOwnerId}/versions/backup/restore`, {
        backupJson: portfolioRestoreText,
        restoreLabel: portfolioRestoreLabel,
        active: false,
      });
      await refreshVersions(selectedOwnerId, String(getEntityId(response)));
      return response;
    }, "Backup restauré dans une nouvelle version inactive.");

    if (restored) {
      setPortfolioRestoreText("");
    }
  }

  return {
    runPortfolioHealthCheck,
    validatePortfolioBeforePublish,
    activateVersionWithValidation,
    exportPortfolioBackupZip,
    restorePortfolioBackup
  };
}
