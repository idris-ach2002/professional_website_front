# Tests et CI du frontend

## Installation

```bash
npm install
npx playwright install chromium firefox
```

`npm install` régénère aussi `package-lock.json` après l'ajout de Vitest et Playwright.
Le lockfile régénéré doit être commité pour pouvoir remplacer ensuite `npm install` par `npm ci` dans la CI.

## Commandes

```bash
npm run lint
npm test
npm run test:coverage
npm run test:e2e
npm run ci:quality
npm run ci:verify
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
- accueil;
- changement de langue;
- fallback lorsque le backend est indisponible ;
- contrôle du débordement horizontal mobile ;
- exécution dans Chromium et Firefox.

## Secrets GitHub pour le déploiement

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Sans ces secrets, les jobs de contrôle restent utilisables et le déploiement est ignoré.

## budgets de performance

`npm run build` exécute désormais `npm run check:performance` après le build statique.

Budgets durs :
- JS initial Brotli <= 420 KiB, avec objectif visible à 350 KiB ;
- chunk 3D Brotli <= 700 KiB ;
- dossier `public/` <= 1 MiB ;
- chaque image publique <= 400 KiB ;
- aucun mock sous `public/assets/mock`.

Les images Cloudinary de type `image/upload` reçoivent automatiquement des variantes 320/640/960/1280 px avec `f_auto,q_auto,c_limit`. Les anciennes URLs `raw/upload` restent inchangées et continuent de fonctionner ; les nouveaux uploads backend utilisent `resource_type=auto` afin que les images futures soient transformables.
