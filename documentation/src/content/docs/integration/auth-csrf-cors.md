---
title: Authentification, CSRF et CORS
description: Flux de sécurité cross-origin entre l’administration React et Spring Security.
sidebar:
  order: 2
---
## Session administrateur

Le backend utilise une authentification par formulaire et une session HTTP. Le frontend ne stocke pas un token d’administration dans `localStorage`. Les appels protégés utilisent `credentials: "include"` afin que le cookie de session accompagne les requêtes vers l’origine backend autorisée.


<div class="architecture-frame">
  <img src="/diagrams/security-boundaries.svg" alt="Barrières de sécurité entre visiteur, administration et données." />
  <div class="architecture-caption">Barrières de sécurité entre visiteur, administration et données.</div>
</div>


## CSRF

Avant une méthode mutante, `authApi` récupère `/csrf`, met temporairement le jeton en cache et l’envoie avec la requête. Si le backend indique une session expirée, le cache CSRF est invalidé et l’erreur est reclassée comme authentification requise.

Deux endpoints d’ingestion publique sont volontairement exemptés de CSRF côté serveur : analytics et échantillons de performance. Ils restent soumis à leur propre validation et aux limites applicatives.

## CORS

Les origines acceptées sont configurées côté backend, séparément pour les appels API et les redirections post-login. La configuration autorise les credentials uniquement pour des origines explicites ; elle n’emploie pas de wildcard avec session.

## Concurrence optimiste

Les snapshots éditoriaux et le propriétaire portent des révisions. Le frontend construit des tags d’entité et les mutations sensibles utilisent des préconditions HTTP. Un conflit n’est pas écrasé silencieusement : l’UI reçoit une erreur spécialisée et demande de recharger avant de réessayer.


<div class="architecture-frame">
  <img src="/diagrams/admin-flow.svg" alt="Chaîne d’une mutation d’administration avec coordination et concurrence optimiste." />
  <div class="architecture-caption">Chaîne d’une mutation d’administration avec coordination et concurrence optimiste.</div>
</div>
