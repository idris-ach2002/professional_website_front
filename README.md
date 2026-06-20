# Portfolio professionnel — full stack React / Spring Boot

> Portfolio dynamique, administrable et versionné, composé d’un frontend React déployé sur Cloudflare Workers et d’un backend Spring Boot déployé sur Render avec Docker.

[![Frontend](https://img.shields.io/badge/frontend-Cloudflare%20Workers-orange)](#déploiement)
[![Backend](https://img.shields.io/badge/backend-Render%20Docker-purple)](#déploiement)
[![Database](https://img.shields.io/badge/database-Neon%20PostgreSQL-0ea5e9)](#déploiement)
[![Storage](https://img.shields.io/badge/storage-Cloudinary-3448c5)](#déploiement)
[![Java](https://img.shields.io/badge/Java-21-b07219)](#stack-technique)
[![React](https://img.shields.io/badge/React-19-61dafb)](#stack-technique)

## Sommaire

| Document | Rôle |
|---|---|
| [`README.md`](./README.md) | Vue d’ensemble du portfolio, architecture globale, lancement local, déploiement et liens entre les deux projets. |
| [`README-BACKEND.md`](./README-BACKEND.md) | Documentation détaillée du backend Spring Boot : API, sécurité, modèle de données, stockage, CV Builder, Docker, variables d’environnement. |
| [`README-FRONTEND.md`](./README-FRONTEND.md) | Documentation détaillée du frontend React : routes, composants, intégration API, admin panel, animations, build Vite, déploiement Cloudflare. |

## Vue d’ensemble

Ce portfolio est une application full stack structurée en deux projets indépendants :

- un **frontend React** qui affiche le portfolio public, le CV et une interface d’administration ;
- un **backend Spring Boot** qui expose les API publiques et protégées, persiste les données dans PostgreSQL, gère les fichiers, les versions du site, la génération de CV LaTeX et le suivi des candidatures.

Le site n’est pas un portfolio statique. Il repose sur une donnée métier administrable : propriétaire du portfolio, profil, expériences, projets, versions de site, documents, CV et candidatures. Le frontend consomme l’API publique pour afficher la version publiée et consomme l’API protégée pour l’administration.

## Liens de production

| Service | URL / Provider |
|---|---|
| Portfolio public | `https://professional-website-front.achabou02idris.workers.dev` |
| Frontend | Cloudflare Workers Assets |
| Backend | Render, déploiement Docker |
| Base de données | NeonDB, PostgreSQL managé |
| Stockage fichiers | Cloudinary |
| Ping de maintien Render | `https://professional-website-hozo.onrender.com/actuator/health` via cron-job.org |

## Architecture globale

```txt
Navigateur
   │
   ▼
Cloudflare Workers Assets
Frontend React / Vite
   │
   │  HTTPS + credentials + CORS contrôlé
   ▼
Render
Backend Spring Boot / Docker
   │
   ├── NeonDB PostgreSQL
   │      └── données relationnelles : owners, versions, profils, timelines, projets, candidatures
   │
   ├── Cloudinary
   │      └── fichiers publics ou administrés : images, PDF, CV, exports ZIP
   │
   └── Actuator health
          └── route de ping cron-job.org pour limiter la mise en sommeil du service gratuit Render
```

## Stack technique

### Frontend

- React 19 ;
- Vite 8 ;
- Mantine 9 ;
- Tailwind CSS 4 via `@tailwindcss/vite` ;
- React Router DOM 7 ;
- Three.js, React Three Fiber, Drei et Rapier pour les scènes 3D et interactions physiques ;
- GSAP et ScrollTrigger chargés via CDN ;
- Cloudflare Workers Assets via Wrangler.

### Backend

- Java 21 ;
- Spring Boot 4.0.6 ;
- Spring Web MVC ;
- Spring Data JPA / Hibernate ;
- PostgreSQL ;
- Flyway configuré côté application ;
- Bean Validation Jakarta ;
- Spring Security, CSRF, CORS, formulaire de connexion Thymeleaf ;
- Actuator health ;
- Cloudinary SDK ;
- Docker multi-stage ;
- LaTeX / latexmk / TeX Live dans l’image Docker pour la génération PDF.

## Fonctionnalités principales

| Domaine | Fonctionnalités |
|---|---|
| Portfolio public | Affichage du profil, des expériences, des projets publiés, des liens, du CV et des métadonnées SEO. |
| Administration | Création et modification d’un owner, profil, timeline, expériences, projets et contacts. |
| Versioning | Gestion de plusieurs versions du portfolio, duplication d’une version, activation d’une version unique, validation avant publication. |
| Fichiers | Upload protégé, stockage local en développement ou Cloudinary en production, preview d’images et de PDF. |
| CV Builder | Construction d’un CV LaTeX, preview PDF, sauvegarde, export ZIP, contrôle qualité et compilation asynchrone avec SSE. |
| Candidatures | Suivi des candidatures, statuts, analyse d’offre, génération de lettres, variantes CV et smart pack. |
| Sécurité | API manager protégée, rôle `ADMIN`, CSRF sur les méthodes mutantes, CORS restrictif, redirections frontend contrôlées. |
| Déploiement | Front Cloudflare, back Render Docker, base NeonDB, fichiers Cloudinary, health ping cron-job.org. |

## Lancement local

### 1. Backend

À lancer depuis le dossier du backend.

```bash
docker compose down
docker compose build --no-cache backend
docker compose up backend
```

Cette commande démarre le backend et le service PostgreSQL déclaré dans `docker-compose.yml`. Le backend est exposé sur :

```txt
http://localhost:8080
```

La base PostgreSQL locale est exposée sur :

```txt
localhost:5433
```

Route de santé locale :

```txt
http://localhost:8080/actuator/health
```

### 2. Frontend en mode production local

À lancer depuis le dossier du frontend.

```bash
npm run build
npm run preview
```

Le preview Vite est exposé par défaut sur :

```txt
http://localhost:4173
```

Cette URL est déjà prévue dans la configuration CORS locale du backend.

### 3. Frontend en mode développement

Le mode développement existe également :

```bash
npm run dev
```

Il démarre généralement sur :

```txt
http://localhost:5173
```

En développement, Vite proxifie les routes backend (`/website`, `/manager`, `/api`, `/uploads`, `/csrf`, `/login`, `/logout`) vers `http://localhost:8080`, sauf configuration contraire via `VITE_API_PROXY_TARGET`.

## Connexion frontend / backend

En production, le frontend utilise une URL backend explicite via :

```txt
VITE_API_BASE_URL=https://professional-website-hozo.onrender.com
```

Le backend doit autoriser l’origine Cloudflare dans :

```txt
APP_CORS_ALLOWED_ORIGINS=https://professional-website-front.achabou02idris.workers.dev
APP_FRONTEND_ALLOWED_ORIGINS=https://professional-website-front.achabou02idris.workers.dev
APP_FRONTEND_ORIGIN=https://professional-website-front.achabou02idris.workers.dev
```

En local, les origines utiles sont :

```txt
http://localhost:5173
http://localhost:4173
```

## Déploiement

### Frontend — Cloudflare Workers Assets

Le frontend est compilé par Vite puis servi comme Single Page Application via Cloudflare Workers Assets. La configuration est portée par `wrangler.jsonc` :

```txt
assets.directory = ./dist
assets.not_found_handling = single-page-application
```

Commande de déploiement disponible côté frontend :

```bash
npm run build
npm run cf:deploy
```

### Backend — Render avec Docker

Le backend est construit depuis le `Dockerfile`. L’image :

1. compile l’application Maven avec Java 21 ;
2. installe les dépendances LaTeX nécessaires à la génération de CV ;
3. expose le port applicatif Spring Boot ;
4. lance `app.jar`.

Render fournit la variable `PORT`. L’application l’utilise via :

```yaml
server:
  port: ${PORT:8080}
```

### Base de données — NeonDB PostgreSQL

En production, Spring Boot se connecte à NeonDB via les variables :

```txt
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

### Stockage — Cloudinary

Le stockage de fichiers peut être local ou Cloudinary. En production :

```txt
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=portfolio
```

### Health ping Render

L’offre gratuite Render peut mettre le service en sommeil. Pour réduire ce comportement, cron-job.org appelle périodiquement :

```txt
https://professional-website-hozo.onrender.com/actuator/health
```

Cette route est volontairement légère : elle expose uniquement l’état de santé Actuator et ne retourne pas les données métier du portfolio.

## Structure recommandée des dépôts

Si les deux projets sont séparés, placer les README comme suit :

```txt
portfolio-root/
├── README.md
├── README-BACKEND.md
├── README-FRONTEND.md
├── professional_website/                # backend Spring Boot
└── professional_website_front/          # frontend React
```

Ou, dans deux dépôts séparés :

```txt
professional_website/
└── README.md                 # contenu de README-BACKEND.md

professional_website_front/
└── README.md                 # contenu de README-FRONTEND.md
```

## Notes d’audit

- Le frontend inspecté utilise Three.js / React Three Fiber / Rapier. PixiJS n’est pas présent dans les dépendances de cette version.
- GSAP est chargé par CDN dans `index.html`, et non par dépendance npm.
- Flyway est configuré dans `application.yaml`, mais l’archive inspectée ne contient pas de dossier `src/main/resources/db/migration`. Le fichier SQL d’index partiel existe dans `src/main/java/.../sql`; pour une production stricte, il devrait être versionné dans `src/main/resources/db/migration` avec un nom de migration Flyway.
- Les fichiers `.env` et secrets ne doivent jamais être commités. Utiliser les fichiers `.env.example` / `.env.local.example` comme base.

## Licence

Le projet contient un fichier `LICENSE` dans les deux bases de code. Se référer au contenu de ces fichiers pour les conditions exactes.
