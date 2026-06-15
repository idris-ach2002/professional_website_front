import {
  Alert,
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
import { FilePreviewButton } from "./FilePreview";
import {
  apiRequest,
  isAuthRequiredError,
  logoutAdmin,
  uploadProtectedFile,
} from "../services/authApi";

const contactTypeOptions = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE_NUMBER", label: "Téléphone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GITHUB", label: "GitHub" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "WEBSITE", label: "Site web" },
  { value: "TWITTER", label: "Twitter / X" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
];

const defaultOwnerContacts = [
  { type: "EMAIL", value: "idris.achabou@example.com" },
  { type: "GITHUB", value: "https://github.com/idris-ach2002" },
  { type: "LINKEDIN", value: "https://www.linkedin.com/in/idris-achabou" },
  { type: "PORTFOLIO", value: "https://portfolio.example.com" },
];

const emptyOwnerForm = {
  name: "ACHABOU",
  firstName: "Idris",
  age: 23,
  active: true,
  address: "Paris, France",
  contacts: defaultOwnerContacts,
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
  title: "Alternance ingénierie logicielle",
  subtitle: "Java / Spring Boot / React",
  headline: "Développement logiciel · Architecture backend · Interfaces produit",
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

function toCsv(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function getEntityId(entity) {
  return entity?.ownerId ?? entity?.id ?? entity?.websiteVersionId;
}

function getProjectId(project) {
  return project?.projectId ?? project?.id;
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

function createEmptyContact() {
  return { type: "EMAIL", value: "" };
}

function cloneContactRows(contacts) {
  return (contacts ?? [])
    .map((contact) => ({
      type: contact?.type ?? "EMAIL",
      value: contact?.value ?? "",
    }))
    .filter((contact) => contact.type);
}

function sanitizeContactRows(contacts) {
  return cloneContactRows(contacts)
    .map((contact) => ({
      type: contact.type,
      value: String(contact.value ?? "").trim(),
    }))
    .filter((contact) => contact.value.length > 0);
}

function hydrateOwnerForm(owner) {
  const contacts = cloneContactRows(owner?.contacts ?? emptyOwnerForm.contacts);

  return {
    ...emptyOwnerForm,
    name: owner?.name ?? emptyOwnerForm.name,
    firstName: owner?.firstName ?? emptyOwnerForm.firstName,
    age: owner?.age ?? emptyOwnerForm.age,
    active: owner?.active ?? emptyOwnerForm.active,
    address: owner?.address ?? emptyOwnerForm.address,
    contacts: contacts.length > 0 ? contacts : [createEmptyContact()],
  };
}

function normalizeUrlFromUpload(data) {
  if (!data) return null;

  if (typeof data === "string") {
    if (data.startsWith("http://") || data.startsWith("https://")) return data;
    if (data.startsWith("/")) return `${window.location.origin}${data}`;
    return data;
  }

  return (
    data.directUrl ??
    data.url ??
    data.fileUrl ??
    data.path ??
    data.location ??
    data.href ??
    data.downloadUrl ??
    null
  );
}

async function uploadFile(file) {
  if (!file) return null;

  const data = await uploadProtectedFile(file);
  const uploadedUrl = normalizeUrlFromUpload(data);

  if (!uploadedUrl || String(uploadedUrl).startsWith("redirect:")) {
    throw new Error(
      "La route d’upload doit retourner une URL JSON exploitable, par exemple { url: \"http://...\" }.",
    );
  }

  return uploadedUrl;
}

function hydrateProfileForm(profile) {
  if (!profile) return { ...emptyProfileForm };

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

function hydrateProjectForm(project) {
  if (!project) return { ...emptyProjectForm };

  return {
    title: project.title ?? "",
    subtitle: project.subtitle ?? "",
    shortDescription: project.shortDescription ?? "",
    description: project.description ?? "",
    status: project.status ?? "IN_PROGRESS",
    startDate: normalizeDate(project.startDate),
    endDate: normalizeDate(project.endDate),
    imageUrl: project.imageUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    githubUrl: project.githubUrl ?? "",
    documentationUrl: project.documentationUrl ?? "",
    stacks: toCsv(project.stacks),
    features: toCsv(project.features),
    featured: Boolean(project.featured),
    published: project.published !== false,
    displayOrder: project.displayOrder ?? 1,
  };
}

function FileLink({ label, url, mode = "modal" }) {
  if (!url) return null;

  return (
    <Group gap="xs" align="center" className="admin-file-current-line">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <FilePreviewButton
        url={url}
        label="Voir"
        title={label}
        mode={mode}
        size="xs"
        variant="light"
        className="admin-file-preview-button"
      />
    </Group>
  );
}

function AdminAuthShell({ children }) {
  return (
    <main className="admin-page admin-auth-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />
      <Stack gap="xl" className="admin-shell admin-auth-shell">
        {children}
      </Stack>
    </main>
  );
}

function AdminChecking() {
  return (
    <AdminAuthShell>
      <Paper withBorder radius="xl" p="xl" className="admin-hero-card admin-auth-card">
        <Stack gap="md" align="center">
          <Loader size="md" />
          <Text fw={800}>Chargement du panel…</Text>
          <Text size="sm" c="dimmed" ta="center">
            Vérification de l’accès en cours.
          </Text>
        </Stack>
      </Paper>
    </AdminAuthShell>
  );
}

function AdminLoginRedirect() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

  return (
    <AdminAuthShell>
      <Paper withBorder radius="xl" p="xl" className="admin-hero-card admin-auth-card">
        <Stack gap="md" align="center">
          <Loader size="md" />
          <Text fw={800}>Redirection vers la connexion…</Text>
        </Stack>
      </Paper>
    </AdminAuthShell>
  );
}

export default function Admin() {
  const rootRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [authStatus, setAuthStatus] = useState("checking");

  const [owners, setOwners] = useState([]);
  const [versions, setVersions] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectMode, setProjectMode] = useState("create");
  const [cloneSourceVersionId, setCloneSourceVersionId] = useState(null);

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

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => String(getProjectId(project)) === String(selectedProjectId),
      ),
    [projects, selectedProjectId],
  );

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    if (!root) return undefined;

    const heroCard = root.querySelector(".admin-hero-card");
    const cards = root.querySelectorAll(".admin-context-card, .admin-tabs-card");
    const orbs = root.querySelectorAll(".admin-orb");

    if (heroCard) {
      gsap.from(heroCard, {
        y: 34,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }

    if (cards.length > 0) {
      gsap.from(cards, {
        y: 30,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.12,
      });
    }

    if (orbs.length > 0) {
      gsap.to(orbs, {
        y: -16,
        x: 12,
        duration: 5.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.45,
      });
    }

    return undefined;
  }, []);

  function updateOwnerForm(field, value) {
    setOwnerForm((current) => ({ ...current, [field]: value }));
  }

  function updateOwnerContact(index, field, value) {
    setOwnerForm((current) => ({
      ...current,
      contacts: current.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact,
      ),
    }));
  }

  function addOwnerContact() {
    setOwnerForm((current) => ({
      ...current,
      contacts: [...current.contacts, createEmptyContact()],
    }));
  }

  function removeOwnerContact(index) {
    setOwnerForm((current) => {
      const contacts = current.contacts.filter((_, contactIndex) => contactIndex !== index);
      return {
        ...current,
        contacts: contacts.length > 0 ? contacts : [createEmptyContact()],
      };
    });
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
      setVersionForm({ ...emptyVersionForm });
      setProfileForm({ ...emptyProfileForm });
      setTimelineForm({ ...emptyTimelineForm });
      setExperiences([]);
      setProjects([]);
      resetProjectForm();
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
    setProjects(version.projects ?? []);
    setCloneSourceVersionId(String(getEntityId(version)));
    resetProjectForm(version.projects ?? []);
  }

  function resetProjectForm(sourceProjects = projects) {
    setProjectMode("create");
    setSelectedProjectId(null);
    setProjectForm({
      ...emptyProjectForm,
      displayOrder: (sourceProjects?.length ?? 0) + 1,
    });
    setProjectFiles(emptyProjectFiles);
  }

  function selectProject(projectId, sourceProjects = projects) {
    const project = sourceProjects.find(
      (item) => String(getProjectId(item)) === String(projectId),
    );

    if (!project) {
      resetProjectForm();
      return;
    }

    setProjectMode("edit");
    setSelectedProjectId(String(getProjectId(project)));
    setProjectForm(hydrateProjectForm(project));
    setProjectFiles(emptyProjectFiles);
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

  async function fetchProjects(ownerId, versionId) {
    if (!ownerId || !versionId) return [];
    const data = await apiRequest(
      "GET",
      `/manager/${ownerId}/versions/${versionId}/projects`,
    );
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
      if (isAuthRequiredError(err)) {
        setAuthStatus("login");
        return null;
      }

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

      setOwnerForm(hydrateOwnerForm(targetOwner));

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

  async function refreshVersions(ownerId = selectedOwnerId, preferredVersionId = null) {
    if (!ownerId) {
      setError("Sélectionne d’abord un profil.");
      return null;
    }

    return runAction(async () => {
      const versionList = await fetchVersions(ownerId);
      setVersions(versionList);
      const preferredVersion = versionList.find(
        (version) => String(getEntityId(version)) === String(preferredVersionId),
      );
      const activeVersion = versionList.find((version) => version.active);
      const firstVersion = versionList[0];
      selectVersion(
        String(getEntityId(preferredVersion ?? activeVersion ?? firstVersion ?? {})),
        versionList,
      );
      return versionList;
    }, "Versions chargées.");
  }

  async function refreshProjects(preferredProjectId = null) {
    if (!selectedOwnerId || !selectedVersionId) {
      setError("Sélectionne un owner et une version.");
      return null;
    }

    return runAction(async () => {
      const projectList = await fetchProjects(selectedOwnerId, selectedVersionId);
      setProjects(projectList);
      setVersions((current) =>
        current.map((version) =>
          String(getEntityId(version)) === String(selectedVersionId)
            ? { ...version, projects: projectList }
            : version,
        ),
      );

      if (preferredProjectId) {
        const project = projectList.find(
          (item) => String(getProjectId(item)) === String(preferredProjectId),
        );
        if (project) selectProject(String(getProjectId(project)), projectList);
      } else {
        resetProjectForm(projectList);
      }

      return projectList;
    }, "Projets chargés.");
  }

  async function handleOwnerChange(ownerId) {
    const selectedOwner = owners.find((owner) => String(getEntityId(owner)) === String(ownerId));

    setSelectedOwnerId(ownerId);
    setOwnerForm(hydrateOwnerForm(selectedOwner));
    setSelectedVersionId(null);
    setSelectedProjectId(null);
    setVersions([]);
    setProjects([]);

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

    async function loadInitialData() {
      setAuthStatus("checking");
      setError(null);

      try {
        const ownerList = await fetchOwners();
        if (cancelled) return;

        const firstOwner = ownerList[0];
        const firstOwnerId = getEntityId(firstOwner);
        let versionList = [];

        if (firstOwnerId) {
          versionList = await fetchVersions(firstOwnerId);
        }

        if (cancelled) return;

        setOwners(ownerList);
        setOwnerForm(hydrateOwnerForm(firstOwner));
        setSelectedOwnerId(firstOwnerId ? String(firstOwnerId) : null);
        setVersions(versionList);

        const activeVersion = versionList.find((version) => version.active);
        const firstVersion = versionList[0];
        const versionToSelect = activeVersion ?? firstVersion;

        if (versionToSelect) {
          setSelectedVersionId(String(getEntityId(versionToSelect)));
          hydrateVersionForms(versionToSelect);
        }

        setAuthStatus("authenticated");
      } catch (err) {
        if (cancelled) return;

        if (isAuthRequiredError(err)) {
          setAuthStatus("login");
          return;
        }

        setAuthStatus("authenticated");
        setError(err?.message ?? "Impossible de charger les données admin.");
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
    // hydrateVersionForms must use the first payload from the initial admin bootstrap only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    resetProjectForm([]);
  }


  async function handleLogout() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await logoutAdmin();
      resetAdminState();
      window.location.replace("/login?logout");
    } catch (err) {
      setError(err?.message ?? "Déconnexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  const activeVersionsCount = versions.filter((version) => version.active).length;
  const selectedVersionProjectsCount = projects.length;
  const selectedVersionExperiencesCount = experiences.length;

  if (authStatus === "checking") {
    return <AdminChecking />;
  }

  if (authStatus === "login") {
    return <AdminLoginRedirect />;
  }

  return (
    <main ref={rootRef} className="admin-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />

      <Stack gap="xl" className="admin-shell">
        <Paper withBorder radius="xl" p="xl" className="admin-hero-card">
          <Group justify="space-between" align="flex-start" gap="xl">
            <Stack gap="xs" maw={860}>
              <Badge variant="light" className="admin-kicker">
                Administration portfolio
              </Badge>
              <Title order={1} className="admin-title">
                Console de contenu, versions & projets
              </Title>
              <Text c="dimmed" size="lg">
                Gère le contenu complet du portfolio : versions clonables,
                profils, fichiers uploadés, expériences et projets éditables un
                par un.
              </Text>
            </Stack>

            <Stack gap="xs" className="admin-hero-actions">
              <Button onClick={() => refreshOwners()} loading={loading} variant="light">
                Recharger les données
              </Button>
              <Button component="a" href="/" variant="subtle">
                Voir le site public
              </Button>
              <Button onClick={handleLogout} loading={loading} variant="outline">
                Se déconnecter
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
                  Sélectionne un profil, une version, puis modifie ses blocs de contenu.
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
                label="Profil"
                placeholder="Choisir un profil"
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
                variant="light"
                onClick={() => refreshProjects()}
                disabled={!selectedOwnerId || !selectedVersionId}
              >
                Recharger projets
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
          <Tabs defaultValue="version" variant="outline" radius="md" className="admin-tabs">
            <Tabs.List>
              <Tabs.Tab value="owner">Profil principal</Tabs.Tab>
              <Tabs.Tab value="version">Versions</Tabs.Tab>
              <Tabs.Tab value="profile">Profil & fichiers</Tabs.Tab>
              <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
              <Tabs.Tab value="project">Projets</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="owner" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Identité, contacts et création du profil principal</Text>
                    <Text size="sm" c="dimmed">
                      Modifie les coordonnées du profil sélectionné ou crée une nouvelle fiche avec une première version.
                    </Text>
                  </div>
                  <Badge variant="light">Création</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Nom" value={ownerForm.name} onChange={(event) => updateOwnerForm("name", event.currentTarget.value)} />
                  <TextInput label="Prénom" value={ownerForm.firstName} onChange={(event) => updateOwnerForm("firstName", event.currentTarget.value)} />
                  <NumberInput label="Âge" value={ownerForm.age} onChange={(value) => updateOwnerForm("age", value ?? 0)} />
                  <TextInput label="Adresse" value={ownerForm.address} onChange={(event) => updateOwnerForm("address", event.currentTarget.value)} />
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Contacts publics</Text>
                        <Text size="sm" c="dimmed">
                          Ces contacts alimentent les boutons, les liens publics et la carte de coordonnées du portfolio.
                        </Text>
                      </div>
                      <Button size="xs" variant="light" onClick={addOwnerContact}>
                        Ajouter contact
                      </Button>
                    </Group>

                    <Stack gap="sm">
                      {ownerForm.contacts.map((contact, index) => (
                        <SimpleGrid key={`${contact.type}-${index}`} cols={{ base: 1, md: 3 }} spacing="sm" className="admin-contact-row">
                          <Select
                            label="Type"
                            data={contactTypeOptions}
                            value={contact.type}
                            onChange={(value) => updateOwnerContact(index, "type", value ?? "EMAIL")}
                          />
                          <TextInput
                            label="Valeur"
                            placeholder="Email, téléphone ou URL"
                            value={contact.value}
                            onChange={(event) => updateOwnerContact(index, "value", event.currentTarget.value)}
                          />
                          <Button
                            color="red"
                            variant="light"
                            onClick={() => removeOwnerContact(index)}
                          >
                            Retirer
                          </Button>
                        </SimpleGrid>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                <Group>
                  <Switch label="Owner actif" checked={ownerForm.active} onChange={(event) => updateOwnerForm("active", event.currentTarget.checked)} />
                  <Button onClick={updateOwner} loading={loading} disabled={!selectedOwnerId}>
                    Enregistrer identité et contacts
                  </Button>
                </Group>

                <Divider label="Création d’une nouvelle fiche" labelPosition="center" />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Tag première version" value={ownerForm.versionTag} onChange={(event) => updateOwnerForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label première version" value={ownerForm.versionLabel} onChange={(event) => updateOwnerForm("versionLabel", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description première version" minRows={3} value={ownerForm.versionDescription} onChange={(event) => updateOwnerForm("versionDescription", event.currentTarget.value)} />

                <Checkbox label="Publier la première version" checked={ownerForm.versionPublished} onChange={(event) => updateOwnerForm("versionPublished", event.currentTarget.checked)} />

                <Button onClick={createOwner} loading={loading} size="md" variant="light">
                  Créer profil + version initiale
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="version" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Créer, cloner ou modifier une version</Text>
                    <Text size="sm" c="dimmed">
                      Pour éviter de retaper profil, timeline et projets, crée une version en important le contenu d’une version source.
                    </Text>
                  </div>
                  <Badge variant="light">Version</Badge>
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

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Créer une version depuis une version existante</Text>
                        <Text size="sm" c="dimmed">
                          Copie automatiquement le profil, le CV, les images, la timeline et tous les projets.
                        </Text>
                      </div>
                      <Badge variant="light">Import</Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      <Select
                        label="Version source à importer"
                        placeholder="Choisir une version source"
                        data={versions.map((version) => ({
                          value: String(getEntityId(version)),
                          label: `${version.versionTag ?? "version"} — ${version.label ?? "Sans label"}`,
                        }))}
                        value={cloneSourceVersionId}
                        onChange={setCloneSourceVersionId}
                        searchable
                      />

                      <Button
                        onClick={cloneVersion}
                        disabled={!selectedOwnerId || !cloneSourceVersionId}
                      >
                        Créer en important la version source
                      </Button>
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <Group>
                  <Button onClick={createVersion} disabled={!selectedOwnerId} variant="light">
                    Créer depuis les formulaires actuels
                  </Button>
                  <Button variant="light" onClick={updateVersionMetadata} disabled={!selectedOwnerId || !selectedVersionId}>
                    Modifier métadonnées
                  </Button>
                </Group>

                <Divider />

                <Stack gap="sm">
                  {versions.map((version) => (
                    <Card key={getEntityId(version)} withBorder padding="md" radius="lg" className="admin-version-card">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Group gap="xs">
                            <Text fw={800}>{version.versionTag} — {version.label}</Text>
                            {version.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}
                          </Group>
                          <Text size="sm" c="dimmed">{version.description}</Text>
                          <Text size="xs" c="dimmed">
                            {(version.projects ?? []).length} projet(s) · {(version.timeline?.experiences ?? []).length} expérience(s)
                          </Text>
                        </div>

                        <Group>
                          <Button size="xs" variant="light" onClick={() => selectVersion(String(getEntityId(version)))}>
                            Sélectionner
                          </Button>
                          <Button size="xs" color="green" variant="light" disabled={version.active} onClick={() => activateVersion(getEntityId(version))}>
                            Activer
                          </Button>
                          <Button size="xs" variant="subtle" onClick={() => setCloneSourceVersionId(String(getEntityId(version)))}>
                            Source
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="profile" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Profil de la version sélectionnée</Text>
                    <Text size="sm" c="dimmed">
                      Les fichiers sont uploadés avant l’envoi du DTO profile.
                    </Text>
                  </div>
                  <Badge variant="light">Profil</Badge>
                </Group>

                <Divider />

                <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    <Stack gap="xs">
                      <FileInput label="Photo de profil" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={profileFiles.profileImage} onChange={(file) => setProfileFiles((current) => ({ ...current, profileImage: file }))} />
                      <FileLink label="Image actuelle" url={profileForm.profileImageUrl} />
                    </Stack>
                    <Stack gap="xs">
                      <FileInput label="Logo" placeholder="Uploader un logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={profileFiles.logo} onChange={(file) => setProfileFiles((current) => ({ ...current, logo: file }))} />
                      <FileLink label="Logo actuel" url={profileForm.logoUrl} />
                    </Stack>
                    <Stack gap="xs">
                      <FileInput label="CV PDF" placeholder="Uploader un PDF" accept="application/pdf" value={profileFiles.cv} onChange={(file) => setProfileFiles((current) => ({ ...current, cv: file }))} />
                      <FileLink label="CV actuel" url={profileForm.cvUrl} mode="page" />
                    </Stack>
                  </SimpleGrid>
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Job recherché / titre affiché" value={profileForm.title} onChange={(event) => updateProfileForm("title", event.currentTarget.value)} />
                  <TextInput label="Sous-titre" value={profileForm.subtitle} onChange={(event) => updateProfileForm("subtitle", event.currentTarget.value)} />
                  <TextInput label="Mots-clés affichés sous le titre" value={profileForm.headline} onChange={(event) => updateProfileForm("headline", event.currentTarget.value)} />
                  <TextInput label="Description courte" value={profileForm.shortDescription} onChange={(event) => updateProfileForm("shortDescription", event.currentTarget.value)} />
                  <TextInput label="Localisation" value={profileForm.location} onChange={(event) => updateProfileForm("location", event.currentTarget.value)} />
                  <TextInput label="Disponibilité" value={profileForm.availability} onChange={(event) => updateProfileForm("availability", event.currentTarget.value)} />
                  <TextInput label="Portfolio URL" value={profileForm.portfolioUrl} onChange={(event) => updateProfileForm("portfolioUrl", event.currentTarget.value)} />
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
                  <Badge variant="light">Timeline</Badge>
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
                      <FileInput label="Image expérience" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={experienceFiles.image} onChange={(file) => setExperienceFiles({ image: file })} />
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
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>Projets de la version</Text>
                    <Text size="sm" c="dimmed">
                      Affiche, sélectionne, modifie ou supprime chaque projet de la version sélectionnée.
                    </Text>
                  </div>
                  <Badge variant="light">Projets</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" className="admin-project-editor-grid">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={800}>Liste des projets</Text>
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
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                              <Group gap="xs">
                                <Text fw={800}>{project.displayOrder ?? "—"}. {project.title}</Text>
                                {project.featured && <Badge color="cyan" variant="light">Featured</Badge>}
                                {!project.published && <Badge color="gray" variant="light">Draft</Badge>}
                              </Group>
                              <Text size="sm" c="dimmed">{project.subtitle}</Text>
                              <Text size="xs" c="dimmed">
                                {(project.stacks ?? []).slice(0, 5).join(" · ")}
                              </Text>
                              <Group gap="xs">
                                {project.imageUrl && <FileLink label="Image" url={project.imageUrl} />}
                                {project.documentationUrl && <FileLink label="Doc" url={project.documentationUrl} />}
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
                          <FileLink label="Image actuelle" url={projectForm.imageUrl} />
                        </Stack>
                        <Stack gap="xs">
                          <FileInput label="Documentation PDF" placeholder="Uploader un PDF" accept="application/pdf" value={projectFiles.documentation} onChange={(file) => setProjectFiles((current) => ({ ...current, documentation: file }))} />
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

                    <Group>
                      {projectMode === "edit" ? (
                        <>
                          <Button onClick={updateProject} disabled={!selectedOwnerId || !selectedVersionId || !selectedProjectId}>
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
                        <Button onClick={addProject} disabled={!selectedOwnerId || !selectedVersionId}>
                          Ajouter projet à la version
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </main>
  );
}
