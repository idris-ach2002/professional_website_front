import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useEffect, useRef } from "react";
import SectionTitle from "./SectionTitle";
import OrganizationBrand from "./OrganizationBrand";
import useLanguage from "../localization/useLanguage";
import ExplorationDrone from "./ExplorationDrone";
import TimelineDetailSheet from "./timeline/TimelineDetailSheet";
import { PreviewableImage } from "./FilePreview";
import { formatPeriod, slugify } from "../utils/portfolio";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { clamp, progressForStep } from "../animations/timelineMotion";
import {
  createInspectionPilot,
  INSPECTION_PHASES,
  requestInspectionTarget,
  stepInspectionPilot,
} from "../animations/timelineInspectionEngine";
import { announceOceanWorldMounted } from "../ocean/oceanWorldRegistration";
import { useItemVisibility } from "../visibility/useItemVisibility";
import { experienceVisibilityKey } from "../visibility/itemVisibilityRegistry";
import "../styles/sections/timeline-legacy-optimized.css";
import "../styles/sections/timeline-mission-ui.css";

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

const SCENOGRAPHIC_DEPTHS = [180, 420, 760, 1_150, 1_580, 2_080, 2_700, 3_400, 4_150];

function getExperienceAnchor(experience, index) {
  const source = [experience?.title, experience?.organization]
    .filter(Boolean)
    .join(" ") || `experience-${index + 1}`;
  return `experience-${slugify(source)}-${index}`;
}

function getScenographicDepth(index) {
  if (index < SCENOGRAPHIC_DEPTHS.length) return SCENOGRAPHIC_DEPTHS[index];
  return SCENOGRAPHIC_DEPTHS.at(-1) + (index - SCENOGRAPHIC_DEPTHS.length + 1) * 820;
}

function formatDepth(depth, locale) {
  const language = locale === "en" ? "en-US" : "fr-FR";
  return `−${new Intl.NumberFormat(language).format(depth)} m`;
}

function getCardSide(card, isMobile, index = 0) {
  if (isMobile) return "right";
  if (card?.classList.contains("is-right")) return "right";
  if (card?.classList.contains("is-left")) return "left";
  return index % 2 === 0 ? "left" : "right";
}

function TimelineCardReef({ variant = 0 }) {
  return (
    <div
      className="timeline-card-reef-field"
      data-reef-variant={variant % 3}
      aria-hidden="true"
    />
  );
}

export default function PortfolioTimeline({ timeline, experiences = [], performanceMode = "full" }) {
  const rootRef = useRef(null);
  const detailSheetRef = useRef(null);
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
    let metrics = null;
    let resizeFrame = 0;
    let scrollFrame = 0;
    let geometryDirty = true;
    let pendingCardSyncForce = false;
    let pendingGeometryMeasure = false;
    let revealTimers = [];
    let requestedTargetIndex = -1;
    let renderedInspectionIndex = -2;
    let renderedInspectionPhase = "";
    const visibleCards = new Map();
    const visibleCardInfo = cards.map(() => ({ ratio: 0, centerDistance: Infinity, stageY: undefined }));
    const cachedCardGeometry = cards.map(() => ({ documentTop: 0, height: 0 }));
    const stageGeometry = { documentTop: 0, height: 0 };

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
      const sideMargin = isMobile
        ? clamp(width * 0.02, 6, 14)
        : clamp(width * 0.04, 24, 64);

      return {
        width,
        height,
        droneWidth,
        droneHeight,
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

    const visibleCandidates = [];
    const visibleCandidatePool = cards.map(() => [0, null]);

    const selectBestVisibleCard = ({ force = false } = {}) => {
      if (!force && (exitZoneActive || terminalExitPending)) return;
      visibleCandidates.length = 0;
      for (const [index, info] of visibleCards) {
        if (
          info.ratio >= 0.05
          && cards[index]?.dataset.timelineCardState === "revealed"
        ) {
          const candidate = visibleCandidatePool[visibleCandidates.length];
          candidate[0] = index;
          candidate[1] = info;
          visibleCandidates.push(candidate);
        }
      }
      visibleCandidates.sort((a, b) => {
        const centerDelta = a[1].centerDistance - b[1].centerDistance;
        if (Math.abs(centerDelta) > 24) return centerDelta;
        return b[1].ratio - a[1].ratio;
      });

      if (!visibleCandidates.length) return;
      const nextIndex = Number(visibleCandidates[0][0]);
      const nextInfo = visibleCandidates[0][1];
      if (!force && nextIndex === requestedTargetIndex) return;

      const currentInfo = visibleCards.get(requestedTargetIndex);
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
      // Mobile keeps the legacy cards entirely static: no canvas scan and no
      // per-card visual mutation loop. Intersection state is still maintained
      // for the line/reveal contract and desktop re-entry.
      requestedTargetIndex = -1;
      cards.forEach((card) => {
        if (card.dataset.timelineInspection !== "idle") card.dataset.timelineInspection = "idle";
      });
      if (root.dataset.timelineInspection !== "idle") root.dataset.timelineInspection = "idle";
      if (root.hasAttribute("data-timeline-inspection-card")) delete root.dataset.timelineInspectionCard;
    };

    const measureCardGeometry = () => {
      // This is the only Timeline geometry read phase. Positions are converted
      // to document coordinates once and then projected into the viewport from
      // scrollTop without forcing layout from the autonomous RAF hot path.
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const scrollTop = scrollingElement.scrollTop;
      const stageRect = stage.getBoundingClientRect();
      stageGeometry.documentTop = stageRect.top + scrollTop;
      stageGeometry.height = stageRect.height;
      for (let index = 0; index < cards.length; index += 1) {
        const rect = cards[index].getBoundingClientRect();
        const cached = cachedCardGeometry[index];
        cached.documentTop = rect.top + scrollTop;
        cached.height = rect.height;
      }
      geometryDirty = false;
    };

    const refreshVisibleCardsFromLayout = ({ force = false, remeasure = false } = {}) => {
      if (geometryDirty || remeasure) measureCardGeometry();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? 800;
      const viewportFocus = viewportHeight * (isMobile ? 0.46 : 0.50);
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const scrollTop = scrollingElement.scrollTop;
      const stageTop = stageGeometry.documentTop - scrollTop;
      visibleCards.clear();

      cards.forEach((card, index) => {
        const cached = cachedCardGeometry[index];
        const rectTop = cached.documentTop - scrollTop;
        const rectBottom = rectTop + cached.height;
        const visibleTop = Math.max(0, rectTop);
        const visibleBottom = Math.min(viewportHeight, rectBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        if (visibleHeight <= 0) return;

        // A tall experience stays targetable while the focus line crosses the
        // card, exactly as before; only the source of the rectangle is cached.
        const focusDistance = viewportFocus < rectTop
          ? rectTop - viewportFocus
          : viewportFocus > rectBottom
            ? viewportFocus - rectBottom
            : 0;
        const cardFocus = rectTop + Math.min(cached.height * 0.18, 148);
        const denominator = Math.max(1, Math.min(cached.height, viewportHeight));
        const info = visibleCardInfo[index];
        info.ratio = clamp(visibleHeight / denominator, 0, 1);
        info.centerDistance = focusDistance;
        info.stageY = stageGeometry.height > 1
          ? clamp((cardFocus - stageTop) / stageGeometry.height, 0.14, 0.82)
          : undefined;
        visibleCards.set(index, info);
      });

      if (isMobile) syncCompactInspection();
      else selectBestVisibleCard({ force });
    };

    const scheduleCardSync = ({ force = false, remeasure = false } = {}) => {
      pendingCardSyncForce = pendingCardSyncForce || force;
      pendingGeometryMeasure = pendingGeometryMeasure || remeasure;
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const nextForce = pendingCardSyncForce;
        const nextRemeasure = pendingGeometryMeasure;
        pendingCardSyncForce = false;
        pendingGeometryMeasure = false;
        if (!sceneInRange || exitZoneActive) return;
        refreshVisibleCardsFromLayout({ force: nextForce, remeasure: nextRemeasure });
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
      scheduleCardSync({ force: true, remeasure: true });
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
      const activeMetrics = metrics ?? measure();

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

      frame = window.requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (frame || !sceneInRange || exitZoneActive || !pageVisible || !autonomousEnabled) return;
      lastTimestamp = 0;
      root.dataset.timelineScene = "active";
      if (submarine) submarine.style.opacity = isMobile ? "0.68" : "0.58";
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
          scheduleCardSync({ force: enteringUpward, remeasure: true });
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
            const scrollingElement = document.scrollingElement ?? document.documentElement;
            const cached = cachedCardGeometry[index];
            cached.documentTop = cardTop + scrollingElement.scrollTop;
            cached.height = Number(entry.boundingClientRect?.height) || cached.height;
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
        geometryDirty = true;
        scheduleCardSync({ force: true, remeasure: true });
      });
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleMeasure)
      : null;

    metrics = measure();
    resizeObserver?.observe(stage);
    resizeObserver?.observe(root);
    cards.forEach((card) => resizeObserver?.observe(card));
    window.visualViewport?.addEventListener("resize", scheduleMeasure, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    scheduleCardSync({ force: true, remeasure: true });

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
      });
    };
  }, [autonomousEnabled, visibleExperiences.length, performanceMode, animationsPaused]);

  return (
    <section
      ref={rootRef}
      id="timeline"
      className="page-section timeline-section is-autonomous-timeline"
      data-motion-engine="abyss-expedition-inspection-v10-legacy-optimized"
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
            <div className="timeline-straight-line timeline-bathymeter" aria-hidden="true">
              <span className="timeline-straight-line-progress" />
              <span className="timeline-depth-tick timeline-depth-tick--1">−180</span>
              <span className="timeline-depth-tick timeline-depth-tick--2">−760</span>
              <span className="timeline-depth-tick timeline-depth-tick--3">−1 580</span>
              <span className="timeline-depth-tick timeline-depth-tick--4">−2 700</span>
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
                const missionNumber = String(index + 1).padStart(2, "0");
                const depth = formatDepth(getScenographicDepth(index), locale);
                const period = formatPeriod(
                  experience.startDate,
                  experience.endDate,
                  experience.currentPosition,
                  locale,
                );
                const skills = experience.skills ?? [];
                const visibleSkills = skills.slice(0, 5);
                const hiddenSkillCount = Math.max(0, skills.length - visibleSkills.length);

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
                    <Card className="timeline-card island-card timeline-expedition-card timeline-mission-capsule" radius="xl" data-mission-shape="pressure-hull">
                      <TimelineCardReef variant={index} />
                      <span className="timeline-capsule-port" aria-hidden="true" />
                      <span className="timeline-capsule-rivet timeline-capsule-rivet--a" aria-hidden="true" />
                      <span className="timeline-capsule-rivet timeline-capsule-rivet--b" aria-hidden="true" />
                      <div className="timeline-expedition-topline">
                        <div className="timeline-mission-id">
                          <Text component="span" className="timeline-log-label">{t("timeline.expeditionLog")}</Text>
                          <Text component="strong" className="timeline-mission-number">{t("timeline.mission")} {missionNumber}</Text>
                        </div>
                        <Text className="timeline-expedition-date">{period}</Text>
                      </div>

                      <div className="timeline-expedition-rule" aria-hidden="true" />

                      <div className="timeline-expedition-heading">
                        <Stack gap={7} className="timeline-main-copy">
                          <Group gap={8} className="timeline-expedition-statuses">
                            <Badge className="timeline-category" radius="xl">{t(`category.${experience.category}`, { fallback: experience.category })}</Badge>
                            {experience.currentPosition && <Badge className="current-badge">{t("timeline.current")}</Badge>}
                          </Group>
                          <Title order={2}>{experience.title}</Title>
                          <div className="timeline-org">
                            <OrganizationBrand organization={experience.organization} compact />
                            {experience.location && <span className="timeline-location">· {experience.location}</span>}
                          </div>
                        </Stack>
                        <div className="timeline-depth-readout" aria-label={`${t("timeline.depth")} ${depth}`}>
                          <Text component="span">{t("timeline.depth")}</Text>
                          <Text component="strong">{depth}</Text>
                        </div>
                      </div>

                      {experience.summary && <Text className="timeline-summary">{experience.summary}</Text>}

                      <div className="timeline-expedition-footer">
                        <div className="timeline-systems-block">
                          {visibleSkills.length > 0 && (
                            <>
                              <Text component="span" className="timeline-systems-label">{t("timeline.systems")}</Text>
                              <Group gap={8} className="skill-row">
                                {visibleSkills.map((skill) => <Badge key={skill} variant="outline" className="skill-badge">{skill}</Badge>)}
                                {hiddenSkillCount > 0 && <Badge variant="outline" className="skill-badge timeline-skill-more" aria-label={`${hiddenSkillCount} ${t("timeline.moreSystems")}`}>+{hiddenSkillCount}</Badge>}
                              </Group>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          className="timeline-details-trigger"
                          aria-haspopup="dialog"
                          onClick={(event) => detailSheetRef.current?.open(experience, { missionNumber, period, depth }, event.currentTarget)}
                        >
                          {t("timeline.details")} <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </Card>
                  </article>
                );
              })}
            </div>
            <div className="timeline-exit-sentinel" aria-hidden="true" />
            <TimelineDetailSheet ref={detailSheetRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
