---
title: Mission Control
description: Vue Engineering, graphe d’architecture, traces et télémétrie runtime.
sidebar:
  order: 10
---
## Objectif

`/engineering` n’est pas une simple page marketing. Elle expose les données techniques du runtime navigateur et interroge les endpoints engineering du backend afin de montrer l’état du système, les files, les performances et la chaîne de requête.


<div class="architecture-frame">
  <img src="/diagrams/analytics-mission-control.svg" alt="Sources de données qui alimentent Mission Control." />
  <div class="architecture-caption">Sources de données qui alimentent Mission Control.</div>
</div>


## Traces réseau

`engineeringApi` mesure durée totale, tailles de payload, TTFB et informations `Server-Timing` lorsque disponibles. Il lit aussi `X-Portfolio-Trace` pour reconstruire une piste de composants serveur appelée par la requête.

## Graphe

`ArchitectureObservatory` affiche un graphe de services. Le layout peut être calculé dans un Worker. Le navigateur garde un chemin de rendu utilisable même si le calcul déporté n’est pas disponible.

## Historique

Les échantillons runtime peuvent être envoyés au backend et relus par la route d’historique. Cette donnée est d’observabilité ; elle ne modifie jamais le contenu public.
