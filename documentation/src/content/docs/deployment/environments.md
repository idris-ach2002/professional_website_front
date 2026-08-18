---
title: Environnements
description: Différences entre développement local, CI, preview et production.
---
## Développement local

Le frontend fonctionne via Vite et le backend via Spring Boot ou Docker Compose. Vite proxifie les familles de routes backend afin que l’UI puisse travailler sans reproduire toute la topologie cloud. PostgreSQL et LibreTranslate peuvent être démarrés avec Compose.

## CI applicative

La CI doit être hermétique. Les tests navigateur utilisent des contrats réseau contrôlés et un artifact frontend construit spécialement pour les E2E. Les hard gates vérifient des invariants de code et de comportement ; la télémétrie navigateur sensible à la machine est isolée dans les diagnostics.

## Production

Cloudflare distribue le frontend et Render exécute le backend. L’URL du backend, les origines autorisées et les credentials sont fournis par les environnements de déploiement. PostgreSQL et Cloudinary ne sont jamais configurés dans le bundle navigateur.

## Tableau de responsabilité

| Élément | Local | CI | Production |
|---|---|---|---|
| Frontend | Vite | artifact E2E/build | Cloudflare |
| Backend | Spring/Docker | tests Maven / contrats | Render |
| PostgreSQL | conteneur/local | Testcontainers selon suite | Aiven |
| Traduction | conteneur privé | mock/contrat selon test | service serveur privé |
| Médias | local ou Cloudinary | mocks/fixtures | Cloudinary |
| Secrets | fichiers locaux non commités | GitHub Secrets | Render / providers |
