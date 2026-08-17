import { defineConfig, devices } from "@playwright/test";
import { assertRuntimeEnvironment } from "./scripts/check-runtime-env.mjs";
import {
  assertTestWorkerEnvironment,
  detectTestWorkerPolicy,
  formatTestWorkerPolicy,
} from "./scripts/test-worker-policy.mjs";

assertRuntimeEnvironment();

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const port = 4173;
const workerPolicy = detectTestWorkerPolicy();
assertTestWorkerEnvironment(workerPolicy);
const usePrebuiltDist = process.env.PLAYWRIGHT_PREBUILT === "1";
const stressMode = process.env.PLAYWRIGHT_STRESS === "1";
const soakMode = process.env.PLAYWRIGHT_SOAK === "1";
const metricsMode = process.env.PLAYWRIGHT_METRICS === "1";
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const previewCommand = `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`;
const artifactCommand = usePrebuiltDist
  ? "node scripts/e2e-build-artifact.mjs verify"
  : "node scripts/e2e-build-artifact.mjs ensure";
const serverCommand = `${artifactCommand} && ${previewCommand}`;

console.log(`[playwright] ${formatTestWorkerPolicy(workerPolicy)}`);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  failOnFlakyTests: Boolean(process.env.CI),
  retries: 0,
  workers: workerPolicy.workers,
  timeout: process.env.CI ? 75_000 : 60_000,
  expect: {
    timeout: process.env.CI ? 15_000 : 10_000,
  },
  reporter: isGitHubActions
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    actionTimeout: process.env.CI ? 15_000 : 10_000,
    navigationTimeout: process.env.CI ? 25_000 : 15_000,
    baseURL: `http://127.0.0.1:${port}`,
    trace: metricsMode || soakMode ? "off" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: stressMode || soakMode || metricsMode ? "off" : "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: serverCommand,
    url: `http://127.0.0.1:${port}`,
    // Strict prebuilt runs must never attach to a stale server. Developer runs
    // may reuse their own preview only when artifact freshness is not asserted.
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          ...(chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {}),
          args: [
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ],
        },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
