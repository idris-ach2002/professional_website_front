import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import OrganizationBrand from "../OrganizationBrand";
import useLanguage from "../../localization/useLanguage";
import { normalizeUrl } from "../../utils/portfolio";

const EMPTY = Object.freeze({ experience: null, missionNumber: "", period: "", depth: "" });

const TimelineDetailSheet = forwardRef(function TimelineDetailSheet(_, ref) {
  const { t } = useLanguage();
  const [payload, setPayload] = useState(EMPTY);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const open = Boolean(payload.experience);

  useImperativeHandle(ref, () => ({
    open(experience, meta = {}, trigger = null) {
      triggerRef.current = trigger;
      setPayload({ experience, missionNumber: meta.missionNumber ?? "", period: meta.period ?? "", depth: meta.depth ?? "" });
    },
    close() {
      setPayload(EMPTY);
    },
  }), []);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    const onKeyDown = (event) => {
      if (event.key === "Escape") setPayload(EMPTY);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const experience = payload.experience;

  return (
    <div className={`timeline-detail-shell${open ? " is-open" : ""}`} aria-hidden={open ? "false" : "true"}>
      <div className="timeline-detail-backdrop" aria-hidden="true" onClick={() => setPayload(EMPTY)} />
      <aside className="timeline-detail-sheet" role="dialog" aria-modal="true" aria-label={experience ? `${t("timeline.mission")} ${payload.missionNumber} — ${experience.title}` : t("timeline.details")}>
        <div className="timeline-detail-grabber" aria-hidden="true" />
        <button ref={closeRef} type="button" className="timeline-detail-close" onClick={() => setPayload(EMPTY)} aria-label={t("timeline.closeDetails")}>×</button>
        <div className="timeline-detail-kicker"><span>{t("timeline.mission")} {payload.missionNumber}</span><strong>{payload.depth}</strong></div>
        <header className="timeline-detail-header">
          <div>
            <h3>{experience?.title || "—"}</h3>
            {experience?.organization && <OrganizationBrand organization={experience.organization} compact />}
          </div>
          <span>{payload.period}</span>
        </header>
        {experience?.imageUrl && <div className="timeline-image-preview-trigger timeline-detail-image"><img className="timeline-image" src={experience.imageUrl} alt="" loading="lazy" /></div>}
        {experience?.summary && <p className="timeline-detail-lead">{experience.summary}</p>}
        {experience?.description && <section><h4>{t("timeline.missionBrief")}</h4><p className="timeline-description">{experience.description}</p></section>}
        {experience?.skills?.length > 0 && <section><h4>{t("timeline.systems")}</h4><div className="timeline-detail-skills">{experience.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>}
        {experience?.websiteUrl && <a className="timeline-detail-resource timeline-link" href={normalizeUrl(experience.websiteUrl)} target="_blank" rel="noreferrer">{t("projects.resources")} ↗</a>}
      </aside>
    </div>
  );
});

export default TimelineDetailSheet;
