import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
import { PreviewableImage } from "./FilePreview";
import { CATEGORY_LABELS, formatPeriod, normalizeUrl } from "../utils/portfolio";

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

export default function PortfolioTimeline({ timeline, experiences }) {
  const rootRef = useRef(null);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    if (!ScrollTrigger || !root) return undefined;

    const track = root.querySelector(".timeline-subsea-track");
    const lineProgress = root.querySelector(".timeline-straight-line-progress");
    const submarine = root.querySelector(".timeline-submarine");
    const cards = gsap.utils.toArray(root.querySelectorAll(".timeline-card"));

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

    cards.forEach((card) => {
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

    return undefined;
  }, [experiences.length]);

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
