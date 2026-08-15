import { Anchor, Button, Group, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { getContactHref } from "../../utils/portfolio";
import OrganizationBrand from "../OrganizationBrand";

export default function RecruiterHero({
  ownerName,
  profile,
  email,
  github,
  linkedin,
  education,
  localizedPath,
  t,
  copied,
  onCopy,
}) {
  const headline = profile?.headline || profile?.shortDescription || profile?.description;
  const summary = profile?.shortDescription && profile?.shortDescription !== headline
    ? profile.shortDescription
    : profile?.description;
  const identityStack = String(profile?.subtitle ?? "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  const primaryEducation = education?.[0];

  return (
    <section className="recruiter-hero-v2">
      <div className="recruiter-hero-v2__copy">
        <Text className="recruiter-overline">{t("recruiter.candidateBrief")}</Text>
        <Title order={1}>{ownerName}</Title>
        {profile?.title && <Text className="recruiter-hero-v2__role">{profile.title}</Text>}
        {headline && <Text className="recruiter-hero-v2__headline">{headline}</Text>}
        {summary && <Text className="recruiter-hero-v2__summary">{summary}</Text>}

        {identityStack.length > 0 && (
          <div className="recruiter-inline-stack" aria-label={t("recruiter.technicalProfile")}>
            {identityStack.map((item) => <span key={item}>{item}</span>)}
          </div>
        )}

        <Group gap="sm" className="recruiter-hero-v2__actions">
          {profile?.cvUrl && (
            <Button component={Link} to={localizedPath("/cv")} className="recruiter-primary-action">
              {t("recruiter.cv")}
            </Button>
          )}
          {email && (
            <Button component="a" href={getContactHref(email)} variant="light">
              {t("recruiter.contact")}
            </Button>
          )}
          {linkedin && (
            <Button component="a" href={getContactHref(linkedin)} target="_blank" rel="noreferrer" variant="subtle">
              {t("recruiter.linkedin")}
            </Button>
          )}
          {github && (
            <Button component="a" href={getContactHref(github)} target="_blank" rel="noreferrer" variant="subtle">
              {t("recruiter.github")}
            </Button>
          )}
        </Group>
      </div>

      <aside className="recruiter-hero-v2__identity" aria-label={t("recruiter.profileSnapshot")}>
        <div className="recruiter-portrait-shell">
          {profile?.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={ownerName} loading="eager" />
          ) : (
            <div className="recruiter-portrait-fallback" aria-hidden="true">{ownerName?.slice(0, 1)}</div>
          )}
        </div>
        <div className="recruiter-identity-meta">
          {profile?.availability && (
            <div>
              <span>{t("recruiter.availability")}</span>
              <strong>{profile.availability}</strong>
            </div>
          )}
          {(profile?.location || ownerName) && (
            <div>
              <span>{t("recruiter.location")}</span>
              <strong>{profile?.location}</strong>
            </div>
          )}
          {primaryEducation && (
            <div>
              <span>{t("recruiter.education")}</span>
              <OrganizationBrand organization={primaryEducation.organization} className="recruiter-identity-brand" compact />
            </div>
          )}
        </div>
        <div className="recruiter-utility-row">
          <button type="button" onClick={() => window.print()}>{t("recruiter.print")}</button>
          <button type="button" onClick={onCopy}>{copied ? t("recruiter.linkCopied") : t("recruiter.copyLink")}</button>
          {email && <Anchor href={getContactHref(email)}>{email.value}</Anchor>}
        </div>
      </aside>
    </section>
  );
}
