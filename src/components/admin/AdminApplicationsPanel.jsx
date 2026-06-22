import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import {
  applicationStatusColors,
  applicationStatusLabels,
  applicationStatusOptions,
  getEntityId,
} from "./adminCore";

export default function AdminApplicationsPanel(props) {
  const {
    applicationsDashboard,
    offerAnalysis,
    applyOfferCommandsToCv,
    smartAnalysis,
    selectedLetterVariantId,
    selectedSmartCvProposal,
    selectedSmartCvCommands,
    loadLetterTemplates,
    runSmartApplicationAnalysis,
    exportSmartApplicationPack,
    selectedOwnerId,
    selectedApplicationId,
    setCommandTraceOpened,
    smartPackUrl,
    letterTemplates,
    selectedSmartCommandKeys,
    getSmartCommandKey,
    formatCvCommand,
    setSelectedSmartCommandKeys,
    setProposalCommandsSelection,
    countSelectedProposalCommands,
    applySmartCvProposal,
    selectedCvProposalId,
    setSelectedCvProposalId,
    setSelectedLetterVariantId,
    applySmartLetterVariant,
    loadApplications,
    resetApplicationForm,
    applications,
    selectApplication,
    applicationForm,
    updateApplicationForm,
    versions,
    selectedVersionId,
    cvVariants,
    analyzeCurrentOffer,
    saveApplication,
    deleteApplication,
    markApplicationStatus,
    previewCoverLetter,
    saveCoverLetter,
    exportApplicationPackage,
    coverLetterPreviewUrl,
    coverLetterLogs,
    coverLetterWarnings,
    applicationZipUrl
  } = props;

  function renderApplicationsDashboard() {
    if (!applicationsDashboard) {
      return <Alert color="gray" variant="light">Aucune donnée de suivi chargée.</Alert>;
    }
    return (
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">Total</Text><Text fw={900} size="xl">{applicationsDashboard.total}</Text></Paper>
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">À préparer</Text><Text fw={900} size="xl">{applicationsDashboard.toPrepare}</Text></Paper>
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">Relances</Text><Text fw={900} size="xl">{applicationsDashboard.followUp}</Text></Paper>
        <Paper withBorder p="md" radius="lg"><Text size="xs" c="dimmed">Score moyen</Text><Text fw={900} size="xl">{applicationsDashboard.averageScore ?? 0}/100</Text></Paper>
      </SimpleGrid>
    );
  }

  function renderOfferAnalysis() {
    if (!offerAnalysis) {
      return <Alert color="gray" variant="light">Analyse une offre pour obtenir le score, les mots-clés et les commandes CV proposées.</Alert>;
    }
    const scoreColor = offerAnalysis.score >= 75 ? "green" : offerAnalysis.score >= 50 ? "yellow" : "red";
    return (
      <Stack gap="sm">
        <Group justify="space-between"><Badge color={scoreColor} size="lg">Score {offerAnalysis.score}/100</Badge><Badge variant="light">{offerAnalysis.targetProfile}</Badge></Group>
        <Text size="sm" c="dimmed">{offerAnalysis.summary}</Text>
        <Group gap="xs">{(offerAnalysis.matchedKeywords ?? []).map((keyword) => <Badge key={keyword} color="green" variant="light">{keyword}</Badge>)}</Group>
        {(offerAnalysis.missingKeywords ?? []).length > 0 && <Group gap="xs">{offerAnalysis.missingKeywords.map((keyword) => <Badge key={keyword} color="orange" variant="light">manque : {keyword}</Badge>)}</Group>}
        <Stack gap={4}>{(offerAnalysis.recommendations ?? []).map((item) => <Text key={item} size="sm">— {item}</Text>)}</Stack>
        <Button variant="light" onClick={applyOfferCommandsToCv}>Appliquer les commandes au CV Studio</Button>
      </Stack>
    );
  }



  function renderSmartApplicationEngine() {
    const selectedLetter = smartAnalysis?.letterVariants?.find((variant) => variant.id === selectedLetterVariantId) ?? smartAnalysis?.letterVariants?.[0];
    const selectedCv = selectedSmartCvProposal;

    return (
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={900}>Système intelligent candidature</Text>
            <Text size="sm" c="dimmed">
              Analyse profonde de l’offre, matching preuves candidat, variantes de CV, variantes de lettres et export candidature enrichi.
            </Text>
          </div>
          <Badge variant="light">Smart engine</Badge>
        </Group>

        <Group>
          <Button variant="light" onClick={loadLetterTemplates} disabled={!selectedOwnerId}>Charger templates</Button>
          <Button onClick={runSmartApplicationAnalysis} disabled={!selectedApplicationId}>Analyse intelligente</Button>
          <Button variant="light" onClick={exportSmartApplicationPack} disabled={!selectedApplicationId || !smartAnalysis}>Exporter smart pack</Button>
          <Button variant="subtle" onClick={() => setCommandTraceOpened(true)}>Traces commandes CV</Button>
          {smartPackUrl && <Button component="a" href={smartPackUrl} target="_blank" rel="noreferrer">Télécharger smart ZIP</Button>}
        </Group>
        {selectedSmartCvProposal && (
          <Alert color="blue" variant="light">
            Proposition CV active : <strong>{selectedSmartCvProposal.name}</strong> — {selectedSmartCvCommands.length}/{selectedSmartCvProposal.commands?.length ?? 0} commande(s) sélectionnée(s). Après application, l’interface ouvre automatiquement le CV Builder avec les champs modifiés.
          </Alert>
        )}

        {letterTemplates.length > 0 && (
          <Paper withBorder radius="lg" p="md" className="smart-engine-box">
            <Group justify="space-between" mb="xs">
              <Text fw={800}>Bibliothèque de lettres</Text>
              <Badge variant="light">{letterTemplates.length} modèles</Badge>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
              {letterTemplates.slice(0, 8).map((template) => (
                <Paper key={template.id} withBorder radius="md" p="sm" className="smart-template-card">
                  <Group justify="space-between" gap="xs">
                    <Text fw={800} size="sm">{template.name}</Text>
                    <Badge size="xs" variant="light">{template.category}</Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{template.angle}</Text>
                  <Group gap={4} mt={6}>{(template.bestFor ?? []).slice(0, 4).map((item) => <Badge key={item} size="xs" variant="light">{item}</Badge>)}</Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Paper>
        )}

        {!smartAnalysis ? (
          <Alert color="gray" variant="light">Lance l’analyse intelligente après avoir enregistré la candidature. Le moteur proposera plusieurs CV et plusieurs lettres.</Alert>
        ) : (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
              <Paper withBorder radius="lg" p="md"><Text size="xs" c="dimmed">Global</Text><Text fw={900} size="xl">{smartAnalysis.scores?.globalScore ?? 0}/100</Text></Paper>
              <Paper withBorder radius="lg" p="md"><Text size="xs" c="dimmed">Hard skills</Text><Text fw={900} size="xl">{smartAnalysis.scores?.hardSkillsScore ?? 0}/100</Text></Paper>
              <Paper withBorder radius="lg" p="md"><Text size="xs" c="dimmed">Preuves</Text><Text fw={900} size="xl">{smartAnalysis.scores?.evidenceScore ?? 0}/100</Text></Paper>
              <Paper withBorder radius="lg" p="md"><Text size="xs" c="dimmed">ATS</Text><Text fw={900} size="xl">{smartAnalysis.scores?.atsScore ?? 0}/100</Text></Paper>
            </SimpleGrid>

            <Paper withBorder radius="lg" p="md" className="smart-engine-box">
              <Text fw={800}>Offre structurée</Text>
              <Text size="sm" c="dimmed">{smartAnalysis.explanation}</Text>
              <Group gap="xs" mt="sm">
                <Badge variant="light">{smartAnalysis.offer?.sector}</Badge>
                <Badge variant="light">{smartAnalysis.offer?.tone}</Badge>
                <Badge variant="light">{smartAnalysis.offer?.contractType}</Badge>
                <Badge variant="light">{smartAnalysis.offer?.seniority}</Badge>
              </Group>
              <Group gap="xs" mt="sm">{(smartAnalysis.offer?.hardSkills ?? []).map((skill) => <Badge key={skill} color="green" variant="light">{skill}</Badge>)}</Group>
              {(smartAnalysis.missingCriticalKeywords ?? []).length > 0 && <Group gap="xs" mt="xs">{smartAnalysis.missingCriticalKeywords.map((skill) => <Badge key={skill} color="orange" variant="light">manque critique : {skill}</Badge>)}</Group>}
            </Paper>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
              <Paper withBorder radius="lg" p="md" className="smart-engine-box">
                <Group justify="space-between" mb="xs"><Text fw={800}>CV proposés</Text><Badge variant="light">{smartAnalysis.cvVariants?.length ?? 0}</Badge></Group>
                <Stack gap="sm">
                  {(smartAnalysis.cvVariants ?? []).map((variant) => (
                    <Paper key={variant.id} withBorder radius="md" p="sm" className={variant.id === selectedCv?.id ? "smart-proposal-card is-selected" : "smart-proposal-card"} onClick={() => setSelectedCvProposalId(variant.id)}>
                      <Group justify="space-between">
                        <Text fw={800} size="sm">{variant.name}</Text>
                        <Badge color={variant.score >= 85 ? "green" : "blue"} variant="light">{variant.score}/100</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">{variant.strategy}</Text>
                      <Text size="xs" mt={4}><strong>Titre :</strong> {variant.targetTitle}</Text>
                      <Group gap={4} mt={6}>{(variant.prioritizedKeywords ?? []).slice(0, 6).map((item) => <Badge key={item} size="xs" variant="light">{item}</Badge>)}</Group>
                      <Group justify="space-between" mt="xs" gap="xs">
                        <Text size="xs" c="dimmed">Commandes sélectionnées : {countSelectedProposalCommands(variant)}/{variant.commands?.length ?? 0}</Text>
                        <Group gap={4}>
                          <Button size="compact-xs" variant="subtle" onClick={(event) => { event.stopPropagation(); setProposalCommandsSelection(variant, true); }}>Tout</Button>
                          <Button size="compact-xs" variant="subtle" onClick={(event) => { event.stopPropagation(); setProposalCommandsSelection(variant, false); }}>Aucune</Button>
                        </Group>
                      </Group>
                      <Stack gap={4} mt="xs" className="smart-command-selector">
                        {(variant.commands ?? []).map((command, commandIndex) => {
                          const commandKey = getSmartCommandKey(variant.id, commandIndex);
                          return (
                            <Checkbox
                              key={commandKey}
                              size="xs"
                              checked={selectedSmartCommandKeys[commandKey] !== false}
                              label={formatCvCommand(command)}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                const checked = event.currentTarget.checked;
                                setSelectedSmartCommandKeys((current) => ({ ...current, [commandKey]: checked }));
                              }}
                            />
                          );
                        })}
                      </Stack>
                      <Group gap="xs" mt="xs">
                        <Button size="xs" variant="light" onClick={(event) => { event.stopPropagation(); applySmartCvProposal(variant); }}>Appliquer la sélection</Button>
                        <Button size="xs" variant="subtle" onClick={(event) => { event.stopPropagation(); setCommandTraceOpened(true); }}>Voir traces</Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Paper>

              <Paper withBorder radius="lg" p="md" className="smart-engine-box">
                <Group justify="space-between" mb="xs"><Text fw={800}>Preuves candidat</Text><Badge variant="light">{smartAnalysis.evidence?.length ?? 0}</Badge></Group>
                <Stack gap="sm">
                  {(smartAnalysis.evidence ?? []).slice(0, 6).map((item) => (
                    <Paper key={item.id} withBorder radius="md" p="sm" className="smart-evidence-card">
                      <Group justify="space-between"><Text fw={800} size="sm">{item.title}</Text><Badge color={item.score >= 70 ? "green" : "yellow"} variant="light">{item.score}/100</Badge></Group>
                      <Text size="xs" c="dimmed">{item.type} · {item.subtitle}</Text>
                      <Text size="xs" mt={4}>{item.cvBullet}</Text>
                      <Group gap={4} mt={6}>{(item.matchedKeywords ?? []).slice(0, 5).map((keyword) => <Badge key={keyword} size="xs" variant="light">{keyword}</Badge>)}</Group>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </SimpleGrid>

            <Paper withBorder radius="lg" p="md" className="smart-engine-box">
              <Group justify="space-between" mb="xs"><Text fw={800}>Lettres proposées</Text><Badge variant="light">{smartAnalysis.letterVariants?.length ?? 0}</Badge></Group>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                {(smartAnalysis.letterVariants ?? []).map((variant) => (
                  <Paper key={variant.id} withBorder radius="md" p="sm" className={variant.id === selectedLetter?.id ? "smart-proposal-card is-selected" : "smart-proposal-card"} onClick={() => setSelectedLetterVariantId(variant.id)}>
                    <Group justify="space-between">
                      <Text fw={800} size="sm">{variant.name}</Text>
                      <Badge color={variant.score >= 85 ? "green" : "blue"} variant="light">{variant.score}/100</Badge>
                    </Group>
                    <Text size="xs" c="dimmed">{variant.angle}</Text>
                    <Group gap={4} mt={6}>
                      <Badge size="xs" variant="light">{variant.tone}</Badge>
                      <Badge size="xs" variant="light">tech {variant.technicalLevel}/100</Badge>
                    </Group>
                    <Button size="xs" variant="light" mt="xs" onClick={(event) => { event.stopPropagation(); applySmartLetterVariant(variant); }}>Utiliser cette lettre</Button>
                  </Paper>
                ))}
              </SimpleGrid>
              {selectedLetter && (
                <Textarea mt="md" minRows={8} label={`Aperçu texte — ${selectedLetter.name}`} value={selectedLetter.plainText ?? ""} readOnly />
              )}
            </Paper>

            <Paper withBorder radius="lg" p="md" className="smart-engine-box">
              <Group justify="space-between" mb="xs"><Text fw={800}>Mail recommandé</Text><Badge variant="light">{smartAnalysis.mail?.score ?? 0}/100</Badge></Group>
              <TextInput label="Objet" value={smartAnalysis.mail?.subject ?? ""} readOnly />
              <Textarea mt="sm" minRows={6} label="Corps" value={smartAnalysis.mail?.body ?? ""} readOnly />
              <Button size="xs" mt="sm" variant="light" onClick={() => updateApplicationForm("mailDraft", smartAnalysis.mail?.body ?? applicationForm.mailDraft)}>Utiliser ce mail</Button>
            </Paper>

            {(smartAnalysis.recommendations ?? []).length > 0 && (
              <Alert color="blue" variant="light">
                {(smartAnalysis.recommendations ?? []).slice(0, 5).map((item) => <Text key={item} size="sm">— {item}</Text>)}
              </Alert>
            )}
            {(smartAnalysis.riskWarnings ?? []).length > 0 && (
              <Alert color="orange" variant="light">
                {(smartAnalysis.riskWarnings ?? []).map((item) => <Text key={item} size="sm">— {item}</Text>)}
              </Alert>
            )}
          </Stack>
        )}
      </Stack>
    );
  }
  return (
            <Tabs.Panel value="applications" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={900}>Assistant candidature</Text>
                    <Text size="sm" c="dimmed">
                      Analyse une offre, crée une candidature suivie, génère une lettre de motivation LaTeX/PDF et exporte un package complet.
                    </Text>
                  </div>
                  <Group>
                    <Button variant="light" onClick={() => loadApplications(selectedOwnerId)} disabled={!selectedOwnerId}>Rafraîchir</Button>
                    <Button onClick={resetApplicationForm} disabled={!selectedOwnerId}>Nouvelle candidature</Button>
                  </Group>
                </Group>

                {renderApplicationsDashboard()}

                <SimpleGrid cols={{ base: 1, xl: 3 }} spacing="lg">
                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-list-panel">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={900}>Pipeline candidatures</Text>
                        <Badge variant="light">{applications.length} item(s)</Badge>
                      </Group>
                      {applications.length === 0 ? (
                        <Alert color="gray" variant="light">Aucune candidature enregistrée pour ce owner.</Alert>
                      ) : (
                        <Stack gap="sm">
                          {applications.map((application) => (
                            <Paper
                              key={application.id}
                              withBorder
                              radius="lg"
                              p="md"
                              className={String(application.id) === String(selectedApplicationId) ? "application-card is-selected" : "application-card"}
                              onClick={() => selectApplication(application)}
                            >
                              <Group justify="space-between" align="flex-start">
                                <div>
                                  <Text fw={900}>{application.companyName}</Text>
                                  <Text size="sm" c="dimmed">{application.roleTitle}</Text>
                                </div>
                                <Badge color={applicationStatusColors[application.status] ?? "gray"} variant="light">
                                  {applicationStatusLabels[application.status] ?? application.status}
                                </Badge>
                              </Group>
                              <Group gap="xs" mt="xs">
                                <Badge color={(application.relevanceScore ?? 0) >= 75 ? "green" : "yellow"} variant="light">{application.relevanceScore ?? 0}/100</Badge>
                                {application.followUpAt && <Badge color="orange" variant="light">relance {application.followUpAt}</Badge>}
                              </Group>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Paper>

                  <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-editor-panel">
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Text fw={900}>{selectedApplicationId ? "Éditer la candidature" : "Créer une candidature"}</Text>
                        {selectedApplicationId && <Badge variant="light">#{selectedApplicationId}</Badge>}
                      </Group>

                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        <TextInput label="Entreprise" value={applicationForm.companyName} onChange={(event) => updateApplicationForm("companyName", event.currentTarget.value)} />
                        <TextInput label="Poste" value={applicationForm.roleTitle} onChange={(event) => updateApplicationForm("roleTitle", event.currentTarget.value)} />
                        <TextInput label="Lieu" value={applicationForm.location} onChange={(event) => updateApplicationForm("location", event.currentTarget.value)} />
                        <Select label="Statut" data={applicationStatusOptions} value={applicationForm.status} onChange={(value) => updateApplicationForm("status", value ?? "DRAFT")} />
                        <Select
                          label="Version portfolio associée"
                          data={versions.map((version) => ({ value: String(getEntityId(version)), label: `${version.label ?? version.versionTag} ${version.active ? "· active" : ""}` }))}
                          value={applicationForm.versionId ? String(applicationForm.versionId) : selectedVersionId}
                          onChange={(value) => updateApplicationForm("versionId", value ?? "")}
                        />
                        <TextInput label="Variante CV" value={applicationForm.cvVariantName} onChange={(event) => updateApplicationForm("cvVariantName", event.currentTarget.value)} />
                        <TextInput label="URL offre" value={applicationForm.offerUrl} onChange={(event) => updateApplicationForm("offerUrl", event.currentTarget.value)} />
                        <TextInput label="Profil ciblé" value={applicationForm.targetProfile} onChange={(event) => updateApplicationForm("targetProfile", event.currentTarget.value)} />
                        <TextInput label="Date envoi" placeholder="YYYY-MM-DD" value={applicationForm.appliedAt} onChange={(event) => updateApplicationForm("appliedAt", event.currentTarget.value)} />
                        <TextInput label="Date relance" placeholder="YYYY-MM-DD" value={applicationForm.followUpAt} onChange={(event) => updateApplicationForm("followUpAt", event.currentTarget.value)} />
                      </SimpleGrid>

                      <Textarea minRows={8} label="Offre collée" value={applicationForm.offerText} onChange={(event) => updateApplicationForm("offerText", event.currentTarget.value)} />
                      <Textarea minRows={5} label="Notes internes" value={applicationForm.notes} onChange={(event) => updateApplicationForm("notes", event.currentTarget.value)} />
                      <Textarea minRows={5} label="Mail de candidature" value={applicationForm.mailDraft} onChange={(event) => updateApplicationForm("mailDraft", event.currentTarget.value)} />

                      <Group>
                        <Button variant="light" onClick={analyzeCurrentOffer}>Analyser l’offre</Button>
                        <Button onClick={saveApplication}>{selectedApplicationId ? "Mettre à jour" : "Créer"}</Button>
                        {selectedApplicationId && <Button color="red" variant="subtle" onClick={deleteApplication}>Supprimer</Button>}
                      </Group>

                      {selectedApplicationId && (
                        <Group gap="xs">
                          <Button size="xs" variant="light" onClick={() => markApplicationStatus("SENT")}>Marquer envoyée</Button>
                          <Button size="xs" variant="light" onClick={() => markApplicationStatus("FOLLOW_UP")}>Relance</Button>
                          <Button size="xs" variant="light" onClick={() => markApplicationStatus("INTERVIEW")}>Entretien</Button>
                          <Button size="xs" variant="light" color="green" onClick={() => markApplicationStatus("ACCEPTED")}>Acceptée</Button>
                        </Group>
                      )}
                    </Stack>
                  </Paper>

                  <Stack gap="lg">
                    <Paper withBorder p="lg" radius="lg" className="admin-nested-panel smart-application-panel">
                      {renderSmartApplicationEngine()}
                    </Paper>

                    <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-analysis-panel">
                      <Stack gap="md">
                        <Text fw={900}>Analyse et adaptation CV</Text>
                        {renderOfferAnalysis()}
                      </Stack>
                    </Paper>

                    <Paper withBorder p="lg" radius="lg" className="admin-nested-panel application-letter-panel">
                      <Stack gap="md">
                        <Group justify="space-between" align="center">
                          <Text fw={900}>Lettre de motivation LaTeX</Text>
                          {coverLetterPreviewUrl && <Badge color="green" variant="light">PDF prêt</Badge>}
                        </Group>
                        <Textarea
                          minRows={10}
                          label="Source LaTeX de la lettre"
                          value={applicationForm.coverLetterSource}
                          onChange={(event) => updateApplicationForm("coverLetterSource", event.currentTarget.value)}
                          placeholder="Laisse vide pour générer automatiquement depuis l’offre et la version portfolio."
                        />
                        <Group>
                          <Button variant="light" onClick={previewCoverLetter} disabled={!selectedApplicationId}>Prévisualiser PDF</Button>
                          <Button onClick={saveCoverLetter} disabled={!selectedApplicationId}>Sauvegarder lettre</Button>
                          <Button variant="light" onClick={exportApplicationPackage} disabled={!selectedApplicationId}>Exporter ZIP candidature</Button>
                        </Group>
                        <Group>
                          {coverLetterPreviewUrl && <Button component="a" href={coverLetterPreviewUrl} target="_blank" rel="noreferrer">Ouvrir PDF</Button>}
                          {applicationZipUrl && <Button component="a" href={applicationZipUrl} target="_blank" rel="noreferrer" variant="light">Télécharger ZIP</Button>}
                        </Group>
                        {coverLetterWarnings.length > 0 && <Alert color="orange" variant="light">{coverLetterWarnings.join(" · ")}</Alert>}
                        {coverLetterLogs && <Textarea minRows={7} label="Logs LaTeX" value={coverLetterLogs} readOnly />}
                      </Stack>
                    </Paper>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

  );
}
