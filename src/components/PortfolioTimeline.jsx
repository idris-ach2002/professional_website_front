import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SectionTitle from "./SectionTitle";
import OrganizationBrand from "./OrganizationBrand";
import useLanguage from "../localization/useLanguage";
import ExplorationDrone from "./ExplorationDrone";
import FossilTimelineSurface from "./timeline/FossilTimelineSurface";
import { PreviewableImage } from "./FilePreview";
import { formatPeriod, normalizeUrl, slugify } from "../utils/portfolio";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { clamp, pingPongState, progressForStep } from "../animations/timelineMotion";
import {
  createInspectionPilot,
  INSPECTION_PHASES,
  requestInspectionTarget,
  stepInspectionPilot,
} from "../animations/timelineInspectionEngine";
import { announceOceanWorldMounted } from "../ocean/oceanWorldRegistration";
import { useItemVisibility } from "../visibility/useItemVisibility";
import "../styles/sections/timeline-fossil-v50.css";
import { experienceVisibilityKey } from "../visibility/itemVisibilityRegistry";

const categoryClasses = {
  SCHOOL: "timeline-school",
  INTERNSHIP: "timeline-internship",
  ALTERNANCE: "timeline-work",
  CDI: "timeline-work",
  CDD: "timeline-work",
  FREELANCE: "timeline-freelance",
  CERTIFICATION: "timeline-certification",
  VOLUNTEERING: "timeline-volunteering",
};



function getDiveDepthMeters(index, total) {
  const minDepth = 500;
  const maxDepth = 2000;
  if (total <= 1) return minDepth;
  const progress = index / (total - 1);
  return Math.round((minDepth + (maxDepth - minDepth) * progress) / 25) * 25;
}

function ExperienceSkillGrid({ skills, label }) {
  const normalizedSkills = [...new Set((skills ?? []).map((skill) => String(skill ?? "").trim()).filter(Boolean))];
  if (!normalizedSkills.length) return null;

  return (
    <div className="timeline-skill-panel">
      <div className="timeline-skill-panel-heading">
        <span>{label}</span>
      </div>
      <div className="timeline-skill-grid skill-row stack-row">
        {normalizedSkills.map((skill, index) => (
          <span
            key={skill}
            className="timeline-skill-grid-item skill-badge"
            style={{ "--skill-delay": `${index * -0.72}s` }}
            title={skill}
          >
            <span className="timeline-skill-label">{skill}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function getExperienceAnchor(experience, index) {
  const source = [experience?.title, experience?.organization]
    .filter(Boolean)
    .join(" ") || `experience-${index + 1}`;

  return `experience-${slugify(source)}-${index}`;
}


function getCardSide(card, isMobile, index = 0) {
  if (isMobile) return "right";
  if (card?.classList.contains("is-right")) return "right";
  if (card?.classList.contains("is-left")) return "left";
  return index % 2 === 0 ? "left" : "right";
}

function TimelineSheetIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6.5h16M6 10.5h12M7.5 14.5h9M9 18.5h6" />
      <path d="M6 3.5h12l2 3v11l-2 3H6l-2-3v-11l2-3Z" />
    </svg>
  );
}

function TimelineZoomIcon({ size = 24, zoomed = false }) {
  return (
    <svg className="timeline-zoom-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.6" cy="10.6" r="6.1" />
      <path d="m15.2 15.2 4.9 4.9" />
      <path d="M7.7 10.6h5.8" />
      {!zoomed && <path d="M10.6 7.7v5.8" />}
    </svg>
  );
}


function getExperienceResourceUrl(experience) {
  return String(
    experience?.websiteUrl
      ?? experience?.resourceUrl
      ?? experience?.documentationUrl
      ?? "",
  ).trim();
}

function TimelineResourceAction({ experience, t, zoomed = false }) {
  const resourceUrl = getExperienceResourceUrl(experience);
  const className = `timeline-link timeline-resource-dock${resourceUrl ? "" : " is-disabled"}${zoomed ? " timeline-resource-dock--zoom" : ""}`;

  if (!resourceUrl) {
    return (
      <button type="button" className={className} disabled aria-disabled="true">
        <span>{t("projects.resources")}</span><span aria-hidden="true">↗</span>
      </button>
    );
  }

  return (
    <Anchor
      href={normalizeUrl(resourceUrl)}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      <span>{t("projects.resources")}</span><span aria-hidden="true">↗</span>
    </Anchor>
  );
}

function ExperienceCardSurface({
  experience,
  index,
  period,
  depthMeters,
  t,
  zoomed = false,
  onOpenDetails,
  onToggleZoom,
}) {
  return (
    <Card
      className={`timeline-card island-card timeline-expedition-card timeline-fossil-card${zoomed ? " timeline-card--zoom" : ""}`}
      radius="xl"
      data-zoomed={zoomed ? "true" : "false"}
    >
      <FossilTimelineSurface
        category={experience.category}
        index={index}
        label={`${zoomed ? "zoom-" : ""}${experience.title ?? "experience"}-${experience.organization ?? "portfolio"}`}
        immersive={zoomed}
      />
      <div className="timeline-fossil-content-grid">
        <section className="timeline-fossil-primary-capsule">
          <div className="timeline-expedition-topline">
            <Text className="timeline-expedition-date">{period}</Text>
          </div>

          <Group justify="space-between" align="flex-start" gap="md" className="timeline-expedition-heading">
            <Stack gap={8} className="timeline-main-copy">
              <Group gap={8} className="timeline-expedition-statuses">
                <Badge className="timeline-category timeline-state-badge" radius="xl">
                  <span className="timeline-state-signal" aria-hidden="true" />
                  <span>{t(`category.${experience.category}`, { fallback: experience.category })}</span>
                </Badge>
                {experience.currentPosition && (
                  <Badge className="current-badge timeline-state-badge timeline-state-badge--current">
                    <span className="timeline-state-signal" aria-hidden="true" />
                    <span>{t("timeline.current")}</span>
                  </Badge>
                )}
              </Group>
              <div className="timeline-experience-title-shell">
                <span className="timeline-title-rail" aria-hidden="true" />
                <Title order={2}>{experience.title}</Title>
                <span className="timeline-title-glint" aria-hidden="true" />
              </div>
              <div className="timeline-org">
                <OrganizationBrand organization={experience.organization} compact />
                {experience.location && <span className="timeline-location">· {experience.location}</span>}
              </div>
            </Stack>
          </Group>
        </section>

        {(experience.summary || experience.description) && (
          <section className="timeline-fossil-secondary-capsule">
            {experience.summary && <Text className="timeline-summary">{experience.summary}</Text>}
            {experience.description && <Text className="timeline-description">{experience.description}</Text>}
          </section>
        )}

        {experience.imageUrl && (
          <PreviewableImage
            src={experience.imageUrl}
            alt={experience.title}
            className="timeline-image-preview-trigger"
            imageClassName="timeline-image"
            modalTitle={`${t("nav.journey")} — ${experience.title}`}
          />
        )}

        {experience.skills?.length > 0 && (
          <div className="timeline-expedition-footer timeline-fossil-footer-capsule">
            <div className="timeline-systems-block">
              <ExperienceSkillGrid skills={experience.skills} label={t("skills.title", { fallback: "Compétences" })} />
            </div>
          </div>
        )}

        <div className="timeline-resource-zone timeline-desktop-actions">
          <TimelineResourceAction experience={experience} t={t} zoomed={zoomed} />
          <button
            type="button"
            className="timeline-zoom-dock"
            onClick={onToggleZoom}
            aria-label={`${zoomed ? t("projects.closeDetails") : t("projects.details")} — ${experience.title}`}
          >
            <TimelineZoomIcon zoomed={zoomed} />
          </button>
        </div>
      </div>

      {!zoomed && (
        <button type="button" className="timeline-compact-open" onClick={onOpenDetails} aria-label={`${t("nav.journey")} — ${experience.title}`}>
          <span>{t("projects.details")}</span><span aria-hidden="true">›</span>
        </button>
      )}
      {zoomed && <span className="timeline-zoom-depth-chip" aria-hidden="true">{depthMeters} m</span>}
    </Card>
  );
}

function TimelineDetailSheet({ experience, locale, t, onClose }) {
  useEffect(() => {
    if (!experience) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [experience, onClose]);

  if (!experience) return null;
  const period = formatPeriod(experience.startDate, experience.endDate, experience.currentPosition, locale);

  const sheet = (
    <div className="timeline-ios-sheet-layer" data-open="true">
      <button type="button" className="timeline-ios-sheet-backdrop" aria-label={t("projects.closeDetails")} onClick={onClose} />
      <section className="timeline-ios-sheet" role="dialog" aria-modal="true" aria-labelledby="timeline-ios-sheet-title">
        <div className="timeline-ios-sheet-grabber" aria-hidden="true" />
        <header className="timeline-ios-sheet-header">
          <span className="timeline-ios-sheet-icon"><TimelineSheetIcon /></span>
          <div>
            <span className="timeline-ios-sheet-period">{period}</span>
            <h3 id="timeline-ios-sheet-title">{experience.title}</h3>
            <div className="timeline-ios-sheet-org-row">
              <OrganizationBrand organization={experience.organization} compact />
              {experience.location && <span className="timeline-location">· {experience.location}</span>}
            </div>
          </div>
          <button type="button" className="timeline-ios-sheet-close" onClick={onClose} aria-label={t("projects.closeDetails")}>×</button>
        </header>
        <div className="timeline-ios-sheet-scroll">
          {experience.summary && <p className="timeline-ios-sheet-summary">{experience.summary}</p>}
          {experience.description && <p className="timeline-ios-sheet-description">{experience.description}</p>}
          {experience.skills?.length > 0 && (
            <div className="timeline-ios-sheet-skills" aria-label={t("timeline.systems")}>
              {experience.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}

function TimelineZoomModal({ entry, locale, t, onClose }) {
  useEffect(() => {
    if (!entry) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [entry, onClose]);

  if (!entry) return null;
  const { experience, index, depthMeters } = entry;
  const period = formatPeriod(experience.startDate, experience.endDate, experience.currentPosition, locale);

  const modal = (
    <div className="timeline-zoom-layer" data-open="true">
      <button type="button" className="timeline-zoom-backdrop" aria-label={t("projects.closeDetails")} onClick={onClose} />
      <section className="timeline-zoom-shell timeline-zoom-shell--same-card" role="dialog" aria-modal="true" aria-label={`${t("timeline.zoom", { fallback: "Zoom" })} — ${experience.title}`}>
        <button type="button" className="timeline-zoom-close timeline-zoom-close--floating" onClick={onClose} aria-label={t("projects.closeDetails")}>×</button>
        <div className="timeline-zoom-scroll timeline-zoom-scroll--same-card">
          <ExperienceCardSurface
            experience={experience}
            index={index}
            period={period}
            depthMeters={depthMeters}
            t={t}
            zoomed
            onToggleZoom={onClose}
          />
        </div>
      </section>
    </div>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}

export default function PortfolioTimeline({ timeline, experiences = [], performanceMode = "full" }) {
  const rootRef = useRef(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [zoomedExperience, setZoomedExperience] = useState(null);
  const { isVisible } = useItemVisibility();
  const visibleExperiences = experiences.filter((experience, index) => isVisible(experienceVisibilityKey(experience, index)));

  useEffect(() => {
    announceOceanWorldMounted("timeline");
  }, []);
  const { locale, t } = useLanguage();
  const {
    preference: animationPreference,
    animationsEnabled,
    animationsPaused,
  } = useAnimationPreferences();

  const autonomousEnabled = animationsEnabled
    && !animationsPaused
    && !(performanceMode === "lite" && animationPreference !== "auto");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const stage = root.querySelector(".timeline-autonomous-stage");
    const lineProgress = root.querySelector(".timeline-straight-line-progress");
    const submarine = root.querySelector(".timeline-submarine");
    const explorationDrone = root.querySelector(".timeline-exploration-drone");
    const cards = Array.from(root.querySelectorAll(".timeline-row"));
    const exitSentinel = root.querySelector(".timeline-exit-sentinel");

    if (!stage || !lineProgress) return undefined;

    const revealAllCards = () => {
      cards.forEach((card) => {
        card.dataset.timelineCardState = "revealed";
      });
      lineProgress.style.transform = "scaleY(1)";
      root.dataset.timelineReveal = "complete";
    };

    const clearInspection = () => {
      cards.forEach((card) => {
        card.dataset.timelineInspection = "idle";
        delete card.dataset.fossilCompactScan;
      });
      root.dataset.timelineInspection = "idle";
      delete root.dataset.timelineInspectionCard;
    };

    if (!autonomousEnabled) {
      root.dataset.timelineScene = animationsPaused ? "paused" : "static";
      root.dataset.timelineEntry = "none";
      revealAllCards();
      clearInspection();
      if (explorationDrone) explorationDrone.style.opacity = "0";
      if (submarine) submarine.style.opacity = "0";
      return undefined;
    }

    const isMobile = window.matchMedia?.("(max-width: 1240px)").matches;
    let sceneInRange = false;
    let exitZoneActive = false;
    let terminalExitPending = false;
    let terminalExitTimer = 0;
    let pageVisible = !document.hidden;
    let travelDirection = "down";
    let lastExitSentinelTop = null;
    const observedCardTops = new Map();
    let frame = 0;
    let lastTimestamp = 0;
    let elapsedMs = 0;
    let metrics = null;
    let resizeFrame = 0;
    let scrollFrame = 0;
    let lastGeometrySyncAt = 0;
    let revealTimers = [];
    let requestedTargetIndex = -1;
    let renderedInspectionIndex = -2;
    let renderedInspectionPhase = "";
    const visibleCards = new Map();

    let pilot = createInspectionPilot({
      x: isMobile ? 0.10 : 0.72,
      y: isMobile ? 0.22 : 0.18,
      facing: "left",
    });

    root.dataset.timelineScene = "idle";
    root.dataset.timelineEntry = "none";
    root.dataset.timelineReveal = "ready";
    root.dataset.timelineInspection = "idle";
    cards.forEach((card) => {
      card.dataset.timelineCardState = "revealed";
      card.dataset.timelineInspection = "idle";
    });

    const clearRevealTimers = () => {
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      revealTimers = [];
    };

    const measure = () => {
      const width = stage.clientWidth || root.clientWidth || window.innerWidth || 1024;
      const height = stage.clientHeight || Math.min(window.innerHeight * 0.66, 680);
      const droneWidth = explorationDrone?.offsetWidth ?? 0;
      const droneHeight = explorationDrone?.offsetHeight ?? 0;
      const submarineWidth = submarine?.offsetWidth ?? 0;
      const submarineHeight = submarine?.offsetHeight ?? 0;
      const sideMargin = isMobile
        ? clamp(width * 0.02, 6, 14)
        : clamp(width * 0.04, 24, 64);

      return {
        width,
        height,
        droneWidth,
        droneHeight,
        submarineWidth,
        submarineHeight,
        droneRangeX: Math.max(0, width - droneWidth - sideMargin * 2),
        droneRangeY: Math.max(0, height - droneHeight - 18),
        sideMargin,
      };
    };

    const applyTarget = (index) => {
      const card = cards[index];
      if (!card || card.dataset.timelineCardState !== "revealed") return;
      requestedTargetIndex = index;
      pilot = requestInspectionTarget(
        pilot,
        {
          index,
          side: getCardSide(card, isMobile, index),
          y: visibleCards.get(index)?.stageY,
        },
        { mobile: isMobile },
      );
    };

    const selectBestVisibleCard = ({ force = false } = {}) => {
      if (!force && (exitZoneActive || terminalExitPending)) return;
      const candidates = [...visibleCards.entries()]
        .filter(([index, info]) => (
          info.ratio >= 0.05
          && cards[index]?.dataset.timelineCardState === "revealed"
        ))
        .sort((a, b) => {
          const centerDelta = a[1].centerDistance - b[1].centerDistance;
          if (Math.abs(centerDelta) > 24) return centerDelta;
          return b[1].ratio - a[1].ratio;
        });

      if (!candidates.length) return;
      const nextIndex = Number(candidates[0][0]);
      if (!force && nextIndex === requestedTargetIndex) return;

      const currentInfo = visibleCards.get(requestedTargetIndex);
      const nextInfo = candidates[0][1];
      if (
        !force
        && currentInfo
        && cards[requestedTargetIndex]?.dataset.timelineCardState === "revealed"
        && currentInfo.centerDistance <= nextInfo.centerDistance + 28
      ) {
        return;
      }

      applyTarget(nextIndex);
    };

    const syncCompactInspection = () => {
      requestedTargetIndex = -1;
      cards.forEach((card, index) => {
        const info = visibleCards.get(index);
        const visible = Boolean(info && info.ratio >= 0.02 && card.dataset.timelineCardState === "revealed");
        card.dataset.timelineInspection = "idle";
        card.dataset.fossilCompactScan = visible ? "ambient" : "idle";
      });

      root.dataset.timelineInspection = "ambient";
      delete root.dataset.timelineInspectionCard;
    };

    const refreshVisibleCardsFromLayout = ({ force = false } = {}) => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? 800;
      const viewportFocus = viewportHeight * (isMobile ? 0.46 : 0.50);
      const stageRect = stage.getBoundingClientRect();
      visibleCards.clear();

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        if (visibleHeight <= 0) return;

        // A tall experience must stay targetable for the whole time the viewport
        // focus line crosses the card. Measuring only the card center caused the
        // submarine torch to lag behind after the cards became taller.
        const focusDistance = viewportFocus < rect.top
          ? rect.top - viewportFocus
          : viewportFocus > rect.bottom
            ? viewportFocus - rect.bottom
            : 0;
        const fossilFocus = rect.top + Math.min(rect.height * 0.18, 148);
        const denominator = Math.max(1, Math.min(rect.height, viewportHeight));
        visibleCards.set(index, {
          ratio: clamp(visibleHeight / denominator, 0, 1),
          centerDistance: focusDistance,
          stageY: stageRect.height > 1
            ? clamp((fossilFocus - stageRect.top) / stageRect.height, 0.14, 0.82)
            : undefined,
        });
      });

      if (isMobile) syncCompactInspection();
      else selectBestVisibleCard({ force });
    };

    const scheduleCardSync = ({ force = false } = {}) => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        if (!sceneInRange || exitZoneActive) return;
        refreshVisibleCardsFromLayout({ force });
      });
    };

    const rearmInspectionFromBelow = () => {
      window.clearTimeout(terminalExitTimer);
      terminalExitTimer = 0;
      terminalExitPending = false;
      exitZoneActive = false;
      root.dataset.timelineExit = "clear";
      root.dataset.timelineEntry = "up";
      revealAllCards();

      requestedTargetIndex = -1;
      renderedInspectionIndex = -2;
      renderedInspectionPhase = "";
      pilot = createInspectionPilot({
        x: isMobile ? 0.12 : 0.72,
        y: isMobile ? 0.74 : 0.80,
        facing: "left",
      });
      clearInspection();

      if (explorationDrone) {
        explorationDrone.style.opacity = "0";
        explorationDrone.style.setProperty("--torch-strength", "0");
        explorationDrone.dataset.torch = "off";
      }

      startLoop();
      window.requestAnimationFrame(() => refreshVisibleCardsFromLayout({ force: true }));
    };

    const playCardReveal = () => {
      clearRevealTimers();
      root.dataset.timelineReveal = "playing";
      lineProgress.style.transform = "scaleY(0)";
      cards.forEach((card) => {
        card.dataset.timelineCardState = "pending";
        card.dataset.timelineInspection = "idle";
      });

      const total = Math.max(1, cards.length);
      const interval = clamp(3_100 / total, 300, 560);
      const lead = isMobile ? 170 : 220;

      cards.forEach((card, index) => {
        const timer = window.setTimeout(() => {
          card.dataset.timelineCardState = "revealed";
          lineProgress.style.transform = `scaleY(${progressForStep(index, total)})`;
          if (index === total - 1) root.dataset.timelineReveal = "complete";
          scheduleCardSync();
        }, lead + index * interval);
        revealTimers.push(timer);
      });
    };

    const updateInspectionUI = () => {
      if (
        renderedInspectionIndex === pilot.targetIndex
        && renderedInspectionPhase === pilot.phase
      ) return;

      renderedInspectionIndex = pilot.targetIndex;
      renderedInspectionPhase = pilot.phase;
      const isInspecting = pilot.phase === INSPECTION_PHASES.INSPECT;
      const isApproaching = pilot.phase === INSPECTION_PHASES.TRANSIT
        || pilot.phase === INSPECTION_PHASES.APPEAR;

      cards.forEach((card, index) => {
        card.dataset.timelineInspection = index === pilot.targetIndex
          ? isInspecting ? "active" : isApproaching ? "approaching" : "idle"
          : "idle";
      });

      root.dataset.timelineInspection = isInspecting
        ? "active"
        : isApproaching ? "approaching" : "idle";

      if (pilot.targetIndex >= 0) root.dataset.timelineInspectionCard = String(pilot.targetIndex);
      else delete root.dataset.timelineInspectionCard;
    };

    const renderFrame = (timestamp) => {
      frame = 0;
      if (!sceneInRange || exitZoneActive || !pageVisible || !autonomousEnabled) return;

      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaSeconds = clamp((timestamp - lastTimestamp) / 1000, 0, 0.05);
      lastTimestamp = timestamp;
      elapsedMs += deltaSeconds * 1000;
      const activeMetrics = metrics ?? measure();

      // Re-sample live card geometry from the autonomous animation clock.
      // This keeps the torch locked to tall cards without coupling decoration
      // movement to raw scroll coordinates or scroll events.
      if (timestamp - lastGeometrySyncAt >= 72) {
        lastGeometrySyncAt = timestamp;
        refreshVisibleCardsFromLayout();
      }

      if (explorationDrone && !isMobile) {
        pilot = stepInspectionPilot(pilot, deltaSeconds, { mobile: false });

        const x = activeMetrics.sideMargin + activeMetrics.droneRangeX * pilot.x;
        const y = activeMetrics.droneRangeY * pilot.y;
        explorationDrone.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        explorationDrone.style.opacity = String(pilot.opacity * (performanceMode === "balanced" ? 0.84 : 0.96));
        explorationDrone.style.setProperty("--torch-strength", pilot.torch.toFixed(3));
        explorationDrone.dataset.facing = pilot.facing;
        explorationDrone.dataset.inspectionPhase = pilot.phase;
        explorationDrone.dataset.torch = pilot.torch > 0.32 ? "on" : "off";
        updateInspectionUI();
      }

      if (submarine && !isMobile) {
        const subMotion = pingPongState(elapsedMs + 4_200, 23_500);
        const verticalRange = Math.max(0, activeMetrics.height - activeMetrics.submarineHeight - 24);
        const centerX = activeMetrics.width * 0.51 - activeMetrics.submarineWidth / 2;
        const sway = Math.sin((elapsedMs / 1000) * 0.36) * 6;
        const y = 12 + verticalRange * subMotion.progress;
        submarine.style.transform = `translate3d(${(centerX + sway).toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        submarine.style.opacity = "0.42";
      } else if (submarine) {
        submarine.style.opacity = "0";
      }

      frame = window.requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (frame || !sceneInRange || exitZoneActive || !pageVisible || !autonomousEnabled) return;
      lastTimestamp = 0;
      root.dataset.timelineScene = "active";
      frame = window.requestAnimationFrame(renderFrame);
    };

    const stopLoop = (state = "idle") => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastTimestamp = 0;
      root.dataset.timelineScene = state;
    };

    const sceneObserver = new IntersectionObserver(
      ([entry]) => {
        const wasInRange = sceneInRange;
        sceneInRange = Boolean(entry?.isIntersecting);

        if (sceneInRange && !wasInRange) {
          const enteringUpward = (entry?.boundingClientRect?.top ?? 0) < 0;
          exitZoneActive = false;
          terminalExitPending = false;
          window.clearTimeout(terminalExitTimer);
          terminalExitTimer = 0;
          root.dataset.timelineEntry = enteringUpward ? "up" : "down";
          root.dataset.timelineExit = "clear";
          requestedTargetIndex = -1;
          renderedInspectionIndex = -2;
          renderedInspectionPhase = "";
          pilot = createInspectionPilot({
            x: isMobile ? 0.10 : 0.72,
            y: enteringUpward ? (isMobile ? 0.74 : 0.80) : (isMobile ? 0.22 : 0.18),
            facing: "left",
          });
          if (enteringUpward) revealAllCards();
          else playCardReveal();
          startLoop();
          window.requestAnimationFrame(() => refreshVisibleCardsFromLayout({ force: enteringUpward }));
          return;
        }

        if (!sceneInRange && wasInRange) {
          window.clearTimeout(terminalExitTimer);
          terminalExitTimer = 0;
          terminalExitPending = false;
          exitZoneActive = false;
          renderedInspectionIndex = -2;
          renderedInspectionPhase = "";
          root.dataset.timelineExit = "clear";
          clearRevealTimers();
          revealAllCards();
          root.dataset.timelineEntry = "none";
          visibleCards.clear();
          observedCardTops.clear();
          lastExitSentinelTop = null;
          requestedTargetIndex = -1;
          clearInspection();
          if (explorationDrone) {
            explorationDrone.style.opacity = "0";
            explorationDrone.style.setProperty("--torch-strength", "0");
          }
          if (submarine) submarine.style.opacity = "0";
          stopLoop("idle");
        }
      },
      { root: null, rootMargin: "6% 0px 0px 0px", threshold: [0, 0.01] },
    );

    const exitObserver = exitSentinel ? new IntersectionObserver(
      ([entry]) => {
        const nextExitZone = Boolean(entry?.isIntersecting);
        const sentinelTop = Number(entry?.boundingClientRect?.top);
        if (Number.isFinite(sentinelTop)) {
          if (Number.isFinite(lastExitSentinelTop) && Math.abs(sentinelTop - lastExitSentinelTop) >= 2) {
            travelDirection = sentinelTop < lastExitSentinelTop ? "down" : "up";
            root.dataset.timelineDirection = travelDirection;
          }
          lastExitSentinelTop = sentinelTop;
        }

        if (travelDirection === "up") {
          if (sceneInRange && (nextExitZone || exitZoneActive || terminalExitPending)) {
            rearmInspectionFromBelow();
          }
          return;
        }

        if (!nextExitZone) return;
        if (exitZoneActive || terminalExitPending) return;

        const terminalIndex = cards.length - 1;
        const terminalCard = cards[terminalIndex];
        const canHoldTerminalCard = Boolean(
          terminalCard
          && terminalCard.dataset.timelineCardState === "revealed",
        );

        if (canHoldTerminalCard) {
          terminalExitPending = true;
          root.dataset.timelineExit = "holding";
          requestedTargetIndex = -1;
          renderedInspectionIndex = -2;
          renderedInspectionPhase = "";
          applyTarget(terminalIndex);

          cards.forEach((card, index) => {
            card.dataset.timelineInspection = index === terminalIndex ? "approaching" : "idle";
          });
          root.dataset.timelineInspection = "approaching";
          root.dataset.timelineInspectionCard = String(terminalIndex);

          if (explorationDrone) {
            explorationDrone.dataset.torch = "on";
            explorationDrone.style.setProperty("--torch-strength", "1.42");
          }
          startLoop();

          terminalExitTimer = window.setTimeout(() => {
            terminalExitTimer = 0;
            terminalExitPending = false;
            if (travelDirection === "up") {
              rearmInspectionFromBelow();
              return;
            }
            exitZoneActive = true;
            root.dataset.timelineExit = "approaching";
            clearInspection();
            if (explorationDrone) {
              explorationDrone.style.opacity = "0";
              explorationDrone.style.setProperty("--torch-strength", "0");
              explorationDrone.dataset.torch = "off";
            }
            if (submarine) submarine.style.opacity = "0";
            stopLoop("exiting");
          }, 420);
          return;
        }

        exitZoneActive = true;
        root.dataset.timelineExit = "approaching";
        clearInspection();
        if (explorationDrone) {
          explorationDrone.style.opacity = "0";
          explorationDrone.style.setProperty("--torch-strength", "0");
          explorationDrone.dataset.torch = "off";
        }
        if (submarine) submarine.style.opacity = "0";
        stopLoop("exiting");
      },
      { root: null, rootMargin: "0px 0px -14% 0px", threshold: [0, 0.01] },
    ) : null;

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.timelineCardIndex);
          const cardTop = Number(entry.boundingClientRect?.top);
          const previousTop = observedCardTops.get(index);
          if (Number.isFinite(cardTop)) {
            if (Number.isFinite(previousTop) && Math.abs(cardTop - previousTop) >= 2) {
              travelDirection = cardTop < previousTop ? "down" : "up";
              root.dataset.timelineDirection = travelDirection;
              if (travelDirection === "up" && (exitZoneActive || terminalExitPending)) {
                rearmInspectionFromBelow();
              }
            }
            observedCardTops.set(index, cardTop);
          }
        });
        // IntersectionObserver is only a wake-up signal. Exact targeting is
        // recomputed from live card geometry so tall cards never create a torch offset.
        scheduleCardSync();
      },
      { root: null, rootMargin: "-2% 0px -2% 0px", threshold: [0, 0.04, 0.12, 0.25, 0.4, 0.6, 0.8] },
    );

    root.dataset.timelineDirection = travelDirection;
    sceneObserver.observe(root);
    if (exitSentinel) exitObserver?.observe(exitSentinel);
    cards.forEach((card) => cardObserver.observe(card));

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible && sceneInRange) startLoop();
      else stopLoop(document.hidden ? "sleeping" : "idle");
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        metrics = measure();
        scheduleCardSync({ force: true });
      });
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleMeasure)
      : null;

    metrics = measure();
    resizeObserver?.observe(stage);
    window.visualViewport?.addEventListener("resize", scheduleMeasure, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    window.requestAnimationFrame(() => refreshVisibleCardsFromLayout({ force: true }));

    return () => {
      window.clearTimeout(terminalExitTimer);
      terminalExitTimer = 0;
      terminalExitPending = false;
      clearRevealTimers();
      stopLoop("idle");
      sceneObserver.disconnect();
      exitObserver?.disconnect();
      cardObserver.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      window.cancelAnimationFrame(scrollFrame);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      document.removeEventListener("visibilitychange", handleVisibility);
      delete root.dataset.timelineEntry;
      delete root.dataset.timelineReveal;
      delete root.dataset.timelineInspection;
      delete root.dataset.timelineInspectionCard;
      delete root.dataset.timelineExit;
      delete root.dataset.timelineDirection;
      cards.forEach((card) => {
        delete card.dataset.timelineCardState;
        delete card.dataset.timelineInspection;
        delete card.dataset.fossilCompactScan;
      });
    };
  }, [autonomousEnabled, visibleExperiences.length, performanceMode, animationsPaused]);

  return (
    <section
      ref={rootRef}
      id="timeline"
      className="page-section timeline-section is-autonomous-timeline"
      data-motion-engine="abyss-expedition-inspection-v20-9"
      data-motion-source="time-and-intersection-state"
      data-timeline-scene={autonomousEnabled ? "idle" : animationsPaused ? "paused" : "static"}
      data-timeline-entry="none"
      data-timeline-reveal={autonomousEnabled ? "ready" : "complete"}
      data-timeline-inspection="idle"
      data-timeline-exit="clear"
    >
      <div className="timeline-abyss-atmosphere" aria-hidden="true">
        <span className="timeline-abyss-glow timeline-abyss-glow--one" />
        <span className="timeline-abyss-glow timeline-abyss-glow--two" />
        <span className="timeline-abyss-seabed" />
      </div>

      <div className="timeline-dive-viewport">
        <div className="timeline-dive-content">
          <SectionTitle
            reveal="soft"
            managedMotion
            eyebrow={t("timeline.eyebrow")}
            title={timeline?.title ?? t("timeline.defaultTitle")}
            description={timeline?.description ?? t("timeline.defaultDescription")}
          />

          <div className="timeline-subsea-track">
            <div className="timeline-straight-line" aria-hidden="true">
              <span className="timeline-straight-line-progress" />
            </div>

            <div className="timeline-autonomous-stage" aria-hidden="true">
              <ExplorationDrone />
              <img
                src="/assets/ocean/submarine-scroll.svg"
                alt=""
                aria-hidden="true"
                className="timeline-submarine"
                loading="lazy"
              />
            </div>

            <div className="timeline-list">
              {visibleExperiences.map((experience, index) => {
                const side = index % 2 === 0 ? "left" : "right";
                const period = formatPeriod(
                  experience.startDate,
                  experience.endDate,
                  experience.currentPosition,
                  locale,
                );
                const depthMeters = getDiveDepthMeters(index, visibleExperiences.length);

                return (
                  <article
                    id={getExperienceAnchor(experience, index)}
                    key={experience.id ?? `${experience.title}-${index}`}
                    className={`timeline-row timeline-expedition-row is-${side} ${categoryClasses[experience.category] ?? ""}`}
                    data-timeline-card-index={index}
                    data-timeline-card-state="revealed"
                    data-timeline-inspection="idle"
                    data-timeline-travel-side={side}
                  >
                    <span className="timeline-strata-marker" aria-hidden="true">
                      <span className="timeline-depth-label">
                        <small>{t("timeline.depth", { fallback: "Profondeur" })}</small>
                        <strong>{depthMeters} m</strong>
                      </span>
                    </span>
                    <ExperienceCardSurface
                      experience={experience}
                      index={index}
                      period={period}
                      depthMeters={depthMeters}
                      t={t}
                      onOpenDetails={() => setSelectedExperience(experience)}
                      onToggleZoom={() => setZoomedExperience({ experience, index, depthMeters })}
                    />
                  </article>
                );
              })}
            </div>
            <div className="timeline-exit-sentinel" aria-hidden="true" />
          </div>
        </div>
      </div>
      <TimelineDetailSheet experience={selectedExperience} locale={locale} t={t} onClose={() => setSelectedExperience(null)} />
      <TimelineZoomModal entry={zoomedExperience} locale={locale} t={t} onClose={() => setZoomedExperience(null)} />
    </section>
  );
}
