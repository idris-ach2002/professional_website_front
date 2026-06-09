import { Anchor, Badge, Button, Card, Divider, Group, Image, RingProgress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import {
  CONTACT_LABELS,
  getContactHref,
  getInitials,
  getOwnerFullName,
  getPrimaryContact,
  normalizeUrl,
} from "../utils/portfolio";

function AnimatedTitle({ title, headline }) {
  const words = String(headline ?? "").split(" · ").filter(Boolean);
  const titleChars = String(title ?? "").split("");

  return (
    <Title className="hero-title">
      <span className="hero-title-main" style={{ display: "block" }}>
        {titleChars.map((char, index) => (
          <span
            key={index}
            className="hero-title-char"
            style={{ display: "inline-block" }}
          >
            {/* Gestion de l'espace pour éviter l'effondrement du layout */}
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
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
      {profile?.profileImageUrl ? (
        <Image src={profile.profileImageUrl} alt={fullName} className="portrait-image" />
      ) : (
        <div className="portrait-placeholder">{getInitials(owner)}</div>
      )}
      <Stack gap={4} align="center" className="portrait-content">
        <Text className="portrait-name">{fullName}</Text>
        <Text className="portrait-role">{profile?.subtitle ?? "Portfolio professionnel"}</Text>
      </Stack>
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

export default function ProfileHero({ owner, profile }) {
  const rootRef = useRef(null);
  const fullName = getOwnerFullName(owner);
  const contacts = owner?.contacts ?? [];
  const email = getPrimaryContact(owner, "EMAIL");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");

  useGsap(rootRef, (gsap) => {
    gsap.set(".hero-title-main", { perspective: 800, transformStyle: "preserve-3d" });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    timeline
      .fromTo(
        ".hero-title-char",
        { 
          rotationX: -90, 
          autoAlpha: 0, 
          y: 20 
        },
        { 
          rotationX: 0, 
          autoAlpha: 1, 
          y: 0,
          stagger: 0.04, 
          duration: 0.55, 
          transformOrigin: "50% 50% -30px",
          ease: "back.out(1.5)"
        }, 
        "-=0.12"
      )
      .from(".hero-keyword", { y: 22, autoAlpha: 0, rotateX: -48, transformOrigin: "50% 50% -40", stagger: 0.09, duration: 0.58 }, "-=0.35")
      .from(".hero-lead, .hero-description", { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, "-=0.28")
      .from(".hero-actions .mantine-Button-root", { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.45 }, "-=0.25")
      .from(".hero-panel", { x: 36, y: 18, rotate: 1.8, autoAlpha: 0, duration: 0.78 }, "-=0.62");

    gsap.to(".hero-keyword", { y: -3, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.18 });
  }, [fullName]);

  return (
    <section ref={rootRef} id="profile" className="hero-grid island-section profile-island">
      <div className="hero-copy">
        <div className="hero-map-line" />
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
            Explorer les projets
          </Button>
        </Group>
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