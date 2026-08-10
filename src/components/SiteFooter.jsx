import { Anchor, Group, Text } from "@mantine/core";
import useLanguage from "../localization/useLanguage";
import { getContactHref, getOwnerFullName } from "../utils/portfolio";
import TreasureMineField from "./TreasureMineField";

export default function SiteFooter({ owner }) {
  const { t } = useLanguage();
  const contacts = owner?.contacts ?? [];

  return (
    <footer id="ocean-outro" className="simple-footer site-footer ocean-outro treasure-mine-footer" aria-label={t("hero.contacts")}>
      <TreasureMineField />

      <div className="treasure-footer-content">
        <div className="treasure-footer-copy">
          <h2 className="treasure-footer-title">{t("footer.treasureTitle")}</h2>
          <Text className="treasure-footer-description">{t("footer.treasureDescription")}</Text>
          <Group gap="xs" className="simple-footer-links treasure-contact-links">
            {contacts.map((contact) => {
              const external = contact.type !== "EMAIL" && contact.type !== "PHONE_NUMBER";
              return (
                <Anchor
                  key={`${contact.type}-${contact.value}`}
                  href={getContactHref(contact)}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="treasure-contact"
                >
                  {t(`contact.${contact.type}`, { fallback: contact.type })}
                </Anchor>
              );
            })}
          </Group>
          <div className="treasure-footer-meta">
            <Text className="treasure-footer-name">{getOwnerFullName(owner)}</Text>
            <Anchor href="#profile" className="treasure-restart-link">
              <span aria-hidden="true">↻</span>
              {t("footer.restartExpedition")}
            </Anchor>
          </div>
        </div>
      </div>
    </footer>
  );
}
