export default function RecruiterContextBar({ profile, education, t }) {
  const primaryEducation = education?.[0];
  const items = [
    { label: t("recruiter.target"), value: profile?.title },
    { label: t("recruiter.education"), value: primaryEducation?.title },
    { label: t("recruiter.location"), value: profile?.location },
    { label: t("recruiter.availability"), value: profile?.availability },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <section className="recruiter-context-bar" aria-label={t("recruiter.profileSnapshot")}>
      {items.map((item) => (
        <div key={item.label} className="recruiter-context-bar__item">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </section>
  );
}
