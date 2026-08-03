

import {
  apiRequest,
  } from "../../services/authApi";
import {
  getEntityId,
  downloadTextFile,
} from "./adminCoreUtils";

export default function useAdminSafetyActions(ctx) {
  const {
    setError,
    selectedOwnerId,
    selectedVersionId,
    setPortfolioHealthReport,
    setPublishValidationReport,
    setPortfolioBackupUrl,
    setPortfolioBackupJson,
    portfolioRestoreText,
    setPortfolioRestoreText,
    portfolioRestoreLabel,
    runAction,
    refreshVersions
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
