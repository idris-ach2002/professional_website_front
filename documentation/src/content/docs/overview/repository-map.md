---
title: Carte des dépôts
description: Où trouver les responsabilités principales dans les deux projets.
sidebar:
  order: 3
---
## Dépôt frontend React

La documentation ne duplique pas chaque fichier ; elle regroupe les sources par responsabilité et indique les points d’entrée qui structurent le système.

### Frontend

- `src/App.jsx` : composition des routes et surfaces publiques.
- `src/main.jsx` : providers racine et bootstrap React.
- `src/services/` : clients HTTP publics, protégés, analytics, engineering et traduction.
- `src/performance/` : runtime adaptatif, scheduler, budgets, registre de ressources et protocoles Worker.
- `src/components/admin/` : cockpit d’administration.
- `src/components/mission-control/` : observabilité technique.
- `src/workers/` : calculs et rendus déportables.
- `src/styles/` : cascade organisée par fondations, navigation, sections, pages, responsive et profils de performance.
- `e2e/` : contrats navigateur et diagnostics.
- `scripts/` : hardening, budgets et vérifications d’architecture.

## Dépôt complémentaire

Le backend Spring Boot n’est pas une boîte noire. Les pages **Front ↔ Back** documentent les endpoints effectivement consommés, les credentials, les erreurs et les flux de publication. La carte globale relie les modules des deux dépôts sans imposer de couplage de build entre eux.
