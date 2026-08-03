import { Alert } from "@mantine/core";

function formatCachedAt(cachedAt) {
  if (!cachedAt) return null;

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(cachedAt));
  } catch {
    return null;
  }
}

export default function StatusBanner({ source, error, cachedAt }) {
  if (source === "api") return null;
  if (source === "cache" && !error) return null;

  if (source === "cache") {
    const lastSync = formatCachedAt(cachedAt);

    return (
      <Alert className="status-banner" radius="xl" title="Version enregistrée affichée">
        Le portfolio utilise la dernière réponse valide conservée sur cet appareil
        {lastSync ? `, synchronisée le ${lastSync}` : ""}. L’actualisation du backend a échoué, mais les données réelles restent disponibles. Détail : {error ?? "API momentanément indisponible"}.
      </Alert>
    );
  }

  return (
    <Alert className="status-banner" radius="xl" title="Backend Spring non détecté">
      Aucune version API ni version enregistrée n’était disponible. Le site utilise temporairement les données de démonstration. Détail : {error ?? "API indisponible"}.
    </Alert>
  );
}
