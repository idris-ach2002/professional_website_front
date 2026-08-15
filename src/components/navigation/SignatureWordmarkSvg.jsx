import { useId } from "react";
import useAnimationPreferences from "../../contexts/useAnimationPreferences";

const GLYPHS = {
  I: {
    width: 294,
    height: 658,
    path: "M86 105Q86 74 73 58.5Q60 43 32 36Q8 30 8 14Q8 0 35 0Q61 0 96 1.5Q131 3 152 3Q171 3 203 1.5Q235 0 261 0Q288 0 288 14Q288 30 265 36Q236 43 222 58.5Q208 74 208 105V553Q208 608 270 624Q283 627 288.5 631Q294 635 294 644Q294 658 267 658Q242 658 207 655.5Q172 653 152 653Q129 653 90.5 655.5Q52 658 27 658Q0 658 0 644Q0 635 5.5 631Q11 627 24 624Q86 608 86 553Z",
  },
  D: {
    width: 674,
    height: 666,
    path: "M200 536Q200 589 228 607.5Q256 626 304 626Q390 626 459.5 541.5Q529 457 529 334Q529 204 452 120Q375 36 294 36Q241 36 220.5 45.5Q200 55 200 94ZM318 666Q316 666 244 662.5Q172 659 130 659Q114 659 83 661.5Q52 664 27 664Q0 664 0 650Q0 641 5.5 637Q11 633 24 630Q52 623 65 606.5Q78 590 78 558V112Q78 80 65 64.5Q52 49 24 42Q0 36 0 19Q0 6 27 6Q54 6 85.5 7Q117 8 136 8Q157 8 218.5 4Q280 0 290 0Q468 0 571 90Q674 180 674 317Q674 458 563 562Q452 666 318 666Z",
  },
  R: {
    width: 667,
    height: 678,
    path: "M365 334Q360 336 364 343Q370 353 387 381Q404 409 411 420Q418 431 432.5 454Q447 477 457.5 490.5Q468 504 483 523Q498 542 513.5 559Q529 576 547 594Q570 616 587.5 621.5Q605 627 640 627Q667 627 667 641Q667 656 647.5 665Q628 674 611 676Q594 678 578 678Q529 678 475.5 665.5Q422 653 402 624Q397 616 373.5 582.5Q350 549 339.5 533Q329 517 308.5 481.5Q288 446 268 407Q244 357 208 357Q196 357 196 375V545Q196 616 242 628Q255 631 260.5 635Q266 639 266 648Q266 662 238 662Q211 662 187.5 658.5Q164 655 148 655Q125 655 89 658.5Q53 662 28 662Q0 662 0 648Q0 639 5.5 635Q11 631 24 628Q51 621 62.5 605Q74 589 74 555V137Q74 91 65.5 68.5Q57 46 32 40Q8 34 8 17Q8 4 38 4Q67 4 91.5 4.5Q116 5 135 5Q151 5 185 2.5Q219 0 250 0Q363 0 430.5 42Q498 84 498 165Q498 282 365 334ZM361 181Q361 119 330.5 77Q300 35 245 35Q217 35 206.5 44.5Q196 54 196 75V293Q196 313 204 319.5Q212 326 232 326Q281 326 321 281Q361 236 361 181Z",
  },
  S: {
    width: 413,
    height: 680,
    path: "M188 642Q235 642 260 612Q285 582 285 530Q285 449 145 348Q89 308 58 266Q27 224 27 168Q27 99 86.5 49.5Q146 0 237 0Q266 0 294.5 5Q323 10 340 15Q357 20 360 20Q374 20 379 44Q388 89 388 129Q388 156 376 156Q332 156 323 127Q317 86 293 62Q269 38 235 38Q197 38 171 67.5Q145 97 145 143Q145 171 169 201.5Q193 232 213 247Q233 262 269 287Q413 385 413 503Q413 573 357 626.5Q301 680 192 680Q104 680 50 656Q30 647 27 638Q0 540 0 522Q0 512 10.5 501.5Q21 491 33 491Q46 491 78 558Q89 600 119 621Q149 642 188 642Z",
  },
};

const FINAL_X = [15, 36.5, 62, 84, 104.5];
const FINAL_Y = 29.3;

function percent(value) {
  return `${Number(value.toFixed(3))}px`;
}

function GlyphShape({ letter }) {
  const glyph = GLYPHS[letter];
  const scale = 0.0305;
  return (
    <g transform={`scale(${scale}) translate(${-glyph.width / 2} ${-glyph.height / 2})`}>
      <path d={glyph.path} />
    </g>
  );
}

export default function SignatureWordmarkSvg({ name = "IDRIS" }) {
  const id = useId().replaceAll(":", "");
  const { animationsEnabled, animationsPaused, performanceMode } = useAnimationPreferences();
  const animated = animationsEnabled && !animationsPaused && !["lite", "ultra-lite"].includes(performanceMode);
  const letters = String(name || "IDRIS").toUpperCase().split("").slice(0, 5);
  const supported = letters.join("") === "IDRIS";

  if (!supported) {
    return (
      <svg className="nav-signature-wordmark is-static" viewBox="0 0 124 58" aria-hidden="true">
        <text x="62" y="31" textAnchor="middle" className="nav-signature-wordmark-fallback">{name}</text>
      </svg>
    );
  }

  const letterStyles = letters.map((letter, index) => ({
    letter,
    style: {
      "--fx": percent(FINAL_X[index]),
      "--fy": percent(FINAL_Y),
      "--letter-delay": `${index * 24}ms`,
    },
  }));

  return (
    <svg
      className={`nav-signature-wordmark ${animated ? "is-animated" : "is-static"}`}
      viewBox="0 0 124 58"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-word`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#173B40" />
          <stop offset="0.52" stopColor="#2C5554" />
          <stop offset="0.72" stopColor="#B98B4B" />
          <stop offset="0.83" stopColor="#385F5C" />
          <stop offset="1" stopColor="#173B40" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.47" stopColor="#F6F1E7" stopOpacity="0.05" />
          <stop offset="0.52" stopColor="#FFF8DF" stopOpacity="0.9" />
          <stop offset="0.58" stopColor="#D8ECE7" stopOpacity="0.36" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          {letterStyles.map(({ letter }, index) => (
            <g key={`${letter}-${index}`} transform={`translate(${FINAL_X[index]} ${FINAL_Y})`}>
              <GlyphShape letter={letter} />
            </g>
          ))}
        </clipPath>
      </defs>

      <g className="nav-signature-letters" fill={`url(#${id}-word)`}>
        {letterStyles.map(({ letter, style }, index) => (
          <g key={`${letter}-${index}`} className="nav-signature-letter" style={style}>
            <GlyphShape letter={letter} />
          </g>
        ))}
      </g>

      <g clipPath={`url(#${id}-clip)`} className="nav-signature-shine-layer">
        <rect className="nav-signature-shine" x="-34" y="5" width="25" height="48" fill={`url(#${id}-shine)`} />
      </g>
    </svg>
  );
}
