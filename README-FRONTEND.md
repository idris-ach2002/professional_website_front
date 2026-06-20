# Frontend — Portfolio professionnel React / Vite

> Interface publique et interface d’administration du portfolio. Le front est construit avec React, Mantine, Tailwind CSS, Vite, Three.js et une intégration API sécurisée avec le backend Spring Boot.

[![React](https://img.shields.io/badge/React-19-61dafb)](#stack)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](#stack)
[![Mantine](https://img.shields.io/badge/Mantine-9-339af0)](#stack)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20Assets-f38020)](#déploiement-cloudflare)

## Sommaire

- [Rôle du frontend](#rôle-du-frontend)
- [Stack](#stack)
- [Routes](#routes)
- [Structure du code](#structure-du-code)
- [Architecture des données](#architecture-des-données)
- [Intégration API](#intégration-api)
- [Interface publique](#interface-publique)
- [Admin panel](#admin-panel)
- [CV Studio](#cv-studio)
- [Animations et 3D](#animations-et-3d)
- [Lancement local](#lancement-local)
- [Variables d’environnement](#variables-denvironnement)
- [Build et déploiement Cloudflare](#build-et-déploiement-cloudflare)
- [Points d’attention](#points-dattention)

## Rôle du frontend

Le frontend assure deux rôles :

1. **portfolio public** : affichage du profil, des expériences, des projets, du CV et des liens de contact ;
2. **back-office** : administration complète du contenu, des versions, des fichiers, des CV et des candidatures.

L’application est une SPA React servie par Cloudflare Workers Assets en production. Elle consomme le backend Spring Boot déployé sur Render.

## Stack

| Domaine | Technologie |
|---|---|
| Framework UI | React 19 |
| Build | Vite 8 |
| UI kit | Mantine 9 |
| Styles | Tailwind CSS 4, CSS custom |
| Routing | React Router DOM 7 |
| 3D | Three.js, React Three Fiber, Drei |
| Physique | React Three Rapier / Rapier |
| Animations DOM/SVG | GSAP 3.13 et ScrollTrigger via CDN |
| Déploiement | Wrangler, Cloudflare Workers Assets |
| Outillage | ESLint 9, React Compiler Babel plugin |

Remarque : PixiJS n’est pas présent dans les dépendances de cette version du frontend. La partie visuelle inspectée repose sur Three.js, GSAP, CSS et SVG.

## Routes

| Route | Composant | Description |
|---|---|---|
| `/` | `Home` dans `App.jsx` | Portfolio public. |
| `/admin` | `Admin.jsx` | Interface d’administration protégée par le backend. |
| `/cv` | `CvPage.jsx` | Page dédiée à l’affichage du CV PDF. |
| `*` | `Navigate` | Redirection vers `/`. |

Le routeur est initialisé dans `main.jsx` avec `BrowserRouter`.

## Structure du code

```txt
src/
├── App.jsx                         # orchestration des routes et chargement du portfolio
├── main.jsx                        # bootstrap React, MantineProvider, BrowserRouter
├── index.css                       # style global, responsive, thème visuel
├── services/
│   ├── portfolioApi.js             # API publique, fallback demo
│   └── authApi.js                  # API protégée, CSRF, cookies, upload, logout
├── components/
│   ├── Admin.jsx                   # back-office complet
│   ├── CvPage.jsx                  # page CV PDF
│   ├── FilePreview.jsx             # preview images/PDF
│   ├── MetadataHead.jsx            # métadonnées SEO dynamiques
│   ├── OceanMorphBackground.jsx    # fond animé SVG
│   ├── PortfolioTimeline.jsx       # timeline du parcours
│   ├── ProfileHero.jsx             # hero profil + contacts
│   ├── ProjectsShowcase.jsx        # galerie/carrousel projets
│   ├── SiteFooter.jsx              # footer
│   ├── StatusBanner.jsx            # source API/demo/erreur
│   ├── TopNavigation.jsx           # navigation sticky
│   └── three/
│       ├── BeachBallField.jsx      # scène 3D interactive avec physique
│       └── OceanBubbleField.jsx    # animation canvas/Three.js de gouttes/bulles
├── utils/
│   ├── adminJsonImport.js          # normalisation d’import JSON admin
│   ├── filePreview.js              # normalisation et détection fichiers
│   └── portfolio.js                # helpers métier front
└── data/
    └── demoPortfolio.js            # fallback si l’API est indisponible
```

## Architecture des données

Le front consomme principalement la forme métier exposée par l’API backend :

```txt
owner
├── identity / contacts
├── prof
│   ├── title
│   ├── description
│   ├── profileImageUrl
│   └── cvUrl
├── timeline
│   └── experiences[]
└── projects[]
```

Les projets et expériences sont triés par `displayOrder`, puis par date quand nécessaire.

## Intégration API

### API publique

Le service `portfolioApi.js` appelle :

```txt
GET /website/default
```

En cas d’échec ou de timeout, le frontend bascule sur `src/data/demoPortfolio.js`. Ce fallback évite d’afficher une page vide si le backend Render est en sommeil ou temporairement indisponible.

Timeout côté front :

```txt
REQUEST_TIMEOUT = 4500 ms
```

### API protégée

Le service `authApi.js` centralise :

- la construction des URLs backend ;
- les requêtes `credentials: "include"` ;
- la détection des redirections vers `/login` ;
- le renouvellement du token CSRF ;
- les erreurs d’authentification ;
- l’upload multipart protégé ;
- le logout admin.

Pour les méthodes mutantes (`POST`, `PUT`, `PATCH`, `DELETE`), le frontend récupère un token via :

```txt
GET /csrf
```

puis l’envoie dans le header retourné par Spring Security.

### Mode local avec proxy Vite

En développement, Vite proxifie ces routes vers le backend local :

```txt
/website
/manager
/api
/uploads
/csrf
/login
/logout
```

La cible par défaut est :

```txt
http://localhost:8080
```

Elle peut être modifiée via :

```bash
VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev
```

### Mode production / preview

En production et en preview buildé, le frontend utilise `VITE_API_BASE_URL` pour appeler directement Render.

Exemple :

```txt
VITE_API_BASE_URL=https://professional-website-hozo.onrender.com
```

## Interface publique

Le portfolio public est composé de plusieurs blocs :

| Composant | Rôle |
|---|---|
| `MetadataHead` | Injecte les métadonnées SEO dynamiques. |
| `OceanMorphBackground` | Fond visuel animé. |
| `TopNavigation` | Navigation principale. |
| `StatusBanner` | Indique si les données viennent de l’API ou du fallback demo. |
| `ProfileHero` | Présente l’identité, le titre, les contacts et les indicateurs clés. |
| `PortfolioTimeline` | Affiche le parcours et les expériences. |
| `BeachBallField` | Ajoute une scène 3D interactive. |
| `ProjectsShowcase` | Affiche les projets avec galerie, modale détails et liens. |
| `SiteFooter` | Regroupe les liens finaux et le contact. |

`PortfolioTimeline` et `BeachBallField` sont chargés avec `lazy()` et `Suspense` pour réduire le coût initial de rendu.

## Admin panel

`Admin.jsx` est le composant le plus dense du frontend. Il fournit une interface d’administration complète.

Fonctions principales :

- authentification par session backend ;
- récupération des owners ;
- création et modification d’un owner ;
- gestion des contacts ;
- gestion des versions ;
- duplication d’une version ;
- activation et validation avant publication ;
- édition du profil ;
- édition de la timeline et des expériences ;
- édition des projets ;
- upload d’images, PDF et documents ;
- preview des fichiers ;
- import / export JSON ;
- health report d’une version ;
- suivi des candidatures ;
- analyse d’offres ;
- génération de variantes CV et lettres ;
- export de packs de candidature.

L’admin ne contourne pas la sécurité : il appelle les routes protégées du backend avec cookies de session et CSRF.

## CV Studio

Le frontend contient un éditeur CV avancé intégré dans `Admin.jsx`.

Fonctionnalités côté front :

- document CV normalisé en JSON ;
- sections activables / désactivables ;
- drag & drop logique par déplacement d’items ;
- réglages de typographie ;
- réglages de densité, colonnes, couleurs et layout ;
- génération locale de source LaTeX ;
- édition manuelle de la source ;
- rapport qualité local ;
- analyse d’offre pour adapter le CV ;
- variantes CV ;
- assets photo et logos d’écoles ;
- export ZIP reproductible via backend ;
- compilation asynchrone via backend.

Le backend reste responsable de la compilation PDF réelle, car l’image Docker contient LaTeX.

## Animations et 3D

### GSAP

GSAP et ScrollTrigger sont chargés via CDN dans `index.html` :

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
```

Le helper `src/animations/useGsap.js` attend la disponibilité de `window.gsap`, scope les animations et nettoie les timelines au démontage.

### Three.js / React Three Fiber / Rapier

`BeachBallField.jsx` crée une scène 3D interactive avec :

- modèle GLB public : `/models/ABSTRACT_SHAPES.glb` ;
- objets clonés ;
- matériaux variés ;
- corps physiques Rapier ;
- collisions ;
- impulsions au clic ;
- interaction pointeur ;
- rendu responsive.

`OceanBubbleField.jsx` génère des textures canvas et anime des gouttes/bulles avec Three.js et scroll progress.

### Accessibilité performance

Le code tient compte de `prefers-reduced-motion` sur les animations lourdes. Les composants visuels sont chargés progressivement et le build sépare plusieurs chunks vendors.

## Lancement local

### Installation

Le projet contient `package-lock.json`, `pnpm-lock.yaml` et `packageManager: pnpm@10.11.1`. Si l’équipe utilise npm, rester cohérent avec npm. Si elle utilise pnpm, rester cohérent avec pnpm.

Avec npm :

```bash
npm install
```

Avec pnpm :

```bash
pnpm install
```

### Mode production local demandé

```bash
npm run build
npm run preview
```

Le site est servi par Vite Preview sur :

```txt
http://localhost:4173
```

Cette origine est prévue dans les variables CORS locales du backend.

### Mode développement

```bash
npm run dev
```

Le serveur Vite démarre généralement sur :

```txt
http://localhost:5173
```

Si le backend local n’est pas sur `8080` :

```bash
VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev
```

## Variables d’environnement

Créer un fichier `.env.local` dans le projet frontend si nécessaire.

### Production / preview direct backend

```txt
VITE_API_BASE_URL=https://professional-website-hozo.onrender.com
```

En production, `portfolioApi.js` et `authApi.js` utilisent directement cette base URL.

### Développement avec backend direct

Par défaut en développement, le frontend utilise le proxy Vite. Pour forcer les appels directs au backend :

```txt
VITE_USE_DIRECT_BACKEND=true
VITE_API_BASE_URL=http://localhost:8080
```

### Proxy local Vite

```txt
VITE_API_PROXY_TARGET=http://localhost:8080
```

### Upload endpoint

```txt
VITE_UPLOAD_ENDPOINT=/uploads/
```

## Build et déploiement Cloudflare

### Build

```bash
npm run build
```

Le build génère le dossier :

```txt
dist/
```

### Preview local du build

```bash
npm run preview
```

### Déploiement Cloudflare

```bash
npm run cf:deploy
```

Cette commande exécute :

```bash
npx --yes wrangler@latest deploy
```

La configuration Cloudflare se trouve dans `wrangler.jsonc` :

```jsonc
{
  "name": "professional-website-front",
  "compatibility_date": "2026-06-15",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

Le `not_found_handling` en mode `single-page-application` est nécessaire pour que les routes `/admin` et `/cv` fonctionnent au rechargement navigateur.

## Scripts npm

| Script | Description |
|---|---|
| `npm run dev` | Lance Vite en développement. |
| `npm run build` | Compile le frontend pour production. |
| `npm run preview` | Sert localement le build. |
| `npm run lint` | Lance ESLint. |
| `npm run clean` | Supprime certains dossiers de cache / build / node_modules selon le script présent. |
| `npm run cf:deploy` | Déploie sur Cloudflare via Wrangler. |

## Points d’attention

### CORS et cookies

Le backend utilise une session cookie et le frontend appelle l’API protégée avec `credentials: "include"`. Il faut donc que :

- l’origine frontend soit présente dans `APP_CORS_ALLOWED_ORIGINS` côté backend ;
- `APP_FRONTEND_ALLOWED_ORIGINS` contienne aussi l’origine Cloudflare ;
- le backend expose les cookies avec une configuration compatible HTTPS en production.

### Render peut dormir

Si Render met le backend en sommeil, le premier chargement API peut échouer ou être lent. Le front bascule alors sur le fallback demo. Le ping cron-job.org sur `/actuator/health` réduit ce risque, sans charger les données métier.

### GSAP via CDN

GSAP n’est pas installé par npm dans cette version. Si une politique de sécurité stricte interdit les scripts CDN, il faudra :

```bash
npm install gsap
```

puis remplacer l’accès global `window.gsap` par des imports ESM.

### Cohérence npm / pnpm

Le projet contient deux lockfiles. Pour une CI/CD propre, choisir un seul gestionnaire de paquets et supprimer l’autre lockfile afin d’éviter des installations divergentes.

### Variables publiques Vite

Toute variable préfixée `VITE_` est exposée au navigateur après build. Ne jamais y mettre de secret.
