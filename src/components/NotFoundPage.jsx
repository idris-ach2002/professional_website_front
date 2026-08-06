import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import useLanguage from "../localization/useLanguage";
import OceanMorphBackground from "./OceanMorphBackground";
import "../styles/pages/not-found.css";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  const created = !element;
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  const previous = Object.fromEntries(
    Object.keys(attributes).map((name) => [name, element.getAttribute(name)]),
  );
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));

  return () => {
    if (created) {
      element.remove();
      return;
    }
    Object.entries(previous).forEach(([name, value]) => {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    });
  };
}

export default function NotFoundPage() {
  const { localizedPath, t } = useLanguage();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t("notFound.metaTitle");

    const restoreRobots = upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: "noindex, follow",
    });
    const restoreDescription = upsertMeta('meta[name="description"]', {
      name: "description",
      content: t("notFound.description"),
    });

    const canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute("href") ?? null;
    if (canonical) canonical.setAttribute("href", window.location.href);

    return () => {
      document.title = previousTitle;
      restoreRobots();
      restoreDescription();
      if (canonical) {
        if (previousCanonical === null) canonical.removeAttribute("href");
        else canonical.setAttribute("href", previousCanonical);
      }
    };
  }, [t]);

  return (
    <main id="main-content" className="app-shell not-found-page" tabIndex={-1}>
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
