import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import MetadataHead from "./MetadataHead";
import OceanMorphBackground from "./OceanMorphBackground";
import { PdfPreviewPanel } from "./FilePreview";
import useLanguage from "../localization/useLanguage";
import { normalizeFileUrl } from "../utils/filePreview";
import { getContactHref, getOwnerFullName, getPrimaryContact } from "../utils/portfolio";
import "../styles/pages/cv-page.css";
import { VisibilityGate } from "../visibility/ItemVisibilityContext";

export default function CvPage({ owner, profile }) {
  const { localizedPath, t } = useLanguage();
  const cvUrl = normalizeFileUrl(profile?.cvUrl);
  const email = getPrimaryContact(owner, "EMAIL");
  const fullName = getOwnerFullName(owner);

  return (
    <main id="main-content" className="app-shell cv-page-shell" tabIndex={-1}>
      <MetadataHead owner={owner} page="cv" />
      <OceanMorphBackground />

      <Stack gap="xl" className="content-shell cv-page-content">
        <VisibilityGate item="cv.heading"><div className="cv-page-heading island-card">
          <Text className="card-kicker">{t("cv.document")}</Text>
          <Title order={1}>CV — {fullName}</Title>
          <Text c="dimmed" maw={820}>{t("cv.description")}</Text>
        </div></VisibilityGate>

        <VisibilityGate item="cv.actions"><Group gap="sm" className="cv-page-actions">
          {email && (
            <Button component="a" href={getContactHref(email)} radius="xl">
              {t("cv.email")}
            </Button>
          )}

          {cvUrl && (
            <Button component="a" href={cvUrl} target="_blank" rel="noreferrer" radius="xl" variant="outline">
              {t("cv.open")}
            </Button>
          )}

          {cvUrl && (
            <Button component="a" href={cvUrl} download radius="xl" variant="light">
              {t("cv.download")}
            </Button>
          )}

          <Button component="a" href={localizedPath("/")} radius="xl" variant="subtle">
            {t("cv.back")}
          </Button>
        </Group></VisibilityGate>

        <VisibilityGate item="cv.preview"><Card radius="xl" className="island-card cv-preview-card">
          {cvUrl ? (
            <PdfPreviewPanel url={cvUrl} title={`CV — ${fullName}`} />
          ) : (
            <Stack gap="xs">
              <Title order={2}>{t("cv.empty")}</Title>
              <Text c="dimmed">{t("cv.emptyDescription")}</Text>
            </Stack>
          )}
        </Card></VisibilityGate>
      </Stack>
    </main>
  );
}
