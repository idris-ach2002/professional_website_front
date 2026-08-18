---
title: Glossaire
description: Termes métier, runtime et infrastructure utilisés dans la documentation.
---
| Terme | Définition |
|---|---|
| **Owner** | Racine métier du portfolio administré. |
| **WebsiteVersion** | Snapshot éditorial préparé, prévisualisé et publié par le backend. |
| **contentRevision** | Révision métier utilisée pour détecter les écritures concurrentes. |
| **ETag / If-Match** | Précondition HTTP utilisée par certaines mutations administratives. |
| **Public snapshot** | Représentation localisée exposée par `/website/**`. |
| **LKG** | Dernier état public valide conservé côté navigateur pour la résilience. |
| **World Director** | Coordination du monde visuel et de la section active côté frontend. |
| **Performance Runtime** | Couche qui calcule budgets, qualité, scheduling et lifecycle navigateur. |
| **OffscreenCanvas** | Capacité permettant de transférer certaines surfaces de rendu à un Worker. |
| **Outbox** | Journal transactionnel d’événements à dispatcher de façon fiable. |
| **Background Job** | Travail persistant pouvant être planifié, annulé ou rejoué. |
| **Publication Audit** | Trace métier des opérations de publication et de leurs corrélations. |
| **Mission Control** | Surface d’observabilité corrélant runtime navigateur et signaux backend. |
| **Hard gate** | Contrôle déterministe capable de bloquer une release. |
| **Diagnostic** | Télémétrie informative qui ne décide pas seule de la validité fonctionnelle. |
