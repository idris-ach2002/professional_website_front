import { Anchor } from "@mantine/core";
import { useState } from "react";

function NavIcon({ type }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  if (type === "timeline") {
    return (
      <svg {...commonProps}>
        <path d="M6.25 5.5h11.5" />
        <path d="M6.25 12h11.5" />
        <path d="M6.25 18.5h11.5" />
        <circle cx="7" cy="5.5" r="1.75" />
        <circle cx="17" cy="12" r="1.75" />
        <circle cx="7" cy="18.5" r="1.75" />
        <path d="M8.7 6.2c3.45 1.3 5.5 3.05 6.55 5" />
        <path d="M15.35 12.95c-1.1 2.15-3.25 3.75-6.45 4.8" />
      </svg>
    );
  }

  if (type === "projects") {
    return (
      <svg {...commonProps}>
        <path d="M12 3.8 19.1 7.9v8.2L12 20.2l-7.1-4.1V7.9L12 3.8Z" />
        <path d="M12 12.05V20" />
        <path d="m4.9 7.9 7.1 4.15 7.1-4.15" />
        <path d="M8.35 10.05 15.7 5.8" />
        <path d="m15.65 10.05-7.3-4.25" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4.7 10.9 12 5.25l7.3 5.65" />
      <path d="M6.6 10.35v8.2h10.8v-8.2" />
      <path d="M9.55 18.55v-5.2h4.9v5.2" />
      <path d="M4.7 18.55h14.6" />
    </svg>
  );
}

function getIconType(href) {
  if (href?.includes("timeline")) return "timeline";
  if (href?.includes("projects")) return "projects";
  return "profile";
}

export default function NavSonarLinks({ links, activeHref, onLinkClick }) {
  const activeIndex = Math.max(0, links.findIndex((link) => link.href === activeHref));
  const [hoverIndex, setHoverIndex] = useState(null);

  const hoverVisible = hoverIndex !== null;
  const interactionIndex = hoverIndex ?? activeIndex;

  return (
    <nav
      className={`sonar-nav sonar-nav--dock${hoverVisible ? " is-hovering" : ""}`}
      aria-label="Navigation principale"
      style={{
        "--dock-active-index": interactionIndex,
        "--dock-preview-index": interactionIndex,
        "--dock-preview-opacity": 0,
        "--dock-capsule-opacity": hoverVisible ? 1 : 0,
        "--dock-rail-index": interactionIndex,
        "--dock-rail-opacity": hoverVisible ? 1 : 0,
        "--dock-count": links.length,
      }}
      onMouseLeave={() => setHoverIndex(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHoverIndex(null);
      }}
    >
      <span className="dock-hover-surface" aria-hidden="true" />
      <span className="dock-active-surface" aria-hidden="true" />
      <span className="dock-active-rail" aria-hidden="true" />

      {links.map((link, index) => {
        const active = link.href === activeHref;

        return (
          <Anchor
            key={link.href}
            href={link.href}
            className={`nav-link sonar-nav-link dock-nav-link${active ? " is-active" : ""}`}
            data-active={active ? "true" : "false"}
            data-preview="false"
            style={{ "--dock-index": index }}
            onMouseEnter={() => setHoverIndex(index)}
            onFocus={() => setHoverIndex(index)}
            onClick={onLinkClick}
          >
            <span className="dock-icon-wrap" aria-hidden="true">
              <NavIcon type={getIconType(link.href)} />
            </span>
            <span className="dock-link-label">{link.label}</span>
          </Anchor>
        );
      })}
    </nav>
  );
}
