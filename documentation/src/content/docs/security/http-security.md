---
title: Sécurité HTTP
description: Headers, sessions, redirections et protections du transport applicatif.
sidebar:
  order: 2
---
## Cookies de session

La session serveur utilise un cookie HTTP-only, sécurisé et compatible avec le scénario cross-origin HTTPS du frontend et du backend. Le navigateur transmet le cookie uniquement lorsque les appels protégés utilisent `credentials: include`.

## Redirections

Après login, le backend ne redirige pas vers une URL arbitraire fournie par l’utilisateur. `FrontendRedirectService` résout la cible contre l’origine frontend et la liste d’origines autorisées.

## Réponses sensibles

Les endpoints protégés et contenus sensibles doivent éviter un cache partagé non intentionnel. Le backend contient un filtre dédié au `no-store` pour les réponses sensibles. Le frontend applique en parallèle des en-têtes de sécurité sur sa distribution statique.

## Request ID

Un filtre attribue ou propage un identifiant de requête et l’intègre au contexte de logs. Les erreurs API peuvent ainsi être corrélées aux traces backend sans exposer de détails internes au client.
