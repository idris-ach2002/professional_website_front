import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const forbiddenFiles = [
  "src/components/admin/AdminApplicationsPanel.jsx",
  "src/components/admin/AdminCvBuilderPanel.jsx",
  "src/components/admin/AdminCommandTraceModal.jsx",
  "src/components/admin/useAdminApplications.jsx",
  "src/components/admin/useAdminCvStudio.jsx",
  "src/styles/pages/02-admin-cv-base.css",
  "src/styles/pages/06-admin-cv-tools.css",
  "src/animations/autonomousNavigationEngine.js",
  "src/animations/autonomousNavigationEngine.test.js",
  "src/animations/orientationEngine.js",
  "src/animations/orientationEngine.test.js",
  "src/components/ScrollPerformanceGuard.jsx",
  "src/components/ExpertisePanel.jsx",
  "src/components/navigation/useReducedMotion.js",
  "src/components/three/OceanBubbleField.jsx",
  "src/styles/overrides/v19-cinematic-fixes.css",
  "src/assets/identity/code-map.svg",
  "src/assets/identity/orbit-grid.svg",
  "src/assets/identity/signal-card.svg",
  "public/icons.svg",
  "public/textures/beach-ball-panel-texture.svg",
  "src/styles/effects/05-ocean-drops.css",
];

const forbiddenTokens = [
  "AdminApplicationsPanel",
  "AdminCvBuilderPanel",
  "AdminCommandTraceModal",
  "useAdminApplications",
  "useAdminCvStudio",
  "autonomousNavigationEngine",
  "orientationEngine",
];

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".css"]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath);
    return sourceExtensions.has(extname(entry.name)) ? [absolutePath] : [];
  });
}

const failures = [];

for (const file of forbiddenFiles) {
  if (existsSync(join(projectRoot, file))) {
    failures.push(`Fichier obsolète encore présent: ${file}`);
  }
}

for (const file of walk(join(projectRoot, "src"))) {
  if (!statSync(file).isFile()) continue;
  const content = readFileSync(file, "utf8");
  for (const token of forbiddenTokens) {
    if (content.includes(token)) {
      failures.push(`${relative(projectRoot, file)} référence encore ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Retired admin module check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Retired modules OK: legacy admin, scroll, bubble, expertise and identity artifacts are absent.");
