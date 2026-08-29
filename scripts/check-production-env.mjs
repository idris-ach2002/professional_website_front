import process from "node:process";

const forbidden = [
  ["E2E_HERMETIC_BUILD", "1"],
  ["VITE_E2E_RUNTIME_QUALITY", "constrained"],
  ["VITE_ANALYTICS_DISABLED", "true"],
  ["PLAYWRIGHT_PREBUILT", "1"],
];

const violations = forbidden
  .filter(([key, value]) => String(process.env[key] ?? "").toLowerCase() === value)
  .map(([key, value]) => `${key}=${value}`);

if (violations.length) {
  throw new Error(
    `Production build precondition violated: E2E-only environment leaked into deploy: ${violations.join(", ")}.`,
  );
}

const required = ["PUBLIC_API_BASE_URL", "VITE_API_BASE_URL", "VITE_PUBLIC_SITE_URL"];
const missing = required.filter((key) => !String(process.env[key] ?? "").trim());
if (missing.length) {
  throw new Error(`Production build precondition violated: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
}

if (process.env.STATIC_SNAPSHOT_REQUIRED !== "true") {
  throw new Error("Production build precondition violated: STATIC_SNAPSHOT_REQUIRED=true is required for deployable snapshots.");
}

console.log("Production build environment OK: no E2E profile leakage, production URLs are configured and static snapshots are required.");
