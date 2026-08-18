---
title: Secrets et environnements
description: Répartition des variables publiques, secrets serveur et secrets CI.
---
## Trois catégories

| Catégorie | Exemple | Emplacement |
|---|---|---|
| Variables frontend publiques | URL API, URL publique du site, identifiants de build | Build Vite / GitHub Actions |
| Secrets backend | datasource, compte administrateur, hash analytics, Cloudinary | Render / environnement serveur |
| Secrets de delivery | credentials Cloudflare, deploy hook Render | GitHub Secrets |

## Règle frontend

Toute variable injectée dans le bundle via `VITE_*` doit être considérée comme publique. Une valeur qui autorise une opération privilégiée ne doit jamais y être placée.

## Règle backend

Les credentials PostgreSQL, mot de passe administrateur, secret de hash analytics et secret Cloudinary sont lus uniquement depuis l’environnement du processus Spring Boot. Les fichiers d’exemple doivent contenir des valeurs factices.

## CI/CD

Les workflows consomment les secrets au moment nécessaire puis produisent des artifacts qui ne doivent pas contenir les credentials. La documentation possède son propre workflow et n’a besoin d’aucun secret applicatif pour construire le site.

## Rotation

La rotation d’un secret doit être possible sans reconstruire la logique métier. Les valeurs sont donc externalisées : mise à jour du provider, mise à jour du secret de plateforme, redémarrage contrôlé, puis vérification de santé.
