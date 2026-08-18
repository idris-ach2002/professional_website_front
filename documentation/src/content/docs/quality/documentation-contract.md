---
title: Contrat documentaire
description: Règles qui maintiennent la documentation alignée avec le système courant.
sidebar:
  order: 3
---
## Objectif

Le site documentaire est traité comme un produit autonome : navigation structurée, pages techniques spécialisées, diagrammes maintenables et contrôle automatisé. Son contenu doit rester cohérent avec la branche `main` et les contrats exécutables des deux dépôts.

## Organisation

Le dépôt conserve `README.md` comme unique façade Markdown à la racine. Le corpus détaillé vit dans `documentation/src/content/docs/`. Les schémas rendus sont dans `documentation/public/diagrams/` et leurs sources Graphviz dans `documentation/diagram-sources/`.

## Contrôle automatisé

`npm run check` dans `documentation/` vérifie notamment :

- frontmatter sur toutes les pages ;
- présence des diagrammes structurants ;
- unicité de la façade `README.md` hors du site documentaire ;
- cohérence du corpus avec la branche principale ;
- taille minimale du corpus afin d’éviter une documentation réduite à quelques pages isolées.

## Séparation avec le produit

Le workflow documentaire construit le site séparément. La présence ou l’absence d’une page Markdown n’est jamais utilisée comme précondition cachée d’un test applicatif. Les pipelines du produit et de la documentation restent indépendants.
