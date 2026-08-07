import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const facadePath = path.join(root, "src", "index.css");
const facade = fs.readFileSync(facadePath, "utf8");
const imports = [...facade.matchAll(/@import\s+["']([^"']+)["']\s*;/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("."));
const absoluteFiles = imports.map((value) => path.resolve(path.dirname(facadePath), value));
const errors = [];

const expectedLastImport = "./styles/responsive/company-responsive.css";
if (imports.at(-1) !== expectedLastImport) {
  errors.push(`Responsive contract must be the final CSS import (${expectedLastImport}).`);
}

const duplicates = imports.filter((value, index) => imports.indexOf(value) !== index);
if (duplicates.length) errors.push(`Duplicate CSS imports: ${[...new Set(duplicates)].join(", ")}`);

let totalBytes = 0;
let importantCount = 0;
let emptyRuleCount = 0;
let transitionAllCount = 0;

for (const filename of absoluteFiles) {
  if (!fs.existsSync(filename)) continue;
  const source = fs.readFileSync(filename, "utf8");
  const relative = path.relative(root, filename);
  totalBytes += Buffer.byteLength(source);
  importantCount += source.match(/!important\b/g)?.length ?? 0;
  const emptyRules = source.match(/(?:^|\n)\s*[^{}\n]+\{\s*\}/g) ?? [];
  emptyRuleCount += emptyRules.length;
  if (emptyRules.length) errors.push(`${relative}: ${emptyRules.length} empty CSS rule(s).`);
  const transitionAll = source.match(/transition(?:-property)?\s*:\s*all\b/g) ?? [];
  transitionAllCount += transitionAll.length;
  if (transitionAll.length) errors.push(`${relative}: avoid transition: all (${transitionAll.length}).`);
}

const limits = {
  stylesheets: 20,
  bytes: 212_000,
  important: 1_200,
};
if (absoluteFiles.length > limits.stylesheets) errors.push(`Stylesheet count ${absoluteFiles.length} > ${limits.stylesheets}.`);
if (totalBytes > limits.bytes) errors.push(`Global CSS ${totalBytes} bytes > ${limits.bytes} bytes.`);
if (importantCount > limits.important) errors.push(`!important count ${importantCount} > ${limits.important}.`);

if (errors.length) {
  console.error(`CSS quality check failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `CSS quality OK: ${absoluteFiles.length} stylesheets, ${totalBytes} bytes, `
  + `${importantCount} !important, ${emptyRuleCount} empty rules, ${transitionAllCount} transition-all.`,
);
