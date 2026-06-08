import { Anchor, Badge, Button, Card, Divider, Group, Image, RingProgress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { motion } from "framer-motion";
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

const MotionDiv = motion.div;
const MotionAside = motion.aside;

function ProfilePortrait({ owner, profile }) {
  const fullName = getOwnerFullName(owner);

  return (
    <Card className="portrait-card" radius="xl">
      <div className="portrait-orbit" />
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
          <Text>Modèle</Text>
          <strong>Generic</strong>
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
  const fullName = getOwnerFullName(owner);
  const contacts = owner?.contacts ?? [];
  const metrics = getProfessionalMetrics(projects, experiences).slice(0, 4);
  const specialties = inferSpecialty(projects, experiences);
  const email = getPrimaryContact(owner, "EMAIL");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");

  return (
    <section id="profile" className="hero-grid">
      <MotionDiv
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hero-copy"
      >
        <div className="hero-radar" />
        <Badge className="hero-badge" radius="xl">
          Site vitrine professionnel · SEO · data-driven
        </Badge>
        <Title className="hero-title">
          {profile?.title ?? fullName}
          <span>{profile?.headline ?? "Ingénierie logicielle full-stack"}</span>
        </Title>
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
            Explorer les réalisations
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" className="hero-metrics">
          {metrics.map((metric) => (
            <Card key={metric.label} className="metric-card">
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
      </MotionDiv>

      <MotionAside
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.08, ease: "easeOut" }}
        className="hero-panel"
      >
        <ProfilePortrait owner={owner} profile={profile} />
        <Card className="availability-card" radius="xl">
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
          <Card className="contact-card" radius="xl">
            <Text className="card-kicker">Coordonnées</Text>
            <Stack gap="xs">
              {contacts.slice(0, 6).map((contact) => (
                <ContactPill key={`${contact.type}-${contact.value}`} contact={contact} />
              ))}
            </Stack>
          </Card>
        )}
      </MotionAside>
    </section>
  );
}
