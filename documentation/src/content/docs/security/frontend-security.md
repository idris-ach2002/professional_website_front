---
title: Sécurité Frontend
description: Surface publique, administration, secrets et hygiène navigateur.
sidebar:
  order: 3
---
## Variables publiques

Toute variable `VITE_*` doit être considérée comme publiable dans le bundle. Les secrets n’appartiennent jamais au frontend. L’URL backend, le site public et des identifiants de build peuvent être publics ; les credentials PostgreSQL, Cloudinary et admin ne le sont pas.

## Administration

La session est détenue par le backend. `authApi` envoie les cookies avec `credentials: include`, récupère le CSRF et traite explicitement les réponses de login/unauthorized. Aucun mot de passe administrateur n’est persisté par React.

## HTML et données

Les données backend sont rendues comme valeurs React, pas injectées comme HTML arbitraire. Les URLs de médias passent par des politiques de stockage et des helpers de preview plutôt que par une concaténation de chemins système locaux.

## Headers

Les scripts de hardening vérifient CSP, anti-framing, MIME, referrer policy, permissions et cache des assets. Ces contrôles appartiennent au build frontend, pas au contenu documentaire.
