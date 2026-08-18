---
title: Front ↔ Back
description: Contrat d’intégration entre l’application React et l’API Spring Boot.
sidebar:
  order: 1
---
## Contrat réseau

Le frontend consomme le backend par HTTP/JSON. En développement, le serveur Vite proxifie `/website`, `/manager`, `/api`, `/uploads`, `/csrf`, `/login` et `/logout` vers le backend local. En production, les services frontend construisent les URLs à partir de `VITE_API_BASE_URL`.


<div class="architecture-frame">
  <img src="/diagrams/request-lifecycle.svg" alt="Cycle complet d’une lecture publique." />
  <div class="architecture-caption">Cycle complet d’une lecture publique.</div>
</div>


## Familles d’appels

| Famille | Frontend | Backend | Authentification |
|---|---|---|---|
| Portfolio public | `portfolioApi.js` | `/website/**` | Publique |
| Analytics | `analyticsApi.js` | `/analytics/events` | Publique, ingestion limitée |
| Engineering | `engineeringApi.js` | `/api/engineering/**` | Lecture publique, échantillons autorisés |
| Administration | `authApi.js` + hooks admin | `/manager/**`, `/api/**`, `/uploads/**` | Session ADMIN |
| Traductions | `translationApi.js` | `/api/translations/**` | Session ADMIN |
| Visibilité | `ItemVisibilityProvider` | `/website/items-visibility` + `/api/items-visibility` | Public / ADMIN selon opération |

## Discipline des DTO

Le backend n’expose pas directement ses entités JPA. Les contrôleurs renvoient des DTO ; les mappers définissent la frontière entre modèle de persistence et contrat JSON. Côté frontend, les services normalisent les réponses et convertissent les échecs HTTP en erreurs applicatives spécialisées lorsque l’action demande une session ou une révision fraîche.

## Couplage volontairement faible

Aucun build frontend n’embarque le backend et inversement. Le contrat est vérifiable par tests d’API, tests navigateur hermétiques et OpenAPI protégé. Cette séparation permet de déployer les deux services indépendamment tout en conservant une intégration explicitement documentée.
