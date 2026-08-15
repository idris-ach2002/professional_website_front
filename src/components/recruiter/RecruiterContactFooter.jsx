import { Anchor, Button, Group, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { getContactHref } from "../../utils/portfolio";

export default function RecruiterContactFooter({ ownerName, profile, email, github, linkedin, localizedPath, t }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="recruiter-contact-v2">
      <div>
        <Text className="recruiter-overline">{t("recruiter.contact")}</Text>
        <Title order={2}>{profile?.availability || ownerName}</Title>
        {profile?.title && <Text>{ownerName} · {profile.title}</Text>}
      </div>

      <Group gap="sm" className="recruiter-contact-v2__actions">
        {profile?.cvUrl && <Button component={Link} to={localizedPath("/cv")} className="recruiter-primary-action">{t("recruiter.cv")}</Button>}
        {email && <Button component="a" href={getContactHref(email)} variant="light">{email.value}</Button>}
        {linkedin && <Anchor href={getContactHref(linkedin)} target="_blank" rel="noreferrer">{t("recruiter.linkedin")}</Anchor>}
        {github && <Anchor href={getContactHref(github)} target="_blank" rel="noreferrer">{t("recruiter.github")}</Anchor>}
        <Anchor component={Link} to={localizedPath("/")}>{t("recruiter.fullPortfolio")}</Anchor>
      </Group>

      <Text className="recruiter-contact-v2__copyright">© {currentYear} {ownerName}</Text>
    </footer>
  );
}
