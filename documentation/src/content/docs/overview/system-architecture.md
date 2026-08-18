---
title: Architecture globale
description: Cartographie détaillée des couches, dépendances et flux du système.
sidebar:
  order: 2
---
## Couches

L’architecture se lit de gauche à droite : **client → edge → frontend → backend → données/services externes**. Les pipelines GitHub Actions se situent hors du chemin des requêtes mais contrôlent la création et le déploiement des artifacts.


<div class="architecture-frame">
  <img src="/diagrams/system-atlas.svg" alt="Carte sophistiquée de l’architecture applicative et cloud." />
  <div class="architecture-caption">Carte sophistiquée de l’architecture applicative et cloud.</div>
</div>


## Chemin public

1. Le navigateur télécharge l’application statique depuis Cloudflare.
2. React initialise les providers, le routeur et les surfaces visibles.
3. `portfolioApi` demande le snapshot public localisé au backend.
4. Spring Security autorise la route publique et applique CORS.
5. `WebsiteController` délègue à `WebsiteService`.
6. Le service consulte Caffeine puis PostgreSQL si nécessaire.
7. `PortfolioLocalizationService` applique les traductions publiées.
8. Le DTO revient au navigateur, qui met à jour son cache local et l’UI.

## Chemin d’administration

L’administration ajoute quatre barrières : **session**, **CSRF**, **CORS avec credentials** et **préconditions de concurrence**. Les mutations sont coordonnées côté frontend pour éviter les réponses obsolètes et sérialiser les écritures. Côté backend, les transactions et verrous optimistes protègent la cohérence.

## Chemin asynchrone

Les opérations qui ne doivent pas dépendre d’une unique requête HTTP utilisent des jobs persistés et/ou l’outbox. Le dispatcher reprend les événements dus, gère les tentatives et signale les événements épuisés. La publication produit aussi un audit immuable et invalide les caches publics via un événement métier.

## Frontières de panne

| Panne | Confinement |
|---|---|
| Backend indisponible | Cache navigateur, puis fallback de démonstration pour la surface publique. |
| Traduction indisponible | Le contenu source reste disponible ; l’administration signale l’état du provider. |
| Cloudinary indisponible | Les données métier restent accessibles ; l’upload échoue sans corrompre le snapshot. |
| Worker navigateur indisponible | Fallback main thread ou rendu réduit selon la surface. |
| Diagnostic performance instable | Signal non bloquant ; les gates fonctionnelles restent indépendants. |
