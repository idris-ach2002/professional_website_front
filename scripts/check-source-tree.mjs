import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");
const entry = path.join(srcRoot, "main.jsx");
const cssEntry = path.join(srcRoot, "index.css");

const runtimeExtensions = [".js", ".jsx"];
const styleExtension = ".css";

function walk(directory, predicate) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entryInfo) => {
    const absolute = path.join(directory, entryInfo.name);
    if (entryInfo.isDirectory()) return walk(absolute, predicate);
    return predicate(absolute) ? [absolute] : [];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function isRuntimeSource(file) {
  if (!runtimeExtensions.includes(path.extname(file))) return false;
  const normalized = relative(file);
  if (normalized.includes("/test/")) return false;
  if (/\.test\.(js|jsx)$/.test(normalized)) return false;
  return true;
}

function resolveModule(fromFile, specifier, extensions) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base];
  for (const extension of extensions) candidates.push(`${base}${extension}`);
  for (const extension of extensions) candidates.push(path.join(base, `index${extension}`));
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function importedSpecifiers(content) {
  const matches = new Set();
  const patterns = [
    /\bimport\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[^"']*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    /new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) matches.add(match[1]);
  }
  return [...matches];
}

const reachableRuntime = new Set();
const reachableCss = new Set();
const runtimeQueue = [entry];
const cssQueue = [cssEntry];

while (runtimeQueue.length > 0) {
  const file = runtimeQueue.pop();
  if (!file || reachableRuntime.has(file)) continue;
  reachableRuntime.add(file);
  const content = fs.readFileSync(file, "utf8");
  for (const specifier of importedSpecifiers(content)) {
    const jsModule = resolveModule(file, specifier, runtimeExtensions);
    if (jsModule && isRuntimeSource(jsModule)) {
      runtimeQueue.push(jsModule);
      continue;
    }
    const cssModule = resolveModule(file, specifier, [styleExtension]);
    if (cssModule) cssQueue.push(cssModule);
  }
}

while (cssQueue.length > 0) {
  const file = cssQueue.pop();
  if (!file || reachableCss.has(file)) continue;
  reachableCss.add(file);
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;
    const cssModule = resolveModule(file, specifier, [styleExtension]);
    if (cssModule) cssQueue.push(cssModule);
  }
}

const runtimeFiles = walk(srcRoot, isRuntimeSource);
const styleRoot = path.join(srcRoot, "styles");
const styleFiles = walk(styleRoot, (file) => path.extname(file) === styleExtension);

const unreachableRuntime = runtimeFiles.filter((file) => !reachableRuntime.has(file));
const unreachableStyles = styleFiles.filter((file) => !reachableCss.has(file));

const failures = [];
if (unreachableRuntime.length > 0) {
  failures.push(`runtime JS/JSX orphelin:\n${unreachableRuntime.map((file) => `  - ${relative(file)}`).join("\n")}`);
}
if (unreachableStyles.length > 0) {
  failures.push(`feuille CSS non atteignable:\n${unreachableStyles.map((file) => `  - ${relative(file)}`).join("\n")}`);
}

if (failures.length > 0) {
  console.error(`Source tree check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(
  `Source tree OK: ${runtimeFiles.length}/${runtimeFiles.length} fichiers runtime JS/JSX atteignables, `
  + `${styleFiles.length}/${styleFiles.length} feuilles CSS atteignables.`,
);
