import { Alert } from "@mantine/core";

export default function StatusBanner({ source, error }) {
  if (source === "api") return null;

  return (
    <Alert className="status-banner" radius="xl" title="Backend Spring non détecté">
      Le site reste testable avec des données de démonstration. Dès que <strong>GET /manager</strong> répond, le portfolio consomme automatiquement les données du backend. Détail : {error ?? "API indisponible"}.
    </Alert>
  );
}
