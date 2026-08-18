---
title: Développement local
description: Démarrer les deux projets et reproduire leurs interactions locales.
sidebar:
  order: 1
---
## Backend

Le moyen le plus complet est Docker Compose : PostgreSQL, LibreTranslate et backend partagent le réseau `portfolio-network`. PostgreSQL est exposé sur un port local distinct du port interne du conteneur ; le backend reste sur son port HTTP habituel.

```bash
docker compose up --build
```

## Frontend

En développement :

```bash
npm install
npm run dev
```

Vite proxifie les routes backend vers l’URL définie par `VITE_API_PROXY_TARGET`, avec une valeur locale par défaut. Pour reproduire le comportement de build :

```bash
npm run build
npm run preview
```

## Documentation

Dans chaque dépôt :

```bash
cd documentation
npm install
npm run dev
```

Le site documentaire est indépendant des pipelines applicatifs et peut donc évoluer sans devenir une précondition cachée du build du produit.
