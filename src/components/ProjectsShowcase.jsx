import { Anchor, Badge, Button, Card, Group, MultiSelect, Stack, Text, TextInput, Title } from "@mantine/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsapReady, useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
import { FilePreviewButton, PreviewableImage } from "./FilePreview";
import { isPreviewableFile } from "../utils/filePreview";
import {
  LINK_LABELS,
  STATUS_LABELS,
  downloadText,
  formatPeriod,
  getAvailableStacks,
  getAvailableStatuses,
  getPublicProjects,
  normalizeUrl,
} from "../utils/portfolio";

function ProjectVisual({ project, index }) {
  if (project.imageUrl) {
    return (
      <PreviewableImage
        src={project.imageUrl}
        alt={project.title}
        className="project-visual project-image-preview-trigger"
        imageClassName="project-image"
        modalTitle={`Projet — ${project.title}`}
      />
    );
  }

  return (
    <div className="project-visual project-visual-wave" aria-hidden="true">
      <span>Projet {String(index + 1).padStart(2, "0")}</span>
      <svg viewBox="0 0 560 220" preserveAspectRatio="none" className="project-wave-band">
        <path d="M0 130 C70 98 132 96 206 126 C282 158 348 154 424 120 C486 92 530 98 560 115 V220 H0 Z" />
        <path d="M0 158 C82 126 152 122 226 152 C300 184 376 180 452 146 C504 124 540 128 560 138 V220 H0 Z" />
        <path d="M0 96 C68 70 140 72 214 98 C286 124 360 132 430 98 C494 66 534 72 560 84" />
      </svg>
      <strong>{project.title?.slice(0, 2)?.toUpperCase()}</strong>
    </div>
  );
}

function getProjectLinks(project) {
  const rawLinks = [
    project.githubUrl && { label: "GitHub", url: project.githubUrl, type: "GITHUB" },
    project.demoUrl && { label: "Démo", url: project.demoUrl, type: "DEMO" },
    project.documentationUrl && { label: "Docs", url: project.documentationUrl, type: "DOCUMENTATION" },
    ...(project.links ?? []).map((link) => ({
      label: link.label || LINK_LABELS[link.type] || "Lien",
      url: link.url,
      type: link.type || link.label || "CUSTOM",
    })),
  ].filter((link) => link?.url);

  const seen = new Set();

  return rawLinks.filter((link) => {
    const key = `${link.type}|${link.label}|${normalizeUrl(link.url)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ProjectLinks({ project }) {
  const links = getProjectLinks(project);

  if (links.length === 0) return null;

  return (
    <Group gap="xs" className="project-links">
      {links.slice(0, 5).map((link, index) => {
        const key = `${project.id ?? project.title ?? "project"}-${link.type}-${index}-${normalizeUrl(link.url)}`;

        return isPreviewableFile(link.url) ? (
          <FilePreviewButton
            key={key}
            url={link.url}
            label={link.label}
            title={`${link.label} — ${project.title}`}
            mode={link.label?.toLowerCase().includes("cv") ? "page" : "modal"}
            variant="subtle"
            size="xs"
            className="project-link project-link-button"
          />
        ) : (
          <Anchor
            key={key}
            href={normalizeUrl(link.url)}
            target="_blank"
            className="project-link"
          >
            {link.label}
          </Anchor>
        );
      })}
    </Group>
  );
}

function ProjectIsland({ project, index, featured, total }) {
  return (
    <article className="project-carousel-panel">
      <div className="project-panel-inner">
        <div className={`project-slide-card island-card ${featured ? "featured-project-island" : ""}`}>
          <div className="project-slide-index">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <div className="project-island-topline">
            <Badge className="project-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
            {featured && <Badge className="featured-badge">Focus</Badge>}
          </div>

          <div className="project-slide-grid">
            <ProjectVisual project={project} index={index} />

            <Stack gap="sm" className="project-content">
              <Text className="project-period">
                {formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED")}
              </Text>
              <Title order={3}>{project.title}</Title>
              {project.subtitle && <Text className="project-subtitle">{project.subtitle}</Text>}
              <Text className="project-description">{project.shortDescription ?? project.description}</Text>

              {project.features?.length > 0 && (
                <ul className="feature-list two-columns">
                  {project.features.slice(0, featured ? 6 : 5).map((feature, featureIndex) => (
                    <li key={`${project.id ?? project.title}-feature-${featureIndex}-${feature}`}>{feature}</li>
                  ))}
                </ul>
              )}

              {project.stacks?.length > 0 && (
                <Group gap={7} className="stack-row project-stack-row">
                  {project.stacks.slice(0, featured ? 10 : 8).map((stack, stackIndex) => (
                    <Badge key={`${project.id ?? project.title}-stack-${stackIndex}-${stack}`} variant="outline" className="stack-badge">
                      {stack}
                    </Badge>
                  ))}
                </Group>
              )}

              <ProjectLinks project={project} />
            </Stack>
          </div>
        </div>
      </div>
    </article>
  );
}

const ProjectToolbar = memo(function ProjectToolbar({
  query,
  setQuery,
  status,
  setStatus,
  selectedStacks,
  setSelectedStacks,
  statuses,
  stacks,
}) {
  return (
    <div className="project-toolbar island-card project-toolbar-sticky">
      <TextInput
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Rechercher un projet, une stack, une feature…"
        radius="xl"
        className="project-search"
        aria-label="Rechercher dans les projets"
      />
      <MultiSelect
        data={[{ value: "ALL", label: "Tous les statuts" }, ...statuses.map((item) => ({ value: item, label: STATUS_LABELS[item] ?? item }))]}
        value={[status]}
        onChange={(values) => setStatus(values.at(-1) ?? "ALL")}
        radius="xl"
        className="status-select"
        maxValues={1}
        searchable={false}
        aria-label="Filtrer par statut"
      />
      <MultiSelect
        data={stacks}
        value={selectedStacks}
        onChange={setSelectedStacks}
        radius="xl"
        className="stack-filter"
        placeholder="Stacks"
        searchable
        clearable
        aria-label="Filtrer par stack"
      />
    </div>
  );
});

function getRelativeIndex(index, activeIndex, total) {
  if (total <= 1) return 0;
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function getPanelStyle(offset) {
  const abs = Math.abs(offset);
  const side = Math.sign(offset);
  const visibleDepth = Math.min(abs, 3);
  const x = side * (abs === 1 ? 43 : abs === 2 ? 72 : 92);
  const z = abs === 0 ? 110 : abs === 1 ? -120 : abs === 2 ? -300 : -520;
  const rotateY = side * (abs === 0 ? 0 : abs === 1 ? -42 : -58);
  const scale = abs === 0 ? 1 : abs === 1 ? 0.8 : abs === 2 ? 0.64 : 0.52;
  const opacity = abs <= 2 ? 1 : 0;

  return {
    "--gallery-x": `${x}%`,
    "--gallery-z": `${z}px`,
    "--gallery-rotate-y": `${rotateY}deg`,
    "--gallery-scale": scale,
    "--gallery-opacity": opacity,
    "--gallery-depth": visibleDepth,
    "--gallery-origin": side < 0 ? "right center" : side > 0 ? "left center" : "center center",
  };
}


function GalleryNavButton({ direction, label, onNavigate }) {
  // On crée une référence pour cibler spécifiquement le cercle visuel avec GSAP
  const visualRef = useRef(null);

  // Animation au survol (agrandissement avec rebond)
  const handlePointerEnter = useCallback(() => {
    gsapReady().then(({ gsap }) => {
      gsap.to(visualRef.current, {
        scale: 1.12,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 24px 54px rgba(3, 105, 161, 0.24)",
        duration: 0.35,
        ease: "back.out(1.6)", // L'effet élastique magique de GSAP
        overwrite: "auto", // Écrase les animations précédentes pour éviter les conflits
      });
    });
  }, []);

  // Animation de sortie de survol (retour à la normale)
  const handlePointerLeave = useCallback(() => {
    gsapReady().then(({ gsap }) => {
      gsap.to(visualRef.current, {
        scale: 1,
        backgroundColor: "rgba(255, 255, 255, 0.74)",
        boxShadow: "0 18px 44px rgba(3, 105, 161, 0.16)",
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, []);

  // Animation au clic (bouton qui s'enfonce)
  const handlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      gsapReady().then(({ gsap }) => {
        gsap.to(visualRef.current, {
          scale: 0.9,
          boxShadow: "0 8px 20px rgba(3, 105, 161, 0.12)",
          duration: 0.1,
          ease: "power1.inOut",
          overwrite: "auto",
        });
      });

      onNavigate();
    },
    [onNavigate]
  );

  // Relâchement du clic (retour à l'état de survol)
  const handlePointerUp = useCallback(() => {
    handlePointerEnter();
  }, [handlePointerEnter]);

  // Support clavier
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      
      // Petit feedback visuel rapide au clavier
      gsapReady().then(({ gsap }) => {
        gsap.fromTo(
          visualRef.current,
          { scale: 0.9 },
          { scale: 1, duration: 0.3, ease: "back.out(1.6)" }
        );
      });

      onNavigate();
    },
    [onNavigate]
  );

  return (
    <button
      type="button"
      className={`gallery-nav gallery-nav-hitbox gallery-nav-${direction}`}
      aria-label={label}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave} // Sécurité si le curseur quitte brutalement l'écran
      onKeyDown={handleKeyDown}
    >
      <span ref={visualRef} className="gallery-nav-visual" aria-hidden="true">
        {direction === "prev" ? "←" : "→"}
      </span>
    </button>
  );
}



function ProjectGallery({ projects }) {
  const galleryRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const safeActiveIndex = projects.length === 0 ? 0 : Math.min(activeIndex, projects.length - 1);

  const goTo = useCallback(
    (nextIndex, nextDirection) => {
      if (projects.length <= 1) return;
      setDirection(nextDirection);
      setActiveIndex((nextIndex + projects.length) % projects.length);
    },
    [projects.length]
  );

  const handlePrev = useCallback(() => {
    goTo(safeActiveIndex - 1, -1);
  }, [goTo, safeActiveIndex]);

  const handleNext = useCallback(() => {
    goTo(safeActiveIndex + 1, 1);
  }, [goTo, safeActiveIndex]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!galleryRef.current || projects.length <= 1) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target?.closest?.('input, textarea, [contenteditable="true"], [role="combobox"], [role="listbox"]')) return;

      const rect = galleryRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.86 && rect.bottom > window.innerHeight * 0.14;
      if (!isVisible) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, projects.length]);

  useGsap(galleryRef, (gsap) => {
    const root = galleryRef.current;

    const wavePaths = root.querySelectorAll(".project-wave-band path");
    if (wavePaths.length > 0) {
      gsap.to(wavePaths, {
        xPercent: (index) => (index % 2 ? 8 : -8),
        yPercent: (index) => (index % 2 ? -4 : 4),
        duration: (index) => 5.5 + index,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });
    }
  }, [projects.length]);

  useEffect(() => {
    let killed = false;

    gsapReady().then((runtime) => {
      if (killed || !runtime?.gsap || !galleryRef.current) return;
      const { gsap } = runtime;
      const root = galleryRef.current;
      const activeCard = root.querySelector(".gallery-panel.is-active .project-slide-card");
      const distortionPlane = root.querySelector(".gallery-distortion-plane");
      const camera = root.querySelector(".project-gallery-camera");

      gsap.killTweensOf([activeCard, distortionPlane, camera]);

      gsap.fromTo(
        camera,
        {
          rotateY: direction * -7,
          rotateX: 1.8,
          filter: "blur(5px) contrast(1.18) saturate(1.22)",
        },
        {
          rotateY: 0,
          rotateX: 0,
          filter: "blur(0px) contrast(1) saturate(1)",
          duration: 0.72,
          ease: "expo.out",
        }
      );

      gsap.fromTo(
        activeCard,
        {
          clipPath: direction > 0 ? "inset(0 18% 0 0 round 64px)" : "inset(0 0 0 18% round 64px)",
          filter: "blur(10px) contrast(1.18) saturate(1.32)",
          skewX: direction * 6,
          scale: 0.965,
        },
        {
          clipPath: "inset(0 0% 0 0% round 64px)",
          filter: "blur(0px) contrast(1) saturate(1)",
          skewX: 0,
          scale: 1,
          duration: 0.74,
          ease: "expo.out",
          clearProps: "clipPath,filter,skewX,scale",
        }
      );

      gsap.fromTo(
        distortionPlane,
        {
          autoAlpha: 0.72,
          xPercent: direction > 0 ? -42 : 42,
          skewX: direction * -18,
          scaleX: 0.68,
        },
        {
          autoAlpha: 0,
          xPercent: direction > 0 ? 42 : -42,
          skewX: 0,
          scaleX: 1.28,
          duration: 0.58,
          ease: "power3.out",
        }
      );
    });

    return () => {
      killed = true;
    };
  }, [activeIndex, direction]);

  if (projects.length === 0) return null;

  const activeProject = projects[safeActiveIndex];

  return (
    <div ref={galleryRef} className="project-gallery-shell" aria-roledescription="carousel" aria-label="Galerie 3D des projets">
      <div className="project-gallery-help">← / → clavier · flèches latérales · clic sur les panneaux</div>

      {projects.length > 1 && <GalleryNavButton direction="prev" label="Projet précédent" onNavigate={handlePrev} />}

      <div className="project-gallery-viewport">
        <div className="gallery-distortion-plane" aria-hidden="true" />
        <div className="project-gallery-camera">
          {projects.map((project, index) => {
            const offset = getRelativeIndex(index, safeActiveIndex, projects.length);
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= 2;
            const key = project.id ?? `${project.title}-${index}`;

            return (
              <div
                key={key}
                role="button"
                className={`gallery-panel ${isActive ? "is-active" : ""} ${isVisible ? "is-visible" : "is-hidden"}`}
                style={getPanelStyle(offset)}
                onClick={() => {
                  if (!isActive) goTo(index, offset > 0 ? 1 : -1);
                }}
                onKeyDown={(event) => {
                  if (!isActive && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    goTo(index, offset > 0 ? 1 : -1);
                  }
                }}
                aria-label={isActive ? `Projet actif : ${project.title}` : `Afficher le projet ${project.title}`}
                aria-current={isActive ? "true" : undefined}
                tabIndex={isActive || isVisible ? 0 : -1}
              >
                <ProjectIsland project={project} index={index} total={projects.length} featured={project.featured || index === 0} />
              </div>
            );
          })}
        </div>
      </div>

      {projects.length > 1 && <GalleryNavButton direction="next" label="Projet suivant" onNavigate={handleNext} />}

      <Group gap="xs" justify="center" className="gallery-dots" aria-label="Navigation des projets">
        {projects.map((project, index) => (
          <button
            key={project.id ?? `${project.title}-dot-${index}`}
            type="button"
            className={`gallery-dot ${index === safeActiveIndex ? "is-active" : ""}`}
            onClick={() => goTo(index, index > safeActiveIndex ? 1 : -1)}
            aria-label={`Aller au projet ${index + 1}`}
            aria-current={index === safeActiveIndex ? "true" : undefined}
          />
        ))}
      </Group>

      <Text className="gallery-live-label" aria-live="polite">
        {String(safeActiveIndex + 1).padStart(2, "0")} — {activeProject.title}
      </Text>
    </div>
  );
}

export default function ProjectsShowcase({ projects }) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedStacks, setSelectedStacks] = useState([]);

  const publicProjects = useMemo(() => getPublicProjects(projects), [projects]);
  const statuses = useMemo(() => getAvailableStatuses(publicProjects), [publicProjects]);
  const stacks = useMemo(() => getAvailableStacks(publicProjects), [publicProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return publicProjects.filter((project) => {
      const haystack = [
        project.title,
        project.subtitle,
        project.shortDescription,
        project.description,
        ...(project.stacks ?? []),
        ...(project.features ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesStatus = status === "ALL" || project.status === status;
      const matchesStacks = selectedStacks.length === 0 || selectedStacks.every((stack) => (project.stacks ?? []).includes(stack));

      return matchesQuery && matchesStatus && matchesStacks;
    });
  }, [publicProjects, query, selectedStacks, status]);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    if (!ScrollTrigger || !root) return undefined;

    const toolbar = root.querySelector(".project-toolbar");
    if (toolbar) {
      gsap.from(toolbar, {
        autoAlpha: 0,
        y: 28,
        duration: 0.56,
        ease: "power3.out",
        scrollTrigger: { trigger: root, start: "top 72%", toggleActions: "play none none none" },
      });
    }

    return undefined;
  }, []);

  const exportProjects = () => {
    downloadText("portfolio-projects.json", JSON.stringify(filteredProjects, null, 2), "application/json;charset=utf-8");
  };

  return (
    <section ref={rootRef} id="projects" className="page-section projects-section">
      <SectionTitle
        title="Mes projets"
        description="Une galerie 3D contrôlable au clavier, découplée de la barre de recherche et des filtres."
        rightSlot={
          <Button onClick={exportProjects} radius="xl" variant="light">
            Exporter JSON
          </Button>
        }
      />

      <ProjectToolbar
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        selectedStacks={selectedStacks}
        setSelectedStacks={setSelectedStacks}
        statuses={statuses}
        stacks={stacks}
      />

      <Group gap="xs" className="result-line" mb="xl">
        <Badge className="executive-badge">
          {filteredProjects.length} projet{filteredProjects.length > 1 ? "s" : ""}
        </Badge>
        {selectedStacks.map((stack) => (
          <Badge key={stack} className="filter-chip">
            {stack}
          </Badge>
        ))}
      </Group>

      {filteredProjects.length > 0 ? (
        <ProjectGallery projects={filteredProjects} />
      ) : (
        <Card className="empty-card island-card" radius="xl">
          <Title order={3}>Aucun projet ne correspond aux filtres.</Title>
          <Text>Réduis la recherche ou retire une stack pour retrouver les projets disponibles.</Text>
        </Card>
      )}
    </section>
  );
}
