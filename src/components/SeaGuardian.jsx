export default function SeaGuardian() {
  return (
    <div className="timeline-sea-guardian" aria-hidden="true">
      <div className="timeline-sea-guardian-float">
        <svg
          viewBox="0 0 180 320"
          role="presentation"
          focusable="false"
          className="timeline-sea-guardian-svg"
        >
          <defs>
            <linearGradient id="guardianArmor" x1="46" y1="42" x2="128" y2="250" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0FBFF" stopOpacity="0.96" />
              <stop offset="0.38" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="1" stopColor="#075985" stopOpacity="0.94" />
            </linearGradient>
            <linearGradient id="guardianCape" x1="106" y1="86" x2="158" y2="272" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67E8F9" stopOpacity="0.66" />
              <stop offset="1" stopColor="#0F766E" stopOpacity="0.08" />
            </linearGradient>
            <filter id="guardianGlow" x="-60%" y="-40%" width="220%" height="200%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#38BDF8" floodOpacity="0.3" />
            </filter>
          </defs>

          <g filter="url(#guardianGlow)">
            <path d="M116 88C145 112 157 159 151 205C146 244 127 276 101 291C116 246 115 207 102 171C94 145 98 113 116 88Z" fill="url(#guardianCape)" />
            <circle cx="83" cy="55" r="22" fill="#CFFAFE" opacity="0.92" />
            <path d="M61 53C67 28 98 26 107 51C99 43 88 41 77 45C70 47 66 50 61 53Z" fill="#075985" />
            <path d="M59 86C64 72 76 65 89 65C103 65 116 74 121 90L111 153H63L55 104L59 86Z" fill="url(#guardianArmor)" />
            <path d="M65 99L36 146" stroke="#BAE6FD" strokeWidth="12" strokeLinecap="round" />
            <path d="M111 98L137 145" stroke="#7DD3FC" strokeWidth="12" strokeLinecap="round" />
            <path d="M72 150L58 235" stroke="#0EA5E9" strokeWidth="15" strokeLinecap="round" />
            <path d="M101 150L118 234" stroke="#0369A1" strokeWidth="15" strokeLinecap="round" />
            <path d="M55 235L40 286" stroke="#BAE6FD" strokeWidth="11" strokeLinecap="round" />
            <path d="M120 234L137 285" stroke="#7DD3FC" strokeWidth="11" strokeLinecap="round" />
            <path d="M39 286L23 299" stroke="#E0FBFF" strokeWidth="9" strokeLinecap="round" />
            <path d="M138 285L157 297" stroke="#BAE6FD" strokeWidth="9" strokeLinecap="round" />
            <path d="M45 137L28 158" stroke="#E0FBFF" strokeWidth="9" strokeLinecap="round" />
            <path d="M135 142L153 160" stroke="#BAE6FD" strokeWidth="9" strokeLinecap="round" />
            <path d="M151 36V282" stroke="#7DD3FC" strokeWidth="6" strokeLinecap="round" />
            <path d="M151 36L136 56M151 36L166 56M151 36V16" stroke="#E0FBFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 105C82 113 95 113 108 104" stroke="#E0FBFF" strokeOpacity="0.72" strokeWidth="5" strokeLinecap="round" />
            <circle cx="76" cy="54" r="2.4" fill="#083344" />
            <circle cx="91" cy="54" r="2.4" fill="#083344" />
          </g>
        </svg>
      </div>
    </div>
  );
}
