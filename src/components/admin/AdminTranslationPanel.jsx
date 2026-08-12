import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Progress,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../services/authApi";
import {
  autoTranslateBundle,
  fetchTranslationBundle,
  fetchTranslationCatalog,
  fetchTranslationProviderHealth,
  previewTranslation,
  saveTranslationBundle,
} from "../../services/translationApi";

const TARGET_LOCALE = "en";

const CONTENT_TABS = [
  { value: "PROJECT", label: "Projets", singular: "projet", symbol: "PX" },
  { value: "EXPERIENCE", label: "Expériences", singular: "expérience", symbol: "EX" },
  { value: "TIMELINE", label: "Timeline", singular: "timeline", symbol: "TL" },
  { value: "PROFILE", label: "Profil", singular: "profil", symbol: "PR" },
  { value: "PROVEN_SKILL", label: "Compétences", singular: "compétence", symbol: "SK" },
];

function entryValue(item) {
  return `${item.contentType}:${item.contentKey}`;
}

function parseEntryValue(value) {
  const separator = value?.indexOf(":") ?? -1;
  if (separator < 1) return null;
  return {
    contentType: value.slice(0, separator),
    contentKey: value.slice(separator + 1),
  };
}

function fieldLabel(field) {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function isCatalogItemComplete(item) {
  return item.status === "PUBLISHED"
    && !item.stale
    && item.translatedFieldCount === item.sourceFieldCount;
}

function statusLabel(item) {
  if (item.stale) return "À retraduire";
  if (item.status === "PUBLISHED" && item.translatedFieldCount === item.sourceFieldCount) {
    return "Publié";
  }
  if (item.translatedFieldCount > 0) return "Brouillon";
  return "Non traduit";
}

function statusColor(item) {
  if (item.stale) return "orange";
  if (isCatalogItemComplete(item)) return "green";
  if (item.translatedFieldCount > 0) return "yellow";
  return "gray";
}

export default function AdminTranslationPanel() {
  const [health, setHealth] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [activeType, setActiveType] = useState("PROJECT");
  const [selected, setSelected] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [onlyMissingOrStale, setOnlyMissingOrStale] = useState(true);
  const [publishAfterBulk, setPublishAfterBulk] = useState(false);
  const actionControllerRef = useRef(null);
  const bulkControllerRef = useRef(null);

  const [bulkState, setBulkState] = useState({
    running: false,
    current: 0,
    total: 0,
    currentLabel: "",
    successes: 0,
    failures: [],
  });

  const refreshCatalog = useCallback(async (options = {}) => {
    const result = await fetchTranslationCatalog(TARGET_LOCALE, options);
    const normalized = result ?? [];
    setCatalog(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchTranslationProviderHealth({ signal: controller.signal }),
      fetchTranslationCatalog(TARGET_LOCALE, { signal: controller.signal }),
    ])
      .then(([provider, items]) => {
        if (controller.signal.aborted) return;
        const normalizedItems = items ?? [];
        const initialItem = normalizedItems.find((item) => item.contentType === "PROJECT")
          ?? normalizedItems[0]
          ?? null;

        setHealth(provider);
        setCatalog(normalizedItems);

        if (initialItem) {
          setActiveType(initialItem.contentType);
          setSelected(entryValue(initialItem));
          setBundleLoading(true);
        }
      })
      .catch((cause) => {
        if (!isAbortError(cause)) setError(cause?.message ?? "Impossible de charger les traductions.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => () => {
    actionControllerRef.current?.abort();
    bulkControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const parsed = parseEntryValue(selected);
    if (!parsed) return undefined;

    const controller = new AbortController();
    fetchTranslationBundle(parsed.contentType, parsed.contentKey, TARGET_LOCALE, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setBundle(result);
        setDraft(result?.translatedFields ?? {});
      })
      .catch((cause) => {
        if (!isAbortError(cause)) setError(cause?.message ?? "Impossible de charger cette traduction.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBundleLoading(false);
      });

    return () => controller.abort();
  }, [selected]);

  const catalogByType = CONTENT_TABS.reduce((result, tab) => {
    result[tab.value] = catalog.filter((item) => item.contentType === tab.value);
    return result;
  }, {});

  const selectedValue = selected;
  const publishedCount = catalog.filter(isCatalogItemComplete).length;
  const staleCount = catalog.filter((item) => item.stale).length;
  const untranslatedCount = catalog.filter((item) => item.translatedFieldCount === 0).length;
  const progressValue = bulkState.total > 0
    ? Math.round((bulkState.current / bulkState.total) * 100)
    : 0;

  const selectCatalogItem = (item) => {
    const nextValue = entryValue(item);
    if (nextValue === selectedValue) return;
    setSelected(nextValue);
    setBundle(null);
    setDraft({});
    setError("");
    setMessage("");
    setBundleLoading(true);
  };

  const changeContentType = (value) => {
    if (!value) return;
    setActiveType(value);
    const firstItem = catalogByType[value]?.[0];
    if (firstItem) {
      selectCatalogItem(firstItem);
    } else {
      setSelected(null);
      setBundle(null);
      setDraft({});
      setBundleLoading(false);
    }
  };

  const beginAction = () => {
    actionControllerRef.current?.abort();
    const controller = new AbortController();
    actionControllerRef.current = controller;
    return controller;
  };

  const runPreview = async () => {
    if (!bundle?.sourceFields) return;
    const controller = beginAction();
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const result = await previewTranslation(bundle.sourceFields, "fr", TARGET_LOCALE, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setDraft(result?.translatedFields ?? {});
      setMessage("Proposition LibreTranslate générée. Relis et corrige avant publication.");
    } catch (cause) {
      if (!isAbortError(cause)) setError(cause?.message ?? "LibreTranslate est indisponible.");
    } finally {
      if (actionControllerRef.current === controller) {
        actionControllerRef.current = null;
        setWorking(false);
      }
    }
  };

  const persist = async (status) => {
    const parsed = parseEntryValue(selected);
    if (!parsed) return;
    const controller = beginAction();
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const result = await saveTranslationBundle(
        parsed.contentType,
        parsed.contentKey,
        draft,
        status,
        TARGET_LOCALE,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      setBundle(result);
      await refreshCatalog({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setMessage(status === "PUBLISHED"
        ? "Traduction publiée. Le site public anglais la servira depuis PostgreSQL."
        : "Brouillon enregistré.");
    } catch (cause) {
      if (!isAbortError(cause)) setError(cause?.message ?? "Impossible d’enregistrer la traduction.");
    } finally {
      if (actionControllerRef.current === controller) {
        actionControllerRef.current = null;
        setWorking(false);
      }
    }
  };

  const translateWholeSite = async () => {
    if (!health?.reachable) {
      setError("LibreTranslate est indisponible. Démarre le conteneur avant la traduction globale.");
      return;
    }

    const candidates = onlyMissingOrStale
      ? catalog.filter((item) => !isCatalogItemComplete(item))
      : catalog;

    if (candidates.length === 0) {
      setMessage("Toutes les traductions sont déjà publiées et synchronisées.");
      return;
    }

    if (publishAfterBulk) {
      const confirmed = window.confirm(
        `Traduire et publier automatiquement ${candidates.length} élément(s) sans relecture manuelle ?`,
      );
      if (!confirmed) return;
    }

    bulkControllerRef.current?.abort();
    const controller = new AbortController();
    bulkControllerRef.current = controller;

    setError("");
    setMessage("");
    setBulkState({
      running: true,
      current: 0,
      total: candidates.length,
      currentLabel: "Préparation…",
      successes: 0,
      failures: [],
    });

    const failures = [];
    let successes = 0;
    const targetStatus = publishAfterBulk ? "PUBLISHED" : "DRAFT";

    for (let index = 0; index < candidates.length; index += 1) {
      const item = candidates[index];
      setBulkState((current) => ({
        ...current,
        current: index,
        currentLabel: item.label,
        successes,
        failures: [...failures],
      }));

      try {
        const translated = await autoTranslateBundle(
          item.contentType,
          item.contentKey,
          targetStatus,
          TARGET_LOCALE,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        successes += 1;
        if (entryValue(item) === selectedValue) {
          setBundle(translated);
          setDraft(translated?.translatedFields ?? {});
        }
      } catch (cause) {
        if (isAbortError(cause) || controller.signal.aborted) return;
        failures.push({
          item: item.label,
          message: cause?.message ?? "Échec de traduction",
        });
      }

      if (controller.signal.aborted) return;
      setBulkState((current) => ({
        ...current,
        current: index + 1,
        currentLabel: item.label,
        successes,
        failures: [...failures],
      }));
    }

    try {
      await refreshCatalog({ signal: controller.signal });
    } catch (cause) {
      if (isAbortError(cause) || controller.signal.aborted) return;
      failures.push({
        item: "Actualisation du catalogue",
        message: cause?.message ?? "Impossible de recharger les statuts",
      });
    }

    if (controller.signal.aborted) return;
    bulkControllerRef.current = null;
    setBulkState((current) => ({
      ...current,
      running: false,
      current: candidates.length,
      currentLabel: "Terminé",
      successes,
      failures: [...failures],
    }));

    if (failures.length === 0) {
      setMessage(
        publishAfterBulk
          ? `${successes} contenu(s) traduits et publiés automatiquement.`
          : `${successes} contenu(s) traduits en brouillon. Relis-les avant publication.`,
      );
    } else {
      setError(`${successes} traduction(s) réussie(s), ${failures.length} échec(s). Consulte le rapport ci-dessous.`);
    }
  };

  if (loading) {
    return (
      <TabsPanelShell>
        <Group justify="center"><Loader /></Group>
      </TabsPanelShell>
    );
  }

  return (
    <TabsPanelShell>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" fw={900} tt="uppercase" c="cyan.8">FR → EN · PostgreSQL</Text>
            <Title order={3}>Centre de traduction du portfolio</Title>
            <Text size="sm" c="dimmed" maw={820}>
              Les données métier sont traduites par LibreTranslate, relues dans l’administration puis stockées en base. Le site public ne contacte jamais le moteur de traduction.
            </Text>
          </div>
          <Badge color={health?.reachable ? "green" : "red"} variant="light" size="lg">
            LibreTranslate {health?.reachable ? "disponible" : "indisponible"}
          </Badge>
        </Group>

        {error && <Alert color="red" title="Erreur">{error}</Alert>}
        {message && <Alert color="cyan" title="Traduction">{message}</Alert>}

        <Card withBorder radius="xl" padding="lg" className="admin-translation-bulk-card">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <div>
                <Text size="xs" fw={900} tt="uppercase" c="violet.7">Automatisation globale</Text>
                <Title order={4}>Traduire tout le site en un clic</Title>
                <Text size="sm" c="dimmed" maw={720}>
                  Cette action couvre le profil, la timeline, toutes les expériences, tous les projets et les compétences prouvées. Les libellés fixes de l’interface restent gérés par le frontend.
                </Text>
              </div>
              <Group gap="xs">
                <Badge color="green" variant="light">{publishedCount} publiés</Badge>
                <Badge color="orange" variant="light">{staleCount} obsolètes</Badge>
                <Badge color="gray" variant="light">{untranslatedCount} non traduits</Badge>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Switch
                checked={onlyMissingOrStale}
                onChange={(event) => setOnlyMissingOrStale(event.currentTarget.checked)}
                label="Traduire seulement les contenus manquants ou obsolètes"
                description="Évite de consommer du CPU pour les traductions déjà publiées et synchronisées."
                disabled={bulkState.running}
              />
              <Switch
                checked={publishAfterBulk}
                onChange={(event) => setPublishAfterBulk(event.currentTarget.checked)}
                label="Publier directement après traduction"
                description="Désactivé par défaut : les résultats sont enregistrés comme brouillons à relire."
                color="violet"
                disabled={bulkState.running}
              />
            </SimpleGrid>

            {bulkState.running && (
              <div className="admin-translation-bulk-progress" aria-live="polite">
                <Group justify="space-between" mb={6}>
                  <Text size="sm" fw={700}>{bulkState.currentLabel}</Text>
                  <Text size="xs" c="dimmed">{bulkState.current}/{bulkState.total}</Text>
                </Group>
                <Progress value={progressValue} animated size="lg" radius="xl" />
              </div>
            )}

            {bulkState.failures.length > 0 && !bulkState.running && (
              <Alert color="orange" title="Rapport de traduction globale">
                <Stack gap={4}>
                  {bulkState.failures.map((failure) => (
                    <Text key={`${failure.item}-${failure.message}`} size="sm">
                      <strong>{failure.item}</strong> — {failure.message}
                    </Text>
                  ))}
                </Stack>
              </Alert>
            )}

            <Group>
              <Button
                onClick={translateWholeSite}
                loading={bulkState.running}
                disabled={working || !catalog.length}
                className="admin-translation-bulk-button"
              >
                Traduire tout le site
              </Button>
              <Text size="xs" c="dimmed">
                {onlyMissingOrStale
                  ? `${catalog.filter((item) => !isCatalogItemComplete(item)).length} contenu(s) à traiter`
                  : `${catalog.length} contenu(s) seront retraduits`}
              </Text>
            </Group>
          </Stack>
        </Card>

        <Tabs value={activeType} onChange={changeContentType} className="admin-translation-tabs">
          <Tabs.List grow>
            {CONTENT_TABS.map((tab) => (
              <Tabs.Tab key={tab.value} value={tab.value}>
                <span className="admin-translation-tab-symbol" aria-hidden="true">{tab.symbol}</span>
                <span>{tab.label}</span>
                <Badge size="xs" variant="light">{catalogByType[tab.value]?.length ?? 0}</Badge>
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {CONTENT_TABS.map((tab) => {
            const items = catalogByType[tab.value] ?? [];
            return (
              <Tabs.Panel key={tab.value} value={tab.value} pt="lg">
                <div className="admin-translation-workspace">
                  <aside className="admin-translation-entities" aria-label={`Liste des ${tab.label.toLowerCase()}`}>
                    <div className="admin-translation-entities-heading">
                      <Text size="xs" fw={900} tt="uppercase" c="dimmed">{tab.label}</Text>
                      <Text size="xs" c="dimmed">Sélectionne un {tab.singular}</Text>
                    </div>

                    <div className="admin-translation-entity-list">
                      {items.map((item) => {
                        const value = entryValue(item);
                        const selectedItem = value === selectedValue;
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`admin-translation-entity${selectedItem ? " is-selected" : ""}`}
                            onClick={() => selectCatalogItem(item)}
                            aria-current={selectedItem ? "true" : undefined}
                            disabled={bulkState.running}
                          >
                            <span className="admin-translation-entity-copy">
                              <strong>{item.label}</strong>
                              <small>{item.translatedFieldCount}/{item.sourceFieldCount} champs</small>
                            </span>
                            <Badge color={statusColor(item)} variant="light" size="sm">
                              {statusLabel(item)}
                            </Badge>
                          </button>
                        );
                      })}

                      {items.length === 0 && (
                        <Text size="sm" c="dimmed" p="md">Aucun contenu dans cette catégorie.</Text>
                      )}
                    </div>
                  </aside>

                  <section className="admin-translation-editor" aria-live="polite">
                    {bundleLoading && <Group justify="center" py="xl"><Loader size="sm" /></Group>}

                    {!bundleLoading && !bundle && (
                      <div className="admin-translation-empty">
                        <Text fw={800}>Sélectionne un contenu dans la liste.</Text>
                        <Text size="sm" c="dimmed">La source française et la version anglaise apparaîtront ici.</Text>
                      </div>
                    )}

                    {bundle && !bundleLoading && (
                      <Stack gap="lg">
                        <Group justify="space-between" align="flex-start" wrap="wrap">
                          <div>
                            <Text size="xs" fw={900} tt="uppercase" c="cyan.8">{bundle.contentType}</Text>
                            <Title order={4}>{bundle.label}</Title>
                          </div>
                          <Group gap="xs">
                            <Badge color={bundle.status === "PUBLISHED" ? "green" : "yellow"}>{bundle.status}</Badge>
                            {bundle.staleFields?.length > 0 && (
                              <Badge color="orange">{bundle.staleFields.length} champ(s) à retraduire</Badge>
                            )}
                          </Group>
                        </Group>

                        <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                          <Card withBorder radius="lg" padding="lg" className="admin-translation-source-card">
                            <Stack gap="md">
                              <Title order={5}>Source française</Title>
                              {Object.entries(bundle.sourceFields ?? {}).map(([field, value]) => (
                                <Textarea
                                  key={`source-${field}`}
                                  label={fieldLabel(field)}
                                  value={value}
                                  readOnly
                                  autosize
                                  minRows={2}
                                />
                              ))}
                            </Stack>
                          </Card>

                          <Card withBorder radius="lg" padding="lg" className="admin-translation-target-card">
                            <Stack gap="md">
                              <Title order={5}>Version anglaise</Title>
                              {Object.keys(bundle.sourceFields ?? {}).map((field) => (
                                <Textarea
                                  key={`target-${field}`}
                                  label={fieldLabel(field)}
                                  value={draft[field] ?? ""}
                                  onChange={(event) => setDraft((current) => ({
                                    ...current,
                                    [field]: event.currentTarget.value,
                                  }))}
                                  autosize
                                  minRows={2}
                                />
                              ))}
                            </Stack>
                          </Card>
                        </SimpleGrid>

                        <Group>
                          <Button onClick={runPreview} loading={working} disabled={bulkState.running} variant="light">
                            Traduire automatiquement
                          </Button>
                          <Button onClick={() => persist("DRAFT")} loading={working} disabled={bulkState.running} variant="outline">
                            Enregistrer le brouillon
                          </Button>
                          <Button onClick={() => persist("PUBLISHED")} loading={working} disabled={bulkState.running}>
                            Publier la traduction
                          </Button>
                        </Group>
                      </Stack>
                    )}
                  </section>
                </div>
              </Tabs.Panel>
            );
          })}
        </Tabs>
      </Stack>
    </TabsPanelShell>
  );
}

function TabsPanelShell({ children }) {
  return <div className="admin-translation-panel">{children}</div>;
}
