---
title: Rollback et récupération
description: Stratégies de retour arrière applicatif et éditorial.
sidebar:
  order: 3
---
## Code applicatif

Git reste la source du code déployé. Un retour arrière applicatif consiste à redéployer un commit connu comme sain via le pipeline correspondant, sans modifier manuellement les artifacts générés.

## Contenu éditorial

Le backend possède un mécanisme distinct : un snapshot éditorial antérieur peut servir de source à un nouveau snapshot de rollback. Ce mécanisme conserve la traçabilité au lieu de réactiver silencieusement une ligne existante. Le pipeline de publication, l’outbox et l’audit restent utilisés.

## Base de données

Les migrations Flyway doivent rester compatibles avec la stratégie de rollback du code. Un rollback applicatif ne doit pas supposer que la base peut revenir automatiquement à un ancien schéma. Pour les migrations destructives, prévoir sauvegarde, compatibilité transitoire et procédure manuelle documentée.
