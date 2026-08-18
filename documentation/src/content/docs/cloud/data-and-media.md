---
title: PostgreSQL, médias et traduction
description: Persistence managée, Cloudinary et service de traduction privé.
sidebar:
  order: 4
---
## PostgreSQL managé

La datasource de production utilise une URL JDBC fournie par l’environnement. Le pool Hikari est volontairement borné pour respecter la capacité du service PostgreSQL. Hibernate valide le schéma ; Flyway en est la source d’évolution.

## Cloudinary

L’abstraction `StorageService` permet de choisir un stockage local ou Cloudinary. En production, les credentials Cloudinary restent côté serveur et le frontend ne manipule que des URLs publiques retournées par l’API.


<div class="architecture-frame">
  <img src="/diagrams/storage-flow.svg" alt="Upload protégé vers le provider de stockage configuré." />
  <div class="architecture-caption">Upload protégé vers le provider de stockage configuré.</div>
</div>


## LibreTranslate

LibreTranslate est conçu comme un service privé. Le navigateur ne lui parle pas. Les endpoints admin de traduction appellent le backend, qui décide ensuite de contacter le provider. Le déploiement recommandé place le service dans le même environnement privé que le backend lorsque l’offre d’hébergement le permet.


<div class="architecture-frame">
  <img src="/diagrams/localization-flow.svg" alt="Traduction automatique et persistence des traductions." />
  <div class="architecture-caption">Traduction automatique et persistence des traductions.</div>
</div>
