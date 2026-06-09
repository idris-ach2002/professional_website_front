import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo, useRef } from "react";
import { useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
import { collectStacks, getPublicProjects } from "../utils/portfolio";

function ReefTurtle({ className, x, y }) {
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" rx="36" ry="23" fill="rgba(13,148,136,.26)" stroke="rgba(15,118,110,.7)" strokeWidth="3" />
      <circle cx="42" cy="0" r="10" fill="rgba(13,148,136,.28)" stroke="rgba(15,118,110,.7)" strokeWidth="2" />
      <path d="M-20-19 C-45-45 -61-12 -34-9 M-20 19 C-45 45 -61 12 -34 9 M15-18 C43-42 56-12 28-8 M15 18 C43 42 56 12 28 8" fill="none" stroke="rgba(15,118,110,.55)" strokeWidth="4" strokeLinecap="round" />
      <path d="M-18-8 C-2-22 21-16 29 0 C18 14-2 20-23 8" fill="none" stroke="rgba(255,255,255,.76)" strokeWidth="2" />
    </g>
  );
}

export default function OceanRecruitmentReef({ projects, experiences }) {
  const rootRef = useRef(null);
  const publicProjects = useMemo(() => getPublicProjects(projects), [projects]);
  const stacks = useMemo(() => collectStacks(publicProjects).slice(0, 8), [publicProjects]);
  const activeExperiences = experiences?.filter((experience) => experience.currentPosition)?.length ?? 0;

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;

    gsap.from(".reef-panel", {
      autoAlpha: 0,
      y: 44,
      scale: 0.96,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: ".reef-section", start: "top 72%" },
    });

    gsap.from(".reef-node", {
      autoAlpha: 0,
      scale: 0.75,
      y: 30,
      rotate: -4,
      stagger: 0.12,
      duration: 0.72,
      ease: "back.out(1.5)",
      scrollTrigger: { trigger: ".reef-map", start: "top 76%" },
    });

    gsap.fromTo(
      ".reef-route",
      { strokeDasharray: 900, strokeDashoffset: 900 },
      {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: { trigger: ".reef-map", start: "top 76%" },
      },
    );

    gsap.to(".reef-packet", {
      x: (index) => (index % 2 ? -70 : 94),
      y: (index) => (index % 2 ? 28 : -24),
      scale: 1.22,
      duration: 4.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.22,
    });

    gsap.to(".senior-turtle", {
      x: 38,
      y: -18,
      rotate: 7,
      transformOrigin: "50% 50%",
      duration: 6.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, [publicProjects.length, activeExperiences]);

  return (
    <section ref={rootRef} id="reef" className="page-section reef-section island-section">
      <SectionTitle
        eyebrow="Récif du recrutement"
        title="Des signaux techniques lisibles pour les recruteurs et les devs seniors"
        description="La métaphore du récif donne une identité forte : chaque preuve technique devient un organisme vivant dans un écosystème cohérent."
      />

      <div className="reef-layout">
        <Card className="reef-panel reef-map-card island-card" radius="xl">
          <svg className="reef-map" viewBox="0 0 980 560" aria-hidden="true">
            <defs>
              <radialGradient id="reefLagoon" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity=".32" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="980" height="560" rx="48" fill="url(#reefLagoon)" />
            <path className="reef-route" d="M96 355 C214 170 366 450 496 250 C618 62 778 224 880 119" fill="none" stroke="rgba(14,116,144,.42)" strokeWidth="4" strokeLinecap="round" />
            <path className="reef-route" d="M130 430 C278 322 408 506 574 372 C690 278 744 404 886 326" fill="none" stroke="rgba(20,184,166,.34)" strokeWidth="3" strokeLinecap="round" />

            <g className="reef-node" transform="translate(125 338)">
              <path d="M-66 5 C-40-68 61-70 87-8 C105 34 47 73-20 62 C-56 56-80 33-66 5Z" fill="rgba(255,247,210,.88)" stroke="rgba(14,116,144,.35)" strokeWidth="3" />
              <text x="0" y="6" textAnchor="middle">React</text>
            </g>
            <g className="reef-node" transform="translate(355 282)">
              <path d="M-70 1 C-49-80 68-75 91-13 C118 56 25 84-42 55 C-72 43-86 25-70 1Z" fill="rgba(255,247,210,.88)" stroke="rgba(13,148,136,.36)" strokeWidth="3" />
              <text x="0" y="6" textAnchor="middle">Spring</text>
            </g>
            <g className="reef-node" transform="translate(590 260)">
              <path d="M-82 10 C-45-78 78-80 104-6 C125 55 42 90-42 65 C-80 54-100 35-82 10Z" fill="rgba(255,247,210,.88)" stroke="rgba(249,115,22,.34)" strokeWidth="3" />
              <text x="0" y="6" textAnchor="middle">Projets</text>
            </g>
            <g className="reef-node" transform="translate(820 155)">
              <path d="M-94 8 C-64-96 90-92 121-15 C147 55 55 104-48 78 C-94 66-116 37-94 8Z" fill="rgba(255,247,210,.9)" stroke="rgba(15,118,110,.42)" strokeWidth="3" />
              <text x="0" y="6" textAnchor="middle">Seniors</text>
            </g>

            <circle className="reef-packet" cx="245" cy="304" r="9" fill="rgba(6,182,212,.76)" />
            <circle className="reef-packet" cx="478" cy="248" r="7" fill="rgba(249,115,22,.65)" />
            <circle className="reef-packet" cx="700" cy="202" r="8" fill="rgba(20,184,166,.7)" />
            <ReefTurtle className="senior-turtle" x="815" y="300" />
          </svg>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" className="reef-stats">
          <Card className="reef-panel reef-stat island-card" radius="xl">
            <Text className="card-kicker">Îles projets</Text>
            <Title order={3}>{publicProjects.length}</Title>
            <Text>preuves techniques visibles dans l’archipel.</Text>
          </Card>
          <Card className="reef-panel reef-stat island-card" radius="xl">
            <Text className="card-kicker">Récifs stack</Text>
            <Title order={3}>{stacks.length}</Title>
            <Text>technologies dominantes regroupées en coraux lisibles.</Text>
          </Card>
          <Card className="reef-panel reef-stat island-card" radius="xl">
            <Text className="card-kicker">Courant actif</Text>
            <Title order={3}>{activeExperiences}</Title>
            <Text>expérience actuellement en cours.</Text>
          </Card>
          <Card className="reef-panel reef-stat island-card" radius="xl">
            <Text className="card-kicker">Tortues seniors</Text>
            <Title order={3}>review</Title>
            <Text>métaphore visuelle des développeurs seniors qui évaluent la robustesse.</Text>
          </Card>
        </SimpleGrid>
      </div>

      <Group gap="xs" className="reef-stack-row">
        {stacks.map((stack) => (
          <Badge key={stack.label} className="category-chip">{stack.label}</Badge>
        ))}
      </Group>
    </section>
  );
}
