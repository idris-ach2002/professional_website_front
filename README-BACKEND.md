# Backend — Portfolio professionnel Spring Boot

> API backend du portfolio professionnel : gestion du contenu public, administration sécurisée, versioning de site, uploads, génération de CV LaTeX et suivi des candidatures.

[![Java](https://img.shields.io/badge/Java-21-b07219)](#stack)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-6db33f)](#stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20%2F%20local-336791)](#base-de-données)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed)](#docker)

## Sommaire

- [Rôle du backend](#rôle-du-backend)
- [Stack](#stack)
- [Architecture applicative](#architecture-applicative)
- [Modèle de données](#modèle-de-données)
- [API principales](#api-principales)
- [Sécurité](#sécurité)
- [Stockage fichiers](#stockage-fichiers)
- [CV Builder LaTeX](#cv-builder-latex)
- [Module candidatures](#module-candidatures)
- [Lancement local Docker](#lancement-local-docker)
- [Variables d’environnement](#variables-denvironnement)
- [Déploiement Render](#déploiement-render)
- [Points d’attention](#points-dattention)

## Rôle du backend

Le backend centralise la logique métier du portfolio. Il fournit :

- une API publique pour exposer le portfolio publié ;
- une API d’administration protégée pour gérer le contenu ;
- un modèle relationnel PostgreSQL ;
- un système de versions du portfolio ;
- la gestion des fichiers en local ou via Cloudinary ;
- la génération de CV PDF à partir de LaTeX ;
- un module de suivi et d’optimisation de candidatures ;
- une route de santé légère utilisée en production par Render et cron-job.org.

## Stack

| Couche | Technologie |
|---|---|
| Runtime | Java 21 |
| Framework | Spring Boot 4.0.6 |
| API HTTP | Spring Web MVC |
| Persistance | Spring Data JPA, Hibernate |
| Base | PostgreSQL local / NeonDB en production |
| Validation | Jakarta Bean Validation |
| Sécurité | Spring Security, CSRF, BCrypt, rôle `ADMIN` |
| Templates serveur | Thymeleaf pour la page de login et les pages d’erreur |
| Migrations | Flyway configuré |
| Monitoring minimal | Spring Boot Actuator, endpoint `/actuator/health` |
| Stockage | Local filesystem ou Cloudinary |
| Packaging | Maven Wrapper, Docker multi-stage |
| Génération PDF | LaTeX, latexmk, TeX Live dans l’image Docker |

## Architecture applicative

Le code est organisé par responsabilités :

```txt
src/main/java/sorbonne/professional_website/
├── controller/          # API portfolio, owner, profile, timeline, projects, versions
├── dto/                 # DTO request / response
├── entity/              # entités JPA principales
├── repository/          # repositories Spring Data JPA
├── service/             # logique métier transactionnelle
├── mapper/              # conversion DTO ↔ entités
├── security/            # Spring Security, login, CSRF, redirections front
├── upload/              # stockage local / Cloudinary
├── cv/                  # génération CV LaTeX, compilation, exports
├── applications/        # suivi de candidatures, analyse d’offres, smart pack
├── config/              # configuration Jackson
└── exception/           # gestion d’erreurs REST
```

Le backend suit une séparation classique :

```txt
Controller → Service → Repository → Entity
        DTO ↔ Mapper ↔ Entity
```

Les services sont transactionnels et portent les règles métier : activation d’une version unique, duplication de version, validation avant publication, génération de fichiers, export ZIP et mise à jour cohérente des agrégats.

## Modèle de données

### Agrégat portfolio

```txt
Owner
 ├── contacts[]
 └── WebsiteVersion[]
      ├── Profile
      ├── Timeline
      │    └── Experience[]
      └── Project[]
           ├── stacks[]
           ├── features[]
           └── links[]
```

### Entités principales

| Entité | Rôle |
|---|---|
| `Owner` | Représente le propriétaire du portfolio : identité, âge, adresse, contacts et versions du site. |
| `WebsiteVersion` | Version complète du portfolio. Une version contient un profil, une timeline et des projets. |
| `Profile` | Présentation professionnelle : titre, sous-titre, description, image, logo, CV, URL du portfolio. |
| `Timeline` | Bloc de parcours qui regroupe les expériences. |
| `Experience` | Formation, stage, alternance, CDI, CDD ou autre expérience. |
| `Project` | Projet publié ou non, avec statut, dates, image, URLs, stacks, fonctionnalités et liens typés. |
| `JobApplication` | Candidature suivie dans l’admin : entreprise, poste, offre, statut, score, documents, notes. |

### Version active unique

Le système permet plusieurs versions du portfolio pour un même `Owner`, mais une seule doit être active à la fois. La logique applicative désactive les autres versions avant activation d’une nouvelle version.

Le repository contient aussi une méthode de verrouillage pessimiste :

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Owner> lockByOwnerId(Long ownerId);
```

Ce verrou évite les activations concurrentes incohérentes sur un même owner.

Un fichier SQL prévoit également une garantie PostgreSQL :

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uk_one_active_website_version_per_owner
ON website_version(owner_id)
WHERE active = true;
```

## API principales

### API publique

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/website` | Liste les portfolios publics. |
| `GET` | `/website/default` | Retourne le premier owner / portfolio par défaut. |
| `GET` | `/website/{ownerId}` | Retourne le portfolio public d’un owner. |
| `GET` | `/uploads/files/{filename}` | Sert un fichier uploadé, selon le provider configuré. |
| `GET` | `/actuator/health` | Route de santé légère. |

### API manager protégée

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/manager` | Liste les owners pour l’admin. |
| `POST` | `/manager` | Crée un owner. |
| `GET` | `/manager/{ownerId}` | Lit un owner. |
| `PUT` | `/manager/{ownerId}` | Met à jour un owner. |
| `DELETE` | `/manager/{ownerId}` | Supprime un owner. |
| `POST` | `/manager/{ownerId}/profile` | Crée ou remplace un profil. |
| `PUT` | `/manager/{ownerId}/profile` | Met à jour un profil. |
| `POST` | `/manager/{ownerId}/timeline` | Crée ou remplace une timeline. |
| `PUT` | `/manager/{ownerId}/timeline` | Met à jour une timeline. |
| `POST` | `/manager/{ownerId}/projects` | Ajoute un projet. |

### API versions

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/manager/{ownerId}/versions` | Liste les versions d’un owner. |
| `GET` | `/manager/{ownerId}/versions/active` | Lit la version active. |
| `GET` | `/manager/{ownerId}/versions/{versionId}` | Lit une version précise. |
| `POST` | `/manager/{ownerId}/versions` | Crée une version. |
| `POST` | `/manager/{ownerId}/versions/from/{sourceVersionId}` | Duplique une version existante. |
| `PUT` | `/manager/{ownerId}/versions/{versionId}` | Met à jour les métadonnées d’une version. |
| `PUT` | `/manager/{ownerId}/versions/{versionId}/activate` | Active une version. |
| `PUT` | `/manager/{ownerId}/versions/{versionId}/activate-validated` | Active après validation métier. |
| `DELETE` | `/manager/{ownerId}/versions/{versionId}` | Supprime une version. |
| `GET` | `/manager/{ownerId}/versions/{versionId}/health` | Rapport de cohérence. |
| `GET` | `/manager/{ownerId}/versions/{versionId}/publish-validation` | Validation avant publication. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/backup/export` | Exporte une sauvegarde. |
| `POST` | `/manager/{ownerId}/versions/backup/restore` | Restaure une sauvegarde. |

### API projets par version

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/manager/{ownerId}/versions/{versionId}/projects` | Liste les projets d’une version. |
| `GET` | `/manager/{ownerId}/versions/{versionId}/projects/{projectId}` | Lit un projet. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/projects` | Ajoute un projet à une version. |
| `PUT` | `/manager/{ownerId}/versions/{versionId}/projects/{projectId}` | Met à jour un projet. |
| `DELETE` | `/manager/{ownerId}/versions/{versionId}/projects/{projectId}` | Supprime un projet. |

### API CV Builder

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/manager/{ownerId}/versions/{versionId}/cv/source` | Génère la source LaTeX par défaut. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/cv/source` | Génère une source LaTeX à partir d’une requête. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/cv/preview` | Compile et retourne une preview PDF. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/cv/save` | Compile et sauvegarde le CV. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/cv/export-zip` | Exporte un ZIP reproductible. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/cv/quality` | Retourne un rapport qualité. |
| `POST` | `/manager/{ownerId}/versions/{versionId}/cv/compile-jobs` | Lance une compilation asynchrone. |
| `GET` | `/manager/{ownerId}/versions/{versionId}/cv/compile-jobs/{jobId}` | Lit l’état d’un job. |
| `GET` | `/manager/{ownerId}/versions/{versionId}/cv/compile-jobs/{jobId}/events` | Stream SSE d’un job de compilation. |
| `GET` | `/manager/{ownerId}/versions/{versionId}/cv/version` | Lit la version liée au CV. |

### API candidatures

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/manager/{ownerId}/applications` | Liste les candidatures, avec filtre optionnel par statut. |
| `GET` | `/manager/{ownerId}/applications/dashboard` | Retourne les indicateurs de suivi. |
| `GET` | `/manager/{ownerId}/applications/{applicationId}` | Lit une candidature. |
| `POST` | `/manager/{ownerId}/applications` | Crée une candidature. |
| `PUT` | `/manager/{ownerId}/applications/{applicationId}` | Met à jour une candidature. |
| `DELETE` | `/manager/{ownerId}/applications/{applicationId}` | Supprime une candidature. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/status/{status}` | Change le statut. |
| `POST` | `/manager/{ownerId}/applications/analyze-offer` | Analyse une offre. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/cover-letter/preview` | Prévisualise une lettre. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/cover-letter/save` | Sauvegarde une lettre. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/export-zip` | Exporte un dossier de candidature. |
| `GET` | `/manager/{ownerId}/applications/letter-templates` | Liste les modèles de lettres. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/analyze-smart` | Analyse intelligente. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/generate-cv-variants` | Propose des variantes CV. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/generate-letter-variants` | Propose des variantes de lettre. |
| `POST` | `/manager/{ownerId}/applications/{applicationId}/smart-pack` | Exporte un smart pack. |

## Sécurité

Le backend utilise Spring Security avec une stratégie fermée par défaut.

### Règles principales

- `/website/**` est public en lecture ;
- `/actuator/health` est public en `GET` ;
- `/login` est public ;
- `/manager/**`, `/api/**`, `/uploads/**` sont protégés par le rôle `ADMIN` ;
- `/csrf` est accessible uniquement après authentification ;
- les requêtes `OPTIONS` sont autorisées pour les preflights CORS ;
- tout le reste est refusé avec `anyRequest().denyAll()`.

### Authentification

L’admin est défini par variables d’environnement :

```txt
PORTFOLIO_ADMIN_USERNAME
PORTFOLIO_ADMIN_PASSWORD
```

Le mot de passe est encodé avec BCrypt au démarrage. L’implémentation actuelle utilise un `InMemoryUserDetailsManager`, suffisant pour un portfolio personnel administré par un seul utilisateur.

### CSRF

Les mutations effectuées depuis le frontend récupèrent d’abord un token via :

```txt
GET /csrf
```

Le frontend transmet ensuite le header retourné par Spring Security, généralement :

```txt
X-CSRF-TOKEN: <token>
```

### CORS

Le backend accepte uniquement les origines configurées :

```txt
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,https://professional-website-front.achabou02idris.workers.dev
```

Les credentials sont autorisés, car le frontend utilise les cookies de session :

```java
configuration.setAllowCredentials(true);
```

### Redirections frontend

Après login, le backend redirige vers le frontend uniquement si l’origine est autorisée. Cela évite les redirections ouvertes vers des domaines non prévus.

## Stockage fichiers

Le backend expose un service de stockage abstrait :

```txt
StorageService
├── FileSystemStorageService
└── CloudinaryStorageService
```

### Local

```txt
STORAGE_PROVIDER=local
UPLOAD_DIR=/app/uploads
```

En Docker Compose, les fichiers sont conservés dans le volume :

```txt
uploads-data:/app/uploads
```

### Production Cloudinary

```txt
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=portfolio
```

Le contrôleur d’upload retourne au frontend un objet contenant le nom de fichier et l’URL exploitable.

## CV Builder LaTeX

Le backend contient un module `cv/` dédié à la génération de CV.

Fonctionnalités :

- génération de source LaTeX à partir d’une version du portfolio ;
- override manuel de la source ;
- compilation PDF ;
- sauvegarde du PDF généré ;
- export ZIP reproductible ;
- rapport qualité ;
- compilation asynchrone ;
- streaming d’événements via SSE ;
- cache de compilation pour éviter de recompiler inutilement une source identique.

Le `Dockerfile` installe les paquets nécessaires :

```txt
latexmk
texlive-latex-base
texlive-latex-recommended
texlive-latex-extra
texlive-fonts-recommended
texlive-fonts-extra
texlive-pictures
texlive-lang-french
```

Le compilateur par défaut est :

```txt
CV_LATEX_COMPILER=latexmk
```

Les autres valeurs prévues par le service sont `pdflatex` et `tectonic`, si les binaires correspondants sont disponibles dans l’image.

## Module candidatures

Le module `applications/` ajoute un mini outil de suivi de candidatures.

Il gère :

- les statuts : `DRAFT`, `TO_SEND`, `SENT`, `FOLLOW_UP`, `INTERVIEW`, `REJECTED`, `ACCEPTED`, `ARCHIVED` ;
- le texte d’offre ;
- l’entreprise et le poste ;
- les URLs d’offre, CV, lettre et ZIP ;
- un score de pertinence ;
- les mots-clés présents et manquants ;
- les recommandations ;
- des variantes de CV et de lettres ;
- un export de dossier de candidature.

## Lancement local Docker

### Prérequis

- Docker ;
- Docker Compose ;
- un fichier `.env` à la racine du backend.

Créer le fichier `.env` à partir du modèle :

```bash
cp .env.local.example .env
```

Puis lancer :

```bash
docker compose down
docker compose build --no-cache backend
docker compose up backend
```

Le service PostgreSQL local est lancé automatiquement grâce au `depends_on` du service backend.

### Ports locaux

| Service | Port hôte | Port conteneur |
|---|---:|---:|
| Backend Spring Boot | `8080` | `8080` |
| PostgreSQL | `5433` | `5432` |

### Vérifications

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/website/default
```

La première commande vérifie l’état applicatif. La seconde vérifie l’API publique du portfolio.

## Variables d’environnement

### Base locale Docker Compose

```txt
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=change-me
```

### Connexion Spring à PostgreSQL

En local Docker Compose, ces variables sont construites depuis le service `postgres` :

```txt
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}
SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
```

En production Render + NeonDB, elles doivent pointer vers NeonDB.

### Sécurité admin

```txt
PORTFOLIO_ADMIN_USERNAME=admin
PORTFOLIO_ADMIN_PASSWORD=change-me
```

### CORS et frontend

```txt
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,https://professional-website-front.achabou02idris.workers.dev
APP_FRONTEND_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,https://professional-website-front.achabou02idris.workers.dev
APP_FRONTEND_ORIGIN=http://localhost:4173
```

En production, `APP_FRONTEND_ORIGIN` doit pointer vers l’origine Cloudflare.

### JPA

```txt
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true
HIBERNATE_FORMAT_SQL=true
HIBERNATE_HIGHLIGHT_SQL=true
```

Pour une production plus stricte, préférer `JPA_DDL_AUTO=validate` après avoir stabilisé les migrations Flyway.

### Uploads

```txt
STORAGE_PROVIDER=local
UPLOAD_DIR=/app/uploads
```

Ou :

```txt
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=portfolio
```

### CV Builder

```txt
CV_LATEX_COMPILER=latexmk
CV_LATEX_TIMEOUT_SECONDS=45
CV_STORE_LATEX_SOURCE=true
```

## Déploiement Render

Le backend est déployable via Docker.

### Build

Render doit construire l’image depuis le `Dockerfile`.

Le Dockerfile réalise :

1. build Maven avec `maven:3.9-eclipse-temurin-21` ;
2. runtime avec `eclipse-temurin:21-jre` ;
3. installation des dépendances LaTeX ;
4. copie de l’artefact `app.jar` ;
5. démarrage avec `java $JAVA_OPTS -jar app.jar`.

### Variables Render minimales

```txt
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<db>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-user>
SPRING_DATASOURCE_PASSWORD=<neon-password>

PORTFOLIO_ADMIN_USERNAME=<admin>
PORTFOLIO_ADMIN_PASSWORD=<password>

APP_CORS_ALLOWED_ORIGINS=https://professional-website-front.achabou02idris.workers.dev
APP_FRONTEND_ALLOWED_ORIGINS=https://professional-website-front.achabou02idris.workers.dev
APP_FRONTEND_ORIGIN=https://professional-website-front.achabou02idris.workers.dev

STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_FOLDER=portfolio

CV_LATEX_COMPILER=latexmk
CV_LATEX_TIMEOUT_SECONDS=45
CV_STORE_LATEX_SOURCE=true
```

### Health ping

Pour limiter la mise en sommeil de l’offre gratuite Render, un cron externe peut appeler :

```txt
https://professional-website-hozo.onrender.com/actuator/health
```

La route est publique en `GET` et ne retourne que l’état de santé minimal de l’application.

## Points d’attention

### Secrets

Ne jamais commiter :

- `.env` réel ;
- identifiants NeonDB ;
- credentials Cloudinary ;
- mot de passe admin ;
- exports contenant des données personnelles.

### Flyway

Flyway est activé dans `application.yaml` :

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
```

Dans l’archive inspectée, le fichier SQL d’index partiel n’est pas placé sous `src/main/resources/db/migration`. Pour un usage production rigoureux, créer par exemple :

```txt
src/main/resources/db/migration/V1__create_unique_active_website_version_index.sql
```

et y déplacer l’index PostgreSQL.

### Coût Render gratuit

Le ping cron garde le service plus disponible, mais il reste dépendant des limites de l’offre gratuite. La route `/actuator/health` est le meilleur compromis, car elle évite de charger les données métier ou de provoquer une compilation / génération coûteuse.
