import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import OceanMorphBackground from "./OceanMorphBackground";
import { PdfPreviewPanel } from "./FilePreview";
import { normalizeFileUrl } from "../utils/filePreview";
import { getContactHref, getOwnerFullName, getPrimaryContact } from "../utils/portfolio";

export default function CvPage({ owner, profile }) {
  const cvUrl = normalizeFileUrl(profile?.cvUrl);
  const email = getPrimaryContact(owner, "EMAIL");
  const fullName = getOwnerFullName(owner);

  return (
    <main className="app-shell cv-page-shell">
      <OceanMorphBackground />

      <Stack gap="xl" className="content-shell cv-page-content">
        <div className="cv-page-heading island-card">
          <Text className="card-kicker">Document professionnel</Text>
          <Title order={1}>CV — {fullName}</Title>
          <Text c="dimmed" maw={820}>
            Affichage direct du PDF dans le navigateur. Tu peux aussi ouvrir le document dans un nouvel onglet ou le télécharger.
          </Text>
        </div>

        <Group gap="sm" className="cv-page-actions">
          {email && (
            <Button component="a" href={getContactHref(email)} radius="xl">
              Envoyer un courriel
            </Button>
          )}

          {cvUrl && (
            <Button component="a" href={cvUrl} target="_blank" rel="noreferrer" radius="xl" variant="outline">
              Ouvrir le PDF
            </Button>
          )}

          {cvUrl && (
            <Button component="a" href={cvUrl} download radius="xl" variant="light">
              Télécharger
            </Button>
          )}

          <Button component="a" href="/" radius="xl" variant="subtle">
            Retour au portfolio
          </Button>
        </Group>

        <Card radius="xl" className="island-card cv-preview-card">
          {cvUrl ? (
            <PdfPreviewPanel url={cvUrl} title={`CV — ${fullName}`} />
          ) : (
            <Stack gap="xs">
              <Title order={2}>Aucun CV renseigné</Title>
              <Text c="dimmed">
                Ajoute un PDF depuis le panel admin pour activer l’aperçu du CV.
              </Text>
            </Stack>
          )}
        </Card>
      </Stack>
    </main>
  );
}
