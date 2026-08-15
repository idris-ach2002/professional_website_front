import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "src", "main.jsx");
const extensions = [".js", ".jsx", ".mjs"];
const MAX_INITIAL_SOURCE_BYTES = 420_000;
const MAX_INITIAL_SOURCE_FILES = 62;

const mustStayDeferred = [
  "src/data/demoPortfolio.js",
  "src/components/ProjectsShowcase.jsx",
  "src/components/PortfolioTimeline.jsx",
  "src/components/UnderwaterVolcanoField.jsx",
  "src/components/Admin.jsx",
  "src/components/AdminVersionPreviewPage.jsx",
  "src/components/CvPage.jsx",
  "src/components/ProjectCaseStudyPage.jsx",
  "src/components/RecruiterPage.jsx",
  "src/components/MissionControlPage.jsx",
  "src/components/SiteFooter.jsx",
  "src/components/TreasureMineField.jsx",
];

function normalize(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function resolveModule(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base];
  for (const extension of extensions) candidates.push(`${base}${extension}`);
  for (const extension of extensions) candidates.push(path.join(base, `index${extension}`));
  return candidates.find((candidate) => (
    fs.existsSync(candidate)
    && fs.statSync(candidate).isFile()
    && extensions.includes(path.extname(candidate))
  )) ?? null;
}

function staticSpecifiers(source) {
  const matches = new Set();
  const patterns = [
    /^\s*import\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']\s*;?/gm,
    /^\s*export\s+[^"']*?\s+from\s+["']([^"']+)["']\s*;?/gm,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) matches.add(match[1]);
  }
  return [...matches];
}

const reachable = new Set();
const queue = [entry];
while (queue.length > 0) {
  const file = queue.pop();
  if (!file || reachable.has(file)) continue;
  reachable.add(file);
  const source = fs.readFileSync(file, "utf8");
  for (const specifier of staticSpecifiers(source)) {
    const resolved = resolveModule(file, specifier);
    if (resolved) queue.push(resolved);
  }
}

const totalBytes = [...reachable].reduce((sum, file) => sum + fs.statSync(file).size, 0);
const relativeReachable = new Set([...reachable].map(normalize));
const errors = [];

if (totalBytes > MAX_INITIAL_SOURCE_BYTES) {
  errors.push(`initial static source ${totalBytes} bytes > ${MAX_INITIAL_SOURCE_BYTES}`);
}
if (reachable.size > MAX_INITIAL_SOURCE_FILES) {
  errors.push(`initial static source ${reachable.size} files > ${MAX_INITIAL_SOURCE_FILES}`);
}
for (const deferred of mustStayDeferred) {
  if (relativeReachable.has(deferred)) errors.push(`${deferred} returned to the initial static graph`);
}

if (errors.length) {
  console.error(`Initial source closure FAILED:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Initial source closure OK: ${reachable.size} files / ${totalBytes} bytes; `
  + `${mustStayDeferred.length} heavy modules remain deferred.`,
);
