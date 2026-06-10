import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  FileInput,
  Group,
  Loader,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT ?? "/uploads/";

const emptyOwnerForm = {
  name: "ACHABOU",
  firstName: "Idris",
  age: 23,
  active: true,
  address: "Paris, France",
  email: "idris.achabou@example.com",
  github: "https://github.com/idris-ach2002",
  linkedin: "https://www.linkedin.com/in/idris-achabou",
  portfolio: "https://portfolio.example.com",
  versionTag: "v1",
  versionLabel: "Version initiale",
  versionDescription: "Première version du portfolio.",
  versionPublished: true,
};

const emptyVersionForm = {
  versionTag: "v2",
  label: "Version alternance 2026",
  description: "Version orientée recherche d’alternance.",
  active: false,
  published: true,
};

const emptyProfileForm = {
  title: "Développeur Full Stack",
  subtitle: "Java / Spring Boot / React",
  headline: "Étudiant en informatique spécialisé en ingénierie logicielle.",
  shortDescription: "Portfolio professionnel orienté développement logiciel.",
  description:
    "Je conçois des applications web robustes avec une architecture claire, un backend Spring Boot et un frontend React moderne.",
  location: "Paris, Île-de-France",
  availability: "Disponible pour une alternance à partir de septembre 2026",
  profileImageUrl: "",
  logoUrl: "",
  cvUrl: "",
  portfolioUrl: "https://example.com",
};

const emptyTimelineForm = {
  title: "Parcours",
  description: "Formation, expériences et projets structurants.",
};

const emptyExperienceForm = {
  category: "SCHOOL",
  title: "Master Informatique STL",
  organization: "Sorbonne Université",
  location: "Paris",
  summary: "Formation en science et technologie du logiciel.",
  description:
    "Approfondissement en architecture logicielle, développement avancé et systèmes concurrents.",
  startDate: "2025-09-01",
  endDate: "2027-09-01",
  currentPosition: true,
  imageUrl: "",
  websiteUrl: "https://www.sorbonne-universite.fr",
  skills: "Java, Spring Boot, Architecture logicielle",
  displayOrder: 1,
};

const emptyProjectForm = {
  title: "Portfolio professionnel",
  subtitle: "Spring Boot / React / PostgreSQL",
  shortDescription: "Portfolio dynamique alimenté par une API Spring Boot.",
  description:
    "Application permettant de gérer un profil, des expériences, des projets et plusieurs versions du site.",
  status: "IN_PROGRESS",
  startDate: "2026-01-01",
  endDate: "",
  imageUrl: "",
  demoUrl: "https://portfolio.example.com",
  githubUrl: "https://github.com/idris-ach2002/portfolio",
  documentationUrl: "",
  stacks: "Java, Spring Boot, React, PostgreSQL, Docker",
  features: "Versioning, Version active unique, Admin panel, API REST",
  featured: true,
  published: true,
  displayOrder: 1,
};

const emptyProfileFiles = {
  profileImage: null,
  logo: null,
  cv: null,
};

const emptyExperienceFiles = {
  image: null,
};

const emptyProjectFiles = {
  image: null,
  documentation: null,
};

const experienceCategories = [
  "SCHOOL",
  "INTERNSHIP",
  "ALTERNANCE",
  "VOLUNTEERING",
  "CDI",
  "CDD",
];

const projectStatuses = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "MAINTAINED",
  "ARCHIVED",
];

function toArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEntityId(entity) {
  return entity?.ownerId ?? entity?.id ?? entity?.websiteVersionId;
}

function getOwnerLabel(owner) {
  const fullName = [owner?.firstName, owner?.name].filter(Boolean).join(" ");
  return fullName || `Owner ${getEntityId(owner)}`;
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}


function nullIfBlank(value) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrlFromUpload(data) {
  if (!data) return null;

  if (typeof data === "string") {
    if (data.startsWith("http://") || data.startsWith("https://")) return data;
    if (data.startsWith("/")) return `${window.location.origin}${data}`;
    return data;
  }

  return (
    data.url ??
    data.fileUrl ??
    data.path ??
    data.location ??
    data.href ??
    data.downloadUrl ??
    null
  );
}

async function apiRequest(method, path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : (data?.message ??
            `Erreur HTTP ${response.status} sur ${method} ${path}`),
    );
  }

  return data;
}

async function uploadFile(file) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : (data?.message ?? `Erreur upload fichier HTTP ${response.status}`),
    );
  }

  const uploadedUrl = normalizeUrlFromUpload(data);

  if (!uploadedUrl || String(uploadedUrl).startsWith("redirect:")) {
    throw new Error(
      "La route d’upload doit retourner une URL JSON exploitable, par exemple { url: \"http://...\" }.",
    );
  }

  return uploadedUrl;
}

function hydrateProfileForm(profile) {
  if (!profile) return emptyProfileForm;

  return {
    title: profile.title ?? "",
    subtitle: profile.subtitle ?? "",
    headline: profile.headline ?? "",
    shortDescription: profile.shortDescription ?? "",
    description: profile.description ?? "",
    location: profile.location ?? "",
    availability: profile.availability ?? "",
    profileImageUrl: profile.profileImageUrl ?? "",
    logoUrl: profile.logoUrl ?? "",
    cvUrl: profile.cvUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
  };
}

function hydrateTimelineForm(timeline) {
  return {
    title: timeline?.title ?? emptyTimelineForm.title,
    description: timeline?.description ?? emptyTimelineForm.description,
  };
}

function hydrateExperiences(timeline) {
  return (timeline?.experiences ?? []).map((experience, index) => ({
    category: experience.category ?? "SCHOOL",
    title: experience.title ?? "",
    organization: experience.organization ?? "",
    location: experience.location ?? "",
    summary: experience.summary ?? "",
    description: experience.description ?? "",
    startDate: normalizeDate(experience.startDate),
    endDate: normalizeDate(experience.endDate),
    currentPosition: Boolean(experience.currentPosition),
    imageUrl: experience.imageUrl ?? "",
    websiteUrl: experience.websiteUrl ?? "",
    skills: experience.skills ?? [],
    displayOrder: experience.displayOrder ?? index + 1,
  }));
}

function FileLink({ label, url }) {
  if (!url) return null;

  return (
    <Text size="xs" c="dimmed">
      {label} : {" "}
      <Anchor href={url} target="_blank" rel="noreferrer">
        ouvrir le fichier actuel
      </Anchor>
    </Text>
  );
}

export default function Admin() {
  const rootRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [owners, setOwners] = useState([]);
  const [versions, setVersions] = useState([]);

  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [timelineForm, setTimelineForm] = useState(emptyTimelineForm);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);
  const [experiences, setExperiences] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  const [profileFiles, setProfileFiles] = useState(emptyProfileFiles);
  const [experienceFiles, setExperienceFiles] = useState(emptyExperienceFiles);
  const [projectFiles, setProjectFiles] = useState(emptyProjectFiles);

  const selectedVersion = useMemo(
    () =>
      versions.find(
        (version) => String(getEntityId(version)) === String(selectedVersionId),
      ),
    [versions, selectedVersionId],
  );

  useGsap(rootRef, (gsap) => {
    gsap.from(".admin-hero-card", {
      y: 34,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
    });

    gsap.from(".admin-context-card, .admin-tabs-card", {
      y: 30,
      autoAlpha: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.12,
    });

    gsap.to(".admin-orb", {
      y: -16,
      x: 12,
      duration: 5.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.45,
    });
  }, []);

  function updateOwnerForm(field, value) {
    setOwnerForm((current) => ({ ...current, [field]: value }));
  }

  function updateVersionForm(field, value) {
    setVersionForm((current) => ({ ...current, [field]: value }));
  }

  function updateProfileForm(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function updateTimelineForm(field, value) {
    setTimelineForm((current) => ({ ...current, [field]: value }));
  }

  function updateExperienceForm(field, value) {
    setExperienceForm((current) => ({ ...current, [field]: value }));
  }

  function updateProjectForm(field, value) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function hydrateVersionForms(version) {
    if (!version) {
      setProfileForm(emptyProfileForm);
      setTimelineForm(emptyTimelineForm);
      setExperiences([]);
      return;
    }

    setVersionForm({
      versionTag: version.versionTag ?? "",
      label: version.label ?? "",
      description: version.description ?? "",
      active: Boolean(version.active),
      published: Boolean(version.published),
    });

    setProfileForm(hydrateProfileForm(version.prof));
    setTimelineForm(hydrateTimelineForm(version.timeline));
    setExperiences(hydrateExperiences(version.timeline));
  }

  function selectVersion(versionId, sourceVersions = versions) {
    const version = sourceVersions.find(
      (item) => String(getEntityId(item)) === String(versionId),
    );

    setSelectedVersionId(versionId ? String(versionId) : null);
    hydrateVersionForms(version);
  }

  async function fetchOwners() {
    const data = await apiRequest("GET", "/manager");
    return Array.isArray(data) ? data : [];
  }

  async function fetchVersions(ownerId) {
    if (!ownerId) return [];
    const data = await apiRequest("GET", `/manager/${ownerId}/versions`);
    return Array.isArray(data) ? data : [];
  }

  async function runAction(action, successMessage) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await action();
      if (successMessage) setMessage(successMessage);
      return result;
    } catch (err) {
      setError(err?.message ?? "Une erreur est survenue.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function refreshOwners({ selectLast = false } = {}) {
    return runAction(async () => {
      const ownerList = await fetchOwners();
      setOwners(ownerList);

      const targetOwner = selectLast ? ownerList.at(-1) : ownerList[0];
      const targetOwnerId = getEntityId(targetOwner);

      if (targetOwnerId) {
        setSelectedOwnerId(String(targetOwnerId));
        const versionList = await fetchVersions(targetOwnerId);
        setVersions(versionList);
        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
      }

      return ownerList;
    }, "Owners chargés.");
  }

  async function refreshVersions(ownerId = selectedOwnerId) {
    if (!ownerId) {
      setError("Sélectionne d’abord un owner.");
      return null;
    }

    return runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
      return versionList;
    }, "Versions chargées.");
  }

  async function handleOwnerChange(ownerId) {
    setSelectedOwnerId(ownerId);
    setSelectedVersionId(null);
    setVersions([]);

    if (!ownerId) return;

    await runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(String(getEntityId(activeVersion ?? firstVersion ?? {})), versionList);
    }, "Versions du owner chargées.");
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchOwners()])
      .then(async ([ownerList]) => {
        if (cancelled) return;

        const firstOwner = ownerList[0];
        const firstOwnerId = getEntityId(firstOwner);
        let versionList = [];

        if (firstOwnerId) {
          versionList = await fetchVersions(firstOwnerId);
        }

        if (cancelled) return;

        setOwners(ownerList);
        setSelectedOwnerId(firstOwnerId ? String(firstOwnerId) : null);
        setVersions(versionList);

        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        const versionToSelect = activeVersion ?? firstVersion;

        if (versionToSelect) {
          setSelectedVersionId(String(getEntityId(versionToSelect)));
          hydrateVersionForms(versionToSelect);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Impossible de charger les données admin.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      contacts: [
        { type: "EMAIL", value: ownerForm.email },
        { type: "GITHUB", value: ownerForm.github },
        { type: "LINKEDIN", value: ownerForm.linkedin },
        { type: "PORTFOLIO", value: ownerForm.portfolio },
      ].filter((contact) => contact.value),
      versionTag: ownerForm.versionTag,
      versionLabel: ownerForm.versionLabel,
      versionDescription: ownerForm.versionDescription,
      versionPublished: ownerForm.versionPublished,
      prof: profilePayload,
      timeline: {
        ...timelineForm,
        experiences,
      },
      projects: [],
    };
  }

  async function buildVersionPayload() {
    const profilePayload = await buildProfilePayload();

    return {
      versionTag: versionForm.versionTag,
      label: versionForm.label,
      description: versionForm.description,
      active: versionForm.active,
      published: versionForm.published,
      prof: profilePayload,
      timeline: {
        ...timelineForm,
        experiences,
      },
      projects: [],
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
      stacks: toArray(projectForm.stacks),
      features: toArray(projectForm.features),
      links: [
        { type: "GITHUB", label: "Code source", url: nullIfBlank(projectForm.githubUrl) },
        { type: "DEMO", label: "Démo", url: nullIfBlank(projectForm.demoUrl) },
        { type: "DOCUMENTATION", label: "Documentation", url: documentationUrl },
      ].filter((link) => link.url),
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

  async function createVersion() {
    if (!selectedOwnerId) {
      setError("Sélectionne d’abord un owner.");
      return;
    }

    await runAction(async () => {
      const payload = await buildVersionPayload();
      await apiRequest("POST", `/manager/${selectedOwnerId}/versions`, payload);
      await refreshVersions(selectedOwnerId);
    }, "Version créée.");
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
      await refreshVersions(selectedOwnerId);
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
      await refreshVersions(selectedOwnerId);
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
      await refreshVersions(selectedOwnerId);
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
      await refreshVersions(selectedOwnerId);
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
      setProjectForm((current) => ({
        ...current,
        title: "",
        subtitle: "",
        shortDescription: "",
        description: "",
        imageUrl: "",
        documentationUrl: "",
        displayOrder: Number(current.displayOrder) + 1,
      }));
      await refreshVersions(selectedOwnerId);
    }, "Projet ajouté à la version.");
  }

  async function addExperienceLocally() {
    await runAction(async () => {
      const payload = await buildExperiencePayload();
      setExperiences((current) => [...current, payload]);
      setExperienceForm((current) => ({
        ...emptyExperienceForm,
        displayOrder: Number(current.displayOrder) + 1,
      }));
      setExperienceFiles(emptyExperienceFiles);
    }, "Expérience ajoutée localement. Pense à enregistrer la timeline.");
  }

  function removeExperience(indexToRemove) {
    setExperiences((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  }

  const activeVersionsCount = versions.filter((version) => version.active).length;
  const selectedVersionProjectsCount = selectedVersion?.projects?.length ?? 0;
  const selectedVersionExperiencesCount =
    selectedVersion?.timeline?.experiences?.length ?? experiences.length;

  return (
    <main ref={rootRef} className="admin-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />

      <Stack gap="xl" className="admin-shell">
        <Paper withBorder radius="xl" p="xl" className="admin-hero-card">
          <Group justify="space-between" align="flex-start" gap="xl">
            <Stack gap="xs" maw={820}>
              <Badge variant="light" className="admin-kicker">
                Administration portfolio
              </Badge>
              <Title order={1} className="admin-title">
                Console de contenu & versions
              </Title>
              <Text c="dimmed" size="lg">
                Pilote les owners, les versions du site, les fichiers uploadés,
                le profil, la timeline et les projets. Les assets passent par le
                backend d’upload avant d’être injectés dans les DTO.
              </Text>
            </Stack>

            <Stack gap="xs" className="admin-hero-actions">
              <Button onClick={() => refreshOwners()} loading={loading} variant="light">
                Recharger les données
              </Button>
              <Button component="a" href="/" variant="subtle">
                Voir le site public
              </Button>
            </Stack>
          </Group>
        </Paper>

        {(loading || message || error) && (
          <Stack gap="sm">
            {loading && (
              <Alert variant="light" className="admin-alert">
                <Group>
                  <Loader size="sm" />
                  <Text>Traitement en cours…</Text>
                </Group>
              </Alert>
            )}

            {message && (
              <Alert color="green" variant="light" className="admin-alert">
                {message}
              </Alert>
            )}

            {error && (
              <Alert color="red" variant="light" className="admin-alert">
                {error}
              </Alert>
            )}
          </Stack>
        )}

        <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-context-card">
          <Stack>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>Contexte de modification</Text>
                <Text size="sm" c="dimmed">
                  Sélectionne un owner puis la version à administrer.
                </Text>
              </div>

              <Group gap="xs">
                <Badge color={activeVersionsCount === 1 ? "green" : "red"} variant="light">
                  {activeVersionsCount} active
                </Badge>
                <Badge variant="light">
                  {versions.length} version{versions.length > 1 ? "s" : ""}
                </Badge>
                <Badge variant="light">
                  {selectedVersionProjectsCount} projet{selectedVersionProjectsCount > 1 ? "s" : ""}
                </Badge>
                <Badge variant="light">
                  {selectedVersionExperiencesCount} expérience{selectedVersionExperiencesCount > 1 ? "s" : ""}
                </Badge>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Select
                label="Owner"
                placeholder="Choisir un owner"
                data={owners.map((owner) => ({
                  value: String(getEntityId(owner)),
                  label: getOwnerLabel(owner),
                }))}
                value={selectedOwnerId}
                onChange={handleOwnerChange}
                searchable
              />

              <Select
                label="Version"
                placeholder="Choisir une version"
                data={versions.map((version) => ({
                  value: String(getEntityId(version)),
                  label: `${version.versionTag ?? "version"} — ${
                    version.label ?? "Sans label"
                  }${version.active ? " — active" : ""}`,
                }))}
                value={selectedVersionId}
                onChange={(value) => selectVersion(value)}
                searchable
              />
            </SimpleGrid>

            <Group>
              <Button
                variant="light"
                onClick={() => refreshVersions(selectedOwnerId)}
                disabled={!selectedOwnerId}
              >
                Recharger versions
              </Button>

              <Button
                color="green"
                onClick={() => activateVersion()}
                disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}
              >
                Activer cette version
              </Button>

              <Button
                color="red"
                variant="light"
                onClick={() => deleteVersion()}
                disabled={!selectedOwnerId || !selectedVersionId || selectedVersion?.active}
              >
                Supprimer version inactive
              </Button>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="xl" radius="xl" withBorder className="admin-tabs-card">
          <Tabs defaultValue="profile" variant="outline" radius="md" className="admin-tabs">
            <Tabs.List>
              <Tabs.Tab value="owner">Owner</Tabs.Tab>
              <Tabs.Tab value="version">Versions</Tabs.Tab>
              <Tabs.Tab value="profile">Profil & fichiers</Tabs.Tab>
              <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
              <Tabs.Tab value="project">Projets</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="owner" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Créer un owner avec version initiale</Text>
                    <Text size="sm" c="dimmed">
                      La première version embarque le profil, la timeline et les fichiers déjà sélectionnés.
                    </Text>
                  </div>
                  <Badge variant="light">POST /manager</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Nom" value={ownerForm.name} onChange={(event) => updateOwnerForm("name", event.currentTarget.value)} />
                  <TextInput label="Prénom" value={ownerForm.firstName} onChange={(event) => updateOwnerForm("firstName", event.currentTarget.value)} />
                  <NumberInput label="Âge" value={ownerForm.age} onChange={(value) => updateOwnerForm("age", value ?? 0)} />
                  <TextInput label="Adresse" value={ownerForm.address} onChange={(event) => updateOwnerForm("address", event.currentTarget.value)} />
                  <TextInput label="Email" value={ownerForm.email} onChange={(event) => updateOwnerForm("email", event.currentTarget.value)} />
                  <TextInput label="GitHub" value={ownerForm.github} onChange={(event) => updateOwnerForm("github", event.currentTarget.value)} />
                  <TextInput label="LinkedIn" value={ownerForm.linkedin} onChange={(event) => updateOwnerForm("linkedin", event.currentTarget.value)} />
                  <TextInput label="Portfolio" value={ownerForm.portfolio} onChange={(event) => updateOwnerForm("portfolio", event.currentTarget.value)} />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <TextInput label="Tag première version" value={ownerForm.versionTag} onChange={(event) => updateOwnerForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label première version" value={ownerForm.versionLabel} onChange={(event) => updateOwnerForm("versionLabel", event.currentTarget.value)} />
                  <Switch label="Owner actif" checked={ownerForm.active} onChange={(event) => updateOwnerForm("active", event.currentTarget.checked)} />
                </SimpleGrid>

                <Textarea label="Description première version" minRows={3} value={ownerForm.versionDescription} onChange={(event) => updateOwnerForm("versionDescription", event.currentTarget.value)} />

                <Checkbox label="Publier la première version" checked={ownerForm.versionPublished} onChange={(event) => updateOwnerForm("versionPublished", event.currentTarget.checked)} />

                <Button onClick={createOwner} loading={loading} size="md">
                  Créer owner + version initiale
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="version" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Créer ou modifier une version</Text>
                    <Text size="sm" c="dimmed">
                      L’activation passe toujours par la route dédiée pour garder une seule version active.
                    </Text>
                  </div>
                  <Badge variant="light">WebsiteVersion</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Version tag" value={versionForm.versionTag} onChange={(event) => updateVersionForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label" value={versionForm.label} onChange={(event) => updateVersionForm("label", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description" minRows={3} value={versionForm.description} onChange={(event) => updateVersionForm("description", event.currentTarget.value)} />

                <Group>
                  <Switch label="Active à la création" checked={versionForm.active} onChange={(event) => updateVersionForm("active", event.currentTarget.checked)} />
                  <Switch label="Published" checked={versionForm.published} onChange={(event) => updateVersionForm("published", event.currentTarget.checked)} />
                </Group>

                <Group>
                  <Button onClick={createVersion} disabled={!selectedOwnerId}>Créer version</Button>
                  <Button variant="light" onClick={updateVersionMetadata} disabled={!selectedOwnerId || !selectedVersionId}>Modifier métadonnées</Button>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {versions.map((version) => (
                    <Card key={getEntityId(version)} withBorder padding="md" radius="lg" className="admin-version-card">
                      <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                          <div>
                            <Text fw={800}>{version.versionTag} — {version.label}</Text>
                            <Text size="sm" c="dimmed">{version.description || "Aucune description"}</Text>
                          </div>
                          {version.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}
                        </Group>
                        <Group>
                          <Button size="xs" variant="light" onClick={() => selectVersion(String(getEntityId(version)))}>Sélectionner</Button>
                          <Button size="xs" color="green" onClick={() => activateVersion(getEntityId(version))} disabled={version.active}>Activer</Button>
                          <Button size="xs" color="red" variant="light" onClick={() => deleteVersion(getEntityId(version))} disabled={version.active}>Supprimer</Button>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="profile" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Profil de la version sélectionnée</Text>
                    <Text size="sm" c="dimmed">
                      Les images et le CV sont uploadés via le backend avant sauvegarde.
                    </Text>
                  </div>
                  <Badge variant="light">PUT /profile</Badge>
                </Group>

                <Divider />

                <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={800}>Fichiers du profil</Text>
                      <Badge variant="light">Upload</Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                      <Stack gap="xs">
                        <FileInput
                          label="Photo de profil"
                          placeholder="Uploader une image"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          value={profileFiles.profileImage}
                          onChange={(file) => setProfileFiles((current) => ({ ...current, profileImage: file }))}
                        />
                        <FileLink label="Photo actuelle" url={profileForm.profileImageUrl} />
                      </Stack>

                      <Stack gap="xs">
                        <FileInput
                          label="Logo"
                          placeholder="Uploader un logo"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          value={profileFiles.logo}
                          onChange={(file) => setProfileFiles((current) => ({ ...current, logo: file }))}
                        />
                        <FileLink label="Logo actuel" url={profileForm.logoUrl} />
                      </Stack>

                      <Stack gap="xs">
                        <FileInput
                          label="CV PDF"
                          placeholder="Uploader un PDF"
                          accept="application/pdf"
                          value={profileFiles.cv}
                          onChange={(file) => setProfileFiles((current) => ({ ...current, cv: file }))}
                        />
                        <FileLink label="CV actuel" url={profileForm.cvUrl} />
                      </Stack>
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {[
                    ["title", "Titre"],
                    ["subtitle", "Sous-titre"],
                    ["headline", "Headline"],
                    ["shortDescription", "Description courte"],
                    ["location", "Localisation"],
                    ["availability", "Disponibilité"],
                    ["portfolioUrl", "Portfolio URL"],
                  ].map(([field, label]) => (
                    <TextInput key={field} label={label} value={profileForm[field]} onChange={(event) => updateProfileForm(field, event.currentTarget.value)} />
                  ))}
                </SimpleGrid>

                <Textarea label="Description complète" minRows={5} value={profileForm.description} onChange={(event) => updateProfileForm("description", event.currentTarget.value)} />

                <Button onClick={saveProfile} disabled={!selectedOwnerId || !selectedVersionId}>
                  Enregistrer profil
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Timeline et expériences</Text>
                    <Text size="sm" c="dimmed">
                      Ajoute les expériences localement, puis sauvegarde la timeline complète.
                    </Text>
                  </div>
                  <Badge variant="light">PUT /timeline</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Titre timeline" value={timelineForm.title} onChange={(event) => updateTimelineForm("title", event.currentTarget.value)} />
                  <TextInput label="Description timeline" value={timelineForm.description} onChange={(event) => updateTimelineForm("description", event.currentTarget.value)} />
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={800}>Nouvelle expérience</Text>
                      <Badge variant="light">Image uploadée</Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <Select label="Catégorie" data={experienceCategories} value={experienceForm.category} onChange={(value) => updateExperienceForm("category", value ?? "SCHOOL")} />
                      <TextInput label="Titre" value={experienceForm.title} onChange={(event) => updateExperienceForm("title", event.currentTarget.value)} />
                      <TextInput label="Organisation" value={experienceForm.organization} onChange={(event) => updateExperienceForm("organization", event.currentTarget.value)} />
                      <TextInput label="Localisation" value={experienceForm.location} onChange={(event) => updateExperienceForm("location", event.currentTarget.value)} />
                      <TextInput label="Date début" value={experienceForm.startDate} onChange={(event) => updateExperienceForm("startDate", event.currentTarget.value)} />
                      <TextInput label="Date fin" value={experienceForm.endDate} disabled={experienceForm.currentPosition} onChange={(event) => updateExperienceForm("endDate", event.currentTarget.value)} />
                      <FileInput
                        label="Image expérience"
                        placeholder="Uploader une image"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        value={experienceFiles.image}
                        onChange={(file) => setExperienceFiles({ image: file })}
                      />
                      <TextInput label="Site URL" value={experienceForm.websiteUrl} onChange={(event) => updateExperienceForm("websiteUrl", event.currentTarget.value)} />
                      <NumberInput label="Ordre d’affichage" value={experienceForm.displayOrder} onChange={(value) => updateExperienceForm("displayOrder", value ?? 1)} />
                      <TextInput label="Compétences séparées par des virgules" value={experienceForm.skills} onChange={(event) => updateExperienceForm("skills", event.currentTarget.value)} />
                    </SimpleGrid>

                    <Textarea label="Résumé" minRows={2} value={experienceForm.summary} onChange={(event) => updateExperienceForm("summary", event.currentTarget.value)} />
                    <Textarea label="Description" minRows={4} value={experienceForm.description} onChange={(event) => updateExperienceForm("description", event.currentTarget.value)} />
                    <Checkbox label="Poste actuel" checked={experienceForm.currentPosition} onChange={(event) => updateExperienceForm("currentPosition", event.currentTarget.checked)} />

                    <Group>
                      <Button variant="light" onClick={addExperienceLocally}>Ajouter expérience localement</Button>
                      <Button onClick={saveTimeline} disabled={!selectedOwnerId || !selectedVersionId}>Enregistrer timeline complète</Button>
                    </Group>
                  </Stack>
                </Paper>

                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={800}>Expériences de la timeline</Text>
                    <Badge variant="light">{experiences.length}</Badge>
                  </Group>

                  {experiences.map((experience, index) => (
                    <Card key={`${experience.title}-${index}`} withBorder padding="md" radius="lg" className="admin-list-card">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={700}>{experience.displayOrder}. {experience.title}</Text>
                          <Text size="sm" c="dimmed">{experience.organization} — {experience.category}</Text>
                          <Text size="sm">{experience.summary}</Text>
                          {experience.imageUrl && <FileLink label="Image" url={experience.imageUrl} />}
                        </div>
                        <Button size="xs" color="red" variant="light" onClick={() => removeExperience(index)}>Retirer</Button>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="project" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Ajouter un projet</Text>
                    <Text size="sm" c="dimmed">
                      Ajoute un projet à la version sélectionnée. Image et documentation PDF passent par l’upload.
                    </Text>
                  </div>
                  <Badge variant="light">POST /projects</Badge>
                </Group>

                <Divider />

                <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack gap="xs">
                      <FileInput
                        label="Image du projet"
                        placeholder="Uploader une image"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        value={projectFiles.image}
                        onChange={(file) => setProjectFiles((current) => ({ ...current, image: file }))}
                      />
                      <FileLink label="Image actuelle" url={projectForm.imageUrl} />
                    </Stack>
                    <Stack gap="xs">
                      <FileInput
                        label="Documentation PDF"
                        placeholder="Uploader un PDF"
                        accept="application/pdf"
                        value={projectFiles.documentation}
                        onChange={(file) => setProjectFiles((current) => ({ ...current, documentation: file }))}
                      />
                      <FileLink label="Documentation actuelle" url={projectForm.documentationUrl} />
                    </Stack>
                  </SimpleGrid>
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Titre" value={projectForm.title} onChange={(event) => updateProjectForm("title", event.currentTarget.value)} />
                  <TextInput label="Sous-titre" value={projectForm.subtitle} onChange={(event) => updateProjectForm("subtitle", event.currentTarget.value)} />
                  <Select label="Statut" data={projectStatuses} value={projectForm.status} onChange={(value) => updateProjectForm("status", value ?? "IN_PROGRESS")} />
                  <NumberInput label="Ordre d’affichage" value={projectForm.displayOrder} onChange={(value) => updateProjectForm("displayOrder", value ?? 1)} />
                  <TextInput label="Date début" value={projectForm.startDate} onChange={(event) => updateProjectForm("startDate", event.currentTarget.value)} />
                  <TextInput label="Date fin" value={projectForm.endDate} onChange={(event) => updateProjectForm("endDate", event.currentTarget.value)} />
                  <TextInput label="Demo URL" value={projectForm.demoUrl} onChange={(event) => updateProjectForm("demoUrl", event.currentTarget.value)} />
                  <TextInput label="GitHub URL" value={projectForm.githubUrl} onChange={(event) => updateProjectForm("githubUrl", event.currentTarget.value)} />
                  <TextInput label="Stacks séparées par des virgules" value={projectForm.stacks} onChange={(event) => updateProjectForm("stacks", event.currentTarget.value)} />
                  <TextInput label="Features séparées par des virgules" value={projectForm.features} onChange={(event) => updateProjectForm("features", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description courte" minRows={2} value={projectForm.shortDescription} onChange={(event) => updateProjectForm("shortDescription", event.currentTarget.value)} />
                <Textarea label="Description complète" minRows={5} value={projectForm.description} onChange={(event) => updateProjectForm("description", event.currentTarget.value)} />

                <Group>
                  <Checkbox label="Featured" checked={projectForm.featured} onChange={(event) => updateProjectForm("featured", event.currentTarget.checked)} />
                  <Checkbox label="Published" checked={projectForm.published} onChange={(event) => updateProjectForm("published", event.currentTarget.checked)} />
                </Group>

                <Button onClick={addProject} disabled={!selectedOwnerId || !selectedVersionId}>
                  Ajouter projet à la version
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </main>
  );
}
