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

export default function useAdminCvStudio(ctx) {
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
    selectedVersion, selectedProject, selectedApplication, runAction,
    fetchOwners, fetchVersions, fetchProjects, refreshOwners,
    refreshVersions, refreshProjects, selectVersion, selectProject,
    resetProjectForm, resetExperienceForm, selectExperience, applyNormalizedPortfolioData,
    buildCurrentVersionJsonPayload
  } = ctx;

  useEffect(() => {
    const variants = readCvLocalList("variants");
    const presets = readCvLocalList("presets");
    setCvVariants(variants);
    setCvCommandPresets(presets);
    setSelectedCvVariantId(variants[0]?.id ?? null);
    setCvDiffReport(null);
    setCvQualityReport(null);
    setCvExportZipUrl("");
    setCvAsyncJob(null);
    setPortfolioHealthReport(null);
    setPublishValidationReport(null);
    setPortfolioBackupUrl("");
    setPortfolioBackupJson("");
  }, [selectedOwnerId, selectedVersionId]);

  function cvLocalStorageKey(kind) {
    return `portfolio-cv-${kind}-${selectedOwnerId ?? "owner"}-${selectedVersionId ?? "version"}`;
  }

  function readCvLocalList(kind) {
    try {
      const raw = localStorage.getItem(cvLocalStorageKey(kind));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCvLocalList(kind, list) {
    localStorage.setItem(cvLocalStorageKey(kind), JSON.stringify(list));
  }

  function resetCvEditorFromData({ owner = ownerForm, profile = profileForm, experiences: sourceExperiences = experiences, projects: sourceProjects = projects, label = "CV réinitialisé depuis le portfolio" } = {}) {
    const nextDocument = normalizeCvDocument(createCvDocumentFromVersionData({
      ownerForm: owner,
      profileForm: profile,
      experiences: sourceExperiences,
      projects: sourceProjects,
    }));

    setCvEditorState({
      past: [],
      present: nextDocument,
      future: [],
      commandLog: [{ id: createCvId("cmd"), label, timestamp: new Date().toLocaleTimeString("fr-FR") }],
    });
    setCvSelectedSection("profile");
    setCvLatexSource(buildCvLatexFromDocument(nextDocument));
    setCvManualLatexDirty(false);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvCompileSuccess(null);
    setCvPreviewUrl("");
  }

  function applyCvCommand(label, updater) {
    setCvEditorState((current) => {
      const previousDocument = normalizeCvDocument(current.present);
      const draft = cloneDeep(previousDocument);
      const nextDocument = normalizeCvDocument(updater(draft) ?? draft);

      if (JSON.stringify(previousDocument) === JSON.stringify(nextDocument)) {
        return current;
      }

      setCvLatexSource(buildCvLatexFromDocument(nextDocument));
      setCvManualLatexDirty(false);
      setCvCompileSuccess(null);

      return {
        past: [...current.past.slice(-39), previousDocument],
        present: nextDocument,
        future: [],
        commandLog: [
          { id: createCvId("cmd"), label, timestamp: new Date().toLocaleTimeString("fr-FR") },
          ...current.commandLog,
        ].slice(0, 24),
      };
    });
  }

  function undoCvCommand() {
    setCvEditorState((current) => {
      const previousDocument = current.past.at(-1);
      if (!previousDocument) return current;

      setCvLatexSource(buildCvLatexFromDocument(previousDocument));
      setCvManualLatexDirty(false);
      setCvCompileSuccess(null);

      return {
        past: current.past.slice(0, -1),
        present: previousDocument,
        future: [current.present, ...current.future].slice(0, 40),
        commandLog: [
          { id: createCvId("cmd"), label: "Annuler la dernière commande", timestamp: new Date().toLocaleTimeString("fr-FR") },
          ...current.commandLog,
        ].slice(0, 24),
      };
    });
  }

  function redoCvCommand() {
    setCvEditorState((current) => {
      const nextDocument = current.future[0];
      if (!nextDocument) return current;

      setCvLatexSource(buildCvLatexFromDocument(nextDocument));
      setCvManualLatexDirty(false);
      setCvCompileSuccess(null);

      return {
        past: [...current.past, current.present].slice(-40),
        present: nextDocument,
        future: current.future.slice(1),
        commandLog: [
          { id: createCvId("cmd"), label: "Rétablir la commande", timestamp: new Date().toLocaleTimeString("fr-FR") },
          ...current.commandLog,
        ].slice(0, 24),
      };
    });
  }

  function updateCvProfileField(field, value) {
    applyCvCommand(`Modifier le profil : ${field}`, (draft) => ({
      ...draft,
      profile: { ...draft.profile, [field]: value },
    }));
  }

  function updateCvProfileFields(fields, label = "Modifier les assets du profil") {
    applyCvCommand(label, (draft) => ({
      ...draft,
      profile: { ...draft.profile, ...fields },
    }));
  }

  function updateCvItemFields(sectionKey, itemId, fields, label = `Modifier ${sectionKey}`) {
    applyCvCommand(label, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).map((item) =>
        item.id === itemId ? { ...item, ...fields } : item,
      ),
    }));
  }

  async function importCvProfilePhoto(file) {
    if (!file) return;

    try {
      const dataUrl = await readCvAssetFile(file);
      const extension = cvFileExtension(file, "jpg");
      updateCvProfileFields({
        photoFilename: safeCvAssetFilename(`idris.${extension}`, "idris.jpg"),
        photoDataUrl: dataUrl,
        photoMimeType: file.type || cvAssetMimeFromDataUrl(dataUrl),
      }, "Importer la photo du CV");
    } catch (err) {
      setError(err?.message ?? "Import de la photo du CV impossible.");
    }
  }

  async function importCvEducationLogo(item, file) {
    if (!file || !item?.id) return;

    try {
      const dataUrl = await readCvAssetFile(file);
      const defaults = inferSchoolDefaults(item, 0);
      const extension = cvFileExtension(file, defaults.logoFilename.endsWith(".png") ? "png" : "jpg");
      const basename = safeCvAssetFilename(defaults.logoFilename, `school.${extension}`).replace(/\.(png|jpe?g)$/i, "");
      const filename = safeCvAssetFilename(`${basename}.${extension}`, defaults.logoFilename);

      updateCvItemFields("education", item.id, {
        logoFilename: filename,
        logoDataUrl: dataUrl,
        logoMimeType: file.type || cvAssetMimeFromDataUrl(dataUrl, extension === "png" ? "image/png" : "image/jpeg"),
      }, "Importer un logo de formation");
    } catch (err) {
      setError(err?.message ?? "Import du logo de formation impossible.");
    }
  }

  function updateCvSettingsField(field, value) {
    applyCvCommand(`Modifier le style : ${field}`, (draft) => ({
      ...draft,
      settings: { ...draft.settings, [field]: value },
    }));
  }

  function toggleCvSection(sectionKey, checked) {
    applyCvCommand(`${checked ? "Afficher" : "Masquer"} la section ${sectionKey}`, (draft) => ({
      ...draft,
      sections: { ...draft.sections, [sectionKey]: checked },
    }));
  }

  function updateCvItem(sectionKey, itemId, field, value) {
    applyCvCommand(`Modifier ${sectionKey} : ${field}`, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updateCvItemCsv(sectionKey, itemId, field, value) {
    updateCvItem(sectionKey, itemId, field, toArray(value));
  }

  function toggleCvItem(sectionKey, itemId, checked) {
    applyCvCommand(`${checked ? "Afficher" : "Masquer"} un élément ${sectionKey}`, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).map((item) =>
        item.id === itemId ? { ...item, enabled: checked } : item,
      ),
    }));
  }

  function moveCvEditorItem(sectionKey, itemId, direction) {
    applyCvCommand(direction < 0 ? "Monter un bloc" : "Descendre un bloc", (draft) => ({
      ...draft,
      [sectionKey]: moveCvItem(draft[sectionKey] ?? [], itemId, direction),
    }));
  }


  function moveCvEditorItemTo(sectionKey, itemId, position) {
    applyCvCommand(position === "first" ? "Mettre un bloc en premier" : "Mettre un bloc en dernier", (draft) => {
      const list = [...(draft[sectionKey] ?? [])];
      const index = list.findIndex((item) => item.id === itemId);
      if (index < 0) return draft;
      const [item] = list.splice(index, 1);
      if (position === "first") {
        list.unshift(item);
      } else {
        list.push(item);
      }
      return { ...draft, [sectionKey]: list.map((entry, order) => ({ ...entry, displayOrder: order + 1 })) };
    });
  }

  function sortCvItems(sectionKey, mode) {
    applyCvCommand(mode === "date" ? `Réordonner ${sectionKey} par date` : `Réordonner ${sectionKey} par pertinence`, (draft) => {
      const priorityKeywords = ["portfolio", "spring", "java", "ais", "postgres", "docker", "react", "architecture", "test"];
      const scoreItem = (item) => {
        const signature = [item.title, item.subtitle, item.organization, item.summary, item.description, toCsv(item.skills), toCsv(item.stacks)].join(" ").toLowerCase();
        const keywordScore = priorityKeywords.reduce((score, keyword, index) => score + (signature.includes(keyword) ? 30 - index : 0), 0);
        return keywordScore + (item.featured ? 40 : 0) + (item.enabled === false ? -200 : 0);
      };
      const sorted = [...(draft[sectionKey] ?? [])].sort((left, right) => {
        if (mode === "date") {
          const leftDate = left.startDate || left.endDate || "";
          const rightDate = right.startDate || right.endDate || "";
          return String(rightDate).localeCompare(String(leftDate));
        }
        return scoreItem(right) - scoreItem(left);
      });
      return { ...draft, [sectionKey]: sorted.map((entry, order) => ({ ...entry, displayOrder: order + 1 })) };
    });
  }

  function dropCvItem(sectionKey, draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    applyCvCommand("Réordonner manuellement par glisser-déposer", (draft) => {
      const list = [...(draft[sectionKey] ?? [])];
      const draggedIndex = list.findIndex((item) => item.id === draggedId);
      const targetIndex = list.findIndex((item) => item.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return draft;
      const [draggedItem] = list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, draggedItem);
      return { ...draft, [sectionKey]: list.map((entry, order) => ({ ...entry, displayOrder: order + 1 })) };
    });
  }

  function getCvDragProps(sectionKey, itemId) {
    return {
      draggable: true,
      onDragStart: () => setCvDraggingItem({ sectionKey, itemId }),
      onDragEnd: () => setCvDraggingItem(null),
      onDragOver: (event) => event.preventDefault(),
      onDrop: (event) => {
        event.preventDefault();
        if (cvDraggingItem?.sectionKey === sectionKey) {
          dropCvItem(sectionKey, cvDraggingItem.itemId, itemId);
        }
        setCvDraggingItem(null);
      },
    };
  }

  function updateCvSectionColumn(sectionKey, column) {
    applyCvCommand(`Basculer ${sectionKey} en colonne ${column}`, (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        sectionColumns: {
          ...(draft.settings?.sectionColumns ?? {}),
          [sectionKey]: column,
        },
      },
    }));
  }

  function adjustCvSpacing(delta) {
    applyCvCommand(delta > 0 ? "Augmenter l’espacement" : "Réduire l’espacement", (draft) => {
      const scale = clampNumber((draft.settings?.spacingScale ?? 1) + delta, 0.65, 1.5, 1);
      return {
        ...draft,
        settings: {
          ...draft.settings,
          spacingScale: scale,
          sectionSpacing: clampNumber((draft.settings?.sectionSpacing ?? 0.3) + delta * 0.25, 0.05, 0.8, 0.3),
          blockSpacing: clampNumber((draft.settings?.blockSpacing ?? 0.06) + delta * 0.08, 0, 0.35, 0.06),
        },
      };
    });
  }

  function toggleReduceCvDescriptions() {
    applyCvCommand("Réduire les descriptions longues", (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        reduceDescriptions: !draft.settings?.reduceDescriptions,
      },
    }));
  }

  function duplicateCvItem(sectionKey, itemId) {
    applyCvCommand(`Dupliquer un élément ${sectionKey}`, (draft) => {
      const list = draft[sectionKey] ?? [];
      const index = list.findIndex((item) => item.id === itemId);
      if (index < 0) return draft;
      const duplicated = {
        ...cloneDeep(list[index]),
        id: createCvId(sectionKey),
        title: list[index].title ? `${list[index].title} — copie` : list[index].title,
        label: list[index].label ? `${list[index].label} — copie` : list[index].label,
      };
      const nextList = [...list];
      nextList.splice(index + 1, 0, duplicated);
      return { ...draft, [sectionKey]: nextList.map((item, order) => ({ ...item, displayOrder: order + 1 })) };
    });
  }

  function removeCvItem(sectionKey, itemId) {
    applyCvCommand(`Supprimer un élément ${sectionKey}`, (draft) => ({
      ...draft,
      [sectionKey]: (draft[sectionKey] ?? []).filter((item) => item.id !== itemId),
    }));
  }

  function addCvItem(sectionKey) {
    const factories = {
      experiences: () => ({ id: createCvId("experience"), enabled: true, title: "Nouvelle expérience", organization: "Organisation", location: "", summary: "Résumé court", description: "Description détaillée", startDate: "", endDate: "", currentPosition: false, skills: [], displayOrder: (cvDocument.experiences ?? []).length + 1 }),
      education: () => ({ id: createCvId("education"), enabled: true, title: "Nouvelle formation", organization: "Établissement", location: "", summary: "Résumé court", description: "Description détaillée", startDate: "", endDate: "", currentPosition: false, skills: [], schoolCode: "ECOLE", logoFilename: "school.png", logoDataUrl: "", logoMimeType: "image/png", logoSize: "1.15cm", officialUrl: "", officialLabel: "parcours officiel", programUrl: "", programLabel: "programme", displayOrder: (cvDocument.education ?? []).length + 1 }),
      projects: () => ({ id: createCvId("project"), enabled: true, title: "Nouveau projet", subtitle: "Stack / contexte", shortDescription: "Résumé court", description: "Description détaillée", stacks: [], features: [], githubUrl: "", documentationUrl: "", architectureUrl: "", displayOrder: (cvDocument.projects ?? []).length + 1 }),
      skills: () => ({ id: createCvId("skill"), enabled: true, label: "Nouvelle compétence" }),
      languages: () => ({ id: createCvId("language"), enabled: true, label: "Langue", level: "Niveau" }),
      qualities: () => ({ id: createCvId("quality"), enabled: true, label: "Qualité" }),
      contacts: () => ({ id: createCvId("contact"), enabled: true, type: "WEBSITE", label: "WEBSITE", value: "https://example.com" }),
    };

    const factory = factories[sectionKey];
    if (!factory) return;

    applyCvCommand(`Ajouter un élément ${sectionKey}`, (draft) => ({
      ...draft,
      [sectionKey]: [...(draft[sectionKey] ?? []), factory()],
    }));
  }

  function applyCvTargetPreset(preset) {
    applyCvCommand(`Adapter le CV : ${preset.label}`, (draft) => {
      const priority = new Set(preset.prioritySkills.map((skill) => skill.toLowerCase()));
      const orderedSkills = [...(draft.skills ?? [])].sort((left, right) => {
        const leftPriority = priority.has(String(left.label ?? "").toLowerCase()) ? 0 : 1;
        const rightPriority = priority.has(String(right.label ?? "").toLowerCase()) ? 0 : 1;
        return leftPriority - rightPriority;
      });

      return {
        ...draft,
        profile: {
          ...draft.profile,
          title: preset.title,
          headline: preset.headline,
        },
        settings: {
          ...draft.settings,
          density: "compact",
          projectLimit: 4,
          experienceLimit: 2,
          skillsLimit: 14,
          featuresLimit: 3,
        },
        skills: orderedSkills,
      };
    });
  }

  function compactCvOnOnePage() {
    applyCvCommand("Compacter le CV sur une page", (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        density: "compact",
        fontScale: 0.94,
        contentScale: 0.72,
        spacingScale: 0.78,
        itemSpacing: 1.15,
        sectionSpacing: 0.18,
        blockSpacing: 0.02,
        reduceDescriptions: true,
        projectLimit: 4,
        experienceLimit: 2,
        skillsLimit: 12,
        featuresLimit: 3,
        leftColumnWidth: 32,
      },
    }));
  }

  function generateLatexFromCvDocument() {
    const source = buildCvLatexFromDocument(cvDocument);
    setCvLatexSource(source);
    setCvManualLatexDirty(false);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvCompileSuccess(null);
    setCvPreviewUrl("");
    setMessage("Source LaTeX générée depuis l’éditeur visuel.");
    setError(null);
  }

  function createCvVariantSnapshot(name = cvVariantName) {
    const source = cvLatexSource || buildCvLatexFromDocument(cvDocument);
    const variant = {
      id: createCvId("variant"),
      name: normalizeCvString(name) || `Variante ${cvVariants.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      document: cloneDeep(cvDocument),
      latexSource: source,
      pdfUrl: cvPreviewUrl,
      qualityScore: buildLocalCvQualityReport(cvDocument, source).score,
    };
    const next = [variant, ...cvVariants].slice(0, 25);
    setCvVariants(next);
    setSelectedCvVariantId(variant.id);
    writeCvLocalList("variants", next);
    setMessage("Variante CV sauvegardée localement.");
  }

  function saveCurrentCvVariant() {
    if (!selectedCvVariantId) {
      createCvVariantSnapshot(cvVariantName);
      return;
    }
    const source = cvLatexSource || buildCvLatexFromDocument(cvDocument);
    const next = cvVariants.map((variant) => variant.id === selectedCvVariantId
      ? { ...variant, name: normalizeCvString(cvVariantName) || variant.name, updatedAt: new Date().toISOString(), document: cloneDeep(cvDocument), latexSource: source, pdfUrl: cvPreviewUrl, qualityScore: buildLocalCvQualityReport(cvDocument, source).score }
      : variant);
    setCvVariants(next);
    writeCvLocalList("variants", next);
    setMessage("Variante CV mise à jour.");
  }

  function loadCvVariant(variantId = selectedCvVariantId) {
    const variant = cvVariants.find((item) => item.id === variantId);
    if (!variant) return;
    const nextDocument = normalizeCvDocument(variant.document);
    setCvEditorState((current) => ({
      past: [...current.past.slice(-39), current.present],
      present: nextDocument,
      future: [],
      commandLog: [{ id: createCvId("cmd"), label: `Charger variante : ${variant.name}`, timestamp: new Date().toLocaleTimeString("fr-FR") }, ...current.commandLog].slice(0, 24),
    }));
    setCvVariantName(variant.name);
    setCvLatexSource(variant.latexSource || buildCvLatexFromDocument(nextDocument));
    setCvPreviewUrl(variant.pdfUrl || "");
    setCvManualLatexDirty(Boolean(variant.latexSource));
    setCvCompileSuccess(null);
    setMessage(`Variante chargée : ${variant.name}.`);
  }

  function deleteCvVariant(variantId = selectedCvVariantId) {
    const next = cvVariants.filter((variant) => variant.id !== variantId);
    setCvVariants(next);
    setSelectedCvVariantId(next[0]?.id ?? null);
    writeCvLocalList("variants", next);
    setMessage("Variante supprimée.");
  }

  function compareCvVariant(variantId = selectedCvVariantId) {
    const variant = cvVariants.find((item) => item.id === variantId);
    if (!variant) return;
    setCvDiffReport({ name: variant.name, changes: diffCvDocuments(variant.document, cvDocument) });
  }

  function saveCvCommandPreset() {
    const preset = {
      id: createCvId("preset"),
      name: normalizeCvString(cvPresetName) || `Preset ${cvCommandPresets.length + 1}`,
      createdAt: new Date().toISOString(),
      settings: cloneDeep(cvDocument.settings),
      sections: cloneDeep(cvDocument.sections),
    };
    const next = [preset, ...cvCommandPresets].slice(0, 20);
    setCvCommandPresets(next);
    writeCvLocalList("presets", next);
    setMessage("Preset de commandes sauvegardé.");
  }

  function applyCvCommandPreset(preset) {
    if (!preset) return;
    applyCvCommand(`Appliquer preset : ${preset.name}`, (draft) => ({
      ...draft,
      settings: { ...draft.settings, ...(preset.settings ?? {}) },
      sections: { ...draft.sections, ...(preset.sections ?? {}) },
    }));
  }

  function runCvQualityCheck() {
    const localReport = buildLocalCvQualityReport(cvDocument, cvLatexSource || buildCvLatexFromDocument(cvDocument));
    setCvQualityReport(localReport);
    setMessage(`Contrôle qualité terminé : score ${localReport.score}/100.`);
  }

  async function runBackendCvQualityCheck() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }
    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/quality`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );
      setCvQualityReport(data);
    }, "Contrôle qualité backend terminé.");
  }

  function analyzeCvOffer() {
    const analysis = buildOfferAnalysis(cvDocument, cvOfferText);
    setCvOfferAnalysis(analysis);
    setMessage(`Analyse d’offre terminée : pertinence ${analysis.score}%.`);
  }

  function applyOfferRecommendations() {
    const analysis = cvOfferAnalysis ?? buildOfferAnalysis(cvDocument, cvOfferText);
    const keywords = analysis.keywords ?? [];
    applyCvCommand("Adapter automatiquement à l’offre", (draft) => {
      const title = keywords.includes("spring boot") || keywords.includes("java")
        ? "Alternance Développeur Java Spring Boot"
        : keywords.includes("devops") || keywords.includes("docker")
          ? "Alternance Développeur Java / DevOps"
          : draft.profile.title;
      const orderedProjects = [...(draft.projects ?? [])].sort((left, right) => scoreCvItemForKeywords(right, keywords) - scoreCvItemForKeywords(left, keywords));
      const orderedExperiences = [...(draft.experiences ?? [])].sort((left, right) => scoreCvItemForKeywords(right, keywords) - scoreCvItemForKeywords(left, keywords));
      const orderedSkills = [...(draft.skills ?? [])].sort((left, right) => scoreCvItemForKeywords(right, keywords) - scoreCvItemForKeywords(left, keywords));
      return {
        ...draft,
        profile: {
          ...draft.profile,
          title,
          headline: keywords.length > 0
            ? `Recherche une alternance ciblée ${keywords.slice(0, 5).join(" · ")}, avec une approche orientée qualité, architecture et impact utilisateur.`
            : draft.profile.headline,
        },
        settings: { ...draft.settings, projectLimit: 4, experienceLimit: 2, featuresLimit: 3, reduceDescriptions: true },
        projects: orderedProjects.map((item, index) => ({ ...item, displayOrder: index + 1 })),
        experiences: orderedExperiences.map((item, index) => ({ ...item, displayOrder: index + 1 })),
        skills: orderedSkills,
      };
    });
  }

  async function exportCvReproducibleZip() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }
    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/export-zip`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );
      setCvExportZipUrl(normalizeGeneratedFileUrl(data?.zipUrl));
      setCvPreviewUrl(normalizeGeneratedFileUrl(data?.pdfUrl) || cvPreviewUrl);
      setCvCompileLogs(data?.logs ?? "");
      setCvCompileWarnings(data?.warnings ?? []);
      setCvCompileSuccess(Boolean(data?.success));
      if (!data?.zipUrl) throw new Error("Export ZIP non généré.");
    }, "Export ZIP reproductible généré.");
  }

  async function startAsyncCvPreview() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }
    await runAction(async () => {
      const job = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/compile-jobs`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );
      setCvAsyncJob(job);
      setCvCompileLogs(`${job?.status ?? "QUEUED"} — ${job?.message ?? "Compilation asynchrone lancée."}`);
      pollAsyncCvJob(job?.jobId);
    }, "Compilation asynchrone lancée.");
  }

  function pollAsyncCvJob(jobId) {
    if (!jobId || !selectedOwnerId || !selectedVersionId) return;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const status = await apiRequest("GET", `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/compile-jobs/${jobId}`);
        setCvAsyncJob(status);
        setCvCompileLogs([status?.step, status?.logs].filter(Boolean).join("\n\n"));
        setCvCompileWarnings(status?.warnings ?? []);
        if (status?.latexSource) setCvLatexSource(status.latexSource);
        if (status?.pdfUrl) setCvPreviewUrl(normalizeGeneratedFileUrl(status.pdfUrl));
        if (["SUCCESS", "FAILED", "NOT_FOUND"].includes(status?.status) || attempts > 60) {
          setCvCompileSuccess(status?.status === "SUCCESS");
          window.clearInterval(timer);
        }
      } catch (err) {
        window.clearInterval(timer);
        setError(err?.message ?? "Suivi du job de compilation impossible.");
      }
    }, 1200);
  }

  async function smartCompactAndPreview() {
    applyCvCommand("Auto-compaction intelligente", (draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        density: "compact",
        fontScale: Math.min(Number(draft.settings?.fontScale ?? 1), 0.94),
        contentScale: Math.min(Number(draft.settings?.contentScale ?? 0.74), 0.72),
        spacingScale: 0.7,
        sectionSpacing: 0.12,
        blockSpacing: 0,
        itemSpacing: 1,
        reduceDescriptions: true,
        projectLimit: 4,
        experienceLimit: 2,
        skillsLimit: 12,
        featuresLimit: 2,
      },
    }));
    setCvRegressionReport({ status: "READY", message: "Compaction appliquée. Lance une preview asynchrone pour vérifier le rendu PDF final." });
  }

  function updateTemplateLock(checked) {
    setCvTemplateLocked(checked);
    if (checked) {
      setCvLatexSource(buildCvLatexFromDocument(cvDocument));
      setCvManualLatexDirty(false);
    }
  }

  function buildCvGenerationPayload({ includeLatexOverride = true } = {}) {
    const settings = cvDocument.settings ?? createEmptyCvDocument().settings;

    return {
      templateId: settings.templateId,
      language: settings.language,
      theme: {
        primaryColor: settings.primaryColor,
        density: settings.density,
        showPhoto: settings.showPhoto,
        headline: nullIfBlank(cvDocument.profile?.headline),
      },
      sections: {
        profile: Boolean(cvDocument.sections?.profile),
        skills: Boolean(cvDocument.sections?.skills),
        experiences: Boolean(cvDocument.sections?.experiences),
        education: Boolean(cvDocument.sections?.education),
        projects: Boolean(cvDocument.sections?.projects),
        qualities: Boolean(cvDocument.sections?.qualities),
        languages: Boolean(cvDocument.sections?.languages),
      },
      projectLimit: Number(settings.projectLimit || 4),
      experienceLimit: Number(settings.experienceLimit || 2),
      latexSourceOverride: includeLatexOverride ? nullIfBlank(cvLatexSource || buildCvLatexFromDocument(cvDocument)) : null,
      assets: buildCvAssetsPayload(cvDocument),
    };
  }

  async function generateCvLatexSource() {
    const source = buildCvLatexFromDocument(cvDocument);
    setCvLatexSource(source);
    setCvManualLatexDirty(false);
    setCvCompileLogs("");
    setCvCompileWarnings([]);
    setCvCompileSuccess(null);
    setCvPreviewUrl("");
    setMessage("Source LaTeX recalculée depuis le modèle CV fait à la main.");
    setError(null);
  }

  async function previewGeneratedCv() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/preview`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );

      setCvLatexSource(data?.latexSource ?? cvLatexSource);
      setCvPreviewUrl(normalizeGeneratedFileUrl(data?.pdfUrl));
      setCvCompileLogs(data?.logs ?? "");
      setCvCompileWarnings(data?.warnings ?? []);
      setCvCompileSuccess(Boolean(data?.success));

      if (!data?.success) {
        throw new Error("Compilation LaTeX échouée. Consulte les logs dans l’onglet CV Builder.");
      }
    }, "Preview PDF générée.");
  }

  async function saveGeneratedCvToVersion() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne d’abord un owner et une version.");
      return;
    }

    await runAction(async () => {
      const data = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/cv/save`,
        buildCvGenerationPayload({ includeLatexOverride: true }),
      );

      setCvLatexSource(data?.latexSource ?? cvLatexSource);
      setCvPreviewUrl(normalizeGeneratedFileUrl(data?.pdfUrl));
      setCvCompileLogs(data?.logs ?? "");
      setCvCompileWarnings(data?.warnings ?? []);
      setCvCompileSuccess(Boolean(data?.success));

      if (!data?.success) {
        throw new Error("Sauvegarde impossible : la compilation LaTeX a échoué.");
      }

      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "CV généré et enregistré dans la version actuelle.");
  }

  return {
    cvLocalStorageKey,
    readCvLocalList,
    writeCvLocalList,
    resetCvEditorFromData,
    applyCvCommand,
    undoCvCommand,
    redoCvCommand,
    updateCvProfileField,
    updateCvProfileFields,
    updateCvItemFields,
    importCvProfilePhoto,
    importCvEducationLogo,
    updateCvSettingsField,
    toggleCvSection,
    updateCvItem,
    updateCvItemCsv,
    toggleCvItem,
    moveCvEditorItem,
    moveCvEditorItemTo,
    sortCvItems,
    dropCvItem,
    getCvDragProps,
    updateCvSectionColumn,
    adjustCvSpacing,
    toggleReduceCvDescriptions,
    duplicateCvItem,
    removeCvItem,
    addCvItem,
    applyCvTargetPreset,
    compactCvOnOnePage,
    generateLatexFromCvDocument,
    createCvVariantSnapshot,
    saveCurrentCvVariant,
    loadCvVariant,
    deleteCvVariant,
    compareCvVariant,
    saveCvCommandPreset,
    applyCvCommandPreset,
    runCvQualityCheck,
    runBackendCvQualityCheck,
    analyzeCvOffer,
    applyOfferRecommendations,
    exportCvReproducibleZip,
    startAsyncCvPreview,
    pollAsyncCvJob,
    smartCompactAndPreview,
    updateTemplateLock,
    buildCvGenerationPayload,
    generateCvLatexSource,
    previewGeneratedCv,
    saveGeneratedCvToVersion
  };
}
