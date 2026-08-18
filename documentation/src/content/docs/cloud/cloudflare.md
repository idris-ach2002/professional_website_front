---
title: Cloudflare
description: Distribution du frontend, DNS, TLS et configuration Workers Assets.
sidebar:
  order: 2
---
## Distribution

Le frontend est compilé dans `dist/`. `wrangler.jsonc` désigne ce dossier comme répertoire d’assets et définit le comportement des routes inconnues. Les fichiers statiques bénéficient de la distribution edge de Cloudflare tandis que le routage applicatif est assuré côté React.

## Build de production

Le workflow de déploiement reconstruit un artifact avec les variables publiques de production, génère les pages statiques/SEO nécessaires et vérifie les budgets avant d’appeler Wrangler. Les secrets Cloudflare restent dans GitHub Actions.

## Rôle de Cloudflare dans la sécurité

Cloudflare protège le transport et distribue les assets ; l’autorisation métier reste entièrement dans Spring Security. Le frontend public ne doit jamais embarquer de secrets backend ou Cloudinary privés.
