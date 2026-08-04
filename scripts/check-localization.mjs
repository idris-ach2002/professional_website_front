import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { UI_MESSAGES } from "../src/localization/uiMessages.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const sourceFiles = [];
const errors = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (/\.(?:js|jsx)$/.test(entry.name)) sourceFiles.push(filename);
  }
}

walk(sourceRoot);

const referencedKeys = new Set();
const staticKeyPattern = /\bt\(\s*["']([^"']+)["']/g;
for (const filename of sourceFiles) {
  const source = fs.readFileSync(filename, "utf8");
  for (const match of source.matchAll(staticKeyPattern)) referencedKeys.add(match[1]);
}

for (const language of ["fr", "en"]) {
  for (const key of referencedKeys) {
    if (!(key in UI_MESSAGES[language])) errors.push(`${language}: missing UI message key ${key}`);
  }
}

const obsoleteDirectory = path.join(sourceRoot, "i18n");
if (fs.existsSync(obsoleteDirectory)) errors.push("src/i18n must not exist: business content is localized by the backend");

const forbiddenImports = sourceFiles.flatMap((filename) => {
  const source = fs.readFileSync(filename, "utf8");
  return source.includes("/i18n/") || source.includes("localizePortfolio")
    ? [path.relative(root, filename)]
    : [];
});
if (forbiddenImports.length) errors.push(`Obsolete local content localization imports: ${forbiddenImports.join(", ")}`);

if (errors.length) {
  console.error("Localization check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`Localization OK: ${referencedKeys.size} static UI keys in FR/EN; dynamic content is backend-owned.`);
