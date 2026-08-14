import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const distDir = path.join(root, "dist");
const stampPath = path.join(distDir, ".e2e-build-fingerprint.json");

const REQUIRED_BUILD_PROFILE = Object.freeze({
  E2E_HERMETIC_BUILD: "1",
  VITE_E2E_RUNTIME_QUALITY: "constrained",
  VITE_ANALYTICS_DISABLED: "true",
  VITE_PUBLIC_SITE_URL: "http://127.0.0.1:4173",
  VITE_API_BASE_URL: "http://127.0.0.1:4173",
  VITE_USE_DIRECT_BACKEND: "true",
  VITE_UPLOAD_ENDPOINT: "/uploads/",
  VITE_BUILD_ID: "e2e-build",
  VITE_COMMIT_SHA: "e2e-commit",
});

const INPUTS = [
  ".nvmrc",
  ".npmrc",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "src",
  "public",
  "scripts/generate-static-pages.mjs",
  "scripts/public-snapshot.mjs",
];

function filesUnder(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [relativePath];

  const result = [];
  const walk = (directory, prefix) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = path.posix.join(prefix, entry.name);
      const next = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(next, relative);
      else if (entry.isFile()) result.push(relative);
    }
  };
  walk(absolute, relativePath);
  return result;
}

function sourceFingerprint() {
  const hash = crypto.createHash("sha256");
  const files = INPUTS.flatMap(filesUnder).sort();
  for (const relative of files) {
    hash.update(relative);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(root, relative)));
    hash.update("\0");
  }
  return { digest: hash.digest("hex"), files: files.length };
}

function currentBuildProfile() {
  return Object.fromEntries(Object.keys(REQUIRED_BUILD_PROFILE).map((key) => [key, process.env[key] ?? ""]));
}

function assertBuildProfile() {
  const current = currentBuildProfile();
  const mismatches = Object.entries(REQUIRED_BUILD_PROFILE)
    .filter(([key, expected]) => current[key] !== expected)
    .map(([key, expected]) => `${key}=${JSON.stringify(current[key])}, attendu ${JSON.stringify(expected)}`);
  if (mismatches.length) {
    throw new Error(`E2E artifact build profile violated:\n- ${mismatches.join("\n- ")}`);
  }
  return current;
}

function assertDistExists() {
  const index = path.join(distDir, "index.html");
  if (!fs.existsSync(index)) {
    throw new Error("E2E artifact precondition failed: dist/index.html is missing.");
  }
}

function writeStamp() {
  assertDistExists();
  const profile = assertBuildProfile();
  const source = sourceFingerprint();
  const stamp = {
    schema: 2,
    sourceSha256: source.digest,
    sourceFiles: source.files,
    buildProfile: profile,
  };
  fs.writeFileSync(stampPath, `${JSON.stringify(stamp, null, 2)}\n`);
  console.log(`E2E artifact stamped: ${source.digest.slice(0, 16)} (${source.files} inputs, hermetic profile v2).`);
}

function verifyStamp() {
  assertDistExists();
  if (!fs.existsSync(stampPath)) {
    throw new Error("E2E artifact precondition failed: dist/.e2e-build-fingerprint.json is missing.");
  }
  const stamp = JSON.parse(fs.readFileSync(stampPath, "utf8"));
  const source = sourceFingerprint();
  if (stamp.schema !== 2) throw new Error(`Unsupported E2E artifact stamp schema: ${stamp.schema}`);

  for (const [key, expected] of Object.entries(REQUIRED_BUILD_PROFILE)) {
    if (stamp.buildProfile?.[key] !== expected) {
      throw new Error(`E2E artifact profile mismatch for ${key}: expected ${expected}, got ${stamp.buildProfile?.[key] ?? "missing"}.`);
    }
  }

  if (stamp.sourceSha256 !== source.digest) {
    throw new Error(
      "E2E artifact freshness violated: dist was built from different source/build inputs. "
        + `stamp=${stamp.sourceSha256}, current=${source.digest}.`,
    );
  }
  console.log(`E2E artifact verified: ${source.digest.slice(0, 16)} (${source.files} inputs, hermetic profile v2).`);
}

function ensureStamp() {
  try {
    verifyStamp();
    return;
  } catch (error) {
    if (process.env.PLAYWRIGHT_PREBUILT === "1" || process.env.E2E_ARTIFACT_REQUIRE_PREBUILT === "1") {
      throw new Error(`Strict prebuilt E2E artifact required but invalid: ${error.message}`);
    }
    console.warn(`E2E artifact absent/stale; rebuilding deterministically. Cause: ${error.message}`);
  }

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawnSync(npm, ["run", "e2e:artifact:build"], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (child.status !== 0) {
    throw new Error(`Automatic E2E artifact build failed with exit code ${child.status ?? "unknown"}.`);
  }
  verifyStamp();
}

const mode = process.argv[2];
if (mode === "write") writeStamp();
else if (mode === "verify") verifyStamp();
else if (mode === "ensure") ensureStamp();
else {
  console.error("Usage: node scripts/e2e-build-artifact.mjs <write|verify|ensure>");
  process.exit(2);
}
