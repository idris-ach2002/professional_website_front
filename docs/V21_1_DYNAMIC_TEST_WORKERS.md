# V21.1 — Dynamic Playwright workers

## Why

The previous E2E scripts hard-coded one worker for responsive/stability suites and the Playwright config defaulted to two workers. This was conservative while tests were being stabilized, but it unnecessarily underused developer machines.

## Policy

`os.availableParallelism()` provides the process-visible logical CPU budget. The policy combines it with total RAM and caps browser concurrency at 8 workers.

Typical CPU mapping before the RAM safeguard:

- 1–2 logical CPUs → 1 worker
- 3–4 → 2 workers
- 5–6 → 3 workers
- 7–8 → 4 workers
- 9–12 → 6 workers
- 13+ → 8 workers

`PLAYWRIGHT_WORKERS` remains an explicit override. `PLAYWRIGHT_WORKER_CAP` can lower the automatic cap.

Web Vitals intentionally remains `--workers=1`: concurrent browsers would contaminate performance measurements.

Run `npm run test:workers` to see the detected CPU, architecture, RAM and chosen worker count.

## Stability test fix

The shared E2E fixture previously returned an empty Timeline experience list, while the V21 stability scenario expected `.timeline-row`. The fixture now includes three representative Timeline entries and the stability scenario explicitly waits for the first card to attach before scrolling it into view.
