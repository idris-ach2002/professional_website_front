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

export default function AdminProjectsPanel({
  projects,
  projectMode,
  selectedProject,
  selectedProjectId,
  selectedOwnerId,
  selectedVersionId,
  projectFiles,
  setProjectFiles,
  projectForm,
  updateProjectForm,
  projectStatuses,
  getProjectId,
  selectProject,
  resetProjectForm,
  hydrateProjectForm,
  setProjectMode,
  setSelectedProjectId,
  setProjectForm,
  emptyProjectForm,
  emptyProjectFiles,
  addProject,
  updateProject,
  deleteProject,
}) {
  const disabled = !selectedOwnerId || !selectedVersionId;
  const publishedCount = projects.filter((project) => project?.published !== false).length;
  const featuredCount = projects.filter((project) => project?.featured === true).length;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={900}>Projets de la version courante</Text>
          <Text size="sm" c="dimmed">
            Crée, sélectionne, modifie, copie ou supprime les projets rattachés à la version sélectionnée. Seuls les projets “Published” sont destinés à l’affichage public.
          </Text>
        </div>
        <Group gap="xs">
          <Badge variant="light">CRUD projets</Badge>
          <Badge color="green" variant="light">{publishedCount} publié(s)</Badge>
          <Badge color="cyan" variant="light">{featuredCount} featured</Badge>
        </Group>
      </Group>

      {disabled && (
        <Alert color="yellow" variant="light">
          Sélectionne d’abord un profil et une version. Les projets ajoutés ici seront attachés à cette version courante.
        </Alert>
      )}

      <Divider />

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" className="admin-project-editor-grid">
        <Stack gap="sm">
          <Group justify="space-between">
            <div>
              <Text fw={800}>Liste des projets</Text>
              <Text size="sm" c="dimmed">Clique sur “Modifier” pour charger un projet dans le formulaire de droite.</Text>
            </div>
            <Group gap="xs">
              <Badge variant="light">{projects.length}</Badge>
              <Button size="xs" variant="light" onClick={() => resetProjectForm()}>
                Nouveau
              </Button>
            </Group>
          </Group>

          {projects.length === 0 && (
            <Alert variant="light">
              Aucun projet dans cette version pour le moment.
            </Alert>
          )}

          {projects.map((project) => {
            const projectId = getProjectId(project);
            const isSelected = String(projectId) === String(selectedProjectId);

            return (
              <Card
                key={projectId}
                withBorder
                padding="md"
                radius="lg"
                className={`admin-list-card admin-project-row ${isSelected ? "is-selected" : ""}`}
              >
                <Group justify="space-between" align="flex-start" gap="md">
                  <Stack gap={4}>
                    <Group gap="xs">
                      <Text fw={800}>{project.displayOrder ?? "—"}. {project.title || "Projet sans titre"}</Text>
                      {project.featured && <Badge color="cyan" variant="light">Featured</Badge>}
                      {project.published === false && <Badge color="gray" variant="light">Draft</Badge>}
                    </Group>
                    <Text size="sm" c="dimmed">{project.subtitle}</Text>
                    <Text size="xs" c="dimmed">
                      {(project.stacks ?? []).slice(0, 5).join(" · ")}
                    </Text>
                    <Group gap="xs">
                      {project.imageUrl && <AdminFileLink label="Image" url={project.imageUrl} />}
                      {project.documentationUrl && <AdminFileLink label="Doc" url={project.documentationUrl} />}
                    </Group>
                  </Stack>

                  <Stack gap="xs" align="flex-end">
                    <Button size="xs" variant={isSelected ? "filled" : "light"} onClick={() => selectProject(String(projectId))}>
                      Modifier
                    </Button>
                    <Button size="xs" variant="subtle" onClick={() => {
                      const copiedProject = hydrateProjectForm(project);
                      setProjectMode("create");
                      setSelectedProjectId(null);
                      setProjectForm({
                        ...copiedProject,
                        title: copiedProject.title
                          ? `${copiedProject.title} — copie`
                          : emptyProjectForm.title,
                        displayOrder: projects.length + 1,
                      });
                      setProjectFiles(emptyProjectFiles);
                    }}>
                      Copier
                    </Button>
                  </Stack>
                </Group>
              </Card>
            );
          })}
        </Stack>

        <Stack gap="lg">
          <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>{projectMode === "edit" ? "Modifier le projet" : "Ajouter un projet"}</Text>
                <Text size="sm" c="dimmed">
                  {projectMode === "edit"
                    ? `Projet sélectionné : ${selectedProject?.title ?? selectedProjectId}`
                    : "Le nouveau projet sera ajouté à la version courante."}
                </Text>
              </div>
              <Badge color={projectMode === "edit" ? "blue" : "green"} variant="light">
                {projectMode === "edit" ? "édition" : "création"}
              </Badge>
            </Group>

            <Divider my="md" />

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Stack gap="xs">
                <FileInput label="Image du projet" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={projectFiles.image} onChange={(file) => setProjectFiles((current) => ({ ...current, image: file }))} />
                <AdminFileLink label="Image actuelle" url={projectForm.imageUrl} />
              </Stack>
              <Stack gap="xs">
                <FileInput label="Documentation PDF" placeholder="Uploader un PDF" accept="application/pdf" value={projectFiles.documentation} onChange={(file) => setProjectFiles((current) => ({ ...current, documentation: file }))} />
                <AdminFileLink label="Documentation actuelle" url={projectForm.documentationUrl} />
              </Stack>
            </SimpleGrid>
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <TextInput label="Titre" placeholder="Nom du projet" value={projectForm.title} onChange={(event) => updateProjectForm("title", event.currentTarget.value)} />
            <TextInput label="Sous-titre" placeholder="Phrase courte affichée sur la carte" value={projectForm.subtitle} onChange={(event) => updateProjectForm("subtitle", event.currentTarget.value)} />
            <Select label="Statut" data={projectStatuses} value={projectForm.status} onChange={(value) => updateProjectForm("status", value ?? "IN_PROGRESS")} />
            <NumberInput label="Ordre d’affichage" value={projectForm.displayOrder} onChange={(value) => updateProjectForm("displayOrder", value ?? 1)} />
            <TextInput label="Date début" placeholder="YYYY-MM-DD" value={projectForm.startDate} onChange={(event) => updateProjectForm("startDate", event.currentTarget.value)} />
            <TextInput label="Date fin" placeholder="YYYY-MM-DD" value={projectForm.endDate} onChange={(event) => updateProjectForm("endDate", event.currentTarget.value)} />
            <TextInput label="Demo URL" placeholder="https://..." value={projectForm.demoUrl} onChange={(event) => updateProjectForm("demoUrl", event.currentTarget.value)} />
            <TextInput label="GitHub URL" placeholder="https://github.com/..." value={projectForm.githubUrl} onChange={(event) => updateProjectForm("githubUrl", event.currentTarget.value)} />
            <TextInput label="Architecture URL" placeholder="Schéma, PDF ou page d’architecture" value={projectForm.architectureUrl} onChange={(event) => updateProjectForm("architectureUrl", event.currentTarget.value)} />
            <TextInput label="Stacks séparées par des virgules" placeholder="Java, Spring Boot, React, PostgreSQL" value={projectForm.stacks} onChange={(event) => updateProjectForm("stacks", event.currentTarget.value)} />
            <TextInput label="Features séparées par des virgules" placeholder="CRUD, versioning, upload, dashboard" value={projectForm.features} onChange={(event) => updateProjectForm("features", event.currentTarget.value)} />
          </SimpleGrid>

          <Textarea label="Description courte" minRows={2} value={projectForm.shortDescription} onChange={(event) => updateProjectForm("shortDescription", event.currentTarget.value)} />
          <Textarea label="Description complète" minRows={5} value={projectForm.description} onChange={(event) => updateProjectForm("description", event.currentTarget.value)} />

          <Group>
            <Checkbox label="Featured : mettre en avant" checked={projectForm.featured} onChange={(event) => updateProjectForm("featured", event.currentTarget.checked)} />
            <Checkbox label="Published : afficher côté public" checked={projectForm.published} onChange={(event) => updateProjectForm("published", event.currentTarget.checked)} />
          </Group>

          <Group>
            {projectMode === "edit" ? (
              <>
                <Button onClick={updateProject} disabled={disabled || !selectedProjectId}>
                  Enregistrer les modifications
                </Button>
                <Button color="red" variant="light" onClick={deleteProject} disabled={!selectedProjectId}>
                  Supprimer ce projet
                </Button>
                <Button variant="subtle" onClick={() => resetProjectForm()}>
                  Repasser en création
                </Button>
              </>
            ) : (
              <Button onClick={addProject} disabled={disabled}>
                Ajouter projet à la version
              </Button>
            )}
          </Group>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
