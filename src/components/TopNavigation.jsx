import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocation,
} from "react-router-dom";
import useLanguage from "../localization/useLanguage";
import "../styles/navigation/premium-navigation-v2.css";
import AnimationPreferences from "./AnimationPreferences";
import CommandUtilities from "./navigation/CommandUtilities";
import usePremiumNavigationMotion from "./navigation/usePremiumNavigationMotion";
import usePremiumNavigationShellMotion from "./navigation/usePremiumNavigationShellMotion";
import SignatureCanvas from "./navigation/SignatureCanvas";
import { useItemVisibility } from "../visibility/useItemVisibility";
import {
  getOwnerFullName,
  getProjectSlug,
  getPublicProjects,
  normalizeUrl,
  slugify,
  sortByDisplayOrder,
} from "../utils/portfolio";

const NAV_LOGO_SRC = "/assets/identity/idris-navbar-logo.png";
const MOBILE_DOCK_QUERY = "(max-width: 1240px), (hover: none) and (pointer: coarse) and (max-width: 1366px)";

function readMediaQuery(query) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function useNavigationMedia(query) {
  const [matches, setMatches] = useState(() => readMediaQuery(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    media.addEventListener?.("change", update);

    return () => media.removeEventListener?.("change", update);
  }, [query]);

  return matches;
}


function getFallbackProjectItems(t) {
  return [
    { label: "Portfolio full stack", description: t("nav.projectShowcaseDescription"), href: "#projects", icon: "code" },
    { label: "Pipeline AIS", description: "AIS collection, storage and processing", href: "#projects", icon: "server" },
    { label: "Adaptive Huffman", description: "Compression, bitstream I/O and visualization", href: "#projects", icon: "algorithm" },
    { label: "DLP / ILP", description: "Java interpreter, ANTLR and C compilation", href: "#projects", icon: "compiler" },
  ];
}

function getFallbackSkillItems(t) {
  return [
    { label: t("nav.skills"), description: t("skills.description"), href: "#skills", icon: "proof" },
    { label: "Backend", description: "Java, Spring Boot, REST APIs, PostgreSQL", href: "#skills", icon: "server" },
    { label: "Frontend", description: "React, Vite, product UI and interactions", href: "#skills", icon: "frontend" },
    { label: "Data & pipelines", description: "Data streams, storage and processing", href: "#skills", icon: "data" },
  ];
}

function getContactValue(owner, type) {
  return (owner?.contacts ?? []).find((contact) => String(contact.type).toUpperCase() === type)?.value;
}

function getExperienceAnchor(experience, index) {
  const source = [experience?.title, experience?.organization].filter(Boolean).join(" ") || `experience-${index + 1}`;
  return `experience-${slugify(source)}-${index}`;
}

function getProjectIcon(project, index) {
  const text = `${project?.title ?? ""} ${project?.subtitle ?? ""}`.toLowerCase();
  if (text.includes("ais") || text.includes("pipeline") || text.includes("data")) return "server";
  if (text.includes("huffman") || text.includes("algo")) return "algorithm";
  if (text.includes("dlp") || text.includes("ilp") || text.includes("compil")) return "compiler";
  if (text.includes("squadro") || text.includes("game") || text.includes("jeu")) return "game";
  if (text.includes("graph")) return "architecture";
  return index === 0 ? "code" : "case";
}

function buildMenuGroups(owner, t, localizedPath) {
  const profile = owner?.prof ?? owner?.profile ?? {};
  const github = getContactValue(owner, "GITHUB");
  const linkedin = getContactValue(owner, "LINKEDIN");
  const cvUrl = profile?.cvUrl;
  const experiences = sortByDisplayOrder(owner?.timeline?.experiences ?? owner?.experiences ?? []);
  const projects = getPublicProjects(sortByDisplayOrder(owner?.projects ?? []));
  const provenSkills = Array.isArray(owner?.provenSkills) ? owner.provenSkills : [];

  const experienceItems = experiences.slice(0, 4).map((experience, index) => ({
    label: experience?.organization || experience?.title || `${t("nav.journey")} ${index + 1}`,
    description: experience?.title || experience?.summary || t("nav.viewExperience"),
    href: `#${getExperienceAnchor(experience, index)}`,
    icon: String(experience?.category).toUpperCase() === "SCHOOL" ? "school" : String(experience?.category).toUpperCase() === "INTERNSHIP" ? "lab" : "briefcase",
    badge: experience?.currentPosition ? t("nav.current") : undefined,
  }));

  const projectItems = projects.slice(0, 4).map((project, index) => ({
    label: project?.title || `${t("projects.project")} ${index + 1}`,
    description: project?.subtitle || project?.shortDescription || project?.description || t("nav.viewCaseStudy"),
    href: localizedPath(`/projects/${getProjectSlug(project)}`),
    icon: getProjectIcon(project, index),

  }));

  const skillItems = provenSkills.slice(0, 4).map((skill, index) => ({
    label: skill?.label || skill?.title || skill?.name || `${t("nav.skills")} ${index + 1}`,
    description: skill?.summary || skill?.description || t("nav.provenSkill"),
    href: "#skills",
    icon: ["proof", "server", "frontend", "data"][index] ?? "proof",

  }));

  return [
    {
      label: t("nav.profile"),
      icon: "profile",
      visibilityKey: "global.navbar.profile",
      href: "#profile",
      layout: "single",
      sections: [
        {
          eyebrow: t("nav.publicProfile"),
          items: [
            { label: "LinkedIn", description: t("nav.linkedinDescription"), href: linkedin || "linkedin", icon: "linkedin" },
            { label: "CV", description: t("nav.cvDescription"), href: cvUrl || "cv", icon: "document", badge: "PDF" },
            { label: "GitHub", description: t("nav.githubDescription"), href: github || "github", icon: "github" },
          ],
        },
      ],
    },
    {
      label: t("nav.journey"),
      icon: "briefcase",
      visibilityKey: "global.navbar.journey",
      href: "#timeline",
      layout: "single",
      sections: [
        {
          eyebrow: t("nav.experiences"),
          items: [
            { label: t("nav.fullTimeline"), description: t("nav.fullTimelineDescription"), href: "#timeline", icon: "timeline" },
            ...(experienceItems.length > 0 ? experienceItems : [
              { label: "Sorbonne Université", description: "Master Informatique · STL", href: "#timeline", icon: "school" },
              { label: "Stage LITIS", description: "Pipeline AIS, Java, PostgreSQL, Symfony", href: "#timeline", icon: "lab" },
            ]),
          ],
        },
      ],
    },
    {
      label: t("nav.projects"),
      icon: "grid",
      visibilityKey: "global.navbar.projects",
      href: "#projects",
      layout: "wide",
      sections: [
        {
          eyebrow: t("nav.caseStudies"),
          items: projectItems.length > 0 ? projectItems : getFallbackProjectItems(t),
        },
        {
          eyebrow: t("nav.explore"),
          items: [
            { label: t("nav.projectShowcase"), description: t("nav.projectShowcaseDescription"), href: "#projects", icon: "grid" },
            { label: t("nav.keyWork"), description: t("nav.keyWorkDescription"), href: "#skills", icon: "proof" },
            { label: t("nav.globalGithub"), description: t("nav.globalGithubDescription"), href: github || "github", icon: "github" },
          ],
        },
      ],
    },
    {
      label: t("nav.skills"),
      icon: "expertise",
      visibilityKey: "global.navbar.skills",
      href: "#skills",
      layout: "wide align-right",
      sections: [
        {
          eyebrow: "",
          items: skillItems.length > 0 ? skillItems : getFallbackSkillItems(t),
        },
        {
          eyebrow: t("nav.technicalAxes"),
          items: [
            { label: t("nav.architecture"), description: t("nav.architectureDescription"), icon: "architecture" },
            { label: t("nav.reliability"), description: t("nav.reliabilityDescription"), icon: "quality" },
            { label: t("nav.product"), description: t("nav.productDescription"), icon: "product" },
          ],
        },
      ],
    },
    {
      label: t("nav.engineering"),
      icon: "architecture",
      visibilityKey: "global.navbar.architecture",
      href: "/engineering",
      layout: "single align-right",
      sections: [
        {
          eyebrow: t("nav.observability"),
          items: [
            {
              label: t("nav.missionControl"),
              description: t("nav.missionControlDescription"),
              href: "/engineering",
              icon: "architecture",
            },
          ],
        },
      ],
    },
  ];
}

function Icon({ type }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  const paths = {
    profile: <path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm-7 7.3c1.35-3.15 3.78-4.72 7-4.72s5.65 1.57 7 4.72" />,
    linkedin: <path d="M6.4 9.7v8.1M6.4 6.2v.1M10.1 17.8v-8h3.2c2.1 0 3.4 1.35 3.4 3.8v4.2m-6.6-4.1c0-2.35 1.42-3.9 3.35-3.9" />,
    status: <path d="M5 12.4 9.2 16 19 6.8" />,
    email: <path d="M4.5 7.5h15v9h-15v-9Zm0 0 7.5 5.2 7.5-5.2" />,
    contact: <path d="M4.5 7.5h15v9h-15v-9Zm0 0 7.5 5.2 7.5-5.2" />,
    language: <path d="M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Zm0 0c2 2.1 3.05 4.7 3.05 7.8S14 17.7 12 19.8M12 4.2C10 6.3 8.95 8.9 8.95 12S10 17.7 12 19.8M4.6 9.4h14.8M4.6 14.6h14.8" />,
    document: <path d="M7 3.8h6.6L18 8.2v12H7V3.8Zm6.4 0v4.6H18M9.8 12.2h5.1M9.8 15.7h5.1" />,
    timeline: <path d="M12 4v16M7 7.2h10M7 12h10M7 16.8h10" />,
    school: <path d="M3.5 9 12 4.8 20.5 9 12 13.2 3.5 9Zm4 2.2v4.1c1.52 1.25 3 1.87 4.5 1.87s2.98-.62 4.5-1.87v-4.1" />,
    lab: <path d="M9 3.8h6M10.2 3.8v5.5l-4.7 8.1c-.78 1.35.2 3.05 1.76 3.05h9.48c1.56 0 2.54-1.7 1.76-3.05l-4.7-8.1V3.8" />,
    briefcase: <path d="M9.2 7.2V5.8c0-.9.72-1.6 1.6-1.6h2.4c.88 0 1.6.7 1.6 1.6v1.4M4.5 8h15v10.8h-15V8Zm0 4.6h15" />,
    grid: <path d="M5 5h5.5v5.5H5V5Zm8.5 0H19v5.5h-5.5V5ZM5 13.5h5.5V19H5v-5.5Zm8.5 0H19V19h-5.5v-5.5Z" />,
    case: <path d="M6.6 5.5h10.8c.95 0 1.7.75 1.7 1.7v9.6c0 .95-.75 1.7-1.7 1.7H6.6c-.95 0-1.7-.75-1.7-1.7V7.2c0-.95.75-1.7 1.7-1.7Zm2.2 4h6.4M8.8 13h4.4" />,
    code: <path d="m9.4 8-4 4 4 4M14.6 8l4 4-4 4M13.2 5.8l-2.4 12.4" />,
    github: <path d="M9.2 19.4c-3.1.95-3.1-1.55-4.35-1.86m8.7 3.16v-2.45c.04-.55-.14-1.1-.5-1.52 1.68-.2 3.45-.83 3.45-3.76a2.92 2.92 0 0 0-.8-2.02 2.74 2.74 0 0 0-.05-2.04s-.63-.2-2.1.78a7.18 7.18 0 0 0-3.83 0c-1.46-.98-2.1-.78-2.1-.78a2.74 2.74 0 0 0-.04 2.04 2.92 2.92 0 0 0-.8 2.04c0 2.9 1.76 3.55 3.44 3.76-.35.42-.54.96-.5 1.52v2.45" />,
    proof: <path d="M12 3.8 19.2 7v5.35c0 4.2-2.8 6.55-7.2 8-4.4-1.45-7.2-3.8-7.2-8V7L12 3.8Zm-3 8.35 2.1 2.1 4.1-4.45" />,
    expertise: <><path d="M12 3.6 18.4 7.2v7.3L12 18.4l-6.4-3.9V7.2L12 3.6Z" /><path d="m12 7.3 1.05 2.45 2.55 1.05-2.55 1.05L12 14.4l-1.05-2.55-2.55-1.05 2.55-1.05L12 7.3Z" /></>,
    more: <><circle cx="7" cy="7" r="1.4" /><circle cx="17" cy="7" r="1.4" /><circle cx="7" cy="17" r="1.4" /><circle cx="17" cy="17" r="1.4" /></>,
    server: <path d="M5.5 5.2h13v5.6h-13V5.2Zm0 8h13v5.6h-13v-5.6ZM8 8h.05M8 16h.05" />,
    frontend: <path d="M4.8 6.2h14.4v11.6H4.8V6.2Zm0 3.2h14.4M8.2 14l-1.4-1.4 1.4-1.4M15.8 11.2l1.4 1.4-1.4 1.4" />,
    quality: <path d="M12 4.2 14 9l5.2.4-4 3.4 1.25 5.05L12 15.15 7.55 17.85 8.8 12.8l-4-3.4L10 9l2-4.8Z" />,
    algorithm: <path d="M6 7.2h4.6M6 12h8.4M6 16.8h12M15.8 5.5l2.7 2.7-2.7 2.7" />,
    compiler: <path d="M5.2 5.8h13.6v12.4H5.2V5.8Zm3.2 3.3 2.1 2.1-2.1 2.1M12.2 14.1h3.4" />,
    game: <path d="M8.5 8.5h7M8.5 15.5h7M8.5 8.5v7M15.5 8.5v7M6.2 12h11.6M12 6.2v11.6" />,
    data: <path d="M12 4.7c3.6 0 6.5.92 6.5 2.05S15.6 8.8 12 8.8s-6.5-.92-6.5-2.05S8.4 4.7 12 4.7Zm-6.5 2.05v4.8c0 1.13 2.9 2.05 6.5 2.05s6.5-.92 6.5-2.05v-4.8m-13 4.8v4.7c0 1.13 2.9 2.05 6.5 2.05s6.5-.92 6.5-2.05v-4.7" />,
    architecture: <path d="M12 4.6 5.5 8.3v7.4l6.5 3.7 6.5-3.7V8.3L12 4.6Zm0 0v7.4m0 7.4V12m-6.5-3.7L12 12l6.5-3.7" />,
    product: <path d="M6.2 6.4h11.6v8.2H6.2V6.4Zm2.1 11.2h7.4M10.4 14.6v3M13.6 14.6v3" />,
  };

  return (
    <svg {...common} className="dropdown-link-icon-svg">
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {paths[type] ?? paths.profile}
      </g>
    </svg>
  );
}

function resolveItemHref(item, { isHomePath, profile, owner, localizedPath }) {
  if (item.href === "cv") return normalizeUrl(profile?.cvUrl || owner?.prof?.cvUrl || "#profile");
  if (item.href === "github") return normalizeUrl(getContactValue(owner, "GITHUB") || "#projects");
  if (item.href === "linkedin") return normalizeUrl(getContactValue(owner, "LINKEDIN") || "#profile");
  if (item.href === "email") {
    const email = getContactValue(owner, "EMAIL");
    return email ? `mailto:${email}` : isHomePath ? "#profile" : localizedPath("/#profile");
  }
  if (!item.href?.startsWith("#")) {
    return item.href?.startsWith("/") ? localizedPath(item.href) : normalizeUrl(item.href);
  }
  return isHomePath ? item.href : localizedPath(`/${item.href}`);
}

function resolveSectionHref(href, isHomePath, localizedPath) {
  if (!href) return isHomePath ? "#main-content" : localizedPath("/#main-content");
  if (!href.startsWith("#")) return href.startsWith("/") ? localizedPath(href) : href;
  return isHomePath ? href : localizedPath(`/${href}`);
}

function MegaMenuItem({ item, isHomePath, profile, owner, localizedPath, onNavigate }) {
  const href = resolveItemHref(item, { isHomePath, profile, owner, localizedPath });
  const isExternal = href?.startsWith("http") || href?.startsWith("mailto:") || href?.startsWith("tel:");

  return (
    <a
      nav-link={item.label.toLowerCase().replaceAll(" ", "_")}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className="dropdown-link w-inline-block"
      onClick={onNavigate}
    >
      <span className="dropdown-link-icon">
        <Icon type={item.icon} />
      </span>
      <span className="dropdown-link-copy">
        <span className="dropdown-link-title-row">
          <span className="dropdown-link-text">{item.label}</span>
          {item.badge ? <span className="dropdown-link-badge">{item.badge}</span> : null}
        </span>
        <span className="dropdown-link-description">{item.description}</span>
      </span>
    </a>
  );
}

function DesktopDropdown({ group, active, setActive, isHomePath, owner, profile, localizedPath, sectionActive }) {
  const open = active === group.label;
  const className = `nav_menu-dropdown-toggle-v2 w-dropdown ${group.layout ?? "single"}${open ? " is-open" : ""}${sectionActive ? " is-section-active" : ""}`;

  return (
    <div
      data-delay="200"
      data-hover="true"
      className={className}
      onMouseEnter={() => setActive(group.label)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(group.label)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setActive(null);
        }
      }}
    >
      <a
        href={resolveSectionHref(group.href, isHomePath, localizedPath)}
        className="dropdown1_toggle v2 w-dropdown-toggle"
        data-nav-primary
        data-nav-section={group.label}
        aria-expanded={open}
        onClick={() => setActive(null)}
      >
        <span className="nav_primary-icon"><Icon type={group.icon} /></span>
        <span>{group.label}</span>
        <svg viewBox="0 0 16 16" className="nav_menu-dropdown-arrow" aria-hidden="true">
          <path d="M4.4 6.2 8 9.8l3.6-3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <nav className="dropdown-list-v2 w-dropdown-list" aria-label={group.label}>
        <div className="dropdown-inside-wrap">
          <div className="dropdown-wrap">
            {group.sections.map((section, sectionIndex) => (
              <div className="dropdown-column" key={`${group.label}-${section.eyebrow}`}>
                <div className="dropdown-list-heading hide-tablet">{section.eyebrow}</div>
                {section.items.map((item) => (
                  <MegaMenuItem
                    key={`${group.label}-${section.eyebrow}-${item.label}`}
                    item={item}
                    isHomePath={isHomePath}
                    owner={owner}
                    profile={profile}
                    localizedPath={localizedPath}
                    onNavigate={() => setActive(null)}
                  />
                ))}
                {sectionIndex < group.sections.length - 1 ? <span className="dropdown-column-rule" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

function MobileSheetHeader({ icon, title, eyebrow, onClose, actionHref, onAction }) {
  return (
    <header className={`nav_mobile-sheet-header${actionHref ? " has-action" : ""}`}>
      <span className="nav_mobile-sheet-heading-icon"><Icon type={icon} /></span>
      <div className="nav_mobile-sheet-heading-copy">
        {eyebrow ? <small>{eyebrow}</small> : null}
        <strong>{title}</strong>
      </div>
      {actionHref ? (
        <a className="nav_mobile-sheet-open" href={actionHref} onClick={onAction} aria-label={`Ouvrir ${title}`}>
          <span aria-hidden="true">↗</span>
        </a>
      ) : null}
      <button type="button" className="nav_mobile-sheet-close" onClick={onClose} aria-label="Fermer">×</button>
    </header>
  );
}

function MobileGroupSheet({ group, isHomePath, owner, profile, localizedPath, onClose, t }) {
  const sectionHref = resolveSectionHref(group.href, isHomePath, localizedPath);
  const normalizedGroupLabel = group.label.trim().toLocaleLowerCase();

  return (
    <>
      <MobileSheetHeader
        icon={group.icon}
        title={group.label}
        eyebrow={t("nav.mainLabel")}
        actionHref={sectionHref}
        onAction={onClose}
        onClose={onClose}
      />
      <div className="nav_mobile-sheet-sections">
        {group.sections.map((section) => {
          const compactItems = section.items.filter((item) => item.label?.trim().toLocaleLowerCase() !== normalizedGroupLabel);
          if (compactItems.length === 0) return null;
          return (
            <section className="nav_mobile-sheet-section" key={`${group.label}-${section.eyebrow || "main"}`}>
              {section.eyebrow ? <div className="nav_mobile-sheet-eyebrow">{section.eyebrow}</div> : null}
              <div className="nav_mobile-sheet-grid">
                {compactItems.map((item) => {
                  const href = item.href
                    ? resolveItemHref(item, { isHomePath, profile, owner, localizedPath })
                    : sectionHref;
                  const external = href?.startsWith("http") || href?.startsWith("mailto:") || href?.startsWith("tel:");
                  return (
                    <a
                      key={`${group.label}-${section.eyebrow}-${item.label}`}
                      className="nav_mobile-sheet-item"
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      onClick={onClose}
                    >
                      <span className="nav_mobile-sheet-item-icon"><Icon type={item.icon} /></span>
                      <span className="nav_mobile-sheet-item-label">{item.label}</span>
                      <span className="nav_mobile-sheet-item-trailing">
                        {item.badge ? <em>{item.badge}</em> : null}
                        <span className="nav_mobile-sheet-chevron" aria-hidden="true">›</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function MobileBottomNavigation({
  groups,
  activeSection,
  isHomePath,
  owner,
  profile,
  localizedPath,
  language,
  setLanguage,
  contactHref,
  emailHref,
  linkedinHref,
  recruiterHref,
  cvHref,
  isVisible,
  t,
}) {
  const [sheet, setSheet] = useState(null);
  const [shown, setShown] = useState(false);
  const moreLabel = language === "en" ? "More" : "Plus";
  const optionsLabel = language === "en" ? "Options" : "Options";
  const primaryHrefs = new Set(["#profile", "#timeline", "#projects", "/engineering"]);
  const primaryGroups = groups.filter((group) => primaryHrefs.has(group.href));
  const expertiseGroup = groups.find((group) => group.href === "#skills");
  const selectedGroup = groups.find((group) => sheet === `group:${group.href}`);
  const moreOwnsActiveSection = Boolean(expertiseGroup && activeSection === expertiseGroup.label);
  const moreSheetOpen = Boolean(shown && (sheet === "more" || sheet === "contact" || sheet === "options" || sheet === "cv" || sheet === "recruiter" || sheet === `group:${expertiseGroup?.href}`));
  const closeSheet=()=>{setShown(false);setSheet(null)};
  const openSheet=next=>sheet===next?closeSheet():(setShown(false),setSheet(next));
  const sheetDialogLabel = selectedGroup?.label
    || (sheet === "contact" ? t("nav.contact") : null)
    || (sheet === "options" ? optionsLabel : null)
    || (sheet === "cv" ? "CV" : null)
    || (sheet === "recruiter" ? t("nav.recruiter") : null)
    || moreLabel;

  const renderMore = () => (
    <>
      <MobileSheetHeader icon="more" title={language === "en" ? "More" : "Plus"} eyebrow={t("nav.mainLabel")} onClose={closeSheet} />
      <div className="nav_mobile-more-grid">
        {expertiseGroup ? (
          <button type="button" onClick={() => setSheet(`group:${expertiseGroup.href}`)}>
            <span><Icon type="expertise" /></span><strong>{expertiseGroup.label}</strong>
          </button>
        ) : null}
        {isVisible("global.navbar.contact") ? (
          <button type="button" onClick={() => setSheet("contact")}>
            <span><Icon type="contact" /></span><strong>{t("nav.contact")}</strong>
          </button>
        ) : null}
        <button type="button" onClick={() => setSheet("options")}>
          <span><Icon type="quality" /></span><strong>{optionsLabel}</strong>
        </button>
        {isVisible("global.navbar.cv") ? (
          <button type="button" onClick={() => setSheet("cv")}>
            <span><Icon type="document" /></span><strong>CV</strong>
          </button>
        ) : null}
        {isVisible("global.navbar.recruiter") ? (
          <button type="button" onClick={() => setSheet("recruiter")}>
            <span><Icon type="briefcase" /></span><strong>{t("nav.recruiter")}</strong>
          </button>
        ) : null}
      </div>
    </>
  );

  const renderContact = () => (
    <>
      <MobileSheetHeader icon="contact" title={t("nav.contact")} eyebrow={language === "en" ? "Shortcuts" : "Raccourcis"} onClose={closeSheet} />
      <div className="nav_mobile-sheet-grid is-actions">
        <a className="nav_mobile-sheet-item" href={emailHref} onClick={closeSheet}><span className="nav_mobile-sheet-item-icon"><Icon type="email" /></span><span className="nav_mobile-sheet-item-label">Email</span><span className="nav_mobile-sheet-chevron" aria-hidden="true">›</span></a>
        <a className="nav_mobile-sheet-item" href={linkedinHref} target={linkedinHref?.startsWith("http") ? "_blank" : undefined} rel={linkedinHref?.startsWith("http") ? "noreferrer" : undefined} onClick={closeSheet}><span className="nav_mobile-sheet-item-icon"><Icon type="linkedin" /></span><span className="nav_mobile-sheet-item-label">LinkedIn</span><span className="nav_mobile-sheet-chevron" aria-hidden="true">›</span></a>
        <a className="nav_mobile-sheet-item" href={contactHref} onClick={closeSheet}><span className="nav_mobile-sheet-item-icon"><Icon type="contact" /></span><span className="nav_mobile-sheet-item-label">{t("hero.contact")}</span><span className="nav_mobile-sheet-chevron" aria-hidden="true">›</span></a>
      </div>
    </>
  );

  const renderOptions = () => (
    <>
      <MobileSheetHeader icon="quality" title={optionsLabel} eyebrow={language === "en" ? "Preferences" : "Préférences"} onClose={closeSheet} />
      {isVisible("global.navbar.language") ? (
        <div className="nav_mobile-dock-language is-sheet" role="group" aria-label={t("language.selectorLabel", { fallback: "Langue" })}>
          <span><Icon type="language" /> {t("language.title")}</span>
          <button type="button" aria-pressed={language === "fr"} onClick={() => setLanguage("fr")}>FR</button>
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
        </div>
      ) : null}
      {isVisible("global.navbar.animations") ? <AnimationPreferences mobile /> : null}
    </>
  );

  const renderCv = () => (
    <>
      <MobileSheetHeader icon="document" title="CV" eyebrow={language === "en" ? "Document" : "Document"} onClose={closeSheet} />
      <a className="nav_mobile-cv-card" href={cvHref} target={cvHref?.startsWith("http") ? "_blank" : undefined} rel={cvHref?.startsWith("http") ? "noreferrer" : undefined} onClick={closeSheet}>
        <span><Icon type="document" /></span>
        <strong>{t("nav.downloadCv")}</strong>
        <em aria-hidden="true">↗</em>
      </a>
    </>
  );

  const renderRecruiter = () => (
    <>
      <MobileSheetHeader
        icon="briefcase"
        title={t("nav.recruiter")}
        eyebrow={language === "en" ? "Dedicated space" : "Espace dédié"}
        actionHref={recruiterHref}
        onAction={closeSheet}
        onClose={closeSheet}
      />
      <div className="nav_mobile-sheet-grid is-actions">
        <a className="nav_mobile-sheet-item" href={recruiterHref} onClick={closeSheet}>
          <span className="nav_mobile-sheet-item-icon"><Icon type="briefcase" /></span>
          <span className="nav_mobile-sheet-item-label">{language === "en" ? "Open workspace" : "Ouvrir l’espace"}</span>
          <span className="nav_mobile-sheet-chevron" aria-hidden="true">›</span>
        </a>
      </div>
    </>
  );

  useEffect(()=>{
    if(!sheet)return;
    const frame=requestAnimationFrame(()=>setShown(true));
    return()=>cancelAnimationFrame(frame);
  },[sheet]);

  useEffect(()=>{
    if(!sheet)return;
    const onKey=e=>e.key==="Escape"&&closeSheet();
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[sheet]);

  return (
    <div className="nav_mobile-dock-shell">
      <button type="button" className={`nav_mobile-sheet-backdrop${shown ? " is-open" : ""}`} aria-label="Fermer" tabIndex={shown ? 0 : -1} onClick={closeSheet} />
      <section className={`nav_mobile-dock-tools nav_mobile-command-sheet${shown ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!shown} inert={!shown ? true : undefined} aria-label={sheetDialogLabel}>
        {selectedGroup ? <MobileGroupSheet group={selectedGroup} isHomePath={isHomePath} owner={owner} profile={profile} localizedPath={localizedPath} onClose={closeSheet} t={t} /> : null}
        {!sheet || sheet === "more" ? renderMore() : null}
        {sheet === "contact" ? renderContact() : null}
        {sheet === "options" ? renderOptions() : null}
        {sheet === "cv" ? renderCv() : null}
        {sheet === "recruiter" ? renderRecruiter() : null}
      </section>

      <nav className="nav_mobile-dock" aria-label={t("nav.mainLabel")}>
        {primaryGroups.map((group) => {
          const pageActive = activeSection === group.label;
          const opened = sheet === `group:${group.href}`;
          return (
            <button
              key={`dock-${group.label}`}
              type="button"
              className={`nav_mobile-dock-link${pageActive || opened ? " is-active" : ""}`}
              aria-pressed={opened}
              onClick={() => openSheet(`group:${group.href}`)}
            >
              <span className="nav_mobile-dock-icon"><Icon type={group.icon} /></span>
              <span className="nav_mobile-dock-label">{group.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`nav_mobile-dock-link nav_mobile-dock-more${moreSheetOpen || moreOwnsActiveSection ? " is-active" : ""}`}
          aria-label={language === "en" ? "More options" : "Plus d’options"}
          aria-expanded={Boolean(sheet)}
          onClick={() => openSheet("more")}
        >
          <span className="nav_mobile-dock-icon"><Icon type="more" /></span>
          <span className="nav_mobile-dock-label">{moreLabel}</span>
        </button>
      </nav>
    </div>
  );
}

export default function TopNavigation({ owner }) {
  const mobileDockNavigation = useNavigationMedia(MOBILE_DOCK_QUERY);
  const { isVisible } = useItemVisibility();
  const { language, localizedPath, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [active, setActive] = useState(null);
  const [observedSection, setObservedSection] = useState(null);
  const desktopMenuRef = useRef(null);
  const desktopShellRef = useRef(null);
  const isHomePath = location.pathname === "/";
  const ownerName = getOwnerFullName(owner);
  const profile = owner?.prof ?? owner?.profile ?? {};
  const contactHref = isHomePath ? "#contact" : localizedPath("/#contact");
  const recruiterHref = localizedPath("/recruiter");
  const cvHref = normalizeUrl(profile?.cvUrl || "#profile");
  const emailValue = getContactValue(owner, "EMAIL");
  const emailHref = emailValue ? `mailto:${emailValue}` : contactHref;
  const linkedinHref = normalizeUrl(getContactValue(owner, "LINKEDIN") || "#profile");

  const groups = useMemo(() => buildMenuGroups(owner, t, localizedPath).filter((group) => isVisible(group.visibilityKey)), [isVisible, localizedPath, owner, t]);
  const routeSection = useMemo(() => {
    if (location.pathname.startsWith("/engineering")) return groups.find((group) => group.href === "/engineering")?.label ?? null;
    if (location.pathname.startsWith("/projects/")) return groups.find((group) => group.href === "#projects")?.label ?? null;
    return null;
  }, [groups, location.pathname]);
  const activeSection = routeSection ?? observedSection ?? groups[0]?.label ?? null;

  usePremiumNavigationMotion(desktopMenuRef, activeSection);
  usePremiumNavigationShellMotion(desktopShellRef);

  useEffect(() => {
    if (!isHomePath) return undefined;

    const sections = groups
      .filter((group) => group.href?.startsWith("#"))
      .map((group) => ({ group, element: document.querySelector(group.href) }))
      .filter(({ element }) => Boolean(element));

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = sections.find(({ element }) => element === visible.target);
      if (match) setObservedSection(match.group.label);
    }, { rootMargin: "-32% 0px -54% 0px", threshold: [0.01, 0.18, 0.42, 0.72] });

    sections.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [groups, isHomePath]);



  return (
    <div className={`nav_fixed nav_fixed--portfolio${mobileDockNavigation ? " is-mobile-dock-mode" : ""}`}>
      {!mobileDockNavigation && <div className="nav_spacer v2 hide" />}
      {!mobileDockNavigation && <div data-wf--navbar--variant="base" data-animation="default" data-collapse="medium" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" className="nav_component w-nav" ref={desktopShellRef}>
        <div className="nav_container-v2">
          <a href={isHomePath ? "#main-content" : localizedPath("/")} className="nav_brand nav_island nav_island--brand w-nav-brand" aria-label={`${t("notFound.home")} — ${ownerName || "Idris ACHABOU"}`} data-nav-zone="identity">
            <SignatureCanvas name={(ownerName || "Idris ACHABOU").split(" ")[0]} fallbackSrc={NAV_LOGO_SRC} />
          </a>

          <nav role="navigation" className="nav_menu v2 nav_island nav_island--core w-nav-menu" aria-label={t("nav.mainLabel")} data-nav-zone="navigation">
            <div className="nav_menu-wrapper grid v2" ref={desktopMenuRef}>
              <span className="nav_primary-lens" data-nav-lens aria-hidden="true" />
              {groups.map((group) => (
                <DesktopDropdown
                  key={group.label}
                  group={group}
                  active={active}
                  setActive={setActive}
                  isHomePath={isHomePath}
                  owner={owner}
                  profile={profile}
                  localizedPath={localizedPath}
                  sectionActive={activeSection === group.label}
                />
              ))}
            </div>
          </nav>

          <CommandUtilities
            active={active}
            setActive={setActive}
            contactHref={contactHref}
            emailHref={emailHref}
            linkedinHref={linkedinHref}
            recruiterHref={recruiterHref}
            cvHref={cvHref}
            language={language}
            setLanguage={setLanguage}
            isVisible={isVisible}
            t={t}
          />
        </div>
      </div>}
      {mobileDockNavigation && (
        <MobileBottomNavigation
          groups={groups}
          activeSection={activeSection}
          isHomePath={isHomePath}
          owner={owner}
          profile={profile}
          localizedPath={localizedPath}
          language={language}
          setLanguage={setLanguage}
          contactHref={contactHref}
          emailHref={emailHref}
          linkedinHref={linkedinHref}
          recruiterHref={recruiterHref}
          cvHref={cvHref}
          isVisible={isVisible}
          t={t}
        />
      )}
    </div>
  );
}
