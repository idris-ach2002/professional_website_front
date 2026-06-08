# Portfolio Professionnel — Front React / Backend Spring

Interface de portfolio professionnel générique, conçue pour consommer un backend Spring Boot et afficher dynamiquement un profil, un parcours, des projets, des liens de contact et des éléments SEO.

Le projet vise un rendu **élégant, dense, responsive et orienté milieu professionnel** : recruteur, client, école, entretien d'alternance ou présentation de compétences techniques.

---

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Fonctionnalités](#fonctionnalités)
- [Architecture du projet](#architecture-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement en développement](#lancement-en-développement)
- [Connexion au backend Spring](#connexion-au-backend-spring)
- [Variables d'environnement](#variables-denvironnement)
- [Structure attendue de l'API](#structure-attendue-de-lapi)
- [SEO](#seo)
- [Build production](#build-production)
- [Commandes utiles](#commandes-utiles)
- [Personnalisation](#personnalisation)
- [Dépannage](#dépannage)
- [Axes d'amélioration](#axes-damélioration)

---

## Aperçu

Ce front récupère les données du portfolio depuis le backend via `GET /manager`.

Si l'API Spring n'est pas disponible, l'application bascule automatiquement sur un jeu de données local situé dans :

```txt
src/data/demoPortfolio.js
```

Cette logique permet de travailler sur l'interface même lorsque le backend n'est pas encore lancé.

---

## Stack technique

### Frontend

- React
- Vite
- Mantine UI
- Tailwind CSS
- MUI Lab Timeline
- Framer Motion
- JavaScript moderne ES Modules

### Backend attendu

- Spring Boot
- Java 21
- Spring Web MVC
- Spring Data JPA
- PostgreSQL
- DTO request / response
- Validation Jakarta

---

## Fonctionnalités

### Interface professionnelle

- Hero section large et premium.
- Mise en avant du titre professionnel, de la disponibilité et du positionnement métier.
- Sections très larges pour occuper correctement les grands écrans.
- Design responsive desktop, tablette et mobile.
- Navigation fixe avec progression de scroll.

### Données dynamiques

Le front consomme les données suivantes depuis le backend :

- propriétaire du portfolio ;
- profil professionnel ;
- contacts ;
- parcours / timeline ;
- expériences ;
- projets ;
- stacks techniques ;
- liens externes.

### Projets

- Affichage sous forme de cartes professionnelles.
- Recherche textuelle.
- Filtrage par statut.
- Filtrage par technologie.
- Mode projets mis en avant.
- Export JSON des projets filtrés.
- Gestion des liens : GitHub, démo, documentation, autres liens.

### Timeline

- Timeline basée sur les composants MUI Lab.
- Personnalisation visuelle complète.
- Animation des éléments au scroll.
- Affichage du type d'expérience : formation, stage, alternance, CDI, CDD, freelance, certification, etc.

### Contact

- Affichage dynamique des contacts issus du backend.
- Copie rapide de l'adresse email.
- Génération d'une vCard locale.
- Liens vers GitHub, LinkedIn, portfolio, site web, etc.

### SEO

- Titre dynamique.
- Meta description dynamique.
- Keywords.
- Canonical URL.
- Open Graph.
- Twitter Card.
- JSON-LD `schema.org/Person`.
- `robots.txt`.
- `sitemap.xml`.
- `site.webmanifest`.

---

## Architecture du projet

```txt
professional_website_front_refonte/
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── site.webmanifest
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── ContactSection.jsx
│   │   ├── ExpertisePanel.jsx
│   │   ├── PortfolioTimeline.jsx
│   │   ├── ProfileHero.jsx
│   │   ├── ProjectsShowcase.jsx
│   │   ├── SectionTitle.jsx
│   │   ├── MetadataHead.jsx
│   │   ├── StatusBanner.jsx
│   │   └── TopNavigation.jsx
│   │
│   ├── data/
│   │   └── demoPortfolio.js
│   │
│   ├── services/
│   │   └── portfolioApi.js
│   │
│   ├── utils/
│   │   └── portfolio.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .npmrc
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## Prérequis

Installer au minimum :

- Node.js LTS récent ;
- npm ;
- Java 21 pour le backend ;
- PostgreSQL si le backend est lancé avec la configuration actuelle ;
- Maven ou le wrapper Maven fourni par le projet Spring.

Vérifier les versions :

```bash
node -v
npm -v
java -version
```

---

## Installation

Depuis le dossier du front :

```bash
npm install --registry=https://registry.npmjs.org/
```

Si une ancienne installation bloque ou semble tourner en boucle :

```bash
rm -rf node_modules package-lock.json
npm cache verify
npm install --registry=https://registry.npmjs.org/
```

---

## Lancement en développement

### 1. Lancer le backend Spring

Depuis le dossier backend :

```bash
./mvnw spring-boot:run
```

Sous Windows :

```bash
mvnw.cmd spring-boot:run
```

Par défaut, le backend est attendu sur :

```txt
http://localhost:8080
```

### 2. Lancer le front React

Depuis le dossier frontend :

```bash
npm run dev
```

Le front Vite sera généralement disponible sur :

```txt
http://localhost:5173
```

---

## Connexion au backend Spring

Le front appelle principalement :

```http
GET /manager
```

Cet endpoint doit retourner une liste de propriétaires de portfolio.

Le front prend actuellement le premier élément du tableau :

```js
owners[0]
```

Cela permet de conserver une logique générique : le backend peut gérer plusieurs owners, plusieurs versions ou plusieurs portfolios, tandis que le front affiche une version active ou prioritaire.

---

## Variables d'environnement

Créer un fichier `.env.local` dans le dossier frontend si nécessaire :

```bash
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8080
```

### Recommandation en développement

Laisser `VITE_API_BASE_URL` vide afin d'utiliser le proxy Vite :

```bash
VITE_API_BASE_URL=
```

Dans ce cas, les appels `/manager` et `/api/**` sont redirigés vers Spring via `vite.config.js`.

### Recommandation en production

Définir l'URL complète de l'API :

```bash
VITE_API_BASE_URL=https://api.exemple.fr
```

---

## Structure attendue de l'API

Réponse attendue pour `GET /manager` :

```json
[
  {
    "ownerId": 1,
    "name": "ACHABOU",
    "firstName": "Idris",
    "age": 23,
    "address": "Paris / Île-de-France",
    "contacts": [
      {
        "type": "EMAIL",
        "value": "idris.achabou@example.com"
      },
      {
        "type": "GITHUB",
        "value": "https://github.com/idris-ach2002"
      }
    ],
    "prof": {
      "id": 1,
      "title": "Alternance ingénierie logicielle",
      "subtitle": "Master Informatique — STL, Sorbonne Université",
      "headline": "Développement logiciel · Architecture backend · Data pipelines",
      "shortDescription": "Profil orienté conception robuste et interfaces produit.",
      "description": "Description détaillée du profil professionnel.",
      "location": "Paris / IDF",
      "availability": "Alternance 12 mois — septembre 2026",
      "profileImageUrl": "",
      "logoUrl": "",
      "cvUrl": "",
      "portfolioUrl": ""
    },
    "timeline": {
      "id": 1,
      "title": "Parcours",
      "description": "Formation, expériences et projets structurants.",
      "experiences": []
    },
    "projects": []
  }
]
```

### Endpoints backend disponibles

Le backend expose notamment :

```txt
GET     /manager
GET     /manager/{ownerId}
POST    /manager
PUT     /manager/{ownerId}
DELETE  /manager/{ownerId}

POST    /manager/{ownerId}/profile
PUT     /manager/{ownerId}/profile

POST    /manager/{ownerId}/timeline
PUT     /manager/{ownerId}/timeline

POST    /manager/{ownerId}/projects

GET     /api/profiles
GET     /api/profiles/{profileId}
POST    /api/profiles
PUT     /api/profiles/{profileId}
DELETE  /api/profiles/{profileId}

GET     /api/timelines
GET     /api/timelines/{timelineId}
POST    /api/timelines
PUT     /api/timelines/{timelineId}
DELETE  /api/timelines/{timelineId}

GET     /api/experiences
GET     /api/experiences/{experienceId}
POST    /api/experiences
PUT     /api/experiences/{experienceId}
DELETE  /api/experiences/{experienceId}

GET     /api/projects
GET     /api/projects/{projectId}
POST    /api/projects
PUT     /api/projects/{projectId}
DELETE  /api/projects/{projectId}
```

---

## SEO

Le composant responsable du SEO est :

```txt
src/components/MetadataHead.jsx
```

Il met à jour dynamiquement :

- `document.title` ;
- `meta[name="description"]` ;
- `meta[name="keywords"]` ;
- `link[rel="canonical"]` ;
- balises Open Graph ;
- balises Twitter Card ;
- JSON-LD `Person`.

Les fichiers publics suivants complètent le référencement :

```txt
public/robots.txt
public/sitemap.xml
public/site.webmanifest
```

Avant mise en production, adapter :

- le domaine dans `sitemap.xml` ;
- l'URL canonique ;
- les images Open Graph ;
- les liens de portfolio/CV ;
- les coordonnées publiques.

---

## Build production

Créer une version optimisée :

```bash
npm run build
```

Prévisualiser le build :

```bash
npm run preview
```

Le build est généré dans :

```txt
dist/
```

---

## Commandes utiles

```bash
npm run dev       # lance le serveur Vite
npm run build     # génère le build de production
npm run preview   # prévisualise le build
npm run lint      # vérifie le code avec ESLint
npm run clean     # supprime certains dossiers temporaires et node_modules
```

---

## Personnalisation

### Modifier les données de démonstration

Quand le backend n'est pas lancé, modifier :

```txt
src/data/demoPortfolio.js
```

### Modifier les couleurs, espacements et effets visuels

La majorité du design est centralisée dans :

```txt
src/index.css
```

### Modifier les composants principaux

- `ProfileHero.jsx` : section d'accueil.
- `ExpertisePanel.jsx` : compétences et domaines techniques.
- `ProjectsShowcase.jsx` : projets, filtres et export.
- `PortfolioTimeline.jsx` : timeline MUI personnalisée.
- `ContactSection.jsx` : contact, vCard, liens.
- `MetadataHead.jsx` : SEO dynamique.

---

## Dépannage

### `npm install` tourne en boucle

Nettoyer l'installation locale :

```bash
rm -rf node_modules package-lock.json
npm cache verify
npm install --registry=https://registry.npmjs.org/
```

Vérifier aussi que `.npmrc` ne pointe pas vers un registre privé inaccessible.

### Le front affiche les données de démonstration

Cela signifie que l'appel `/manager` échoue.

Vérifier :

```bash
curl http://localhost:8080/manager
```

Si l'API ne répond pas, relancer Spring Boot.

### Erreur CORS

En développement, utiliser le proxy Vite en laissant `VITE_API_BASE_URL` vide.

En production, configurer CORS côté Spring ou servir le front et le back derrière le même domaine.

### Erreur PostgreSQL au lancement du backend

Vérifier dans le backend :

```txt
src/main/resources/application.yaml
```

Points à contrôler :

- URL JDBC ;
- nom de la base ;
- utilisateur ;
- mot de passe ;
- serveur PostgreSQL lancé.

Il est recommandé de ne pas versionner de vrais identifiants de base de données. Utiliser plutôt des variables d'environnement ou un profil local non commité.

### Warning de taille de chunk au build

Le warning peut venir de l'utilisation combinée de Mantine, MUI et Framer Motion dans une SPA. Le build reste valide.

---

## Licence

Projet académique/professionnel.
