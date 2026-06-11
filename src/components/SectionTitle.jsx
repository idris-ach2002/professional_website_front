import { Group, Text, Title } from "@mantine/core";
import { useRef } from "react";
import { useGsap } from "../animations/useGsap";

function animateIfPresent(timeline, target, vars, position) {
  if (!target) return timeline;
  return timeline.to(target, vars, position);
}

export default function SectionTitle({ eyebrow, title, description, rightSlot, reveal = "soft" }) {
  const rootRef = useRef(null);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    const root = rootRef.current;
    if (!root) return undefined;

    const copy = root.querySelector(".section-title-copy");
    const eyebrowNode = root.querySelector(".section-eyebrow");
    const heading = root.querySelector(".section-heading");
    const descriptionNode = root.querySelector(".section-description");
    const fish = root.querySelector(".section-reveal-fish");
    const bubbles = gsap.utils.toArray(root.querySelectorAll(".section-reveal-bubble"));
    const action = root.querySelector(".section-action");

    if (!copy || !heading) return undefined;

    gsap.set(copy, { autoAlpha: 0, y: 34, clipPath: "inset(0 0 100% 0)" });
    if (eyebrowNode) gsap.set(eyebrowNode, { y: 12, autoAlpha: 0 });
    gsap.set(heading, { y: 22, letterSpacing: "-0.085em" });
    if (descriptionNode) gsap.set(descriptionNode, { y: 18, autoAlpha: 0 });
    if (action) gsap.set(action, { y: 16, autoAlpha: 0 });

    if (reveal === "fish" && fish && ScrollTrigger) {
      gsap.set(fish, {
        x: "-72vw",
        yPercent: -50,
        autoAlpha: 0,
        rotate: -8,
        scale: 0.9,
      });

      const fishTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top 88%",
          end: "bottom 26%",
          scrub: 0.82,
          invalidateOnRefresh: true,
        },
      });

      fishTimeline
        .to(fish, { autoAlpha: 1, duration: 0.08 }, 0)
        .to(fish, { x: "72vw", duration: 1 }, 0)
        .to(fish, { yPercent: -76, rotate: 7, scale: 1.08, duration: 0.46, ease: "sine.inOut" }, 0.08)
        .to(fish, { yPercent: -38, rotate: -5, scale: 0.98, duration: 0.46, ease: "sine.inOut" }, 0.52)
        .to(copy, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.48, ease: "power2.out" }, 0.32);

      animateIfPresent(fishTimeline, eyebrowNode, { y: 0, autoAlpha: 1, duration: 0.28, ease: "power2.out" }, 0.32);
      fishTimeline.to(heading, { y: 0, letterSpacing: "-0.07em", duration: 0.44, ease: "power2.out" }, 0.38);
      animateIfPresent(fishTimeline, descriptionNode, { y: 0, autoAlpha: 1, duration: 0.34, ease: "power2.out" }, 0.52);
      animateIfPresent(fishTimeline, action, { y: 0, autoAlpha: 1, duration: 0.32, ease: "power2.out" }, 0.6);
      fishTimeline.to(fish, { autoAlpha: 0, duration: 0.08 }, 0.98);

      return undefined;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: ScrollTrigger
        ? {
            trigger: root,
            start: reveal === "bubbles" ? "top 82%" : "top 76%",
            end: reveal === "bubbles" ? "bottom 52%" : undefined,
            scrub: reveal === "bubbles" ? 0.75 : false,
            once: reveal !== "bubbles",
          }
        : undefined,
    });

    if (reveal === "bubbles" && bubbles.length > 0) {
      gsap.set(bubbles, {
        autoAlpha: 0,
        y: 150,
        z: -120,
        scale: 0.34,
        transformPerspective: 900,
      });
      timeline
        .to(bubbles, {
          autoAlpha: 1,
          y: (index) => -105 - index * 13,
          x: (index) => (index % 2 === 0 ? 28 : -28),
          z: (index) => index * 30,
          scale: (index) => 0.9 + index * 0.095,
          duration: 0.72,
          stagger: 0.035,
          ease: "power2.out",
        }, 0)
        .to(copy, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.45, ease: "power2.out" }, 0.5);
      animateIfPresent(timeline, eyebrowNode, { y: 0, autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0.5);
      timeline.to(heading, { y: 0, letterSpacing: "-0.07em", duration: 0.44, ease: "power2.out" }, 0.55);
      animateIfPresent(timeline, descriptionNode, { y: 0, autoAlpha: 1, duration: 0.36, ease: "power2.out" }, 0.68);
      timeline.to(bubbles, { autoAlpha: 0, y: -220, scale: 1.28, duration: 0.32, stagger: 0.025, ease: "power2.in" }, 0.82);
    } else {
      timeline.to(copy, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.9 }, 0);
      animateIfPresent(timeline, eyebrowNode, { y: 0, autoAlpha: 1, duration: 0.54 }, 0.04);
      timeline.to(heading, { y: 0, letterSpacing: "-0.07em", duration: 0.86 }, 0.08);
      animateIfPresent(timeline, descriptionNode, { y: 0, autoAlpha: 1, duration: 0.68 }, 0.22);
    }

    animateIfPresent(timeline, action, { y: 0, autoAlpha: 1, duration: 0.62 }, reveal === "bubbles" ? 0.78 : 0.72);

    return undefined;
  }, [title, description, reveal]);

  return (
    <div ref={rootRef} className={`section-title section-title-${reveal}`}>
      {reveal === "fish" && (
        <img
          src="/assets/ocean/fish-reveal.svg"
          alt=""
          aria-hidden="true"
          className="section-reveal-fish"
          loading="lazy"
        />
      )}

      {reveal === "bubbles" && (
        <div className="section-reveal-bubbles" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} className="section-reveal-bubble" />
          ))}
        </div>
      )}

      <div className="section-title-copy">
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <Title order={2} className="section-heading">
          {title}
        </Title>
        {description && <Text className="section-description">{description}</Text>}
      </div>
      {rightSlot && <Group className="section-action">{rightSlot}</Group>}
    </div>
  );
}
