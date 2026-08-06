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
```

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
