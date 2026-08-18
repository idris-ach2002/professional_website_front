---
title: Bootstrap et Providers
description: Ordre d’initialisation React et responsabilités des contextes globaux.
---
## Entrée applicative

`src/main.jsx` crée la racine React puis compose les providers avant de rendre `App`. L’ordre est intentionnel : Mantine fournit le système UI ; le contexte de langue détermine la locale ; les préférences d’animation alimentent le runtime ; le runtime de performance expose les budgets ; le routeur fournit la navigation ; enfin l’Error Boundary capture une faute applicative non gérée.

## Providers

| Provider | Responsabilité |
|---|---|
| `MantineProvider` | primitives UI, thème et comportements Mantine |
| `LanguageProvider` | locale active et synchronisation des contenus localisés |
| `AnimationPreferencesProvider` | mode d’animation, pause et préférences utilisateur |
| `PerformanceRuntimeProvider` | profil de capacité, budget, scheduler et lifecycle |
| `BrowserRouter` | résolution des routes publiques et administratives |
| `AppErrorBoundary` | confinement des erreurs React |
| `ItemVisibilityProvider` | visibilité administrée des sections et éléments |

## Règle de dépendance

Les composants de contenu ne doivent pas reconstruire leur propre runtime global. Ils consomment les providers existants. Cela évite des listeners globaux dupliqués, des boucles RAF concurrentes et des divergences de préférences.

## Chargement différé

`App.jsx` réserve le chemin initial aux éléments nécessaires au premier rendu. Timeline, projets, footer, volcan, administration, pages CV/recruteur/engineering, pages projet et 404 sont chargés à la demande selon la route ou la progression de la page.
