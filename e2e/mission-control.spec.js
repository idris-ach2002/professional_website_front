import { expect, test } from "./support/test-fixtures";

const snapshot = {
  generatedAt: "2026-08-13T12:00:00Z",
  status: "operational",
  database: { reachable: true, latencyMs: 4, engine: "PostgreSQL" },
  system: {
    operatingSystem: { name: "Linux", version: "6.8", architecture: "amd64", logicalProcessors: 20, cpuModel: "12th Gen Intel Core i7-12650HX" },
    cpu: { systemLoadPercent: 22, processLoadPercent: 7, loadAverage: 1.4, processCpuTimeNanos: 1200000 },
    memory: { physicalTotalBytes: 16428249907, physicalUsedBytes: 6979321856, physicalFreeBytes: 9448928051, swapTotalBytes: 2147483648, swapUsedBytes: 0, heapUsedBytes: 188743680, heapCommittedBytes: 536870912, heapMaxBytes: 2147483648, nonHeapUsedBytes: 73400320 },
    storage: { totalBytes: 512000000000, usedBytes: 198000000000, usableBytes: 314000000000, fileSystem: "ext4" },
    javaRuntime: { version: "21", vendor: "Eclipse Adoptium", virtualMachine: "OpenJDK 64-Bit Server VM", uptimeMs: 820000, startedAtEpochMs: 1786620000000 },
  },
  caches: [{ name: "website", hits: 45, misses: 5, hitRate: .9, estimatedSize: 3 }],
  analyticsQueue: { queued: 8, capacity: 512, remaining: 504, saturationPercent: 1.56 },
  jobs: { QUEUED: 0, RUNNING: 1, SUCCEEDED: 12, FAILED: 0, RETRYING: 0, CANCELLED: 0 },
  outbox: { PENDING: 0, PROCESSING: 1, DISPATCHED: 20, DEAD: 0 },
  publications: { DRAFT: 1, READY: 0, SCHEDULED: 0, PUBLISHING: 1, PUBLISHED: 2, SUPERSEDED: 0, FAILED: 0 },
  recentEvents: [{ id: "evt-1", type: "WEBSITE_PUBLISHED", state: "DISPATCHED", occurredAt: "2026-08-13T12:00:00Z" }],
  architecture: [
    { id: "browser", label: "Browser", layer: "client", status: "operational", technology: "Web APIs", activity: 1 },
    { id: "react", label: "React Runtime", layer: "client", status: "operational", technology: "React 19", activity: 1 },
    { id: "api", label: "Spring API", layer: "application", status: "operational", technology: "Spring Boot 4", activity: 1 },
    { id: "cache", label: "Cache", layer: "data", status: "active", technology: "Caffeine", activity: .9 },
    { id: "postgres", label: "Database", layer: "data", status: "operational", technology: "PostgreSQL", activity: .8 },
    { id: "outbox", label: "Event Outbox", layer: "event", status: "active", technology: "Transactional Outbox", activity: .7 },
    { id: "jobs", label: "Async Jobs", layer: "worker", status: "active", technology: "Spring Scheduler", activity: .6 },
  ],
  links: [
    { source: "browser", target: "react", channel: "navigation", active: true },
    { source: "react", target: "api", channel: "https/json", active: true },
    { source: "api", target: "postgres", channel: "jdbc", active: true },
    { source: "postgres", target: "outbox", channel: "transaction", active: true },
    { source: "outbox", target: "jobs", channel: "dispatch", active: true },
  ],
};

async function mockMissionApis(page) {
  await page.route("**/api/engineering/mission-control", (route) => route.fulfill({
    headers: { "Content-Type": "application/json", "Server-Timing": "spring;dur=8;desc=MissionControlService, postgres;dur=4;desc=PostgreSQL", "X-Portfolio-Trace": "Spring Security FilterChain>DispatcherServlet>EngineeringMissionControlController>MissionControlService>DataSource>PostgreSQL JDBC>CacheManager>Caffeine>BackgroundJobRepository>OutboxEventRepository>WebsiteVersionRepository>Jackson" },
    json: snapshot,
  }));
  await page.route("**/api/engineering/mission-control/queue**", (route) => {
    const url = new URL(route.request().url());
    const kind = url.searchParams.get("kind") ?? "analytics";
    const pageIndex = Number(url.searchParams.get("page") ?? 0);
    const totalElements = kind === "analytics" ? 8 : kind === "jobs" ? 1000 : 18;
    const totalPages = Math.ceil(totalElements / 10);
    return route.fulfill({ json: {
      kind, page: pageIndex, size: 10, totalElements, totalPages,
      capacity: kind === "analytics" ? 512 : null, queued: totalElements,
      saturationPercent: kind === "analytics" ? 1.56 : null,
      items: totalElements ? [{ id: `${kind}-${pageIndex}-1`, type: kind === "jobs" ? "PUBLISH" : "PAGE_VIEW", status: "QUEUED", progress: null, attempts: 0, maxAttempts: 3, createdAt: "2026-08-13T12:00:00Z" }] : [],
    } });
  });
  await page.route("**/api/engineering/performance/history**", (route) => route.fulfill({ json: { builds: [{ buildId: "lot3", sampleCount: 25, averageFps: 119.2, averageFrameP95Ms: 8.4, averageWorkerLatencyMs: 2.1, averageApiLatencyMs: 18.2, maximumActiveResources: 12, lastRecordedAt: "2026-08-13T12:00:00Z" }], recentSamples: [] } }));
  await page.route("**/api/engineering/performance/samples", (route) => route.fulfill({ status: 201, json: {} }));
}

test("@mission affiche les trois vues Architecture et calcule puis fige la topologie", async ({ page }) => {
  await mockMissionApis(page);
  await page.goto("/engineering", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Architecture technique du portfolio" })).toBeVisible();
  await expect(page.getByRole("button", { name: /System/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Live Trace/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Performance/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Impact/i })).toHaveCount(0);

  await expect(page.getByLabel("Graphe exploratoire de l’architecture réelle du portfolio")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Architecture vivante du portfolio" })).toBeVisible();
  await expect(page.locator("#architecture-system-stage > canvas.architecture-webgl")).toBeVisible();
  await expect(page.locator("#architecture-system-stage > canvas.architecture-webgl")).toHaveCSS("background-color", "rgb(92, 107, 99)");
  await expect(page.locator(".architecture-layout-status")).toContainText("CPU layout libéré");
  await expect(page.locator(".architecture-community.is-front strong")).toHaveText("professional_website_front");
  await expect(page.locator(".architecture-community.is-back strong")).toHaveText("professional_website");
  await page.getByRole("button", { name: /Spring Boot 4.*Déplacer le nœud/i }).click();
  await expect(page.getByRole("dialog", { name: /Détails Spring Boot 4/i })).toBeVisible();

  await page.getByRole("button", { name: /Live Trace/i }).click();
  await expect(page.getByRole("heading", { name: "Exécution d’une requête de bout en bout" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Diagramme d’état animé/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /Waterfall full-stack/i })).toBeVisible();

  await page.getByRole("button", { name: /Performance/i }).click();
  await expect(page.getByRole("heading", { name: "Performance de l’architecture en temps réel" })).toBeVisible();
  await expect(page.locator("figure.live-profiler")).toBeVisible();
  await expect(page.getByRole("img", { name: /Profiler live multi-pistes du navigateur/i })).toBeVisible();
});

test("@mission reste utilisable sans débordement sur mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockMissionApis(page);
  await page.goto("/engineering", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Architecture technique du portfolio" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Architecture mobile synthétique" })).toBeVisible();
  await expect(page.locator("#architecture-system-stage")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Explorer le graphe/i })).toBeVisible();

  await page.getByRole("button", { name: /Explorer le graphe/i }).click();
  await expect(page.locator("#architecture-system-stage")).toBeVisible();
  await expect(page.getByText("Graphe complet", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /React 19.*Déplacer le nœud/i }).click();
  const reactDialog = page.getByRole("dialog", { name: /Détails React 19/i });
  await expect(reactDialog).toBeVisible();
  await expect(reactDialog.getByText("Budget UI")).toBeVisible();
  await expect(reactDialog.getByText("< 20 ms")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
