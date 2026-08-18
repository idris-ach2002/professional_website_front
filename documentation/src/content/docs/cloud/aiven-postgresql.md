---
title: Aiven PostgreSQL
description: Datasource de production, TLS, pool Hikari, migrations et capacité de connexion.
---
## Rôle

Aiven héberge la base PostgreSQL de production. Le backend est l’unique composant applicatif qui ouvre des connexions SQL ; le navigateur et Cloudflare n’accèdent jamais directement à la base.

La connexion de production est fournie au backend sous forme JDBC via `SPRING_DATASOURCE_URL`, accompagnée de `SPRING_DATASOURCE_USERNAME` et `SPRING_DATASOURCE_PASSWORD`. La configuration prévue exige TLS au niveau de la datasource.

## Pool de connexions

HikariCP protège le service managé contre un nombre de connexions excessif. Les paramètres `DB_POOL_MAX_SIZE`, `DB_POOL_MIN_IDLE`, `DB_POOL_CONNECTION_TIMEOUT_MS`, `DB_POOL_VALIDATION_TIMEOUT_MS`, `DB_POOL_IDLE_TIMEOUT_MS`, `DB_POOL_MAX_LIFETIME_MS` et `DB_POOL_KEEPALIVE_TIME_MS` permettent d’adapter le pool à la capacité réellement disponible.

Le pool doit être dimensionné avec les autres consommateurs PostgreSQL en tête : migrations au démarrage, requêtes HTTP, jobs, outbox, analytics et observabilité ne doivent pas créer des pools indépendants non bornés.

## Schéma

Flyway est l’autorité d’évolution du schéma. Hibernate est configuré pour valider la structure en production plutôt que pour la modifier implicitement. Cette séparation permet de savoir exactement quelle migration introduit une table, une colonne, un index ou une contrainte.

## Données hébergées

PostgreSQL conserve notamment :

- owners et snapshots `WebsiteVersion` ;
- profil, timeline, expériences et projets ;
- traductions persistées ;
- visibilité administrée ;
- analytics ;
- jobs et outbox ;
- audit de publication ;
- échantillons de performance runtime.

## Sauvegarde et restauration

Le plan de reprise doit combiner les mécanismes de sauvegarde du provider avec les fonctions d’export/restore métier du backend. Une restauration infrastructurelle ne remplace pas la validation fonctionnelle d’un snapshot avant publication.
