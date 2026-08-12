import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = path.join(root, ".github/workflows/ci-cd.yml");
const KNOWN_LEGACY_HASHES = new Set([
  // Frontend CI/CD workflow present in the 2026-08-12 source archive.
  "bf906c2c713353b7d273ae7c387257d7868309ba44ff1bd316d92756ccc3cb7d",
]);
const RETIRED_MARKER = "# RETIRED_FRONTEND_CI_TOMBSTONE_V3";

function sha256(source) {
  return crypto.createHash("sha256").update(source).digest("hex");
}

if (!fs.existsSync(legacyPath)) {
  console.log("CI migration OK: no legacy ci-cd.yml workflow to retire.");
  process.exit(0);
}

const source = fs.readFileSync(legacyPath, "utf8");
const normalizedSource = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
const digest = sha256(normalizedSource);
const known = KNOWN_LEGACY_HASHES.has(digest) || source.includes(RETIRED_MARKER);

if (!known) {
  throw new Error(
    "CI migration refused: .github/workflows/ci-cd.yml still exists but its contents are not the known legacy workflow. "
      + "Refusing to delete unknown CI logic. Migrate it into frontend-ci.yml or remove it explicitly, then rerun.",
  );
}

fs.rmSync(legacyPath);
console.log(`CI migration OK: retired legacy .github/workflows/ci-cd.yml (${digest.slice(0, 12)}).`);
