---
title: Erreurs et résilience UI
description: Error boundaries, états de source, timeouts et comportement dégradé.
sidebar:
  order: 11
---
## Error boundaries

Une boundary globale protège l’application. Les surfaces lazy coûteuses, telles que le volcan ou certaines routes, disposent de boundaries locales afin qu’une panne de rendu spécialisée n’efface pas le reste du portfolio.

## Source de données explicite

L’état de `App` conserve `source`, `error` et `cachedAt`. `StatusBanner` peut donc distinguer API, cache et démonstration sans inventer une disponibilité parfaite.

## Timeouts réseau

Les services frontend utilisent `AbortController` pour borner les appels publics et engineering. Les retries sont ciblés ; l’administration ne répète pas silencieusement une écriture mutante risquée.

## Fallbacks visuels

Les composants de rendu graphique savent se suspendre ou revenir vers un placeholder/main thread lorsque le navigateur ne possède pas la capability nécessaire. La capacité de rendu est une optimisation, pas une condition de disponibilité du contenu métier.
