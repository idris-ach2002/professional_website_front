import { Anchor, Button, Text } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";
import useLanguage from "../localization/useLanguage";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { PreviewableImage } from "./FilePreview";
import { VisibilityGate } from "../visibility/ItemVisibilityContext";
import {
  getContactHref,
  getInitials,
  getOwnerFullName,
  getPrimaryContact,
} from "../utils/portfolio";
import "../styles/sections/profile-arctic-ink.css";

const FALLBACK_TECHNOLOGIES = ["Java", "Spring Boot", "React", "PostgreSQL", "API REST", "Docker"];

const PROFILE_COMPACT_QUERY = "(max-width: 1240px)";

const DEFAULT_PROFILE_FRAME = Object.freeze({
  reflection: true,
  parallax: true,
  featherMotion: true,
  intensity: "elegant",
});

const PROFILE_PARALLAX_QUERY = "(min-width: 1241px) and (hover: hover) and (pointer: fine)";

function useCompactProfile() {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.(PROFILE_COMPACT_QUERY)?.matches));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(PROFILE_COMPACT_QUERY);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return compact;
}

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
  };

  if (name === "mail") return <svg {...common}><rect x="3.2" y="5.3" width="17.6" height="13.4" rx="3.1"/><path d="m4.8 7.2 7.2 5.7 7.2-5.7"/></svg>;
  if (name === "phone") return <svg {...common}><path d="M7.2 3.9 10 7.3 8.4 9.6c1.15 2.3 3.05 4.2 5.4 5.35l2.25-1.62 3.4 2.72c.48.38.57 1.07.22 1.57l-1.13 1.65c-.56.82-1.59 1.17-2.55.93C9.6 18.65 5.25 14.3 3.72 7.9c-.24-.96.1-1.99.93-2.55L6.3 4.22c.3-.2.62-.3.9-.32Z"/></svg>;
  if (name === "github") return <svg {...common}><path d="M8.3 19.1c-3.2 1-3.2-1.8-4.5-2.25M15.7 21v-3.45c0-1-.35-1.75-.9-2.25 3-.34 6.15-1.48 6.15-6.7 0-1.48-.52-2.7-1.4-3.65.14-.36.6-1.76-.14-3.6 0 0-1.14-.37-3.74 1.4A13 13 0 0 0 12 2.25a13 13 0 0 0-3.66.5C5.74.98 4.6 1.35 4.6 1.35c-.74 1.84-.28 3.24-.14 3.6-.88.95-1.4 2.17-1.4 3.65 0 5.2 3.15 6.36 6.15 6.7-.46.4-.8.98-.92 1.7-.82.37-2.9 1-4.18-1.2"/><path d="M8.3 17v4"/></svg>;
  if (name === "linkedin") return <svg {...common}><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2"/><path d="M8 10v6.8M8 7.35v.05M12 16.8V10M12 12.9c.55-1.95 4.2-2.2 4.2.9v3"/></svg>;
  if (name === "pin") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 17.5h.01M12 17.5h.01"/></svg>;
  if (name === "cv") return <svg {...common}><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h6M9 17h5"/></svg>;
  if (name === "send") return <svg {...common}><path d="m3.5 11.5 16-7-5.7 15-2.4-6-7.9-2Z"/><path d="m11.4 13.5 4.1-4.2"/></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="3.7"/><path d="M5.3 20c.85-4.1 3-6.15 6.7-6.15S17.85 15.9 18.7 20"/></svg>;
  if (name === "external") return <svg {...common}><path d="M13.5 5H19v5.5M11 13 19 5M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8"/><path d="m9.5 12 1.7 1.7 3.8-4"/></svg>;
}

function ArcticFeather({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 96 180" fill="none" aria-hidden="true">
      <path className="arctic-feather-stem" d="M19 165C41 126 55 86 70 18" />
      <path d="M66 24C48 28 32 42 24 60c16-4 28-11 38-23M60 43C43 49 29 61 20 78c16-2 29-8 37-19M54 62C38 68 25 80 17 97c15-3 27-9 34-19M48 83c-14 7-24 17-30 32 13-3 23-8 29-17M43 104c-12 7-20 16-25 28 11-2 19-7 24-14M39 122c-9 6-15 13-19 23 9-2 15-5 19-10M68 24c9 11 12 25 9 40-8-8-13-17-14-28M63 44c8 10 10 22 7 35-7-7-11-15-12-25M57 64c7 9 9 19 6 30-6-6-10-13-11-21M51 84c6 8 7 17 4 27-5-5-8-11-9-18M45 105c5 6 6 14 3 22-4-4-7-9-8-15" />
    </svg>
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
    cvUrl: text(source.cvUrl),
  };
}

function resolveTechnologies(subtitle) {
  const parsed = String(subtitle ?? "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^Java\s+\d+(?:\.\d+)?$/i, "Java"));
  const merged = [...parsed, "API REST", "Docker"];
  return [...new Set(merged.length > 2 ? merged : FALLBACK_TECHNOLOGIES)].slice(0, 6);
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
  const displayValue = contact.type === "GITHUB" || contact.type === "LINKEDIN"
    ? String(contact.value).replace(/^https?:\/\/(www\.)?[^/]+\//, "").replace(/\/$/, "")
    : contact.value;

  return (
    <Anchor
      href={getContactHref(contact)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="arctic-contact-row arctic-motion-item"
      data-contact-type={contact.type}
      aria-label={`${label}: ${displayValue}`}
    >
      <span className="arctic-contact-icon"><ProfileIcon name={contactIcon(contact.type)} size={18} /></span>
      <span className="arctic-contact-value">{displayValue}</span>
      {external && <span className="arctic-contact-external"><ProfileIcon name="external" size={14} /></span>}
    </Anchor>
  );
}

function ProfilePortrait({ owner, profile, t, motionMode, framePreferences = DEFAULT_PROFILE_FRAME }) {
  const identity = resolveOwnerIdentity(owner);
  const [ready, setReady] = useState(false);
  const frameRef = useRef(null);
  const intensity = framePreferences.intensity || "elegant";

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const reset = () => {
      frame.style.setProperty("--portrait-tilt-x", "0deg");
      frame.style.setProperty("--portrait-tilt-y", "0deg");
      frame.style.setProperty("--portrait-light-x", "50%");
      frame.style.setProperty("--portrait-light-y", "36%");
      frame.dataset.pointerActive = "false";
    };

    reset();
    if (motionMode !== "animated" || !framePreferences.parallax || typeof window === "undefined") return undefined;

    const media = window.matchMedia?.(PROFILE_PARALLAX_QUERY);
    if (!media?.matches) return undefined;

    const strength = intensity === "expressive" ? 1.28 : intensity === "subtle" ? 0.58 : 0.92;
    let animationFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const applyPointer = () => {
      animationFrame = 0;
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(-0.5, Math.min(0.5, (pointerX - rect.left) / rect.width - 0.5));
      const y = Math.max(-0.5, Math.min(0.5, (pointerY - rect.top) / rect.height - 0.5));
      frame.style.setProperty("--portrait-tilt-x", `${(-y * 1.05 * strength).toFixed(3)}deg`);
      frame.style.setProperty("--portrait-tilt-y", `${(x * 1.35 * strength).toFixed(3)}deg`);
      frame.style.setProperty("--portrait-light-x", `${((x + 0.5) * 100).toFixed(1)}%`);
      frame.style.setProperty("--portrait-light-y", `${((y + 0.5) * 100).toFixed(1)}%`);
      frame.dataset.pointerActive = "true";
    };

    const onPointerMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!animationFrame) animationFrame = window.requestAnimationFrame(applyPointer);
    };

    const onPointerLeave = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      reset();
    };

    frame.addEventListener("pointermove", onPointerMove, { passive: true });
    frame.addEventListener("pointerleave", onPointerLeave, { passive: true });
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      frame.removeEventListener("pointermove", onPointerMove);
      frame.removeEventListener("pointerleave", onPointerLeave);
      reset();
    };
  }, [framePreferences.parallax, intensity, motionMode]);

  return (
    <div
      ref={frameRef}
      className="arctic-portrait-frame arctic-motion-item"
      data-photo-ready={ready ? "true" : "false"}
      data-profile-reflection={framePreferences.reflection ? "true" : "false"}
      data-profile-parallax={framePreferences.parallax ? "true" : "false"}
      data-profile-feather-motion={framePreferences.featherMotion ? "true" : "false"}
      data-profile-frame-intensity={intensity}
      data-pointer-active="false"
    >
      <span className="arctic-portrait-specular" aria-hidden="true" />
      <span className="arctic-portrait-ring" aria-hidden="true" />
      <ArcticFeather className="arctic-portrait-feather" />
      {profile.profileImageUrl ? (
        <PreviewableImage
          src={profile.profileImageUrl}
          alt={identity.fullName}
          className="arctic-profile-photo-trigger"
          imageClassName="arctic-profile-photo"
          modalTitle={`${t("nav.profile")} — ${identity.fullName}`}
          loading="eager"
          fetchPriority="high"
          onImageLoad={() => setReady(true)}
          sizes="(max-width: 900px) 124px, 320px"
        />
      ) : (
        <div className="arctic-profile-placeholder">{getInitials(owner)}</div>
      )}
    </div>
  );
}

export default function ProfileHero({ owner, prof }) {
  const rootRef = useRef(null);
  const { localizedPath, t } = useLanguage();
  const animationPreferences = useAnimationPreferences();
  const effectiveProfileMotion = animationPreferences.effectiveProfileMotion;
  const profileFramePreferences = animationPreferences.scenePreferences?.profileFrame ?? DEFAULT_PROFILE_FRAME;
  const identity = resolveOwnerIdentity(owner);
  const contacts = owner?.contacts ?? [];
  const email = getPrimaryContact(owner, "EMAIL");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");
  const profile = useMemo(() => resolveProfileViewModel(prof), [prof]);
  const technologies = useMemo(() => resolveTechnologies(profile.subtitle), [profile.subtitle]);
  const compactProfile = useCompactProfile();

  useGsap(rootRef, (gsap) => {
    if (effectiveProfileMotion !== "animated") return undefined;
    const items = rootRef.current?.querySelectorAll(".arctic-motion-item");
    if (!items?.length) return undefined;
    gsap.from(items, {
      autoAlpha: 0,
      y: 18,
      duration: 0.52,
      stagger: 0.035,
      ease: "power3.out",
      clearProps: "transform,opacity,visibility",
    });
    return undefined;
  }, [identity.fullName, effectiveProfileMotion], { needsScrollTrigger: false, desktopOnly: true });

  return (
    <section ref={rootRef} id="profile" className="arctic-profile" data-profile-theme="arctic-ink" data-profile-motion={effectiveProfileMotion}>
      <ArcticFeather className="arctic-profile-feather arctic-profile-feather--left" />
      <ArcticFeather className="arctic-profile-feather arctic-profile-feather--bottom" />

      <div className="arctic-profile-main">
        <header className="arctic-profile-heading arctic-motion-item">
          <div className="arctic-profile-name" aria-label={identity.fullName}>
            <span>{identity.firstName || identity.fullName}</span>
            {identity.lastName && <strong>{identity.lastName}</strong>}
          </div>
          <h1 className="arctic-profile-role">{profile.title || identity.fullName}</h1>
          {profile.subtitle && <p className="arctic-profile-stackline">{profile.subtitle}</p>}
          <span className="arctic-profile-accent-line" aria-hidden="true" />
        </header>

        {compactProfile && (
          <div className="arctic-mobile-portrait">
            <ProfilePortrait owner={owner} profile={profile} t={t} motionMode={effectiveProfileMotion} framePreferences={profileFramePreferences} />
          </div>
        )}

        <div className="arctic-profile-meta arctic-motion-item">
          {profile.availability && (
            <div className="arctic-meta-pill arctic-meta-pill--availability">
              <ProfileIcon name="calendar" size={18} />
              <span>{profile.availability}</span>
            </div>
          )}
          {profile.location && (
            <div className="arctic-meta-pill">
              <ProfileIcon name="pin" size={18} />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

        {profile.headline && (
          <VisibilityGate item="home.profile.headline">
            <p className="arctic-profile-headline arctic-motion-item">{profile.headline}</p>
          </VisibilityGate>
        )}

        {profile.description && (
          <VisibilityGate item="home.profile.lead">
            <div className="arctic-profile-description arctic-motion-item" data-profile-field="prof.description">
              {profile.shortDescription && <Text className="arctic-profile-summary">{profile.shortDescription}</Text>}
              <Text>{profile.description}</Text>
            </div>
          </VisibilityGate>
        )}

        <div className="arctic-tech-grid arctic-motion-item" aria-label={t("skills.title")}>
          {technologies.map((technology) => <span key={technology} className="arctic-tech-chip">{technology}</span>)}
        </div>

        <div className="arctic-profile-actions arctic-motion-item">
          {profile.cvUrl && profile.cvUrl !== "#" && (
            <Button component="a" href={localizedPath("/cv")} target="_blank" rel="noreferrer" className="arctic-action arctic-action--primary" leftSection={<ProfileIcon name="cv" size={19} />}>
              {t("hero.viewCv")}
            </Button>
          )}
          {email && (
            <Button component="a" href={getContactHref(email)} className="arctic-action" leftSection={<ProfileIcon name="send" size={19} />}>
              {t("hero.contact")}
            </Button>
          )}
          {linkedin && (
            <Button component="a" href={getContactHref(linkedin)} target="_blank" rel="noreferrer" className="arctic-action" leftSection={<ProfileIcon name="linkedin" size={18} />}>
              LinkedIn
            </Button>
          )}
          <Button component="a" href={localizedPath("/recruiter")} className="arctic-action" leftSection={<ProfileIcon name="user" size={19} />}>
            {t("hero.recruiterView")}
          </Button>
        </div>
      </div>

      <VisibilityGate item="home.profile.panel">
        <aside className="arctic-profile-aside profile-identity-dock" data-profile-module="identity-dock">
          {!compactProfile && (
            <div className="arctic-desktop-portrait">
              <ProfilePortrait owner={owner} profile={profile} t={t} motionMode={effectiveProfileMotion} framePreferences={profileFramePreferences} />
            </div>
          )}
          {contacts.length > 0 && (
            <div id="contact" className="arctic-contact-card arctic-motion-item">
              {contacts.map((contact) => <ContactRow key={`${contact.type}-${contact.value}`} contact={contact} t={t} />)}
            </div>
          )}
        </aside>
      </VisibilityGate>
    </section>
  );
}
