---
title: Vue d’ensemble du système
description: Rôle des deux dépôts et découpage fonctionnel du portfolio.
sidebar:
  order: 1
---
## Finalité

Le portfolio est une application full stack administrable. Le navigateur ne consomme pas un document statique unique : il charge une représentation publique construite à partir de données persistées, localisées et publiées par le backend. L’administration permet de préparer le contenu, contrôler sa cohérence, gérer les médias et publier un snapshot éditorial visible par le front public.

Le système est volontairement séparé en deux dépôts autonomes :

| Domaine | Responsabilité |
|---|---|
| Frontend | Expérience publique, administration, adaptation responsive, rendu visuel, observabilité navigateur, résilience de lecture. |
| Backend | API publique et protégée, sécurité, règles métier, publication, persistence, traduction, fichiers, analytics et observabilité serveur. |
| Cloud | Distribution du frontend, exécution du backend, PostgreSQL managé, médias Cloudinary et service de traduction privé. |
| Delivery | CI distinctes, artifacts, diagnostics et déploiements indépendants. |

## Frontière entre les dépôts

Le contrat principal est HTTP/JSON. En développement, Vite peut proxifier les routes backend. En production, le frontend utilise une URL backend explicite et les règles CORS du backend autorisent les origines de confiance. Les requêtes publiques utilisent des endpoints sans session ; les opérations d’administration utilisent une session Spring, des credentials cross-origin et un jeton CSRF pour les méthodes mutantes.

## Donnée publique

La lecture publique part d’un propriétaire actif et de son snapshot éditorial actif et publié. Le backend assemble profil, timeline, expériences, projets, compétences prouvées et traductions. La réponse localisée est mise en cache côté serveur puis côté navigateur sous forme de dernier état valide. Si le backend devient temporairement indisponible, le frontend peut continuer à rendre le dernier snapshot connu et, en dernier recours, un jeu de démonstration embarqué.

## Principes structurants

- **Séparation des responsabilités** : UI et rendu côté navigateur ; vérité métier côté serveur.
- **Fail closed pour l’administration** : les routes manager et API privées exigent le rôle administrateur.
- **Publication explicite** : le contenu préparé n’est pas automatiquement public.
- **Concurrence optimiste** : les mutations sensibles utilisent révisions et tags d’entité.
- **Résilience** : cache serveur, cache navigateur, retries ciblés, fallbacks visuels et traitements asynchrones persistés.
- **Observabilité** : métriques navigateur, Mission Control, Actuator, Prometheus, traces de requêtes et audits métier.
- **CI déterministe** : les gates de release vérifient des invariants ; la télémétrie sensible au scheduler est séparée.


<div class="architecture-frame">
  <img src="/diagrams/system-atlas.svg" alt="Vue d’ensemble des couches et services du portfolio." />
  <div class="architecture-caption">Vue d’ensemble des couches et services du portfolio.</div>
</div>
