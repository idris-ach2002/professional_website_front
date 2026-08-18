---
title: Stratégie de tests
description: Organisation des hard gates, tests déterministes et diagnostics.
sidebar:
  order: 1
---
<div class="architecture-frame">
  <img src="/diagrams/test-strategy.svg" alt="Du changement de code au gate de release, puis aux diagnostics." />
  <div class="architecture-caption">Du changement de code au gate de release, puis aux diagnostics.</div>
</div>


## Règle principale

Un hard gate doit reposer sur une précondition contrôlée, une action explicite et une postcondition observable. Un délai, un `repeat-each`, un scheduler navigateur ou un score performance absolu ne constitue pas à lui seul une vérité fonctionnelle.

## Frontend

- Vitest pour fonctions, services, politiques runtime et protocoles Worker.
- Testing Library pour les composants et hooks avec dépendances contrôlées.
- Playwright pour contrats navigateur déterministes, responsive et intégration hermétique.
- Diagnostics séparés pour Web Vitals, Main Thread et endurance.
- Build E2E hermétique afin que tous les jobs navigateur consomment le même artifact.

## Backend

- JUnit pour règles métier, sécurité, mappers et services.
- MockMvc pour les contrats HTTP.
- PostgreSQL/Testcontainers pour persistence et concurrence réelle.
- JaCoCo pendant `verify`.
- Scripts d’architecture et d’hygiène avant le package.

## Philosophie de panne

Un test rouge doit correspondre à une cause diagnostiquable : invariant rompu, contrat HTTP incorrect, problème d’infrastructure ou bug de test. La CI ne doit pas devenir un générateur aléatoire de verdicts.
