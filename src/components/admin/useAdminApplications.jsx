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

export default function useAdminApplications(ctx) {
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
    selectedVersion, selectedProject, resetCvEditorFromData, applyCvCommand,
    createCvVariantSnapshot, applyCvTargetPreset, previewGeneratedCv, generateCvLatexSource,
    saveGeneratedCvToVersion, buildCvGenerationPayload, runAction, fetchOwners,
    fetchVersions, fetchProjects, refreshOwners, refreshVersions,
    refreshProjects, selectVersion, selectProject, resetProjectForm,
    resetExperienceForm, selectExperience, applyNormalizedPortfolioData, buildCurrentVersionJsonPayload
  } = ctx;

  const selectedApplication = useMemo(
    () => applications.find((application) => String(application.id) === String(selectedApplicationId)),
    [applications, selectedApplicationId],
  );

  const selectedSmartCvProposal = useMemo(
    () => smartAnalysis?.cvVariants?.find((variant) => variant.id === selectedCvProposalId) ?? smartAnalysis?.cvVariants?.[0] ?? null,
    [smartAnalysis, selectedCvProposalId],
  );

  const selectedSmartCvCommands = useMemo(() => {
    if (!selectedSmartCvProposal?.commands?.length) return [];
    return selectedSmartCvProposal.commands.filter((command, index) => selectedSmartCommandKeys[getSmartCommandKey(selectedSmartCvProposal.id, index)] !== false);
  }, [selectedSmartCvProposal, selectedSmartCommandKeys]);

  function hydrateApplicationForm(application) {
    if (!application) {
      return {
        ...emptyApplicationForm,
        versionId: selectedVersionId ?? "",
        cvUrl: profileForm.cvUrl ?? "",
        cvVariantName: cvVariantName ?? "",
      };
    }

    return {
      versionId: application.versionId ? String(application.versionId) : selectedVersionId ?? "",
      companyName: application.companyName ?? "",
      roleTitle: application.roleTitle ?? "",
      location: application.location ?? "",
      offerUrl: application.offerUrl ?? "",
      offerText: application.offerText ?? "",
      status: application.status ?? "DRAFT",
      targetProfile: application.targetProfile ?? "",
      cvVariantName: application.cvVariantName ?? "",
      cvUrl: application.cvUrl ?? "",
      coverLetterUrl: application.coverLetterUrl ?? "",
      mailDraft: application.mailDraft ?? "",
      coverLetterSource: application.coverLetterSource ?? "",
      notes: application.notes ?? "",
      appliedAt: application.appliedAt ?? "",
      followUpAt: application.followUpAt ?? "",
    };
  }

  function resetApplicationForm() {
    setSelectedApplicationId(null);
    setApplicationForm(hydrateApplicationForm(null));
    setOfferAnalysis(null);
    setCoverLetterPreviewUrl("");
    setCoverLetterLogs("");
    setCoverLetterWarnings([]);
    setApplicationZipUrl("");
    setSmartAnalysis(null);
    setSelectedLetterVariantId("");
    setSelectedCvProposalId("");
    setSmartPackUrl("");
  }

  function selectApplication(application) {
    setSelectedApplicationId(application?.id ? String(application.id) : null);
    setApplicationForm(hydrateApplicationForm(application));
    setOfferAnalysis(application ? {
      score: application.relevanceScore ?? 0,
      targetProfile: application.targetProfile ?? "",
      matchedKeywords: application.matchedKeywords ?? [],
      missingKeywords: application.missingKeywords ?? [],
      recommendations: application.recommendations ?? [],
      commands: [],
      summary: `${application.companyName ?? "Entreprise"} — ${application.roleTitle ?? "Poste"}`,
    } : null);
    setCoverLetterPreviewUrl(application?.coverLetterUrl ?? "");
    setCoverLetterLogs("");
    setCoverLetterWarnings([]);
    setApplicationZipUrl(application?.applicationZipUrl ?? "");
    setSmartAnalysis(null);
    setSelectedLetterVariantId("");
    setSelectedCvProposalId("");
    setSmartPackUrl("");
  }

  function updateApplicationForm(field, value) {
    setApplicationForm((current) => ({ ...current, [field]: value }));
  }

  async function loadApplications(ownerId = selectedOwnerId) {
    if (!ownerId) return;
    const payload = await runAction(async () => {
      const [items, dashboard] = await Promise.all([
        apiRequest("GET", `/manager/${ownerId}/applications`),
        apiRequest("GET", `/manager/${ownerId}/applications/dashboard`),
      ]);
      return { items, dashboard };
    }, "Candidatures chargées.");
    if (!payload) return;
    setApplications(payload.items ?? []);
    setApplicationsDashboard(payload.dashboard ?? null);
    if (payload.items?.length && !selectedApplicationId) {
      selectApplication(payload.items[0]);
    }
  }

  function buildApplicationPayload() {
    return {
      ...applicationForm,
      versionId: applicationForm.versionId ? Number(applicationForm.versionId) : selectedVersionId ? Number(selectedVersionId) : null,
      status: applicationForm.status || "DRAFT",
      cvUrl: applicationForm.cvUrl || profileForm.cvUrl || "",
      cvVariantName: applicationForm.cvVariantName || cvVariantName || "CV courant",
      appliedAt: applicationForm.appliedAt || null,
      followUpAt: applicationForm.followUpAt || null,
    };
  }

  async function analyzeCurrentOffer() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return null;
    }
    if (!applicationForm.offerText.trim()) {
      setError("Colle une offre avant analyse.");
      return null;
    }

    const analysis = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/analyze-offer`, {
        offerText: applicationForm.offerText,
        roleTitle: applicationForm.roleTitle,
        companyName: applicationForm.companyName,
        portfolioSkills: (cvDocument.skills ?? []).map((skill) => skill.label).filter(Boolean),
        projectTitles: (cvDocument.projects ?? []).map((project) => project.title).filter(Boolean),
      }),
      "Offre analysée.",
    );
    if (analysis) {
      setOfferAnalysis(analysis);
      if (!applicationForm.targetProfile && analysis.targetProfile) {
        updateApplicationForm("targetProfile", analysis.targetProfile);
      }
    }
    return analysis;
  }

  async function saveApplication() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return;
    }
    if (!applicationForm.companyName.trim() || !applicationForm.roleTitle.trim()) {
      setError("Entreprise et poste sont obligatoires pour enregistrer la candidature.");
      return;
    }

    const saved = await runAction(async () => {
      const payload = buildApplicationPayload();
      if (selectedApplicationId) {
        return apiRequest("PUT", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}`, payload);
      }
      return apiRequest("POST", `/manager/${selectedOwnerId}/applications`, payload);
    }, selectedApplicationId ? "Candidature mise à jour." : "Candidature créée.");

    if (saved) {
      await loadApplications(selectedOwnerId);
      selectApplication(saved);
    }
  }

  async function deleteApplication() {
    if (!selectedOwnerId || !selectedApplicationId) return;
    await runAction(async () => {
      await apiRequest("DELETE", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}`);
      return null;
    }, "Candidature supprimée.");
    resetApplicationForm();
    await loadApplications(selectedOwnerId);
  }

  async function markApplicationStatus(status) {
    if (!selectedOwnerId || !selectedApplicationId) return;
    const updated = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/status/${status}`),
      "Statut candidature mis à jour.",
    );
    if (updated) {
      await loadApplications(selectedOwnerId);
      selectApplication(updated);
    }
  }

  function buildCoverLetterPayload() {
    return {
      versionId: applicationForm.versionId ? Number(applicationForm.versionId) : selectedVersionId ? Number(selectedVersionId) : null,
      latexSourceOverride: applicationForm.coverLetterSource || null,
      motivationTextOverride: "",
      templateId: "cover-letter-clean",
      assets: [],
    };
  }

  async function previewCoverLetter() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant de générer la lettre.");
      return;
    }
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/cover-letter/preview`, buildCoverLetterPayload()),
      "Lettre de motivation prévisualisée.",
    );
    if (response) {
      setCoverLetterPreviewUrl(response.pdfUrl ?? "");
      setCoverLetterLogs(response.logs ?? "");
      setCoverLetterWarnings(response.warnings ?? []);
      if (response.latexSource) updateApplicationForm("coverLetterSource", response.latexSource);
    }
  }

  async function saveCoverLetter() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant de sauvegarder la lettre.");
      return;
    }
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/cover-letter/save`, buildCoverLetterPayload()),
      "Lettre PDF sauvegardée.",
    );
    if (response) {
      setCoverLetterPreviewUrl(response.pdfUrl ?? "");
      setCoverLetterLogs(response.logs ?? "");
      setCoverLetterWarnings(response.warnings ?? []);
      await loadApplications(selectedOwnerId);
    }
  }

  async function exportApplicationPackage() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant d’exporter le ZIP.");
      return;
    }
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/export-zip`, buildCoverLetterPayload()),
      "Package candidature exporté.",
    );
    if (response) {
      setApplicationZipUrl(response.zipUrl ?? "");
      setCoverLetterPreviewUrl(response.pdfUrl ?? coverLetterPreviewUrl);
      setCoverLetterLogs(response.logs ?? "");
      setCoverLetterWarnings(response.warnings ?? []);
      await loadApplications(selectedOwnerId);
    }
  }



  function getSmartCommandKey(proposalId, index) {
    return `${proposalId || "proposal"}::${index}`;
  }

  function getCommandValue(command) {
    return command?.value ?? command?.targetValue ?? command?.payload ?? "";
  }

  function formatCvCommand(command) {
    const value = getCommandValue(command);
    const target = command?.target ? ` → ${command.target}` : "";
    const valueLabel = value === "" || value === null || value === undefined ? "" : ` : ${value}`;
    const labels = {
      SET_TITLE: "Modifier le titre CV",
      SET_HEADLINE: "Modifier l’accroche",
      LIMIT_EXPERIENCES: "Limiter les expériences",
      LIMIT_PROJECTS: "Limiter les projets",
      SET_DENSITY: "Changer la densité",
      SET_APPLICATION_MODE: "Définir le mode de candidature",
      PRIORITIZE_SKILLS: "Prioriser les compétences",
    };
    return `${labels[command?.type] ?? command?.type ?? "Commande"}${target}${valueLabel}`;
  }

  function describeCvCommandImpact(command) {
    const value = getCommandValue(command);
    if (command?.type === "SET_TITLE") return `Titre CV remplacé par « ${value} ».`;
    if (command?.type === "SET_HEADLINE") return "Phrase d’accroche remplacée par une version ciblée sur l’offre.";
    if (command?.type === "LIMIT_EXPERIENCES") return `Limite d’expériences réglée à ${Number(value) || 2}.`;
    if (command?.type === "LIMIT_PROJECTS") return `Limite de projets réglée à ${Number(value) || 4}.`;
    if (command?.type === "SET_DENSITY") return `Densité visuelle réglée sur « ${value || "compact"} ».`;
    if (command?.type === "SET_APPLICATION_MODE") return `Mode candidature mémorisé : ${value || "standard"}.`;
    if (command?.type === "PRIORITIZE_SKILLS") return "Compétences réordonnées selon les mots-clés prioritaires de l’offre.";
    return "Commande analysée et appliquée si elle est supportée par le CV Studio.";
  }

  function applySingleCvCommand(draft, command) {
    if (!command?.type) return false;
    const value = getCommandValue(command);
    if (command.type === "SET_TITLE") {
      draft.profile.title = String(value || draft.profile.title || "");
      return true;
    }
    if (command.type === "SET_HEADLINE") {
      draft.profile.headline = String(value || draft.profile.headline || "");
      return true;
    }
    if (command.type === "LIMIT_EXPERIENCES") {
      draft.settings.experienceLimit = Number(value) || 2;
      return true;
    }
    if (command.type === "LIMIT_PROJECTS") {
      draft.settings.projectLimit = Number(value) || 4;
      return true;
    }
    if (command.type === "SET_DENSITY") {
      draft.settings.density = String(value || "compact");
      return true;
    }
    if (command.type === "SET_APPLICATION_MODE") {
      draft.settings.applicationMode = String(value || "standard");
      return true;
    }
    if (command.type === "PRIORITIZE_SKILLS") {
      const priority = String(value ?? "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      if (priority.length && Array.isArray(draft.skills)) {
        draft.skills = [...draft.skills].sort((a, b) => {
          const aText = `${a.label ?? ""} ${a.stack ?? ""} ${a.description ?? ""}`.toLowerCase();
          const bText = `${b.label ?? ""} ${b.stack ?? ""} ${b.description ?? ""}`.toLowerCase();
          const ai = priority.findIndex((item) => aText.includes(item));
          const bi = priority.findIndex((item) => bText.includes(item));
          return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        });
        return true;
      }
    }
    return false;
  }

  function setProposalCommandsSelection(proposal, selected) {
    if (!proposal?.commands?.length) return;
    setSelectedSmartCommandKeys((current) => {
      const next = { ...current };
      proposal.commands.forEach((_, index) => {
        next[getSmartCommandKey(proposal.id, index)] = selected;
      });
      return next;
    });
  }

  function countSelectedProposalCommands(proposal) {
    if (!proposal?.commands?.length) return 0;
    return proposal.commands.filter((_, index) => selectedSmartCommandKeys[getSmartCommandKey(proposal.id, index)] !== false).length;
  }

  function appendCommandTrace(entry) {
    setCommandTraceEntries((current) => [
      ...current,
      {
        id: createCvId("trace"),
        timestamp: new Date().toLocaleTimeString("fr-FR"),
        ...entry,
      },
    ]);
  }

  function openCommandTrace(title) {
    setCommandTraceTitle(title || "Trace d’application CV");
    setCommandTraceStatus("running");
    setCommandTraceEntries([]);
    setCommandTraceOpened(true);
  }

  function waitCommandTrace(ms = 70) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function focusCvStudioAfterSmartApply(section = "profile") {
    setAdminActiveTab("cv");
    setCvActiveEditorTab("content");
    setCvSelectedSection(section);
    window.setTimeout(() => {
      document.querySelector(".admin-tabs-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  async function loadLetterTemplates() {
    if (!selectedOwnerId) return;
    const templates = await runAction(
      () => apiRequest("GET", `/manager/${selectedOwnerId}/applications/letter-templates`),
      "Bibliothèque de lettres chargée.",
    );
    if (templates) setLetterTemplates(templates ?? []);
  }

  async function runSmartApplicationAnalysis() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant l’analyse intelligente.");
      return;
    }
    const versionQuery = applicationForm.versionId || selectedVersionId ? `?versionId=${applicationForm.versionId || selectedVersionId}` : "";
    const analysis = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/analyze-smart${versionQuery}`),
      "Analyse intelligente terminée.",
    );
    if (analysis) {
      setSmartAnalysis(analysis);
      setSelectedLetterVariantId(analysis.letterVariants?.[0]?.id ?? "");
      setSelectedCvProposalId(analysis.cvVariants?.[0]?.id ?? "");
      const defaultCommandSelection = {};
      (analysis.cvVariants ?? []).forEach((variant) => {
        (variant.commands ?? []).forEach((_, index) => {
          defaultCommandSelection[getSmartCommandKey(variant.id, index)] = true;
        });
      });
      setSelectedSmartCommandKeys(defaultCommandSelection);
      if (analysis.offer?.roleTitle && !applicationForm.targetProfile) {
        updateApplicationForm("targetProfile", analysis.cvVariants?.[0]?.targetTitle ?? analysis.offer.roleTitle);
      }
    }
  }

  async function applySmartCvProposal(proposal = selectedSmartCvProposal, { selectedOnly = true } = {}) {
    if (!proposal?.commands?.length) {
      setError("Aucune commande CV disponible pour cette proposition.");
      return;
    }

    const commands = selectedOnly
      ? proposal.commands.filter((_, index) => selectedSmartCommandKeys[getSmartCommandKey(proposal.id, index)] !== false)
      : proposal.commands;

    if (!commands.length) {
      setError("Aucune commande sélectionnée. Coche au moins une commande avant l’application.");
      return;
    }

    setError(null);
    setMessage(null);
    setSelectedCvProposalId(proposal.id);
    setCvVariantName(proposal.name || cvVariantName);
    updateApplicationForm("cvVariantName", proposal.name || applicationForm.cvVariantName);
    updateApplicationForm("targetProfile", proposal.targetTitle || applicationForm.targetProfile);
    openCommandTrace(`Application CV Studio — ${proposal.name || "proposition intelligente"}`);
    appendCommandTrace({ status: "running", title: "Préparation", detail: `${commands.length} commande(s) sélectionnée(s) sur ${proposal.commands.length}.` });
    await waitCommandTrace();

    const workingDocument = normalizeCvDocument(cloneDeep(cvDocument));
    for (const [index, command] of commands.entries()) {
      appendCommandTrace({
        status: "running",
        title: `Commande ${index + 1}/${commands.length}`,
        detail: formatCvCommand(command),
      });
      await waitCommandTrace();
      const applied = applySingleCvCommand(workingDocument, command);
      appendCommandTrace({
        status: applied ? "done" : "warning",
        title: applied ? "Commande appliquée" : "Commande ignorée",
        detail: applied ? describeCvCommandImpact(command) : `Type non supporté côté front : ${command.type}`,
      });
      await waitCommandTrace();
    }

    if (proposal.id?.includes("one-page") || proposal.id?.includes("ats")) {
      workingDocument.settings.reduceDescriptions = true;
      appendCommandTrace({ status: "done", title: "Optimisation automatique", detail: "Réduction des descriptions activée pour sécuriser le rendu compact/ATS." });
      await waitCommandTrace();
    }

    const generatedSource = buildCvLatexFromDocument(workingDocument);
    applyCvCommand(`Smart CV — ${proposal.name || "commandes sélectionnées"}`, () => workingDocument);
    setCvLatexSource(generatedSource);
    setCvManualLatexDirty(false);
    setCvCompileSuccess(null);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvPreviewUrl("");
    focusCvStudioAfterSmartApply("profile");
    appendCommandTrace({ status: "done", title: "CV Studio chargé", detail: "Les données pertinentes sont maintenant visibles dans le formulaire du CV Builder. Tu peux personnaliser, compiler, sauvegarder comme CV ou créer une variante." });
    setCommandTraceStatus("done");
    setMessage("Commandes sélectionnées appliquées au CV Studio. Vérifie le formulaire puis compile le CV.");
  }

  function useSmartLetterVariant(variant) {
    if (!variant) return;
    setSelectedLetterVariantId(variant.id);
    updateApplicationForm("coverLetterSource", variant.latexSource ?? "");
    if (variant.plainText && !applicationForm.mailDraft) {
      updateApplicationForm("mailDraft", smartAnalysis?.mail?.body ?? applicationForm.mailDraft);
    }
  }

  async function exportSmartApplicationPack() {
    if (!selectedOwnerId || !selectedApplicationId) {
      setError("Enregistre d’abord la candidature avant l’export intelligent.");
      return;
    }
    const versionQuery = applicationForm.versionId || selectedVersionId ? `?versionId=${applicationForm.versionId || selectedVersionId}` : "";
    const response = await runAction(
      () => apiRequest("POST", `/manager/${selectedOwnerId}/applications/${selectedApplicationId}/smart-pack${versionQuery}`),
      "Package candidature intelligent exporté.",
    );
    if (response) {
      setSmartPackUrl(response.zipUrl ?? "");
    }
  }

  async function applyOfferCommandsToCv() {
    if (!offerAnalysis?.commands?.length) {
      setError("Aucune commande issue de l’analyse d’offre classique.");
      return;
    }
    openCommandTrace("Application CV Studio — analyse d’offre classique");
    appendCommandTrace({ status: "running", title: "Préparation", detail: `${offerAnalysis.commands.length} commande(s) à appliquer.` });
    await waitCommandTrace();
    const workingDocument = normalizeCvDocument(cloneDeep(cvDocument));
    for (const [index, command] of offerAnalysis.commands.entries()) {
      appendCommandTrace({ status: "running", title: `Commande ${index + 1}/${offerAnalysis.commands.length}`, detail: formatCvCommand(command) });
      await waitCommandTrace();
      const applied = applySingleCvCommand(workingDocument, command);
      appendCommandTrace({ status: applied ? "done" : "warning", title: applied ? "Commande appliquée" : "Commande ignorée", detail: applied ? describeCvCommandImpact(command) : `Type non supporté côté front : ${command.type}` });
      await waitCommandTrace();
    }
    applyCvCommand("Adapter le CV à l’offre analysée", () => workingDocument);
    setCvLatexSource(buildCvLatexFromDocument(workingDocument));
    setCvManualLatexDirty(false);
    focusCvStudioAfterSmartApply("profile");
    setCommandTraceStatus("done");
    appendCommandTrace({ status: "done", title: "Terminé", detail: "Les commandes classiques sont appliquées et le CV Builder est ouvert." });
    setMessage("Commandes d’offre appliquées au CV Studio.");
  }

  useEffect(() => {
    if (!selectedOwnerId || authStatus !== "authenticated") {
      setApplications([]);
      setApplicationsDashboard(null);
      resetApplicationForm();
      return;
    }
    loadApplications(selectedOwnerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerId, authStatus]);

  return {
    selectedApplication,
    selectedSmartCvProposal,
    selectedSmartCvCommands,
    hydrateApplicationForm,
    resetApplicationForm,
    selectApplication,
    updateApplicationForm,
    loadApplications,
    buildApplicationPayload,
    analyzeCurrentOffer,
    saveApplication,
    deleteApplication,
    markApplicationStatus,
    buildCoverLetterPayload,
    previewCoverLetter,
    saveCoverLetter,
    exportApplicationPackage,
    getSmartCommandKey,
    getCommandValue,
    formatCvCommand,
    describeCvCommandImpact,
    applySingleCvCommand,
    setProposalCommandsSelection,
    countSelectedProposalCommands,
    appendCommandTrace,
    openCommandTrace,
    waitCommandTrace,
    focusCvStudioAfterSmartApply,
    loadLetterTemplates,
    runSmartApplicationAnalysis,
    applySmartCvProposal,
    useSmartLetterVariant,
    exportSmartApplicationPack,
    applyOfferCommandsToCv
  };
}
