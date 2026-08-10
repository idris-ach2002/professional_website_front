# Architecture CSS

`src/index.css` est la façade unique chargée par `main.jsx`. Elle importe les feuilles de style dans le même ordre que l'ancien fichier monolithique afin de préserver la cascade et le rendu.

## Répertoires

- `core/` : variables globales, reset et document.
- `components/` : composants publics partagés.
- `sections/` : sections fonctionnelles du portfolio.
- `effects/` : océan, aquarium et scène volcanique WebP/Canvas 2D.
- `navigation/` : couches historiques puis navigation actuellement utilisée.
- `pages/` : administration, CV et analytics.
- `overrides/` : raffinements tardifs conservés à leur position de cascade.
- `profiles/` : profils mobile et Firefox.

## Pourquoi les fichiers sont numérotés

Cette première passe est une extraction mécanique. Les préfixes numériques documentent l'ordre de cascade de l'ancien `index.css` et évitent toute régression visuelle. Une seconde passe pourra consolider les couches historiques et supprimer les règles écrasées, composant par composant, après validation visuelle.

## Règle de maintenance

Toute nouvelle règle doit aller dans le fichier de sa responsabilité. `src/index.css` ne doit contenir que des `@import` et aucun sélecteur métier.
