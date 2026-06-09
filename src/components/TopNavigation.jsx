import { Anchor, Badge, Burger, Button, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { getInitials, getOwnerFullName } from "../utils/portfolio";

const links = [
  { href: "#profile", label: "Île profil" },
  { href: "#timeline", label: "Route" },
  { href: "#projects", label: "Îles projets" },
  { href: "#reef", label: "Récif" },
  { href: "#expertise", label: "Stack" },
  { href: "#contact", label: "Port" },
];

export default function TopNavigation({ owner, source }) {
  const rootRef = useRef(null);
  const [opened, { toggle, close }] = useDisclosure(false);
  const ownerName = getOwnerFullName(owner);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    gsap.from(".top-nav", { y: -28, autoAlpha: 0, duration: 0.8, ease: "power3.out" });
    gsap.from(".nav-link", { y: -10, autoAlpha: 0, duration: 0.55, stagger: 0.045, ease: "power3.out", delay: 0.15 });

    const linkEls = gsap.utils.toArray(".nav-link");
    const cleanups = [];
    linkEls.forEach((link) => {
      const enter = () => gsap.to(link, { y: -2, scale: 1.04, duration: 0.22, ease: "power2.out" });
      const leave = () => gsap.to(link, { y: 0, scale: 1, duration: 0.28, ease: "power2.out" });
      link.addEventListener("mouseenter", enter);
      link.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        link.removeEventListener("mouseenter", enter);
        link.removeEventListener("mouseleave", leave);
      });
    });

    if (ScrollTrigger) {
      ScrollTrigger.create({
        start: 80,
        end: "bottom bottom",
        onUpdate: (self) => {
          gsap.to(".scroll-current", { scaleX: self.progress, duration: 0.18, ease: "none" });
          gsap.to(".top-nav", { boxShadow: self.progress > 0.02 ? "0 18px 50px rgba(14, 116, 144, .16)" : "0 8px 30px rgba(14, 116, 144, .08)", duration: 0.2 });
        },
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [ownerName]);

  const navLinks = links.map((link) => (
    <Anchor key={link.href} href={link.href} className="nav-link" onClick={close}>
      {link.label}
    </Anchor>
  ));

  return (
    <header ref={rootRef} className="top-nav-shell">
      <div className="top-nav">
        <a href="#top" className="brand-lockup" aria-label="Retour en haut de page">
          <span className="brand-mark">{getInitials(owner)}</span>
          <span>
            <Text className="brand-name">{ownerName}</Text>
            <Text className="brand-subtitle">Archipel professionnel</Text>
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
            Accoster
          </Button>
        </Group>

        <Burger opened={opened} onClick={toggle} className="mobile-burger" aria-label="Menu" />
        <span className="scroll-current" />
      </div>

      <Drawer opened={opened} onClose={close} position="right" title="Navigation" padding="xl" classNames={{ content: "drawer-content", header: "drawer-header" }}>
        <Stack gap="lg">{navLinks}</Stack>
      </Drawer>
    </header>
  );
}
