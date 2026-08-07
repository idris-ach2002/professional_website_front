import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const facadePath = path.join(root, "src", "index.css");
const facade = fs.readFileSync(facadePath, "utf8");
const importPattern = /@import\s+["']([^"']+)["']\s*;/g;
const importedFiles = [...facade.matchAll(importPattern)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("."))
  .map((value) => path.resolve(path.dirname(facadePath), value));

const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".html"]);
const sourceRoots = [path.join(root, "src"), path.join(root, "e2e"), path.join(root, "scripts")];
const sourceChunks = [];

function collectSourceFiles(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectSourceFiles(absolutePath);
    else if (sourceExtensions.has(path.extname(entry.name)) && !entry.name.endsWith(".css")) {
      sourceChunks.push(fs.readFileSync(absolutePath, "utf8"));
    }
  }
}

for (const sourceRoot of sourceRoots) collectSourceFiles(sourceRoot);
const indexHtml = path.join(root, "index.html");
if (fs.existsSync(indexHtml)) sourceChunks.push(fs.readFileSync(indexHtml, "utf8"));

const source = sourceChunks.join("\n");
const dynamicPrefixes = new Set(
  [...source.matchAll(/([A-Za-z_][\w-]{2,})\$\{/g)].map((match) => match[1]),
);
const externalPrefixes = ["mantine-"];

function sourceContainsClass(className) {
  if (externalPrefixes.some((prefix) => className.startsWith(prefix))) return true;
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|[^\\w-])${escaped}([^\\w-]|$)`, "m").test(source)) return true;
  return [...dynamicPrefixes].some((prefix) => className.startsWith(prefix));
}

function stripComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, " ");
}

function findMatchingBrace(css, openingIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let index = openingIndex; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];

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
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function collectSelectors(css, selectors, lineOffset = 0) {
  let cursor = 0;
  let statementStart = 0;
  while (cursor < css.length) {
    const char = css[cursor];
    if (char === ";") {
      statementStart = cursor + 1;
      cursor += 1;
      continue;
    }
    if (char !== "{") {
      cursor += 1;
      continue;
    }

    const close = findMatchingBrace(css, cursor);
    if (close < 0) return;
    const preludeRaw = css.slice(statementStart, cursor);
    const prelude = stripComments(preludeRaw).trim();
    const line = lineOffset + css.slice(0, cursor).split("\n").length;
    const body = css.slice(cursor + 1, close);

    if (prelude.startsWith("@")) {
      const keyword = prelude.match(/^@([\w-]+)/)?.[1]?.toLowerCase();
      if (keyword && keyword !== "page") {
        collectSelectors(body, selectors, line);
      }
    } else if (prelude) {
      selectors.push({ selector: prelude, line });
    }

    cursor = close + 1;
    statementStart = cursor;
  }
}

const orphanRules = [];
for (const filename of importedFiles) {
  const relativeName = path.relative(root, filename);
  const css = fs.readFileSync(filename, "utf8");
  const selectors = [];
  collectSelectors(css, selectors);
  for (const rule of selectors) {
    const classes = [...new Set([...rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))];
    if (!classes.length) continue;
    if (classes.every((className) => !sourceContainsClass(className))) {
      orphanRules.push(`${relativeName}:${rule.line} ${rule.selector.replace(/\s+/g, " ")}`);
    }
  }
}

if (orphanRules.length) {
  console.error(`CSS orphan selector check failed (${orphanRules.length} rule(s)):\n- ${orphanRules.join("\n- ")}`);
  process.exit(1);
}

console.log(`CSS orphan selector check OK: ${importedFiles.length} global stylesheets, 0 orphan rules.`);
