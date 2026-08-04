import { Card, Tabs } from "@mantine/core";
import AdminImportPanel from "./AdminImportPanel";
import AdminOwnerPanel from "./AdminOwnerPanel";
import AdminVersionsPanel from "./AdminVersionsPanel";
import AdminAnalyticsPanel from "./AdminAnalyticsPanel";
import AdminSafetyPanel from "./AdminSafetyPanel";
import AdminProfilePanel from "./AdminProfilePanel";
import AdminTimelinePanel from "./AdminTimelinePanel";
import AdminProjectsPanel from "./AdminProjectsPanel";
import AdminTranslationPanel from "./AdminTranslationPanel";

export default function AdminMainTabs({ controller }) {
  const {
    adminActiveTab,
    setAdminActiveTab,
    jsonImportFile,
    setJsonImportFile,
    importJsonFromFile,
    loading,
    jsonImportText,
    setJsonImportText,
    importJsonFromText,
    jsonImportSummary,
    ownerForm,
    updateOwnerForm,
    addOwnerContact,
    updateOwnerContact,
    removeOwnerContact,
    updateOwner,
    selectedOwnerId,
    createOwner,
    versionForm,
    updateVersionForm,
    versions,
    cloneSourceVersionId,
    setCloneSourceVersionId,
    cloneVersion,
    createVersion,
    updateVersionMetadata,
    selectedVersionId,
    selectVersion,
    activateVersionWithValidation,
    portfolioHealthReport,
    publishValidationReport,
    runPortfolioHealthCheck,
    validatePortfolioBeforePublish,
    selectedVersion,
    portfolioBackupUrl,
    portfolioBackupJson,
    exportPortfolioBackupZip,
    downloadTextFile,
    portfolioRestoreLabel,
    setPortfolioRestoreLabel,
    restorePortfolioBackup,
    portfolioRestoreText,
    setPortfolioRestoreText,
    profileFiles,
    setProfileFiles,
    profileForm,
    updateProfileForm,
    saveProfile,
    timelineForm,
    updateTimelineForm,
    experienceCategories,
    experienceForm,
    updateExperienceForm,
    experienceFiles,
    setExperienceFiles,
    experiences,
    experienceMode,
    selectedExperienceIndex,
    addExperienceLocally,
    updateExperienceLocally,
    removeExperience,
    duplicateExperience,
    selectExperience,
    resetExperienceForm,
    moveExperience,
    saveTimeline,
    projects,
    projectMode,
    selectedProject,
    selectedProjectId,
    projectFiles,
    setProjectFiles,
    projectForm,
    updateProjectForm,
    projectStatuses,
    getProjectId,
    selectProject,
    resetProjectForm,
    hydrateProjectForm,
    setProjectMode,
    setSelectedProjectId,
    setProjectForm,
    emptyProjectForm,
    emptyProjectFiles,
    addProject,
    updateProject,
    deleteProject,
  } = controller;

  return (
    <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-tabs-card">
      <Tabs value={adminActiveTab} onChange={(value) => setAdminActiveTab(value ?? "version")} variant="outline" radius="md" className="admin-tabs">
        <Tabs.List>
          <Tabs.Tab value="import">Import JSON</Tabs.Tab>
          <Tabs.Tab value="owner">Profil principal</Tabs.Tab>
          <Tabs.Tab value="version">Versions</Tabs.Tab>
          <Tabs.Tab value="safety">Santé & backup</Tabs.Tab>
          <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
          <Tabs.Tab value="translations">Traductions</Tabs.Tab>
          <Tabs.Tab value="profile">Profil & fichiers</Tabs.Tab>
          <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
          <Tabs.Tab value="project">Projets</Tabs.Tab>
        </Tabs.List>

        <AdminImportPanel
          jsonImportFile={jsonImportFile}
          setJsonImportFile={setJsonImportFile}
          importJsonFromFile={importJsonFromFile}
          loading={loading}
          jsonImportText={jsonImportText}
          setJsonImportText={setJsonImportText}
          importJsonFromText={importJsonFromText}
          jsonImportSummary={jsonImportSummary}
        />
        <AdminOwnerPanel
          ownerForm={ownerForm}
          updateOwnerForm={updateOwnerForm}
          addOwnerContact={addOwnerContact}
          updateOwnerContact={updateOwnerContact}
          removeOwnerContact={removeOwnerContact}
          updateOwner={updateOwner}
          loading={loading}
          selectedOwnerId={selectedOwnerId}
          createOwner={createOwner}
        />
        <AdminVersionsPanel
          versionForm={versionForm}
          updateVersionForm={updateVersionForm}
          versions={versions}
          cloneSourceVersionId={cloneSourceVersionId}
          setCloneSourceVersionId={setCloneSourceVersionId}
          cloneVersion={cloneVersion}
          selectedOwnerId={selectedOwnerId}
          createVersion={createVersion}
          updateVersionMetadata={updateVersionMetadata}
          selectedVersionId={selectedVersionId}
          selectVersion={selectVersion}
          activateVersionWithValidation={activateVersionWithValidation}
        />
        <AdminSafetyPanel
          portfolioHealthReport={portfolioHealthReport}
          publishValidationReport={publishValidationReport}
          runPortfolioHealthCheck={runPortfolioHealthCheck}
          validatePortfolioBeforePublish={validatePortfolioBeforePublish}
          activateVersionWithValidation={activateVersionWithValidation}
          selectedOwnerId={selectedOwnerId}
          selectedVersionId={selectedVersionId}
          selectedVersion={selectedVersion}
          portfolioBackupUrl={portfolioBackupUrl}
          portfolioBackupJson={portfolioBackupJson}
          exportPortfolioBackupZip={exportPortfolioBackupZip}
          downloadTextFile={downloadTextFile}
          portfolioRestoreLabel={portfolioRestoreLabel}
          setPortfolioRestoreLabel={setPortfolioRestoreLabel}
          restorePortfolioBackup={restorePortfolioBackup}
          portfolioRestoreText={portfolioRestoreText}
          setPortfolioRestoreText={setPortfolioRestoreText}
        />
        <Tabs.Panel value="analytics" pt="lg"><AdminAnalyticsPanel /></Tabs.Panel>
        <Tabs.Panel value="translations" pt="lg"><AdminTranslationPanel /></Tabs.Panel>
        <Tabs.Panel value="profile" pt="lg">
          <AdminProfilePanel
            profileFiles={profileFiles}
            setProfileFiles={setProfileFiles}
            profileForm={profileForm}
            updateProfileForm={updateProfileForm}
            saveProfile={saveProfile}
            selectedOwnerId={selectedOwnerId}
            selectedVersionId={selectedVersionId}
          />
        </Tabs.Panel>
        <Tabs.Panel value="timeline" pt="lg">
          <AdminTimelinePanel
            timelineForm={timelineForm}
            updateTimelineForm={updateTimelineForm}
            experienceCategories={experienceCategories}
            experienceForm={experienceForm}
            updateExperienceForm={updateExperienceForm}
            experienceFiles={experienceFiles}
            setExperienceFiles={setExperienceFiles}
            experiences={experiences}
            experienceMode={experienceMode}
            selectedExperienceIndex={selectedExperienceIndex}
            selectedOwnerId={selectedOwnerId}
            selectedVersionId={selectedVersionId}
            addExperienceLocally={addExperienceLocally}
            updateExperienceLocally={updateExperienceLocally}
            removeExperience={removeExperience}
            selectExperience={selectExperience}
            resetExperienceForm={resetExperienceForm}
            duplicateExperience={duplicateExperience}
            moveExperience={moveExperience}
            saveTimeline={saveTimeline}
          />
        </Tabs.Panel>
        <Tabs.Panel value="project" pt="lg">
          <AdminProjectsPanel
            projects={projects}
            projectMode={projectMode}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            selectedOwnerId={selectedOwnerId}
            selectedVersionId={selectedVersionId}
            projectFiles={projectFiles}
            setProjectFiles={setProjectFiles}
            projectForm={projectForm}
            updateProjectForm={updateProjectForm}
            projectStatuses={projectStatuses}
            getProjectId={getProjectId}
            selectProject={selectProject}
            resetProjectForm={resetProjectForm}
            hydrateProjectForm={hydrateProjectForm}
            setProjectMode={setProjectMode}
            setSelectedProjectId={setSelectedProjectId}
            setProjectForm={setProjectForm}
            emptyProjectForm={emptyProjectForm}
            emptyProjectFiles={emptyProjectFiles}
            addProject={addProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
          />
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
