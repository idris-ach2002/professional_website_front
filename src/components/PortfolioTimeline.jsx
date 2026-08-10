import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useEffect, useRef } from "react";
import SectionTitle from "./SectionTitle";
import useLanguage from "../localization/useLanguage";
import ExplorationDrone from "./ExplorationDrone";
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

function getCardSide(card, isMobile) {
  if (isMobile) return "right";
  return card?.classList.contains("is-right") ? "right" : "left";
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

export default function PortfolioTimeline({ timeline, experiences, performanceMode = "full" }) {
  const rootRef = useRef(null);
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

    const isMobile = window.matchMedia?.("(max-width: 820px)").matches;
    let sceneInRange = false;
    let exitZoneActive = false;
    let pageVisible = !document.hidden;
    let frame = 0;
    let lastTimestamp = 0;
    let elapsedMs = 0;
    let metrics = null;
    let resizeFrame = 0;
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
          side: getCardSide(card, isMobile),
          y: visibleCards.get(index)?.stageY,
        },
        { mobile: isMobile },
      );
    };

    const selectBestVisibleCard = () => {
      if (exitZoneActive) return;
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
      if (nextIndex === requestedTargetIndex) return;

      const currentInfo = visibleCards.get(requestedTargetIndex);
      const nextInfo = candidates[0][1];
      if (
        currentInfo
        && cards[requestedTargetIndex]?.dataset.timelineCardState === "revealed"
        && currentInfo.centerDistance <= nextInfo.centerDistance + 28
      ) {
        return;
      }

      applyTarget(nextIndex);
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
          selectBestVisibleCard();
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

      if (explorationDrone) {
        pilot = stepInspectionPilot(pilot, deltaSeconds, { mobile: isMobile });

        const x = activeMetrics.sideMargin + activeMetrics.droneRangeX * pilot.x;
        const y = activeMetrics.droneRangeY * pilot.y;
        explorationDrone.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        explorationDrone.style.opacity = String(pilot.opacity * (isMobile ? 0.72 : performanceMode === "balanced" ? 0.84 : 0.96));
        explorationDrone.style.setProperty("--torch-strength", pilot.torch.toFixed(3));
        explorationDrone.dataset.facing = pilot.facing;
        explorationDrone.dataset.inspectionPhase = pilot.phase;
        explorationDrone.dataset.torch = pilot.torch > 0.32 ? "on" : "off";
        updateInspectionUI();
      }

      if (submarine) {
        const subMotion = pingPongState(elapsedMs + 4_200, isMobile ? 18_800 : 23_500);
        const verticalRange = Math.max(0, activeMetrics.height - activeMetrics.submarineHeight - 24);
        const centerX = activeMetrics.width * (isMobile ? 0.50 : 0.51) - activeMetrics.submarineWidth / 2;
        const sway = Math.sin((elapsedMs / 1000) * 0.36) * (isMobile ? 3 : 6);
        const y = 12 + verticalRange * subMotion.progress;
        submarine.style.transform = `translate3d(${(centerX + sway).toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        submarine.style.opacity = isMobile ? "0.32" : "0.42";
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
          const enteringFromBelow = (entry?.boundingClientRect?.top ?? 0) >= 0;
          root.dataset.timelineEntry = enteringFromBelow ? "down" : "up";
          root.dataset.timelineExit = "clear";
          requestedTargetIndex = -1;
          pilot = createInspectionPilot({
            x: isMobile ? 0.10 : 0.72,
            y: isMobile ? 0.22 : 0.18,
            facing: "left",
          });
          if (enteringFromBelow) playCardReveal();
          else revealAllCards();
          startLoop();
          window.requestAnimationFrame(selectBestVisibleCard);
          return;
        }

        if (!sceneInRange && wasInRange) {
          clearRevealTimers();
          revealAllCards();
          root.dataset.timelineEntry = "none";
          visibleCards.clear();
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

        if (nextExitZone === exitZoneActive) return;
        exitZoneActive = nextExitZone;
        root.dataset.timelineExit = exitZoneActive ? "approaching" : "clear";

        if (exitZoneActive) {
          clearInspection();
          if (explorationDrone) {
            explorationDrone.style.opacity = "0";
            explorationDrone.style.setProperty("--torch-strength", "0");
          }
          if (submarine) submarine.style.opacity = "0";
          stopLoop("exiting");
          return;
        }

        if (sceneInRange && pageVisible) {
          startLoop();
          window.requestAnimationFrame(selectBestVisibleCard);
        }
      },
      { root: null, rootMargin: "0px 0px -14% 0px", threshold: [0, 0.01] },
    ) : null;

    const cardObserver = new IntersectionObserver(
      (entries) => {
        const viewportCenter = (window.visualViewport?.height ?? window.innerHeight) / 2;
        const stageRect = stage.getBoundingClientRect();
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.timelineCardIndex);
          if (!entry.isIntersecting) {
            visibleCards.delete(index);
            return;
          }
          const cardCenter = entry.boundingClientRect.top + entry.boundingClientRect.height / 2;
          visibleCards.set(index, {
            ratio: entry.intersectionRatio,
            centerDistance: Math.abs(cardCenter - viewportCenter),
            stageY: stageRect.height
              ? clamp((cardCenter - stageRect.top) / stageRect.height, 0.14, 0.82)
              : undefined,
          });
        });
        selectBestVisibleCard();
      },
      { root: null, rootMargin: "-2% 0px -2% 0px", threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.7] },
    );

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
      });
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleMeasure)
      : null;

    metrics = measure();
    resizeObserver?.observe(stage);
    window.visualViewport?.addEventListener("resize", scheduleMeasure, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearRevealTimers();
      stopLoop("idle");
      sceneObserver.disconnect();
      exitObserver?.disconnect();
      cardObserver.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      document.removeEventListener("visibilitychange", handleVisibility);
      delete root.dataset.timelineEntry;
      delete root.dataset.timelineReveal;
      delete root.dataset.timelineInspection;
      delete root.dataset.timelineInspectionCard;
      delete root.dataset.timelineExit;
      cards.forEach((card) => {
        delete card.dataset.timelineCardState;
        delete card.dataset.timelineInspection;
      });
    };
  }, [autonomousEnabled, experiences.length, performanceMode, animationsPaused]);

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
            reveal="fish"
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
              {experiences.map((experience, index) => {
                const side = index % 2 === 0 ? "left" : "right";
                const missionNumber = String(index + 1).padStart(2, "0");
                const depth = formatDepth(getScenographicDepth(index), locale);
                const period = formatPeriod(
                  experience.startDate,
                  experience.endDate,
                  experience.currentPosition,
                  locale,
                );

                return (
                  <article
                    id={getExperienceAnchor(experience, index)}
                    key={experience.id ?? `${experience.title}-${index}`}
                    className={`timeline-row timeline-expedition-row is-${side} ${categoryClasses[experience.category] ?? ""}`}
                    data-timeline-card-index={index}
                    data-timeline-card-state="revealed"
                    data-timeline-inspection="idle"
                  >
                    <Card className="timeline-card island-card timeline-expedition-card" radius="xl">
                      <TimelineCardReef variant={index} />
                      <div className="timeline-expedition-topline">
                        <div className="timeline-mission-id">
                          <Text component="span" className="timeline-log-label">
                            {t("timeline.expeditionLog")}
                          </Text>
                          <Text component="strong" className="timeline-mission-number">
                            {t("timeline.mission")} {missionNumber}
                          </Text>
                        </div>
                        <Text className="timeline-expedition-date">{period}</Text>
                      </div>

                      <div className="timeline-expedition-rule" aria-hidden="true" />

                      <Group justify="space-between" align="flex-start" gap="md" className="timeline-expedition-heading">
                        <Stack gap={8} className="timeline-main-copy">
                          <Group gap={8} className="timeline-expedition-statuses">
                            <Badge className="timeline-category" radius="xl">
                              {t(`category.${experience.category}`, { fallback: experience.category })}
                            </Badge>
                            {experience.currentPosition && (
                              <Badge className="current-badge">{t("timeline.current")}</Badge>
                            )}
                          </Group>
                          <Title order={2}>{experience.title}</Title>
                          <Text className="timeline-org">
                            {[experience.organization, experience.location]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        </Stack>
                      </Group>

                      {experience.imageUrl && (
                        <PreviewableImage
                          src={experience.imageUrl}
                          alt={experience.title}
                          className="timeline-image-preview-trigger"
                          imageClassName="timeline-image"
                          modalTitle={`${t("nav.journey")} — ${experience.title}`}
                        />
                      )}

                      <Text className="timeline-summary">{experience.summary}</Text>
                      {experience.description && (
                        <Text className="timeline-description">{experience.description}</Text>
                      )}

                      <div className="timeline-expedition-footer">
                        <div className="timeline-systems-block">
                          {experience.skills?.length > 0 && (
                            <>
                              <Text component="span" className="timeline-systems-label">
                                {t("timeline.systems")}
                              </Text>
                              <Group gap={8} className="skill-row">
                                {experience.skills.map((skill) => (
                                  <Badge key={skill} variant="outline" className="skill-badge">
                                    {skill}
                                  </Badge>
                                ))}
                              </Group>
                            </>
                          )}
                          {experience.websiteUrl && (
                            <Anchor
                              href={normalizeUrl(experience.websiteUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="timeline-link"
                            >
                              {t("projects.resources")}
                            </Anchor>
                          )}
                        </div>

                        <div className="timeline-depth-readout" aria-label={`${t("timeline.depth")} ${depth}`}>
                          <Text component="span">{t("timeline.depth")}</Text>
                          <Text component="strong">{depth}</Text>
                        </div>
                      </div>
                    </Card>
                  </article>
                );
              })}
            </div>
            <div className="timeline-exit-sentinel" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
