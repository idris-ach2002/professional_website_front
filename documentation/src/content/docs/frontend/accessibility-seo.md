---
title: Accessibilité et SEO
description: Contrats de navigation, reduced motion, pages statiques et métadonnées.
---
## Accessibilité

Le frontend doit fonctionner au clavier, conserver un ordre de focus logique et respecter `prefers-reduced-motion`. Les surfaces visuelles avancées ne sont pas des préconditions pour accéder au contenu. Les contrôles mobiles et administratifs utilisent les primitives sémantiques adaptées et les éléments inactifs restent inert lorsque nécessaire.

## Mouvement

La préférence reduced motion réduit ou supprime les animations décoratives et évite de transformer des transitions complexes en barrière d’accès. Les tests responsive utilisent cette configuration lorsqu’ils vérifient la géométrie plutôt que l’animation.

## SEO

Le build Vite est suivi d’une génération statique destinée aux routes publiques indexables. `VITE_PUBLIC_SITE_URL`, `PUBLIC_API_BASE_URL` et `STATIC_SNAPSHOT_REQUIRED` pilotent la génération du snapshot SEO. Les checkers valident ensuite les pages produites, les métadonnées et les contraintes de performance.

## Résilience SEO

La génération statique ne doit pas inventer une donnée de production silencieusement. Lorsque le build exige un snapshot réel, l’option dédiée transforme l’absence de données en échec explicite plutôt qu’en page générée avec un contenu inattendu.
