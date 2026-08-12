import assert from "node:assert/strict";
import os from "node:os";

function positiveInteger(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function cpuWorkerBudget(parallelism) {
  if (parallelism <= 2) return 1;
  if (parallelism <= 4) return 2;
  if (parallelism <= 6) return 3;
  if (parallelism <= 8) return 4;
  if (parallelism <= 12) return 6;
  return 8;
}

export function memoryWorkerBudget(totalMemoryGiB) {
  // Reserve ~2 GiB for OS + preview server and ~1.25 GiB per browser worker.
  return Math.max(1, Math.min(8, Math.floor((totalMemoryGiB - 2) / 1.25)));
}

export function resolveWorkerBudget({
  parallelism,
  totalMemoryGiB,
  explicitWorkers = null,
  explicitCap = 8,
}) {
  const detectedWorkers = Math.max(
    1,
    Math.min(
      cpuWorkerBudget(parallelism),
      memoryWorkerBudget(totalMemoryGiB),
      explicitCap,
    ),
  );

  return {
    workers: explicitWorkers ?? detectedWorkers,
    detectedWorkers,
    cpuBudget: cpuWorkerBudget(parallelism),
    memoryBudget: memoryWorkerBudget(totalMemoryGiB),
    source: explicitWorkers ? "PLAYWRIGHT_WORKERS" : "hardware-policy",
  };
}

export function detectTestWorkerPolicy(env = process.env) {
  const processor = os.cpus()?.[0]?.model?.trim() || "unknown CPU";
  const architecture = os.arch();
  const availableParallelism = typeof os.availableParallelism === "function"
    ? os.availableParallelism()
    : Math.max(1, os.cpus()?.length || 1);
  const totalMemoryGiB = os.totalmem() / (1024 ** 3);
  const explicitWorkers = positiveInteger(env.PLAYWRIGHT_WORKERS);
  const explicitCap = positiveInteger(env.PLAYWRIGHT_WORKER_CAP) ?? 8;
  const budget = resolveWorkerBudget({
    parallelism: availableParallelism,
    totalMemoryGiB,
    explicitWorkers,
    explicitCap,
  });

  return {
    processor,
    architecture,
    availableParallelism,
    totalMemoryGiB,
    ...budget,
  };
}


export function assertTestWorkerEnvironment(policy, env = process.env) {
  if (env.PLAYWRIGHT_STRESS !== "1") return;
  const errors = [];
  const requiredMemoryGiB = 2 + policy.workers * 1.25;

  if (policy.workers < 2) {
    errors.push(`stress concurrency requires at least 2 workers; got ${policy.workers}`);
  }
  if (policy.workers > policy.availableParallelism) {
    errors.push(
      `stress concurrency must not oversubscribe logical CPUs; workers=${policy.workers}, CPUs=${policy.availableParallelism}`,
    );
  }
  if (policy.totalMemoryGiB < requiredMemoryGiB) {
    errors.push(
      `stress concurrency requires >=${requiredMemoryGiB.toFixed(1)} GiB RAM for ${policy.workers} workers; `
        + `got ${policy.totalMemoryGiB.toFixed(1)}`,
    );
  }
  if (policy.source !== "PLAYWRIGHT_WORKERS") {
    errors.push("stress concurrency must declare PLAYWRIGHT_WORKERS explicitly");
  }
  if (errors.length) throw new Error(`Concurrency environment precondition failed: ${errors.join("; ")}`);
}

export function formatTestWorkerPolicy(policy) {
  return [
    `${policy.processor} (${policy.architecture})`,
    `${policy.availableParallelism} logical CPUs available`,
    `${policy.totalMemoryGiB.toFixed(1)} GiB RAM`,
    `${policy.workers} Playwright worker${policy.workers > 1 ? "s" : ""}`,
    `cpuBudget=${policy.cpuBudget}`,
    `memoryBudget=${policy.memoryBudget}`,
    `source=${policy.source}`,
  ].join(" | ");
}

function selfTest() {
  assert.equal(cpuWorkerBudget(4), 2);
  assert.equal(cpuWorkerBudget(20), 8);
  assert.equal(memoryWorkerBudget(4), 1);
  assert.equal(memoryWorkerBudget(16), 8);
  assert.deepEqual(
    resolveWorkerBudget({ parallelism: 4, totalMemoryGiB: 16, explicitCap: 8 }),
    { workers: 2, detectedWorkers: 2, cpuBudget: 2, memoryBudget: 8, source: "hardware-policy" },
  );
  assert.equal(
    resolveWorkerBudget({ parallelism: 4, totalMemoryGiB: 16, explicitWorkers: 4 }).workers,
    4,
  );
  assert.doesNotThrow(() => assertTestWorkerEnvironment({
    availableParallelism: 4, totalMemoryGiB: 16, workers: 4, source: "PLAYWRIGHT_WORKERS",
  }, { PLAYWRIGHT_STRESS: "1" }));
  assert.doesNotThrow(() => assertTestWorkerEnvironment({
    availableParallelism: 2, totalMemoryGiB: 8, workers: 2, source: "PLAYWRIGHT_WORKERS",
  }, { PLAYWRIGHT_STRESS: "1" }));
  assert.throws(() => assertTestWorkerEnvironment({
    availableParallelism: 2, totalMemoryGiB: 8, workers: 4, source: "PLAYWRIGHT_WORKERS",
  }, { PLAYWRIGHT_STRESS: "1" }));
  assert.throws(() => assertTestWorkerEnvironment({
    availableParallelism: 4, totalMemoryGiB: 16, workers: 1, source: "PLAYWRIGHT_WORKERS",
  }, { PLAYWRIGHT_STRESS: "1" }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  selfTest();
  const policy = detectTestWorkerPolicy();
  assertTestWorkerEnvironment(policy);
  console.log(`Worker policy contract OK: ${formatTestWorkerPolicy(policy)}`);
}
