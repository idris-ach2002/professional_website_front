import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_WORKSPACES, getAdminWorkspace } from "./adminNavigationConfig";

function CommandPalette({ opened, onClose, onChange }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const entries = useMemo(() => ADMIN_WORKSPACES.flatMap((workspace) => (
    workspace.items.map((item) => ({ ...item, workspace: workspace.label }))
  )), []);
  const filtered = entries.filter((entry) => (
    `${entry.label} ${entry.hint} ${entry.workspace}`.toLowerCase().includes(query.trim().toLowerCase())
  ));

  useEffect(() => {
    if (!opened) return undefined;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, opened]);

  if (!opened) return null;
  return (
    <div className="admin-command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-command-palette" role="dialog" aria-modal="true" aria-label="Aller à une fonctionnalité" onMouseDown={(event) => event.stopPropagation()}>
        <header><span aria-hidden="true">⌕</span><input ref={inputRef} value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Rechercher une page ou une action…" aria-label="Rechercher une fonctionnalité" /><kbd>Échap</kbd></header>
        <div className="admin-command-results">
          {filtered.map((entry) => (
            <button type="button" key={entry.value} onClick={() => { onChange(entry.value); onClose(); }}>
              <span className="admin-command-nav-icon" aria-hidden="true">{entry.icon}</span>
              <span><strong>{entry.label}</strong><small>{entry.hint}</small></span>
              <em>{entry.workspace}</em>
            </button>
          ))}
          {filtered.length === 0 && <p>Aucun résultat. Essayez « projet », « publier » ou « analytics ».</p>}
        </div>
      </section>
    </div>
  );
}

export default function AdminNavigation({ value, onChange, selectedVersion }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const activeWorkspace = getAdminWorkspace(value);

  useEffect(() => {
    const openPalette = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", openPalette);
    return () => window.removeEventListener("keydown", openPalette);
  }, []);

  return (
    <aside className="admin-command-nav" aria-label="Navigation de l’administration">
      <a href="/admin" className="admin-command-brand" aria-label="Accueil administration">
        <span className="admin-command-brand-mark">IA</span>
        <span><strong>Portfolio OS</strong><small>Company workspace</small></span>
      </a>

      <button type="button" className="admin-command-search" onClick={() => setPaletteOpen(true)}>
        <span aria-hidden="true">⌕</span><strong>Aller à…</strong><kbd>Ctrl K</kbd>
      </button>

      <nav aria-label="Navigation de l’administration">
        <section className="admin-workspace-switcher" aria-label="Espaces de travail">
          {ADMIN_WORKSPACES.map((workspace) => {
            const active = workspace.id === activeWorkspace.id;
            return (
              <button
                type="button"
                key={workspace.id}
                className={active ? "is-active" : ""}
                onClick={() => onChange(workspace.home)}
                aria-current={active ? "page" : undefined}
              >
                <span className="admin-command-nav-icon" aria-hidden="true">{workspace.icon}</span>
                <span><strong>{workspace.label}</strong><small>{workspace.hint}</small></span>
              </button>
            );
          })}
        </section>

        <section className="admin-workspace-pages" aria-label={`Pages de ${activeWorkspace.label}`}>
          <h2>{activeWorkspace.label}</h2>
          {activeWorkspace.items.map((item) => (
            <button
              type="button"
              key={item.value}
              className={value === item.value ? "is-active" : ""}
              onClick={() => onChange(item.value)}
              aria-current={value === item.value ? "page" : undefined}
            >
              <span className="admin-command-nav-icon" aria-hidden="true">{item.icon}</span>
              <span><strong>{item.label}</strong><small>{item.hint}</small></span>
              {item.live && <i>LIVE</i>}
            </button>
          ))}
        </section>
      </nav>

      <div className="admin-command-version">
        <span className={selectedVersion?.active ? "is-active" : ""} />
        <div><small>Version courante</small><strong>{selectedVersion?.label ?? "À sélectionner"}</strong></div>
      </div>
      <CommandPalette opened={paletteOpen} onClose={() => setPaletteOpen(false)} onChange={onChange} />
    </aside>
  );
}
