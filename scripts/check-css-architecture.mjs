import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const facadePath = path.join(root, "src", "index.css");
const facade = fs.readFileSync(facadePath, "utf8");
const importPattern = /@import\s+["']([^"']+)["']\s*;/g;
const localImports = [...facade.matchAll(importPattern)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("."));

const errors = [];
const importedFiles = [];

function scanBalancedCss(source, filename) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth < 0) {
        errors.push(`${filename}: unexpected closing brace`);
        depth = 0;
      }
    }
  }

  if (comment) errors.push(`${filename}: unclosed comment`);
  if (quote) errors.push(`${filename}: unclosed string`);
  if (depth !== 0) errors.push(`${filename}: ${depth} unclosed block(s)`);
}

for (const relativeImport of localImports) {
  const absolutePath = path.resolve(path.dirname(facadePath), relativeImport);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing import: ${relativeImport}`);
    continue;
  }
  importedFiles.push(absolutePath);
  scanBalancedCss(fs.readFileSync(absolutePath, "utf8"), path.relative(root, absolutePath));
}

const facadeWithoutComments = facade.replace(/\/\*[\s\S]*?\*\//g, "");
const invalidFacadeLines = facadeWithoutComments
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !line.startsWith("@import ") || !line.endsWith(";"));
if (invalidFacadeLines.length) errors.push("src/index.css must remain an import-only facade");

const obsoleteFiles = [
  "src/styles/navigation/07-dragon-holo-navigation.css",
  "src/styles/navigation/08-dock-navigation-experiments.css",
  "src/styles/navigation/09-black-pearl-navigation.css",
];
for (const relativePath of obsoleteFiles) {
  if (fs.existsSync(path.join(root, relativePath))) errors.push(`Obsolete stylesheet still present: ${relativePath}`);
}

const totalBytes = importedFiles.reduce((sum, filename) => sum + fs.statSync(filename).size, 0);
const maxGlobalCssBytes = 205_000;
if (totalBytes > maxGlobalCssBytes) {
  errors.push(`Global CSS budget exceeded: ${totalBytes} bytes > ${maxGlobalCssBytes} bytes`);
}

const importantCount = importedFiles.reduce((sum, filename) => {
  const matches = fs.readFileSync(filename, "utf8").match(/!important\b/g);
  return sum + (matches?.length ?? 0);
}, 0);
const maxImportantCount = 1_150;
if (importantCount > maxImportantCount) {
  errors.push(`!important budget exceeded: ${importantCount} > ${maxImportantCount}`);
}

if (errors.length) {
  console.error("CSS architecture check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`CSS architecture OK: ${importedFiles.length} global files, ${totalBytes} bytes, ${importantCount} !important declarations.`);
