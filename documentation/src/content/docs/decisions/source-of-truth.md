---
title: Source de vérité
description: Règles utilisées pour garder la documentation alignée avec le code exécuté.
sidebar:
  order: 1
---
## Référence

La documentation est construite à partir de la branche `main`, du code source, des fichiers de configuration, des migrations, des contrats HTTP et des workflows réellement présents dans les deux dépôts.

## Priorité en cas d’écart

1. **Contrat exécutable** : tests, sécurité, mapping, migrations et configuration de runtime.
2. **Code source** : comportement réellement livré.
3. **Configuration cloud et CI** : variables, build, déploiement et observabilité.
4. **Documentation** : elle doit être corrigée dès qu’elle diverge des trois niveaux précédents.

## Portée

Le corpus documente le système qui doit être compris, exploité et déployé aujourd’hui. Les concepts métier portant un nom technique tel que `WebsiteVersion`, `contentRevision`, ETag ou migration Flyway restent décrits lorsqu’ils font partie du comportement courant.
