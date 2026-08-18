---
title: Workers et rendu
description: Protocoles de simulation, OffscreenCanvas et fallbacks du navigateur.
sidebar:
  order: 8
---
<div class="architecture-frame">
  <img src="/diagrams/worker-rendering.svg" alt="Workers de simulation, rendu et textures." />
  <div class="architecture-caption">Workers de simulation, rendu et textures.</div>
</div>


## Workers présents

| Worker | Responsabilité |
|---|---|
| `marineSimulation.worker.js` | Mise à jour de l’état des agents marins. |
| `oceanTransitionRender.worker.js` | Rendu de transition quand un canvas est transférable. |
| `volcanoCanvasRender.worker.js` | Particules et débris du volcan. |
| `volcanoTexture.worker.js` | Préparation de textures sans bloquer le thread principal. |
| `architectureForceAtlas.worker.js` | Calcul du layout du graphe Mission Control. |
| `performanceRuntime.worker.js` | Analyse de données runtime hors du chemin principal. |

## Invariants de protocole

Les Workers qui reçoivent des buffers transférables doivent rendre les buffers au pool après usage. Un canvas transféré ne peut plus être récupéré par le thread principal ; le composant protège donc le moment du transfert et conserve un fallback avant ce point.

## Tests

Les protocoles Worker sont testés avec des doubles contrôlés au niveau unitaire. Les tests navigateur n’attendent pas qu’un scheduler arbitraire fournisse un créneau dans un délai donné pour décider de la validité fonctionnelle.
