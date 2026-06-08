import { Anchor, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import SectionTitle from "./SectionTitle";
import { CONTACT_LABELS, buildVCard, downloadText, getContactHref, getOwnerFullName } from "../utils/portfolio";

function ContactAction({ contact }) {
  return (
    <Anchor href={getContactHref(contact)} target={contact.type === "EMAIL" || contact.type === "PHONE_NUMBER" ? undefined : "_blank"} className="contact-action-card">
      <span>{CONTACT_LABELS[contact.type] ?? contact.type}</span>
      <strong>{contact.value}</strong>
    </Anchor>
  );
}

export default function ContactSection({ owner, source }) {
  const [copied, setCopied] = useState(false);
  const contacts = owner?.contacts ?? [];
  const email = contacts.find((contact) => contact.type === "EMAIL")?.value;
  const fullName = getOwnerFullName(owner);

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
    <section id="contact" className="page-section contact-section">
      <SectionTitle
        eyebrow="Conversion"
        title="Contact professionnel direct, lisible et exportable"
        description="La section contact exploite ContactInfo du backend et ajoute une vCard téléchargeable pour rendre le portfolio plus utile en contexte recruteur/client."
      />

      <div className="contact-layout">
        <Card className="contact-primary" radius="xl">
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

      <Card className="seo-card" radius="xl">
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
