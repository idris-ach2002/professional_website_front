---
title: Build et artifacts
description: Pipeline Vite, snapshot statique, artifact E2E et budgets de source.
---
## Build applicatif

`npm run build` enchaîne les checkers d’architecture avant Vite, génère ensuite les pages statiques/SEO puis vérifie les budgets de performance. Cette organisation empêche un bundle techniquement compilable mais non conforme aux contrats du dépôt d’être considéré comme livrable.

## Artifact E2E

Les tests navigateur de release utilisent un artifact hermétique. Le script d’artifact calcule une empreinte des entrées de build et refuse un `dist` construit à partir d’un état source différent. Cette règle évite qu’un test vert exécute involontairement un bundle obsolète.

## Fermeture initiale

Le checker de fermeture initiale mesure le nombre de fichiers et le volume source atteignable par le chemin de démarrage. Les modules lourds doivent rester différés lorsque leur présence n’est pas nécessaire au premier affichage.

## Cloudflare

`wrangler.jsonc` publie `dist` avec Workers Assets. Le déploiement cloud consomme donc le même artifact de production que celui validé par les contrôles de build.
