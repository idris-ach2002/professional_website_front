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

if (!process.env.PUBLIC_API_BASE_URL) {
  throw new Error("Production build precondition violated: PUBLIC_API_BASE_URL is required.");
}

console.log("Production build environment OK: no E2E profile leakage and PUBLIC_API_BASE_URL is configured.");
