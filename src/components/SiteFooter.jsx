import { Anchor, Group, Text } from "@mantine/core";
import {
  CONTACT_LABELS,
  getContactHref,
  getOwnerFullName,
} from "../utils/portfolio";

export default function SiteFooter({ owner }) {
  const contacts = owner?.contacts ?? [];

  return (
    <footer className="simple-footer" aria-label="Coordonnées de fin de page">
      <Text className="simple-footer-name" style={{ color: "white" }}>
        {getOwnerFullName(owner)}
      </Text>
      <Group justify="center" gap="xs" className="simple-footer-links">
        {contacts.map((contact) => (
          <Anchor
            key={`${contact.type}-${contact.value}`}
            href={getContactHref(contact)}
            target={
              contact.type === "EMAIL" || contact.type === "PHONE_NUMBER"
                ? undefined
                : "_blank"
            }
          >
            {CONTACT_LABELS[contact.type] ?? contact.type}
          </Anchor>
        ))}
      </Group>
    </footer>
  );
}
