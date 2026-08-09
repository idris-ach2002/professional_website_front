import os from "node:os";

function positiveInteger(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function cpuWorkerBudget(parallelism) {
  if (parallelism <= 2) return 1;
  if (parallelism <= 4) return 2;
  if (parallelism <= 6) return 3;
  if (parallelism <= 8) return 4;
  if (parallelism <= 12) return 6;
  return 8;
}

function memoryWorkerBudget(totalMemoryGiB) {
  // Keep ~2 GiB for the OS/dev server and reserve ~1.25 GiB per browser worker.
  return Math.max(1, Math.min(8, Math.floor((totalMemoryGiB - 2) / 1.25)));
}

export function detectTestWorkerPolicy(env = process.env) {
  const processor = os.cpus()?.[0]?.model?.trim() || "unknown CPU";
  const architecture = os.arch();
  const availableParallelism = typeof os.availableParallelism === "function"
    ? os.availableParallelism()
    : Math.max(1, os.cpus()?.length || 1);
  const totalMemoryGiB = os.totalmem() / (1024 ** 3);

  const explicitWorkers = positiveInteger(env.PLAYWRIGHT_WORKERS);
  const explicitCap = positiveInteger(env.PLAYWRIGHT_WORKER_CAP);

  const detectedWorkers = Math.max(
    1,
    Math.min(
      cpuWorkerBudget(availableParallelism),
      memoryWorkerBudget(totalMemoryGiB),
      explicitCap ?? 8,
    ),
  );

  const workers = explicitWorkers ?? detectedWorkers;

  return {
    processor,
    architecture,
    availableParallelism,
    totalMemoryGiB,
    workers,
    source: explicitWorkers ? "PLAYWRIGHT_WORKERS" : "hardware-policy",
  };
}

export function formatTestWorkerPolicy(policy) {
  return [
    `${policy.processor} (${policy.architecture})`,
    `${policy.availableParallelism} logical CPUs available`,
    `${policy.totalMemoryGiB.toFixed(1)} GiB RAM`,
    `${policy.workers} Playwright worker${policy.workers > 1 ? "s" : ""}`,
    `source=${policy.source}`,
  ].join(" | ");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const policy = detectTestWorkerPolicy();
  console.log(`Playwright worker policy: ${formatTestWorkerPolicy(policy)}`);
}
