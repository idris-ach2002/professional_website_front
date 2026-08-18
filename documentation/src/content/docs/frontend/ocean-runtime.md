---
title: Monde océanique
description: World Director, bridges, aquarium, transitions et volcan abyssal.
sidebar:
  order: 5
---
## Structure

La page publique superpose plusieurs systèmes : `OceanMorphBackground`, `GlobalAquarium`, `OceanTransitionStage` et, sur les profils compatibles, `UnderwaterVolcanoField`. `OceanWorldBridge` ne représente pas une section décorative ; il expose des ancres de transition entre les zones métier.


<div class="architecture-frame">
  <img src="/diagrams/worker-rendering.svg" alt="Surfaces visuelles, runtime adaptatif et Workers." />
  <div class="architecture-caption">Surfaces visuelles, runtime adaptatif et Workers.</div>
</div>


## GlobalAquarium

`GlobalAquarium` maintient une géométrie de monde par sections observées. Des `IntersectionObserver` et un `ResizeObserver` déclenchent des mises à jour de snapshot géométrique. La sélection de biome réutilise ces données au lieu de relire le layout dans le hot path. La simulation marine peut être déportée vers `marineSimulation.worker` et échoue vers un fallback si le Worker est indisponible ou bloqué.

## Transitions

`OceanTransitionStage` peut transférer son canvas à un Worker lorsque `transferControlToOffscreen` est disponible. Sinon, le rendu reste sur le thread principal. L’état cinématique est piloté par les ancres du monde et les préférences de mouvement.

## Volcan

Le volcan combine textures, simulation, particules/débris et rendu. Les surfaces compatibles peuvent être transférées à `volcanoCanvasRender.worker`; un pool de buffers transférables limite les allocations. Le fallback main thread reste une voie fonctionnelle et non une erreur.
