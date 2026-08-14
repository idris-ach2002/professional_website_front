export default function ObservabilityGuide({ title = "Analyse", analysis, note }) {
  return (
    <aside className="observability-guide observability-guide--analysis" aria-label={title}>
      <header>
        <div>
          <span className="mission-kicker">Analyse</span>
          <h3>{title}</h3>
        </div>
        {note ? <span className="observability-guide-note">{note}</span> : null}
      </header>
      <div className="observability-analysis-deep">
        <p>{analysis}</p>
      </div>
    </aside>
  );
}
