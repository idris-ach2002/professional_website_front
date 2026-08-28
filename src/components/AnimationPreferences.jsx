import { useState } from "react";
import {
  OCEAN_TRANSITION_CONTROLS,
  OCEAN_TRANSITION_PREFERENCE_KEYS,
} from "../animations/oceanTransitionPreferences";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import useLanguage from "../localization/useLanguage";

const GLOBAL_OPTIONS = ["auto", "full", "reduced", "off"];
const VOLCANO_MODES = ["auto", "animated", "static", "off"];
const VOLCANO_QUALITIES = ["auto", "eco", "balanced", "high"];
const MOTION_MODES = ["auto", "animated", "static"];
const DESKTOP_MENU_KEY = "__animations";

function label(t, key, fallback) {
  return t(key, { fallback });
}

function ActivationToggle({ checked }) {
  return (
    <span className="animation-activation-toggle" data-checked={checked ? "true" : "false"} aria-hidden="true">
      <span className="animation-activation-track" />
      <span className="animation-activation-thumb" />
    </span>
  );
}

function ModeMarker({ active }) {
  return (
    <span className="animation-mode-marker" data-active={active ? "true" : "false"} aria-hidden="true">
      {active ? <svg viewBox="0 0 16 16" focusable="false"><path d="m4.2 8.2 2.3 2.3 5.3-5.4" /></svg> : null}
    </span>
  );
}

function SegmentedModes({ value, options, onChange, labels, ariaLabel }) {
  return (
    <div className="animation-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? "is-active" : ""}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
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

function SwitchRow({ label: rowLabel, description, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      className="animation-switch-row"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span>
        <strong>{rowLabel}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <ActivationToggle checked={checked} />
    </button>
  );
}

function SectionGlyph({ type }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (type === "transitions") return <svg {...common}><path d="M3 9c3-4 6 4 9 0s6 4 9 0M3 15c3-4 6 4 9 0s6 4 9 0" /></svg>;
  if (type === "volcano") return <svg {...common}><path d="m4 20 5-10 3 4 3-7 5 13H4Z"/><path d="M11 6c-1.6-1.5.2-2.5.2-4M15 5c1.5-1.2-.1-2.2.3-3"/></svg>;
  if (type === "navbar") return <svg {...common}><path d="M5 19c4-6 7-10 11-15M8 15c-2-3-2-5-1-7 2 1 4 2 5 4M12 10c0-3 1-5 4-6 0 3-1 5-4 7"/></svg>;
  if (type === "profile") return <svg {...common}><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c1-4.2 3.2-6.3 6.5-6.3s5.5 2.1 6.5 6.3"/></svg>;
  return <svg {...common}><path d="M4 17v3h3M20 7V4h-3M6.3 17.7A8 8 0 0 1 17.7 6.3M17.7 6.3V4M17.7 6.3H20"/><path d="M9 13h2l1-4 2 7 1-3h2"/></svg>;
}

function SubmenuButton({ type, title, description, status, onClick }) {
  return (
    <button type="button" className="animation-submenu-button" onClick={onClick}>
      <span className="animation-submenu-icon"><SectionGlyph type={type} /></span>
      <span className="animation-submenu-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="animation-submenu-status">{status}</span>
      <span className="animation-submenu-chevron" aria-hidden="true">›</span>
    </button>
  );
}

function InternalHeader({ title, eyebrow, onBack }) {
  return (
    <header className="animation-internal-header">
      {onBack ? <button type="button" onClick={onBack} className="animation-internal-back" aria-label="Retour">‹</button> : null}
      <div><span>{eyebrow}</span><strong>{title}</strong></div>
    </header>
  );
}

export function AnimationControlCenter({ embedded = false }) {
  const { t } = useLanguage();
  const [view, setView] = useState("root");
  const preferences = useAnimationPreferences();
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
    scenePreferences,
    effectiveVolcanoMode,
    effectiveVolcanoQuality,
    effectiveNavbarMotion,
    effectiveProfileMotion,
    setVolcanoMode,
    setVolcanoQuality,
    setVolcanoEffect,
    setNavbarMotion,
    setProfileMotion,
    setProfileFrameEffect,
    setProfileFrameIntensity,
    resetScenePreferences,
  } = preferences;

  const masterEnabled = transitionPreferences[OCEAN_TRANSITION_PREFERENCE_KEYS.MASTER] !== false;
  const activeTransitions = OCEAN_TRANSITION_CONTROLS.filter((item) => transitionPreferences[item.key] !== false).length;
  const status = systemReducedMotion
    ? t("animations.systemOverride")
    : `${t(`animations.effective.${performanceMode}`)} · ${t("animations.gpuStatus", { tier: t(`animations.gpu.${gpuTier}`) })}`;

  const modeLabels = {
    auto: label(t, "animations.scene.auto", "Auto"),
    animated: label(t, "animations.scene.animated", "Animé"),
    static: label(t, "animations.scene.static", "Statique"),
    off: label(t, "animations.scene.off", "Désactivé"),
  };
  const qualityLabels = {
    auto: label(t, "animations.quality.auto", "Auto"),
    eco: label(t, "animations.quality.eco", "Éco"),
    balanced: label(t, "animations.quality.balanced", "Équilibrée"),
    high: label(t, "animations.quality.high", "Haute"),
  };

  return (
    <div className={`animation-preferences-panel${embedded ? " is-embedded" : ""}`} data-testid="animation-preferences-panel" data-animation-view={view}>
      {view === "root" ? (
        <>
          <header className="animation-preferences-heading">
            <div><strong>{t("animations.title")}</strong><span>{status}</span></div>
            <em>{label(t, "animations.settingsHint", "Réglages détaillés")}</em>
          </header>

          <section className="animation-preferences-section is-modes" aria-label={t("animations.modeLabel")}>
            <div className="animation-section-heading"><span>{t("animations.modeLabel")}</span></div>
            <div className="animation-mode-grid" role="group" aria-label={t("animations.modeLabel")}>
              {GLOBAL_OPTIONS.map((option) => (
                <ModeTile key={option} option={option} active={preference === option} onSelect={() => setPreference(option)} t={t} />
              ))}
            </div>
            <SwitchRow
              label={paused ? t("animations.resume") : t("animations.pause")}
              description={t("animations.pauseDescription")}
              checked={paused}
              onChange={togglePaused}
              disabled={!animationsEnabled}
            />
          </section>

          <section className="animation-preferences-section">
            <div className="animation-section-heading"><span>{label(t, "animations.settings", "Réglages")}</span></div>
            <div className="animation-submenu-list">
              <SubmenuButton type="transitions" title={label(t, "animations.submenu.transitions", "Transitions océaniques")} description={label(t, "animations.submenu.transitionsDescription", "Passages entre les univers")} status={masterEnabled ? `${activeTransitions}/5` : "Off"} onClick={() => setView("transitions")} />
              <SubmenuButton type="volcano" title={label(t, "animations.submenu.volcano", "Volcan sous-marin")} description={label(t, "animations.submenu.volcanoDescription", "Mode, qualité et effets")} status={label(t, `animations.scene.${effectiveVolcanoMode}`, effectiveVolcanoMode)} onClick={() => setView("volcano")} />
              <SubmenuButton type="navbar" title={label(t, "animations.submenu.navbar", "Navbar")} description={label(t, "animations.submenu.navbarDescription", "Mouvements de navigation")} status={label(t, `animations.scene.${effectiveNavbarMotion}`, effectiveNavbarMotion)} onClick={() => setView("navbar")} />
              <SubmenuButton type="profile" title={label(t, "animations.submenu.profile", "Profil Arctic Ink")} description={label(t, "animations.submenu.profileDescription", "Entrée et décor du profil")} status={label(t, `animations.scene.${effectiveProfileMotion}`, effectiveProfileMotion)} onClick={() => setView("profile")} />
              <SubmenuButton type="performance" title={label(t, "animations.submenu.performance", "Performance")} description={label(t, "animations.submenu.performanceDescription", "État runtime et protections")} status={t(`animations.effective.${performanceMode}`)} onClick={() => setView("performance")} />
            </div>
          </section>
        </>
      ) : null}

      {view === "transitions" ? (
        <section className="animation-subview">
          <InternalHeader title={label(t, "animations.submenu.transitions", "Transitions océaniques")} eyebrow={t("animations.title")} onBack={() => setView("root")} />
          <div className="animation-switch-list">
            <SwitchRow label={t("animations.transitionsMaster")} description={t("animations.transitionsMasterDescription")} checked={masterEnabled} onChange={(enabled) => setTransitionEnabled(OCEAN_TRANSITION_PREFERENCE_KEYS.MASTER, enabled)} />
            {OCEAN_TRANSITION_CONTROLS.map((item) => (
              <SwitchRow key={item.key} label={t(item.labelKey)} description={t(item.descriptionKey)} checked={transitionPreferences[item.key] !== false} disabled={!masterEnabled} onChange={(enabled) => setTransitionEnabled(item.key, enabled)} />
            ))}
          </div>
          <button type="button" className="animation-reset-button" onClick={resetTransitionPreferences}>{t("animations.transitionsReset")}</button>
        </section>
      ) : null}

      {view === "volcano" ? (
        <section className="animation-subview">
          <InternalHeader title={label(t, "animations.submenu.volcano", "Volcan sous-marin")} eyebrow={t("animations.title")} onBack={() => setView("root")} />
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.volcano.mode", "Mode")}</span></div>
            <SegmentedModes value={scenePreferences.volcanoMode} options={VOLCANO_MODES} onChange={setVolcanoMode} labels={modeLabels} ariaLabel={label(t, "animations.volcano.modeAria", "Mode du volcan")} />
          </div>
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.volcano.quality", "Qualité")}</span></div>
            <SegmentedModes value={scenePreferences.volcanoQuality} options={VOLCANO_QUALITIES} onChange={setVolcanoQuality} labels={qualityLabels} ariaLabel={label(t, "animations.volcano.qualityAria", "Qualité du volcan")} />
          </div>
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.volcano.effects", "Effets")}</span></div>
            <div className="animation-switch-list is-compact">
              <SwitchRow label={label(t, "animations.volcano.smoke", "Fumée")} checked={scenePreferences.volcanoEffects.smoke} onChange={(enabled) => setVolcanoEffect("smoke", enabled)} />
              <SwitchRow label={label(t, "animations.volcano.embers", "Braises")} checked={scenePreferences.volcanoEffects.embers} onChange={(enabled) => setVolcanoEffect("embers", enabled)} />
              <SwitchRow label={label(t, "animations.volcano.bubbles", "Bulles")} checked={scenePreferences.volcanoEffects.bubbles} onChange={(enabled) => setVolcanoEffect("bubbles", enabled)} />
              <SwitchRow label={label(t, "animations.volcano.debris", "Débris")} checked={scenePreferences.volcanoEffects.debris} onChange={(enabled) => setVolcanoEffect("debris", enabled)} />
            </div>
          </div>
          <div className="animation-effective-card">
            <span>{label(t, "animations.effectiveLabel", "État effectif")}</span>
            <strong>{label(t, `animations.scene.${effectiveVolcanoMode}`, effectiveVolcanoMode)} · {label(t, `animations.quality.${effectiveVolcanoQuality}`, effectiveVolcanoQuality)}</strong>
            <small>{label(t, "animations.volcano.safety", "Les protections GPU et mémoire restent toujours actives.")}</small>
          </div>
        </section>
      ) : null}

      {view === "navbar" ? (
        <section className="animation-subview">
          <InternalHeader title={label(t, "animations.submenu.navbar", "Navbar")} eyebrow={t("animations.title")} onBack={() => setView("root")} />
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.motion", "Animation")}</span></div>
            <SegmentedModes value={scenePreferences.navbarMotion} options={MOTION_MODES} onChange={setNavbarMotion} labels={modeLabels} ariaLabel={label(t, "animations.submenu.navbar", "Navbar")} />
          </div>
          <div className="animation-effective-card"><span>{label(t, "animations.effectiveLabel", "État effectif")}</span><strong>{label(t, `animations.scene.${effectiveNavbarMotion}`, effectiveNavbarMotion)}</strong><small>{label(t, "animations.navbar.safety", "La navigation reste utilisable même quand le mouvement est coupé.")}</small></div>
        </section>
      ) : null}

      {view === "profile" ? (
        <section className="animation-subview">
          <InternalHeader title={label(t, "animations.submenu.profile", "Profil Arctic Ink")} eyebrow={t("animations.title")} onBack={() => setView("root")} />
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.motion", "Animation")}</span></div>
            <SegmentedModes value={scenePreferences.profileMotion} options={MOTION_MODES} onChange={setProfileMotion} labels={modeLabels} ariaLabel={label(t, "animations.profile.motionAria", "Animation du profil Arctic Ink")} />
          </div>
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.profile.frame", "Cadre photo")}</span></div>
            <div className="animation-switch-list">
              <SwitchRow label={label(t, "animations.profile.reflection", "Reflet du cadre")} description={label(t, "animations.profile.reflectionDescription", "Reflet spéculaire lent sur le double liseré")} checked={scenePreferences.profileFrame.reflection} onChange={(enabled) => setProfileFrameEffect("reflection", enabled)} />
              <SwitchRow label={label(t, "animations.profile.parallax", "Parallaxe au curseur")} description={label(t, "animations.profile.parallaxDescription", "Inclinaison très légère pilotée par la souris")} checked={scenePreferences.profileFrame.parallax} onChange={(enabled) => setProfileFrameEffect("parallax", enabled)} />
              <SwitchRow label={label(t, "animations.profile.featherMotion", "Réaction de la plume")} description={label(t, "animations.profile.featherMotionDescription", "Micro-mouvement lorsque le reflet atteint la plume")} checked={scenePreferences.profileFrame.featherMotion} onChange={(enabled) => setProfileFrameEffect("featherMotion", enabled)} />
            </div>
          </div>
          <div className="animation-control-block">
            <div className="animation-section-heading"><span>{label(t, "animations.profile.intensity", "Intensité")}</span></div>
            <SegmentedModes
              value={scenePreferences.profileFrame.intensity}
              options={["subtle", "elegant", "expressive"]}
              onChange={setProfileFrameIntensity}
              labels={{
                subtle: label(t, "animations.profile.intensitySubtle", "Discrète"),
                elegant: label(t, "animations.profile.intensityElegant", "Élégante"),
                expressive: label(t, "animations.profile.intensityExpressive", "Expressive"),
              }}
              ariaLabel={label(t, "animations.profile.intensityAria", "Intensité du cadre Arctic Ink")}
            />
          </div>
          <div className="animation-effective-card"><span>{label(t, "animations.effectiveLabel", "État effectif")}</span><strong>{label(t, `animations.scene.${effectiveProfileMotion}`, effectiveProfileMotion)} · {label(t, `animations.profile.intensity${scenePreferences.profileFrame.intensity[0].toUpperCase()}${scenePreferences.profileFrame.intensity.slice(1)}`, scenePreferences.profileFrame.intensity)}</strong><small>{label(t, "animations.profile.safety", "Le cadre Arctic Ink respecte automatiquement les modes réduit et statique.")}</small></div>
        </section>
      ) : null}

      {view === "performance" ? (
        <section className="animation-subview">
          <InternalHeader title={label(t, "animations.submenu.performance", "Performance")} eyebrow={t("animations.title")} onBack={() => setView("root")} />
          <div className="animation-runtime-grid">
            <div><span>{label(t, "animations.runtime.profile", "Profil")}</span><strong>{t(`animations.effective.${performanceMode}`)}</strong></div>
            <div><span>GPU</span><strong>{t(`animations.gpu.${gpuTier}`)}</strong></div>
            <div><span>{label(t, "animations.runtime.volcano", "Volcan")}</span><strong>{label(t, `animations.scene.${effectiveVolcanoMode}`, effectiveVolcanoMode)}</strong></div>
            <div><span>{label(t, "animations.runtime.quality", "Qualité")}</span><strong>{label(t, `animations.quality.${effectiveVolcanoQuality}`, effectiveVolcanoQuality)}</strong></div>
          </div>
          <div className="animation-protection-list">
            {[label(t, "animations.protection.viewport", "Pause hors écran"), label(t, "animations.protection.hidden", "Pause onglet masqué"), label(t, "animations.protection.memory", "Protection mémoire"), label(t, "animations.protection.webgl", "Récupération WebGL")].map((item) => <div key={item}><span>✓</span><strong>{item}</strong><em>{label(t, "animations.locked", "Toujours actif")}</em></div>)}
          </div>
          <button type="button" className="animation-reset-button" onClick={resetScenePreferences}>{label(t, "animations.resetScenes", "Réinitialiser les scènes")}</button>
        </section>
      ) : null}

      {view === "root" ? <footer className="animation-control-footer"><span>{status}</span></footer> : null}
    </div>
  );
}

export default function AnimationPreferences({ mobile = false, active = null, setActive = () => {} }) {
  const { t } = useLanguage();

  if (mobile) {
    return <section className="animation-preferences-mobile" aria-label={t("animations.title")}><AnimationControlCenter /></section>;
  }

  const open = active === DESKTOP_MENU_KEY;
  return (
    <div
      className={`animation-preferences-control nav_menu-dropdown-toggle-v2 w-dropdown single align-right${open ? " is-open" : ""}`}
      onMouseEnter={() => setActive(DESKTOP_MENU_KEY)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(DESKTOP_MENU_KEY)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null); }}
    >
      <button type="button" data-testid="animation-preferences-trigger" className="animation-preferences-trigger dropdown1_toggle v2 w-dropdown-toggle" aria-label={t("animations.title")} aria-expanded={open} title={t("animations.openSettings")} onClick={() => setActive(open ? null : DESKTOP_MENU_KEY)}>
        <span>{t("animations.title")}</span>
        <svg viewBox="0 0 16 16" className="nav_menu-dropdown-arrow" aria-hidden="true"><path d="M4.4 6.2 8 9.8l3.6-3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <nav className="dropdown-list-v2 w-dropdown-list" aria-label={t("animations.title")}><div className="dropdown-inside-wrap"><AnimationControlCenter /></div></nav>
    </div>
  );
}
