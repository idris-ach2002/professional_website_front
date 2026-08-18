# Architecture et contrats des tests front

Cette suite applique une règle unique : **un test ne passe ou ne casse que sur une propriété définie du système**, jamais sur une temporisation arbitraire, une dépendance Internet ou l'ordre d'exécution d'un autre test.

## 1. Modèle formel

Chaque scénario est structuré en quatre niveaux :

1. **Préconditions** — environnement isolé, réseau hermétique, fixture API déterministe, document prêt, langue/profil attendus.
2. **Action** — interaction utilisateur ou transition explicitement exercée.
3. **Postconditions** — état observable directement causé par l'action.
4. **Invariants** — propriétés qui doivent rester vraies pendant toute l'exécution : absence de crash/pageerror, IDs uniques, géométrie saine, World Director cohérent, ressources runtime montées une seule fois.

La **liveness** est traitée séparément de la sûreté : une sonde lente sur une VM chargée n'est pas automatiquement une violation fonctionnelle, mais un renderer qui ne répond plus avant la deadline de liveness fait échouer le test.

## 2. Isolation et herméticité

Tous les fichiers E2E importent `e2e/support/test-fixtures.js`. La fixture automatique installe avant chaque test :

- un `BrowserContext` isolé fourni par Playwright ;
- une classe matérielle runtime normalisée au plancher de 2 CPU logiques ;
- le mock de l'API publique et des analytics ;
- un contrat réseau qui interdit tout HTTP externe non déclaré ;
- le collecteur centralisé des erreurs navigateur.

Google Fonts n'est jamais téléchargé pendant les E2E : sa feuille CSS est remplacée par une réponse déterministe vide. Les médias Cloudinary utilisés par le fallback local sont eux aussi remplacés par une fixture d'image déterministe au ratio représentatif. Cela supprime les variations DNS/CDN et les annulations Firefox `NS_BINDING_ABORTED` sans créer de liste blanche silencieuse pour le reste d'Internet.

Une route particulière peut surcharger le mock API au niveau `page` pour tester un cas d'erreur, sans supprimer les routes communes du `BrowserContext`.

## 3. Classification des fautes runtime

Les événements ne sont pas tous équivalents :

- **fatals** : `pageerror`, crash renderer, fermeture prématurée, réponse HTTP `>= 400` non déclarée, échec réseau non classé comme annulation moteur, accès réseau externe inattendu ;
- **diagnostics** : annulations moteur telles que `NS_BINDING_ABORTED`, `NS_ERROR_ABORT` et `ERR_ABORTED`, ainsi que les réponses HTTP d'erreur explicitement attendues par un scénario de fault injection.

Une annulation moteur n'est pas utilisée comme preuve de succès. Toute ressource fonctionnellement obligatoire possède sa propre pré/postcondition observable — par exemple la réponse API `200`, le `main` prêt ou le canvas attendu.

## 4. Synchronisation

Interdits dans les specs :

- `page.waitForTimeout()` ;
- `networkidle` comme signal de disponibilité applicative ;
- `unrouteAll()` ;
- écouteurs `page.on(...)` locaux ;
- dépendance à l'ordre des tests.

On attend uniquement un état observable : attribut DOM, réponse ciblée, géométrie, nombre d'instances, métrique ou événement runtime.

Pour les gates bloquantes, la géométrie est synchronisée par une lecture de layout (`getBoundingClientRect`) suivie d'une réconciliation explicite du runtime ; aucun nombre de frames peintes n'est utilisé comme prédiction de readiness. Le `setTimeout` du soak est différent : il représente la **durée expérimentale** de l'endurance, pas une attente de readiness.

## 5. Navigation du Living Ocean World

`world-contract.js` est l'unique primitive de navigation déterministe pour les gates persistantes :

- vérifie que l'ancre est montée et unique ;
- neutralise temporairement le smooth-scroll ;
- positionne `document.scrollingElement` ;
- force une lecture de géométrie après le positionnement ;
- demande ensuite une réconciliation explicite au World Director ;
- vérifie la position, le biome et les métadonnées runtime après action.

La stabilité ne doit donc pas dépendre d'une durée supposée d'animation ou de la vitesse du runner.

## 6. Couches de tests

### Vitest

Tests unitaires/engines rapides. Le pool `forks` garde l'isolation processus, les fichiers restent parallèles avec **2 workers explicites** dans la gate de référence, et les tests d'un même fichier restent séquentiels. `isolate`, `restoreMocks`, `clearMocks` et `mockReset` sont explicites. Le setup recrée storage, media queries et observers, puis nettoie DOM, historique, timers et globals après chaque test. `npm run test:leaks` active séparément le détecteur de ressources asynchrones pour le diagnostic, car cette instrumentation est volontairement plus coûteuse.

### Functional browser contracts

Comportements utilisateur, navigation, accessibilité de base, fallback API et préférences. Exécutés sur Chromium et Firefox en CI.

### Responsive matrix

Neuf viewports sur Chromium. Contrats de débordement, navigation compacte/desktop, modales et contrôles tactiles.

### Stability

Scénarios indépendants explicitement parallèles. Ils stressent routes, changements rapides d'état, Timeline, sauts de scroll et biomes.

### Parallel isolation contract

GitHub exécute les scénarios Stability **une seule fois** avec 2 workers réels ; le profil développeur peut utiliser 4 workers. Le but n'est plus de provoquer une race par répétition, mais de prouver que des scénarios déterministes restent isolés lorsqu'ils s'exécutent simultanément. `--repeat-each` est interdit comme mécanisme de preuve.

### Web Vitals diagnostic

Chromium, 1 worker. LCP/CLS/INP sont collectés et attachés au rapport, mais leurs budgets absolus ne sont pas des postconditions fonctionnelles sur une VM headless partagée. Les hard assertions portent uniquement sur la disponibilité/cohérence de la collecte. Les dépassements de cibles sont des diagnostics.

### Soak

Chromium, 1 worker, 1 scénario long. Le soak place directement la page dans un **état stable Projects** déjà couvert fonctionnellement par les tests de navigation, puis mesure uniquement la tenue de cette session. Il ne dépend d’aucun état interne de volcan, mine ou cinématique lazy-mounted.

Le heartbeat est à deux niveaux :

- une sonde de liveness légère et **single-flight** à chaque échantillon, sans scan global du DOM ni lecture de géométrie ;
- un audit structurel plus coûteux seulement tous les `SOAK_STRUCTURE_EVERY` heartbeats.

Une sonde qui dépasse son budget n'est jamais relancée en boucle : empiler plusieurs `evaluate()` derrière un renderer saturé ferait du test une source de contention. Un watchdog installé avant le chargement enregistre aussi les retards de l'event loop et, lorsque le navigateur le permet, les Long Tasks. Ces données sont diagnostiques ; la gate échoue sur les invariants fonctionnels ou sur une sonde renderer qui ne répond plus.

La vidéo et la trace continue sont coupées ; `soak-samples.json`, `soak-failure.json`, les événements runtime et le screenshot d'échec fournissent les diagnostics sans imposer un encodeur vidéo pendant l'endurance.

## 7. Politique workers

Le mode normal calcule un budget CPU **et** mémoire sous un **cap de 2 workers**. Sur une VM Linux standard privée à 2 CPU, la politique retient 1 worker ; sur une machine à 4 CPU ou plus avec assez de RAM, elle peut en retenir 2. Les tests fonctionnels ne fabriquent donc jamais de contention par oversubscription.

Le mode `PLAYWRIGHT_STRESS=1` exige désormais une valeur `PLAYWRIGHT_WORKERS` explicite, au moins 2 workers, interdit de dépasser le nombre de CPU logiques disponibles et vérifie un budget mémoire proportionnel au nombre de renderers. Il n'y a donc plus d'hypothèse codée en dur « stress = 4 CPU ».

`ci:freeze` utilise une passe d'isolation à 2 workers. `ci:concurrency` exécute une seule passe parallèle à 4 workers. GitHub utilise `ci:concurrency:hosted` à 2 workers. Vitals, Main Thread et soak restent à 1 worker par définition expérimentale.

`PLAYWRIGHT_WORKER_CAP` borne le mode automatique. `PLAYWRIGHT_WORKERS` représente au contraire une surcharge explicite pour une gate contrôlée.

## 8. Artefact et serveur

`ci:quality` produit un seul `dist` avec `VITE_E2E_RUNTIME_QUALITY=constrained`. Le build est estampillé avec un SHA-256 calculé sur les entrées de build. Toutes les gates Playwright CI téléchargent et exécutent exactement cet artefact avec `PLAYWRIGHT_PREBUILT=1`.

Avant de démarrer `vite preview`, Playwright vérifie que l'empreinte du `dist` correspond encore aux sources du checkout et que le profil E2E estampillé est correct. Un `dist` local ancien est donc refusé au lieu d'être testé silencieusement.

En mode prebuilt :

- aucun rebuild implicite ;
- `vite preview` utilise `--strictPort` ;
- Playwright refuse de réutiliser un serveur local déjà présent.

Cela évite qu'un `ci:freeze` local teste accidentellement un ancien serveur ou qu'une suite GitHub reconstruise un artefact différent.

## 9. GitHub Actions

Il existe un seul workflow frontend autoritatif :

1. `quality` — lint, politique workers, Vitest/coverage, contrats statiques, build hermétique ;
2. gates bloquantes en parallèle : `browser-contracts`, `responsive`, `concurrency-contract` (isolation 2 workers, une passe) et `transparent-performance` déterministe ;
3. diagnostics non bloquants : `vitals` et `main-thread`, avec artifacts ;
4. `verify` dépend uniquement des gates déterministes ;
5. `soak` reste manuel (`workflow_dispatch`) ;
6. le déploiement production dépend uniquement de `verify`.

La règle est explicite : aucune release ne dépend d'un `repeat-each`, d'un délai de Worker/IntersectionObserver, d'un paint headless ou d'un percentile matériel aléatoire.

## 10. Commandes locales

Gate quotidienne complète, sans soak long :

```bash
npm run ci:freeze
```

Concurrence intensive :

```bash
npm run ci:concurrency
```

Endurance :

```bash
SOAK_DURATION_MS=60000 npm run ci:soak
```

Ensemble des gates bloquantes fiables :

```bash
npm run ci:full
```

## 11. Règles pour ajouter un test

Avant d'ajouter un délai ou un retry, définir l'invariant manquant. Un nouveau test doit répondre à ces questions :

- Quelle est la précondition contrôlée ?
- Quelle action unique exerce-t-il ?
- Quelle postcondition observable prouve cette action ?
- Quels invariants doivent rester vrais ?
- La propriété est-elle fonctionnelle, de compatibilité, de concurrence, de performance ou d'endurance ?
- Peut-il tourner simultanément avec tous les autres tests sans état partagé ?
- Dépend-il d'un service externe ? Si oui, il doit être mocké ou déplacé dans une suite d'intégration distincte.

`scripts/check-test-architecture.mjs` protège ces règles structurelles sans imposer que les implémentations restent écrites dans un fichier précis. Un refactor vers une fixture partagée ne doit donc plus faire casser le freeze parce qu'une chaîne `page.on(...)` a changé de fichier.

## 12. Contrat d'environnement et reproductibilité

La gate CI commence par valider le runtime avant d'exécuter les tests. Le dépôt fixe Node `22.16.x` et npm `10.9.x`; une version majeure différente est une **précondition invalide**, même si certains tests semblent fonctionner. `.npmrc` active `engine-strict=true` afin de transformer une simple alerte `EBADENGINE` en échec immédiat et explicite.

Le mode de reproductibilité (`ci:verify`) applique `PLAYWRIGHT_WORKER_CAP=2` et laisse la politique CPU/RAM sélectionner le nombre sûr de workers. La couverture Vitest utilise de son côté **2 processus isolés explicites** sur local et CI (`VITEST_WORKERS=2`), au lieu d'un pourcentage dépendant du nombre de CPU de l'hôte.

La gate hosted de contention reste à **2 workers** afin d'être portable sur les runners Linux GitHub standard de dépôts privés comme publics. La commande locale intensive force séparément 4 workers et la précondition de stress refuse désormais toute surallocation CPU ou mémoire au lieu de fabriquer artificiellement de la contention par oversubscription.

## 13. Build E2E hermétique et build production

Le build utilisé par Playwright est un artefact de test distinct du build de déploiement. `npm run e2e:artifact:build` fixe explicitement les variables de compilation E2E, désactive les analytics et impose un profil runtime déterministe. La génération du snapshot public ne contacte jamais le backend dans ce mode : elle utilise un jeu de données local et un timestamp fixe.

Le stamp `dist/.e2e-build-fingerprint.json` contient :

- un schéma/version de profil ;
- le profil de compilation E2E attendu ;
- un SHA-256 des entrées de build.

En CI, `PLAYWRIGHT_PREBUILT=1` et `E2E_ARTIFACT_REQUIRE_PREBUILT=1` rendent ce contrat strict : aucun job Playwright n'a le droit de reconstruire silencieusement `dist`. En local, une commande Playwright directe peut reconstruire l'artefact si celui-ci manque ou est périmé. Ainsi `ci:concurrency` et `ci:soak` restent exécutables depuis un clone propre, alors que GitHub vérifie toujours l'artefact unique produit par `quality`.

Le déploiement possède un contrat inverse : `npm run check:production-env` refuse toute variable réservée au profil E2E. Cela empêche qu'un build de production hérite accidentellement de `VITE_E2E_RUNTIME_QUALITY=constrained` ou `VITE_ANALYTICS_DISABLED=true`.

## 14. Migration du workflow historique

`frontend-ci.yml` est le workflow frontend autoritatif. `ci:migrate` retire automatiquement l'ancien `ci-cd.yml` uniquement s'il correspond à une version historique connue ou au tombstone de migration fourni avec l'archive. Un fichier `ci-cd.yml` modifié et inconnu n'est jamais supprimé silencieusement : la migration échoue et demande une décision humaine.

Cette règle rend l'archive sûre lorsqu'elle est extraite **par-dessus** un dépôt existant : le tombstone neutralise immédiatement l'ancien workflow, puis la première commande `ci:*` le supprime. Le checker YAML valide ensuite qu'il ne reste qu'un workflow frontend actif et que les jobs E2E/production n'héritent pas des mauvais profils.

## 15. Sémantique exacte du soak

`SOAK_DURATION_MS` désigne uniquement la fenêtre d’endurance. La préparation charge le portfolio puis place directement le World Director sur l’ancre persistante Projects. Le chronomètre démarre après validation des préconditions publiques et structurelles ; aucune hypothèse sur un état interne de volcan, mine ou cinématique n’est utilisée.

`SOAK_HEARTBEAT_MS` fixe uniquement la cadence d'échantillonnage. `SOAK_STRUCTURE_EVERY` fixe la fréquence de l'audit DOM/géométrique complet. Ces paramètres ne sont jamais des délais de readiness applicative. GitHub fixe actuellement 60 000 ms / 5 000 ms / 3 afin que l'expérience soit reproductible.

Un soak de 60 000 ms signifie donc réellement au moins 60 secondes d’observation stable. Le test échoue si le setup dépasse son budget, si un invariant public/structurel dérive, si une faute runtime inattendue apparaît ou si une sonde single-flight ne reçoit plus de réponse du renderer.
