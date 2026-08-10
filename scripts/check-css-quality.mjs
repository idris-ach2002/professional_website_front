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

  // V18 regression guard: deleting an empty rule must never leave its selector
  // attached to the next non-empty rule. Those selector leaks are valid CSS,
  // so a parser/build can pass while an unrelated visual layer is applied.
  if (/\.contact-pill:hover strong,\s*\.timeline-row::before\s*\{/.test(source)) {
    errors.push(`${relative}: leaked profile/contact selectors into .timeline-row::before.`);
  }
  if (/\.profile-island \.hero-lead,\s*\.timeline-card\.island-card\s*\{/.test(source)) {
    errors.push(`${relative}: leaked profile selector into .timeline-card.island-card.`);
  }
}

const limits = {
  stylesheets: 20,
  bytes: 245_000,
  important: 1_300,
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
