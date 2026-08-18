---
title: Visibilité, responsive et accessibilité
description: Masquage administrable, profils responsive et protections d’accessibilité.
sidebar:
  order: 9
---
## Visibilité administrable

`ItemVisibilityProvider` charge la configuration publique `/website/items-visibility` et maintient un ensemble de clés masquées. `VisibilityGate` permet aux composants de déclarer une clé fonctionnelle sans connaître le transport HTTP. L’administration peut modifier la configuration via l’endpoint protégé correspondant.

## Responsive

`useResponsiveProfile` rassemble dimensions, environnement navigateur, mouvement réduit, mode de performance et préférences utilisateur. Les composants reçoivent un profil plutôt que de réimplémenter chacun leur logique de détection.

## Accessibilité

- skip link vers le contenu principal ;
- focus restauré après navigation ;
- composants Mantine accessibles ;
- états masqués cohérents avec `aria-hidden` lorsque décoratifs ;
- prise en compte de `prefers-reduced-motion` ;
- fallbacks de routes et boundaries lisibles par le DOM.

## CSS

La cascade est découpée par responsabilités : fondations, vendor, navigation, sections, pages, responsive, effets et overrides ciblés. Les scripts de qualité empêchent l’accumulation non contrôlée de dette CSS et vérifient les contrats responsive.
