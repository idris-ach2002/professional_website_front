import { useEffect, useRef, useState } from "react";
import {
  OCEAN_TRANSITION_CONTROLS,
  OCEAN_TRANSITION_PREFERENCE_KEYS,
} from "../../animations/oceanTransitionPreferences";
import useAnimationPreferences from "../../contexts/useAnimationPreferences";

const CONTACT_KEY = "__command-contact";
const OPTIONS_KEY = "__command-options";
const ANIMATION_OPTIONS = ["auto", "full", "reduced", "off"];

function UtilityIcon({ type }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
  };
  const paths = {
    contact: <>
      <path className="nav-command-contact-signal" d="M1.8 12h3.2" />
      <circle className="nav-command-contact-pulse" cx="2.2" cy="12" r=".9" fill="currentColor" stroke="none" />
      <path className="nav-command-envelope-body" d="M5 7.2h14.3v9.6H5V7.2Z" />
      <path className="nav-command-envelope-flap" d="m5.4 7.6 6.75 5 6.75-5" />
    </>,
    settings: <>
      <circle className="nav-command-dial-outer" cx="12" cy="12" r="7.6" />
      <circle className="nav-command-dial-inner" cx="12" cy="12" r="3.25" />
      <path className="nav-command-dial-ticks" d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.35 5.35l1.42 1.42M17.23 17.23l1.42 1.42M18.65 5.35l-1.42 1.42M6.77 17.23l-1.42 1.42" />
      <path className="nav-command-dial-needle" d="M12 12 15.4 9.6" />
    </>,
    recruiter: <path d="M12 11.4a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.2 19.5c1.15-3.2 3.42-4.8 6.8-4.8s5.65 1.6 6.8 4.8" />,
    animation: <path d="M12 3.8 13.8 9l5.4 1.8-5.4 1.8L12 18l-1.8-5.4-5.4-1.8L10.2 9 12 3.8Zm6.2 11.7.7 2 .7-2 2-.7-2-.7-.7-2-.7 2-2 .7 2 .7Z" />,
    language: <path d="M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Zm0 0c2 2.1 3.05 4.7 3.05 7.8S14 17.7 12 19.8M12 4.2C10 6.3 8.95 8.9 8.95 12S10 17.7 12 19.8M4.6 9.4h14.8M4.6 14.6h14.8" />,
    back: <path d="m14.8 5.2-6.8 6.8 6.8 6.8" />,
    arrow: <path d="M7 17 17 7m-7 0h7v7" />,
    reset: <path d="M6.4 7.3A7 7 0 1 1 5 12m1.4-4.7V3.8m0 3.5H10" />,
  };

  return (
    <svg {...common} className={`nav-command-icon nav-command-icon--${type}`}>
      <g stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        {paths[type] ?? paths.settings}
      </g>
    </svg>
  );
}

function CvLogo() {
  return (
    <svg className="nav-command-cv-logo" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
        <path className="nav-cv-sheet" d="M6.25 3.75h10.2l5.3 5.3v15.2H6.25V3.75Z" />
        <path className="nav-cv-fold" d="M16.45 3.75v5.3h5.3" />
        <g className="nav-cv-monogram">
          <path d="M12.1 12.1c-.62-.72-1.42-1.08-2.38-1.08-1.82 0-3.05 1.28-3.05 3.18s1.23 3.18 3.05 3.18c.96 0 1.76-.36 2.38-1.08" transform="translate(2.1 -.2) scale(.72)" />
          <path d="m14.4 11.05 2.1 6.15 2.15-6.15" transform="translate(1.4 -.2) scale(.72)" />
        </g>
        <g className="nav-cv-preview">
          <circle cx="10" cy="12.1" r="1.25" />
          <path d="M8.2 15.2h3.6M14.4 11.4h4.1M14.4 14.1h4.1M8.2 18.4h10.3M8.2 20.8h7.2" />
        </g>
      </g>
    </svg>
  );
}

function CommandSwitch({ checked, label, onChange, disabled = false }) {
  return (
    <button
      type="button"
      className="nav-command-switch-row"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className="nav-command-switch" data-checked={checked ? "true" : "false"} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function PanelHeader({ title, eyebrow, onBack, onClose, closeLabel }) {
  return (
    <header className="nav-command-panel-header">
      <div className="nav-command-panel-heading">
        {onBack ? (
          <button type="button" className="nav-command-back" onClick={onBack} aria-label={eyebrow}>
            <UtilityIcon type="back" />
          </button>
        ) : null}
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
        </div>
      </div>
      <button type="button" className="nav-command-close" onClick={onClose} aria-label={closeLabel}>×</button>
    </header>
  );
}

function RootView({ t, language, animationPerformanceMode, onView, showRecruiter, showAnimations, showLanguage }) {
  return (
    <div className="nav-command-panel-view is-root" data-command-view="root">
      <div className="nav-command-option-list">
        {showRecruiter ? (
          <button type="button" className="nav-command-option" data-command-tone="recruiter" onClick={() => onView("recruiter")}>
            <span className="nav-command-option-icon"><UtilityIcon type="recruiter" /></span>
            <span className="nav-command-option-copy">
              <strong>{t("nav.recruiter")}</strong>
              <small>{t("recruiter.title")}</small>
            </span>
            <span className="nav-command-chevron" aria-hidden="true">›</span>
          </button>
        ) : null}
        {showAnimations ? (
          <button type="button" className="nav-command-option animation-preferences-control" data-command-tone="animations" data-testid="animation-preferences-trigger" aria-label={t("animations.title")} onClick={() => onView("animations")}>
            <span className="nav-command-option-icon"><UtilityIcon type="animation" /></span>
            <span className="nav-command-option-copy">
              <strong>{t("animations.title")}</strong>
              <small>{t(`animations.effective.${animationPerformanceMode}`)}</small>
            </span>
            <span className="nav-command-chevron" aria-hidden="true">›</span>
          </button>
        ) : null}
        {showLanguage ? (
          <button type="button" className="nav-command-option" data-command-tone="language" onClick={() => onView("language")}>
            <span className="nav-command-option-icon"><UtilityIcon type="language" /></span>
            <span className="nav-command-option-copy">
              <strong>{t("language.title")}</strong>
              <small>{language === "fr" ? t("language.french") : t("language.english")}</small>
            </span>
            <span className="nav-command-language-code">{language.toUpperCase()}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RecruiterView({ t, recruiterHref }) {
  return (
    <div className="nav-command-panel-view" data-command-view="recruiter">
      <p className="nav-command-intro">{t("recruiter.intro")}</p>
      <div className="nav-command-proof-list">
        {[t("recruiter.experience"), t("recruiter.provenSkills"), t("recruiter.projects")].map((label) => (
          <div key={label}><span aria-hidden="true">✓</span><span>{label}</span></div>
        ))}
      </div>
      <a href={recruiterHref} className="nav-command-primary-action">
        <span>{t("nav.recruiter")}</span><UtilityIcon type="arrow" />
      </a>
    </div>
  );
}

function AnimationsView({ t, preferences }) {
  const {
    preference,
    setPreference,
    paused,
    togglePaused,
    animationsEnabled,
    systemReducedMotion,
    transitionPreferences,
    setTransitionEnabled,
    resetTransitionPreferences,
  } = preferences;
  const masterKey = OCEAN_TRANSITION_PREFERENCE_KEYS.MASTER;
  const masterEnabled = transitionPreferences[masterKey] !== false;
  const selectedDescription = t(`animations.description.${preference}`);

  return (
    <div className="nav-command-panel-view animation-preferences-control" data-command-view="animations">
      <div className="nav-command-mode-grid" role="group" aria-label={t("animations.modeLabel")}>
        {ANIMATION_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`nav-command-mode${preference === option ? " is-active" : ""}`}
            aria-pressed={preference === option}
            onClick={() => setPreference(option)}
          >
            <strong>{t(`animations.short.${option}`)}</strong>
            <small>{t(`animations.${option}`)}</small>
          </button>
        ))}
      </div>
      <p className="nav-command-mode-description">{selectedDescription}</p>
      {systemReducedMotion ? <p className="nav-command-system-note">{t("animations.systemOverride")}</p> : null}

      <div className="nav-command-control-section">
        <CommandSwitch checked={paused} label={paused ? t("animations.resume") : t("animations.pause")} onChange={togglePaused} disabled={!animationsEnabled} />
      </div>

      <div className="nav-command-section-heading">
        <span>{t("animations.transitionsLabel")}</span>
        <small>{masterEnabled ? t("animations.transitionsActiveCount", { count: OCEAN_TRANSITION_CONTROLS.filter((item) => transitionPreferences[item.key] !== false).length }) : t("animations.transitionsMasterOff")}</small>
      </div>
      <div className="nav-command-transition-list">
        <CommandSwitch
          checked={masterEnabled}
          label={t("animations.transitionsMaster")}
          onChange={(enabled) => setTransitionEnabled(masterKey, enabled)}
        />
        {OCEAN_TRANSITION_CONTROLS.map((item) => (
          <CommandSwitch
            key={item.key}
            checked={transitionPreferences[item.key] !== false}
            label={t(item.labelKey)}
            disabled={!masterEnabled}
            onChange={(enabled) => setTransitionEnabled(item.key, enabled)}
          />
        ))}
      </div>
      <button type="button" className="nav-command-reset" onClick={resetTransitionPreferences}>
        <UtilityIcon type="reset" /><span>{t("animations.transitionsReset")}</span>
      </button>
    </div>
  );
}

function LanguageView({ language, setLanguage, t, close }) {
  const options = [
    { code: "fr", label: t("language.french"), description: t("language.frenchDescription") },
    { code: "en", label: t("language.english"), description: t("language.englishDescription") },
  ];
  return (
    <div className="nav-command-panel-view" data-command-view="language">
      <div className="nav-command-language-list" role="group" aria-label={t("language.selectorLabel")}>
        {options.map((option) => (
          <button
            key={option.code}
            type="button"
            className={`nav-command-language-option${language === option.code ? " is-active" : ""}`}
            aria-pressed={language === option.code}
            onClick={() => {
              setLanguage(option.code);
              close();
            }}
          >
            <span className="nav-command-language-radio" aria-hidden="true" />
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
            <em>{option.code.toUpperCase()}</em>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactView({ t, contactHref, emailHref, linkedinHref }) {
  return (
    <div className="nav-command-panel-view is-contact" data-command-view="contact">
      <p className="nav-command-intro">{t("footer.description")}</p>
      <div className="nav-command-contact-links">
        <a href={emailHref}><span className="nav-command-option-icon"><UtilityIcon type="contact" /></span><span>{t("contact.EMAIL")}</span><UtilityIcon type="arrow" /></a>
        <a href={linkedinHref} target={linkedinHref?.startsWith("http") ? "_blank" : undefined} rel={linkedinHref?.startsWith("http") ? "noreferrer" : undefined}><span className="nav-command-option-icon"><UtilityIcon type="recruiter" /></span><span>LinkedIn</span><UtilityIcon type="arrow" /></a>
      </div>
      <a href={contactHref} className="nav-command-primary-action"><span>{t("hero.contact")}</span><UtilityIcon type="arrow" /></a>
    </div>
  );
}

export default function CommandUtilities({
  active,
  setActive,
  contactHref,
  emailHref,
  linkedinHref,
  recruiterHref,
  cvHref,
  language,
  setLanguage,
  isVisible,
  t,
}) {
  const wrapperRef = useRef(null);
  const [view, setView] = useState("root");
  const [viewMotion, setViewMotion] = useState("forward");
  const preferences = useAnimationPreferences();
  const contactOpen = active === CONTACT_KEY;
  const optionsOpen = active === OPTIONS_KEY;
  const anyOpen = contactOpen || optionsOpen;
  const closeLabel = language === "en" ? "Close" : "Fermer";
  const optionsLabel = language === "en" ? "Options" : "Options";

  const openView = (nextView) => {
    setViewMotion(nextView === "root" ? "back" : "forward");
    setView(nextView);
  };

  useEffect(() => {
    if (!anyOpen) return undefined;
    const closeOnPointer = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setActive(null);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (optionsOpen && view !== "root") { setViewMotion("back"); setView("root"); }
      else setActive(null);
    };
    document.addEventListener("pointerdown", closeOnPointer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [anyOpen, optionsOpen, setActive, view]);

  const viewTitle = view === "animations"
    ? t("animations.title")
    : view === "language"
      ? t("language.title")
      : view === "recruiter"
        ? t("nav.recruiter")
        : optionsLabel;

  return (
    <div ref={wrapperRef} className="nav-command-utilities nav_island nav_island--actions" data-nav-zone="actions">
      <span className="nav-command-zone-signal" aria-hidden="true"><span /></span>
      <div className="nav-command-cluster" role="group" aria-label={t("nav.mainLabel")}>
        {isVisible("global.navbar.contact") ? (
          <button
            type="button"
            className={`nav-command-trigger is-contact${contactOpen ? " is-active" : ""}`}
            aria-label={t("nav.contact")}
            title={t("nav.contact")}
            aria-expanded={contactOpen}
            onClick={() => setActive(contactOpen ? null : CONTACT_KEY)}
          >
            <UtilityIcon type="contact" />
            <span className="nav-command-trigger-label">{t("nav.contact")}</span>
          </button>
        ) : null}
        {(isVisible("global.navbar.recruiter") || isVisible("global.navbar.animations") || isVisible("global.navbar.language")) ? (
          <button
            type="button"
            className={`nav-command-trigger is-options${optionsOpen ? " is-active" : ""}`}
            aria-label={optionsLabel}
            title={optionsLabel}
            aria-expanded={optionsOpen}
            data-testid="command-options-trigger"
            onClick={() => {
              if (optionsOpen) setActive(null);
              else {
                setViewMotion("forward");
                setView("root");
                setActive(OPTIONS_KEY);
              }
            }}
          >
            <UtilityIcon type="settings" />
            <span className="nav-command-trigger-label">{optionsLabel}</span>
          </button>
        ) : null}
      </div>

      {isVisible("global.navbar.cv") ? (
        <a
          id="nav-download"
          href={cvHref}
          target={cvHref?.startsWith("http") ? "_blank" : undefined}
          rel={cvHref?.startsWith("http") ? "noreferrer" : undefined}
          className="nav-command-cv"
          aria-label={t("nav.downloadCv")}
        >
          <CvLogo />
          <span className="nav-command-cv-label">CV</span>
          <UtilityIcon type="arrow" />
        </a>
      ) : null}

      {contactOpen ? (
        <section className="nav-command-panel is-contact-panel" data-command-tone="contact" data-command-view="contact" role="dialog" aria-label={t("nav.contact")}>
          <span className="nav-command-panel-spectrum" aria-hidden="true" />
          <PanelHeader title={t("nav.contact")} eyebrow={t("nav.contact")} onClose={() => setActive(null)} closeLabel={closeLabel} />
          <ContactView t={t} contactHref={contactHref} emailHref={emailHref} linkedinHref={linkedinHref} />
        </section>
      ) : null}

      {optionsOpen ? (
        <section className="nav-command-panel is-options-panel" data-command-tone={view} data-command-view={view} data-command-motion={viewMotion} role="dialog" aria-label={optionsLabel}>
          <span className="nav-command-panel-spectrum" aria-hidden="true" />
          <PanelHeader
            title={viewTitle}
            eyebrow={view === "root" ? optionsLabel.toUpperCase() : optionsLabel}
            onBack={view === "root" ? null : () => openView("root")}
            onClose={() => {
              setViewMotion("back");
              setView("root");
              setActive(null);
            }}
            closeLabel={closeLabel}
          />
          {view === "root" ? (
            <RootView
              t={t}
              language={language}
              animationPerformanceMode={preferences.performanceMode}
              onView={openView}
              showRecruiter={isVisible("global.navbar.recruiter")}
              showAnimations={isVisible("global.navbar.animations")}
              showLanguage={isVisible("global.navbar.language")}
            />
          ) : null}
          {view === "recruiter" ? <RecruiterView t={t} recruiterHref={recruiterHref} /> : null}
          {view === "animations" ? <AnimationsView t={t} preferences={preferences} /> : null}
          {view === "language" ? <LanguageView language={language} setLanguage={setLanguage} t={t} close={() => setActive(null)} /> : null}
        </section>
      ) : null}
    </div>
  );
}
