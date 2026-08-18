---
title: Contrat d’erreur
description: Propagation des erreurs HTTP, request IDs, conflits et fallbacks entre les deux dépôts.
---
## Erreur backend

Le backend transforme les erreurs applicatives en réponses structurées et associe un request ID lorsque le contexte le permet. Ce même identifiant peut être repris dans les logs pour corréler une erreur affichée dans l’administration avec une requête serveur.

## Frontend public

La lecture publique traite les indisponibilités comme une condition de résilience : délai borné, retry ciblé, dernier état valide, puis fallback embarqué. Une panne temporaire de l’API ne doit pas provoquer une page blanche si une donnée exploitable existe déjà.

## Frontend administrateur

`authApi` distingue au minimum :

- authentification requise ;
- conflit de concurrence ;
- erreur HTTP générique.

Une réponse de conflit ne doit pas être réinterprétée comme une réussite. L’UI recharge l’état ou demande à l’utilisateur de reprendre l’opération avec la révision fraîche.

## Boundary UI

Les Error Boundaries protègent le shell React contre une exception de composant. Les surfaces graphiques disposent aussi de stratégies de fallback lorsque Worker, Canvas ou capacité navigateur ne sont pas disponibles.

## Principe

Un fallback ne doit jamais masquer une mutation backend réellement refusée. La résilience agressive est réservée aux lectures publiques et aux surfaces de présentation ; les écritures administratives restent strictes.
