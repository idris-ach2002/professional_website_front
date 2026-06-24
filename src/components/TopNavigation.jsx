import { Anchor, Burger, Drawer, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { useGsap } from "../animations/useGsap";
import { getOwnerFullName } from "../utils/portfolio";
import NavSignatureCore from "./navigation/NavSignatureCore";
import NavSonarLinks from "./navigation/NavSonarLinks";

const links = [
  { href: "#profile", label: "Profil" },
  { href: "#timeline", label: "Expériences" },
  { href: "#projects", label: "Projets" },
];

export default function TopNavigation({ owner }) {
  const rootRef = useRef(null);
  const [opened, { toggle, close }] = useDisclosure(false);
  const [activeHref, setActiveHref] = useState(links[0].href);
  const ownerName = getOwnerFullName(owner);
  const activeIndex = Math.max(0, links.findIndex((link) => link.href === activeHref));

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    const sections = links
      .map((link) => ({ link, section: document.querySelector(link.href) }))
      .filter((item) => item.section);

    const updateFromHash = () => {
      const matchingLink = links.find((link) => link.href === window.location.hash);
      if (matchingLink) setActiveHref(matchingLink.href);
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);

    if (!sections.length || !window.IntersectionObserver) {
      return () => window.removeEventListener("hashchange", updateFromHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const activeItem = sections.find((item) => item.section === visibleEntry.target);
        if (activeItem) setActiveHref(activeItem.link.href);
      },
      {
        root: null,
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0.16, 0.32, 0.5, 0.68],
      },
    );

    sections.forEach(({ section }) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", updateFromHash);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const nav = rootRef.current?.querySelector(".top-nav");
    if (!nav) return undefined;

    nav.style.setProperty("--energy-target-index", String(activeIndex));
    nav.classList.add("is-energy-retargeting");

    const pulseTimer = window.setTimeout(() => {
      nav.classList.remove("is-energy-retargeting");
    }, 880);

    return () => window.clearTimeout(pulseTimer);
  }, [activeIndex]);

  useGsap(rootRef, (gsap) => {
    const root = rootRef.current;
    if (!root) return undefined;

    const nav = root.querySelector(".top-nav");
    const linkEls = gsap.utils.toArray(root.querySelectorAll(".sonar-nav-link"));
    const scrollCurrent = root.querySelector(".scroll-current");
    const core = root.querySelector(".nav-signature-core");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const cleanups = [];

    if (nav) {
      gsap.set(nav, {
        "--ribbon-enter-y": "0px",
        "--ribbon-float-y": "0px",
        "--ribbon-tilt-z": "-1.05deg",
        "--ribbon-breath-pitch": "0deg",
        "--ribbon-hover-pitch": "0deg",
        "--ribbon-pointer-x": "54%",
        "--ribbon-pointer-y": "48%",
        "--ribbon-sheen-x": "-62%",
        "--ribbon-sheen-opacity": 0,
        "--ribbon-scroll": 0,
        "--ribbon-compact": 0,
        "--nav-hover-intensity": 0,
        "--core-energy": 0.62,
        "--energy-hover": 1,
        "--energy-pulse": 0,
        "--energy-particle": 0,
        "--energy-target-index": activeIndex,
      });

      gsap.fromTo(
        nav,
        { "--ribbon-enter-y": "-26px", autoAlpha: 0 },
        { "--ribbon-enter-y": "0px", autoAlpha: 1, duration: 0.82, ease: "power3.out" },
      );

      if (!reducedMotion) {
        const ribbonFloatTween = gsap.to(nav, {
          "--ribbon-float-y": "3px",
          "--ribbon-breath-pitch": "1.05deg",
          duration: 4.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const coreEnergyTween = gsap.to(nav, {
          "--core-energy": 1,
          duration: 4.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const energyFiberTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.55 });
        energyFiberTimeline
          .set(nav, { "--energy-pulse": 0, "--energy-particle": 0.64 })
          .to(nav, { "--energy-pulse": 1, "--energy-particle": 0.86, duration: 7.6, ease: "sine.inOut" })
          .to(nav, { "--energy-pulse": 0, "--energy-particle": 0.58, duration: 7.2, ease: "sine.inOut" })
          .to(nav, { "--energy-particle": 0.64, duration: 1.2, ease: "sine.inOut" });

        cleanups.push(() => {
          ribbonFloatTween.kill();
          coreEnergyTween.kill();
          energyFiberTimeline.kill();
        });
      }
    }

    if (core) {
      gsap.from(core, { scale: 0.82, autoAlpha: 0, duration: 0.9, ease: "power3.out", delay: 0.1 });
    }

    if (linkEls.length > 0) {
      gsap.from(linkEls, { y: -8, autoAlpha: 0, duration: 0.55, stagger: 0.07, ease: "power3.out", delay: 0.18 });
    }

    if (nav && !reducedMotion) {
      const playContextualSheen = () => {
        gsap.killTweensOf(nav, "--ribbon-sheen-x");
        gsap.killTweensOf(nav, "--ribbon-sheen-opacity");

        gsap.set(nav, { "--ribbon-sheen-x": "-62%", "--ribbon-sheen-opacity": 0 });
        gsap.to(nav, {
          "--ribbon-sheen-x": "142%",
          "--ribbon-sheen-opacity": 0.24,
          duration: 0.86,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            gsap.to(nav, {
              "--ribbon-sheen-opacity": 0,
              duration: 0.42,
              ease: "power2.out",
              overwrite: "auto",
            });
          },
        });
      };

      const activatePremiumHover = () => {
        gsap.to(nav, {
          "--nav-hover-intensity": 1,
          duration: 0.34,
          ease: "power3.out",
          overwrite: "auto",
        });
        playContextualSheen();
      };

      const updateRibbonPointer = (event) => {
        const rect = nav.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

        gsap.to(nav, {
          "--ribbon-pointer-x": `${(x * 100).toFixed(1)}%`,
          "--ribbon-pointer-y": `${(y * 100).toFixed(1)}%`,
          "--ribbon-tilt-z": `${(-1.05 + (x - 0.5) * 0.72).toFixed(3)}deg`,
          "--ribbon-hover-pitch": `${((0.5 - y) * 1.35).toFixed(3)}deg`,
          duration: 0.38,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const resetRibbonPointer = () => {
        gsap.to(nav, {
          "--ribbon-pointer-x": "54%",
          "--ribbon-pointer-y": "48%",
          "--ribbon-tilt-z": "-1.05deg",
          "--ribbon-hover-pitch": "0deg",
          "--nav-hover-intensity": 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      nav.addEventListener("pointerenter", activatePremiumHover);
      nav.addEventListener("pointermove", updateRibbonPointer);
      nav.addEventListener("pointerleave", resetRibbonPointer);
      cleanups.push(() => {
        nav.removeEventListener("pointerenter", activatePremiumHover);
        nav.removeEventListener("pointermove", updateRibbonPointer);
        nav.removeEventListener("pointerleave", resetRibbonPointer);
      });
    }

    linkEls.forEach((link) => {
      const enter = () => gsap.to(link, { y: -2, scale: 1.035, duration: 0.22, ease: "power2.out" });
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
          const scrollingElement = document.scrollingElement || document.documentElement;
          const scrollTop = scrollingElement.scrollTop || window.scrollY || 0;
          const compact = scrollTop > 24 ? 1 : 0;

          gsap.to(nav, {
            "--ribbon-scroll": Number(progress.toFixed(3)),
            "--ribbon-compact": compact,
            duration: 0.22,
            ease: "power2.out",
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
  }, [ownerName, activeIndex]);

  const renderDrawerLinks = () =>
    links.map((link) => (
      <Anchor
        key={`${link.href}-drawer`}
        href={link.href}
        className={`drawer-nav-link${activeHref === link.href ? " is-active" : ""}`}
        onClick={close}
      >
        {link.label}
      </Anchor>
    ));

  return (
    <header ref={rootRef} className="top-nav-shell">
      <div className="top-nav top-nav--holo-sonar" style={{ "--energy-target-index": activeIndex }}>
        <a href="#top" className="brand-lockup brand-lockup--holo" aria-label="Retour en haut de page">
          <NavSignatureCore />
          <span className="brand-copy">
            <Text className="brand-name">{ownerName}</Text>
            <span className="brand-subtitle">Software Engineering Portfolio</span>
          </span>
        </a>

        <NavSonarLinks links={links} activeHref={activeHref} onLinkClick={close} />

        <Burger opened={opened} onClick={toggle} className="mobile-burger" aria-label="Menu" />
        <span className="scroll-current" />
      </div>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        title="Navigation"
        padding="xl"
        classNames={{ content: "drawer-content", header: "drawer-header" }}
      >
        <Stack gap="lg">{renderDrawerLinks()}</Stack>
      </Drawer>
    </header>
  );
}
