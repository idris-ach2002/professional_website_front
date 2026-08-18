---
title: Tests Frontend
description: Organisation Vitest, Playwright, hard gates et diagnostics.
sidebar:
  order: 4
---
## Tests unitaires

Les engines d’animation, politiques de performance, capacités runtime, budgets, memory governor, scheduler, registre de ressources, services API et hooks admin sont testés avec des dépendances contrôlées. Les fake timers et doubles Worker sont privilégiés lorsqu’une logique temporelle doit être prouvée.

## Tests navigateur

Les hard gates Playwright vérifient montage, routes, contrats DOM, responsive, réseau hermétique et invariants fonctionnels. Les tests qui dépendaient d’une chorégraphie opportuniste du scheduler sont remplacés par des tests de pré/postconditions ou déplacés en diagnostic.

## Diagnostics

`CI=1 npm run ci:diagnostics` collecte les mesures navigateur. Le laboratoire Main Thread et Web Vitals peuvent signaler une collecte incomplète sans bloquer la release déterministe.


<div class="architecture-frame">
  <img src="/diagrams/test-strategy.svg" alt="Pyramide de qualité du frontend." />
  <div class="architecture-caption">Pyramide de qualité du frontend.</div>
</div>
