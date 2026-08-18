---
title: Console d’administration
description: Organisation des panneaux admin, coordination asynchrone et mutations protégées.
sidebar:
  order: 4
---
## Composition

<div class="architecture-frame">
  <img src="/diagrams/admin-concurrency.svg" alt="Coordination des lectures et écritures de l’administration." />
  <div class="architecture-caption">Latest-wins, écritures sérialisées, CSRF et concurrence optimiste.</div>
</div>

L’administration est découpée en layout, navigation, dashboard et panneaux spécialisés : owner, profil, timeline, projets, snapshots éditoriaux, publication, traductions, visibilité, analytics, import JSON, sécurité et Mission Control.


<div class="architecture-frame">
  <img src="/diagrams/admin-flow.svg" alt="Chaîne d’une mutation d’administration depuis React jusqu’à PostgreSQL." />
  <div class="architecture-caption">Chaîne d’une mutation d’administration depuis React jusqu’à PostgreSQL.</div>
</div>


## Coordination asynchrone

`useAdminAsyncCoordinator` centralise deux garanties :

- les lectures concurrentes utilisent un comportement **latest-wins** afin qu’une réponse lente ne remplace pas un état plus récent ;
- les écritures sensibles sont sérialisées pour ne pas créer des mutations contradictoires côté client.

Les `AbortSignal` sont propagés jusqu’aux services quand l’appel est annulable.

## Erreurs spécialisées

`authApi` distingue l’authentification requise, les conflits de concurrence et les erreurs API génériques. Les réponses d’erreur peuvent transporter un `requestId`, conservé pour le diagnostic backend.

## Preview

La route de prévisualisation permet de rendre un snapshot éditorial sans le confondre avec la publication publique. Les mêmes composants visuels peuvent être réutilisés avec des données de preview afin de limiter les divergences de rendu.
