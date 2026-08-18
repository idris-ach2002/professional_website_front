---
title: Résilience et cache
description: Cache serveur, cache navigateur, fallback et reprise après panne.
sidebar:
  order: 4
---
## Côté backend

`WebsiteService` utilise Caffeine pour les snapshots publics, listes publiques, projets publics et snapshot SEO. Les clés incluent la locale lorsqu’elle influence la réponse. Les chargements sont synchronisés pour éviter plusieurs recomputations concurrentes d’une même clé.

## Côté frontend

`portfolioApi` maintient un dernier snapshot valide dans `localStorage`. Le cache possède une durée maximale et un format contrôlé. Une requête réseau est toujours tentée pour rafraîchir l’affichage ; les appels simultanés d’une même locale sont regroupés par une map de requêtes en vol.


<div class="architecture-frame">
  <img src="/diagrams/fallback-cache.svg" alt="Stratégie de lecture publique : cache, API et fallback." />
  <div class="architecture-caption">Stratégie de lecture publique : cache, API et fallback.</div>
</div>


## Ordre de reprise

1. rendre le cache local immédiatement s’il est valide ;
2. rafraîchir depuis l’API ;
3. si l’API échoue et qu’un cache existe, conserver l’état connu ;
4. si aucune donnée réelle n’est disponible, charger dynamiquement la démonstration embarquée.

Ce mécanisme évite qu’un réveil lent du backend ou une panne transitoire transforme le portfolio en écran vide.
