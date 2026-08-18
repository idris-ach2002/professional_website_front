---
title: LibreTranslate
description: Service de traduction privé et chaîne de persistence des contenus localisés.
---
## Frontière réseau

LibreTranslate est consommé uniquement par Spring Boot. Le frontend appelle les endpoints d’administration `/api/translations/**`; il ne connaît ni l’URL interne du provider ni ses éventuels secrets.

<div class="architecture-frame">
  <img src="/diagrams/localization-flow.svg" alt="Flux de traduction entre administration, backend, provider privé et persistence." />
  <div class="architecture-caption">La traduction externe reste encapsulée derrière le backend.</div>
</div>

## Contrat

`LIBRETRANSLATE_ENABLED` permet d’activer la capacité. `LIBRETRANSLATE_BASE_URL` indique la cible serveur et `LIBRETRANSLATE_TIMEOUT` borne l’appel. En environnement Docker local, le service rejoint le backend sur le réseau Compose sans exposition nécessaire au navigateur.

## Persistence

Les traductions ne sont pas seulement une réponse volatile du provider. Le backend conserve les textes par type de contenu, clé, locale et champ, avec un hash de la source. Ce hash permet d’identifier qu’une traduction ne correspond plus au texte source courant.

## Dégradation

Une indisponibilité du provider ne doit pas rendre le contenu public source illisible. L’administration peut signaler l’état du provider et conserver les traductions déjà persistées ; la lecture publique continue d’utiliser les données disponibles.
