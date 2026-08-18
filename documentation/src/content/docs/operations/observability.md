---
title: Observabilité
description: Signaux frontend, backend et infrastructure disponibles pour le diagnostic.
sidebar:
  order: 1
---
## Frontend

<div class="architecture-frame">
  <img src="/diagrams/observability-path.svg" alt="Chaîne d’observabilité du navigateur à Mission Control." />
  <div class="architecture-caption">Télémétrie navigateur, backend, persistence et exposition opérationnelle.</div>
</div>

Le runtime mesure frames, tâches longues, pression mémoire, latence Worker, ressources actives et latence API. Mission Control combine ces mesures avec les informations remontées par le backend. Les données de performance peuvent être persistées via l’API engineering.

## Backend

Actuator expose la santé et Prometheus. `BackendRouteProfilerFilter` enrichit les réponses engineering avec des informations de durée. `MissionControlService` agrège JVM, système, mémoire, stockage, PostgreSQL, caches, files analytics, jobs, outbox et publications.


<div class="architecture-frame">
  <img src="/diagrams/analytics-mission-control.svg" alt="Collecte analytics et observabilité Mission Control." />
  <div class="architecture-caption">Collecte analytics et observabilité Mission Control.</div>
</div>


## Logs

Le pattern de logs inclut le request ID. Les erreurs métier sont normalisées par `GlobalExceptionHandler`, ce qui permet au frontend d’afficher un message exploitable tout en conservant un identifiant de corrélation.
