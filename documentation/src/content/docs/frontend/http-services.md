---
title: Services HTTP
description: Clients publics, administrateur, analytics, engineering et traduction.
---
## `portfolioApi`

Le client public résout l’URL `/website/default?locale=...`, déduplique les lectures simultanées avec un single-flight et conserve le dernier snapshot valide dans `localStorage`. Le timeout est borné et les retries restent ciblés afin de ne pas transformer une indisponibilité backend en tempête de requêtes.

## `authApi`

Les appels administrateur utilisent `credentials: include`. Le service récupère le jeton CSRF avant les mutations et gère les tags d’entité nécessaires à la concurrence optimiste. Les erreurs d’authentification et de conflit sont représentées par des classes dédiées pour que l’UI prenne une décision explicite.

## Analytics

`analyticsApi` génère les identifiants de session/navigation nécessaires, envoie les événements sans faire dépendre l’expérience publique de leur succès et respecte le drapeau qui désactive l’analytics dans les environnements de test.

## Engineering

`engineeringApi` lit Mission Control, la queue et l’historique des performances, collecte `Server-Timing` et resource timing, puis peut transmettre des échantillons runtime au backend. Cette télémétrie reste indépendante du rendu public.

## Traduction

`translationApi` parle uniquement au backend. L’URL du provider privé de traduction n’est jamais connue du navigateur.
