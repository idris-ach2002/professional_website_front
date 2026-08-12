import process from "node:process";
import { spawnSync } from "node:child_process";

const REQUIRED_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 16;
const REQUIRED_NPM_MAJOR = 10;
const MIN_NPM_MINOR = 9;

function parseVersion(value) {
  const match = String(value ?? "").match(/^(?:v)?(\d+)\.(\d+)\.(\d+)/);
  return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null;
}

function npmVersionFromEnvironment(env = process.env) {
  const userAgent = env.npm_config_user_agent ?? "";
  const match = userAgent.match(/(?:^|\s)npm\/(\d+\.\d+\.\d+)/);
  if (match?.[1]) return match[1];

  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(executable, ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  return String(result.stdout ?? "").trim() || null;
}

export function validateRuntimeEnvironment({
  nodeVersion = process.versions.node,
  npmVersion = npmVersionFromEnvironment(),
} = {}) {
  const errors = [];
  const node = parseVersion(nodeVersion);
  if (!node || node.major !== REQUIRED_NODE_MAJOR || node.minor < MIN_NODE_MINOR) {
    errors.push(`Node ${nodeVersion ?? "unknown"} hors contrat; attendu Node 22.${MIN_NODE_MINOR}+ (<23), .nvmrc=22.16.0.`);
  }

  if (!npmVersion) {
    errors.push("npm introuvable; le contrat CI requiert npm 10.9+ (<11).");
  } else {
    const npm = parseVersion(npmVersion);
    if (!npm || npm.major !== REQUIRED_NPM_MAJOR || npm.minor < MIN_NPM_MINOR) {
      errors.push(`npm ${npmVersion} hors contrat; attendu npm 10.${MIN_NPM_MINOR}+ (<11), packageManager=npm@10.9.2.`);
    }
  }

  return errors;
}

export function assertRuntimeEnvironment(options = {}) {
  const errors = validateRuntimeEnvironment(options);
  if (errors.length === 0) return;
  throw new Error(
    `Précondition d'environnement CI violée:\n- ${errors.join("\n- ")}\n`
      + "Utilise `nvm install 22.16.0 && nvm use 22.16.0`, puis relance `npm ci`.",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertRuntimeEnvironment();
  console.log(`Runtime environment OK: Node ${process.versions.node}, npm ${npmVersionFromEnvironment() ?? "non détecté"}.`);
}
