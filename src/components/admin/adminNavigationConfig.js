export const ADMIN_WORKSPACES = [
  {
    id: "home", label: "Accueil", icon: "⌁", hint: "Priorités du jour", home: "overview",
    items: [
      { value: "overview", label: "Vue d’ensemble", icon: "⌁", hint: "Prochaine action et progression" },
    ],
  },
  {
    id: "content", label: "Contenu", icon: "▦", hint: "Ce que voit le public", home: "project",
    items: [
      { value: "project", label: "Projets", icon: "▦", hint: "Études de cas" },
      { value: "profile", label: "Présentation", icon: "◐", hint: "Hero, CV et médias" },
      { value: "timeline", label: "Parcours", icon: "⌇", hint: "Expériences et études" },
      { value: "owner", label: "Identité", icon: "◎", hint: "Profil principal" },
      { value: "translations", label: "Traductions", icon: "文", hint: "Contenu multilingue" },
    ],
  },
  {
    id: "publish", label: "Publication", icon: "↗", hint: "Préparer et mettre en ligne", home: "publication",
    items: [
      { value: "publication", label: "Publication Studio", icon: "↗", hint: "Valider et mettre en ligne" },
      { value: "version", label: "Versions", icon: "◇", hint: "Brouillons et variantes" },
    ],
  },
  {
    id: "insights", label: "Insights", icon: "⌾", hint: "Comprendre les usages", home: "mission",
    items: [
      { value: "mission", label: "Architecture", icon: "⌾", hint: "Topologie, traces et performance", live: true },
      { value: "analytics", label: "Analytics", icon: "⌁", hint: "Audience et parcours" },
      { value: "items-visiblility", label: "items-visiblility", icon: "◫", hint: "Afficher ou masquer les éléments du front" },
    ],
  },
  {
    id: "system", label: "Système", icon: "✓", hint: "Sécurité et données", home: "safety",
    items: [
      { value: "safety", label: "Santé & sauvegarde", icon: "✓", hint: "Contrôles et restauration" },
      { value: "import", label: "Import JSON", icon: "⇣", hint: "Migration de données" },
    ],
  },
];

export const ADMIN_NAVIGATION_GROUPS = ADMIN_WORKSPACES.map((workspace) => ({
  label: workspace.label,
  items: workspace.items,
}));

export function getAdminNavigationItem(value) {
  return ADMIN_WORKSPACES.flatMap((workspace) => workspace.items).find((item) => item.value === value)
    ?? ADMIN_WORKSPACES[0].items[0];
}

export function getAdminWorkspace(value) {
  return ADMIN_WORKSPACES.find((workspace) => workspace.items.some((item) => item.value === value))
    ?? ADMIN_WORKSPACES[0];
}
