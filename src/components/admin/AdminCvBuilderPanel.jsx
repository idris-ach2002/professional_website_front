import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { FilePreviewButton } from "../FilePreview";
import {
  buildCvAssetsPayload,
  contactTypeOptions,
  cvContentSections,
  cvSectionDefinitions,
  cvTargetPresets,
  inferSchoolDefaults,
  safeCvAssetFilename,
  toCsv,
} from "./adminCore";

export default function AdminCvBuilderPanel(props) {
  const {
    cvDocument,
    cvSelectedItems,
    updateCvProfileField,
    importCvProfilePhoto,
    getCvDragProps,
    toggleCvItem,
    moveCvEditorItem,
    moveCvEditorItemTo,
    duplicateCvItem,
    removeCvItem,
    updateCvItem,
    updateCvItemCsv,
    importCvEducationLogo,
    cvSelectedSection,
    setCvSelectedSection,
    addCvItem,
    sortCvItems,
    cvActiveEditorTab,
    setCvActiveEditorTab,
    toggleCvSection,
    updateCvSettingsField,
    cvQualitySummary,
    cvTemplateLocked,
    updateTemplateLock,
    toggleReduceCvDescriptions,
    updateCvSectionColumn,
    runCvQualityCheck,
    runBackendCvQualityCheck,
    cvVariantName,
    setCvVariantName,
    cvVariants,
    selectedCvVariantId,
    setSelectedCvVariantId,
    createCvVariantSnapshot,
    saveCurrentCvVariant,
    loadCvVariant,
    deleteCvVariant,
    compareCvVariant,
    cvDiffReport,
    cvPresetName,
    setCvPresetName,
    saveCvCommandPreset,
    cvCommandPresets,
    applyCvCommandPreset,
    cvOfferText,
    setCvOfferText,
    analyzeCvOffer,
    cvOfferAnalysis,
    applyCvTargetPreset,
    applyOfferRecommendations,
    compactCvOnOnePage,
    adjustCvSpacing,
    resetCvEditorFromData,
    smartCompactAndPreview,
    startAsyncCvPreview,
    exportCvReproducibleZip,
    generateLatexFromCvDocument,
    generateCvLatexSource,
    previewGeneratedCv,
    saveGeneratedCvToVersion,
    selectedOwnerId,
    selectedVersionId,
    cvLatexSource,
    setCvLatexSource,
    cvManualLatexDirty,
    setCvManualLatexDirty,
    cvCompileStatusLabel,
    cvCompileStatusColor,
    cvCompileWarnings,
    cvAsyncJob,
    cvCurrentPdfUrl,
    cvExportZipUrl,
    cvRegressionReport,
    setCvRegressionReport,
    cvCanUndo,
    undoCvCommand,
    cvCanRedo,
    redoCvCommand,
    cvEditorState,
    cvCompileLogs
  } = props;

  function renderCvProfileEditor() {
    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <TextInput label="Nom affiché" value={cvDocument.profile.fullName} onChange={(event) => updateCvProfileField("fullName", event.currentTarget.value)} />
          <TextInput label="Titre CV" value={cvDocument.profile.title} onChange={(event) => updateCvProfileField("title", event.currentTarget.value)} />
          <TextInput label="Sous-titre" value={cvDocument.profile.subtitle} onChange={(event) => updateCvProfileField("subtitle", event.currentTarget.value)} />
          <TextInput label="Localisation" value={cvDocument.profile.location} onChange={(event) => updateCvProfileField("location", event.currentTarget.value)} />
        </SimpleGrid>
        <Textarea label="Phrase d’accroche" minRows={3} value={cvDocument.profile.headline} onChange={(event) => updateCvProfileField("headline", event.currentTarget.value)} />
        <Textarea label="Description" minRows={4} value={cvDocument.profile.description} onChange={(event) => updateCvProfileField("description", event.currentTarget.value)} />
        <TextInput label="Âge / tag header" value={cvDocument.profile.availability} onChange={(event) => updateCvProfileField("availability", event.currentTarget.value)} />
        <Paper withBorder radius="lg" p="md" className="cv-asset-import-card">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={800}>Photo du CV</Text>
                <Text size="xs" c="dimmed">Importée dans la compilation LaTeX sous le nom <code>{cvDocument.profile.photoFilename || "idris.jpg"}</code>.</Text>
              </div>
              {cvDocument.profile.photoDataUrl ? <Badge color="green" variant="light">photo chargée</Badge> : <Badge color="gray" variant="light">placeholder</Badge>}
            </Group>
            <FileInput
              label="Importer la photo ronde du header"
              placeholder="idris.jpg / png"
              accept="image/png,image/jpeg"
              clearable
              onChange={importCvProfilePhoto}
            />
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              <TextInput label="Nom fichier LaTeX" value={cvDocument.profile.photoFilename ?? "idris.jpg"} onChange={(event) => updateCvProfileField("photoFilename", safeCvAssetFilename(event.currentTarget.value, "idris.jpg"))} />
              <TextInput label="MIME" value={cvDocument.profile.photoMimeType ?? "image/jpeg"} onChange={(event) => updateCvProfileField("photoMimeType", event.currentTarget.value)} />
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  function renderCvSimpleItemEditor(item, sectionKey) {
    const isLanguage = sectionKey === "languages";
    const isContact = sectionKey === "contacts";

    return (
      <Card key={item.id} withBorder radius="lg" className={item.enabled === false ? "cv-editor-muted-item" : ""} {...getCvDragProps(sectionKey, item.id)}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Switch
              label={item.enabled === false ? "Masqué" : "Visible"}
              checked={item.enabled !== false}
              onChange={(event) => toggleCvItem(sectionKey, item.id, event.currentTarget.checked)}
            />
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, -1)}>↑</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, 1)}>↓</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "first")}>1er</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "last")}>Dernier</Button>
              <Button size="xs" variant="light" onClick={() => duplicateCvItem(sectionKey, item.id)}>Dupliquer</Button>
              <Button size="xs" color="red" variant="subtle" onClick={() => removeCvItem(sectionKey, item.id)}>Supprimer</Button>
            </Group>
          </Group>

          {isContact ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              <Select
                label="Type"
                data={contactTypeOptions}
                value={item.type ?? "WEBSITE"}
                onChange={(value) => updateCvItem(sectionKey, item.id, "type", value ?? "WEBSITE")}
              />
              <TextInput label="Valeur" value={item.value ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "value", event.currentTarget.value)} />
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 1, md: isLanguage ? 2 : 1 }} spacing="sm">
              <TextInput label={isLanguage ? "Langue" : "Libellé"} value={item.label ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "label", event.currentTarget.value)} />
              {isLanguage && (
                <TextInput label="Niveau" value={item.level ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "level", event.currentTarget.value)} />
              )}
            </SimpleGrid>
          )}
        </Stack>
      </Card>
    );
  }

  function renderCvExperienceEditor(item, sectionKey) {
    return (
      <Card key={item.id} withBorder radius="lg" className={item.enabled === false ? "cv-editor-muted-item" : ""} {...getCvDragProps(sectionKey, item.id)}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>{item.title || "Bloc sans titre"}</Text>
              <Text size="xs" c="dimmed">{item.organization || item.subtitle || "À compléter"}</Text>
            </div>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, -1)}>↑</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem(sectionKey, item.id, 1)}>↓</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "first")}>1er</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo(sectionKey, item.id, "last")}>Dernier</Button>
              <Button size="xs" variant="light" onClick={() => duplicateCvItem(sectionKey, item.id)}>Dupliquer</Button>
              <Button size="xs" color="red" variant="subtle" onClick={() => removeCvItem(sectionKey, item.id)}>Supprimer</Button>
            </Group>
          </Group>

          <Switch
            label={item.enabled === false ? "Masqué du CV" : "Visible dans le CV"}
            checked={item.enabled !== false}
            onChange={(event) => toggleCvItem(sectionKey, item.id, event.currentTarget.checked)}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            <TextInput label="Titre" value={item.title ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "title", event.currentTarget.value)} />
            <TextInput label="Organisation" value={item.organization ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "organization", event.currentTarget.value)} />
            <TextInput label="Lieu" value={item.location ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "location", event.currentTarget.value)} />
            <TextInput label="Compétences CSV" value={toCsv(item.skills)} onChange={(event) => updateCvItemCsv(sectionKey, item.id, "skills", event.currentTarget.value)} />
            <TextInput label="Date début" value={item.startDate ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "startDate", event.currentTarget.value)} />
            <TextInput label="Date fin" value={item.endDate ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "endDate", event.currentTarget.value)} />
          </SimpleGrid>
          <Switch
            label="Poste / formation en cours"
            checked={Boolean(item.currentPosition)}
            onChange={(event) => updateCvItem(sectionKey, item.id, "currentPosition", event.currentTarget.checked)}
          />

          {sectionKey === "education" && (
            <Paper withBorder radius="lg" p="md" className="cv-asset-import-card">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={800}>Logo formation</Text>
                    <Text size="xs" c="dimmed">Même structure que ton bloc LaTeX <code>{"\\schoollogo"}</code>.</Text>
                  </div>
                  {item.logoDataUrl ? <Badge color="green" variant="light">logo chargé</Badge> : <Badge color="gray" variant="light">fallback LaTeX</Badge>}
                </Group>
                <FileInput
                  label="Importer le logo de l’université / école"
                  placeholder={item.logoFilename || inferSchoolDefaults(item, 0).logoFilename}
                  accept="image/png,image/jpeg"
                  clearable
                  onChange={(file) => importCvEducationLogo(item, file)}
                />
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                  <TextInput label="Code badge" value={item.schoolCode ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "schoolCode", event.currentTarget.value)} />
                  <TextInput label="Nom fichier LaTeX" value={item.logoFilename ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "logoFilename", safeCvAssetFilename(event.currentTarget.value, inferSchoolDefaults(item, 0).logoFilename))} />
                  <TextInput label="Taille logo" value={item.logoSize ?? inferSchoolDefaults(item, 0).logoSize} onChange={(event) => updateCvItem(sectionKey, item.id, "logoSize", event.currentTarget.value)} />
                  <TextInput label="MIME logo" value={item.logoMimeType ?? "image/png"} onChange={(event) => updateCvItem(sectionKey, item.id, "logoMimeType", event.currentTarget.value)} />
                  <TextInput label="Lien parcours officiel" value={item.officialUrl ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "officialUrl", event.currentTarget.value)} />
                  <TextInput label="Lien maquette / programme" value={item.programUrl ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "programUrl", event.currentTarget.value)} />
                </SimpleGrid>
              </Stack>
            </Paper>
          )}

          <Textarea label="Résumé" minRows={2} value={item.summary ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "summary", event.currentTarget.value)} />
          <Textarea label="Description" minRows={3} value={item.description ?? ""} onChange={(event) => updateCvItem(sectionKey, item.id, "description", event.currentTarget.value)} />
        </Stack>
      </Card>
    );
  }

  function renderCvProjectEditor(item) {
    return (
      <Card key={item.id} withBorder radius="lg" className={item.enabled === false ? "cv-editor-muted-item" : ""} {...getCvDragProps("projects", item.id)}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>{item.title || "Projet sans titre"}</Text>
              <Text size="xs" c="dimmed">{item.subtitle || toCsv(item.stacks) || "À compléter"}</Text>
            </div>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem("projects", item.id, -1)}>↑</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItem("projects", item.id, 1)}>↓</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo("projects", item.id, "first")}>1er</Button>
              <Button size="xs" variant="subtle" onClick={() => moveCvEditorItemTo("projects", item.id, "last")}>Dernier</Button>
              <Button size="xs" variant="light" onClick={() => duplicateCvItem("projects", item.id)}>Dupliquer</Button>
              <Button size="xs" color="red" variant="subtle" onClick={() => removeCvItem("projects", item.id)}>Supprimer</Button>
            </Group>
          </Group>

          <Switch
            label={item.enabled === false ? "Masqué du CV" : "Visible dans le CV"}
            checked={item.enabled !== false}
            onChange={(event) => toggleCvItem("projects", item.id, event.currentTarget.checked)}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            <TextInput label="Titre" value={item.title ?? ""} onChange={(event) => updateCvItem("projects", item.id, "title", event.currentTarget.value)} />
            <TextInput label="Sous-titre" value={item.subtitle ?? ""} onChange={(event) => updateCvItem("projects", item.id, "subtitle", event.currentTarget.value)} />
            <TextInput label="Stacks CSV" value={toCsv(item.stacks)} onChange={(event) => updateCvItemCsv("projects", item.id, "stacks", event.currentTarget.value)} />
            <TextInput label="Fonctionnalités CSV" value={toCsv(item.features)} onChange={(event) => updateCvItemCsv("projects", item.id, "features", event.currentTarget.value)} />
          </SimpleGrid>
          <Textarea label="Résumé court" minRows={2} value={item.shortDescription ?? ""} onChange={(event) => updateCvItem("projects", item.id, "shortDescription", event.currentTarget.value)} />
          <Textarea label="Description" minRows={3} value={item.description ?? ""} onChange={(event) => updateCvItem("projects", item.id, "description", event.currentTarget.value)} />
        </Stack>
      </Card>
    );
  }

  function renderCvSelectedContentEditor() {
    if (cvSelectedSection === "profile") return renderCvProfileEditor();

    if (["skills", "languages", "qualities", "contacts"].includes(cvSelectedSection)) {
      return (
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={800}>{cvContentSections.find((section) => section.value === cvSelectedSection)?.label}</Text>
            <Button size="xs" variant="light" onClick={() => addCvItem(cvSelectedSection)}>Ajouter</Button>
          </Group>
          {cvSelectedItems.length > 0 ? cvSelectedItems.map((item) => renderCvSimpleItemEditor(item, cvSelectedSection)) : (
            <Alert color="gray" variant="light">Aucun élément dans cette section.</Alert>
          )}
        </Stack>
      );
    }

    if (["experiences", "education"].includes(cvSelectedSection)) {
      return (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={800}>{cvContentSections.find((section) => section.value === cvSelectedSection)?.label}</Text>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => sortCvItems(cvSelectedSection, "date")}>Date</Button>
              <Button size="xs" variant="subtle" onClick={() => sortCvItems(cvSelectedSection, "relevance")}>Pertinence</Button>
              <Button size="xs" variant="light" onClick={() => addCvItem(cvSelectedSection)}>Ajouter</Button>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">Glisse-dépose les cartes pour réordonner manuellement.</Text>
          {cvSelectedItems.length > 0 ? cvSelectedItems.map((item) => renderCvExperienceEditor(item, cvSelectedSection)) : (
            <Alert color="gray" variant="light">Aucun bloc à éditer.</Alert>
          )}
        </Stack>
      );
    }

    if (cvSelectedSection === "projects") {
      return (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={800}>Projets</Text>
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => sortCvItems("projects", "date")}>Date</Button>
              <Button size="xs" variant="subtle" onClick={() => sortCvItems("projects", "relevance")}>Pertinence</Button>
              <Button size="xs" variant="light" onClick={() => addCvItem("projects")}>Ajouter</Button>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">Glisse-dépose les cartes pour réordonner manuellement.</Text>
          {cvSelectedItems.length > 0 ? cvSelectedItems.map(renderCvProjectEditor) : (
            <Alert color="gray" variant="light">Aucun projet à éditer.</Alert>
          )}
        </Stack>
      );
    }

    return null;
  }
  return (
            <Tabs.Panel value="cv" pt="lg">
              <Stack gap="lg">
                <Paper withBorder p="lg" radius="xl" className="cv-builder-photoshop-shell">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Group gap="xs" align="center">
                          <Text fw={900}>CV Studio</Text>
                          <Badge variant="light">Command Pattern</Badge>
                          <Badge color={cvCompileStatusColor} variant="light">{cvCompileStatusLabel}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          Éditeur visuel type Photoshop : commandes, contenu, style, layout, LaTeX, preview PDF et historique undo/redo.
                        </Text>
                      </div>

                      <Group gap="xs" justify="flex-end">
                        <Button size="xs" variant="light" disabled={!cvCanUndo} onClick={undoCvCommand}>Annuler</Button>
                        <Button size="xs" variant="light" disabled={!cvCanRedo} onClick={redoCvCommand}>Rétablir</Button>
                        <Button size="xs" variant="subtle" onClick={() => resetCvEditorFromData()}>Reset portfolio</Button>
                        <Button size="xs" variant="light" onClick={generateLatexFromCvDocument}>Générer LaTeX</Button>
                        <Button size="xs" variant="subtle" onClick={generateCvLatexSource} disabled={!selectedOwnerId || !selectedVersionId}>Recharger modèle</Button>
                        <Button size="xs" onClick={previewGeneratedCv} disabled={!selectedOwnerId || !selectedVersionId}>Compiler preview</Button>
                        <Button size="xs" color="green" onClick={saveGeneratedCvToVersion} disabled={!selectedOwnerId || !selectedVersionId}>Sauvegarder CV</Button>
                      </Group>
                    </Group>

                    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                      <Paper withBorder p="md" radius="lg" className="cv-command-panel">
                        <Tabs value={cvActiveEditorTab} onChange={(value) => setCvActiveEditorTab(value ?? "content")}>
                          <Tabs.List grow>
                            <Tabs.Tab value="content">Contenu</Tabs.Tab>
                            <Tabs.Tab value="sections">Sections</Tabs.Tab>
                            <Tabs.Tab value="style">Style</Tabs.Tab>
                            <Tabs.Tab value="typography">Typo</Tabs.Tab>
                            <Tabs.Tab value="layout">Layout</Tabs.Tab>
                            <Tabs.Tab value="assets">Assets</Tabs.Tab>
                            <Tabs.Tab value="quality">Qualité</Tabs.Tab>
                            <Tabs.Tab value="variants">Variantes</Tabs.Tab>
                            <Tabs.Tab value="offer">Offre</Tabs.Tab>
                            <Tabs.Tab value="advanced">Avancé</Tabs.Tab>
                            <Tabs.Tab value="latex">LaTeX</Tabs.Tab>
                            <Tabs.Tab value="history">Historique</Tabs.Tab>
                          </Tabs.List>

                          <Tabs.Panel value="content" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between" align="center">
                                <Select
                                  label="Bloc à éditer"
                                  data={cvContentSections}
                                  value={cvSelectedSection}
                                  onChange={(value) => setCvSelectedSection(value ?? "profile")}
                                  className="cv-section-selector"
                                />
                                <Badge variant="light">
                                  {cvSelectedSection === "profile" ? "1 bloc" : `${cvSelectedItems.filter((item) => item.enabled !== false).length}/${cvSelectedItems.length} visibles`}
                                </Badge>
                              </Group>
                              {renderCvSelectedContentEditor()}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="sections" pt="md">
                            <Stack gap="md">
                              <Text fw={800}>Visibilité des sections</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                {cvSectionDefinitions.map((section) => (
                                  <Switch
                                    key={section.key}
                                    label={section.label}
                                    checked={Boolean(cvDocument.sections?.[section.key])}
                                    onChange={(event) => toggleCvSection(section.key, event.currentTarget.checked)}
                                  />
                                ))}
                              </SimpleGrid>
                              <Divider />
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <NumberInput label="Limite projets" min={1} max={12} value={cvDocument.settings.projectLimit} onChange={(value) => updateCvSettingsField("projectLimit", value ?? 4)} />
                                <NumberInput label="Limite expériences" min={1} max={10} value={cvDocument.settings.experienceLimit} onChange={(value) => updateCvSettingsField("experienceLimit", value ?? 2)} />
                                <NumberInput label="Limite compétences" min={4} max={40} value={cvDocument.settings.skillsLimit} onChange={(value) => updateCvSettingsField("skillsLimit", value ?? 16)} />
                                <NumberInput label="Bullets par projet / expérience" min={1} max={8} value={cvDocument.settings.featuresLimit} onChange={(value) => updateCvSettingsField("featuresLimit", value ?? 4)} />
                              </SimpleGrid>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="style" pt="md">
                            <Stack gap="md">
                              <Text fw={800}>Style global du modèle LaTeX conservé</Text>
                              <Text size="sm" c="dimmed">
                                Ces commandes ne reconstruisent pas un nouveau CV : elles modifient les variables du modèle LaTeX fait à la main.
                              </Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput label="Couleur principale" value={cvDocument.settings.primaryColor} onChange={(event) => updateCvSettingsField("primaryColor", event.currentTarget.value)} />
                                <TextInput label="Couleur secondaire" value={cvDocument.settings.secondaryColor} onChange={(event) => updateCvSettingsField("secondaryColor", event.currentTarget.value)} />
                                <Select
                                  label="Densité"
                                  data={[{ value: "compact", label: "Compact" }, { value: "detailed", label: "Détaillé" }]}
                                  value={cvDocument.settings.density}
                                  onChange={(value) => updateCvSettingsField("density", value ?? "compact")}
                                />
                                <Select
                                  label="Langue"
                                  data={[{ value: "fr", label: "Français" }, { value: "en", label: "Anglais" }]}
                                  value={cvDocument.settings.language}
                                  onChange={(value) => updateCvSettingsField("language", value ?? "fr")}
                                />
                                <NumberInput label="Échelle globale" min={0.86} max={1.12} step={0.01} value={cvDocument.settings.fontScale} onChange={(value) => updateCvSettingsField("fontScale", value ?? 1)} />
                                <NumberInput label="Taille contenu global" min={8.5} max={13.5} step={0.1} value={cvDocument.settings.globalContentSize} onChange={(value) => updateCvSettingsField("globalContentSize", value ?? 11)} />
                              </SimpleGrid>
                              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                <Switch label="Photo" checked={Boolean(cvDocument.settings.showPhoto)} onChange={(event) => updateCvSettingsField("showPhoto", event.currentTarget.checked)} />
                                <Switch label="Icônes" checked={Boolean(cvDocument.settings.showIcons)} onChange={(event) => updateCvSettingsField("showIcons", event.currentTarget.checked)} />
                                <Switch label="Liens soulignés" checked={Boolean(cvDocument.settings.underlineLinks)} onChange={(event) => updateCvSettingsField("underlineLinks", event.currentTarget.checked)} />
                              </SimpleGrid>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="typography" pt="md">
                            <Stack gap="lg">
                              <div>
                                <Text fw={800}>Typographie précise par zone</Text>
                                <Text size="sm" c="dimmed">Commandes de taille de police comme dans un éditeur visuel : header, sections, textes, sous-titres et liens.</Text>
                              </div>
                              <Paper withBorder p="md" radius="lg" className="cv-typography-group">
                                <Text fw={800} mb="xs">Header</Text>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                  <NumberInput label="Nom" min={16} max={30} step={0.1} value={cvDocument.settings.headerNameSize} onChange={(value) => updateCvSettingsField("headerNameSize", value ?? 24)} />
                                  <NumberInput label="Titre" min={10} max={22} step={0.1} value={cvDocument.settings.headerTitleSize} onChange={(value) => updateCvSettingsField("headerTitleSize", value ?? 15.2)} />
                                  <NumberInput label="Accroche" min={8} max={14} step={0.1} value={cvDocument.settings.headerHeadlineSize} onChange={(value) => updateCvSettingsField("headerHeadlineSize", value ?? 10)} />
                                  <NumberInput label="Contacts header" min={8} max={14} step={0.1} value={cvDocument.settings.headerContactSize} onChange={(value) => updateCvSettingsField("headerContactSize", value ?? 10)} />
                                </SimpleGrid>
                              </Paper>
                              <Paper withBorder p="md" radius="lg" className="cv-typography-group">
                                <Text fw={800} mb="xs">Sections</Text>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                  <NumberInput label="Titre de section" min={11} max={22} step={0.1} value={cvDocument.settings.sectionTitleSize} onChange={(value) => updateCvSettingsField("sectionTitleSize", value ?? 16.3)} />
                                  <NumberInput label="Sous-titres / métas" min={8} max={14} step={0.1} value={cvDocument.settings.sectionSubtitleSize} onChange={(value) => updateCvSettingsField("sectionSubtitleSize", value ?? 10)} />
                                  <NumberInput label="Texte de section" min={8} max={14} step={0.1} value={cvDocument.settings.sectionTextSize} onChange={(value) => updateCvSettingsField("sectionTextSize", value ?? 11)} />
                                  <NumberInput label="Liens / preuves" min={7} max={13} step={0.1} value={cvDocument.settings.sectionLinkSize} onChange={(value) => updateCvSettingsField("sectionLinkSize", value ?? 9.24)} />
                                </SimpleGrid>
                              </Paper>
                              <Paper withBorder p="md" radius="lg" className="cv-typography-group">
                                <Text fw={800} mb="xs">Expériences et projets</Text>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                  <NumberInput label="Titre expérience" min={8} max={16} step={0.1} value={cvDocument.settings.experienceTitleSize} onChange={(value) => updateCvSettingsField("experienceTitleSize", value ?? 12)} />
                                  <NumberInput label="Texte expérience" min={8} max={14} step={0.1} value={cvDocument.settings.experienceTextSize} onChange={(value) => updateCvSettingsField("experienceTextSize", value ?? 11)} />
                                  <NumberInput label="Titre projet" min={8} max={16} step={0.1} value={cvDocument.settings.projectTitleSize} onChange={(value) => updateCvSettingsField("projectTitleSize", value ?? 12)} />
                                  <NumberInput label="Texte projet" min={8} max={14} step={0.1} value={cvDocument.settings.projectTextSize} onChange={(value) => updateCvSettingsField("projectTextSize", value ?? 11)} />
                                  <NumberInput label="Liens projet" min={7} max={13} step={0.1} value={cvDocument.settings.projectLinkSize} onChange={(value) => updateCvSettingsField("projectLinkSize", value ?? 10)} />
                                  <NumberInput label="Texte formation" min={8} max={14} step={0.1} value={cvDocument.settings.educationTextSize} onChange={(value) => updateCvSettingsField("educationTextSize", value ?? 10)} />
                                </SimpleGrid>
                              </Paper>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="layout" pt="md">
                            <Stack gap="lg">
                              <div>
                                <Text fw={800}>Mise en page contrôlée</Text>
                                <Text size="sm" c="dimmed">Structure, espacement, limites et bascule colonne gauche / droite sans casser le modèle LaTeX.</Text>
                              </div>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <Select
                                  label="Structure"
                                  data={[{ value: "two-column", label: "Deux colonnes" }, { value: "one-column", label: "Une colonne" }]}
                                  value={cvDocument.settings.layout}
                                  onChange={(value) => updateCvSettingsField("layout", value ?? "two-column")}
                                />
                                <NumberInput label="Largeur colonne gauche" min={25} max={45} step={0.1} value={cvDocument.settings.leftColumnWidth} onChange={(value) => updateCvSettingsField("leftColumnWidth", value ?? 33.8)} />
                                <NumberInput label="Scale contenu" min={0.68} max={0.9} step={0.01} value={cvDocument.settings.contentScale} onChange={(value) => updateCvSettingsField("contentScale", value ?? 0.74)} />
                                <NumberInput label="Padding header" min={6} max={22} step={0.5} value={cvDocument.settings.headerPadding} onChange={(value) => updateCvSettingsField("headerPadding", value ?? 12)} />
                              </SimpleGrid>
                              <Group>
                                <Button variant="light" onClick={compactCvOnOnePage}>Compacter sur une page</Button>
                                <Button variant="subtle" onClick={() => updateCvSettingsField("density", "detailed")}>Rendu détaillé</Button>
                                <Button variant="subtle" onClick={() => adjustCvSpacing(0.12)}>Augmenter l’espacement</Button>
                                <Button variant="subtle" onClick={() => adjustCvSpacing(-0.12)}>Réduire l’espacement</Button>
                                <Button variant={cvDocument.settings.reduceDescriptions ? "filled" : "light"} onClick={toggleReduceCvDescriptions}>Réduire descriptions longues</Button>
                              </Group>
                              <Divider />
                              <Text fw={800}>Limiter les contenus</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <NumberInput label="Limiter projets à N" min={1} max={12} value={cvDocument.settings.projectLimit} onChange={(value) => updateCvSettingsField("projectLimit", value ?? 4)} />
                                <NumberInput label="Limiter expériences à N" min={1} max={10} value={cvDocument.settings.experienceLimit} onChange={(value) => updateCvSettingsField("experienceLimit", value ?? 2)} />
                                <NumberInput label="Limiter compétences à N" min={4} max={40} value={cvDocument.settings.skillsLimit} onChange={(value) => updateCvSettingsField("skillsLimit", value ?? 16)} />
                                <NumberInput label="Bullets par bloc" min={1} max={8} value={cvDocument.settings.featuresLimit} onChange={(value) => updateCvSettingsField("featuresLimit", value ?? 4)} />
                              </SimpleGrid>
                              <Divider />
                              <Text fw={800}>Basculer les sections gauche / droite</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                {["languages", "skills", "qualities", "experiences", "projects", "education"].map((sectionKey) => (
                                  <Select
                                    key={sectionKey}
                                    label={cvSectionDefinitions.find((section) => section.key === sectionKey)?.label ?? sectionKey}
                                    data={[{ value: "left", label: "Colonne gauche" }, { value: "right", label: "Colonne droite" }]}
                                    value={cvDocument.settings.sectionColumns?.[sectionKey] ?? "right"}
                                    onChange={(value) => updateCvSectionColumn(sectionKey, value ?? "right")}
                                  />
                                ))}
                              </SimpleGrid>
                              <Divider />
                              <Text fw={800}>Adaptations rapides candidature</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                {cvTargetPresets.map((preset) => (
                                  <Button key={preset.key} variant="light" onClick={() => applyCvTargetPreset(preset)}>
                                    Mode {preset.label}
                                  </Button>
                                ))}
                              </SimpleGrid>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="assets" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Asset Manager CV</Text>
                                  <Text size="sm" c="dimmed">Photo, logos de formation et assets envoyés au backend pour une compilation LaTeX reproductible.</Text>
                                </div>
                                <Badge variant="light">{buildCvAssetsPayload(cvDocument).length} asset(s)</Badge>
                              </Group>
                              <Paper withBorder radius="lg" p="md" className="cv-asset-card">
                                <Group justify="space-between" align="flex-start">
                                  <div>
                                    <Text fw={800}>Photo du header</Text>
                                    <Text size="xs" c="dimmed">Fichier LaTeX : {cvDocument.profile.photoFilename || "idris.jpg"}</Text>
                                  </div>
                                  {cvDocument.profile.photoDataUrl ? <Badge color="green" variant="light">chargée</Badge> : <Badge color="yellow" variant="light">placeholder</Badge>}
                                </Group>
                                {cvDocument.profile.photoDataUrl && <img className="cv-asset-preview" src={cvDocument.profile.photoDataUrl} alt="Photo CV" />}
                                <FileInput mt="sm" label="Remplacer la photo" accept="image/png,image/jpeg,image/webp" onChange={importCvProfilePhoto} />
                              </Paper>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                {cvDocument.education.map((item, index) => (
                                  <Paper key={item.id} withBorder radius="lg" p="md" className="cv-asset-card">
                                    <Group justify="space-between" align="flex-start">
                                      <div>
                                        <Text fw={800}>{item.title}</Text>
                                        <Text size="xs" c="dimmed">{safeCvAssetFilename(item.logoFilename, inferSchoolDefaults(item, index).logoFilename)}</Text>
                                      </div>
                                      {item.logoDataUrl ? <Badge color="green" variant="light">logo chargé</Badge> : <Badge color="yellow" variant="light">placeholder</Badge>}
                                    </Group>
                                    {item.logoDataUrl && <img className="cv-asset-preview cv-asset-logo-preview" src={item.logoDataUrl} alt={item.organization || item.title} />}
                                    <FileInput mt="sm" label="Importer / remplacer le logo" accept="image/png,image/jpeg,image/webp" onChange={(file) => importCvEducationLogo(item, file)} />
                                  </Paper>
                                ))}
                              </SimpleGrid>
                              <Alert color="blue" variant="light">Le ZIP reproductible inclura main.tex, cv.pdf, compile.log, metadata.json et ces assets.</Alert>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="quality" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Contrôle qualité CV</Text>
                                  <Text size="sm" c="dimmed">Détection des risques de rendu, de contenu, d’assets manquants et de dépassement d’une page.</Text>
                                </div>
                                <Badge color={cvQualitySummary.score >= 80 ? "green" : cvQualitySummary.score >= 60 ? "yellow" : "red"} variant="light">Score {cvQualitySummary.score}/100</Badge>
                              </Group>
                              <Group>
                                <Button variant="light" onClick={runCvQualityCheck}>Analyser localement</Button>
                                <Button variant="subtle" onClick={runBackendCvQualityCheck} disabled={!selectedOwnerId || !selectedVersionId}>Analyse backend</Button>
                                <Button variant="light" onClick={smartCompactAndPreview}>Auto-compaction intelligente</Button>
                              </Group>
                              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                <Card withBorder radius="lg"><Text size="xs" c="dimmed">Pages estimées</Text><Text fw={900}>{cvQualitySummary.estimatedPages}</Text></Card>
                                <Card withBorder radius="lg"><Text size="xs" c="dimmed">Bloquants</Text><Text fw={900}>{cvQualitySummary.blockers?.length ?? 0}</Text></Card>
                                <Card withBorder radius="lg"><Text size="xs" c="dimmed">Alertes</Text><Text fw={900}>{cvQualitySummary.warnings?.length ?? 0}</Text></Card>
                              </SimpleGrid>
                              {[...(cvQualitySummary.blockers ?? []).map((text) => ["red", text]), ...(cvQualitySummary.warnings ?? []).map((text) => ["yellow", text]), ...(cvQualitySummary.suggestions ?? []).map((text) => ["blue", text])].map(([color, text], index) => (
                                <Alert key={`${color}-${index}`} color={color} variant="light">{text}</Alert>
                              ))}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="variants" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Variantes et historique applicatif</Text>
                                  <Text size="sm" c="dimmed">Sauvegarde locale de CV ciblés : Java Backend, offre spécifique, version compacte, etc.</Text>
                                </div>
                                <Badge variant="light">{cvVariants.length} variante(s)</Badge>
                              </Group>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput label="Nom de variante" value={cvVariantName} onChange={(event) => setCvVariantName(event.currentTarget.value)} />
                                <Select label="Variante existante" data={cvVariants.map((variant) => ({ value: variant.id, label: `${variant.name} · score ${variant.qualityScore ?? "?"}` }))} value={selectedCvVariantId} onChange={setSelectedCvVariantId} />
                              </SimpleGrid>
                              <Group>
                                <Button variant="light" onClick={() => createCvVariantSnapshot()}>Nouvelle variante</Button>
                                <Button variant="light" onClick={saveCurrentCvVariant}>Mettre à jour</Button>
                                <Button variant="subtle" onClick={() => loadCvVariant()} disabled={!selectedCvVariantId}>Charger</Button>
                                <Button variant="subtle" onClick={() => compareCvVariant()} disabled={!selectedCvVariantId}>Diff avec courant</Button>
                                <Button color="red" variant="light" onClick={() => deleteCvVariant()} disabled={!selectedCvVariantId}>Supprimer</Button>
                              </Group>
                              {cvDiffReport && (
                                <Paper withBorder radius="lg" p="md">
                                  <Text fw={800}>Diff avec {cvDiffReport.name}</Text>
                                  {cvDiffReport.changes.length > 0 ? cvDiffReport.changes.map((change, index) => (
                                    <Card key={`${change.label}-${index}`} withBorder radius="md" p="sm" mt="xs">
                                      <Text size="sm" fw={800}>{change.label}</Text>
                                      <Text size="xs" c="dimmed">{change.type}</Text>
                                    </Card>
                                  )) : <Alert color="green" variant="light" mt="sm">Aucune différence structurée détectée.</Alert>}
                                </Paper>
                              )}
                              <Divider />
                              <Text fw={800}>Presets de commandes</Text>
                              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput label="Nom du preset" value={cvPresetName} onChange={(event) => setCvPresetName(event.currentTarget.value)} />
                                <Button mt="xl" variant="light" onClick={saveCvCommandPreset}>Sauvegarder preset actuel</Button>
                              </SimpleGrid>
                              {cvCommandPresets.map((preset) => (
                                <Card key={preset.id} withBorder radius="md" p="sm">
                                  <Group justify="space-between">
                                    <Text fw={800}>{preset.name}</Text>
                                    <Button size="xs" variant="light" onClick={() => applyCvCommandPreset(preset)}>Appliquer</Button>
                                  </Group>
                                </Card>
                              ))}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="offer" pt="md">
                            <Stack gap="md">
                              <div>
                                <Text fw={800}>Analyse d’offre et adaptation par commandes</Text>
                                <Text size="sm" c="dimmed">Colle une offre : le Studio calcule un score, détecte les mots-clés manquants et applique des commandes structurées.</Text>
                              </div>
                              <Textarea minRows={8} label="Offre d’alternance" value={cvOfferText} onChange={(event) => setCvOfferText(event.currentTarget.value)} placeholder="Colle ici l'offre Java / Spring Boot / React / DevOps..." />
                              <Group>
                                <Button variant="light" onClick={analyzeCvOffer}>Analyser l’offre</Button>
                                <Button onClick={applyOfferRecommendations} disabled={!cvOfferText.trim()}>Appliquer les recommandations</Button>
                              </Group>
                              {cvOfferAnalysis && (
                                <Paper withBorder radius="lg" p="md">
                                  <Group justify="space-between"><Text fw={800}>Pertinence offre</Text><Badge color={cvOfferAnalysis.score >= 75 ? "green" : cvOfferAnalysis.score >= 45 ? "yellow" : "red"}>{cvOfferAnalysis.score}%</Badge></Group>
                                  <Text size="sm" mt="sm"><strong>Mots-clés trouvés :</strong> {cvOfferAnalysis.matched.join(", ") || "aucun"}</Text>
                                  <Text size="sm"><strong>Mots-clés manquants :</strong> {cvOfferAnalysis.missing.join(", ") || "aucun"}</Text>
                                  <Stack gap="xs" mt="sm">{cvOfferAnalysis.recommendations.map((item) => <Alert key={item} color="blue" variant="light">{item}</Alert>)}</Stack>
                                </Paper>
                              )}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="advanced" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Architecture avancée</Text>
                                  <Text size="sm" c="dimmed">Compilation asynchrone, cache backend, export ZIP reproductible et rapport de non-régression léger.</Text>
                                </div>
                                {cvAsyncJob && <Badge variant="light">{cvAsyncJob.status} · {cvAsyncJob.progress ?? 0}%</Badge>}
                              </Group>
                              <Group>
                                <Button variant="light" onClick={startAsyncCvPreview} disabled={!selectedOwnerId || !selectedVersionId}>Compiler en job asynchrone</Button>
                                <Button variant="light" onClick={exportCvReproducibleZip} disabled={!selectedOwnerId || !selectedVersionId}>Exporter ZIP reproductible</Button>
                                <Button variant="subtle" onClick={() => setCvRegressionReport({ status: "BASELINE", message: "Baseline locale enregistrée : compare les prochains rendus via les variantes et le score qualité." })}>Créer baseline visuelle</Button>
                              </Group>
                              {cvExportZipUrl && <Button component="a" href={cvExportZipUrl} target="_blank" rel="noreferrer" variant="filled">Télécharger le ZIP</Button>}
                              {cvAsyncJob && <Alert color={cvAsyncJob.status === "FAILED" ? "red" : cvAsyncJob.status === "SUCCESS" ? "green" : "blue"} variant="light">{cvAsyncJob.step || cvAsyncJob.message}</Alert>}
                              {cvRegressionReport && <Alert color="violet" variant="light">{cvRegressionReport.message}</Alert>}
                              <Alert color="gray" variant="light">Le backend garde un cache SHA-256 par source LaTeX + assets. Si tu recompiles le même CV, le PDF est réutilisé.</Alert>
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="latex" pt="md">
                            <Stack gap="sm">
                              <Group justify="space-between">
                                <div>
                                  <Text fw={800}>Source LaTeX générée</Text>
                                  <Text size="xs" c="dimmed">Tu peux encore éditer à la main avant compilation.</Text>
                                </div>
                                <Group gap="xs">
                                  <Badge variant="light">{Math.max(cvLatexSource.split("\n").length, 1)} lignes</Badge>
                                  {cvManualLatexDirty && <Badge color="yellow" variant="light">modifié à la main</Badge>}
                                  <Button size="xs" variant="light" onClick={generateLatexFromCvDocument}>Recalculer</Button>
                                </Group>
                              </Group>
                              <Switch
                                label="Template verrouillé : édition LaTeX directe désactivée"
                                checked={cvTemplateLocked}
                                onChange={(event) => updateTemplateLock(event.currentTarget.checked)}
                              />
                              <Textarea
                                className="cv-latex-editor"
                                minRows={22}
                                autosize={false}
                                readOnly={cvTemplateLocked}
                                value={cvLatexSource}
                                onChange={(event) => {
                                  if (cvTemplateLocked) return;
                                  setCvLatexSource(event.currentTarget.value);
                                  setCvManualLatexDirty(true);
                                }}
                              />
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="history" pt="md">
                            <Stack gap="md">
                              <Group justify="space-between">
                                <Text fw={800}>Historique des commandes</Text>
                                <Badge variant="light">{cvEditorState.past.length} undo · {cvEditorState.future.length} redo</Badge>
                              </Group>
                              {cvEditorState.commandLog.length > 0 ? cvEditorState.commandLog.map((command) => (
                                <Card key={command.id} withBorder radius="md" p="sm">
                                  <Group justify="space-between">
                                    <Text size="sm" fw={700}>{command.label}</Text>
                                    <Text size="xs" c="dimmed">{command.timestamp}</Text>
                                  </Group>
                                </Card>
                              )) : (
                                <Alert color="gray" variant="light">Aucune commande exécutée.</Alert>
                              )}
                              <Divider />
                              <Text fw={800}>Logs compilation</Text>
                              {cvCompileWarnings.length > 0 && (
                                <Alert color="yellow" variant="light">{cvCompileWarnings.join(" — ")}</Alert>
                              )}
                              <Textarea className="cv-logs-editor" minRows={12} autosize={false} readOnly value={cvCompileLogs} placeholder="Les logs latexmk / pdflatex apparaîtront ici." />
                            </Stack>
                          </Tabs.Panel>
                        </Tabs>
                      </Paper>

                      <Stack gap="lg">
                        <Paper withBorder p="lg" radius="lg" className="cv-live-preview-panel">
                          <Group justify="space-between" align="center" mb="md">
                            <div>
                              <Text fw={900}>Aperçu PDF</Text>
                              <Text size="sm" c="dimmed">Compile le LaTeX pour rafraîchir le rendu final.</Text>
                            </div>
                            {cvCurrentPdfUrl && (
                              <Group gap="xs">
                                <FilePreviewButton url={cvCurrentPdfUrl} label="Ouvrir" title="CV généré" mode="page" size="xs" variant="light" />
                                <Button component="a" href={cvCurrentPdfUrl} target="_blank" rel="noreferrer" size="xs" variant="subtle">Télécharger</Button>
                              </Group>
                            )}
                          </Group>

                          {cvCurrentPdfUrl ? (
                            <iframe className="cv-preview-frame" src={cvCurrentPdfUrl} title="Aperçu du CV PDF" />
                          ) : (
                            <div className="cv-preview-empty cv-preview-empty-advanced">
                              <Text fw={900}>Aucune preview compilée</Text>
                              <Text size="sm" c="dimmed" ta="center">L’éditeur a déjà généré une source LaTeX. Clique sur Compiler preview pour voir le PDF.</Text>
                            </div>
                          )}
                        </Paper>

                        <Paper withBorder p="lg" radius="lg" className="cv-mini-inspector">
                          <Stack gap="sm">
                            <Group justify="space-between">
                              <Text fw={900}>Inspecteur du document</Text>
                              <Badge variant="light">{cvDocument.settings.layout}</Badge>
                            </Group>
                            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Expériences</Text><Text fw={900}>{cvDocument.experiences.filter((item) => item.enabled !== false).length}</Text></Card>
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Formations</Text><Text fw={900}>{cvDocument.education.filter((item) => item.enabled !== false).length}</Text></Card>
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Projets</Text><Text fw={900}>{cvDocument.projects.filter((item) => item.enabled !== false).length}</Text></Card>
                              <Card withBorder radius="md" p="sm"><Text size="xs" c="dimmed">Skills</Text><Text fw={900}>{cvDocument.skills.filter((item) => item.enabled !== false).length}</Text></Card>
                            </SimpleGrid>
                          </Stack>
                        </Paper>
                      </Stack>
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

  );
}
