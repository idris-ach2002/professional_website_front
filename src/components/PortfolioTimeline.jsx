import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useRef } from "react";
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

export default function PortfolioTimeline({ timeline, experiences }) {
  const rootRef = useRef(null);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;

    const route = rootRef.current?.querySelector(".timeline-route-progress");
    if (route) {
      const length = route.getTotalLength?.() ?? 1600;
      gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(route, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 72%",
          end: "bottom 65%",
          scrub: 1.1,
        },
      });
    }

    gsap.utils.toArray(".timeline-island").forEach((item, index) => {
      gsap.from(item, {
        autoAlpha: 0,
        y: 52,
        scale: 0.92,
        rotate: index % 2 ? 2.6 : -2.6,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: item,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
    });

    gsap.to(".timeline-float", {
      y: (index) => (index % 2 ? -8 : 10),
      rotate: (index) => (index % 2 ? -1.1 : 1.1),
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
        eyebrow="Route de navigation"
        title={timeline?.title ?? "Parcours"}
        description={timeline?.description ?? "Chaque étape du parcours devient une île que le scroll révèle progressivement."}
      />

      <div className="timeline-map">
        <svg className="timeline-route-svg" viewBox="0 0 1200 1120" preserveAspectRatio="none" aria-hidden="true">
          <path className="timeline-route-shadow" d="M160 70 C1020 190 110 350 920 520 C1260 590 360 690 870 860 C1020 910 1020 1010 240 1070" />
          <path className="timeline-route-progress" d="M160 70 C1020 190 110 350 920 520 C1260 590 360 690 870 860 C1020 910 1020 1010 240 1070" />
        </svg>

        {experiences.map((experience, index) => (
          <article key={experience.id ?? `${experience.title}-${index}`} className={`timeline-island timeline-float timeline-island-${index % 5} ${categoryClasses[experience.category] ?? ""}`}>
            <Card className="timeline-card island-card" radius="xl">
              <Group justify="space-between" align="flex-start" gap="md">
                <Stack gap={5} className="timeline-main-copy">
                  <Badge className="timeline-category" radius="xl">
                    {CATEGORY_LABELS[experience.category] ?? experience.category}
                  </Badge>
                  <Title order={3}>{experience.title}</Title>
                  <Text className="timeline-org">
                    {[experience.organization, experience.location].filter(Boolean).join(" · ")}
                  </Text>
                </Stack>
                {experience.currentPosition && <Badge className="current-badge">En cours</Badge>}
              </Group>
              <Text className="timeline-period">{formatPeriod(experience.startDate, experience.endDate, experience.currentPosition)}</Text>
              <Text className="timeline-summary">{experience.summary}</Text>
              {experience.description && <Text className="timeline-description">{experience.description}</Text>}
              {experience.skills?.length > 0 && (
                <Group gap={7} className="skill-row">
                  {experience.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="skill-badge">
                      {skill}
                    </Badge>
                  ))}
                </Group>
              )}
              {experience.websiteUrl && (
                <Anchor href={normalizeUrl(experience.websiteUrl)} target="_blank" className="timeline-link">
                  Voir la ressource
                </Anchor>
              )}
            </Card>
          </article>
        ))}
      </div>
    </section>
  );
}
