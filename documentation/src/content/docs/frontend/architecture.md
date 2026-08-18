---
title: Architecture Frontend
description: Composition React, providers, routes, services et runtime adaptatif.
sidebar:
  order: 1
---
## Bootstrap

`src/main.jsx` crée la racine React et installe les providers dans un ordre explicite : Mantine, langue, préférences d’animation, runtime de performance, routeur, puis boundary applicative. `App` ajoute le provider de visibilité des éléments et la composition des routes.


<div class="architecture-frame">
  <img src="/diagrams/frontend-runtime.svg" alt="Providers, routes, surfaces et Workers du frontend." />
  <div class="architecture-caption">Providers, routes, surfaces et Workers du frontend.</div>
</div>


## Découpage logique

| Couche | Sources | Rôle |
|---|---|---|
| Bootstrap | `main.jsx`, `App.jsx` | Initialisation globale et routing. |
| UI publique | `components/` | Profil, compétences, timeline, projets, CV, recruiter, footer. |
| Administration | `components/admin/` | CRUD, publication, traduction, fichiers, visibilité, analytics. |
| Services | `services/` | HTTP public, protégé, engineering, analytics et traduction. |
| Runtime | `performance/`, `visibility/`, `ocean/` | Budgets, scheduler, resources, visibilité et monde océanique. |
| Rendering | `rendering/`, `workers/` | Canvas/WebGL/OffscreenCanvas et calcul déporté. |
| Animation | `animations/` | Engines purs et orchestration GSAP. |
| Styles | `styles/` | Cascade modulaire, responsive et profils de performance. |

## Dépendances lourdes différées

Les routes secondaires et plusieurs surfaces visuelles utilisent `React.lazy`/`Suspense`. La timeline, les projets, le footer, l’administration, le CV, le recruiter, Mission Control, les pages projet et le volcan ne sont pas tous inclus dans le chemin initial. Le runtime peut également précharger certains modules selon coût, probabilité de navigation, réseau et pression mémoire.

## Principe d’adaptation

L’expérience visuelle n’est pas “tout ou rien”. Le runtime calcule une qualité et un budget, puis chaque surface adapte DPR, FPS, densité ou stratégie Worker. Les préférences utilisateur et `prefers-reduced-motion` restent prioritaires sur l’ambition graphique.
