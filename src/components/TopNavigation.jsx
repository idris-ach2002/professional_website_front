import { Anchor, Badge, Burger, Button, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { getInitials, getOwnerFullName } from "../utils/portfolio";

const links = [
  { href: "#profile", label: "Profil" },
  { href: "#positioning", label: "Positionnement" },
  { href: "#timeline", label: "Parcours" },
  { href: "#projects", label: "Projets" },
  { href: "#expertise", label: "Stack" },
  { href: "#contact", label: "Contact" },
];

export default function TopNavigation({ owner, source }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const ownerName = getOwnerFullName(owner);

  const navLinks = links.map((link) => (
    <Anchor key={link.href} href={link.href} className="nav-link" onClick={close}>
      {link.label}
    </Anchor>
  ));

  return (
    <header className="top-nav">
      <a href="#top" className="brand-lockup" aria-label="Retour en haut de page">
        <span className="brand-mark">{getInitials(owner)}</span>
        <span>
          <Text className="brand-name">{ownerName}</Text>
          <Text className="brand-subtitle">Portfolio professionnel</Text>
        </span>
      </a>

      <Group gap="xs" className="desktop-nav">
        {navLinks}
      </Group>

      <Group gap="sm" className="nav-status">
        <Badge className="api-badge" data-source={source}>
          {source === "api" ? "Spring API live" : "Mode démo"}
        </Badge>
        <Button component="a" href="#contact" radius="xl" className="nav-cta">
          Discuter
        </Button>
      </Group>

      <Burger opened={opened} onClick={toggle} className="mobile-burger" aria-label="Menu" />
      <Drawer opened={opened} onClose={close} position="right" title="Navigation" padding="xl" classNames={{ content: "drawer-content", header: "drawer-header" }}>
        <Stack gap="lg">{navLinks}</Stack>
      </Drawer>
    </header>
  );
}
