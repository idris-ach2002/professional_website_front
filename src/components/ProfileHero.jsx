import { Anchor, Badge, Button, Card, Divider, Group, Image, RingProgress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo, useRef } from "react";
import { useGsap } from "../animations/useGsap";
import {
  CONTACT_LABELS,
  getContactHref,
  getInitials,
  getOwnerFullName,
  getPrimaryContact,
  getProfessionalMetrics,
  inferSpecialty,
  normalizeUrl,
} from "../utils/portfolio";

function AnimatedTitle({ title, headline }) {
  const words = String(headline ?? "").split(" · ").filter(Boolean);
  return (
    <Title className="hero-title">
      <span className="hero-title-main">{title}</span>
      <span className="hero-title-current">
        {words.map((word, index) => (
          <em key={word} className="hero-keyword" style={{ "--delay": index }}>
            {word}
          </em>
        ))}
      </span>
    </Title>
  );
}

function ProfilePortrait({ owner, profile }) {
  const fullName = getOwnerFullName(owner);

  return (
    <Card className="portrait-card island-card" radius="xl">
      <svg className="portrait-svg-orbits" viewBox="0 0 280 280" aria-hidden="true">
        <ellipse className="portrait-orbit orbit-a" cx="140" cy="140" rx="118" ry="93" />
        <ellipse className="portrait-orbit orbit-b" cx="140" cy="140" rx="98" ry="123" />
        <path className="portrait-route" d="M43 153 C77 56 190 36 237 118 C277 189 180 260 92 218 C59 202 42 179 43 153Z" />
      </svg>
      <div className="portrait-glow" />
      {profile?.profileImageUrl ? (
        <Image src={profile.profileImageUrl} alt={fullName} className="portrait-image" />
      ) : (
        <div className="portrait-placeholder">{getInitials(owner)}</div>
      )}
      <Stack gap={4} align="center" className="portrait-content">
        <Text className="portrait-name">{fullName}</Text>
        <Text className="portrait-role">{profile?.subtitle ?? "Portfolio professionnel"}</Text>
      </Stack>
      <Divider className="soft-divider" />
      <SimpleGrid cols={3} spacing="xs" className="portrait-stats">
        <div>
          <Text>Backend</Text>
          <strong>Spring</strong>
        </div>
        <div>
          <Text>Frontend</Text>
          <strong>React</strong>
        </div>
        <div>
          <Text>Motion</Text>
          <strong>GSAP</strong>
        </div>
      </SimpleGrid>
    </Card>
  );
}

function ContactPill({ contact }) {
  const label = CONTACT_LABELS[contact.type] ?? contact.type;
  return (
    <Anchor href={getContactHref(contact)} target={contact.type === "EMAIL" || contact.type === "PHONE_NUMBER" ? undefined : "_blank"} className="contact-pill">
      <span>{label}</span>
      <strong>{contact.value}</strong>
    </Anchor>
  );
}

export default function ProfileHero({ owner, profile, projects, experiences }) {
  const rootRef = useRef(null);
  const fullName = getOwnerFullName(owner);
  const contacts = owner?.contacts ?? [];
  const metrics = useMemo(() => getProfessionalMetrics(projects, experiences).slice(0, 4), [projects, experiences]);
  const specialties = useMemo(() => inferSpecialty(projects, experiences), [projects, experiences]);
  const email = getPrimaryContact(owner, "EMAIL");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");

  useGsap(rootRef, (gsap) => {
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline
      .from(".hero-badge", { y: 16, autoAlpha: 0, duration: 0.45 })
      .from(".hero-title-main", { y: 36, autoAlpha: 0, duration: 0.72 }, "-=0.12")
      .from(".hero-keyword", { y: 22, autoAlpha: 0, rotateX: -48, transformOrigin: "50% 50% -40", stagger: 0.09, duration: 0.58 }, "-=0.35")
      .from(".hero-lead, .hero-description", { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, "-=0.28")
      .from(".hero-actions .mantine-Button-root", { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.45 }, "-=0.25")
      .from(".hero-panel", { x: 36, y: 18, rotate: 1.8, autoAlpha: 0, duration: 0.78 }, "-=0.62")
      .from(".metric-card", { y: 20, autoAlpha: 0, stagger: 0.055, duration: 0.48 }, "-=0.38")
      .from(".specialty-chip", { y: 10, autoAlpha: 0, scale: 0.86, stagger: 0.05, duration: 0.34 }, "-=0.2");

    gsap.to(".portrait-orbit.orbit-a", { rotate: 360, transformOrigin: "50% 50%", duration: 28, repeat: -1, ease: "none" });
    gsap.to(".portrait-orbit.orbit-b", { rotate: -360, transformOrigin: "50% 50%", duration: 34, repeat: -1, ease: "none" });
    gsap.to(".portrait-route", { strokeDashoffset: -420, duration: 9, repeat: -1, ease: "none" });
    gsap.to(".hero-keyword", { y: -3, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.18 });
  }, [fullName]);

  return (
    <section ref={rootRef} id="profile" className="hero-grid island-section profile-island">
      <div className="hero-copy">
        <div className="hero-map-line" />
        <Badge className="hero-badge" radius="xl">
          Archipel du recrutement · Portfolio générique alimenté par Spring
        </Badge>
        <AnimatedTitle title={profile?.title ?? fullName} headline={profile?.headline ?? "Ingénierie logicielle · Architecture backend · Interfaces produit"} />
        <Text className="hero-lead">{profile?.shortDescription ?? profile?.description}</Text>
        <Text className="hero-description">{profile?.description}</Text>

        <Group className="hero-actions">
          {profile?.cvUrl && profile.cvUrl !== "#" && (
            <Button component="a" href={normalizeUrl(profile.cvUrl)} target="_blank" radius="xl" className="primary-action">
              Voir le CV
            </Button>
          )}
          {email && (
            <Button component="a" href={getContactHref(email)} radius="xl" className="primary-action">
              Me contacter
            </Button>
          )}
          {linkedin && (
            <Button component="a" href={getContactHref(linkedin)} target="_blank" radius="xl" variant="outline" className="secondary-action">
              LinkedIn
            </Button>
          )}
          <Button component="a" href="#projects" radius="xl" variant="subtle" className="ghost-action">
            Explorer les îles projets
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" className="hero-metrics">
          {metrics.map((metric) => (
            <Card key={metric.label} className="metric-card island-mini-card">
              <Text>{metric.label}</Text>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </Card>
          ))}
        </SimpleGrid>

        {specialties.length > 0 && (
          <Group gap="xs" className="specialty-row">
            {specialties.map((specialty) => (
              <Badge key={specialty.label} className="specialty-chip" radius="xl">
                {specialty.label}
              </Badge>
            ))}
          </Group>
        )}
      </div>

      <aside className="hero-panel">
        <ProfilePortrait owner={owner} profile={profile} />
        <Card className="availability-card island-card" radius="xl">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Stack gap={0} className="availability-copy">
              <Text className="availability-label">Disponibilité</Text>
              <Text className="availability-value">{profile?.availability ?? "Ouvert aux opportunités"}</Text>
              <Text className="availability-location">{profile?.location ?? owner?.address}</Text>
            </Stack>
            <RingProgress
              size={88}
              thickness={7}
              roundCaps
              sections={[{ value: 84, color: "cyan" }]}
              label={<Text ta="center" className="ring-label">ready</Text>}
            />
          </Group>
        </Card>
        {contacts.length > 0 && (
          <Card className="contact-card island-card" radius="xl">
            <Text className="card-kicker">Coordonnées</Text>
            <Stack gap="xs">
              {contacts.slice(0, 6).map((contact) => (
                <ContactPill key={`${contact.type}-${contact.value}`} contact={contact} />
              ))}
            </Stack>
          </Card>
        )}
      </aside>
    </section>
  );
}
