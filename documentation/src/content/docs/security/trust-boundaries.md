---
title: Frontières de confiance
description: Zones publiques, administration, secrets et services privés.
sidebar:
  order: 1
---
<div class="architecture-frame">
  <img src="/diagrams/security-boundaries.svg" alt="Frontières de confiance du système." />
  <div class="architecture-caption">Frontières de confiance du système.</div>
</div>


## Public

Le portfolio, les assets, certaines métriques engineering et l’ingestion analytics sont accessibles sans session selon la configuration de sécurité. Cette surface doit rester strictement en lecture lorsqu’elle expose du contenu métier, à l’exception des endpoints d’ingestion explicitement conçus pour accepter des événements validés.

## Administration

Les routes manager, traduction, visibilité administrée, upload et endpoints API privés exigent le rôle `ADMIN`. Les méthodes mutantes sont protégées par CSRF, et la concurrence optimiste empêche l’écrasement silencieux de données modifiées par ailleurs.

## Secrets

Les mots de passe, credentials PostgreSQL, secret analytics et credentials Cloudinary vivent dans l’environnement backend ou GitHub Secrets. Le frontend ne doit jamais contenir ces valeurs. Ses variables sont publiques par construction lorsqu’elles sont injectées par Vite.

## Services privés

LibreTranslate est un composant serveur. Dans l’environnement local, il est joignable uniquement sur le réseau Docker. En production, la cible recommandée est un service privé lorsque l’hébergeur le permet.
