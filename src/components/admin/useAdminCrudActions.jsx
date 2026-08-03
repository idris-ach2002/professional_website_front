

import {
  apiRequest,
  logoutAdmin,
  buildBackendUrl,
  } from "../../services/authApi";
import {
  emptyProfileFiles,
  emptyProjectFiles,
  toArray,
  getEntityId,
  getProjectId,
  nullIfBlank,
  sanitizeContactRows,
  hydrateOwnerForm,
  normalizeExperienceOrder,
  hydrateProjectForm,
  buildProjectCaseStudyPayload,
  uploadFile,
} from "./adminCoreUtils";

export default function useAdminCrudActions(ctx) {
  const {
    setLoading,
    setMessage,
    setError,
    setOwners,
    setVersions,
    projects,
    setProjects,
    selectedOwnerId,
    setSelectedOwnerId,
    selectedVersionId,
    setSelectedVersionId,
    selectedProjectId,
    setSelectedProjectId,
    setProjectMode,
    cloneSourceVersionId,
    setCloneSourceVersionId,
    ownerForm,
    setOwnerForm,
    versionForm,
    profileForm,
    setProfileForm,
    timelineForm,
    experienceForm,
    experiences,
    setExperiences,
    selectedExperienceIndex,
    projectForm,
    setProjectForm,
    profileFiles,
    setProfileFiles,
    experienceFiles,
    projectFiles,
    setProjectFiles,
    runAction,
    fetchOwners,
    refreshOwners,
    refreshVersions,
    resetProjectForm,
    resetExperienceForm,
    selectExperience
  } = ctx;

  async function buildProfilePayload() {
    const uploadedProfileImageUrl = await uploadFile(profileFiles.profileImage);
    const uploadedLogoUrl = await uploadFile(profileFiles.logo);
    const uploadedCvUrl = await uploadFile(profileFiles.cv);

    return {
      ...profileForm,
      profileImageUrl: nullIfBlank(uploadedProfileImageUrl ?? profileForm.profileImageUrl),
      logoUrl: nullIfBlank(uploadedLogoUrl ?? profileForm.logoUrl),
      cvUrl: nullIfBlank(uploadedCvUrl ?? profileForm.cvUrl),
      portfolioUrl: nullIfBlank(profileForm.portfolioUrl),
    };
  }

  async function buildOwnerPayload() {
    const profilePayload = await buildProfilePayload();

    return {
      name: ownerForm.name,
      firstName: ownerForm.firstName,
      age: Number(ownerForm.age),
      active: ownerForm.active,
      address: ownerForm.address,
      contacts: sanitizeContactRows(ownerForm.contacts),
      versionTag: ownerForm.versionTag,
      versionLabel: ownerForm.versionLabel,
      versionDescription: ownerForm.versionDescription,
      versionPublished: ownerForm.versionPublished,
      prof: profilePayload,
      timeline: {
        ...timelineForm,
        experiences,
      },
      projects,
    };
  }

  function buildOwnerIdentityPayload() {
    return {
      name: ownerForm.name,
      firstName: ownerForm.firstName,
      age: Number(ownerForm.age),
      active: ownerForm.active,
      address: ownerForm.address,
      contacts: sanitizeContactRows(ownerForm.contacts),
      versionTag: null,
      versionLabel: null,
      versionDescription: null,
      versionPublished: null,
      prof: null,
      timeline: null,
      projects: null,
    };
  }

  async function buildVersionPayload({ includeContent = true } = {}) {
    const profilePayload = includeContent ? await buildProfilePayload() : null;

    return {
      versionTag: versionForm.versionTag,
      label: versionForm.label,
      description: versionForm.description,
      active: versionForm.active,
      published: versionForm.published,
      prof: includeContent ? profilePayload : null,
      timeline: includeContent
        ? {
            ...timelineForm,
            experiences,
          }
        : null,
      projects: includeContent ? projects : null,
    };
  }

  async function buildExperiencePayload() {
    const uploadedImageUrl = await uploadFile(experienceFiles.image);

    return {
      category: experienceForm.category,
      title: experienceForm.title,
      organization: experienceForm.organization,
      location: experienceForm.location,
      summary: experienceForm.summary,
      description: experienceForm.description,
      startDate: experienceForm.startDate,
      endDate: experienceForm.currentPosition ? null : experienceForm.endDate || null,
      currentPosition: experienceForm.currentPosition,
      imageUrl: nullIfBlank(uploadedImageUrl ?? experienceForm.imageUrl),
      websiteUrl: nullIfBlank(experienceForm.websiteUrl),
      skills: toArray(experienceForm.skills),
      displayOrder: Number(experienceForm.displayOrder),
    };
  }

  async function buildProjectPayload() {
    const uploadedImageUrl = await uploadFile(projectFiles.image);
    const uploadedDocumentationUrl = await uploadFile(projectFiles.documentation);

    const documentationUrl = nullIfBlank(
      uploadedDocumentationUrl ?? projectForm.documentationUrl,
    );
    const architectureUrl = nullIfBlank(projectForm.architectureUrl);

    return {
      title: projectForm.title,
      subtitle: projectForm.subtitle,
      shortDescription: projectForm.shortDescription,
      description: projectForm.description,
      status: projectForm.status,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate || null,
      imageUrl: nullIfBlank(uploadedImageUrl ?? projectForm.imageUrl),
      demoUrl: nullIfBlank(projectForm.demoUrl),
      githubUrl: nullIfBlank(projectForm.githubUrl),
      documentationUrl,
      architectureUrl,
      slug: nullIfBlank(projectForm.slug),
      stacks: toArray(projectForm.stacks),
      features: toArray(projectForm.features),
      links: [
        { type: "GITHUB", label: "GitHub", url: nullIfBlank(projectForm.githubUrl) },
        { type: "ARCHITECTURE", label: "Architecture", url: architectureUrl },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => link.url),
      proofTags: toArray(projectForm.proofTags),
      caseStudy: buildProjectCaseStudyPayload(projectForm.caseStudy),
      featured: projectForm.featured,
      published: projectForm.published,
      displayOrder: Number(projectForm.displayOrder),
      websiteVersionId: selectedVersionId ? Number(selectedVersionId) : null,
    };
  }

  async function createOwner() {
    await runAction(async () => {
      const payload = await buildOwnerPayload();
      await apiRequest("POST", "/manager", payload);
      await refreshOwners({ selectLast: true });
    }, "Owner créé avec sa première version.");
  }

  async function updateOwner() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un profil.");
      return;
    }

    await runAction(async () => {
      const payload = buildOwnerIdentityPayload();
      await apiRequest("PUT", `/manager/${selectedOwnerId}`, payload);

      const ownerList = await fetchOwners();
      const updatedOwner = ownerList.find(
        (owner) => String(getEntityId(owner)) === String(selectedOwnerId),
      );

      setOwners(ownerList);
      setOwnerForm(hydrateOwnerForm(updatedOwner));
    }, "Identité et contacts enregistrés.");
  }

  async function createVersion() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un profil.");
      return;
    }

    await runAction(async () => {
      const payload = await buildVersionPayload({ includeContent: true });
      const createdVersion = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions`,
        payload,
      );
      await refreshVersions(selectedOwnerId, getEntityId(createdVersion));
    }, "Version créée avec le contenu du formulaire.");
  }

  async function cloneVersion() {
    if (!selectedOwnerId || !cloneSourceVersionId) {
      setError("Sélectionne un owner et une version source à importer.");
      return;
    }

    await runAction(async () => {
      const payload = await buildVersionPayload({ includeContent: false });
      const createdVersion = await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/from/${cloneSourceVersionId}`,
        payload,
      );
      await refreshVersions(selectedOwnerId, getEntityId(createdVersion));
    }, "Nouvelle version créée en important le contenu de la version source.");
  }

  async function updateVersionMetadata() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}`,
        versionForm,
      );
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Métadonnées de version mises à jour.");
  }

  async function activateVersion(versionId = selectedVersionId) {
    if (!selectedOwnerId || !versionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${versionId}/activate`,
      );
      await refreshVersions(selectedOwnerId, versionId);
    }, "Version activée.");
  }

  async function deleteVersion(versionId = selectedVersionId) {
    if (!selectedOwnerId || !versionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "DELETE",
        `/manager/${selectedOwnerId}/versions/${versionId}`,
      );
      await refreshVersions(selectedOwnerId);
    }, "Version supprimée.");
  }

  async function saveProfile() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      const payload = await buildProfilePayload();
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/profile`,
        payload,
      );
      setProfileForm(payload);
      setProfileFiles(emptyProfileFiles);
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Profil enregistré avec les fichiers uploadés.");
  }

  async function saveTimeline() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/timeline`,
        {
          ...timelineForm,
          experiences,
        },
      );
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Timeline enregistrée.");
  }

  async function addProject() {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return;
    }

    await runAction(async () => {
      const payload = await buildProjectPayload();
      await apiRequest(
        "POST",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects`,
        payload,
      );
      setProjectFiles(emptyProjectFiles);
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Projet ajouté à la version.");
  }

  async function updateProject() {
    if (!selectedOwnerId || !selectedVersionId || !selectedProjectId) {
      setError("Sélectionne un owner, une version et un projet à modifier.");
      return;
    }

    await runAction(async () => {
      const payload = await buildProjectPayload();
      const updatedProject = await apiRequest(
        "PUT",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects/${selectedProjectId}`,
        payload,
      );
      setProjectFiles(emptyProjectFiles);
      await refreshVersions(selectedOwnerId, selectedVersionId);
      setSelectedProjectId(String(getProjectId(updatedProject)));
      setProjectForm(hydrateProjectForm(updatedProject));
      setProjectMode("edit");
    }, "Projet mis à jour.");
  }

  async function deleteProject() {
    if (!selectedOwnerId || !selectedVersionId || !selectedProjectId) {
      setError("Sélectionne un projet à supprimer.");
      return;
    }

    await runAction(async () => {
      await apiRequest(
        "DELETE",
        `/manager/${selectedOwnerId}/versions/${selectedVersionId}/projects/${selectedProjectId}`,
      );
      await refreshVersions(selectedOwnerId, selectedVersionId);
    }, "Projet supprimé de la version.");
  }

  async function addExperienceLocally() {
    await runAction(async () => {
      const payload = await buildExperiencePayload();
      const next = normalizeExperienceOrder([...experiences, payload]);
      setExperiences(next);
      resetExperienceForm(next);
    }, "Expérience ajoutée dans la liste. Pense à enregistrer la timeline complète.");
  }

  async function updateExperienceLocally() {
    if (selectedExperienceIndex === null || selectedExperienceIndex < 0 || selectedExperienceIndex >= experiences.length) {
      setError("Sélectionne une expérience à modifier.");
      return;
    }

    await runAction(async () => {
      const payload = await buildExperiencePayload();
      const next = experiences.map((item, index) => (index === selectedExperienceIndex ? payload : item));
      const normalizedNext = normalizeExperienceOrder(next);
      setExperiences(normalizedNext);
      resetExperienceForm(normalizedNext);
    }, "Expérience mise à jour dans la liste. Pense à enregistrer la timeline complète.");
  }

  function duplicateExperience(indexToDuplicate) {
    const source = experiences[indexToDuplicate];
    if (!source) return;

    const duplicated = {
      ...source,
      title: source.title ? `${source.title} — copie` : "Nouvelle expérience copiée",
      displayOrder: experiences.length + 1,
    };

    const next = normalizeExperienceOrder([...experiences, duplicated]);
    setExperiences(next);
    selectExperience(next.length - 1, next);
    setMessage("Expérience copiée dans la liste. Pense à enregistrer la timeline complète.");
    setError(null);
  }

  function moveExperience(indexToMove, direction) {
    const targetIndex = indexToMove + direction;
    if (targetIndex < 0 || targetIndex >= experiences.length) return;

    const next = [...experiences];
    const [item] = next.splice(indexToMove, 1);
    next.splice(targetIndex, 0, item);
    const normalizedNext = normalizeExperienceOrder(next);
    setExperiences(normalizedNext);
    if (selectedExperienceIndex === indexToMove) {
      selectExperience(targetIndex, normalizedNext);
    }
  }

  function removeExperience(indexToRemove) {
    const next = normalizeExperienceOrder(experiences.filter((_, index) => index !== indexToRemove));
    setExperiences(next);
    resetExperienceForm(next);
  }

  function resetAdminState() {
    setOwners([]);
    setVersions([]);
    setProjects([]);
    setSelectedOwnerId(null);
    setSelectedVersionId(null);
    setSelectedProjectId(null);
    setCloneSourceVersionId(null);
    setOwnerForm(hydrateOwnerForm(null));
    setExperiences([]);
    resetExperienceForm([]);
    resetProjectForm([]);
  }


  async function handleLogout() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await logoutAdmin();
      resetAdminState();
      window.location.replace(buildBackendUrl("/login?logout"));
    } catch (err) {
      setError(err?.message ?? "Déconnexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return {
    buildProfilePayload,
    buildOwnerPayload,
    buildOwnerIdentityPayload,
    buildVersionPayload,
    buildExperiencePayload,
    buildProjectPayload,
    createOwner,
    updateOwner,
    createVersion,
    cloneVersion,
    updateVersionMetadata,
    activateVersion,
    deleteVersion,
    saveProfile,
    saveTimeline,
    addProject,
    updateProject,
    deleteProject,
    addExperienceLocally,
    updateExperienceLocally,
    duplicateExperience,
    moveExperience,
    removeExperience,
    resetAdminState,
    handleLogout
  };
}
