---
title: Chargement du portfolio public
description: API, cache, single-flight, retry et fallback de données.
sidebar:
  order: 3
---
## Service principal

`src/services/portfolioApi.js` encapsule la lecture publique. En développement, l’URL de base peut rester vide afin de passer par le proxy Vite. En preview/production, les requêtes ciblent `VITE_API_BASE_URL`.


<div class="architecture-frame">
  <img src="/diagrams/fallback-cache.svg" alt="Ordre de résolution des données publiques." />
  <div class="architecture-caption">Ordre de résolution des données publiques.</div>
</div>


## Propriétés importantes

- normalisation de locale `fr` / `en` ;
- timeout par tentative via `AbortController` ;
- retry limité sur erreurs réseau, abort ou erreurs serveur ;
- map `inFlightPortfolioRequests` pour éviter les doublons simultanés ;
- cache `last-known-good` versionné techniquement en interne et expirant ;
- import dynamique de `demoPortfolio` uniquement en dernier recours.

## Intégration dans `App`

Lors d’un changement de langue, `App` lit d’abord le cache local puis lance `refreshPortfolio`. Une réponse fraîche remplace l’état et réécrit le cache. Si la requête échoue après affichage du cache, la source devient `cache` et l’erreur reste visible dans l’état. Sans cache, le fallback de démonstration maintient la navigabilité.
