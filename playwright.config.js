import { defineConfig, devices } from "@playwright/test";
import { detectTestWorkerPolicy, formatTestWorkerPolicy } from "./scripts/test-worker-policy.mjs";

const port = 4173;
const workerPolicy = detectTestWorkerPolicy();
const usePrebuiltDist = process.env.PLAYWRIGHT_PREBUILT === "1";
const serverCommand = usePrebuiltDist
  ? `npm run preview -- --host 127.0.0.1 --port ${port}`
  : `npm run build && npm run preview -- --host 127.0.0.1 --port ${port}`;

console.log(`[playwright] ${formatTestWorkerPolicy(workerPolicy)}`);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  failOnFlakyTests: Boolean(process.env.CI),
  retries: 0,
  workers: workerPolicy.workers,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: serverCommand,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      VITE_ANALYTICS_DISABLED: "true",
      VITE_E2E_RUNTIME_QUALITY: "constrained",
      VITE_PUBLIC_SITE_URL: process.env.VITE_PUBLIC_SITE_URL ?? `http://127.0.0.1:${port}`,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
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
