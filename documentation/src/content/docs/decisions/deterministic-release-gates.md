---
title: Gates de release déterministes
description: Décision de séparer invariants bloquants et télémétrie sensible à l’environnement.
sidebar:
  order: 2
---
## Contexte

Les navigateurs headless exécutés sur des runners partagés peuvent modifier l’ordonnancement des paints, Workers, `IntersectionObserver` et métriques temporelles sans que le code fonctionnel soit différent.

## Décision

Les hard gates vérifient des invariants observables et reproductibles. Les métriques qui dépendent fortement du scheduler restent mesurées mais sont publiées comme diagnostics.

## Conséquences

- un échec de release correspond à une pré/postcondition réellement rompue ;
- les performances restent visibles dans les artifacts ;
- les tests ne sont pas rendus “fiables” en augmentant arbitrairement les timeouts ou le nombre de répétitions ;
- le soak reste un outil d’endurance et non une preuve fonctionnelle.
