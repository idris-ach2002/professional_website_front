import { useMemo, useRef, useState } from "react";
import { useGsap } from "../../animations/useGsap";
import * as adminCoreUi from "./adminCore";
import * as adminCoreUtils from "./adminCoreUtils";
import useAdminCrudActions from "./useAdminCrudActions";
import useAdminJsonWorkspace from "./useAdminJsonWorkspace";
import useAdminPortfolioCore from "./useAdminPortfolioCore";
import useAdminSafetyActions from "./useAdminSafetyActions";
import useAdminAsyncCoordinator from "./useAdminAsyncCoordinator";
import useAdminPublicationActions from "./useAdminPublicationActions";

const adminCore = { ...adminCoreUtils, ...adminCoreUi };

const {
  emptyOwnerForm,
  emptyVersionForm,
  emptyProfileForm,
  emptyTimelineForm,
  emptyExperienceForm,
  emptyProjectForm,
  emptyProfileFiles,
  emptyExperienceFiles,
  emptyProjectFiles,
  getEntityId,
  getProjectId,
} = adminCore;

export default function useAdminController() {
  const rootRef = useRef(null);
  const jsonHighlightRef = useRef(null);
  const jsonLineNumbersRef = useRef(null);

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

  const [portfolioHealthReport, setPortfolioHealthReport] = useState(null);
  const [publishValidationReport, setPublishValidationReport] = useState(null);
  const [portfolioBackupUrl, setPortfolioBackupUrl] = useState("");
  const [portfolioBackupJson, setPortfolioBackupJson] = useState("");
  const [portfolioRestoreText, setPortfolioRestoreText] = useState("");
  const [portfolioRestoreLabel, setPortfolioRestoreLabel] = useState("Version restaurée depuis backup");
  const [adminActiveTab, setAdminActiveTab] = useState("version");
  const [publicationJobs, setPublicationJobs] = useState([]);
  const [publicationEvents, setPublicationEvents] = useState([]);
  const [publicationDiff, setPublicationDiff] = useState(null);
  const [publicationCompareVersionId, setPublicationCompareVersionId] = useState(null);
  const [publicationScheduleAt, setPublicationScheduleAt] = useState("");
  const [publicationAudit, setPublicationAudit] = useState([]);
  const [publicationDraftMeta, setPublicationDraftMeta] = useState({ label: "", description: "" });
  const [publicationAutosaveState, setPublicationAutosaveState] = useState({ status: "idle", lastSavedAt: null, message: null });

  const asyncCoordinator = useAdminAsyncCoordinator({
    setLoading,
    setMessage,
    setError,
    setAuthStatus,
  });

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
    portfolioHealthReport, setPortfolioHealthReport, publishValidationReport, setPublishValidationReport,
    portfolioBackupUrl, setPortfolioBackupUrl, portfolioBackupJson, setPortfolioBackupJson,
    portfolioRestoreText, setPortfolioRestoreText, portfolioRestoreLabel, setPortfolioRestoreLabel,
    adminActiveTab, setAdminActiveTab, selectedVersion, selectedProject,
    publicationJobs, setPublicationJobs, publicationEvents, setPublicationEvents, publicationDiff, setPublicationDiff,
    publicationCompareVersionId, setPublicationCompareVersionId, publicationScheduleAt, setPublicationScheduleAt,
    publicationAudit, setPublicationAudit, publicationDraftMeta, setPublicationDraftMeta,
    publicationAutosaveState, setPublicationAutosaveState,
    ...asyncCoordinator,
  };

  const portfolioCore = useAdminPortfolioCore(state);
  const jsonWorkspace = useAdminJsonWorkspace({ ...state, ...portfolioCore });
  const safetyActions = useAdminSafetyActions({ ...state, ...portfolioCore });
  const crudActions = useAdminCrudActions({ ...state, ...portfolioCore });
  const publicationActions = useAdminPublicationActions({ ...state, ...portfolioCore });

  return {
    ...adminCore,
    ...state,
    ...portfolioCore,
    ...jsonWorkspace,
    ...safetyActions,
    ...crudActions,
    ...publicationActions,
    rootRef,
    jsonHighlightRef,
    jsonLineNumbersRef,
    activeVersionsCount: versions.filter((version) => version.active).length,
    selectedVersionProjectsCount: projects.length,
    selectedVersionExperiencesCount: experiences.length,
  };
}
