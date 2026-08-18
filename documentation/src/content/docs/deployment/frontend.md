---
title: Déploiement Frontend
description: Build Vite, snapshot SEO et publication Cloudflare.
sidebar:
  order: 4
---
## Entrées de production

Les variables publiques les plus importantes sont `VITE_API_BASE_URL` et `VITE_PUBLIC_SITE_URL`. Le build statique utilise aussi `PUBLIC_API_BASE_URL` afin de récupérer un snapshot public pour la génération SEO lorsque la politique l’exige.

## Pipeline

```bash
npm run build
npm run cf:deploy
```

Le build exécute d’abord les checkers d’architecture, responsive, performance, localisation, sécurité et release, puis Vite. La génération statique enrichit l’output et un contrôle final vérifie les budgets et métadonnées.

## Artifact E2E

La CI de qualité construit un artifact E2E hermétique et le transmet aux jobs navigateur. Cela évite que chaque job reconstruise un frontend différent avec des sources ou variables différentes.
