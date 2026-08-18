---
title: Runbooks
description: Procédures de diagnostic et reprise par symptôme.
---
## Frontend public indisponible

1. Vérifier le statut du déploiement Cloudflare et la disponibilité des assets.
2. Vérifier que le domaine résout vers la cible attendue et que TLS est valide.
3. Charger directement la route racine et observer la console réseau.
4. Si l’UI démarre mais que les données manquent, basculer le diagnostic vers l’API backend.

## API backend indisponible

1. Appeler `/actuator/health`.
2. Vérifier les logs Render et le démarrage Flyway.
3. Vérifier l’accès à PostgreSQL et l’état du pool Hikari.
4. Contrôler les variables CORS uniquement si le backend répond mais que le navigateur bloque la requête.

## Administration impossible

1. Vérifier la session et le flux `/login`.
2. Charger `/csrf` après authentification.
3. Vérifier l’origine CORS autorisée et l’envoi de credentials.
4. En cas de conflit, lire ETag/révision et recharger l’état avant de rejouer la mutation.

## Publication bloquée

1. Consulter le health du snapshot et la validation de publication.
2. Vérifier les jobs du propriétaire.
3. Inspecter l’outbox et l’audit de publication.
4. Ne pas forcer la base manuellement : utiliser les actions de retry/cancel/rollback prévues par le domaine.

## Médias ou traductions

Un échec Cloudinary ou LibreTranslate doit être isolé de la persistence principale. Vérifier le provider concerné, conserver le contenu déjà publié et rejouer uniquement l’opération externe après rétablissement.
