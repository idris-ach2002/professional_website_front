---
title: Timeline
description: Architecture DOM, moteur de mouvement, visibilité et détail des expériences.
sidebar:
  order: 6
---
## Surface

`PortfolioTimeline` affiche le parcours à partir des expériences du snapshot. La timeline reste une surface DOM : les cartes sont des composants accessibles et le détail s’ouvre dans `TimelineDetailSheet`.

## Moteurs purs

Les règles de mouvement et d’inspection sont isolées dans `timelineMotion.js` et `timelineInspectionEngine.js`. Cette séparation permet de tester les transitions d’état sans demander au navigateur headless de reproduire une chorégraphie de scroll au milliseconde près.

## Géométrie

La timeline mesure explicitement la géométrie des cartes puis réutilise un cache. Les routines de visibilité autonomes doivent éviter les lectures de layout répétées. L’objectif est de maintenir un comportement stable pendant le scroll sans transformer chaque événement en recalcul complet.

## Responsive

La présentation se simplifie sur mobile : largeur cohérente avec les autres cartes, détail accessible, densité visuelle réduite et animations moins agressives selon le profil runtime.
