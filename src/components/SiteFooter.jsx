import { Anchor, Group, Text } from "@mantine/core";
import useLanguage from "../localization/useLanguage";
import { getContactHref, getOwnerFullName } from "../utils/portfolio";

export default function SiteFooter({ owner }) {
  const { t } = useLanguage();
  const contacts = owner?.contacts ?? [];

  return (
    <footer className="simple-footer" aria-label={t("hero.contacts")}>
      <Text className="simple-footer-name" style={{ color: "white" }}>
        {getOwnerFullName(owner)}
      </Text>
      <Group justify="center" gap="xs" className="simple-footer-links">
        {contacts.map((contact) => {
          const external = contact.type !== "EMAIL" && contact.type !== "PHONE_NUMBER";
          return (
            <Anchor
              key={`${contact.type}-${contact.value}`}
              href={getContactHref(contact)}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
            >
              {t(`contact.${contact.type}`, { fallback: contact.type })}
            </Anchor>
          );
        })}
      </Group>
    </footer>
  );
}
