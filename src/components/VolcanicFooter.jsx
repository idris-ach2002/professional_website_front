import { Anchor, Badge, Group, SimpleGrid, Text } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { CONTACT_LABELS, getContactHref, getOwnerFullName } from "../utils/portfolio";

function LavaParticle({ index }) {
  const x = 480 + ((index * 37) % 250) - 125;
  const y = 330 + ((index * 29) % 54);
  const r = 4 + (index % 4);
  return <circle className="lava-particle" cx={x} cy={y} r={r} />;
}

function FooterContact({ contact }) {
  return (
    <Anchor href={getContactHref(contact)} target={contact.type === "EMAIL" || contact.type === "PHONE_NUMBER" ? undefined : "_blank"} className="volcano-contact">
      <span>{CONTACT_LABELS[contact.type] ?? contact.type}</span>
      <strong>{contact.value}</strong>
    </Anchor>
  );
}

export default function VolcanicFooter({ owner, source }) {
  const rootRef = useRef(null);
  const contacts = owner?.contacts ?? [];
  const fullName = getOwnerFullName(owner);
  const visibleContacts = contacts.slice(0, 4);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;

    gsap.set(".volcano-footer-info, .volcano-contact, .volcano-status", { autoAlpha: 0, y: 42 });
    gsap.set(".lava-particle", { autoAlpha: 0, transformOrigin: "50% 50%" });
    gsap.set(".eruption-plume", { scaleY: 0.25, autoAlpha: 0.2, transformOrigin: "50% 100%" });
    gsap.set(".lava-flow", { strokeDasharray: 620, strokeDashoffset: 620 });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: rootRef.current,
        start: "top 78%",
        end: "bottom bottom",
        toggleActions: "play none none reverse",
      },
      defaults: { ease: "power3.out" },
    });

    timeline
      .to(".eruption-plume", { autoAlpha: 0.55, scaleY: 1, duration: 0.75 })
      .to(".lava-flow", { strokeDashoffset: 0, duration: 0.8, stagger: 0.08 }, "-=0.45")
      .to(".lava-particle", { autoAlpha: 1, y: -150, x: (index) => (index % 2 ? -38 : 42), scale: 0.4, duration: 1.05, stagger: 0.025 }, "-=0.65")
      .to(".volcano-footer-info, .volcano-contact, .volcano-status", { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.07 }, "-=0.45");

    gsap.to(".lava-particle", {
      y: (index) => -120 - (index % 6) * 16,
      x: (index) => (index % 2 ? -52 : 54),
      scale: 0.35,
      autoAlpha: 0,
      duration: 2.6,
      repeat: -1,
      ease: "power1.out",
      stagger: { each: 0.08, from: "random" },
      scrollTrigger: { trigger: rootRef.current, start: "top 80%", toggleActions: "play pause resume pause" },
    });

    gsap.to(".volcano-glow-core", {
      scale: 1.16,
      opacity: 0.74,
      transformOrigin: "50% 50%",
      duration: 1.9,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      scrollTrigger: { trigger: rootRef.current, start: "top 85%", toggleActions: "play pause resume pause" },
    });
  }, [visibleContacts.length, fullName]);

  return (
    <footer ref={rootRef} className="volcano-footer" aria-labelledby="volcano-footer-title">
      <div className="volcano-stage">
        <svg className="volcano-svg" viewBox="0 0 960 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <radialGradient id="volcanoPlume" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity=".5" />
              <stop offset="46%" stopColor="#f97316" stopOpacity=".22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="volcanoRock" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#164e63" />
              <stop offset="62%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="lava" x1="0" x2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>
          <ellipse cx="480" cy="454" rx="360" ry="42" fill="rgba(14,116,144,.14)" />
          <circle className="eruption-plume" cx="480" cy="240" r="170" fill="url(#volcanoPlume)" />
          <path className="volcano-glow-core" d="M426 356 C449 302 508 302 535 356 C505 371 459 371 426 356Z" fill="rgba(249,115,22,.72)" />
          <path d="M204 450 C279 383 340 268 418 338 C445 363 516 363 546 335 C628 260 687 382 760 450Z" fill="url(#volcanoRock)" />
          <path d="M386 350 C430 320 512 322 557 350 C518 369 432 369 386 350Z" fill="rgba(255,247,210,.42)" />
          <path className="lava-flow" d="M466 351 C444 383 462 409 420 444" fill="none" stroke="url(#lava)" strokeWidth="8" strokeLinecap="round" />
          <path className="lava-flow" d="M512 351 C538 386 512 416 566 448" fill="none" stroke="url(#lava)" strokeWidth="7" strokeLinecap="round" />
          <path className="lava-flow" d="M489 351 C489 380 488 407 486 447" fill="none" stroke="url(#lava)" strokeWidth="5" strokeLinecap="round" />
          {Array.from({ length: 22 }).map((_, index) => (
            <LavaParticle key={index} index={index} />
          ))}
        </svg>
      </div>

      <div className="volcano-footer-info">
        <Badge className="volcano-status" radius="xl">
          {source === "api" ? "Données live" : "Mode démonstration"}
        </Badge>
        <Text id="volcano-footer-title" className="volcano-footer-title">{fullName}</Text>
        <Text className="volcano-footer-text">
          Dernier signal de l’archipel : profil prêt à être revu, contactable et exploitable par une équipe technique.
        </Text>
      </div>

      {visibleContacts.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: visibleContacts.length > 2 ? 4 : 2 }} spacing="sm" className="volcano-contact-grid">
          {visibleContacts.map((contact) => (
            <FooterContact key={`${contact.type}-${contact.value}`} contact={contact} />
          ))}
        </SimpleGrid>
      )}

      <Group justify="center" gap="xs" className="volcano-footer-meta">
        <span>Océan</span>
        <span>·</span>
        <span>Îles projets</span>
        <span>·</span>
        <span>Récif senior</span>
        <span>·</span>
        <span>GSAP motion</span>
      </Group>
    </footer>
  );
}
