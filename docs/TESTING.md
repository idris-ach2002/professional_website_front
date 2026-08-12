# Tests et CI du frontend

## Installation

```bash
nvm use 22.16.0
npm ci
npx playwright install chromium firefox
```

Le runtime Node/npm est vérifié par `check:runtime-env` et le lockfile commité est la source de vérité pour `npm ci`.

## Commandes

```bash
npm run lint
npm test
npm run test:coverage
npm run test:e2e
npm run ci:quality
npm run ci:verify
```

## Stabilité navigateur et concurrence

Les suites sont séparées par propriété afin qu’un test de performance ou
d’endurance ne soit pas confondu avec un test fonctionnel :

```txt
fonctionnel       → Chromium + Firefox, workers hardware-aware plafonnés à 2
responsive        → Chromium, 9 viewports
stability         → Chromium + Firefox, scénarios sans retry
concurrency local → Chromium, 4 workers, repeat-each=5
concurrency CI    → Chromium, 2 workers, repeat-each=5
vitals            → Chromium, 1 worker
soak manuel       → Chromium, 1 worker
```

`ci:freeze` constitue la gate courte de référence. Le soak reste un diagnostic
d’endurance volontaire : il ne bloque ni `ci:full` ni le déploiement GitHub.

```bash
npm run ci:freeze
npm run ci:concurrency
npm run ci:full
SOAK_DURATION_MS=60000 npm run ci:soak
```

Les E2E utilisent un build hermétique unique et estampillé. En mode
`PLAYWRIGHT_PREBUILT=1`, la signature SHA-256 du `dist` doit correspondre aux
sources courantes ; un artefact périmé est refusé avant le démarrage du
navigateur. Les accès réseau externes sont remplacés par des fixtures
déterministes afin que Google Fonts, Cloudinary ou un backend distant ne
puissent pas rendre un test aléatoire.

Le contrat runtime commun surveille les erreurs JavaScript, les crashs, les
requêtes réellement fatales et les accès réseau non autorisés. Les annulations
propres au moteur navigateur (`ERR_ABORTED`, `NS_BINDING_ABORTED`, etc.) restent
des diagnostics plutôt que des violations applicatives.

## Concurrence de l’administration

Les lectures admin susceptibles de se chevaucher suivent une politique
**latest-wins** : chaque lane possède un `AbortController` et une génération.
Une réponse ancienne ne peut modifier React qu’au travers d’un `commit()` qui
vérifie encore que sa génération est courante. Les mutations sont sérialisées
par un lane dédié afin d’éviter deux écritures simultanées depuis le même
client.

Le protocole HTTP complète cette protection :

```txt
GET owner/version
  ↓
rowVersion/contentRevision + ETag
  ↓
mutation admin avec If-Match
  ├── révision courante → succès + nouvelle révision
  └── révision périmée → ConcurrencyConflictError → rechargement requis
```

Le cache CSRF partage une seule requête réseau entre mutations concurrentes,
mais l’annulation d’un consommateur n’annule pas le chargement du token pour
les autres. Les panneaux analytics et traduction annulent également leurs
requêtes devenues obsolètes ou leur travail long lors du démontage.

Les contrats correspondants sont contrôlés par :

```bash
npm run check:admin-async
npm run test:coverage
```

## Validation SEO statique

Un build local peut être exécuté sans `VITE_PUBLIC_SITE_URL`. Dans ce cas, le
générateur produit les pages FR/EN mais ne peut pas finaliser les URL absolues
`canonical`, `hreflang` et le sitemap ; le contrôle SEO valide alors uniquement
les éléments indépendants du domaine public.

Dès que `PUBLIC_SITE_URL` ou `VITE_PUBLIC_SITE_URL` est défini — directement ou
dans un fichier `.env*` — `check:static-seo` exige les URL absolues `canonical`,
les variantes `fr`, `en`, `x-default` et les autres métadonnées de production.
Le workflow GitHub reste donc strict, tandis que `npm run ci:verify` reste
exécutable localement avant de connaître ou de configurer le domaine public.

## Périmètre initial

- API publique et cache local du portfolio ;
- choix FR/EN et persistance de la langue ;
- page 404 ;
- accueil E2E ;
- changement de langue E2E ;
- fallback lorsque le backend est indisponible ;
- contrôle du débordement horizontal mobile ;
- exécution dans Chromium et Firefox.

## Secrets GitHub pour le déploiement

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Sans ces secrets, les jobs de contrôle restent utilisables et le déploiement est ignoré.

## V16 — budgets de performance

`npm run build` exécute désormais `npm run check:performance` après le build statique.

Budgets durs :
- JS initial Brotli <= 420 KiB, avec objectif visible à 350 KiB ;
- chunk 3D Brotli <= 700 KiB ;
- dossier `public/` <= 1 MiB ;
- chaque image publique <= 400 KiB ;
- aucun mock sous `public/assets/mock`.

Les images Cloudinary de type `image/upload` reçoivent automatiquement des variantes 320/640/960/1280 px avec `f_auto,q_auto,c_limit`. Les anciennes URLs `raw/upload` restent inchangées et continuent de fonctionner ; les nouveaux uploads backend utilisent `resource_type=auto` afin que les images futures soient transformables.

## V18 — responsive industriel

```bash
npm run check:responsive
npm run test:e2e:responsive
```

`npm run ci:verify` exécute des phases E2E séparées : fonctionnel Chromium/Firefox, matrice responsive Chromium, stabilité Chromium/Firefox, puis Web Vitals Chromium isolés. La matrice V18 couvre 9 tailles de 360×800 à 1920×1080 et bloque tout débordement horizontal connu.
