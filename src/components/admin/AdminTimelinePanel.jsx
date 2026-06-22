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
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import AdminFileLink from "./AdminFileLink";

export default function AdminTimelinePanel({
  timelineForm,
  updateTimelineForm,
  experienceCategories,
  experienceForm,
  updateExperienceForm,
  experienceFiles,
  setExperienceFiles,
  experiences,
  experienceMode,
  selectedExperienceIndex,
  selectedOwnerId,
  selectedVersionId,
  addExperienceLocally,
  updateExperienceLocally,
  removeExperience,
  selectExperience,
  resetExperienceForm,
  duplicateExperience,
  moveExperience,
  saveTimeline,
}) {
  const disabled = !selectedOwnerId || !selectedVersionId;
  const editing = experienceMode === "edit" && selectedExperienceIndex !== null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={900}>Timeline et expériences de la version courante</Text>
          <Text size="sm" c="dimmed">
            Fonctionnement guidé : tu ajoutes ou modifies les expériences dans la liste, puis tu enregistres la timeline complète pour l’écrire côté backend.
          </Text>
        </div>
        <Group gap="xs">
          <Badge variant="light">CRUD timeline</Badge>
          <Badge variant="light">{experiences.length} expérience(s)</Badge>
        </Group>
      </Group>

      {disabled && (
        <Alert color="yellow" variant="light">
          Sélectionne d’abord un profil et une version. Les expériences seront ensuite rattachées à cette version courante.
        </Alert>
      )}

      <Divider />

      <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>Métadonnées de la timeline</Text>
              <Text size="sm" c="dimmed">Titre et description globale affichés au-dessus des expériences.</Text>
            </div>
            <Badge variant="light">Bloc public</Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <TextInput label="Titre timeline" placeholder="Ex. Parcours" value={timelineForm.title} onChange={(event) => updateTimelineForm("title", event.currentTarget.value)} />
            <TextInput label="Description timeline" placeholder="Ex. Formations, stages et expériences" value={timelineForm.description} onChange={(event) => updateTimelineForm("description", event.currentTarget.value)} />
          </SimpleGrid>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" className="admin-project-editor-grid">
        <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>{editing ? "Modifier l’expérience sélectionnée" : "Ajouter une expérience"}</Text>
                <Text size="sm" c="dimmed">
                  {editing
                    ? "Après modification, clique sur “Mettre à jour dans la liste”, puis sauvegarde la timeline complète."
                    : "Remplis les champs utiles, ajoute dans la liste, puis sauvegarde la timeline complète."}
                </Text>
              </div>
              <Badge color={editing ? "blue" : "green"} variant="light">
                {editing ? "édition locale" : "création locale"}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Select label="Catégorie" data={experienceCategories} value={experienceForm.category} onChange={(value) => updateExperienceForm("category", value ?? "SCHOOL")} />
              <TextInput label="Titre" placeholder="Ex. Stage développement logiciel" value={experienceForm.title} onChange={(event) => updateExperienceForm("title", event.currentTarget.value)} />
              <TextInput label="Organisation" placeholder="Ex. LITIS" value={experienceForm.organization} onChange={(event) => updateExperienceForm("organization", event.currentTarget.value)} />
              <TextInput label="Localisation" placeholder="Ex. Le Havre" value={experienceForm.location} onChange={(event) => updateExperienceForm("location", event.currentTarget.value)} />
              <TextInput label="Date début" placeholder="YYYY-MM-DD" value={experienceForm.startDate} onChange={(event) => updateExperienceForm("startDate", event.currentTarget.value)} />
              <TextInput label="Date fin" placeholder="YYYY-MM-DD" value={experienceForm.endDate} disabled={experienceForm.currentPosition} onChange={(event) => updateExperienceForm("endDate", event.currentTarget.value)} />
              <FileInput label="Image expérience" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={experienceFiles.image} onChange={(file) => setExperienceFiles({ image: file })} />
              <Stack gap={2}>
                <TextInput label="Site URL" placeholder="https://..." value={experienceForm.websiteUrl} onChange={(event) => updateExperienceForm("websiteUrl", event.currentTarget.value)} />
                <AdminFileLink label="Image actuelle" url={experienceForm.imageUrl} />
              </Stack>
              <NumberInput label="Ordre d’affichage" value={experienceForm.displayOrder} onChange={(value) => updateExperienceForm("displayOrder", value ?? 1)} />
              <TextInput label="Compétences séparées par des virgules" placeholder="Java, Spring Boot, PostgreSQL" value={experienceForm.skills} onChange={(event) => updateExperienceForm("skills", event.currentTarget.value)} />
            </SimpleGrid>

            <Textarea label="Résumé" minRows={2} value={experienceForm.summary} onChange={(event) => updateExperienceForm("summary", event.currentTarget.value)} />
            <Textarea label="Description" minRows={4} value={experienceForm.description} onChange={(event) => updateExperienceForm("description", event.currentTarget.value)} />
            <Checkbox label="Poste actuel" checked={experienceForm.currentPosition} onChange={(event) => updateExperienceForm("currentPosition", event.currentTarget.checked)} />

            <Group>
              {editing ? (
                <>
                  <Button variant="light" onClick={updateExperienceLocally}>Mettre à jour dans la liste</Button>
                  <Button variant="subtle" onClick={resetExperienceForm}>Annuler l’édition</Button>
                </>
              ) : (
                <Button variant="light" onClick={addExperienceLocally}>Ajouter dans la liste</Button>
              )}
              <Button onClick={saveTimeline} disabled={disabled}>Enregistrer la timeline complète</Button>
            </Group>
          </Stack>
        </Paper>

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={800}>Expériences de la timeline</Text>
              <Text size="sm" c="dimmed">Sélectionne une carte pour modifier, dupliquer, réordonner ou retirer l’expérience.</Text>
            </div>
            <Badge variant="light">{experiences.length}</Badge>
          </Group>

          {experiences.length === 0 && (
            <Alert variant="light">Aucune expérience dans cette version pour le moment.</Alert>
          )}

          {experiences.map((experience, index) => {
            const isSelected = editing && index === selectedExperienceIndex;

            return (
              <Card key={`${experience.title}-${experience.organization}-${index}`} withBorder padding="md" radius="lg" className={`admin-list-card ${isSelected ? "is-selected" : ""}`}>
                <Group justify="space-between" align="flex-start" gap="md">
                  <div>
                    <Group gap="xs">
                      <Text fw={800}>{experience.displayOrder ?? index + 1}. {experience.title || "Sans titre"}</Text>
                      <Badge variant="light">{experience.category}</Badge>
                      {experience.currentPosition && <Badge color="green" variant="light">actuel</Badge>}
                    </Group>
                    <Text size="sm" c="dimmed">{experience.organization || "Organisation non renseignée"}</Text>
                    <Text size="sm">{experience.summary}</Text>
                    <Group gap="xs" mt={4}>
                      {experience.imageUrl && <AdminFileLink label="Image" url={experience.imageUrl} />}
                      {experience.websiteUrl && <Button component="a" href={experience.websiteUrl} target="_blank" rel="noreferrer" size="xs" variant="subtle">Site</Button>}
                    </Group>
                  </div>

                  <Stack gap="xs" align="flex-end">
                    <Button size="xs" variant={isSelected ? "filled" : "light"} onClick={() => selectExperience(index)}>Modifier</Button>
                    <Group gap={4}>
                      <Button size="xs" variant="subtle" onClick={() => moveExperience(index, -1)} disabled={index === 0}>↑</Button>
                      <Button size="xs" variant="subtle" onClick={() => moveExperience(index, 1)} disabled={index === experiences.length - 1}>↓</Button>
                    </Group>
                    <Button size="xs" variant="subtle" onClick={() => duplicateExperience(index)}>Copier</Button>
                    <Button size="xs" color="red" variant="light" onClick={() => removeExperience(index)}>Retirer</Button>
                  </Stack>
                </Group>
              </Card>
            );
          })}
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
