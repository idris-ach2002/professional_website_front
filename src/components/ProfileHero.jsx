import { Anchor, Badge, Button, Card, Group, RingProgress, Stack, Text, Title } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { PreviewableImage } from "./FilePreview";
import {
  CONTACT_LABELS,
  getContactHref,
  getInitials,
  getOwnerFullName,
  getPrimaryContact,
} from "../utils/portfolio";

function AnimatedTitle({ title, headline }) {
  const words = String(headline ?? "").split(" · " ).filter(Boolean);

  return (
    <Title className="hero-title">
      <span className="hero-title-main">{title}</span>
      {words.length > 0 && (
        <span className="hero-title-current">
          {words.map((word) => (
            <em key={word} className="hero-keyword">
              {word}
            </em>
          ))}
        </span>
      )}
    </Title>
  );
}

function ProfilePortrait({ owner, profile }) {
  const fullName = getOwnerFullName(owner);

  return (
    <Card className="portrait-card island-card" radius="xl">
      {profile?.profileImageUrl ? (
        <PreviewableImage
          src={profile.profileImageUrl}
          alt={fullName}
          className="portrait-preview-trigger"
          imageClassName="portrait-image"
          modalTitle={`Portrait — ${fullName}`}
        />
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
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline
      .from(".profile-island .hero-copy", {
        autoAlpha: 0,
        y: 24,
        duration: 0.68,
      })
      .from(
        ".hero-title-main, .hero-title-current, .profile-copy-card, .hero-actions .mantine-Button-root",
        {
          autoAlpha: 0,
          y: 16,
          stagger: 0.055,
          duration: 0.46,
        },
        "-=0.42",
      )
      .from(
        ".hero-panel > *",
        {
          autoAlpha: 0,
          y: 18,
          stagger: 0.08,
          duration: 0.48,
        },
        "-=0.34",
      );
  }, [fullName]);

  return (
    <section ref={rootRef} id="profile" className="hero-grid island-section profile-island">
      <div className="hero-copy">
        <div className="hero-map-line" />
        <AnimatedTitle title={profile?.title ?? fullName} headline={profile?.headline ?? profile?.subtitle ?? ""} />

        <div className="profile-copy-stack">
          {(profile?.shortDescription ?? profile?.description) && (
            <div className="profile-copy-card profile-copy-card--lead">
              <Text className="hero-lead">{profile?.shortDescription ?? profile?.description}</Text>
            </div>
          )}
          {profile?.description && profile.description !== profile?.shortDescription && (
            <div className="profile-copy-card profile-copy-card--description">
              <Text className="hero-description">{profile.description}</Text>
            </div>
          )}
        </div>

        <Group className="hero-actions">
          {profile?.cvUrl && profile.cvUrl !== "#" && (
            <Button
              component="a"
              href="/cv"
              target="_blank"
              rel="noreferrer"
              radius="xl"
              className="primary-action"
            >
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
          <Card id="contact" className="contact-card island-card" radius="xl">
            <Text className="card-kicker">Coordonnées</Text>
            <Stack gap="xs">
              {contacts.map((contact) => (
                <ContactPill key={`${contact.type}-${contact.value}`} contact={contact} />
              ))}
            </Stack>
          </Card>
        )}
      </aside>
    </section>
  );
}