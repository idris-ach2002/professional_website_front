---
title: Topologie cloud
description: Services de production et responsabilités de chaque provider.
sidebar:
  order: 1
---
## Architecture de production


<div class="architecture-frame">
  <img src="/diagrams/system-atlas.svg" alt="Position des providers cloud dans l’architecture complète." />
  <div class="architecture-caption">Position des providers cloud dans l’architecture complète.</div>
</div>


| Service | Responsabilité |
|---|---|
| Cloudflare | DNS/TLS du domaine public et distribution des assets du frontend via Workers Assets. |
| Render | Exécution du conteneur Spring Boot et déclenchement de déploiement backend. |
| PostgreSQL managé | Persistence relationnelle du contenu, analytics, traductions, jobs, outbox, audits et télémétrie. |
| Cloudinary | Stockage distant des médias administrés et génération d’URLs publiques. |
| LibreTranslate | Service privé appelé uniquement par le backend pour preview et traduction automatique. |
| GitHub Actions | Vérification, artifacts, diagnostics et déclenchement des déploiements. |

## Principe réseau

Le navigateur ne contacte jamais PostgreSQL, Cloudinary avec des credentials secrets, ni LibreTranslate directement. Tous les secrets restent côté backend ou CI. Le frontend ne reçoit que des URLs publiques et l’URL publique du backend.

## Domaine et TLS

La configuration backend accepte le domaine public et l’origine Workers configurée. Cloudflare termine TLS pour le frontend ; Render expose le backend en HTTPS. Les cookies de session sont configurés pour un contexte HTTPS cross-origin.
