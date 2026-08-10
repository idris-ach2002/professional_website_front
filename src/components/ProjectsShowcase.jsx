import { Anchor, Badge, Button, Card, Group, MultiSelect, Stack, Text, TextInput, Title } from "@mantine/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { gsapReady, useGsap } from "../animations/useGsap";
import useResponsiveProfile from "../hooks/useResponsiveProfile";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import useLanguage from "../localization/useLanguage";
import SectionTitle from "./SectionTitle";
import { FilePreviewButton, PreviewableImage } from "./FilePreview";
import { isPreviewableFile } from "../utils/filePreview";
import {
  LINK_LABELS,
  downloadText,
  formatPeriod,
  getAvailableStacks,
  getAvailableStatuses,
  getProjectSlug,
  getPublicProjects,
  normalizeUrl,
} from "../utils/portfolio";

function ProjectVisual({ project, index, active = false }) {
  const { t } = useLanguage();
  if (project.imageUrl) {
    return (
      <PreviewableImage
        src={project.imageUrl}
        alt={project.title}
        className="project-visual project-image-preview-trigger"
        imageClassName="project-image"
        modalTitle={t("projects.modalTitle", { title: project.title })}
        showOverlay={false}
        loading={active ? "eager" : "lazy"}
        fetchPriority={active ? "high" : "low"}
      />
    );
  }

  return (
    <div className="project-visual project-visual-static" aria-hidden="true">
      <span>{t("projects.project")} {String(index + 1).padStart(2, "0")}</span>
      <strong>{project.title?.slice(0, 2)?.toUpperCase()}</strong>
    </div>
  );
}

function findProjectLink(project, predicate) {
  const directLinks = [
    project.githubUrl && { label: "GitHub", url: project.githubUrl, type: "GITHUB" },
    project.architectureUrl && { label: "Architecture", url: project.architectureUrl, type: "ARCHITECTURE" },
    project.documentationUrl && { label: "Documentation", url: project.documentationUrl, type: "DOCUMENTATION" },
    ...(project.links ?? []).map((link) => ({
      label: link.label || LINK_LABELS[link.type] || "Lien",
      url: link.url,
      type: link.type || link.label || "CUSTOM",
    })),
  ].filter((link) => link?.url);

  return directLinks.find(predicate) ?? null;
}

function isArchitectureLink(link) {
  const signature = `${link.type ?? ""} ${link.label ?? ""}`.toLowerCase();

  return [
    "architecture",
    "diagramme",
    "diagram",
    "dataflow",
    "data flow",
    "infrastructure",
    "infra",
    "kubernetes",
    "schéma",
    "schema",
  ].some((keyword) => signature.includes(keyword));
}

function getProjectLinks(project) {
  const githubLink = findProjectLink(project, (link) => String(link.type).toUpperCase() === "GITHUB" || String(link.label).toLowerCase() === "github");
  const architectureLink = findProjectLink(project, isArchitectureLink);
  const documentationLink = findProjectLink(
    project,
    (link) => String(link.type).toUpperCase() === "DOCUMENTATION" || String(link.label).toLowerCase().includes("documentation"),
  );

  const rawLinks = [
    githubLink && { ...githubLink, label: "GitHub", type: "GITHUB" },
    architectureLink && { ...architectureLink, label: "Architecture", type: "ARCHITECTURE" },
    documentationLink && { ...documentationLink, label: "Documentation", type: "DOCUMENTATION" },
  ].filter(Boolean);

  const seen = new Set();

  return rawLinks.filter((link) => {
    const key = normalizeUrl(link.url).toLowerCase();
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
      {links.map((link, index) => {
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
            rel="noreferrer"
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

const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])"
].join(",");

function ProjectDetailsModal({ project, opened, onClose }) {
  const { locale, localizedPath, t } = useLanguage();
  const links = getProjectLinks(project ?? {});
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const hasDescription = Boolean(project?.shortDescription || project?.description);

  useEffect(() => {
    if (!opened) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    const appRoot = document.getElementById("root");
    const previousRootInert = appRoot?.inert ?? false;
    const previousRootAriaHidden = appRoot?.getAttribute("aria-hidden");
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const focusDialog = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const initialTarget = dialog.querySelector(".project-detail-modal-close") ?? dialog;
      initialTarget.focus({ preventScroll: true });
      if (appRoot) {
        appRoot.inert = true;
        appRoot.setAttribute("aria-hidden", "true");
      }
    });

    const handleKeyDown = (event) => {
      const previewModalIsOpen = Boolean(document.querySelector(".file-preview-modal"));
      if (previewModalIsOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusableElements = [...dialog.querySelectorAll(DIALOG_FOCUSABLE_SELECTOR)]
        .filter((element) => element instanceof HTMLElement && !element.hidden && element.getAttribute("aria-hidden") !== "true");

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusDialog);
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("keydown", handleKeyDown);

      if (appRoot) {
        appRoot.inert = previousRootInert;
        if (previousRootAriaHidden === null) appRoot.removeAttribute("aria-hidden");
        else appRoot.setAttribute("aria-hidden", previousRootAriaHidden);
      }

      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected) {
        window.requestAnimationFrame(() => previousFocus.focus({ preventScroll: true }));
      }
    };
  }, [opened, onClose]);

  if (!project || !opened || typeof document === "undefined") return null;

  return createPortal(
    <div className="project-detail-modal-root" onMouseDown={onClose}>
      <div className="project-detail-modal-overlay" aria-hidden="true" />
      <div className="project-detail-modal-inner">
        <div
          ref={dialogRef}
          className="project-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-detail-modal-title"
          aria-describedby={hasDescription ? "project-detail-modal-summary" : undefined}
          tabIndex={-1}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="project-detail-modal-header">
            <h2 id="project-detail-modal-title" className="project-detail-modal-title">{t("projects.modalTitle", { title: project.title })}</h2>
            <button type="button" className="project-detail-modal-close" aria-label={t("projects.closeDetails")} onClick={onClose}>
              ×
            </button>
          </header>

          <div className="project-detail-modal-body">
            <div className="project-detail-scroll">
              <div className="project-detail-hero">
                <div>
                  <Badge className="project-status">{t(`status.${project.status}`, { fallback: project.status })}</Badge>
                  <Title order={2}>{project.title}</Title>
                  {project.subtitle && <Text className="project-detail-subtitle">{project.subtitle}</Text>}
                </div>
                <Text className="project-detail-period">
                  {formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED", locale)}
                </Text>
              </div>

              {project.imageUrl && (
                <PreviewableImage
                  src={project.imageUrl}
                  alt={project.title}
                  className="project-detail-image-preview-trigger"
                  imageClassName="project-detail-image"
                  modalTitle={t("projects.modalTitle", { title: project.title })}
                  showOverlay={false}
                />
              )}

              {(project.shortDescription || project.description) && (
                <section className="project-detail-section">
                  <h3>{t("projects.presentation")}</h3>
                  {project.shortDescription && <Text id="project-detail-modal-summary" className="project-detail-lead">{project.shortDescription}</Text>}
                  {project.description && project.description !== project.shortDescription && (
                    <Text id={project.shortDescription ? undefined : "project-detail-modal-summary"} className="project-detail-text">{project.description}</Text>
                  )}
                </section>
              )}

              {project.features?.length > 0 && (
                <section className="project-detail-section">
                  <h3>{t("projects.features")}</h3>
                  <ul className="project-detail-list">
                    {project.features.map((feature, featureIndex) => (
                      <li key={`${project.id ?? project.title}-detail-feature-${featureIndex}-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                </section>
              )}

              {project.stacks?.length > 0 && (
                <section className="project-detail-section">
                  <h3>{t("projects.stack")}</h3>
                  <Group gap={8} className="project-detail-stack">
                    {project.stacks.map((stack, stackIndex) => (
                      <Badge key={`${project.id ?? project.title}-detail-stack-${stackIndex}-${stack}`} variant="outline" className="stack-badge">
                        {stack}
                      </Badge>
                    ))}
                  </Group>
                </section>
              )}

              <section className="project-detail-section project-detail-links-section">
                <h3>{t("projects.resources")}</h3>
                <Group gap="xs" className="project-detail-resource-actions">
                  <Link to={localizedPath(`/projects/${getProjectSlug(project)}`)} className="project-link project-case-study-link" onClick={onClose}>
                    {t("projects.caseStudy")}
                  </Link>
                  {links.length > 0 && <ProjectLinks project={project} />}
                </Group>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}


function ProjectIsland({ project, index, featured, total, active, onOpenDetails }) {
  const { locale, localizedPath, t } = useLanguage();
  const { cardRef, contentRef, hasOverflow } = useCardOverflowSignal(project, active);
  const showDetails = shouldShowProjectDetails(project) || hasOverflow;

  return (
    <article className={`project-carousel-panel ${showDetails ? "has-project-details" : ""}`}>
      <div className="project-panel-inner">
        <div ref={cardRef} className={`project-slide-card island-card ${featured ? "featured-project-island" : ""}`}>
          <div className="project-slide-index">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <div className="project-slide-grid">
            <ProjectVisual project={project} index={index} active={active} />

            <Stack ref={contentRef} gap="sm" className="project-content">
              <Text className="project-period">
                {formatPeriod(project.startDate, project.endDate, project.status === "IN_PROGRESS" || project.status === "MAINTAINED", locale)}
              </Text>
              <Title order={3}>{project.title}</Title>
              {project.subtitle && <Text className="project-subtitle">{project.subtitle}</Text>}
              <Text className="project-description">{getProjectPreview(project)}</Text>

              <Group gap="xs" className="project-card-actions">
                <ProjectLinks project={project} />
                <Link
                  to={localizedPath(`/projects/${getProjectSlug(project)}`)}
                  className="project-read-more project-case-study-link"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span>{t("projects.caseStudy")}</span>
                </Link>
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
                    <span>{t("projects.details")}</span>
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
  const { t } = useLanguage();

  return (
    <div className="project-toolbar island-card project-toolbar-sticky">
      <TextInput
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder={t("projects.searchPlaceholder")}
        radius="xl"
        className="project-search"
        aria-label={t("projects.searchPlaceholder")}
      />
      <MultiSelect
        data={[{ value: "ALL", label: t("projects.allStatuses") }, ...statuses.map((item) => ({ value: item, label: t(`status.${item}`, { fallback: item }) }))]}
        value={[status]}
        onChange={(values) => setStatus(values.at(-1) ?? "ALL")}
        radius="xl"
        className="status-select"
        maxValues={1}
        searchable={false}
        aria-label={t("projects.filterStatus")}
      />
      <MultiSelect
        data={stacks}
        value={selectedStacks}
        onChange={setSelectedStacks}
        radius="xl"
        className="stack-filter"
        placeholder={t("projects.stacks")}
        searchable
        clearable
        aria-label={t("projects.filterStack")}
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
  const { animationsEnabled, animationsPaused, performanceMode } = useAnimationPreferences();
  const animateFeedback = animationsEnabled && !animationsPaused && performanceMode !== "lite";

  const handlePointerEnter = useCallback(() => {
    if (!animateFeedback) return;
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
  }, [animateFeedback]);

  const handlePointerLeave = useCallback(() => {
    if (!animateFeedback) return;
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
  }, [animateFeedback]);

  // Animation au clic (bouton qui s'enfonce)
  const handlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      if (animateFeedback) gsapReady().then(({ gsap }) => {
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
    [animateFeedback, onNavigate]
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
      if (animateFeedback) gsapReady().then(({ gsap }) => {
        if (!visualRef.current) return;
        gsap.fromTo(
          visualRef.current,
          { scale: 0.9 },
          { scale: 1, duration: 0.3, ease: "back.out(1.6)" }
        );
      });

      onNavigate();
    },
    [animateFeedback, onNavigate]
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
  const { isMobile } = useResponsiveProfile();
  const { t } = useLanguage();
  const galleryRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailsProject, setDetailsProject] = useState(null);
  const closeDetails = useCallback(() => setDetailsProject(null), []);
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
    <div ref={galleryRef} className="project-gallery-shell" aria-roledescription="carousel" aria-label={t("projects.galleryLabel")}>
      {projects.length > 1 && <GalleryNavButton direction="prev" label={t("projects.previous")} onNavigate={handlePrev} />}

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
            const shouldMount = !isMobile || Math.abs(offset) <= 1;
            const key = project.id ?? `${project.title}-${index}`;

            if (!shouldMount) return null;

            return (
              <div
                key={key}
                className={`gallery-panel ${isActive ? "is-active" : ""} ${isVisible ? "is-visible" : "is-hidden"}`}
                style={getPanelStyle(offset)}
                aria-label={isActive ? t("projects.active", { title: project.title }) : t("projects.background", { title: project.title })}
                aria-current={isActive ? "true" : undefined}
                aria-hidden={!isActive}
              >
                <ProjectIsland project={project} index={index} total={projects.length} featured={Boolean(project.featured)} active={isActive} onOpenDetails={setDetailsProject} />
              </div>
            );
          })}
        </div>
      </div>

      {projects.length > 1 && <GalleryNavButton direction="next" label={t("projects.next")} onNavigate={handleNext} />}

      <Group gap="xs" justify="center" className="gallery-dots" aria-label={t("projects.navigation")}>
        {projects.map((project, index) => (
          <button
            key={project.id ?? `${project.title}-dot-${index}`}
            type="button"
            className={`gallery-dot ${index === safeActiveIndex ? "is-active" : ""}`}
            onClick={() => goTo(index, index > safeActiveIndex ? 1 : -1)}
            aria-label={t("projects.goTo", { index: index + 1 })}
            aria-current={index === safeActiveIndex ? "true" : undefined}
          />
        ))}
      </Group>

      <Text className="gallery-live-label" aria-live="polite">
        {String(safeActiveIndex + 1).padStart(2, "0")} — {activeProject.title}
      </Text>
    </div>
    <ProjectDetailsModal project={detailsProject} opened={detailsOpened} onClose={closeDetails} />
    </>
  );
}

export default function ProjectsShowcase({ projects }) {
  const { t } = useLanguage();
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
        eyebrow={t("projects.eyebrow")}
        title={t("projects.title")}
        description={t("projects.description")}
        rightSlot={
          <Button onClick={exportProjects} radius="xl" variant="light">
            {t("projects.exportJson")}
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
          {t(filteredProjects.length > 1 ? "projects.countMany" : "projects.countOne", { count: filteredProjects.length })}
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
          <Title order={3}>{t("projects.noResultTitle")}</Title>
          <Text>{t("projects.noResultText")}</Text>
        </Card>
      )}
    </section>
  );
}
