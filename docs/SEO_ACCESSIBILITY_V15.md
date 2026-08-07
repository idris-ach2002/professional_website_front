# V15 — SEO et accessibilité

## Snapshot public backend

Le build de production récupère un snapshot atomique depuis :

```text
GET /website/default/seo-snapshot
```

La réponse contient les données publiques françaises et anglaises issues du même owner et du même état de base. Le script `scripts/public-snapshot.mjs` conserve un cache local uniquement pour les builds hors production et peut revenir aux deux endpoints localisés pour rester compatible avec un backend plus ancien.

Dans GitHub, créer la variable de dépôt ou d’environnement suivante :

```text
PUBLIC_API_BASE_URL=https://URL-PUBLIQUE-DU-BACKEND
```

Le job de déploiement utilise aussi cette valeur comme `VITE_API_BASE_URL` et impose `STATIC_SNAPSHOT_REQUIRED=true`. Un déploiement ne peut donc plus publier silencieusement les données de démonstration.

## Pages statiques générées

Le build produit pour chaque contenu :

- `/` et `/en` ;
- `/recruiter` et `/en/recruiter` ;
- `/cv` et `/en/cv` ;
- `/projects/<slug>` et `/en/projects/<slug>`.

Chaque page contient :

- une langue HTML correcte ;
- un titre et une description localisés ;
- canonical ;
- hreflang `fr`, `en` et `x-default` ;
- Open Graph et Twitter Cards ;
- JSON-LD lorsqu’il est pertinent ;
- un contenu textuel statique provenant du snapshot backend avant le chargement de React.

Le script `npm run check:static-seo` bloque le build si les principales pages FR/EN ne respectent pas ce contrat.

## Accessibilité

V15 ajoute ou complète :

- le lien d’évitement vers `#main-content` ;
- le déplacement du focus après navigation ;
- la page 404 `noindex` ;
- le focus initial dans la modale projet ;
- le focus trap avec Tab et Maj+Tab ;
- la fermeture par Échap ;
- la restauration du focus sur le bouton déclencheur ;
- l’inertage du contenu arrière pendant l’ouverture ;
- des régions `status` et `alert` pour les états cache et fallback.

## Commandes

```bash
npm run ci:verify
```

Pour vérifier strictement un build local contre le backend réel :

```bash
PUBLIC_API_BASE_URL=https://URL-PUBLIQUE-DU-BACKEND \
VITE_PUBLIC_SITE_URL=https://URL-PUBLIQUE-DU-FRONT \
STATIC_SNAPSHOT_REQUIRED=true \
npm run build
```
