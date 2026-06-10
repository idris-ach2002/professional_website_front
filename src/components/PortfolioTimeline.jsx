import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useRef, useMemo } from "react";
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

const VERTICAL_GAP = 300;
const START_TOP = 20;

function generateSvgPath(numItems, gap, startY) {
  let d = `M 100 ${startY}`;
  for (let i = 0; i < numItems; i += 1) {
    const y = startY + i * gap;
    const x = i % 2 === 0 ? 200 : 1000;
    d += ` C ${x} ${y + gap / 2}, ${1200 - x} ${y + gap / 2}, ${x} ${y + gap}`;
  }
  return d;
}

export default function PortfolioTimeline({ timeline, experiences }) {
  const rootRef = useRef(null);
  const totalHeight = experiences.length * VERTICAL_GAP + START_TOP + 200;

  const svgPath = useMemo(
    () => generateSvgPath(experiences.length, VERTICAL_GAP, START_TOP),
    [experiences.length]
  );

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;

    const root = rootRef.current;
    const route = root?.querySelector(".timeline-route-progress");
    if (route) {
      const length = route.getTotalLength?.() ?? 2000;
      gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(route, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 62%",
          end: "bottom 65%",
          scrub: 1.1,
        },
      });
    }

    const paths = gsap.utils.toArray(root.querySelectorAll(".timeline-wave-path"));
    if (paths.length > 0) {
      const numPoints = 10;
      const allPoints = paths.map(() => Array.from({ length: numPoints }, () => 100));

      const renderWave = () => {
        paths.forEach((path, pathIndex) => {
          const points = allPoints[pathIndex];
          let d = `M 0 100 V ${points[0]} C`;

          for (let pointIndex = 0; pointIndex < numPoints - 1; pointIndex += 1) {
            const p = ((pointIndex + 1) / (numPoints - 1)) * 100;
            const cp = p - (100 / (numPoints - 1)) / 2;
            d += ` ${cp} ${points[pointIndex]} ${cp} ${points[pointIndex + 1]} ${p} ${points[pointIndex + 1]}`;
          }

          d += " V 100 H 0";
          path.setAttribute("d", d);
        });
      };

      renderWave();
      const waveTl = gsap.timeline({
        onUpdate: renderWave,
        scrollTrigger: {
          trigger: root.querySelector(".timeline-wave-gate"),
          start: "top 82%",
          end: "bottom 26%",
          scrub: true,
        },
      });

      allPoints.forEach((points, pathIndex) => {
        points.forEach((_, pointIndex) => {
          waveTl.to(points, {
            [pointIndex]: pathIndex === 0 ? 34 + (pointIndex % 2) * 10 : 48 + (pointIndex % 2) * 14,
            duration: 0.92,
            ease: "power2.inOut",
          }, pointIndex * 0.025 + pathIndex * 0.12);
        });
      });
    }
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
              className={`timeline-island ${categoryClasses[experience.category] ?? ""}`}
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
    </section>
  );
}
