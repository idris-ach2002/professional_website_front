import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const projectRoot = resolve(new URL("..", import.meta.url).pathname);

const forbiddenFiles = [
  "src/components/admin/AdminApplicationsPanel.jsx",
  "src/components/admin/AdminCvBuilderPanel.jsx",
  "src/components/admin/AdminCommandTraceModal.jsx",
  "src/components/admin/useAdminApplications.jsx",
  "src/components/admin/useAdminCvStudio.jsx",
  "src/styles/pages/02-admin-cv-base.css",
  "src/styles/pages/06-admin-cv-tools.css",
];

const forbiddenTokens = [
  "AdminApplicationsPanel",
  "AdminCvBuilderPanel",
  "AdminCommandTraceModal",
  "useAdminApplications",
  "useAdminCvStudio",
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

console.log("Retired admin modules OK: no candidature/CV Builder files or imports remain.");
