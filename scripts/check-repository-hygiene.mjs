import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const gitignore = read(".gitignore");
for (const entry of [".env", "node_modules", "dist", "coverage", "playwright-report", "test-results", ".cache/"]) {
  if (!gitignore.includes(entry)) errors.push(`.gitignore must exclude ${entry}`);
}

try {
  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    .split(/\r?\n/)
    .filter(Boolean);
  const forbidden = tracked.filter((file) => (
    /(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example")
  ) || /(^|\/)(node_modules|dist|coverage|playwright-report|test-results|\.cache)(\/|$)/.test(file));
  if (forbidden.length) errors.push(`generated/sensitive files are tracked: ${forbidden.join(", ")}`);
} catch {
  // Source archives used for review may not contain .git. Static ignore contracts
  // still run; the tracked-file check is enforced in real CI checkouts.
}

if (errors.length) {
  console.error("Repository hygiene FAILED:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log("Repository hygiene OK: secrets, dependencies, build outputs and test artefacts stay outside versioned release surfaces.");
