# Front release guardrails

This document describes the post-cleanup release contract for the public frontend.

## Cascade

- Application styles use the ordered layers `base`, `priority`, `critical`.
- `critical` is reserved for static visual constraints that previously required `!important`.
- Dynamic/animated properties such as transforms, opacity, dimensions, positioning, filters and animation state keep explicit priority when required by runtime behavior.
- Total `!important` budget: **1,500** maximum.
- Total source CSS budget: **765,000 bytes** maximum.

## Initial loading

- Heavy secondary modules remain outside the static import closure of `src/main.jsx`.
- Static initial source closure budget: **427,000 bytes / 62 files** maximum.
- The profile portrait is an eager, high-priority candidate because it appears in the first viewport.
- Google Fonts are discovered from HTML with preconnects rather than through a chained CSS import.

## Runtime

- Global interaction and memory sampling use one-shot scheduling rather than permanent polling loops.
- Frame and memory monitoring suspend while the document is hidden.
- Mission Control periodic work short-circuits while hidden.
- High-cost speculative prefetch is reserved for aggressive runtime profiles.

## Production contract

The blocking GitHub pipeline and the local `npm run ci:full` command share the same gate chain: static/runtime preflight, lint, asynchronous-leak detection, full unit coverage, hermetic E2E build, Chromium + Firefox browser contracts, responsive matrix, hosted concurrency contract, isolated Web Vitals, Main Thread Laboratory and transparent-performance contract. The soak remains a manual diagnostic. `npm run ci:release` runs exactly one `ci:full`, followed by one `ci:soak`.

## Main Thread Laboratory

La release exécute un laboratoire Chromium isolé sur un seul worker afin de repérer les goulets d'étranglement du thread principal sans transformer les métriques en benchmark matériel fragile.

Le scénario mesure `#profile`, `#timeline`, les transitions océaniques, `#abyss-volcano-field` et `#projects`. Pour chaque zone il enregistre :

- cadence RAF (`p50`, `p95`, `p99`) et ratio de frames > 34 ms ;
- Long Tasks via `PerformanceObserver` lorsque Chromium les expose ;
- Long Animation Frames (LoAF), `blockingDuration` et scripts contributeurs lorsque disponibles ;
- retard de l'event loop via une sonde 50 ms ;
- classement des hotspots et recommandation Worker/OffscreenCanvas uniquement pour les surfaces qui peuvent réellement être déportées.

Budgets de sécurité par défaut :

- Long Task maximale : **250 ms** ;
- Long Animation Frame maximale : **320 ms** ;
- retard event loop maximal : **220 ms** ;
- `blockingDuration` LoAF maximale : **180 ms**.

Les métriques RAF (`p50`, `p95`, `p99`, ratio > 34 ms) restent enregistrées et classées, mais ne sont pas des gates absolues : Chromium headless peut réduire la cadence de paint sans bloquer le thread JavaScript. Les gates de release reposent sur Long Task, LoAF/`blockingDuration` et retard event-loop. Un warm-up initial isole également le bootstrap, les fonts et l'intro de signature avant la mesure du profil.

Ces seuils bloquent les régressions sévères sur runner CI, tandis que le rapport JSON `main-thread-laboratory.json` sert à comparer les sections et décider si un OffscreenCanvas Worker apporte réellement un gain. La CI ne doit pas workeriser un composant uniquement pour faire baisser un compteur.

## Transparent performance pass

The transparent performance contract may change execution placement, scheduling and allocation strategy, but it must not change the public visual contract:

- no stylesheet, class name, visual value, animation duration, easing, particle count or responsive geometry is changed by this pass;
- ocean cinematics keep the synchronous listener/component and the exact deterministic drawing formulas; only the compatible Canvas2D raster path may move to `OffscreenCanvas`;
- volcano simulation, particle stepping and rockfall stepping remain on the main thread with the original delta/elapsed sequence; only Canvas2D rasterization is moved to a Worker;
- volcano Worker frames use reusable transferable `Float64Array` buffers so draw state keeps JavaScript-number precision;
- navigation and Timeline geometry are read in batches and cached, while the original Timeline ranking comparator is preserved;
- Worker controllers are feature-split outside the static startup graph and initialized through background scheduling;
- Worker code has no autonomous RAF/interval loop: hidden/off-viewport suspension remains controlled by the existing component lifecycle;
- hot volcano pulse/reaction updates do not trigger React renders; DOM markers/events are updated directly.

`npm run check:transparent-performance` locks these constraints, and `test:e2e:transparent-performance` verifies that supported Chromium sessions actually transfer the eligible Canvas surfaces while the public DOM contract remains intact.


Web Vitals INP is repeated five times in the blocking chain; every isolated mobile run must stay at or below 200 ms.
