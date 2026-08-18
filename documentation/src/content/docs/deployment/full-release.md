---
title: Release complète
description: Du changement Git à la mise en production des deux services.
sidebar:
  order: 2
---
<div class="architecture-frame">
  <img src="/diagrams/ci-cd.svg" alt="Chaîne de vérification et déploiement des deux dépôts." />
  <div class="architecture-caption">Chaîne de vérification et déploiement des deux dépôts.</div>
</div>


## Frontend

<div class="architecture-frame">
  <img src="/diagrams/deployment-topology.svg" alt="Topologie de déploiement frontend, backend et services de données." />
  <div class="architecture-caption">GitHub Actions, Cloudflare, Render, PostgreSQL, médias et traduction.</div>
</div>

Le chemin de release exécute les contrôles statiques, les tests unitaires, la couverture, la construction hermétique et les contrats navigateur déterministes. Le build de production est ensuite reconstruit avec les variables publiques de production et déployé via Wrangler.

Les diagnostics dépendants des conditions du navigateur, tels que Web Vitals et Main Thread, sont conservés pour l’observabilité mais ne doivent pas transformer un scheduler de runner partagé en verdict fonctionnel.

## Backend

Le workflow vérifie l’hygiène du dépôt, les invariants d’architecture et `clean verify`. Les tests d’intégration utilisent PostgreSQL réel via Testcontainers lorsque nécessaire. Un JAR est publié comme artifact. Sur un push de la branche principale, un hook peut déclencher Render.

## Ordre opérationnel

Le frontend et le backend peuvent être déployés indépendamment tant que le contrat HTTP reste compatible. Lors d’un changement de contrat, l’ordre doit préserver une période de compatibilité : backend tolérant d’abord, frontend consommateur ensuite, puis nettoyage éventuel.
