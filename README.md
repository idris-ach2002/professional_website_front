# Portfolio professionnel — React / Mantine / GSAP

Refonte front complète du portfolio professionnel générique. Cette version abandonne temporairement les shaders et le rendu PixiJS pour privilégier une identité visuelle animée avec **GSAP** : thème bleu océan, mer, îles volcaniques, récif du recrutement et tortues représentant les développeurs seniors.

Le backend Spring reste inchangé : le front consomme toujours `GET /manager` et bascule automatiquement sur `src/data/demoPortfolio.js` si l’API n’est pas disponible.

---

## Direction artistique

Le site n’est plus organisé comme une grille de cards classique. Il fonctionne comme un **archipel professionnel** :

- le profil est l’île d’entrée ;
- la timeline est une route maritime qui se dessine progressivement au scroll ;
- chaque projet est une île technique ;
- les compétences forment des coraux ;
- le recrutement est représenté par un récif et des tortues seniors ;
- le contact devient un port d’arrivée.

La palette est claire, élégante et non agressive : bleu océan, cyan lagon, teal récif, sable chaud, touches volcaniques orange/corail.

---

## Animations

Toutes les animations visibles de cette version sont pilotées par GSAP :

- navbar animée à l’entrée ;
- progression de scroll dans la navbar ;
- hover des liens avec GSAP ;
- apparition séquencée du hero ;
- titre et mots-clés animés ;
- orbites SVG autour de la photo de profil ;
- fond SVG océanique animé ;
- timeline révélée progressivement avec `ScrollTrigger` ;
- îles projets qui apparaissent avec un stagger organique ;
- récif animé avec flux, packets et tortue senior ;
- sections expertise/contact animées au scroll.

GSAP est chargé via CDN dans `index.html` pour éviter d’ajouter une nouvelle dépendance npm pendant que l’installation npm est instable. Le helper `src/animations/useGsap.js` attend `window.gsap`, enregistre `ScrollTrigger`, scope les animations au composant et nettoie les timelines au démontage.

```txt
src/animations/useGsap.js
src/components/VisualIdentityBackground.jsx
src/components/TopNavigation.jsx
src/components/ProfileHero.jsx
src/components/PortfolioTimeline.jsx
src/components/ProjectsShowcase.jsx
src/components/OceanRecruitmentReef.jsx
src/components/ExpertisePanel.jsx
src/components/ContactSection.jsx
src/index.css
```

---

## Architecture

```txt
React
 ├─ SEO / pages / données / composants
 ├─ Mantine pour les composants d’interface
 └─ GSAP pour les animations DOM + SVG + scroll
```

Aucun `setState` n’est déclenché dans une boucle d’animation. React rend la structure, puis GSAP manipule les éléments DOM/SVG dans un scope local.

---

## Installation

```bash
npm ci --no-audit --no-fund --prefer-online --cache ./.npm-cache
```

Si `npm ci` échoue à cause du lockfile ou du cache local :

```bash
rm -rf node_modules
npm cache clean --force
npm install --no-audit --no-fund --prefer-online --cache ./.npm-cache
```

Lancer le front :

```bash
npm run dev
```

Build :

```bash
npm run build
```

---

## Connexion au backend Spring

Par défaut, le front appelle :

```txt
GET /manager
```

En développement, Vite proxifie `/api` et `/manager` vers :

```txt
http://localhost:8080
```

Tu peux changer la cible avec :

```bash
VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev
```

---

## Fichiers principaux

- `src/App.jsx` : orchestration globale des sections.
- `src/components/VisualIdentityBackground.jsx` : fond SVG océanique animé avec GSAP.
- `src/components/TopNavigation.jsx` : navbar animée + progression de scroll.
- `src/components/ProfileHero.jsx` : hero, mots-clés, photo, orbites SVG.
- `src/components/PortfolioTimeline.jsx` : route maritime progressive au scroll.
- `src/components/ProjectsShowcase.jsx` : archipel de projets filtrable.
- `src/components/OceanRecruitmentReef.jsx` : section récif/recrutement/tortues seniors.
- `src/components/ExpertisePanel.jsx` : coraux techniques et architecture métier.
- `src/components/ContactSection.jsx` : port de contact + vCard.
- `src/animations/useGsap.js` : helper GSAP propre pour React.

---

## Notes performance

- Les animations lourdes PixiJS/WebGPU ont été retirées pour cette version.
- Les animations GSAP utilisent `transform`, `opacity` et SVG stroke-dash pour limiter les coûts.
- Le rendu reste compatible Firefox/Chrome puisque l’on évite les gros canvas, les shaders et les filtres GPU coûteux.
- `prefers-reduced-motion` est respecté côté CSS : les animations peuvent être neutralisées par l’OS.

---

## CDN GSAP

GSAP et ScrollTrigger sont chargés dans `index.html` :

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
```

Si tu préfères une dépendance locale plus tard, installe GSAP :

```bash
npm i gsap
```

Puis remplace le chargement global par des imports ESM dans les composants.
