import { useEffect, useRef } from "react";
import { useGsap } from "../animations/useGsap";

function SmokePuff({ index }) {
  return <span className={`intro-smoke-puff intro-smoke-puff-${index}`} />;
}

function MagmaDrop({ index }) {
  const x = 500 + ((index * 61) % 300) - 150;
  const y = 475 + ((index * 37) % 34);
  const r = 4 + (index % 5);
  return <circle className="intro-magma-drop" cx={x} cy={y} r={r} />;
}

export default function VolcanoIntro({ onDone }) {
  const rootRef = useRef(null);
  const completedRef = useRef(false);

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onDone?.();
  };

  useEffect(() => {
    const safety = window.setTimeout(complete, 1900);
    return () => window.clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGsap(rootRef, (gsap) => {
    const overlay = rootRef.current;
    const smoke = overlay?.querySelectorAll(".intro-smoke-puff");
    const magma = overlay?.querySelectorAll(".intro-magma-drop");

    gsap.set(".intro-volcano-core", { y: 170, scale: 0.96, transformOrigin: "50% 100%" });
    gsap.set(".intro-crater-burst", { scale: 0.2, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(".intro-lava-flow", { strokeDasharray: 760, strokeDashoffset: 760 });
    gsap.set(magma, { autoAlpha: 0, scale: 0.25, transformOrigin: "50% 50%" });
    gsap.set(smoke, { autoAlpha: 0, scale: 0.14, y: 120, transformOrigin: "50% 100%" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: complete });

    tl
      .to(".intro-volcano-core", { y: 0, duration: 0.12, ease: "back.out(1.7)" })
      .to(".intro-crater-burst", { opacity: 1, scale: 1.18, duration: 0.12, ease: "expo.out" }, "-=0.03")
      .to(".intro-lava-flow", { strokeDashoffset: 0, duration: 0.28, stagger: 0.018, ease: "power2.out" }, "-=0.08")
      .to(magma, {
        autoAlpha: 1,
        y: (index) => -130 - (index % 6) * 20,
        x: (index) => (index % 2 ? -90 : 90) + ((index % 5) - 2) * 20,
        scale: (index) => 0.65 + (index % 4) * 0.16,
        duration: 0.30,
        stagger: 0.008,
        ease: "power4.out",
      }, "-=0.3")
      .to(smoke, {
        autoAlpha: 0.98,
        scale: (index) => 3.25 + (index % 5) * 0.62,
        y: (index) => -315 - (index % 4) * 64,
        x: (index) => ((index % 7) - 3) * 46,
        duration: 0.48,
        stagger: { each: 0.018, from: "center" },
        ease: "expo.out",
      }, "-=0.34")
      .to(".intro-volcano-core", { y: 30, scale: 1.02, duration: 0.18 }, "-=0.28")
      .to(".intro-crater-burst, .intro-magma-drop", { autoAlpha: 0, duration: 0.14 }, "-=0.12")
      .to(smoke, {
        autoAlpha: 0,
        scale: (index) => 3.9 + (index % 6) * 0.66,
        y: (index) => -390 - (index % 4) * 72,
        filter: "blur(22px)",
        duration: 0.44,
        stagger: { each: 0.008, from: "random" },
        ease: "sine.inOut",
      }, "+=0.04")
      .to(overlay, { autoAlpha: 0, pointerEvents: "none", duration: 0.16, ease: "sine.out" }, "-=0.24");

    gsap.to(".intro-sea-wave", {
      xPercent: (index) => (index % 2 ? -7 : 8),
      duration: 1.05,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.08,
    });
  }, []);

  return (
    <div ref={rootRef} className="volcano-intro" role="presentation" aria-hidden="true">
      <div className="intro-smoke-screen">
        {Array.from({ length: 14 }).map((_, index) => (
          <SmokePuff key={index} index={index} />
        ))}
      </div>

      <svg className="intro-sea-svg" viewBox="0 0 1200 380" preserveAspectRatio="none">
        <path className="intro-sea-wave intro-sea-wave-a" d="M-80 184 C100 112 250 254 430 178 C610 104 760 244 940 170 C1080 112 1200 154 1280 118 L1280 380 L-80 380Z" />
        <path className="intro-sea-wave intro-sea-wave-b" d="M-90 248 C120 176 266 298 478 224 C664 158 822 304 1018 226 C1140 178 1232 204 1290 178 L1290 380 L-90 380Z" />
      </svg>

      <svg className="intro-volcano-svg" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="introRockDark" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#062536" />
            <stop offset="54%" stopColor="#164e63" />
            <stop offset="100%" stopColor="#431407" />
          </linearGradient>
          <linearGradient id="introLavaHot" x1="0" x2="1">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="38%" stopColor="#f97316" />
            <stop offset="68%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#fff7ad" />
          </linearGradient>
          <radialGradient id="introBurst" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#fff7ad" stopOpacity="1" />
            <stop offset="46%" stopColor="#f97316" stopOpacity=".9" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="intro-volcano-core">
          <ellipse cx="500" cy="686" rx="520" ry="46" fill="rgba(6,37,54,.22)" />
          <path d="M42 682 C144 600 228 438 326 470 C382 488 400 420 456 430 C482 434 518 434 544 430 C604 420 628 490 682 468 C784 428 872 594 958 682Z" fill="url(#introRockDark)" />
          <path d="M360 468 C394 432 604 430 642 468 C594 496 410 498 360 468Z" fill="#111827" />
          <ellipse className="intro-crater-burst" cx="500" cy="462" rx="205" ry="132" fill="url(#introBurst)" />
          <path d="M382 468 C426 446 580 444 624 468 C572 486 430 488 382 468Z" fill="#f97316" />
          <path className="intro-lava-flow" d="M436 474 C390 528 424 586 322 676" fill="none" stroke="url(#introLavaHot)" strokeWidth="15" strokeLinecap="round" />
          <path className="intro-lava-flow" d="M530 474 C594 532 548 596 676 680" fill="none" stroke="url(#introLavaHot)" strokeWidth="14" strokeLinecap="round" />
          <path className="intro-lava-flow" d="M492 474 C504 532 492 612 498 686" fill="none" stroke="url(#introLavaHot)" strokeWidth="10" strokeLinecap="round" />
          <path className="intro-lava-flow" d="M574 482 C660 530 668 596 806 672" fill="none" stroke="url(#introLavaHot)" strokeWidth="8" strokeLinecap="round" />
          {Array.from({ length: 32 }).map((_, index) => (
            <MagmaDrop key={index} index={index} />
          ))}
        </g>
      </svg>
    </div>
  );
}
