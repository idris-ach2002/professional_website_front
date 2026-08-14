import { Badge, Button, Progress } from "@mantine/core";
import AdminGuidedWorkflow from "./AdminGuidedWorkflow";

function completionScore({ selectedVersionId, profileForm, projects, experiences }) {
  const checks = [
    Boolean(selectedVersionId),
    Boolean(profileForm?.title || profileForm?.headline),
    experiences.length > 0,
    projects.some((project) => project?.published !== false),
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

export default function AdminDashboard({ controller }) {
  const {
    selectedOwnerId,
    selectedVersionId,
    selectedVersion,
    profileForm,
    projects,
    experiences,
    versions,
    activeVersionsCount,
    publicationJobs,
    setAdminActiveTab,
  } = controller;
  const score = completionScore({ selectedVersionId, profileForm, projects, experiences });
  const pendingJobs = publicationJobs.filter((job) => ["QUEUED", "RUNNING", "RETRYING"].includes(job?.status)).length;
  const publicProjects = projects.filter((item) => item?.published !== false).length;
  const nextAction = !selectedVersionId
    ? { tab: "version", eyebrow: "Commencer", title: "Choisissez votre espace de travail", text: "Sélectionnez ou créez une version : toutes les modifications resteront isolées jusqu’à leur publication.", action: "Choisir une version" }
    : !(profileForm?.title || profileForm?.headline)
      ? { tab: "profile", eyebrow: "Étape suivante", title: "Présentez votre valeur en une phrase", text: "Complétez le titre et l’accroche visibles dès l’arrivée sur le portfolio.", action: "Compléter la présentation" }
      : experiences.length === 0
        ? { tab: "timeline", eyebrow: "Étape suivante", title: "Racontez votre parcours", text: "Ajoutez une première expérience pour donner du contexte aux compétences et aux projets.", action: "Ajouter une expérience" }
        : publicProjects === 0
          ? { tab: "project", eyebrow: "Étape suivante", title: "Publiez une première preuve", text: "Transformez un projet en étude de cas claire, vérifiable et orientée résultat.", action: "Préparer un projet" }
          : { tab: "publication", eyebrow: "Prêt à décider", title: "Relisez, validez, publiez", text: "Le contenu essentiel est prêt. Publication Studio vérifie les points bloquants avant la mise en ligne.", action: "Ouvrir Publication Studio" };

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-command">
        <div className="admin-dashboard-focus">
          <span className="admin-section-kicker">{nextAction.eyebrow}</span>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.text}</p>
          <div><Button onClick={() => setAdminActiveTab(nextAction.tab)}>{nextAction.action}</Button><Button variant="subtle" onClick={() => setAdminActiveTab("publication")}>Voir l’état de publication</Button></div>
        </div>
        <div className="admin-readiness-card">
          <div className="admin-readiness-ring" style={{ "--score": `${score * 3.6}deg` }}>
            <span><strong>{score}%</strong><small>prêt</small></span>
          </div>
          <div><span>État de préparation</span><strong>{score === 100 ? "Contenu essentiel complet" : "Progression en cours"}</strong><small>{score === 100 ? "Vous pouvez lancer la validation." : "Une seule action recommandée à la fois."}</small></div>
        </div>
      </section>

      <section className="admin-dashboard-metrics" aria-label="État du portfolio">
        <article><i aria-hidden="true">◇</i><div><span>Versions</span><strong>{versions.length}</strong><small>{activeVersionsCount} active</small></div></article>
        <article><i aria-hidden="true">▦</i><div><span>Projets</span><strong>{projects.length}</strong><small>{publicProjects} publics</small></div></article>
        <article><i aria-hidden="true">⌇</i><div><span>Expériences</span><strong>{experiences.length}</strong><small>dans le parcours</small></div></article>
        <article><i aria-hidden="true">↗</i><div><span>Jobs en cours</span><strong>{pendingJobs}</strong><small>{pendingJobs ? "traitement actif" : "file saine"}</small></div></article>
      </section>

      <section className="admin-dashboard-action-grid">
        <article className="admin-dashboard-primary-action">
          <Badge color={selectedVersion?.active ? "green" : "blue"} variant="light">
            {selectedVersion?.active ? "En ligne" : "Brouillon"}
          </Badge>
          <h3>{selectedVersion?.label ?? "Créez votre première version"}</h3>
          <p>{selectedVersion?.description ?? "Centralisez les changements dans un brouillon sûr avant publication."}</p>
          <Progress value={score} color="cyan" radius="xl" />
          <div>
            <Button onClick={() => setAdminActiveTab("profile")}>Continuer l’édition</Button>
            <Button variant="subtle" onClick={() => setAdminActiveTab("publication")}>Ouvrir Publication Studio</Button>
          </div>
        </article>
        <article className="admin-dashboard-mission-card">
          <span className="admin-section-kicker">Observabilité · temps réel</span>
          <h3>Engineering Console</h3>
          <p>Ouvrez le graphe nœuds–arêtes, les particules WebGL, la mémoire et les décisions du runtime dans une vue dédiée.</p>
          <div><i /><span>Runtime connecté</span></div>
          <Button variant="light" onClick={() => setAdminActiveTab("mission")}>Explorer les insights</Button>
        </article>
      </section>

      <AdminGuidedWorkflow
        selectedOwnerId={selectedOwnerId}
        selectedVersionId={selectedVersionId}
        selectedVersion={selectedVersion}
        profileForm={profileForm}
        projects={projects}
        experiences={experiences}
        activeVersionsCount={activeVersionsCount}
        onOpenTab={setAdminActiveTab}
      />
    </div>
  );
}
