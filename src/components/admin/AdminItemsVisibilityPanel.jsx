import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/authApi";
import { buildAdminVisibilityTree } from "../../visibility/itemVisibilityRegistry";
import { buildProvenSkills } from "../../utils/portfolio";

function collectKeys(items, output = []) {
  items.forEach((item) => {
    output.push(item.key);
    collectKeys(item.children ?? [], output);
  });
  return output;
}

function TreeNode({ item, overrides, onToggle, depth = 0 }) {
  const visible = overrides[item.key] !== false;
  const children = item.children ?? [];
  return (
    <div className={`items-visibility-node depth-${depth}`}>
      <div className="items-visibility-row">
        <span className="items-visibility-kind">{item.type}</span>
        <div><strong>{item.label}</strong><code>{item.key}</code></div>
        <label className="items-visibility-switch">
          <input type="checkbox" checked={visible} onChange={(event) => onToggle(item.key, event.currentTarget.checked)} />
          <span aria-hidden="true" />
          <b>{visible ? "Visible" : "Masqué"}</b>
        </label>
      </div>
      {children.length > 0 && <div className="items-visibility-children">{children.map((child) => <TreeNode key={child.key} item={child} overrides={overrides} onToggle={onToggle} depth={depth + 1} />)}</div>}
    </div>
  );
}

export default function AdminItemsVisibilityPanel({ controller }) {
  const [overrides, setOverrides] = useState({});
  const [saved, setSaved] = useState({});
  const [state, setState] = useState("loading");
  const [query, setQuery] = useState("");
  const skills = useMemo(() => buildProvenSkills(controller.projects ?? [], controller.experiences ?? []), [controller.experiences, controller.projects]);
  const tree = useMemo(() => buildAdminVisibilityTree({ projects: controller.projects, experiences: controller.experiences, skills }), [controller.experiences, controller.projects, skills]);

  useEffect(() => {
    let active = true;
    apiRequest("GET", "/api/items-visibility").then((payload) => {
      if (!active) return;
      const next = payload?.items ?? {};
      setOverrides(next);
      setSaved(next);
      setState("ready");
    }).catch((error) => {
      if (!active) return;
      setState(error?.message ?? "error");
    });
    return () => { active = false; };
  }, []);

  const changed = JSON.stringify(overrides) !== JSON.stringify(saved);
  const onToggle = (key, visible) => setOverrides((current) => ({ ...current, [key]: visible }));
  const save = async () => {
    setState("saving");
    try {
      const allKeys = collectKeys(tree);
      const items = Object.fromEntries(allKeys.map((key) => [key, overrides[key] !== false]));
      const payload = await apiRequest("PUT", "/api/items-visibility", { items });
      const next = payload?.items ?? {};
      setOverrides(next);
      setSaved(next);
      setState("saved");
      window.dispatchEvent(new CustomEvent("portfolio:visibility-updated"));
      window.setTimeout(() => setState("ready"), 1500);
    } catch (error) {
      setState(error?.message ?? "error");
    }
  };
  const reset = () => setOverrides({});

  const filterTree = (items) => items.map((item) => {
    const children = filterTree(item.children ?? []);
    const matches = `${item.label} ${item.key}`.toLowerCase().includes(query.trim().toLowerCase());
    return matches || children.length ? { ...item, children } : null;
  }).filter(Boolean);
  const visibleTree = query.trim() ? filterTree(tree) : tree;
  const totalItems = collectKeys(tree, []).length;
  const hiddenItems = collectKeys(tree, []).filter((key) => overrides[key] === false).length;

  return (
    <section className="items-visibility-admin" aria-label="items-visiblility">
      <header className="items-visibility-header">
        <div><span>FRONT CONTROL</span><h2>items-visiblility</h2><p>Active ou masque une route, une section, une card ou une sous-card. Un parent masqué masque automatiquement toute sa branche.</p></div>
        <div className="items-visibility-actions"><button type="button" onClick={reset}>Tout afficher</button><button type="button" className="is-primary" disabled={!changed || state === "saving"} onClick={save}>{state === "saving" ? "Enregistrement…" : "Enregistrer"}</button></div>
      </header>
      <div className="items-visibility-toolbar"><input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Rechercher un item, une route, une card…" aria-label="Rechercher dans items-visiblility" /><span>{hiddenItems} masqué{hiddenItems > 1 ? "s" : ""} / {totalItems} items · {state === "saved" ? "Configuration publiée" : state === "ready" ? "Prêt" : state}</span></div>
      <div className="items-visibility-tree">{visibleTree.map((item) => <TreeNode key={item.key} item={item} overrides={overrides} onToggle={onToggle} />)}</div>
    </section>
  );
}
