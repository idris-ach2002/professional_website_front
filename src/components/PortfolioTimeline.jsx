import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
import ExplorationDrone from "./ExplorationDrone";
import { PreviewableImage } from "./FilePreview";
import { CATEGORY_LABELS, formatPeriod, normalizeUrl, slugify } from "../utils/portfolio";

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

function getExperienceAnchor(experience, index) {
  const source = [experience?.title, experience?.organization].filter(Boolean).join(" ") || `experience-${index + 1}`;
  return `experience-${slugify(source)}-${index}`;
}

export default function PortfolioTimeline({ timeline, experiences }) {
  const rootRef = useRef(null);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    if (!ScrollTrigger || !root) return undefined;

    const track = root.querySelector(".timeline-subsea-track");
    const lineProgress = root.querySelector(".timeline-straight-line-progress");
    const submarine = root.querySelector(".timeline-submarine");
    const explorationDrone = root.querySelector(".timeline-exploration-drone");
    const cards = gsap.utils.toArray(root.querySelectorAll(".timeline-card"));
    const isMobile = window.matchMedia?.("(max-width: 820px)").matches;

    if (lineProgress && track) {
      gsap.fromTo(
        lineProgress,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top 66%",
            end: "bottom 42%",
            scrub: 1.05,
          },
        },
      );
    }

    if (submarine && track) {
      gsap.set(submarine, { autoAlpha: 1 });

      gsap.fromTo(
        submarine,
        { y: 0, rotate: -2 },
        {
          y: () => Math.max(0, track.offsetHeight - submarine.offsetHeight - 8),
          rotate: 4,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top 66%",
            end: "bottom 42%",
            scrub: 1.15,
            invalidateOnRefresh: true,
            onLeave: () => gsap.set(submarine, { autoAlpha: 0 }),
            onEnterBack: () => gsap.set(submarine, { autoAlpha: 1 }),
          },
        },
      );

      gsap.to(submarine, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: track,
          start: "bottom 56%",
          end: "bottom 42%",
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });
    }

    let cleanupDroneRoute = () => {};

    if (explorationDrone && track && !isMobile) {
      let lastScanLevel = 0;
      let lastFacing = 1;
      let routeMetrics = null;
      let resizeFrame = 0;

      const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

      const updateDroneState = (progress) => {
        const scanLevel = Math.min(4, Math.max(1, Math.floor(progress * 4) + 1));

        if (scanLevel !== lastScanLevel) {
          explorationDrone.dataset.scanLevel = String(scanLevel);
          lastScanLevel = scanLevel;
        }
      };

      const measureDroneRoute = () => {
        const trackWidth = track.clientWidth;
        const droneWidth = explorationDrone.offsetWidth;
        const droneHeight = explorationDrone.offsetHeight;
        const originLeft = explorationDrone.offsetLeft;
        const safeMargin = clamp(trackWidth * 0.035, 24, 52);
        const minimumLeft = safeMargin;
        const maximumLeft = Math.max(minimumLeft, trackWidth - droneWidth - safeMargin);
        const horizontalRange = Math.max(0, maximumLeft - minimumLeft);
        const verticalTravel = Math.max(0, track.offsetHeight - droneHeight - 62);

        return {
          originLeft,
          minimumLeft,
          horizontalRange,
          verticalTravel,
        };
      };

      const routeNodes = [
        { x: 0.82, y: 0 },
        { x: 0.67, y: 0.09 },
        { x: 0.31, y: 0.22 },
        { x: 0.18, y: 0.34 },
        { x: 0.47, y: 0.46 },
        { x: 0.78, y: 0.58 },
        { x: 0.69, y: 0.69 },
        { x: 0.29, y: 0.81 },
        { x: 0.43, y: 0.91 },
        { x: 0.74, y: 1 },
      ];

      const interpolateCatmullRom = (p0, p1, p2, p3, amount) => {
        const amount2 = amount * amount;
        const amount3 = amount2 * amount;

        return 0.5 * (
          (2 * p1)
          + (-p0 + p2) * amount
          + (2 * p0 - 5 * p1 + 4 * p2 - p3) * amount2
          + (-p0 + 3 * p1 - 3 * p2 + p3) * amount3
        );
      };

      const sampleDroneRoute = (progress) => {
        const metrics = routeMetrics ?? measureDroneRoute();
        const safeProgress = clamp(progress, 0, 1);
        const segmentCount = routeNodes.length - 1;
        const scaledProgress = safeProgress * segmentCount;
        const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaledProgress));
        const localProgress = scaledProgress - segmentIndex;

        const p0 = routeNodes[Math.max(0, segmentIndex - 1)];
        const p1 = routeNodes[segmentIndex];
        const p2 = routeNodes[Math.min(routeNodes.length - 1, segmentIndex + 1)];
        const p3 = routeNodes[Math.min(routeNodes.length - 1, segmentIndex + 2)];

        const normalizedX = clamp(
          interpolateCatmullRom(p0.x, p1.x, p2.x, p3.x, localProgress),
          0,
          1,
        );
        const normalizedY = clamp(
          interpolateCatmullRom(p0.y, p1.y, p2.y, p3.y, localProgress),
          0,
          1,
        );

        const absoluteLeft = metrics.minimumLeft + metrics.horizontalRange * normalizedX;

        return {
          x: absoluteLeft - metrics.originLeft,
          y: metrics.verticalTravel * normalizedY,
        };
      };

      routeMetrics = measureDroneRoute();
      const initialPoint = sampleDroneRoute(0);

      gsap.set(explorationDrone, {
        autoAlpha: 0,
        x: initialPoint.x,
        y: initialPoint.y,
        rotate: -2,
        scaleX: 1,
        transformOrigin: "50% 50%",
      });

      const moveX = gsap.quickTo(explorationDrone, "x", {
        duration: 1.5,
        ease: "power3.out",
      });
      const moveY = gsap.quickTo(explorationDrone, "y", {
        duration: 1.72,
        ease: "power3.out",
      });
      const bankDrone = gsap.quickTo(explorationDrone, "rotation", {
        duration: 0.72,
        ease: "power2.out",
      });
      const turnDrone = gsap.quickTo(explorationDrone, "scaleX", {
        duration: 0.58,
        ease: "power2.inOut",
      });

      const applyDronePosition = (progress, direction = 1, immediate = false) => {
        const currentPoint = sampleDroneRoute(progress);
        const probeDistance = 0.006;
        const previousPoint = sampleDroneRoute(clamp(progress - probeDistance, 0, 1));
        const nextPoint = sampleDroneRoute(clamp(progress + probeDistance, 0, 1));
        const horizontalDirection = (nextPoint.x - previousPoint.x) * direction;
        const verticalDirection = (nextPoint.y - previousPoint.y) * direction;
        const curveStrength = clamp(horizontalDirection * 0.095, -9, 9);
        const pitchCorrection = clamp(verticalDirection * 0.006, -1.8, 1.8);
        const desiredFacing = horizontalDirection > 0.9
          ? -1
          : horizontalDirection < -0.9
            ? 1
            : lastFacing;

        lastFacing = desiredFacing;

        if (immediate) {
          gsap.set(explorationDrone, {
            x: currentPoint.x,
            y: currentPoint.y,
            rotation: curveStrength + pitchCorrection,
            scaleX: desiredFacing,
          });
          return;
        }

        moveX(currentPoint.x);
        moveY(currentPoint.y);
        bankDrone(curveStrength + pitchCorrection);
        turnDrone(desiredFacing);
      };

      const droneScrollTrigger = ScrollTrigger.create({
        trigger: track,
        start: "top 72%",
        end: "bottom 38%",
        invalidateOnRefresh: true,
        onEnter: () => gsap.to(explorationDrone, {
          autoAlpha: 0.82,
          duration: 0.45,
          overwrite: "auto",
        }),
        onEnterBack: () => gsap.to(explorationDrone, {
          autoAlpha: 0.82,
          duration: 0.35,
          overwrite: "auto",
        }),
        onLeave: () => gsap.to(explorationDrone, {
          autoAlpha: 0.24,
          duration: 0.7,
          overwrite: "auto",
        }),
        onLeaveBack: () => gsap.to(explorationDrone, {
          autoAlpha: 0,
          duration: 0.3,
          overwrite: "auto",
        }),
        onRefresh: (self) => {
          routeMetrics = measureDroneRoute();
          updateDroneState(self.progress);
          applyDronePosition(self.progress, self.direction || 1, true);
        },
        onUpdate: (self) => {
          updateDroneState(self.progress);
          applyDronePosition(self.progress, self.direction || 1);
        },
      });

      const resizeObserver = typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(() => {
            routeMetrics = measureDroneRoute();
            applyDronePosition(
              droneScrollTrigger.progress,
              droneScrollTrigger.direction || 1,
              true,
            );
          });
        })
        : null;

      resizeObserver?.observe(track);

      cleanupDroneRoute = () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeObserver?.disconnect();
        moveX.tween?.kill();
        moveY.tween?.kill();
        bankDrone.tween?.kill();
        turnDrone.tween?.kill();
      };
    }

    cards.forEach((card) => {
      if (isMobile) {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.38,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 94%",
              toggleActions: "play none none reverse",
            },
          },
        );
        return;
      }

      const row = card.closest(".timeline-row");
      const isLeft = row?.classList.contains("is-left");
      const startX = isLeft ? -92 : 92;
      const startRotateY = isLeft ? 18 : -18;
      const startRotateZ = isLeft ? -3.5 : 3.5;

      gsap.fromTo(
        card,
        {
          autoAlpha: 0,
          x: startX,
          y: 54,
          rotateY: startRotateY,
          rotateZ: startRotateZ,
          scale: 0.84,
          clipPath: isLeft
            ? "polygon(0 42%, 32% 32%, 78% 38%, 100% 50%, 80% 62%, 28% 68%, 0 58%)"
            : "polygon(100% 42%, 68% 32%, 22% 38%, 0 50%, 20% 62%, 72% 68%, 100% 58%)",
          filter: "blur(9px) saturate(1.16) brightness(1.04)",
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          filter: "blur(0px) saturate(1) brightness(1)",
          duration: 0.68,
          ease: "expo.out",
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });

    return cleanupDroneRoute;
  }, [experiences.length], { allowOnMobile: true });

  return (
    <section ref={rootRef} id="timeline" className="page-section timeline-section island-section route-island">
      <SectionTitle
        reveal="fish"
        title="Expériences"
        description={
          timeline?.description ??
          "Les expériences apparaissent progressivement comme des bulles pendant la descente vers les zones plus profondes du portfolio."
        }
      />

      <div className="timeline-subsea-track">
        <div className="timeline-straight-line" aria-hidden="true">
          <span className="timeline-straight-line-progress" />
        </div>
        <ExplorationDrone />
        <img
          src="/assets/ocean/submarine-scroll.svg"
          alt=""
          aria-hidden="true"
          className="timeline-submarine"
          loading="lazy"
        />

        <div className="timeline-list">
          {experiences.map((experience, index) => {
            const side = index % 2 === 0 ? "left" : "right";

            return (
              <article
                id={getExperienceAnchor(experience, index)}
                key={experience.id ?? `${experience.title}-${index}`}
                className={`timeline-row is-${side} ${categoryClasses[experience.category] ?? ""}`}
              >
                <Card className="timeline-card island-card" radius="xl">
                  <span className="timeline-card-watermark" aria-hidden="true" />
                  <Group justify="space-between" align="flex-start" gap="md">
                    <Stack gap={10} className="timeline-main-copy">
                      <Badge className="timeline-category" radius="xl">
                        {CATEGORY_LABELS[experience.category] ?? experience.category}
                      </Badge>
                      <Title order={2}>{experience.title}</Title>
                      <Text className="timeline-org">
                        {[experience.organization, experience.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </Stack>
                    {experience.currentPosition && (
                      <Badge className="current-badge">En cours</Badge>
                    )}
                  </Group>
                  <Text className="timeline-period">
                    {formatPeriod(experience.startDate, experience.endDate, experience.currentPosition)}
                  </Text>
                  {experience.imageUrl && (
                    <PreviewableImage
                      src={experience.imageUrl}
                      alt={experience.title}
                      className="timeline-image-preview-trigger"
                      imageClassName="timeline-image"
                      modalTitle={`Expérience — ${experience.title}`}
                    />
                  )}
                  <Text className="timeline-summary">{experience.summary}</Text>
                  {experience.description && (
                    <Text className="timeline-description">{experience.description}</Text>
                  )}
                  {experience.skills?.length > 0 && (
                    <Group gap={10} className="skill-row">
                      {experience.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="skill-badge">
                          {skill}
                        </Badge>
                      ))}
                    </Group>
                  )}
                  {experience.websiteUrl && (
                    <Anchor
                      href={normalizeUrl(experience.websiteUrl)}
                      target="_blank"
                      className="timeline-link"
                    >
                      Voir la ressource
                    </Anchor>
                  )}
                </Card>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
