import {
  Accordion,
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
  const caseStudy = { ...(emptyProjectForm.caseStudy ?? {}), ...(projectForm.caseStudy ?? {}) };

  const slugifyProjectTitle = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  const updateCaseStudy = (field, value) => {
    updateProjectForm("caseStudy", {
      ...(emptyProjectForm.caseStudy ?? {}),
      ...(projectForm.caseStudy ?? {}),
      [field]: value,
    });
  };

  const fillCaseStudyFromProject = () => {
    const features = String(projectForm.features ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const stacks = String(projectForm.stacks ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    updateProjectForm("caseStudy", {
      ...(emptyProjectForm.caseStudy ?? {}),
      ...(projectForm.caseStudy ?? {}),
      problem: caseStudy.problem || projectForm.shortDescription || "Clarifier le besoin, structurer le périmètre et livrer une solution exploitable.",
      context: caseStudy.context || projectForm.description || "Projet construit dans un contexte académique ou professionnel avec un objectif applicatif concret.",
      role: caseStudy.role || "Conception, développement, intégration, tests, documentation et arbitrages techniques sur le périmètre logiciel.",
      architecture: caseStudy.architecture || `Architecture construite autour de ${stacks.slice(0, 5).join(", ") || "composants séparés"}, avec séparation des responsabilités et données structurées.`,
      technicalChoices: caseStudy.technicalChoices || features.slice(0, 4).join("\n"),
      challenges: caseStudy.challenges || "Structurer le projet sans multiplier les responsabilités dans les mêmes modules.\nMaintenir une base lisible, testable et évolutive.",
      solutions: caseStudy.solutions || features.slice(0, 4).join("\n"),
      results: caseStudy.results || "Projet documenté et exploitable comme preuve technique.\nFonctionnalités principales livrées et reliées à des compétences concrètes.",
      nextSteps: caseStudy.nextSteps || "Renforcer les tests, enrichir la documentation technique et industrialiser les scénarios d’usage.",
    });
  };

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
            <Group align="end" gap="xs" grow>
              <TextInput label="Slug public" placeholder="portfolio-backend-spring-boot" value={projectForm.slug} onChange={(event) => updateProjectForm("slug", event.currentTarget.value)} />
              <Button variant="light" onClick={() => updateProjectForm("slug", slugifyProjectTitle(projectForm.title))}>
                Générer
              </Button>
            </Group>
            <TextInput label="Stacks séparées par des virgules" placeholder="Java, Spring Boot, React, PostgreSQL" value={projectForm.stacks} onChange={(event) => updateProjectForm("stacks", event.currentTarget.value)} />
            <TextInput label="Features séparées par des virgules" placeholder="CRUD, versioning, upload, dashboard" value={projectForm.features} onChange={(event) => updateProjectForm("features", event.currentTarget.value)} />
            <TextInput label="Proof tags séparés par des virgules" placeholder="Java, REST API, PostgreSQL, Architecture" value={projectForm.proofTags} onChange={(event) => updateProjectForm("proofTags", event.currentTarget.value)} />
          </SimpleGrid>

          <Textarea label="Description courte" minRows={2} value={projectForm.shortDescription} onChange={(event) => updateProjectForm("shortDescription", event.currentTarget.value)} />
          <Textarea label="Description complète" minRows={5} value={projectForm.description} onChange={(event) => updateProjectForm("description", event.currentTarget.value)} />

          <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
            <Group justify="space-between" align="flex-start" mb="sm">
              <div>
                <Text fw={850}>Étude de cas publique</Text>
                <Text size="sm" c="dimmed">
                  Ces champs alimentent la page /projects/:slug et les compétences prouvées. Les listes se remplissent une ligne par élément.
                </Text>
              </div>
              <Button size="xs" variant="light" onClick={fillCaseStudyFromProject}>
                Préremplir
              </Button>
            </Group>

            <Accordion variant="contained" defaultValue="main">
              <Accordion.Item value="main">
                <Accordion.Control>Résumé, rôle et architecture</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Textarea label="Problème traité" minRows={2} value={caseStudy.problem} onChange={(event) => updateCaseStudy("problem", event.currentTarget.value)} />
                    <Textarea label="Contexte" minRows={3} value={caseStudy.context} onChange={(event) => updateCaseStudy("context", event.currentTarget.value)} />
                    <Textarea label="Rôle personnel" minRows={2} value={caseStudy.role} onChange={(event) => updateCaseStudy("role", event.currentTarget.value)} />
                    <Textarea label="Architecture" minRows={3} value={caseStudy.architecture} onChange={(event) => updateCaseStudy("architecture", event.currentTarget.value)} />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="proofs">
                <Accordion.Control>Choix techniques, difficultés et preuves</Accordion.Control>
                <Accordion.Panel>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <Textarea label="Choix techniques" description="Une ligne par choix" minRows={5} value={caseStudy.technicalChoices} onChange={(event) => updateCaseStudy("technicalChoices", event.currentTarget.value)} />
                    <Textarea label="Difficultés" description="Une ligne par difficulté" minRows={5} value={caseStudy.challenges} onChange={(event) => updateCaseStudy("challenges", event.currentTarget.value)} />
                    <Textarea label="Solutions" description="Une ligne par solution" minRows={5} value={caseStudy.solutions} onChange={(event) => updateCaseStudy("solutions", event.currentTarget.value)} />
                    <Textarea label="Résultats / impacts" description="Une ligne par résultat" minRows={5} value={caseStudy.results} onChange={(event) => updateCaseStudy("results", event.currentTarget.value)} />
                    <Textarea label="Limites" description="Une ligne par limite" minRows={4} value={caseStudy.limits} onChange={(event) => updateCaseStudy("limits", event.currentTarget.value)} />
                    <Textarea label="Suites possibles" minRows={4} value={caseStudy.nextSteps} onChange={(event) => updateCaseStudy("nextSteps", event.currentTarget.value)} />
                  </SimpleGrid>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Paper>

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
