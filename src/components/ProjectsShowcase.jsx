import { Anchor, Badge, Button, Card, Group, MultiSelect, Stack, Text, TextInput, Title } from "@mantine/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    <div className="project-visual project-visual-static" aria-hidden="true">
      <span>Projet {String(index + 1).padStart(2, "0")}</span>
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
function getProjectPreview(project, limit = 260) {
  const source = project.shortDescription || project.description || "";

  if (source.length <= limit) return source;

  return `${source.slice(0, limit).trim()}…`;
}

function shouldShowProjectDetails(project) {
  const preview = getProjectPreview(project);
  const fullDescription = project.description || project.shortDescription || "";

  return (
    fullDescription.length > preview.length ||
    Boolean(project.shortDescription && project.description && project.description !== project.shortDescription) ||
    (project.features?.length ?? 0) > 0 ||
    (project.stacks?.length ?? 0) > 0 ||
    getProjectLinks(project).length > 5
  );
}

function useCardOverflowSignal(project, active) {
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;

    if (!card || !content) {
      setHasOverflow(false);
      return undefined;
    }

    let frame = 0;

    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const safetyGap = window.innerWidth <= 820 ? 72 : 34;
        const cardOverflow = card.scrollHeight > card.clientHeight - safetyGap;
        const contentOverflow = content.scrollHeight > content.clientHeight - safetyGap;
        const actions = card.querySelector(".project-card-actions");
        const actionIsTooLow = actions
          ? actions.getBoundingClientRect().bottom > card.getBoundingClientRect().bottom - safetyGap
          : false;
        const nextValue = cardOverflow || contentOverflow || actionIsTooLow;

        setHasOverflow((currentValue) => (currentValue === nextValue ? currentValue : nextValue));
      });
    };

    measure();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(card);
    resizeObserver?.observe(content);

    window.addEventListener("resize", measure, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, project?.id, project?.title, project?.shortDescription, project?.description, project?.features?.length, project?.stacks?.length]);

  return { cardRef, contentRef, hasOverflow };
}

function ProjectDetailsModal({ project, opened, onClose }) {
  const links = getProjectLinks(project ?? {});

  useEffect(() => {
    if (!opened) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [opened, onClose]);

  if (!project || !opened || typeof document === "undefined") return null;

  return createPortal(
    <div className="project-detail-modal-root" role="dialog" aria-modal="true" aria-labelledby="project-detail-modal-title" onMouseDown={onClose}>
      <div className="project-detail-modal-overlay" aria-hidden="true" />
      <div className="project-detail-modal-inner">
        <div className="project-detail-modal" onMouseDown={(event) => event.stopPropagation()}>
          <header className="project-detail-modal-header">
            <h2 id="project-detail-modal-title" className="project-detail-modal-title">Projet — {project.title}</h2>
            <button type="button" className="project-detail-modal-close" aria-label="Fermer les détails du projet" onClick={onClose}>
              ×
            </button>
          </header>

          <div className="project-detail-modal-body">
            <div className="project-detail-scroll">
              <div className="project-detail-hero">
                <div>
                  <Badge className="project-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
                  <Title order={2}>{project.title}</Title>
                  {project.subtitle && <Text className="project-detail-subtitle">{project.subtitle}</Text>}
                </div>
                <Text className="project-detail-period">
                  {formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED")}
                </Text>
              </div>

              {project.imageUrl && (
                <img src={project.imageUrl} alt="" className="project-detail-image" loading="lazy" />
              )}

              {(project.shortDescription || project.description) && (
                <section className="project-detail-section">
                  <h3>Présentation</h3>
                  {project.shortDescription && <Text className="project-detail-lead">{project.shortDescription}</Text>}
                  {project.description && project.description !== project.shortDescription && (
                    <Text className="project-detail-text">{project.description}</Text>
                  )}
                </section>
              )}

              {project.features?.length > 0 && (
                <section className="project-detail-section">
                  <h3>Fonctionnalités</h3>
                  <ul className="project-detail-list">
                    {project.features.map((feature, featureIndex) => (
                      <li key={`${project.id ?? project.title}-detail-feature-${featureIndex}-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                </section>
              )}

              {project.stacks?.length > 0 && (
                <section className="project-detail-section">
                  <h3>Stack technique</h3>
                  <Group gap={8} className="project-detail-stack">
                    {project.stacks.map((stack, stackIndex) => (
                      <Badge key={`${project.id ?? project.title}-detail-stack-${stackIndex}-${stack}`} variant="outline" className="stack-badge">
                        {stack}
                      </Badge>
                    ))}
                  </Group>
                </section>
              )}

              {links.length > 0 && (
                <section className="project-detail-section project-detail-links-section">
                  <h3>Liens</h3>
                  <ProjectLinks project={project} />
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}


function ProjectIsland({ project, index, featured, total, active, onOpenDetails }) {
  const { cardRef, contentRef, hasOverflow } = useCardOverflowSignal(project, active);
  const showDetails = shouldShowProjectDetails(project) || hasOverflow;

  return (
    <article className={`project-carousel-panel ${showDetails ? "has-project-details" : ""}`}>
      <div className="project-panel-inner">
        <div ref={cardRef} className={`project-slide-card island-card ${featured ? "featured-project-island" : ""}`}>
          <div className="project-slide-index">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <div className="project-island-topline">
            <Badge className="project-status">{STATUS_LABELS[project.status] ?? project.status}</Badge>
            {featured && <Badge className="featured-badge">Focus</Badge>}
          </div>

          <div className="project-slide-grid">
            <ProjectVisual project={project} index={index} />

            <Stack ref={contentRef} gap="sm" className="project-content">
              <Text className="project-period">
                {formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED")}
              </Text>
              <Title order={3}>{project.title}</Title>
              {project.subtitle && <Text className="project-subtitle">{project.subtitle}</Text>}
              <Text className="project-description">{getProjectPreview(project)}</Text>

              <Group gap="xs" className="project-card-actions">
                <ProjectLinks project={project} />
                {showDetails && (
                  <button
                    type="button"
                    className="project-read-more project-details-button"
                    onPointerDown={(event) => {
                      if (event.pointerType === "mouse" && event.button !== 0) return;
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenDetails(project);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenDetails(project);
                    }}
                  >
                    <span>Détails</span>
                  </button>
                )}
              </Group>
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

  const depth = abs;

  const extraPush = Math.max(0, abs - 2);

  const x = side * (abs === 0 ? 0 : abs === 1 ? 43 : abs === 2 ? 72 : 92 + extraPush * 5);
  const z = abs === 0 ? 110 : abs === 1 ? -120 : abs === 2 ? -300 : -520 - extraPush * 100;
  const rotateY = side * (abs === 0 ? 0 : abs === 1 ? -42 : -58);
  const scale = abs === 0 ? 1 : abs === 1 ? 0.8 : abs === 2 ? 0.64 : Math.max(0.1, 0.52 - extraPush * 0.05);
  const opacity = abs <= 2 ? 1 : 0;

  return {
    "--gallery-x": `${x}%`,
    "--gallery-z": `${z}px`,
    "--gallery-rotate-y": `${rotateY}deg`,
    "--gallery-scale": scale,
    "--gallery-opacity": opacity,
    "--gallery-depth": depth,
    "--gallery-origin": side < 0 ? "right center" : side > 0 ? "left center" : "center center",
  };
}
function GalleryNavButton({ direction, label, onNavigate }) {
  const visualRef = useRef(null);

  const handlePointerEnter = useCallback(() => {
    gsapReady().then(({ gsap }) => {
      if (!visualRef.current) return;
      gsap.to(visualRef.current, {
        scale: 1.12,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        duration: 0.35,
        ease: "back.out(1.6)",
        overwrite: "auto", // Écrase les animations précédentes pour éviter les conflits
      });
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    gsapReady().then(({ gsap }) => {
      if (!visualRef.current) return;
      gsap.to(visualRef.current, {
        scale: 1,
        backgroundColor: "rgba(255, 255, 255, 0.74)",
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
        if (!visualRef.current) return;
        gsap.to(visualRef.current, {
          scale: 0.9,
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
        if (!visualRef.current) return;
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
  const [detailsProject, setDetailsProject] = useState(null);
  const safeActiveIndex = projects.length === 0 ? 0 : Math.min(activeIndex, projects.length - 1);

  const goTo = useCallback(
    (nextIndex) => {
      if (projects.length <= 1) return;
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

  const dragStateRef = useRef(null);

  const handleDragStart = useCallback((event) => {
    if (projects.length <= 1 || event.button !== 0) return;
    if (event.target?.closest?.('a, button, input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"]')) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [projects.length]);

  const handleDragMove = useCallback((event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    state.lastX = event.clientX;
    state.lastY = event.clientY;
  }, []);

  const finishDrag = useCallback((event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const dx = state.lastX - state.startX;
    const dy = state.lastY - state.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < 64 || absX < absY * 1.25) return;

    event.preventDefault();
    if (dx < 0) handleNext();
    else handlePrev();
  }, [handleNext, handlePrev]);

  const cancelDrag = useCallback((event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);


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


  if (projects.length === 0) return null;

  const activeProject = projects[safeActiveIndex];
  const detailsOpened = Boolean(detailsProject);

  return (
    <>
    <div ref={galleryRef} className="project-gallery-shell" aria-roledescription="carousel" aria-label="Galerie 3D des projets">
      {projects.length > 1 && <GalleryNavButton direction="prev" label="Projet précédent" onNavigate={handlePrev} />}

      <div
        className="project-gallery-viewport"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onPointerLeave={cancelDrag}
      >
        <div className="project-gallery-camera">
          {projects.map((project, index) => {
            const offset = getRelativeIndex(index, safeActiveIndex, projects.length);
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= 2;
            const key = project.id ?? `${project.title}-${index}`;

            return (
              <div
                key={key}
                className={`gallery-panel ${isActive ? "is-active" : ""} ${isVisible ? "is-visible" : "is-hidden"}`}
                style={getPanelStyle(offset)}
                aria-label={isActive ? `Projet actif : ${project.title}` : `Projet en arrière-plan : ${project.title}`}
                aria-current={isActive ? "true" : undefined}
                aria-hidden={!isActive}
              >
                <ProjectIsland project={project} index={index} total={projects.length} featured={Boolean(project.featured)} active={isActive} onOpenDetails={setDetailsProject} />
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
    <ProjectDetailsModal project={detailsProject} opened={detailsOpened} onClose={() => setDetailsProject(null)} />
    </>
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
        reveal="soft"
        title="Mes projets"
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
