import AdminContextCard from "./AdminContextCard";
import AdminFeedbackAlerts from "./AdminFeedbackAlerts";
import AdminHeroHeader from "./AdminHeroHeader";
import AdminJsonEditorModal from "./AdminJsonEditorModal";
import AdminMainTabs from "./AdminMainTabs";
import AdminNavigation from "./AdminNavigation";
import { getAdminNavigationItem } from "./adminNavigationConfig";

export default function AdminLayout({ controller }) {
  const {
    authStatus,
    rootRef,
    AdminChecking,
    AdminLoginRedirect,
    selectedVersion,
    adminActiveTab,
    setAdminActiveTab,
    refreshPublicationOperationalState,
  } = controller;

  if (authStatus === "checking") {
    return <AdminChecking />;
  }

  if (authStatus === "login") {
    return <AdminLoginRedirect />;
  }

  const navigate = (next) => {
    setAdminActiveTab(next);
    if (next === "publication") refreshPublicationOperationalState();
  };

  return (
    <main id="main-content" ref={rootRef} className="admin-page" tabIndex={-1}>
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-command-shell">
        <AdminNavigation value={adminActiveTab} selectedVersion={selectedVersion} onChange={navigate} />
        <section className="admin-command-main">
          <AdminHeroHeader controller={controller} currentItem={getAdminNavigationItem(adminActiveTab)} />
          <div className="admin-command-content">
            <AdminFeedbackAlerts controller={controller} />
            <AdminContextCard controller={controller} />
            <AdminMainTabs controller={controller} />
          </div>
        </section>
      </div>

      <AdminJsonEditorModal controller={controller} />
    </main>
  );
}
