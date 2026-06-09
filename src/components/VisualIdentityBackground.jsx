import { useMemo, useRef } from "react";
import { useGsap } from "../animations/useGsap";
import { getOwnerFullName } from "../utils/portfolio";

function TurtleIcon({ className, x, y, scale = 1 }) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="19" ry="13" fill="rgba(15,118,110,.22)" stroke="rgba(13,148,136,.55)" strokeWidth="2" />
      <circle cx="22" cy="0" r="5" fill="rgba(15,118,110,.28)" stroke="rgba(13,148,136,.55)" strokeWidth="1.4" />
      <path d="M-11-11 C-24-24 -29-9 -17-6 M-11 11 C-25 25 -30 9 -17 6 M8-10 C20-24 26-9 14-5 M8 10 C22 23 27 9 14 5" fill="none" stroke="rgba(13,148,136,.45)" strokeWidth="2" strokeLinecap="round" />
      <path d="M-10-5 C-1-12 8-9 14 0 C7 8-2 10-12 4" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="1" />
    </g>
  );
}

export default function VisualIdentityBackground({ owner }) {
  const rootRef = useRef(null);
  const fullName = useMemo(() => getOwnerFullName(owner), [owner]);

  useGsap(rootRef, (gsap, ScrollTrigger) => {
    gsap.set(".ocean-background", { autoAlpha: 1 });

    gsap.fromTo(
      ".current-line",
      { strokeDasharray: 900, strokeDashoffset: 900, opacity: 0.12 },
      {
        strokeDashoffset: -900,
        opacity: 0.42,
        duration: 18,
        ease: "none",
        repeat: -1,
        stagger: { each: 1.4, from: "random" },
      },
    );

    gsap.to(".wave-band", {
      x: (index) => (index % 2 ? -46 : 38),
      y: (index) => (index % 2 ? 8 : -6),
      duration: (index) => 10 + index * 2.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 0.18,
    });

    gsap.to(".island-shape", {
      y: (index) => (index % 2 ? -10 : 12),
      rotate: (index) => (index % 2 ? 1.8 : -1.4),
      transformOrigin: "50% 50%",
      duration: (index) => 8 + index * 0.9,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.2,
    });

    gsap.to(".reef-dot", {
      scale: 1.35,
      opacity: 0.62,
      transformOrigin: "50% 50%",
      duration: 2.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: { each: 0.08, from: "random" },
    });

    gsap.to(".bg-turtle", {
      x: (index) => (index % 2 ? -70 : 86),
      y: (index) => (index % 2 ? 26 : -22),
      rotate: (index) => (index % 2 ? -8 : 11),
      transformOrigin: "50% 50%",
      duration: (index) => 16 + index * 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 1.2,
    });

    gsap.to(".volcano-glow", {
      scale: 1.16,
      opacity: 0.52,
      transformOrigin: "50% 50%",
      duration: 3.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    if (ScrollTrigger) {
      gsap.to(".ocean-map", {
        yPercent: -7,
        scale: 1.04,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.4,
        },
      });
    }
  }, [fullName]);

  return (
    <div ref={rootRef} className="ocean-background" aria-hidden="true">
      <div className="ocean-sky-glow" />
      <svg className="ocean-map" viewBox="0 0 1600 1200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="oceanWash" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="42%" stopColor="#dff9f6" />
            <stop offset="100%" stopColor="#f7f1dd" />
          </linearGradient>
          <radialGradient id="lagoonGlow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity=".52" />
            <stop offset="55%" stopColor="#2dd4bf" stopOpacity=".17" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="volcanoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity=".42" />
            <stop offset="54%" stopColor="#fb7185" stopOpacity=".14" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="softBlur">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <rect width="1600" height="1200" fill="url(#oceanWash)" />
        <circle className="volcano-glow" cx="1180" cy="230" r="230" fill="url(#volcanoGlow)" filter="url(#softBlur)" />
        <circle cx="420" cy="610" r="420" fill="url(#lagoonGlow)" filter="url(#softBlur)" />
        <circle cx="1260" cy="850" r="360" fill="url(#lagoonGlow)" filter="url(#softBlur)" opacity=".8" />

        <path className="wave-band" d="M-120 234 C110 184 259 275 483 225 C731 170 929 264 1142 209 C1349 156 1512 195 1710 148" fill="none" stroke="rgba(14,116,144,.14)" strokeWidth="18" strokeLinecap="round" />
        <path className="wave-band" d="M-80 390 C180 320 334 450 590 374 C813 308 978 423 1220 352 C1394 301 1512 332 1680 306" fill="none" stroke="rgba(20,184,166,.16)" strokeWidth="14" strokeLinecap="round" />
        <path className="wave-band" d="M-110 760 C196 690 360 812 635 725 C876 649 1080 781 1330 702 C1475 656 1586 674 1710 640" fill="none" stroke="rgba(6,182,212,.13)" strokeWidth="16" strokeLinecap="round" />
        <path className="wave-band" d="M-140 980 C150 908 372 1030 612 960 C832 896 1046 1016 1292 948 C1457 903 1560 922 1730 886" fill="none" stroke="rgba(15,118,110,.12)" strokeWidth="20" strokeLinecap="round" />

        <path className="current-line" d="M92 860 C280 720 431 816 584 656 C753 481 967 570 1122 404 C1252 266 1390 305 1512 184" fill="none" stroke="rgba(14,116,144,.35)" strokeWidth="2.2" strokeLinecap="round" />
        <path className="current-line" d="M-20 530 C178 510 312 392 503 456 C709 526 816 378 1016 430 C1210 481 1362 378 1607 421" fill="none" stroke="rgba(20,184,166,.32)" strokeWidth="2" strokeLinecap="round" />
        <path className="current-line" d="M220 1110 C360 910 524 972 700 804 C870 642 1036 714 1228 557 C1394 421 1506 492 1650 330" fill="none" stroke="rgba(8,145,178,.31)" strokeWidth="2" strokeLinecap="round" />

        <g className="island-shape" transform="translate(250 300) rotate(-9)">
          <path d="M-138 24 C-87-72 44-91 132-20 C201 36 148 113 18 125 C-103 137-193 91-138 24Z" fill="rgba(255,247,210,.82)" stroke="rgba(8,145,178,.35)" strokeWidth="3" />
          <path d="M-45 24 C-18-36 50-44 86 4 C54 56-3 66-45 24Z" fill="rgba(15,118,110,.18)" />
        </g>
        <g className="island-shape" transform="translate(1040 520) rotate(7)">
          <path d="M-170 20 C-102-92 74-116 165-38 C242 29 150 141 2 145 C-121 148-232 96-170 20Z" fill="rgba(255,247,210,.78)" stroke="rgba(13,148,136,.35)" strokeWidth="3" />
          <path d="M-28 46 C-5-35 70-55 104-1 C78 61 21 85-28 46Z" fill="rgba(120,53,15,.13)" />
        </g>
        <g className="island-shape" transform="translate(760 950) rotate(-4)">
          <path d="M-210 0 C-132-105 80-112 205-22 C289 38 187 138 23 152 C-144 166-278 90-210 0Z" fill="rgba(255,247,210,.7)" stroke="rgba(14,116,144,.28)" strokeWidth="3" />
        </g>

        {Array.from({ length: 48 }).map((_, index) => {
          const x = 90 + ((index * 149) % 1400);
          const y = 190 + ((index * 83) % 850);
          const r = 3 + (index % 5);
          return <circle key={index} className="reef-dot" cx={x} cy={y} r={r} fill={index % 3 ? "rgba(20,184,166,.36)" : "rgba(249,115,22,.26)"} />;
        })}

        <TurtleIcon className="bg-turtle" x="450" y="190" scale="1.05" />
        <TurtleIcon className="bg-turtle" x="1190" y="770" scale=".82" />
        <TurtleIcon className="bg-turtle" x="770" y="620" scale=".7" />
      </svg>
      <div className="ocean-ribbon">
        <span>{fullName}</span>
        <span>· Archipel portfolio</span>
        <span>· Récif senior</span>
        <span>· Recrutement</span>
        <span>· Projets s</span>
      </div>
    </div>
  );
}
