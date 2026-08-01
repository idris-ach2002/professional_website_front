import { useEffect, useState } from "react";

export default function ExplorationDrone() {
  const [isPaused, setIsPaused] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );

  useEffect(() => {
    const handleVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div
      className={`timeline-exploration-drone${isPaused ? " is-paused" : ""}`}
      data-scan-level="1"
      aria-hidden="true"
    >
      <div className="timeline-exploration-drone-float">
        <svg
          viewBox="0 0 360 220"
          role="presentation"
          focusable="false"
          className="timeline-exploration-drone-svg"
        >
          <defs>
            <linearGradient id="droneHull" x1="83" y1="54" x2="282" y2="173" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E6F8FF" />
              <stop offset="0.24" stopColor="#8DD8ED" />
              <stop offset="0.58" stopColor="#237C9B" />
              <stop offset="1" stopColor="#0B3550" />
            </linearGradient>
            <linearGradient id="droneHullLower" x1="151" y1="94" x2="234" y2="177" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E8AAA" />
              <stop offset="1" stopColor="#082C45" />
            </linearGradient>
            <radialGradient id="droneCanopy" cx="0" cy="0" r="1" gradientTransform="translate(156 78) rotate(54) scale(76 54)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E9FDFF" />
              <stop offset="0.28" stopColor="#80ECFF" />
              <stop offset="0.68" stopColor="#1684A8" />
              <stop offset="1" stopColor="#07314C" />
            </radialGradient>
            <linearGradient id="droneBeam" x1="62" y1="111" x2="0" y2="174" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D9FBFF" stopOpacity="0.52" />
              <stop offset="0.48" stopColor="#67E8F9" stopOpacity="0.22" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="droneMetal" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#DDF7FF" />
              <stop offset="0.45" stopColor="#5CAFC8" />
              <stop offset="1" stopColor="#123E57" />
            </linearGradient>
          </defs>

          <g className="exploration-drone-beam">
            <path d="M69 104L2 42L4 197L72 132Z" fill="url(#droneBeam)" />
            <path d="M63 110L0 91" stroke="#BAF7FF" strokeOpacity="0.22" strokeWidth="1.5" />
            <path d="M64 126L0 154" stroke="#7DE8FA" strokeOpacity="0.16" strokeWidth="1.5" />
          </g>

          <g className="exploration-drone-sonar">
            <ellipse cx="57" cy="118" rx="21" ry="38" fill="none" stroke="#A5F3FC" strokeOpacity="0.36" strokeWidth="2" />
            <ellipse cx="57" cy="118" rx="31" ry="52" fill="none" stroke="#67E8F9" strokeOpacity="0.16" strokeWidth="1.5" />
          </g>

          <path d="M268 77L325 57L311 98L332 116L307 129L321 171L267 150Z" fill="#0B4564" stroke="#72C7DC" strokeOpacity="0.72" strokeWidth="3" />
          <path d="M278 91L313 78L300 105L317 116L299 126L311 151L278 140Z" fill="#0A3049" opacity="0.82" />

          <g className="exploration-drone-thruster exploration-drone-thruster--top">
            <path d="M221 62L246 29L282 38L276 70Z" fill="url(#droneMetal)" stroke="#D6F6FF" strokeOpacity="0.62" strokeWidth="2" />
            <circle cx="263" cy="49" r="17" fill="#082E47" stroke="#78D5E9" strokeWidth="3" />
            <g className="exploration-drone-rotor">
              <path d="M263 32C269 39 270 44 263 49C256 45 256 39 263 32Z" fill="#A9EEFA" />
              <path d="M280 49C273 55 268 56 263 49C267 42 273 42 280 49Z" fill="#5AC5DE" />
              <path d="M263 66C257 59 256 54 263 49C270 53 270 59 263 66Z" fill="#2B8EAE" />
              <path d="M246 49C253 43 258 42 263 49C259 56 253 56 246 49Z" fill="#DDFBFF" />
              <circle cx="263" cy="49" r="4" fill="#EAFDFF" />
            </g>
          </g>

          <g className="exploration-drone-thruster exploration-drone-thruster--bottom">
            <path d="M219 157L245 190L282 181L274 149Z" fill="url(#droneMetal)" stroke="#D6F6FF" strokeOpacity="0.58" strokeWidth="2" />
            <circle cx="262" cy="170" r="17" fill="#082E47" stroke="#5CC6DE" strokeWidth="3" />
            <g className="exploration-drone-rotor exploration-drone-rotor--reverse">
              <path d="M262 153C268 160 269 165 262 170C255 166 255 160 262 153Z" fill="#9CE8F5" />
              <path d="M279 170C272 176 267 177 262 170C266 163 272 163 279 170Z" fill="#46B7D3" />
              <path d="M262 187C256 180 255 175 262 170C269 174 269 180 262 187Z" fill="#267D9C" />
              <path d="M245 170C252 164 257 163 262 170C258 177 252 177 245 170Z" fill="#D9F9FF" />
              <circle cx="262" cy="170" r="4" fill="#EAFDFF" />
            </g>
          </g>

          <path d="M89 79C111 49 164 38 219 49C265 58 292 82 294 110C296 142 265 166 219 176C165 187 109 173 83 143C63 120 65 99 89 79Z" fill="url(#droneHull)" stroke="#DBF8FF" strokeOpacity="0.76" strokeWidth="3" />
          <path d="M84 121C109 146 155 158 207 153C246 150 272 139 293 117C289 146 260 168 218 177C164 188 108 174 82 144C75 136 70 128 69 120C74 120 79 120 84 121Z" fill="url(#droneHullLower)" opacity="0.9" />

          <path d="M111 76C133 56 176 50 212 60C229 65 241 75 248 89C219 79 188 78 157 86C140 90 125 97 111 107C102 95 102 85 111 76Z" fill="url(#droneCanopy)" stroke="#D7FAFF" strokeOpacity="0.72" strokeWidth="2.5" />
          <path d="M128 72C153 58 190 58 214 68" fill="none" stroke="#F2FEFF" strokeOpacity="0.58" strokeWidth="3" strokeLinecap="round" />
          <path d="M151 86C171 78 198 78 219 85" fill="none" stroke="#9AEAF6" strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round" />

          <path d="M68 100C76 88 87 81 101 78L108 144C93 142 80 136 70 127C61 119 60 109 68 100Z" fill="#0B4C69" stroke="#B4F1FA" strokeOpacity="0.7" strokeWidth="3" />
          <circle cx="77" cy="105" r="8" fill="#E7FDFF" stroke="#67E8F9" strokeWidth="3" className="exploration-drone-lamp" />
          <circle cx="77" cy="129" r="8" fill="#D8FAFF" stroke="#38BDF8" strokeWidth="3" className="exploration-drone-lamp exploration-drone-lamp--delayed" />

          <path d="M117 132C145 146 196 148 231 134" fill="none" stroke="#D6F7FF" strokeOpacity="0.44" strokeWidth="2" strokeLinecap="round" />
          <path d="M136 157L142 170M190 162L193 177M236 151L242 164" stroke="#7AD5E8" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
          <path d="M124 116H223" stroke="#DDFBFF" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="7 9" />

          <g className="exploration-drone-status">
            <circle cx="245" cy="95" r="5" fill="#5EEAD4" />
            <circle cx="260" cy="102" r="3.5" fill="#BAF7FF" />
            <path d="M241 84C247 79 255 78 262 81" fill="none" stroke="#9AF4FF" strokeOpacity="0.72" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g className="exploration-drone-level-meter">
            <rect className="exploration-drone-level exploration-drone-level--1" x="232" y="113" width="7" height="5" rx="2.5" />
            <rect className="exploration-drone-level exploration-drone-level--2" x="242" y="111" width="7" height="7" rx="2.5" />
            <rect className="exploration-drone-level exploration-drone-level--3" x="252" y="108" width="7" height="10" rx="2.5" />
            <rect className="exploration-drone-level exploration-drone-level--4" x="262" y="104" width="7" height="14" rx="2.5" />
          </g>

          <path d="M167 47V34" stroke="#A9ECF7" strokeWidth="3" strokeLinecap="round" />
          <circle cx="167" cy="29" r="5" fill="#67E8F9" className="exploration-drone-beacon" />

          <g className="exploration-drone-bubbles">
            <circle cx="310" cy="85" r="4" />
            <circle cx="325" cy="72" r="2.5" />
            <circle cx="334" cy="54" r="3.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}
