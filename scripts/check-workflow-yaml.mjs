import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowDir = path.join(root, ".github/workflows");
const files = fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/.test(name)).sort();
const errors = [];
let authoritative = null;

if (files.length !== 1 || files[0] !== "frontend-ci.yml") {
  errors.push(`un seul workflow actif est autorisé; trouvé: ${files.join(", ") || "aucun"}`);
}

for (const file of files) {
  const source = fs.readFileSync(path.join(workflowDir, file), "utf8");
  let document;
  try {
    const loadYaml = yaml.load ?? yaml.default?.load;
    if (typeof loadYaml !== "function") {
      throw new TypeError("js-yaml does not expose a load() parser.");
    }
    document = loadYaml(source);
  } catch (error) {
    errors.push(`${file}: YAML invalide: ${error.message}`);
    continue;
  }
  if (!document || typeof document !== "object") {
    errors.push(`${file}: le workflow doit être un document YAML objet.`);
    continue;
  }
  if (!document.name) errors.push(`${file}: name manquant.`);
  if (!("on" in document)) errors.push(`${file}: déclencheur on manquant.`);
  if (!document.jobs || typeof document.jobs !== "object") errors.push(`${file}: jobs manquant.`);
  if (file === "frontend-ci.yml") authoritative = document;
}

if (authoritative) {
  const globalEnv = authoritative.env ?? {};
  for (const forbidden of ["VITE_E2E_RUNTIME_QUALITY", "VITE_ANALYTICS_DISABLED", "PLAYWRIGHT_PREBUILT"]) {
    if (forbidden in globalEnv) {
      errors.push(`frontend-ci.yml: ${forbidden} ne doit jamais être global; le job deploy ne doit pas hériter du profil E2E.`);
    }
  }

  const jobs = authoritative.jobs ?? {};
  for (const required of ["quality", "browser-contracts", "responsive", "concurrency-contract", "vitals", "main-thread", "verify", "soak", "deploy"]) {
    if (!jobs[required]) errors.push(`frontend-ci.yml: job requis manquant: ${required}.`);
  }

  for (const jobName of ["browser-contracts", "responsive", "concurrency-contract", "vitals", "main-thread", "soak"]) {
    const env = jobs[jobName]?.env ?? {};
    if (env.PLAYWRIGHT_PREBUILT !== "1") errors.push(`${jobName}: PLAYWRIGHT_PREBUILT=1 requis.`);
    if (env.E2E_ARTIFACT_REQUIRE_PREBUILT !== "1") errors.push(`${jobName}: E2E_ARTIFACT_REQUIRE_PREBUILT=1 requis.`);
  }

  for (const jobName of ["browser-contracts", "responsive"]) {
    const env = jobs[jobName]?.env ?? {};
    if (env.PLAYWRIGHT_WORKER_CAP !== "2") {
      errors.push(`${jobName}: PLAYWRIGHT_WORKER_CAP=2 requis pour laisser la politique CPU/RAM choisir 1 ou 2 workers.`);
    }
    if ("PLAYWRIGHT_WORKERS" in env) {
      errors.push(`${jobName}: PLAYWRIGHT_WORKERS ne doit pas forcer le parallélisme normal.`);
    }
  }

  const concurrencyEnv = jobs["concurrency-contract"]?.env ?? {};
  if (concurrencyEnv.PLAYWRIGHT_WORKERS !== "2") {
    errors.push(`concurrency-contract: PLAYWRIGHT_WORKERS=2 requis pour rester portable sur les runners Linux privés standard; reçu ${String(concurrencyEnv.PLAYWRIGHT_WORKERS)}.`);
  }
  const concurrencySteps = jobs["concurrency-contract"]?.steps ?? [];
  if (!concurrencySteps.some((step) => step?.run === "npm run ci:concurrency:hosted")) {
    errors.push("concurrency-contract: la gate GitHub doit exécuter ci:concurrency:hosted.");
  }

  const mainThreadEnv = jobs["main-thread"]?.env ?? {};
  if (mainThreadEnv.PLAYWRIGHT_WORKERS !== "1") {
    errors.push(`main-thread: PLAYWRIGHT_WORKERS=1 requis; reçu ${String(mainThreadEnv.PLAYWRIGHT_WORKERS)}.`);
  }
  const mainThreadSteps = jobs["main-thread"]?.steps ?? [];
  if (!mainThreadSteps.some((step) => step?.run === "npm run test:e2e:main-thread")) {
    errors.push("main-thread: la gate GitHub doit exécuter test:e2e:main-thread.");
  }

  const verifyNeeds = jobs.verify?.needs;
  const verifyNeedsList = Array.isArray(verifyNeeds) ? verifyNeeds : [verifyNeeds].filter(Boolean);
  if (!verifyNeedsList.includes("main-thread")) {
    errors.push(`verify: doit dépendre du Main Thread Laboratory; reçu ${JSON.stringify(verifyNeeds)}.`);
  }

  const soakEnv = jobs.soak?.env ?? {};
  const expectedSoakEnv = {
    PLAYWRIGHT_WORKERS: "1",
    SOAK_DURATION_MS: "60000",
    SOAK_HEARTBEAT_MS: "5000",
    SOAK_STRUCTURE_EVERY: "3",
  };
  for (const [key, expected] of Object.entries(expectedSoakEnv)) {
    if (soakEnv[key] !== expected) errors.push(`soak: ${key}=${expected} requis; reçu ${String(soakEnv[key])}.`);
  }


  const soakIf = jobs.soak?.if ?? "";
  if (soakIf !== "github.event_name == 'workflow_dispatch'") {
    errors.push(`soak: doit être un diagnostic manuel via workflow_dispatch; reçu ${String(soakIf)}.`);
  }

  const deployNeeds = jobs.deploy?.needs;
  const deployNeedsList = Array.isArray(deployNeeds) ? deployNeeds : [deployNeeds].filter(Boolean);
  if (deployNeedsList.length !== 1 || deployNeedsList[0] !== "verify") {
    errors.push(`deploy: doit dépendre uniquement de verify; reçu ${JSON.stringify(deployNeeds)}.`);
  }
  const deployEnv = jobs.deploy?.env ?? {};
  const deploySteps = jobs.deploy?.steps ?? [];
  if (!deploySteps.some((step) => step?.run === "npm run check:production-env")) {
    errors.push("deploy: check:production-env doit précéder le build de production.");
  }
  for (const forbidden of ["VITE_E2E_RUNTIME_QUALITY", "VITE_ANALYTICS_DISABLED", "PLAYWRIGHT_PREBUILT", "E2E_HERMETIC_BUILD"]) {
    if (forbidden in deployEnv) errors.push(`deploy: variable E2E interdite: ${forbidden}.`);
  }
}

if (errors.length) {
  console.error("GitHub Actions workflow contract failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`GitHub Actions YAML OK: ${files[0]} is syntactically valid and production is isolated from the E2E build profile.`);
