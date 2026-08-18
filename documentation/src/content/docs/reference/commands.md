---
title: Commandes Frontend
description: Commandes quotidiennes du dépôt et de sa documentation.
sidebar:
  order: 4
---
## Développement

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Qualité de release

```bash
CI=1 npm run ci:full
```

## Diagnostics

```bash
CI=1 npm run ci:diagnostics
```

Les diagnostics n’ont pas vocation à remplacer `ci:full` comme verdict de release.

## Documentation

```bash
cd documentation
npm install
npm run check
npm run dev
npm run build
```
