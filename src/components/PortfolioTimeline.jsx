import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useRef, useMemo } from "react";
import { useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
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

const VERTICAL_GAP = 300; // px entre deux îles
const START_TOP = 20; // premier top (px)

function generateSvgPath(numItems, gap, startY) {
  // Construit un chemin cohérent qui passe près des positions des îles
  const totalHeight = numItems * gap + 200;
  // Points approximatifs : on place les points de contrôle entre les positions des îles
  let d = `M 100 ${startY}`;
  for (let i = 0; i < numItems; i++) {
    const y = startY + i * gap;
    const x = i % 2 === 0 ? 200 : 1000; // gauche/droite alternés
    d += ` C ${x} ${y + gap / 2}, ${1200 - x} ${y + gap / 2}, ${x} ${y + gap}`;
  }
  return d;
}

export default function PortfolioTimeline({ timeline, experiences }) {
  const rootRef = useRef(null);
  const totalHeight = experiences.length * VERTICAL_GAP + START_TOP + 200; // hauteur minimum

  const svgPath = useMemo(
    () =>
      generateSvgPath(experiences.length, VERTICAL_GAP, START_TOP),
    [experiences.length]
  );

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;

    const route = rootRef.current?.querySelector(".timeline-route-progress");
    if (route) {
      const length = route.getTotalLength?.() ?? 2000;
      gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(route, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 62%",
          end: "bottom 65%",
          scrub: 1.1,
        },
      });
    }

    gsap.utils.toArray(".timeline-island").forEach((item, index) => {
      gsap.from(item, {
        autoAlpha: 0,
        scale: 0.52,
        duration: 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: item,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
    });

    gsap.to(".timeline-float", {
      y: (index) => (index % 2 ? -6 : 8),
      rotate: (index) => (index % 2 ? -0.9 : 0.9),
      duration: 5.5,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 0.18,
    });
  }, [experiences.length]);

  return (
    <section ref={rootRef} id="timeline" className="page-section timeline-section island-section route-island">
      <SectionTitle
        title={timeline?.title ?? "Parcours"}
        description={
          timeline?.description ??
          "Chaque étape du parcours devient une île que le scroll révèle progressivement."
        }
      />

      <div
        className="timeline-map"
        style={{ minHeight: `${totalHeight}px` }}
      >
        <svg
          className="timeline-route-svg"
          viewBox={`0 0 1200 ${totalHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="timeline-route-shadow" d={svgPath} />
          <path className="timeline-route-progress" d={svgPath} />
        </svg>

        {experiences.map((experience, index) => {
          const top = START_TOP + index * VERTICAL_GAP;
          const isLeft = index % 2 === 0;

          return (
            <article
              key={experience.id ?? `${experience.title}-${index}`}
              className={`timeline-island timeline-float ${categoryClasses[experience.category] ?? ""}`}
              style={{
                top: `${top}px`,
                left: isLeft ? "2%" : "auto",
                right: isLeft ? "auto" : "2%",
              }}
            >
              <Card className="timeline-card island-card" radius="xl">
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
    </section>
  );
}