import { useMemo, useRef, useState } from "react";
import { useGsap } from "../../animations/useGsap";
import * as adminCore from "./adminCore";
import useAdminApplications from "./useAdminApplications";
import useAdminCrudActions from "./useAdminCrudActions";
import useAdminCvStudio from "./useAdminCvStudio";
import useAdminJsonWorkspace from "./useAdminJsonWorkspace";
import useAdminPortfolioCore from "./useAdminPortfolioCore";
import useAdminSafetyActions from "./useAdminSafetyActions";

const {
  emptyApplicationForm,
  emptyOwnerForm,
  emptyVersionForm,
  emptyProfileForm,
  emptyTimelineForm,
  emptyExperienceForm,
  emptyProjectForm,
  emptyProfileFiles,
  emptyExperienceFiles,
  emptyProjectFiles,
  createEmptyCvDocument,
  buildLocalCvQualityReport,
  getEntityId,
  getProjectId,
} = adminCore;

export default function useAdminController() {
  const rootRef = useRef(null);
  const jsonHighlightRef = useRef(null);
  const jsonLineNumbersRef = useRef(null);
  const servicesRef = useRef({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState("checking");

  const [owners, setOwners] = useState([]);
  const [versions, setVersions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectMode, setProjectMode] = useState("create");
  const [cloneSourceVersionId, setCloneSourceVersionId] = useState(null);

  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [timelineForm, setTimelineForm] = useState(emptyTimelineForm);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);
  const [experiences, setExperiences] = useState([]);
  const [experienceMode, setExperienceMode] = useState("create");
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [profileFiles, setProfileFiles] = useState(emptyProfileFiles);
  const [experienceFiles, setExperienceFiles] = useState(emptyExperienceFiles);
  const [projectFiles, setProjectFiles] = useState(emptyProjectFiles);

  const [jsonImportFile, setJsonImportFile] = useState(null);
  const [jsonImportText, setJsonImportText] = useState("");
  const [jsonImportSummary, setJsonImportSummary] = useState(null);
  const [jsonEditorOpened, setJsonEditorOpened] = useState(false);
  const [jsonEditorText, setJsonEditorText] = useState("");
  const [jsonEditorError, setJsonEditorError] = useState(null);

  const [cvEditorState, setCvEditorState] = useState(() => ({
    past: [],
    present: createEmptyCvDocument(),
    future: [],
    commandLog: [],
  }));
  const [cvSelectedSection, setCvSelectedSection] = useState("profile");
  const [cvActiveEditorTab, setCvActiveEditorTab] = useState("content");
  const [cvDraggingItem, setCvDraggingItem] = useState(null);
  const [cvManualLatexDirty, setCvManualLatexDirty] = useState(false);
  const [cvLatexSource, setCvLatexSource] = useState("");
  const [cvPreviewUrl, setCvPreviewUrl] = useState("");
  const [cvCompileLogs, setCvCompileLogs] = useState("");
  const [cvCompileWarnings, setCvCompileWarnings] = useState([]);
  const [cvCompileSuccess, setCvCompileSuccess] = useState(null);
  const [cvTemplateLocked, setCvTemplateLocked] = useState(true);
  const [cvQualityReport, setCvQualityReport] = useState(null);
  const [cvVariants, setCvVariants] = useState([]);
  const [selectedCvVariantId, setSelectedCvVariantId] = useState(null);
  const [cvVariantName, setCvVariantName] = useState("CV ciblé");
  const [cvDiffReport, setCvDiffReport] = useState(null);
  const [cvOfferText, setCvOfferText] = useState("");
  const [cvOfferAnalysis, setCvOfferAnalysis] = useState(null);
  const [cvPresetName, setCvPresetName] = useState("Preset personnalisé");
  const [cvCommandPresets, setCvCommandPresets] = useState([]);
  const [cvExportZipUrl, setCvExportZipUrl] = useState("");
  const [cvAsyncJob, setCvAsyncJob] = useState(null);
  const [cvRegressionReport, setCvRegressionReport] = useState(null);

  const [portfolioHealthReport, setPortfolioHealthReport] = useState(null);
  const [publishValidationReport, setPublishValidationReport] = useState(null);
  const [portfolioBackupUrl, setPortfolioBackupUrl] = useState("");
  const [portfolioBackupJson, setPortfolioBackupJson] = useState("");
  const [portfolioRestoreText, setPortfolioRestoreText] = useState("");
  const [portfolioRestoreLabel, setPortfolioRestoreLabel] = useState("Version restaurée depuis backup");

  const [applications, setApplications] = useState([]);
  const [applicationsDashboard, setApplicationsDashboard] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const [offerAnalysis, setOfferAnalysis] = useState(null);
  const [coverLetterPreviewUrl, setCoverLetterPreviewUrl] = useState("");
  const [coverLetterLogs, setCoverLetterLogs] = useState("");
  const [coverLetterWarnings, setCoverLetterWarnings] = useState([]);
  const [applicationZipUrl, setApplicationZipUrl] = useState("");
  const [smartAnalysis, setSmartAnalysis] = useState(null);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [selectedLetterVariantId, setSelectedLetterVariantId] = useState("");
  const [selectedCvProposalId, setSelectedCvProposalId] = useState("");
  const [smartPackUrl, setSmartPackUrl] = useState("");
  const [adminActiveTab, setAdminActiveTab] = useState("version");
  const [selectedSmartCommandKeys, setSelectedSmartCommandKeys] = useState({});
  const [commandTraceOpened, setCommandTraceOpened] = useState(false);
  const [commandTraceStatus, setCommandTraceStatus] = useState("idle");
  const [commandTraceTitle, setCommandTraceTitle] = useState("Trace d’application CV");
  const [commandTraceEntries, setCommandTraceEntries] = useState([]);

  const cvDocument = cvEditorState.present;
  const cvCanUndo = cvEditorState.past.length > 0;
  const cvCanRedo = cvEditorState.future.length > 0;
  const cvSelectedItems = useMemo(() => {
    if (["experiences", "education", "projects", "skills", "languages", "qualities", "contacts"].includes(cvSelectedSection)) {
      return cvDocument[cvSelectedSection] ?? [];
    }
    return [];
  }, [cvDocument, cvSelectedSection]);
  const cvQualitySummary = useMemo(
    () => cvQualityReport ?? buildLocalCvQualityReport(cvDocument, cvLatexSource),
    [cvDocument, cvLatexSource, cvQualityReport],
  );
  const selectedVersion = useMemo(
    () => versions.find((version) => String(getEntityId(version)) === String(selectedVersionId)),
    [versions, selectedVersionId],
  );
  const selectedProject = useMemo(
    () => projects.find((project) => String(getProjectId(project)) === String(selectedProjectId)),
    [projects, selectedProjectId],
  );

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    if (!root) return undefined;
    const heroCard = root.querySelector(".admin-hero-card");
    const cards = root.querySelectorAll(".admin-context-card, .admin-tabs-card");
    const orbs = root.querySelectorAll(".admin-orb");
    if (heroCard) gsap.from(heroCard, { y: 34, autoAlpha: 0, duration: 0.8, ease: "power3.out" });
    if (cards.length > 0) gsap.from(cards, { y: 30, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.12, delay: 0.12 });
    if (orbs.length > 0) gsap.to(orbs, { y: -16, x: 12, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.45 });
    return undefined;
  }, []);

  const state = {
    loading, setLoading, message, setMessage, error, setError,
    authStatus, setAuthStatus, owners, setOwners, versions, setVersions, projects, setProjects,
    selectedOwnerId, setSelectedOwnerId, selectedVersionId, setSelectedVersionId,
    selectedProjectId, setSelectedProjectId, projectMode, setProjectMode,
    cloneSourceVersionId, setCloneSourceVersionId, ownerForm, setOwnerForm, versionForm, setVersionForm,
    profileForm, setProfileForm, timelineForm, setTimelineForm, experienceForm, setExperienceForm,
    experiences, setExperiences, experienceMode, setExperienceMode, selectedExperienceIndex, setSelectedExperienceIndex,
    projectForm, setProjectForm, profileFiles, setProfileFiles, experienceFiles, setExperienceFiles, projectFiles, setProjectFiles,
    jsonImportFile, setJsonImportFile, jsonImportText, setJsonImportText, jsonImportSummary, setJsonImportSummary,
    jsonEditorOpened, setJsonEditorOpened, jsonEditorText, setJsonEditorText, jsonEditorError, setJsonEditorError,
    cvEditorState, setCvEditorState, cvSelectedSection, setCvSelectedSection, cvActiveEditorTab, setCvActiveEditorTab,
    cvDraggingItem, setCvDraggingItem, cvManualLatexDirty, setCvManualLatexDirty, cvLatexSource, setCvLatexSource,
    cvPreviewUrl, setCvPreviewUrl, cvCompileLogs, setCvCompileLogs, cvCompileWarnings, setCvCompileWarnings,
    cvCompileSuccess, setCvCompileSuccess, cvTemplateLocked, setCvTemplateLocked, cvQualityReport, setCvQualityReport,
    cvVariants, setCvVariants, selectedCvVariantId, setSelectedCvVariantId, cvVariantName, setCvVariantName,
    cvDiffReport, setCvDiffReport, cvOfferText, setCvOfferText, cvOfferAnalysis, setCvOfferAnalysis,
    cvPresetName, setCvPresetName, cvCommandPresets, setCvCommandPresets, cvExportZipUrl, setCvExportZipUrl,
    cvAsyncJob, setCvAsyncJob, cvRegressionReport, setCvRegressionReport,
    portfolioHealthReport, setPortfolioHealthReport, publishValidationReport, setPublishValidationReport,
    portfolioBackupUrl, setPortfolioBackupUrl, portfolioBackupJson, setPortfolioBackupJson,
    portfolioRestoreText, setPortfolioRestoreText, portfolioRestoreLabel, setPortfolioRestoreLabel,
    applications, setApplications, applicationsDashboard, setApplicationsDashboard, selectedApplicationId, setSelectedApplicationId,
    applicationForm, setApplicationForm, offerAnalysis, setOfferAnalysis, coverLetterPreviewUrl, setCoverLetterPreviewUrl,
    coverLetterLogs, setCoverLetterLogs, coverLetterWarnings, setCoverLetterWarnings, applicationZipUrl, setApplicationZipUrl,
    smartAnalysis, setSmartAnalysis, letterTemplates, setLetterTemplates, selectedLetterVariantId, setSelectedLetterVariantId,
    selectedCvProposalId, setSelectedCvProposalId, smartPackUrl, setSmartPackUrl, adminActiveTab, setAdminActiveTab,
    selectedSmartCommandKeys, setSelectedSmartCommandKeys, commandTraceOpened, setCommandTraceOpened,
    commandTraceStatus, setCommandTraceStatus, commandTraceTitle, setCommandTraceTitle, commandTraceEntries, setCommandTraceEntries,
    cvDocument, cvCanUndo, cvCanRedo, cvSelectedItems, cvQualitySummary, selectedVersion, selectedProject,
  };

  const refServices = {
    resetCvEditorFromData: (...args) => servicesRef.current.resetCvEditorFromData?.(...args),
    runAction: (...args) => servicesRef.current.runAction?.(...args),
    refreshVersions: (...args) => servicesRef.current.refreshVersions?.(...args),
    refreshOwners: (...args) => servicesRef.current.refreshOwners?.(...args),
    refreshProjects: (...args) => servicesRef.current.refreshProjects?.(...args),
    fetchOwners: (...args) => servicesRef.current.fetchOwners?.(...args),
    fetchVersions: (...args) => servicesRef.current.fetchVersions?.(...args),
    fetchProjects: (...args) => servicesRef.current.fetchProjects?.(...args),
    selectVersion: (...args) => servicesRef.current.selectVersion?.(...args),
    selectProject: (...args) => servicesRef.current.selectProject?.(...args),
    resetProjectForm: (...args) => servicesRef.current.resetProjectForm?.(...args),
    resetExperienceForm: (...args) => servicesRef.current.resetExperienceForm?.(...args),
    selectExperience: (...args) => servicesRef.current.selectExperience?.(...args),
    applyNormalizedPortfolioData: (...args) => servicesRef.current.applyNormalizedPortfolioData?.(...args),
    buildCurrentVersionJsonPayload: (...args) => servicesRef.current.buildCurrentVersionJsonPayload?.(...args),
    applyCvCommand: (...args) => servicesRef.current.applyCvCommand?.(...args),
    createCvVariantSnapshot: (...args) => servicesRef.current.createCvVariantSnapshot?.(...args),
    applyCvTargetPreset: (...args) => servicesRef.current.applyCvTargetPreset?.(...args),
    previewGeneratedCv: (...args) => servicesRef.current.previewGeneratedCv?.(...args),
    generateCvLatexSource: (...args) => servicesRef.current.generateCvLatexSource?.(...args),
    saveGeneratedCvToVersion: (...args) => servicesRef.current.saveGeneratedCvToVersion?.(...args),
    buildCvGenerationPayload: (...args) => servicesRef.current.buildCvGenerationPayload?.(...args),
  };

  const cvStudio = useAdminCvStudio({ ...state, ...refServices });
  servicesRef.current = { ...servicesRef.current, ...cvStudio };

  const portfolioCore = useAdminPortfolioCore({ ...state, ...refServices, ...cvStudio });
  servicesRef.current = { ...servicesRef.current, ...portfolioCore };

  const jsonWorkspace = useAdminJsonWorkspace({ ...state, ...refServices, ...cvStudio, ...portfolioCore });
  servicesRef.current = { ...servicesRef.current, ...jsonWorkspace };

  const safetyActions = useAdminSafetyActions({ ...state, ...refServices, ...portfolioCore, ...jsonWorkspace });
  const applicationsActions = useAdminApplications({ ...state, ...refServices, ...cvStudio, ...portfolioCore });
  const crudActions = useAdminCrudActions({ ...state, ...refServices, ...portfolioCore, ...cvStudio });
  servicesRef.current = { ...servicesRef.current, ...safetyActions, ...applicationsActions, ...crudActions };

  const activeVersionsCount = versions.filter((version) => version.active).length;
  const selectedVersionProjectsCount = projects.length;
  const selectedVersionExperiencesCount = experiences.length;
  const cvCurrentPdfUrl = cvPreviewUrl || profileForm.cvUrl || "";
  const cvCompileStatusColor = cvCompileSuccess === null ? "gray" : cvCompileSuccess ? "green" : "red";
  const cvCompileStatusLabel = cvCompileSuccess === null ? "Non compilé" : cvCompileSuccess ? "Compilation OK" : "Compilation KO";

  return {
    ...adminCore,
    ...state,
    ...portfolioCore,
    ...jsonWorkspace,
    ...safetyActions,
    ...cvStudio,
    ...applicationsActions,
    ...crudActions,
    rootRef,
    jsonHighlightRef,
    jsonLineNumbersRef,
    activeVersionsCount,
    selectedVersionProjectsCount,
    selectedVersionExperiencesCount,
    cvCurrentPdfUrl,
    cvCompileStatusColor,
    cvCompileStatusLabel,
  };
}
