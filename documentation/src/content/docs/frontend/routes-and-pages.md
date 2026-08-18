---
title: Routes et pages
description: Routes publiques, administratives et techniques du routeur React.
sidebar:
  order: 2
---
## Routes principales

<div class="architecture-frame">
  <img src="/diagrams/frontend-route-map.svg" alt="Carte des routes React et surfaces chargées à la demande." />
  <div class="architecture-caption">Routeur, pages publiques, administration et surfaces chargées à la demande.</div>
</div>

| Route | Rôle |
|---|---|
| `/` | Portfolio public en français. |
| `/en` | Portfolio public en anglais. |
| `/cv` et `/en/cv` | Présentation du CV. |
| `/recruiter` et `/en/recruiter` | Vue dédiée recruteur. |
| `/engineering` et `/en/engineering` | Mission Control et architecture technique. |
| `/projects/:projectSlug` | Étude de cas projet. |
| `/admin` et `/en/admin` | Administration protégée par la session backend. |
| `/admin/preview/:ownerId/:versionId` | Prévisualisation d’un snapshot éditorial. |
| `*` | Page 404 localisée. |

## Accessibilité de navigation

`SkipToContent` fournit un contournement vers le contenu principal. `RouteFocusManager` remet le focus sur une cible cohérente après navigation. Les routes différées sont enveloppées dans des fallbacks `Suspense` et des error boundaries locales lorsque le coût ou le risque le justifie.

## Localisation

Le préfixe `/en` représente la langue de l’interface. Les données métier sont demandées au backend avec `locale=en`; l’UI ne tente pas de reconstruire une traduction backend côté navigateur.
