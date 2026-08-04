import { Alert } from "@mantine/core";
import useLanguage from "../localization/useLanguage";

function formatCachedAt(cachedAt, locale) {
  if (!cachedAt) return null;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(cachedAt));
  } catch {
    return null;
  }
}

export default function StatusBanner({ source, error, cachedAt }) {
  const { locale, t } = useLanguage();
  if (source === "api") return null;
  if (source === "cache" && !error) return null;

  if (source === "cache") {
    const lastSync = formatCachedAt(cachedAt, locale);
    const syncLabel = lastSync ? t("status.syncedAt", { date: lastSync }) : "";

    return (
      <Alert className="status-banner" radius="xl" title={t("status.cacheTitle")}>
        {t("status.cacheMessage", {
          lastSync: syncLabel,
          error: error ?? t("status.apiUnavailable"),
        })}
      </Alert>
    );
  }

  return (
    <Alert className="status-banner" radius="xl" title={t("status.demoTitle")}>
      {t("status.demoMessage", { error: error ?? t("status.apiMissing") })}
    </Alert>
  );
}
