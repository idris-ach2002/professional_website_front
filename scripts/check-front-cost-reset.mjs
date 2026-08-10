import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const packageJson = JSON.parse(read("package.json"));
const vite = read("vite.config.js");
const app = read("src/App.jsx");
const volcano = read("src/components/UnderwaterVolcanoField.jsx");
const ocean = read("src/components/OceanMorphBackground.jsx");
const css = read("src/styles/effects/04-volcano-and-responsive.css");
const simulation = read("src/animations/volcanoSimulationEngine.js");
const renderer = read("src/rendering/volcanoWebGLRenderer.js");
const textureWorker = read("src/workers/volcanoTexture.worker.js");
const errors = [];

for (const dependency of ["three", "@react-three/fiber", "@react-three/drei", "@react-three/rapier"]) {
  if (packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency]) {
    errors.push(`${dependency} must remain removed from package.json.`);
  }
}
for (const dependency of ["@tailwindcss/vite", "tailwindcss", "autoprefixer", "postcss"]) {
  if (packageJson.devDependencies?.[dependency]) errors.push(`${dependency} is an obsolete direct build dependency.`);
}
if (/react-three|rapier|vendor-three|tailwindcss/.test(vite)) errors.push("Vite must not retain Three/Rapier/Tailwind chunk or plugin configuration.");
if (!app.includes("UnderwaterVolcanoField") || app.includes("KineticSpriteField") || app.includes("BeachBallField")) errors.push("App must use the lightweight underwater volcano scene.");
if (!volcano.includes("createVolcanoWebGLRenderer") || !volcano.includes('getContext("2d")')) errors.push("Volcano scene must use custom WebGL2 rendering plus a Canvas 2D particle layer.");
if (!renderer.includes('getContext("webgl2"') || !renderer.includes("FRAGMENT_SHADER") || !renderer.includes("u_lava")) errors.push("Volcano must use the dependency-free WebGL2 lava/rock renderer.");
if (!simulation.includes('VOLCANO_STAGES = Object.freeze(["eruption"])') || !simulation.includes("VOLCANO_PULSE_TYPES") || !simulation.includes("resolveGeneratedPulse")) errors.push("Volcano must retain the perpetual-eruption pulse engine.");
if (!textureWorker.includes("OffscreenCanvas") || !textureWorker.includes("transferToImageBitmap")) errors.push("Volcano particle textures must be pre-renderable off the main thread.");
if (!volcano.includes("requestAnimationFrame") || !volcano.includes("stepVolcanoParticles") || !volcano.includes("stepVolcanoSimulation")) errors.push("Volcano simulation must remain visibility-gated and native-RAF driven.");
if (ocean.includes("setAttribute(\"d\"") || ocean.includes("getWavePoint") || ocean.includes("renderPath")) errors.push("Ocean must not rebuild SVG path geometry at runtime.");
if (!ocean.includes("STATIC_OCEAN_PATHS") || !css.includes("ocean-static-layer-drift-a")) errors.push("Ocean must use fixed SVG geometry with compositor transforms.");
for (const retired of ["public/models/ABSTRACT_SHAPES.glb", "src/components/three/BeachBallField.jsx", "src/components/KineticSpriteField.jsx", "src/animations/kineticSpriteEngine.js", "src/animations/underwaterVolcanoEngine.js", "public/sprites/kinetic-shapes.webp"]) {
  if (fs.existsSync(path.join(root, retired))) errors.push(`Heavy retired asset still exists: ${retired}`);
}
const scene = path.join(root, "public/scenes/abyss-volcano.svg");
const environment = path.join(root, "public/scenes/abyss-volcano-environment.svg");
if (!fs.existsSync(scene)) errors.push("Missing public/scenes/abyss-volcano.svg fallback.");
else if (fs.statSync(scene).size > 32 * 1024) errors.push("Fallback abyss volcano SVG must remain below 32 KiB.");
if (!fs.existsSync(environment)) errors.push("Missing public/scenes/abyss-volcano-environment.svg.");
else if (fs.statSync(environment).size > 16 * 1024) errors.push("Abyss environment SVG must remain below 16 KiB.");
if (fs.existsSync(path.join(root, "public/scenes/underwater-volcano.webp"))) errors.push("Legacy rectangular volcano WebP must stay removed.");
if (!packageJson.dependencies?.gsap || !packageJson.dependencies?.["@mantine/core"]) errors.push("GSAP and Mantine are approved dependencies and must remain available.");

if (errors.length) {
  console.error(`Front cost reset contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Front cost reset OK: dependency-free WebGL2 perpetual volcano + adaptive Canvas particles replace Three/Rapier, with SVG caldera layers, static/composited ocean geometry and Mantine+GSAP retained.");
