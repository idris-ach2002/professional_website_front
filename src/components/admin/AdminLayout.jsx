import { Stack } from "@mantine/core";
import AdminCommandTraceModal from "./AdminCommandTraceModal";
import AdminContextCard from "./AdminContextCard";
import AdminFeedbackAlerts from "./AdminFeedbackAlerts";
import AdminGuidedWorkflow from "./AdminGuidedWorkflow";
import AdminHeroHeader from "./AdminHeroHeader";
import AdminJsonEditorModal from "./AdminJsonEditorModal";
import AdminMainTabs from "./AdminMainTabs";

export default function AdminLayout({ controller }) {
  const {
    authStatus,
    rootRef,
    AdminChecking,
    AdminLoginRedirect,
    selectedOwnerId,
    selectedVersionId,
    selectedVersion,
    profileForm,
    projects,
    experiences,
    activeVersionsCount,
    setAdminActiveTab,
  } = controller;

  if (authStatus === "checking") {
    return <AdminChecking />;
  }

  if (authStatus === "login") {
    return <AdminLoginRedirect />;
  }

  return (
    <main ref={rootRef} className="admin-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />

      <AdminCommandTraceModal controller={controller} />

      <Stack gap="xl" className="admin-shell">
        <AdminHeroHeader controller={controller} />
        <AdminFeedbackAlerts controller={controller} />
        <AdminContextCard controller={controller} />
        <AdminGuidedWorkflow
          selectedOwnerId={selectedOwnerId}
          selectedVersionId={selectedVersionId}
          selectedVersion={selectedVersion}
          profileForm={profileForm}
          projects={projects}
          experiences={experiences}
          activeVersionsCount={activeVersionsCount}
          onOpenTab={(tab) => setAdminActiveTab(tab)}
        />
        <AdminMainTabs controller={controller} />
      </Stack>

      <AdminJsonEditorModal controller={controller} />
    </main>
  );
}
