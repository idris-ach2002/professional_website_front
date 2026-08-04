import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import useLanguage from "../localization/useLanguage";
import OceanMorphBackground from "./OceanMorphBackground";
import "../styles/pages/not-found.css";

export default function NotFoundPage() {
  const { localizedPath, t } = useLanguage();

  return (
    <main className="app-shell not-found-page">
      <OceanMorphBackground staticMode />
      <Stack className="not-found-content" gap="lg" align="flex-start">
        <Text className="card-kicker">{t("notFound.kicker")}</Text>
        <Title order={1}>{t("notFound.title")}</Title>
        <Text className="not-found-description">{t("notFound.description")}</Text>
        <Group gap="sm">
          <Button component={Link} to={localizedPath("/")} radius="xl">
            {t("notFound.home")}
          </Button>
          <Button component={Link} to={localizedPath("/#projects")} variant="light" radius="xl">
            {t("notFound.projects")}
          </Button>
          <Button component={Link} to={localizedPath("/cv")} variant="subtle" radius="xl">
            {t("notFound.cv")}
          </Button>
        </Group>
      </Stack>
    </main>
  );
}
