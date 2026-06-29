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
    const root = rootRef.current;

    gsap.set(".hero-title-main", { perspective: 900, transformStyle: "preserve-3d" });
    gsap.set(".profile-island .hero-copy", { transformPerspective: 1400, transformOrigin: "50% 50%" });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline
      .from(
        ".profile-island .hero-copy",
        {
          autoAlpha: 0,
          y: 64,
          scale: 0.94,
          rotateX: 8,
          rotateY: -3,
          clipPath: "polygon(8% 18%, 76% 10%, 96% 26%, 90% 72%, 78% 88%, 14% 82%, 4% 66%, 0 34%)",
          filter: "blur(10px) saturate(1.2)",
          duration: 1.05,
          ease: "expo.out",
        },
        0,
      )
      .to(
        ".profile-island .hero-copy",
        {
          clipPath: "polygon(0 9%, 7% 0, 84% 0, 100% 16%, 97% 75%, 86% 100%, 10% 96%, 0 78%)",
          filter: "blur(0px) saturate(1)",
          duration: 1.05,
          ease: "expo.out",
        },
        0,
      )
      .fromTo(
        ".hero-title-char",
        {
          rotationX: -90,
          autoAlpha: 0,
          y: 20,
        },
        {
          rotationX: 0,
          autoAlpha: 1,
          y: 0,
          stagger: 0.04,
          duration: 0.55,
          transformOrigin: "50% 50% -30px",
          ease: "back.out(1.5)",
        },
        0.18,
      )
      .from(".hero-keyword", { y: 22, autoAlpha: 0, rotateX: -48, transformOrigin: "50% 50% -40", stagger: 0.09, duration: 0.58 }, "-=0.35")
      .from(".hero-lead, .hero-description", { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, "-=0.28")
      .from(".hero-actions .mantine-Button-root", { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.45 }, "-=0.25")
      .from(".hero-panel", { x: 46, y: 26, rotateY: -9, rotate: 2.2, autoAlpha: 0, duration: 0.9, ease: "expo.out" }, "-=0.68");

    gsap.to(".hero-keyword", { y: -3, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.18 });

    const updatePointer = (event) => {
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      root.style.setProperty("--hero-mx", `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
      root.style.setProperty("--hero-my", `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
    };

    const resetPointer = () => {
      if (!root) return;
      root.style.setProperty("--hero-mx", "56%");
      root.style.setProperty("--hero-my", "26%");
    };

    root?.addEventListener("pointermove", updatePointer);
    root?.addEventListener("pointerleave", resetPointer);

    return () => {
      root?.removeEventListener("pointermove", updatePointer);
      root?.removeEventListener("pointerleave", resetPointer);
    };
  }, [fullName]);

  return (
    <section ref={rootRef} id="profile" className="hero-grid island-section profile-island">
      <div className="hero-copy">
        <div className="hero-map-line" />
        <AnimatedTitle title={profile?.title ?? fullName} headline={profile?.headline ?? profile?.subtitle ?? ""} />
        <Text className="hero-lead">{profile?.shortDescription ?? profile?.description}</Text>
        <Text className="hero-description">{profile?.description}</Text>

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