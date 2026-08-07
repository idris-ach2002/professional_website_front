import useAnimationPreferences from "../contexts/useAnimationPreferences";
import useLanguage from "../localization/useLanguage";

const OPTIONS = ["auto", "full", "reduced", "off"];
const DESKTOP_MENU_KEY = "__animations";

function PreferenceIcon({ option }) {
  const paths = {
    auto: <path d="M12 4.2v2.1M12 17.7v2.1M4.2 12h2.1M17.7 12h2.1M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5M12 8.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z" />,
    full: <path d="M5.2 15.8 9.4 11.6l2.8 2.8 6.6-7M16.2 7.4h2.6V10" />,
    reduced: <path d="M6 16.8 9.6 13.2l2.7 2.7 5.7-5.7M5 8.2h8M5 11.6h5" />,
    off: <path d="M5.2 5.2 18.8 18.8M8 7.2h8.8v9.6H7.2V8" />,
    pause: <path d="M8.5 6v12M15.5 6v12" />,
    resume: <path d="m9 6 9 6-9 6V6Z" />,
  };

  return (
    <svg viewBox="0 0 24 24" className="dropdown-link-icon-svg" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {paths[option] ?? paths.auto}
      </g>
    </svg>
  );
}

function MobileControls({
  preference,
  setPreference,
  performanceMode,
  paused,
  togglePaused,
  animationsEnabled,
  systemReducedMotion,
  gpuTier,
  t,
}) {
  return (
    <div className="animation-preferences-panel" data-testid="animation-preferences-panel">
      <div className="animation-preferences-heading">
        <strong>{t("animations.title")}</strong>
        <span>{t(`animations.effective.${performanceMode}`)}</span>
      </div>
      <div className="animation-preferences-options" role="group" aria-label={t("animations.modeLabel")}>
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`animation-preference-option${preference === option ? " is-active" : ""}`}
            aria-pressed={preference === option}
            onClick={() => setPreference(option)}
          >
            {t(`animations.${option}`)}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="animation-pause-button"
        onClick={togglePaused}
        disabled={!animationsEnabled}
        aria-pressed={paused}
      >
        {paused ? t("animations.resume") : t("animations.pause")}
      </button>
      <div className="animation-preferences-status" role="status" aria-live="polite">
        {systemReducedMotion ? t("animations.systemOverride") : t("animations.gpuStatus", { tier: t(`animations.gpu.${gpuTier}`) })}
      </div>
    </div>
  );
}

export default function AnimationPreferences({ mobile = false, active = null, setActive = () => {} }) {
  const { t } = useLanguage();
  const {
    preference,
    setPreference,
    performanceMode,
    paused,
    togglePaused,
    animationsEnabled,
    systemReducedMotion,
    gpuTier,
  } = useAnimationPreferences();

  if (mobile) {
    return (
      <section className="animation-preferences-mobile" aria-label={t("animations.title")}>
        <MobileControls
          preference={preference}
          setPreference={setPreference}
          performanceMode={performanceMode}
          paused={paused}
          togglePaused={togglePaused}
          animationsEnabled={animationsEnabled}
          systemReducedMotion={systemReducedMotion}
          gpuTier={gpuTier}
          t={t}
        />
      </section>
    );
  }

  const open = active === DESKTOP_MENU_KEY;
  const statusText = systemReducedMotion
    ? t("animations.systemOverride")
    : t("animations.gpuStatus", { tier: t(`animations.gpu.${gpuTier}`) });

  return (
    <div
      className={`animation-preferences-control nav_menu-dropdown-toggle-v2 w-dropdown single align-right${open ? " is-open" : ""}`}
      onMouseEnter={() => setActive(DESKTOP_MENU_KEY)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(DESKTOP_MENU_KEY)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
      }}
    >
      <button
        type="button"
        className="animation-preferences-trigger dropdown1_toggle v2 w-dropdown-toggle"
        aria-label={t("animations.title")}
        aria-expanded={open}
        title={t("animations.openSettings")}
        onClick={() => setActive(open ? null : DESKTOP_MENU_KEY)}
      >
        <span>{t("animations.title")}</span>
        <svg viewBox="0 0 16 16" className="nav_menu-dropdown-arrow" aria-hidden="true">
          <path d="M4.4 6.2 8 9.8l3.6-3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <nav className="dropdown-list-v2 w-dropdown-list" aria-label={t("animations.title")}>
        <div className="dropdown-inside-wrap">
          <div className="dropdown-wrap">
            <div className="dropdown-column">
              <div className="dropdown-list-heading hide-tablet">{t("animations.modeLabel")}</div>
              <div className="animation-dropdown-options" role="group" aria-label={t("animations.modeLabel")}>
                {OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="dropdown-link animation-dropdown-option"
                    aria-pressed={preference === option}
                    onClick={() => setPreference(option)}
                  >
                    <span className="dropdown-link-icon"><PreferenceIcon option={option} /></span>
                    <span className="dropdown-link-copy">
                      <span className="dropdown-link-title-row">
                        <span className="dropdown-link-text">{t(`animations.${option}`)}</span>
                        {preference === option ? <span className="dropdown-link-badge">{t("nav.current")}</span> : null}
                      </span>
                      <span className="dropdown-link-description">{t(`animations.description.${option}`)}</span>
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="dropdown-link animation-dropdown-option animation-dropdown-pause"
                onClick={togglePaused}
                disabled={!animationsEnabled}
                aria-pressed={paused}
              >
                <span className="dropdown-link-icon"><PreferenceIcon option={paused ? "resume" : "pause"} /></span>
                <span className="dropdown-link-copy">
                  <span className="dropdown-link-title-row">
                    <span className="dropdown-link-text">{paused ? t("animations.resume") : t("animations.pause")}</span>
                  </span>
                  <span className="dropdown-link-description">{t("animations.pauseDescription")}</span>
                </span>
              </button>

              <div className="animation-dropdown-status" role="status" aria-live="polite">
                <strong>{t(`animations.effective.${performanceMode}`)}</strong>
                <span>{statusText}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
