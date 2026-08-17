import { Anchor, Button, Card, Group, Text, Title } from "@mantine/core";
import { useMemo, useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";
import useLanguage from "../localization/useLanguage";
import { PreviewableImage } from "./FilePreview";
import { VisibilityGate } from "../visibility/ItemVisibilityContext";
import {
  getContactHref,
  getInitials,
  getOwnerFullName,
  getPrimaryContact,
} from "../utils/portfolio";
import "../styles/sections/profile-ios-v49.css";
import "../styles/sections/profile-identity-dock.css";
// CSS compatibility: ghost-action hero-map-line ring-label hero-description profile-copy-stack profile-copy-card profile-copy-card--lead profile-copy-card--description

const PROFILE_VISUAL_CATEGORIES = [
  { key: "backend", icon: "server", label: "Backend" },
  { key: "frontend", icon: "layers", label: "Frontend" },
  { key: "data", icon: "database", label: "Data" },
  { key: "cloud", icon: "cloud", label: "Cloud" },
];

function ProfileIcon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    "data-profile-icon": name,
  };

  if (name === "server") return <svg {...common}><rect x="4" y="4" width="16" height="6" rx="2"/><rect x="4" y="14" width="16" height="6" rx="2"/><path d="M8 7h.01M8 17h.01M12 7h4M12 17h4"/></svg>;
  if (name === "layers") return <svg {...common}><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/></svg>;
  if (name === "database") return <svg {...common}><ellipse cx="12" cy="5.5" rx="7" ry="3"/><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>;
  if (name === "cloud") return <svg {...common}><path d="M7.2 18.2h9.35a4.2 4.2 0 0 0 .7-8.34A5.75 5.75 0 0 0 6.3 8.45 4.9 4.9 0 0 0 7.2 18.2Z"/><path d="M8.3 13.1h7.4M10.2 10.8l-1.9 2.3 1.9 2.3M13.8 10.8l1.9 2.3-1.9 2.3"/></svg>;
  if (name === "spark") return <svg {...common}><path d="M12 2.8 14 9l6.2 2-6.2 2-2 6.2-2-6.2-6.2-2 6.2-2L12 2.8Z"/><path d="m18.5 3 .7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7.7-2.2Z"/></svg>;
  if (name === "mail") return <svg {...common}><rect x="3.2" y="5.3" width="17.6" height="13.4" rx="3.1"/><path d="m4.8 7.2 7.2 5.7 7.2-5.7"/></svg>;
  if (name === "phone") return <svg {...common}><path d="M7.2 3.9 10 7.3 8.4 9.6c1.15 2.3 3.05 4.2 5.4 5.35l2.25-1.62 3.4 2.72c.48.38.57 1.07.22 1.57l-1.13 1.65c-.56.82-1.59 1.17-2.55.93C9.6 18.65 5.25 14.3 3.72 7.9c-.24-.96.1-1.99.93-2.55L6.3 4.22c.3-.2.62-.3.9-.32Z"/></svg>;
  if (name === "github") return <svg {...common}><path d="M8.3 19.1c-3.2 1-3.2-1.8-4.5-2.25M15.7 21v-3.45c0-1-.35-1.75-.9-2.25 3-.34 6.15-1.48 6.15-6.7 0-1.48-.52-2.7-1.4-3.65.14-.36.6-1.76-.14-3.6 0 0-1.14-.37-3.74 1.4A13 13 0 0 0 12 2.25a13 13 0 0 0-3.66.5C5.74.98 4.6 1.35 4.6 1.35c-.74 1.84-.28 3.24-.14 3.6-.88.95-1.4 2.17-1.4 3.65 0 5.2 3.15 6.36 6.15 6.7-.46.4-.8.98-.92 1.7-.82.37-2.9 1-4.18-1.2"/><path d="M8.3 17v4"/></svg>;
  if (name === "linkedin") return <svg {...common}><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2"/><path d="M8 10v6.8M8 7.35v.05M12 16.8V10M12 12.9c.55-1.95 4.2-2.2 4.2.9v3"/></svg>;
  if (name === "contactHub") return <svg {...common}><circle cx="6" cy="8" r="2.2"/><circle cx="18" cy="7" r="2.2"/><circle cx="12" cy="17" r="2.5"/><path d="m7.9 9.1 2.75 5.6M16.1 8.3l-2.7 6.3M8.1 7.8h7.7"/></svg>;
  if (name === "pin") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (name === "availability") return <svg {...common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.25"/><path d="M12 12 17.2 7.7"/><path d="M12 2.2v2M21.8 12h-2M12 21.8v-2M2.2 12h2"/></svg>;
  if (name === "cv") return <svg {...common}><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h6M9 17h5"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8"/><path d="m9.5 12 1.7 1.7 3.8-4"/></svg>;
}

function AnimatedTitle({ title }) {
  return <Title className="hero-title"><span className="hero-title-main">{title}</span></Title>;
}

function ProfileMotionField() {
  return (
    <div className="profile-photo-v11-field profile-shared-motion-field" aria-hidden="true">
      <span className="profile-photo-v11-shade profile-photo-v11-shade--grey" />
      <span className="profile-photo-v11-shade profile-photo-v11-shade--blue" />
      <span className="profile-photo-v11-rail profile-photo-v11-rail--1" />
      <span className="profile-photo-v11-rail profile-photo-v11-rail--2" />
      <span className="profile-photo-v11-rail profile-photo-v11-rail--3" />
      <span className="profile-photo-v11-rail profile-photo-v11-rail--4" />
      <span className="profile-photo-v11-flare profile-photo-v11-flare--1" />
    </div>
  );
}

function resolveOwnerIdentity(owner) {
  const firstName = String(owner?.firstName ?? owner?.firstname ?? "").trim();
  const lastName = String(owner?.name ?? owner?.lastName ?? owner?.lastname ?? "").trim();
  const explicitName = String(owner?.fullName ?? owner?.displayName ?? "").trim();
  const fullName = explicitName || [firstName, lastName].filter(Boolean).join(" ") || getOwnerFullName(owner);

  return { firstName, lastName, fullName };
}

function resolveProfileViewModel(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  const text = (value) => String(value ?? "").trim();

  return {
    title: text(source.title),
    subtitle: text(source.subtitle),
    headline: text(source.headline),
    shortDescription: text(source.shortDescription),
    description: text(source.description),
    location: text(source.location),
    availability: text(source.availability),
    profileImageUrl: text(source.profileImageUrl),
    logoUrl: text(source.logoUrl),
    cvUrl: text(source.cvUrl),
    portfolioUrl: text(source.portfolioUrl),
  };
}

function ProfilePhotoCard({ owner, profile, t }) {
  const identity = resolveOwnerIdentity(owner);
  const fullName = identity.fullName;
  const [photoMeta, setPhotoMeta] = useState({ ready: false, aspect: "portrait", ratio: .75, frameRatio: .70 });

  const handlePhotoLoad = (event) => {
    const width = event.currentTarget?.naturalWidth || 0;
    const height = event.currentTarget?.naturalHeight || 0;
    const ratio = width > 0 && height > 0 ? width / height : .75;
    const aspect = ratio < .90 ? "portrait" : ratio > 1.25 ? "landscape" : "balanced";
    const frameRatio = Math.max(.66, Math.min(.86, ratio * .92));
    setPhotoMeta({ ready: true, aspect, ratio, frameRatio });
  };

  return (
    <Card
      className="portrait-card island-card profile-ios-card profile-photo-widget"
      radius="xl"
      data-photo-ready={photoMeta.ready ? "true" : "false"}
      data-photo-aspect={photoMeta.aspect}
      style={{
        "--profile-photo-source-ratio": photoMeta.ratio,
        "--profile-photo-frame-ratio": photoMeta.frameRatio,
      }}
    >
      <ProfileMotionField />
      <div className="profile-portrait-aura" aria-hidden="true" />
      {profile?.profileImageUrl ? (
        <PreviewableImage
          src={profile.profileImageUrl}
          alt={fullName}
          className="portrait-preview-trigger"
          imageClassName="portrait-image"
          modalTitle={`${t("nav.profile")} — ${fullName}`}
          loading="eager"
          fetchPriority="high"
          onImageLoad={handlePhotoLoad}
          sizes="(max-width: 780px) 70vw, 320px"
        />
      ) : <div className="portrait-placeholder">{getInitials(owner)}</div>}
      <div
        className="portrait-content profile-owner-nameplate"
        data-owner-first-name={identity.firstName || undefined}
        data-owner-name={identity.lastName || undefined}
      >
        <span className="portrait-name">{fullName}</span>
      </div>
    </Card>
  );
}

function ProfileAvailabilityCard({ profile, t }) {
  const availability = profile?.availability || t("hero.openOpportunities");
  const location = profile?.location;
  return (
    <Card className="availability-card island-card profile-ios-card profile-availability-widget" radius="xl" data-profile-field="prof.availability">
      <ProfileMotionField />
      <span className="profile-availability-icon" aria-hidden="true"><ProfileIcon name="availability" size={32} /></span>
      <div className="profile-availability-copy">
        <Text className="profile-availability-status">{availability}</Text>
        {location && <Text className="profile-availability-location"><ProfileIcon name="pin" size={13} />{location}</Text>}
      </div>
    </Card>
  );
}

function contactIcon(type) {
  if (type === "EMAIL") return "mail";
  if (type === "PHONE_NUMBER") return "phone";
  if (type === "GITHUB") return "github";
  if (type === "LINKEDIN") return "linkedin";
  return "check";
}

function ContactRow({ contact, t }) {
  const label = t(`contact.${contact.type}`, { fallback: contact.type });
  const external = contact.type !== "EMAIL" && contact.type !== "PHONE_NUMBER";
  return (
    <Anchor
      href={getContactHref(contact)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="profile-ios-contact-row"
      data-contact-type={contact.type}
    >
      <span className="profile-ios-contact-icon"><ProfileIcon name={contactIcon(contact.type)} size={18} /></span>
      <span className="profile-ios-contact-copy"><small>{label}</small><strong>{contact.value}</strong></span>
      <span className="profile-ios-disclosure" aria-hidden="true">{external ? "↗" : "›"}</span>
    </Anchor>
  );
}

function ProfileDisciplineWidget({ item, t }) {
  return (
    <article className={`profile-skill-widget profile-skill-widget--${item.key}`} data-profile-discipline={item.key}>
      <span className="profile-skill-widget-shade" aria-hidden="true" />
      <span className="profile-skill-widget-orbit" aria-hidden="true" />
      <span className="profile-skill-widget-icon"><ProfileIcon name={item.icon} size={34} /></span>
      <span className="profile-skill-widget-label">{t(`hero.skill.${item.key}`, { fallback: item.label })}</span>
    </article>
  );
}

export default function ProfileHero({ owner, prof }) {
  const rootRef = useRef(null);
  const { localizedPath, t } = useLanguage();
  const fullName = getOwnerFullName(owner);
  const contacts = owner?.contacts ?? [];
  const email = getPrimaryContact(owner, "EMAIL");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");
  const profileModel = useMemo(
    () => resolveProfileViewModel(prof),
    [prof],
  );

  useGsap(rootRef, (gsap) => {
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline
      .from(".profile-island .hero-copy", { autoAlpha: 0, y: 24, duration: 0.68 })
      .from(".hero-title-main, .profile-headline-card, .profile-skill-widget, .hero-actions .mantine-Button-root", { autoAlpha: 0, y: 16, stagger: 0.045, duration: 0.42 }, "-=0.42")
      .from(".hero-panel > *", { autoAlpha: 0, y: 18, stagger: 0.07, duration: 0.46 }, "-=0.32");
  }, [fullName], { needsScrollTrigger: false });

  return (
    <section ref={rootRef} id="profile" className="hero-grid island-section profile-island profile-ios-ocean">
      <div className="hero-copy profile-ios-main">
        <AnimatedTitle title={profileModel.title || fullName} />

        {profileModel.headline && (
          <VisibilityGate item="home.profile.headline">
            <article className="profile-sub-card profile-headline-card profile-ios-positioning">
              <p className="profile-sub-card-text">{profileModel.headline}</p>
            </article>
          </VisibilityGate>
        )}

        <div className="profile-ios-skill-grid profile-discipline-grid" data-profile-source="static-disciplines" aria-label={t("skills.title")}>
          {PROFILE_VISUAL_CATEGORIES.map((item) => <ProfileDisciplineWidget key={item.key} item={item} t={t} />)}
        </div>

        {profileModel.description && (
          <VisibilityGate item="home.profile.lead">
            <article className="profile-ios-note" data-profile-field="prof.description">
              {profileModel.shortDescription && (
                <Text className="profile-ios-note-summary" data-profile-field="prof.shortDescription">{profileModel.shortDescription}</Text>
              )}
              <Text className="hero-lead">{profileModel.description}</Text>
            </article>
          </VisibilityGate>
        )}

        <Group className="hero-actions profile-ios-actions">
          {profileModel.cvUrl && profileModel.cvUrl !== "#" && (
            <Button component="a" href={localizedPath("/cv")} target="_blank" rel="noreferrer" radius="xl" className="primary-action profile-ios-action profile-ios-action--primary" leftSection={<ProfileIcon name="cv" size={17} />}>
              {t("hero.viewCv")}
            </Button>
          )}
          {email && (
            <Button component="a" href={getContactHref(email)} radius="xl" className="primary-action profile-ios-action" leftSection={<ProfileIcon name="mail" size={17} />}>
              {t("hero.contact")}
            </Button>
          )}
          {linkedin && (
            <Button component="a" href={getContactHref(linkedin)} target="_blank" rel="noreferrer" radius="xl" variant="outline" className="secondary-action profile-ios-action" leftSection={<ProfileIcon name="linkedin" size={17} />}>
              LinkedIn
            </Button>
          )}
          <Button component="a" href={localizedPath("/recruiter")} radius="xl" variant="outline" className="secondary-action profile-ios-action">
            {t("hero.recruiterView")}
          </Button>
        </Group>
      </div>

      <VisibilityGate item="home.profile.panel">
        <aside className="hero-panel profile-ios-panel">
          <div className="profile-ios-side-grid profile-identity-dock" data-profile-module="identity-dock">
            <ProfilePhotoCard owner={owner} profile={profileModel} t={t} />
            <ProfileAvailabilityCard profile={profileModel} t={t} />
            {contacts.length > 0 && (
              <Card id="contact" className="contact-card island-card profile-ios-card profile-contacts-widget" radius="xl">
                <ProfileMotionField />
                <div className="profile-ios-section-heading">
                  <div className="profile-ios-section-heading-main">
                    <span className="profile-contacts-hero-icon" aria-hidden="true"><ProfileIcon name="contactHub" size={29} /></span>
                    <Text className="card-kicker">{t("hero.contacts")}</Text>
                  </div>
                </div>
                <div className="profile-ios-contact-list">
                  {contacts.map((contact) => <ContactRow key={`${contact.type}-${contact.value}`} contact={contact} t={t} />)}
                </div>
              </Card>
            )}
          </div>
        </aside>
      </VisibilityGate>
    </section>
  );
}
