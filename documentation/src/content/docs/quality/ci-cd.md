---
title: CI/CD
description: Pipelines, artifacts et séparation entre release et télémétrie.
sidebar:
  order: 2
---
## Isolation des pipelines

Les workflows frontend et backend sont indépendants. Chacun installe son runtime, utilise son gestionnaire de dépendances et produit ses propres artifacts. Aucun workflow ne compile implicitement l’autre dépôt.


<div class="architecture-frame">
  <img src="/diagrams/ci-cd.svg" alt="CI/CD indépendante mais convergente vers la même production." />
  <div class="architecture-caption">CI/CD indépendante mais convergente vers la même production.</div>
</div>


## Artifacts

Le frontend produit un build hermétique réutilisé par les jobs navigateur. Le backend produit les rapports de tests, la couverture et le JAR. Les rapports Playwright sont uploadés même en cas de diagnostic incomplet afin de conserver les traces utiles.

## Documentation

Le workflow `documentation.yml` ne s’exécute que lorsque `README.md`, `documentation/**` ou le workflow documentaire changent. Il valide les règles de contenu puis construit le site Starlight. Il ne participe pas au gate de release de l’application.
