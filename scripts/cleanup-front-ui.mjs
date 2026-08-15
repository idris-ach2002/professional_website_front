import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check") || args.has("--dry-run");
const verbose = args.has("--verbose");
const noVerify = args.has("--no-verify");
const srcRoot = path.join(root, "src");
const backupRoot = path.join(root, ".cleanup-backup");
const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const runBackup = path.join(backupRoot, stamp);

if (!fs.existsSync(path.join(root, "package.json")) || !fs.existsSync(srcRoot)) {
  console.error("Run this script from the frontend repository root.");
  process.exit(1);
}

const normalizePath = (value) => value.replaceAll(path.sep, "/");
const relative = (file) => normalizePath(path.relative(root, file));

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "build", ".cleanup-backup"].includes(entry.name)) return [];
      return walk(absolute, predicate);
    }
    return predicate(absolute) ? [absolute] : [];
  });
}

function sourceStats() {
  const css = walk(srcRoot, (file) => file.endsWith(".css"));
  const js = walk(srcRoot, (file) => /\.(?:js|jsx)$/.test(file));
  let cssBytes = 0;
  let important = 0;
  for (const file of css) {
    const source = fs.readFileSync(file, "utf8");
    cssBytes += Buffer.byteLength(source);
    important += source.match(/!important\b/g)?.length ?? 0;
  }
  return { cssFiles: css.length, jsFiles: js.length, cssBytes, important };
}

function resolveModule(fromFile, specifier, extensions) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const baseExtension = path.extname(base);
  const candidates = [];
  if (baseExtension && extensions.includes(baseExtension)) candidates.push(base);
  if (!baseExtension) {
    for (const extension of extensions) candidates.push(`${base}${extension}`);
    for (const extension of extensions) candidates.push(path.join(base, `index${extension}`));
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function importedSpecifiers(content) {
  const result = new Set();
  const patterns = [
    /\bimport\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[^"']*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    /new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) result.add(match[1]);
  }
  return [...result];
}

function buildReachability() {
  const runtimeExt = [".js", ".jsx"];
  const runtime = new Set();
  const styles = new Set();
  const runtimeQueue = [path.join(srcRoot, "main.jsx")];
  const cssQueue = [path.join(srcRoot, "index.css")];

  while (runtimeQueue.length) {
    const file = runtimeQueue.pop();
    if (!file || runtime.has(file)) continue;
    runtime.add(file);
    const content = fs.readFileSync(file, "utf8");
    for (const specifier of importedSpecifiers(content)) {
      const moduleFile = resolveModule(file, specifier, runtimeExt);
      if (moduleFile) {
        runtimeQueue.push(moduleFile);
        continue;
      }
      const cssFile = resolveModule(file, specifier, [".css"]);
      if (cssFile) cssQueue.push(cssFile);
    }
  }

  while (cssQueue.length) {
    const file = cssQueue.pop();
    if (!file || styles.has(file)) continue;
    styles.add(file);
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
      const cssFile = resolveModule(file, match[1], [".css"]);
      if (cssFile) cssQueue.push(cssFile);
    }
  }

  return { runtime, styles };
}

function isRuntimeFile(file) {
  const rel = relative(file);
  if (!/\.(?:js|jsx)$/.test(file)) return false;
  if (rel.includes("/test/") || /\.test\.(?:js|jsx)$/.test(rel)) return false;
  return true;
}

function backupFile(file) {
  if (checkOnly || !fs.existsSync(file)) return;
  const target = path.join(runBackup, relative(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function restoreBackup() {
  if (checkOnly || !fs.existsSync(runBackup)) return;
  for (const file of walk(runBackup)) {
    const rel = normalizePath(path.relative(runBackup, file));
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
}

function removeFile(file, log) {
  log.push(`delete ${relative(file)}`);
  if (checkOnly) return;
  backupFile(file);
  fs.rmSync(file, { force: true });
}

function writeFile(file, content, log, reason) {
  const current = fs.readFileSync(file, "utf8");
  if (current === content) return;
  log.push(`${reason} ${relative(file)}`);
  if (checkOnly) return;
  backupFile(file);
  fs.writeFileSync(file, content);
}

function scanCssDeclarations(source) {
  const records = [];

  function skipComment(index) {
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      return end < 0 ? source.length : end + 2;
    }
    return index;
  }

  function findMatchingBrace(open) {
    let depth = 1;
    let quote = null;
    for (let i = open + 1; i < source.length; i += 1) {
      if (!quote && source[i] === "/" && source[i + 1] === "*") {
        i = skipComment(i) - 1;
        continue;
      }
      const char = source[i];
      if (quote) {
        if (char === "\\") i += 1;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'") quote = char;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return source.length - 1;
  }

  function parseDeclarations(start, end, context, selector) {
    let tokenStart = start;
    let quote = null;
    let paren = 0;
    for (let i = start; i <= end; i += 1) {
      if (!quote && source[i] === "/" && source[i + 1] === "*") {
        i = skipComment(i) - 1;
        continue;
      }
      const char = source[i];
      if (quote) {
        if (char === "\\") i += 1;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'") quote = char;
      else if (char === "(") paren += 1;
      else if (char === ")") paren = Math.max(0, paren - 1);
      else if ((char === ";" || i === end) && paren === 0) {
        const declEnd = i + 1;
        const raw = source.slice(tokenStart, declEnd);
        const cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/;$/, "").trim();
        const colon = cleaned.indexOf(":");
        if (colon > 0) {
          const property = cleaned.slice(0, colon).trim().toLowerCase();
          const value = cleaned.slice(colon + 1).trim();
          if (/^--[\w-]+$/.test(property) || /^-?[a-z][\w-]*$/.test(property)) {
            records.push({
              context,
              selector,
              property,
              value,
              normalizedValue: value.replace(/\s+/g, " ").trim(),
              important: /!important\s*$/i.test(value),
              start: tokenStart,
              end: declEnd,
            });
          }
        }
        tokenStart = declEnd;
      }
    }
  }

  function parseRange(start, end, context = []) {
    let cursor = start;
    while (cursor < end) {
      if (source[cursor] === "/" && source[cursor + 1] === "*") {
        cursor = skipComment(cursor);
        continue;
      }
      if (/\s/.test(source[cursor])) {
        cursor += 1;
        continue;
      }
      const headerStart = cursor;
      let quote = null;
      let paren = 0;
      let open = -1;
      let semi = -1;
      for (let i = cursor; i < end; i += 1) {
        if (!quote && source[i] === "/" && source[i + 1] === "*") {
          i = skipComment(i) - 1;
          continue;
        }
        const char = source[i];
        if (quote) {
          if (char === "\\") i += 1;
          else if (char === quote) quote = null;
          continue;
        }
        if (char === '"' || char === "'") quote = char;
        else if (char === "(") paren += 1;
        else if (char === ")") paren = Math.max(0, paren - 1);
        else if (paren === 0 && char === "{") { open = i; break; }
        else if (paren === 0 && char === ";") { semi = i; break; }
      }
      if (semi >= 0 && (open < 0 || semi < open)) {
        cursor = semi + 1;
        continue;
      }
      if (open < 0) break;
      const close = findMatchingBrace(open);
      const header = source.slice(headerStart, open).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ").trim();
      if (header.startsWith("@")) {
        const atName = header.split(/[\s(]/)[0].toLowerCase();
        if (!atName.includes("keyframes") && !["@font-face", "@property", "@page"].includes(atName)) {
          parseRange(open + 1, close, [...context, header]);
        }
      } else if (header) {
        parseDeclarations(open + 1, close - 1, context.join(" | ") || "<root>", header);
      }
      cursor = close + 1;
    }
  }

  parseRange(0, source.length);
  return records;
}

function removeEmptyRules(source) {
  let result = source;
  let removed = 0;
  for (let pass = 0; pass < 4; pass += 1) {
    const pattern = /(^|\n)([ \t]*(?!@)[^{}\n]+)\{(?:[ \t\r\n]|\/\*[\s\S]*?\*\/)*\}/g;
    let changed = false;
    result = result.replace(pattern, (match, lineStart) => {
      changed = true;
      removed += 1;
      return lineStart;
    });
    if (!changed) break;
  }
  return { result, removed };
}


const retiredProfileClassTokens = new Set([
  "portrait-role",
  "profile-availability-detail",
  "profile-identity-status",
  "profile-identity-status-copy",
  "profile-identity-widget",
  "profile-ios-contact-count",
  "profile-ios-note-label",
  "profile-live-pulse",
  "profile-model-subtitle",
  "profile-photo-motion-beams",
  "profile-photo-motion-chroma",
  "profile-photo-motion-field",
  "profile-photo-motion-highlights",
  "profile-photo-motion-lines",
  "profile-photo-orbit",
  "profile-skill-widget-head",
  "profile-skill-widget-values",
]);

function pruneRetiredCssRules(source) {
  let result = source;
  let removed = 0;
  for (let pass = 0; pass < 6; pass += 1) {
    let changed = false;
    result = result.replace(/([^{}]+)\{([^{}]*)\}/g, (match, rawHeader) => {
      const header = rawHeader.replace(/\/\*[\s\S]*?\*\//g, " ").trim();
      if (header.startsWith("@")) return match;
      const classes = [...header.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((item) => item[1]);
      if (!classes.some((token) => retiredProfileClassTokens.has(token))) return match;
      changed = true;
      removed += 1;
      return "";
    });
    if (!changed) break;
  }
  return { result, removed };
}

function squashCss(source) {
  const retired = pruneRetiredCssRules(source);
  source = retired.result;
  const records = scanCssDeclarations(source);
  const groups = new Map();
  for (const record of records) {
    const selector = record.selector.replace(/\s+/g, " ").trim();
    const key = `${record.context}\u0000${selector}\u0000${record.property}\u0000${record.normalizedValue}\u0000${record.important}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const remove = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    // Identical selector/property/value/importance: only the last occurrence can affect
    // the final cascade. Different values are deliberately retained as compatibility/
    // contract fallbacks, so this pass cannot change the rendered design.
    for (const record of group.slice(0, -1)) remove.push([record.start, record.end]);
  }

  remove.sort((a, b) => b[0] - a[0]);
  let result = source;
  for (const [start, end] of remove) result = result.slice(0, start) + result.slice(end);
  const empty = removeEmptyRules(result);
  result = empty.result.replace(/\n[\t ]*\n[\t ]*\n+/g, "\n\n");
  return {
    result,
    removedDeclarations: remove.length,
    emptyRulesRemoved: empty.removed,
    retiredRulesRemoved: retired.removed,
  };
}

const before = sourceStats();
const log = [];
const reachability = buildReachability();
const runtimeFiles = walk(srcRoot, isRuntimeFile);
const styleFiles = walk(path.join(srcRoot, "styles"), (file) => file.endsWith(".css"));
const runtimeOrphans = runtimeFiles.filter((file) => !reachability.runtime.has(file));
const styleOrphans = styleFiles.filter((file) => !reachability.styles.has(file));

for (const file of runtimeOrphans) removeFile(file, log);
for (const file of styleOrphans) removeFile(file, log);

const garbagePattern = /(?:\.orig|\.bak|\.backup|\.rej|\.tmp|~)$/i;
for (const file of walk(srcRoot, (candidate) => garbagePattern.test(candidate))) removeFile(file, log);

let removedDeclarations = 0;
let emptyRulesRemoved = 0;
let retiredRulesRemoved = 0;
for (const file of styleFiles.filter((candidate) => fs.existsSync(candidate))) {
  const source = fs.readFileSync(file, "utf8");
  const squashed = squashCss(source);
  removedDeclarations += squashed.removedDeclarations;
  emptyRulesRemoved += squashed.emptyRulesRemoved;
  retiredRulesRemoved += squashed.retiredRulesRemoved ?? 0;
  writeFile(file, squashed.result, log, "dedupe-css");
}

const gitignore = path.join(root, ".gitignore");
if (fs.existsSync(gitignore)) {
  const current = fs.readFileSync(gitignore, "utf8");
  if (!current.split(/\r?\n/).includes(".cleanup-backup/")) {
    writeFile(gitignore, `${current.replace(/\s*$/, "")}\n.cleanup-backup/\n`, log, "gitignore");
  }
}

if (!checkOnly && !noVerify) {
  const checks = [
    "scripts/check-css-architecture.mjs",
    "scripts/check-css-orphans.mjs",
    "scripts/check-css-quality.mjs",
    "scripts/check-responsive-contract.mjs",
    "scripts/check-timeline-motion.mjs",
    "scripts/check-high-refresh.mjs",
    "scripts/check-source-tree.mjs",
    "scripts/check-retired-modules.mjs",
  ];
  try {
    for (const script of checks) execFileSync("node", [script], { cwd: root, stdio: verbose ? "inherit" : "pipe" });
  } catch (error) {
    console.error("Cleanup verification failed; restoring modified files from backup.");
    restoreBackup();
    console.error(error.stdout?.toString?.() || error.message);
    process.exit(1);
  }
}

const after = checkOnly ? before : sourceStats();
console.log("Front cleanup complete.");
console.log(`Mode: ${checkOnly ? "check/dry-run" : "write"}`);
console.log(`CSS files: ${before.cssFiles} -> ${after.cssFiles}`);
console.log(`CSS bytes: ${before.cssBytes} -> ${after.cssBytes} (${after.cssBytes - before.cssBytes})`);
console.log(`!important: ${before.important} -> ${after.important} (${after.important - before.important})`);
console.log(`Identical CSS declarations removed: ${removedDeclarations}`);
console.log(`Empty CSS rules removed: ${emptyRulesRemoved}`);
console.log(`Retired profile CSS rules removed: ${retiredRulesRemoved}`);
console.log(`Runtime orphans removed: ${runtimeOrphans.length}; CSS orphans removed: ${styleOrphans.length}`);
if (!checkOnly) console.log(`Backup: ${relative(runBackup)}`);
if (verbose || checkOnly) for (const entry of log) console.log(`- ${entry}`);
