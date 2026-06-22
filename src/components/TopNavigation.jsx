import { Anchor, Burger, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { getInitials, getOwnerFullName, normalizeUrl } from "../utils/portfolio";

const links = [
  { href: "#profile", label: "Profil" },
  { href: "#timeline", label: "Expériences" },
  { href: "#projects", label: "Projets" },
];

export default function TopNavigation({ owner }) {
  const rootRef = useRef(null);
  const [opened, { toggle, close }] = useDisclosure(false);
  const ownerName = getOwnerFullName(owner);
  const logoUrl = owner?.prof?.logoUrl ? normalizeUrl(owner.prof.logoUrl) : "";

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    if (!root) return undefined;

    const nav = root.querySelector(".top-nav");
    const linkEls = gsap.utils.toArray(root.querySelectorAll(".nav-link"));
    const scrollCurrent = root.querySelector(".scroll-current");

    if (nav) {
      gsap.from(nav, { y: -28, autoAlpha: 0, duration: 0.8, ease: "power3.out" });
    }

    if (linkEls.length > 0) {
      gsap.from(linkEls, { y: -10, autoAlpha: 0, duration: 0.55, stagger: 0.045, ease: "power3.out", delay: 0.15 });
    }

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

    let progressFrame = 0;

    const getScrollProgress = () => {
      const scrollingElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollingElement.scrollTop || window.scrollY || 0;
      const maxScroll = Math.max(
        1,
        scrollingElement.scrollHeight - window.innerHeight,
        document.body.scrollHeight - window.innerHeight,
      );

      return Math.min(1, Math.max(0, scrollTop / maxScroll));
    };

    const updateScrollProgress = () => {
      window.cancelAnimationFrame(progressFrame);
      progressFrame = window.requestAnimationFrame(() => {
        const progress = getScrollProgress();

        if (scrollCurrent) {
          gsap.set(scrollCurrent, { scaleX: progress });
        }

        if (nav) {
          gsap.to(nav, {
            boxShadow: progress > 0.02
              ? "0 18px 50px rgba(14, 116, 144, .16)"
              : "0 8px 30px rgba(14, 116, 144, .08)",
            duration: 0.2,
            overwrite: "auto",
          });
        }
      });
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress, { passive: true });
    window.addEventListener("load", updateScrollProgress, { once: true });

    cleanups.push(() => {
      window.cancelAnimationFrame(progressFrame);
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
      window.removeEventListener("load", updateScrollProgress);
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [ownerName, logoUrl]);

  const renderNavLinks = (suffix = "") =>
    links.map((link) => (
      <Anchor key={`${link.href}-${suffix}`} href={link.href} className="nav-link" onClick={close}>
        {link.label}
      </Anchor>
    ));

  return (
    <header ref={rootRef} className="top-nav-shell">
      <div className="top-nav">
        <a href="#top" className={`brand-lockup${logoUrl ? " brand-lockup--dragon" : ""}`} aria-label="Retour en haut de page">
          {logoUrl ? (
            <span className="brand-dragon-silhouette" aria-hidden="true">
              <img src={logoUrl} alt="" loading="eager" />
            </span>
          ) : null}

          <span className={`brand-mark${logoUrl ? " brand-mark--logo brand-mark--dragon" : ""}`} aria-hidden="true">
            {logoUrl ? (
              <>
                <span className="brand-logo-aura" />
                <span className="brand-current brand-current--one" />
                <span className="brand-current brand-current--two" />
                <span className="brand-bubble brand-bubble--one" />
                <span className="brand-bubble brand-bubble--two" />
                <span className="brand-bubble brand-bubble--three" />
                <span className="brand-dragon-orbit" />
                <img src={logoUrl} alt="" className="brand-logo" loading="eager" />
              </>
            ) : (
              getInitials(owner)
            )}
          </span>
          <span className="brand-copy">
            <Text className="brand-name">{ownerName}</Text>
            {logoUrl ? <span className="brand-subtitle"></span> : null}
          </span>
        </a>

        <Group gap="xs" className="desktop-nav">
          {renderNavLinks("desktop")}
        </Group>

        <Burger opened={opened} onClick={toggle} className="mobile-burger" aria-label="Menu" />
        <span className="scroll-current" />
      </div>

      <Drawer opened={opened} onClose={close} position="right" title="Navigation" padding="xl" classNames={{ content: "drawer-content", header: "drawer-header" }}>
        <Stack gap="lg">{renderNavLinks("drawer")}</Stack>
      </Drawer>
    </header>
  );
}
