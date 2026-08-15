import { useMemo, useState } from "react";
import "../styles/components/organization-brand.css";

const BRAND_RULES = [
  {
    key: "sorbonne-universite",
    match: /sorbonne\s+universit[eé]/i,
    label: "Sorbonne Université",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_of_Sorbonne_University.svg",
    fallbackUrl: "https://www.google.com/s2/favicons?domain=sorbonne-universite.fr&sz=128",
  },
  {
    key: "la-belle-vie-deleev",
    match: /la\s+belle\s+vie|deleev/i,
    label: "La Belle Vie / Deleev",
    logoUrl: "https://www.google.com/s2/favicons?domain=labellevie.com&sz=128",
  },
  {
    key: "universite-le-havre-normandie",
    match: /universit[eé]\s+le\s+havre\s+normandie|\bulhn\b/i,
    label: "Université Le Havre Normandie",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_Universit%C3%A9_Le_Havre_Normandie.svg",
    fallbackUrl: "https://www.google.com/s2/favicons?domain=univ-lehavre.fr&sz=128",
  },
  {
    key: "kfc",
    match: /\bkfc\b/i,
    label: "KFC",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/KFC_2026_%28wordmark%29.svg",
    fallbackUrl: "https://www.google.com/s2/favicons?domain=kfc.fr&sz=128",
  },
];

function getOrganizationBrand(organization) {
  const value = String(organization ?? "").trim();
  if (!value) return null;
  return BRAND_RULES.find((brand) => brand.match.test(value)) ?? null;
}

function getInitials(value) {
  return String(value ?? "")
    .split(/\s+|\/|—|-/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function OrganizationLogo({ brand }) {
  const [logoSrc, setLogoSrc] = useState(brand.logoUrl ?? null);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogoError = () => {
    if (brand.fallbackUrl && logoSrc !== brand.fallbackUrl) {
      setLogoSrc(brand.fallbackUrl);
      return;
    }
    setLogoFailed(true);
  };

  return (
    <span className="organization-brand__logo-frame" aria-hidden="true">
      {!logoFailed && logoSrc ? (
        <img
          className="organization-brand__logo"
          src={logoSrc}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleLogoError}
        />
      ) : (
        <span className="organization-brand__fallback">{getInitials(brand.label)}</span>
      )}
    </span>
  );
}

export default function OrganizationBrand({ organization, className = "", compact = false }) {
  const brand = useMemo(() => getOrganizationBrand(organization), [organization]);

  if (!organization) return null;

  const classes = [
    "organization-brand",
    compact ? "organization-brand--compact" : "",
    brand ? `organization-brand--${brand.key}` : "organization-brand--generic",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} data-brand={brand?.key ?? "generic"}>
      {brand && <OrganizationLogo key={`${brand.key}:${brand.logoUrl}`} brand={brand} />}
      <span className="organization-brand__title">{organization}</span>
    </div>
  );
}
