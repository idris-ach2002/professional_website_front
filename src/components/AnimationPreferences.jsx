import {
  OCEAN_TRANSITION_CONTROLS,
  OCEAN_TRANSITION_PREFERENCE_KEYS,
} from "../animations/oceanTransitionPreferences";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import useLanguage from "../localization/useLanguage";

const OPTIONS = ["auto", "full", "reduced", "off"];
const DESKTOP_MENU_KEY = "__animations";

function ActivationToggle({ checked }) {
  return (
    <span
      className="animation-activation-toggle"
      data-checked={checked ? "true" : "false"}
      aria-hidden="true"
    >
      <span className="animation-activation-track" />
      <span className="animation-activation-thumb" />
    </span>
  );
}

function ModeMarker({ active }) {
  return (
    <span
      className="animation-mode-marker"
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    >
      {active ? (
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="m4.2 8.2 2.3 2.3 5.3-5.4" />
        </svg>
      ) : null}
    </span>
  );
}

function ModeTile({ option, active, onSelect, t }) {
  return (
    <button
      type="button"
      className={`animation-control-tile is-mode${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className="animation-mode-copy">
        <strong>{t(`animations.${option}`)}</strong>
        <small>{t(`animations.description.${option}`)}</small>
      </span>
      <ModeMarker active={active} />
    </button>
  );
}

function TransitionSwitch({
  label,
  description,
  checked,
  onChange,
  masterOff = false,
  featured = false,
}) {
  return (
    <button
      type="button"
      className={`animation-control-tile is-transition${featured ? " is-featured" : ""}`}
      role="switch"
      aria-checked={checked}
      data-master-off={masterOff ? "true" : "false"}
      onClick={() => onChange(!checked)}
    >
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <ActivationToggle checked={checked} />
    </button>
  );
}

function ControlCenter({ t }) {
  const {
    preference,
    setPreference,
    performanceMode,
    paused,
    togglePaused,
    animationsEnabled,
    systemReducedMotion,
    gpuTier,
    transitionPreferences,
    setTransitionEnabled,
    resetTransitionPreferences,
  } = useAnimationPreferences();

  const masterEnabled = transitionPreferences[OCEAN_TRANSITION_PREFERENCE_KEYS.MASTER] !== false;
  const activeTransitions = OCEAN_TRANSITION_CONTROLS.filter(
    (item) => transitionPreferences[item.key] !== false,
  ).length;

  const status = systemReducedMotion
    ? t("animations.systemOverride")
    : `${t(`animations.effective.${performanceMode}`)} · ${t("animations.gpuStatus", { tier: t(`animations.gpu.${gpuTier}`) })}`;

  return (
    <div className="animation-preferences-panel" data-testid="animation-preferences-panel">
      <header className="animation-preferences-heading">
        <div>
          <strong>{t("animations.title")}</strong>
          <span>{status}</span>
        </div>
        <em>
          {masterEnabled
            ? t("animations.transitionsActiveCount", { count: activeTransitions })
            : t("animations.transitionsMasterOff")}
        </em>
      </header>

      <section className="animation-preferences-section is-modes" aria-label={t("animations.modeLabel")}>
        <div className="animation-section-heading">
          <span>{t("animations.modeLabel")}</span>
        </div>
        <div className="animation-mode-grid" role="group" aria-label={t("animations.modeLabel")}>
          {OPTIONS.map((option) => (
            <ModeTile
              key={option}
              option={option}
              active={preference === option}
              onSelect={() => setPreference(option)}
              t={t}
            />
          ))}
        </div>
      </section>

      <section className="animation-preferences-section is-transitions">
        <div className="animation-section-heading">
          <span>{t("animations.transitionsMaster")}</span>
        </div>

        <div className="animation-transition-grid">
          <button
            type="button"
            className="animation-control-tile is-pause is-featured"
            onClick={togglePaused}
            disabled={!animationsEnabled}
            aria-pressed={paused}
          >
            <span>
              <strong>{paused ? t("animations.resume") : t("animations.pause")}</strong>
              <small>{t("animations.pauseDescription")}</small>
            </span>
            <ActivationToggle checked={paused} />
          </button>

          <TransitionSwitch
            featured
            label={t("animations.transitionsMaster")}
            description={t("animations.transitionsMasterDescription")}
            checked={masterEnabled}
            onChange={(enabled) => setTransitionEnabled(
              OCEAN_TRANSITION_PREFERENCE_KEYS.MASTER,
              enabled,
            )}
          />

          {OCEAN_TRANSITION_CONTROLS.map((item) => (
            <TransitionSwitch
              key={item.key}
              label={t(item.labelKey)}
              description={t(item.descriptionKey)}
              checked={transitionPreferences[item.key] !== false}
              masterOff={!masterEnabled}
              onChange={(enabled) => setTransitionEnabled(item.key, enabled)}
            />
          ))}
        </div>
      </section>

      <footer className="animation-control-footer">
        <span>{status}</span>
        <button type="button" onClick={resetTransitionPreferences}>
          {t("animations.transitionsReset")}
        </button>
      </footer>
    </div>
  );
}

export default function AnimationPreferences({
  mobile = false,
  active = null,
  setActive = () => {},
}) {
  const { t } = useLanguage();

  if (mobile) {
    return (
      <section className="animation-preferences-mobile" aria-label={t("animations.title")}>
        <ControlCenter t={t} />
      </section>
    );
  }

  const open = active === DESKTOP_MENU_KEY;

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
        data-testid="animation-preferences-trigger"
        className="animation-preferences-trigger dropdown1_toggle v2 w-dropdown-toggle"
        aria-label={t("animations.title")}
        aria-expanded={open}
        title={t("animations.openSettings")}
        onClick={() => setActive(open ? null : DESKTOP_MENU_KEY)}
      >
        <span>{t("animations.title")}</span>
        <svg
          viewBox="0 0 16 16"
          className="nav_menu-dropdown-arrow"
          aria-hidden="true"
        >
          <path
            d="M4.4 6.2 8 9.8l3.6-3.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <nav className="dropdown-list-v2 w-dropdown-list" aria-label={t("animations.title")}>
        <div className="dropdown-inside-wrap">
          <ControlCenter t={t} />
        </div>
      </nav>
    </div>
  );
}
