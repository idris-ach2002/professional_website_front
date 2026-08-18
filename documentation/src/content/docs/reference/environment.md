---
title: Variables Frontend
description: Variables publiques de build, proxy local, SEO, E2E et observabilité.
sidebar:
  order: 3
---
## Principe

Les variables préfixées `VITE_` sont injectées dans le code navigateur lorsqu’elles sont utilisées par le build. Elles doivent donc être considérées comme publiques. Aucun password, credential PostgreSQL ou secret Cloudinary ne doit y être placé.

## Variables applicatives

| Variable | Usage |
|---|---|
| `VITE_API_BASE_URL` | URL publique du backend utilisée par les services HTTP. |
| `VITE_USE_DIRECT_BACKEND` | Bypass explicite du proxy Vite en développement. |
| `VITE_API_PROXY_TARGET` | Cible du proxy de développement pour `/website`, `/manager`, `/api`, `/uploads`, `/csrf`, `/login`, `/logout`. |
| `VITE_PUBLIC_SITE_URL` | Origine publique utilisée par la génération statique/SEO. |
| `PUBLIC_API_BASE_URL` | Source backend utilisée par le générateur statique côté Node. |
| `STATIC_SNAPSHOT_REQUIRED` | Rend obligatoire un snapshot backend réel pendant la génération statique lorsqu’activé. |
| `VITE_UPLOAD_ENDPOINT` | Override de l’endpoint upload dans les environnements contrôlés. |
| `VITE_ANALYTICS_DISABLED` | Désactivation explicite de l’analytics, notamment pour les artifacts E2E. |
| `VITE_BUILD_ID` | Identifiant public du build affichable dans Mission Control. |
| `VITE_COMMIT_SHA` | Identifiant public du commit utilisé pour corréler le frontend livré. |
| `VITE_E2E_RUNTIME_QUALITY` | Profil runtime forcé pour l’artifact E2E hermétique. |

## Production

Le domaine public et l’origine Workers sont autorisés par le backend. L’URL backend doit être définie au build de production ; elle n’autorise aucune opération à elle seule, la sécurité métier restant côté Spring Security.

## E2E

Le script `e2e:artifact:build` fixe des valeurs locales hermétiques, désactive l’analytics et génère un stamp. Le stamp lie le `dist` aux entrées de build afin qu’un test ne puisse pas réutiliser silencieusement un artifact obsolète.
