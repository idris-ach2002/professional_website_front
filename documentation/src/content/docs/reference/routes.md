---
title: Routes Frontend
description: Catalogue des routes React publiques, administratives et localisées.
sidebar:
  order: 1
---
## Routeur

`BrowserRouter` fournit la navigation. Les routes françaises utilisent la racine sans préfixe et les routes anglaises utilisent `/en`. Les pages secondaires sont chargées avec `React.lazy` afin de ne pas alourdir le chemin initial.

<div class="architecture-frame">
  <img src="/diagrams/frontend-route-map.svg" alt="Carte des routes frontend." />
  <div class="architecture-caption">Routes publiques, pages spécialisées et administration.</div>
</div>

| Route | Variante anglaise | Surface | Chargement |
|---|---|---|---|
| `/` | `/en` | Portfolio principal | shell initial + sections différées |
| `/admin` | `/en/admin` | Console d’administration | lazy |
| `/admin/preview/:ownerId/:versionId` | `/en/admin/preview/:ownerId/:versionId` | Preview d’un snapshot éditorial | lazy |
| `/cv` | `/en/cv` | CV | lazy |
| `/recruiter` | `/en/recruiter` | Vue recruteur | lazy |
| `/engineering` | `/en/engineering` | Mission Control | lazy |
| `/projects/:projectSlug` | `/en/projects/:projectSlug` | Étude de projet | lazy |
| `*` | — | Not Found | lazy |

## Navigation intra-page

La page principale possède des ancres de sections utilisées par la navigation et le World Director. Les helpers E2E de navigation réconcilient explicitement scroll, géométrie et état du monde au lieu d’utiliser une durée arbitraire comme preuve de réussite.

## Localisation

La langue est portée par le chemin et le contexte `LanguageProvider`. Les services publics demandent la locale correspondante au backend afin que la page, les données métier et les métadonnées restent cohérentes.
