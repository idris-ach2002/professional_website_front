import { Anchor, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";
import SectionTitle from "./SectionTitle";
import { CONTACT_LABELS, buildVCard, downloadText, getContactHref, getOwnerFullName } from "../utils/portfolio";

function ContactAction({ contact }) {
  return (
    <Anchor href={getContactHref(contact)} target={contact.type === "EMAIL" || contact.type === "PHONE_NUMBER" ? undefined : "_blank"} className="contact-action-card island-card">
      <span>{CONTACT_LABELS[contact.type] ?? contact.type}</span>
      <strong>{contact.value}</strong>
    </Anchor>
  );
}

export default function ContactSection({ owner, source }) {
  const rootRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const contacts = owner?.contacts ?? [];
  const email = contacts.find((contact) => contact.type === "EMAIL")?.value;
  const fullName = getOwnerFullName(owner);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    if (!ScrollTrigger) return;
    gsap.from(".contact-primary, .contact-action-card, .seo-card", {
      autoAlpha: 0,
      y: 46,
      scale: 0.95,
      rotate: (index) => (index % 2 ? 1.4 : -1.4),
      duration: 0.78,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: rootRef.current, start: "top 78%" },
    });
    gsap.to(".harbor-light", { opacity: 0.48, scale: 1.2, duration: 3.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }, [contacts.length]);

  const copyEmail = async () => {
    if (!email) return;
    await navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadVCard = () => {
    downloadText(`${fullName.replaceAll(" ", "-").toLowerCase()}.vcf`, buildVCard(owner), "text/vcard;charset=utf-8");
  };

  return (
    <section ref={rootRef} id="contact" className="page-section contact-section island-section harbor-section">
      <SectionTitle
        eyebrow="Port de contact"
        title="Une arrivée directe, claire et exportable"
        description="La conversion reste simple : email, vCard, réseaux, et données ContactInfo issues du backend."
      />

      <div className="contact-layout">
        <Card className="contact-primary island-card" radius="xl">
          <span className="harbor-light" />
          <Badge className="hero-badge" radius="xl">{source === "api" ? "Données Spring actives" : "Mode démonstration"}</Badge>
          <Title order={3}>{fullName}</Title>
          <Text>{owner?.prof?.availability ?? "Ouvert aux opportunités professionnelles"}</Text>
          <Group className="contact-cta-row">
            {email && (
              <Button component="a" href={`mailto:${email}`} radius="xl" className="primary-action">
                Envoyer un email
              </Button>
            )}
            {email && (
              <Button onClick={copyEmail} radius="xl" variant="outline" className="secondary-action">
                {copied ? "Email copié" : "Copier l’email"}
              </Button>
            )}
            <Button onClick={downloadVCard} radius="xl" variant="subtle" className="ghost-action">
              Télécharger vCard
            </Button>
          </Group>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md" className="contact-action-grid">
          {contacts.map((contact) => (
            <ContactAction key={`${contact.type}-${contact.value}`} contact={contact} />
          ))}
        </SimpleGrid>
      </div>

      <Card className="seo-card island-card" radius="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text className="card-kicker">SEO technique inclus</Text>
            <Title order={3}>Title, meta description, Open Graph, canonical et JSON-LD</Title>
            <Text>
              Le composant <strong>SEOHead</strong> injecte les métadonnées depuis le backend : nom, titre, description, réseaux, compétences, projets et formation.
            </Text>
          </Stack>
          <Badge className="executive-badge">schema.org Person</Badge>
        </Group>
      </Card>
    </section>
  );
}
