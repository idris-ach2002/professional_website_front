const BRIDGES = Object.freeze({
  descent: Object.freeze({ id: "ocean-transition-deep", target: "deep" }),
  caldera: Object.freeze({ id: "ocean-transition-caldera", target: "caldera" }),
  projects: Object.freeze({ id: "ocean-transition-projects", target: "projects" }),
  "deep-projects": Object.freeze({ id: "ocean-transition-projects", target: "projects" }),
  crystal: Object.freeze({ id: "ocean-transition-outro", target: "outro" }),
  // Compatibility alias kept for older deep links/tests.
  treasure: Object.freeze({ id: "ocean-transition-outro", target: "outro" }),
  // Compatibility alias for older deep links/tests; intentionally has no ascent visual.
  ascent: Object.freeze({ id: "ocean-transition-outro", target: "outro" }),
});

/**
 * V21.20 — a world hand-off is a zero-visual gate.
 * It never occupies a decorative section in the page. IntersectionObserver
 * selects the next biome and OceanTransitionStage plays a fixed, autonomous
 * full-screen cinematic above the current content.
 */
export default function OceanWorldBridge({ variant }) {
  const config = BRIDGES[variant];
  if (!config) return null;

  return (
    <div
      id={config.id}
      className={`ocean-world-gate ocean-world-gate--${variant}`}
      data-world-bridge={variant}
      data-ocean-gate={config.target}
      aria-hidden="true"
    />
  );
}
