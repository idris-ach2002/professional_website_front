---
title: Troubleshooting
description: Diagnostic structuré des pannes les plus probables.
sidebar:
  order: 2
---
## Portfolio vide ou fallback

1. vérifier l’origine de la donnée affichée dans `StatusBanner` ;
2. appeler `/actuator/health` ;
3. vérifier `/website/default?locale=fr` directement ;
4. contrôler `VITE_API_BASE_URL` et les règles CORS ;
5. examiner les logs Render et le request ID si une erreur JSON est retournée.

## Login en boucle

Vérifier l’HTTPS, la politique SameSite/Secure du cookie, l’origine frontend autorisée, les credentials des fetchs et la cible de redirection. Un environnement local lancé en HTTP ne reproduit pas exactement le cookie de production.

## Upload impossible

Vérifier le provider de stockage, la taille maximale, les credentials Cloudinary si activé et la policy de type/nom. Les credentials ne doivent pas être testés depuis le navigateur.

## Traduction indisponible

Appeler la route de santé du provider depuis l’admin, puis vérifier la connectivité backend → LibreTranslate et sa configuration privée.

## Performance visuelle

Consulter les diagnostics plutôt que modifier un hard gate. Vérifier runtime quality, préférence d’animation, ressources actives et état des Workers avant d’attribuer un problème au DOM principal.
