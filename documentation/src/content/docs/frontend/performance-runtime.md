---
title: Runtime de performance
description: Mesure, budgets, qualité adaptative, scheduler et registre de ressources.
sidebar:
  order: 7
---
## `PerformanceRuntimeProvider`

Le provider observe le comportement réel du navigateur : cadence de frame, longues tâches, mémoire lorsque disponible, interactions, Workers et ressources. Il produit une qualité runtime et un budget consommés par les composants graphiques.

## Scheduler

`runtimeScheduler.js` privilégie l’API `scheduler` lorsqu’elle existe et fournit un fallback contrôlé. Deux intentions sont exposées : tâche visible/utilisateur et tâche de fond. Les modules coûteux peuvent ainsi être chargés ou initialisés sans monopoliser le chemin critique.

## Registre de ressources

`resourceLifecycleRegistry.js` associe chaque ressource à un owner logique, une catégorie, une estimation mémoire et une durée de vie. Le snapshot permet d’identifier ressources actives et ressources potentiellement orphelines après démontage d’un owner.


<div class="architecture-frame">
  <img src="/diagrams/worker-rendering.svg" alt="Découpage du runtime adaptatif et des Workers." />
  <div class="architecture-caption">Découpage du runtime adaptatif et des Workers.</div>
</div>


## Prefetch intelligent

`smartPrefetch` combine probabilité, coût, mode data-saver, pression mémoire, type réseau et criticité. Le prefetch reste une décision explicable : chaque refus ou acceptation porte une raison exploitable par le runtime.
