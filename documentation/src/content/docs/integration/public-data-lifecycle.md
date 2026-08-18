---
title: Cycle de la donnée publique
description: Comment une modification administrée devient une réponse publique localisée et cachée.
sidebar:
  order: 3
---
## De l’édition à la lecture

Le contenu administré vit dans un snapshot éditorial associé au propriétaire. Les modifications ne changent pas implicitement la surface publique. La publication vérifie d’abord la santé du snapshot, modifie son état transactionnel, écrit les événements nécessaires et conserve un audit.


<div class="architecture-frame">
  <img src="/diagrams/publication-pipeline.svg" alt="Pipeline de publication et invalidation de cache." />
  <div class="architecture-caption">Pipeline de publication et invalidation de cache.</div>
</div>


Une fois la publication effective, l’événement est traité par l’outbox. Le handler métier notifie `PortfolioChangePublisher`, qui invalide les caches publics. La prochaine requête `/website/default` reconstruit alors la réponse à partir du snapshot actif publié.

## Localisation

Les textes traduisibles sont stockés séparément avec une clé logique, une locale, un champ, un hash source et un statut. La lecture publique applique uniquement les traductions considérées publiables ; le contenu source reste la référence si une traduction n’est pas applicable.


<div class="architecture-frame">
  <img src="/diagrams/localization-flow.svg" alt="Chaîne de traduction administrée et lecture publique." />
  <div class="architecture-caption">Chaîne de traduction administrée et lecture publique.</div>
</div>


## Conséquence côté navigateur

Le frontend reçoit un objet déjà localisé. Il ne traduit pas les données métier côté client. Il gère uniquement ses propres libellés d’interface via le provider de langue.
