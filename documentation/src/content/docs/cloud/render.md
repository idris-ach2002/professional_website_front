---
title: Render
description: Exécution Docker du backend et intégration au pipeline de production.
sidebar:
  order: 3
---
## Conteneur backend

Le backend utilise un Dockerfile multi-stage : compilation avec le Maven Wrapper puis image runtime Java minimale. Le processus tourne avec un utilisateur non privilégié, et le port applicatif est piloté par la variable fournie par la plateforme.

## Déploiement

Après validation du backend, GitHub Actions peut appeler un deploy hook Render. Le dépôt ne publie donc pas directement un secret d’API dans le code. L’environnement de production fournit la datasource PostgreSQL, les credentials administrateur, CORS, stockage, traduction et limites de concurrence.

## Santé

`/actuator/health` est public et adapté aux probes. `/actuator/prometheus` reste protégé par le rôle administrateur. Un scheduler externe peut appeler la route de santé selon la stratégie d’exploitation choisie.
