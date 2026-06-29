import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getOwnerFullName,
  getPrimaryContact,
  getProjectSlug,
  getPublicProjects,
  normalizeUrl,
  slugify,
  sortByDisplayOrder,
} from "../utils/portfolio";

const NAV_LOGO_SRC = "/assets/identity/idris-navbar-logo.png";

const FALLBACK_PROJECT_ITEMS = [
  { label: "Portfolio full stack", description: "Front React, backend Spring Boot et données PostgreSQL", href: "#projects", icon: "code", badge: "CASE" },
  { label: "Pipeline AIS", description: "Collecte, stockage et exploitation de données AIS", href: "#projects", icon: "server" },
  { label: "Huffman dynamique", description: "Compression, bitstream I/O et visualisation", href: "#projects", icon: "algorithm" },
  { label: "DLP / ILP", description: "Interpréteur Java, ANTLR et compilation vers C", href: "#projects", icon: "compiler" },
];

const FALLBACK_SKILL_ITEMS = [
  { label: "Compétences", description: "Savoir-faire reliés aux projets réels", href: "#skills", icon: "proof" },
  { label: "Backend", description: "Java, Spring Boot, API REST, PostgreSQL", href: "#skills", icon: "server" },
  { label: "Frontend", description: "React, Vite, UI produit et interactions", href: "#skills", icon: "frontend" },
  { label: "Data & pipelines", description: "Flux de données, stockage et exploitation", href: "#skills", icon: "data" },
];

function splitLetters(label) {
  return String(label).split("").map((char, index) => (
    <span key={`${char}-${index}`} aria-hidden="true">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
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

function buildMenuGroups(owner) {
  const profile = owner?.prof ?? owner?.profile ?? {};
  const github = getContactValue(owner, "GITHUB");
  const linkedin = getContactValue(owner, "LINKEDIN");
  const cvUrl = profile?.cvUrl;
  const experiences = sortByDisplayOrder(owner?.timeline?.experiences ?? owner?.experiences ?? []);
  const projects = getPublicProjects(sortByDisplayOrder(owner?.projects ?? []));
  const provenSkills = Array.isArray(owner?.provenSkills) ? owner.provenSkills : [];

  const experienceItems = experiences.slice(0, 5).map((experience, index) => ({
    label: experience?.organization || experience?.title || `Expérience ${index + 1}`,
    description: experience?.title || experience?.summary || "Voir cette expérience dans la timeline",
    href: `#${getExperienceAnchor(experience, index)}`,
    icon: String(experience?.category).toUpperCase() === "SCHOOL" ? "school" : String(experience?.category).toUpperCase() === "INTERNSHIP" ? "lab" : "briefcase",
    badge: experience?.currentPosition ? "ACTUEL" : undefined,
  }));

  const projectItems = projects.slice(0, 5).map((project, index) => ({
    label: project?.title || `Projet ${index + 1}`,
    description: project?.subtitle || project?.shortDescription || project?.description || "Voir l'étude de cas du projet",
    href: `/projects/${getProjectSlug(project)}`,
    icon: getProjectIcon(project, index),
    badge: index === 0 ? "CASE" : undefined,
  }));

  const skillItems = provenSkills.slice(0, 4).map((skill, index) => ({
    label: skill?.label || skill?.title || skill?.name || `Compétence ${index + 1}`,
    description: skill?.summary || skill?.description || "Compétence reliée à des projets concrets",
    href: "#skills",
    icon: ["proof", "server", "frontend", "data"][index] ?? "proof",
    badge: index === 0 ? "PROOF" : undefined,
  }));

  return [
    {
      label: "Profil",
      href: "#profile",
      layout: "single",
      sections: [
        {
          eyebrow: "PROFIL PUBLIC",
          items: [
            { label: "LinkedIn", description: "Parcours, réseau professionnel et profil recruteur", href: linkedin || "linkedin", icon: "linkedin" },
            { label: "CV", description: "Télécharger la version PDF du CV", href: cvUrl || "cv", icon: "document", badge: "PDF" },
            { label: "GitHub", description: "Dépôts publics, code et preuves techniques", href: github || "github", icon: "github" },
          ],
        },
      ],
    },
    {
      label: "Parcours",
      href: "#timeline",
      layout: "single",
      sections: [
        {
          eyebrow: "EXPÉRIENCES",
          items: [
            { label: "Timeline complète", description: "Formation, stage et expériences clés", href: "#timeline", icon: "timeline" },
            ...(experienceItems.length > 0 ? experienceItems : [
              { label: "Sorbonne Université", description: "Master Informatique · STL", href: "#timeline", icon: "school" },
              { label: "Stage LITIS", description: "Pipeline AIS, Java, PostgreSQL, Symfony", href: "#timeline", icon: "lab" },
            ]),
          ],
        },
      ],
    },
    {
      label: "Projets",
      href: "#projects",
      layout: "wide",
      sections: [
        {
          eyebrow: "ÉTUDES DE CAS",
          items: projectItems.length > 0 ? projectItems : FALLBACK_PROJECT_ITEMS,
        },
        {
          eyebrow: "EXPLORER",
          items: [
            { label: "Showcase projets", description: "Vue globale de tous les projets publiés", href: "#projects", icon: "grid" },
            { label: "Réalisations marquantes", description: "Lien direct entre projets et savoir-faire", href: "#skills", icon: "proof" },
            { label: "GitHub global", description: "Tous les dépôts publics centralisés", href: github || "github", icon: "github" },
          ],
        },
      ],
    },
    {
      label: "Compétences",
      href: "#skills",
      layout: "wide align-right",
      sections: [
        {
          eyebrow: "",
          items: skillItems.length > 0 ? skillItems : FALLBACK_SKILL_ITEMS,
        },
        {
          eyebrow: "AXES TECHNIQUES",
          items: [
            { label: "Architecture", description: "Modularité, lisibilité et maintenabilité", icon: "architecture" },
            { label: "Fiabilité", description: "Tests, contraintes, erreurs et supervision", icon: "quality" },
            { label: "Produit", description: "Interfaces utiles, claires et orientées usage", icon: "product" },
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

function resolveItemHref(item, { isHomePath, profile, owner }) {
  if (item.href === "cv") return normalizeUrl(profile?.cvUrl || owner?.prof?.cvUrl || "#profile");
  if (item.href === "github") return normalizeUrl(getContactValue(owner, "GITHUB") || "#projects");
  if (item.href === "linkedin") return normalizeUrl(getContactValue(owner, "LINKEDIN") || "#profile");
  if (item.href === "email") {
    const email = getPrimaryContact(owner, "EMAIL")?.value;
    return email ? `mailto:${email}` : isHomePath ? "#profile" : "/#profile";
  }
  if (!item.href?.startsWith("#")) return normalizeUrl(item.href);
  return isHomePath ? item.href : `/${item.href}`;
}

function resolveSectionHref(href, isHomePath) {
  if (!href) return isHomePath ? "#top" : "/#top";
  if (!href.startsWith("#")) return href;
  return isHomePath ? href : `/${href}`;
}

function MegaMenuItem({ item, isHomePath, profile, owner, onNavigate }) {
  const href = resolveItemHref(item, { isHomePath, profile, owner });
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
          <span className="dropdown-link-text" aria-label={item.label}>{splitLetters(item.label)}</span>
          {item.badge ? <span className="dropdown-link-badge">{item.badge}</span> : null}
        </span>
        <span className="dropdown-link-description">{item.description}</span>
      </span>
    </a>
  );
}

function DesktopDropdown({ group, active, setActive, isHomePath, owner, profile }) {
  const open = active === group.label;
  const className = `nav_menu-dropdown-toggle-v2 w-dropdown ${group.layout ?? "single"}${open ? " is-open" : ""}`;

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
        href={resolveSectionHref(group.href, isHomePath)}
        className="dropdown1_toggle v2 w-dropdown-toggle"
        aria-expanded={open}
        onClick={() => setActive(null)}
      >
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

function MobileMenu({ opened, groups, isHomePath, owner, profile, onClose }) {
  return (
    <div className={`nav_mobile-panel${opened ? " is-open" : ""}`}>
      {groups.map((group) => (
        <div className="nav_mobile-group" key={`mobile-${group.label}`}>
          <div className="nav_mobile-heading">{group.label}</div>
          {group.sections.flatMap((section) => section.items).map((item) => (
            <MegaMenuItem
              key={`mobile-${group.label}-${item.label}`}
              item={item}
              isHomePath={isHomePath}
              owner={owner}
              profile={profile}
              onNavigate={onClose}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TopNavigation({ owner }) {
  const location = useLocation();
  const [active, setActive] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHomePath = location.pathname === "/";
  const ownerName = getOwnerFullName(owner);
  const profile = owner?.prof ?? owner?.profile ?? {};
  const email = getPrimaryContact(owner, "EMAIL")?.value;
  const contactHref = isHomePath ? "#contact" : "/#contact";
  const cvHref = normalizeUrl(profile?.cvUrl || "#profile");

  const groups = useMemo(() => buildMenuGroups(owner), [owner]);

  return (
    <div className="nav_fixed nav_fixed--portfolio">
      <div className="nav_spacer v2 hide" />
      <div data-wf--navbar--variant="base" data-animation="default" data-collapse="medium" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" className="nav_component w-nav">
        <div className="nav_container-v2">
          <a href={isHomePath ? "#top" : "/"} className="nav_brand w-nav-brand" aria-label={`Accueil portfolio ${ownerName || "Idris ACHABOU"}`}>
            <img src={NAV_LOGO_SRC} alt={ownerName || "Idris ACHABOU"} className="nav_personal-logo" loading="eager" />
          </a>

          <nav role="navigation" className="nav_menu v2 w-nav-menu" aria-label="Navigation principale">
            <div className="nav_menu-wrapper grid v2">
              {groups.map((group) => (
                <DesktopDropdown
                  key={group.label}
                  group={group}
                  active={active}
                  setActive={setActive}
                  isHomePath={isHomePath}
                  owner={owner}
                  profile={profile}
                />
              ))}
              <a href={contactHref} className="nav_direct-link w-inline-block">Contact</a>
            </div>
          </nav>

          <div className="nav_actions-wrap">
            <a id="nav-download" href={cvHref} target={cvHref?.startsWith("http") ? "_blank" : undefined} rel={cvHref?.startsWith("http") ? "noreferrer" : undefined} className="nav_big-button button w-inline-block">
              <span>Télécharger le CV</span>
            </a>
          </div>

          <button
            type="button"
            className={`nav_button w-nav-button${mobileOpen ? " w--open" : ""}`}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="hamburger_12_line" />
            <span className="hamburger_12_line" />
          </button>

          <MobileMenu
            opened={mobileOpen}
            groups={groups}
            isHomePath={isHomePath}
            owner={owner}
            profile={profile}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
