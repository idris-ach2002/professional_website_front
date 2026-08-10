import { brotliCompressSync, constants as zlibConstants } from "node:zlib";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const PUBLIC = "public";
const HARD_INITIAL_JS_BROTLI = 360 * 1024;
const TARGET_INITIAL_JS_BROTLI = 350 * 1024;
const GENERIC_VENDOR_BROTLI = 260 * 1024;
const MAX_VOLCANO_SCENE = 32 * 1024;
const MAX_VOLCANO_ENVIRONMENT = 16 * 1024;
const MAX_PUBLIC_IMAGE = 400 * 1024;
const MAX_PUBLIC_TOTAL = 400 * 1024;

let hasFailure = false;

function fail(message) {
  hasFailure = true;
  console.error(`Performance budget failed: ${message}`);
  process.exitCode = 1;
}

function filesRecursively(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesRecursively(path) : [path];
  });
}

function brotliSize(path) {
  return brotliCompressSync(readFileSync(path), {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
  }).byteLength;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function initialManifestFiles() {
  const manifestPath = join(DIST, ".vite", "manifest.json");
  if (!existsSync(manifestPath)) {
    fail("dist/.vite/manifest.json is missing; Vite build.manifest must stay enabled.");
    return [];
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry);
  if (!entryKey) {
    fail("no Vite entry was found in the manifest.");
    return [];
  }

  const seen = new Set();
  const visit = (key) => {
    if (!key || seen.has(key) || !manifest[key]) return;
    seen.add(key);
    for (const imported of manifest[key].imports ?? []) visit(imported);
  };
  visit(entryKey);

  return [...seen]
    .map((key) => manifest[key]?.file)
    .filter((file) => file?.endsWith(".js"));
}

const initialFiles = initialManifestFiles();
const initialBrotli = initialFiles.reduce((total, file) => {
  const path = join(DIST, file);
  return total + (existsSync(path) ? brotliSize(path) : 0);
}, 0);

if (initialBrotli > HARD_INITIAL_JS_BROTLI) {
  fail(`initial JS Brotli ${formatKb(initialBrotli)} > hard limit ${formatKb(HARD_INITIAL_JS_BROTLI)}.`);
} else if (initialBrotli > TARGET_INITIAL_JS_BROTLI) {
  console.warn(`Performance target warning: initial JS Brotli ${formatKb(initialBrotli)} > target ${formatKb(TARGET_INITIAL_JS_BROTLI)}.`);
}

const distJs = filesRecursively(join(DIST, "assets")).filter((path) => path.endsWith(".js"));
const vendorSizes = distJs
  .filter((path) => /\/vendor-[^/]+\.js$/.test(path))
  .map((path) => ({ file: relative(DIST, path), size: brotliSize(path) }))
  .sort((a, b) => b.size - a.size);
if (vendorSizes.length > 0) {
  console.log(`Vendor Brotli: ${vendorSizes.map((entry) => `${entry.file}=${formatKb(entry.size)}`).join(", ")}`);
}
const genericVendor = distJs.find((path) => /\/vendor-[^-][^/]*\.js$/.test(path) && !/vendor-(react|router|mantine|gsap)-/.test(path));
if (genericVendor) {
  const size = brotliSize(genericVendor);
  if (size > GENERIC_VENDOR_BROTLI) {
    fail(`generic vendor Brotli ${formatKb(size)} > ${formatKb(GENERIC_VENDOR_BROTLI)}.`);
  }
  console.log(`Generic vendor Brotli: ${formatKb(size)}.`);
}
const volcanoScene = join(PUBLIC, "scenes", "abyss-volcano.svg");
if (!existsSync(volcanoScene)) {
  fail("public/scenes/abyss-volcano.svg is missing.");
} else if (statSync(volcanoScene).size > MAX_VOLCANO_SCENE) {
  fail(`drawn abyss volcano SVG ${formatKb(statSync(volcanoScene).size)} > ${formatKb(MAX_VOLCANO_SCENE)}.`);
}
const volcanoEnvironment = join(PUBLIC, "scenes", "abyss-volcano-environment.svg");
if (!existsSync(volcanoEnvironment)) {
  fail("public/scenes/abyss-volcano-environment.svg is missing.");
} else if (statSync(volcanoEnvironment).size > MAX_VOLCANO_ENVIRONMENT) {
  fail(`abyss volcano environment SVG ${formatKb(statSync(volcanoEnvironment).size)} > ${formatKb(MAX_VOLCANO_ENVIRONMENT)}.`);
}
if (distJs.some((path) => /vendor-three-/.test(path))) {
  fail("vendor-three must not return after the Canvas 2D migration.");
}

const publicFiles = filesRecursively(PUBLIC);
const publicTotal = publicFiles.reduce((sum, path) => sum + statSync(path).size, 0);
if (publicTotal > MAX_PUBLIC_TOTAL) {
  fail(`public assets ${formatKb(publicTotal)} > ${formatKb(MAX_PUBLIC_TOTAL)}.`);
}

const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i;
for (const path of publicFiles.filter((file) => imagePattern.test(file))) {
  const size = statSync(path).size;
  if (size > MAX_PUBLIC_IMAGE) {
    fail(`${relative(PUBLIC, path)} is ${formatKb(size)} > ${formatKb(MAX_PUBLIC_IMAGE)}.`);
  }
}

if (publicFiles.some((path) => path.includes(`${join("assets", "mock")}`))) {
  fail("mock assets must not be deployed from public/assets/mock.");
}

if (!hasFailure) {
  console.log(`Performance budgets OK: initial JS ${formatKb(initialBrotli)}, public ${formatKb(publicTotal)}.`);
}
console.log(`Initial JS closure: ${initialFiles.join(", ")}`);
