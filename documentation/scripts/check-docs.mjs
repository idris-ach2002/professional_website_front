import fs from 'node:fs';
import path from 'node:path';

const docsRoot = path.resolve('src/content/docs');
const repoRoot = path.resolve('..');
const errors = [];
const skippedDirectories = new Set([
  '.git', 'node_modules', 'target', 'dist', 'coverage', '.astro',
  'playwright-report', 'test-results', '.idea', '.vscode',
]);

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
};

const contentFiles = walk(docsRoot).filter((file) => /\.(?:md|mdx)$/.test(file));
const rootReadme = path.join(repoRoot, 'README.md');
const filesToScan = [...contentFiles, rootReadme].filter(fs.existsSync);

// The route /v3/api-docs is a real current endpoint and is therefore excluded
// from the project-generation marker rule by the slash look-behind.
const forbidden = [
  { pattern: /(?<!\/)\b[Vv]\d+(?:\.\d+)*\b/g, reason: 'project-generation marker' },
  { pattern: /\b(?:ancienne|ancien|précédente|précédent)\s+version\b/gi, reason: 'project-history comparison' },
  { pattern: /\b(?:legacy|previous)\s+version\b/gi, reason: 'project-history comparison' },
];

for (const file of filesToScan) {
  const source = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    const match = source.match(rule.pattern);
    if (match) errors.push(`${path.relative(repoRoot, file)}: ${rule.reason}: ${match[0]}`);
  }
}

for (const file of contentFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.startsWith('---')) {
    errors.push(`${path.relative(repoRoot, file)}: frontmatter absent`);
  }
}

const allMarkdown = walk(repoRoot)
  .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
  .filter((file) => !file.includes(`${path.sep}documentation${path.sep}`));

for (const file of allMarkdown) {
  if (path.resolve(file) !== rootReadme) {
    errors.push(`documentation dispersée hors documentation/: ${path.relative(repoRoot, file)}`);
  }
}

const diagramDir = path.resolve('public/diagrams');
const requiredDiagrams = [
  'system-atlas.svg',
  'frontend-runtime.svg',
  'backend-modules.svg',
  'request-lifecycle.svg',
  'publication-pipeline.svg',
  'data-model.svg',
  'ci-cd.svg',
  'deployment-topology.svg',
  'security-boundaries.svg',
  'worker-rendering.svg',
  'fallback-cache.svg',
  'admin-concurrency.svg',
  'observability-path.svg',
  'frontend-route-map.svg',
  'backend-route-map.svg',
];
for (const name of requiredDiagrams) {
  if (!fs.existsSync(path.join(diagramDir, name))) errors.push(`diagramme manquant: ${name}`);
}

if (contentFiles.length < 40) {
  errors.push(`corpus documentaire incomplet: ${contentFiles.length} pages`);
}

if (errors.length) {
  console.error(`Documentation contract failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `Documentation contract OK: ${contentFiles.length} pages, `
  + 'source de vérité main, arborescence propre et atlas de diagrammes présent.',
);
