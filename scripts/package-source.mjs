import path from "node:path";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, process.argv[2] ?? ".cache/professional-website-front-source.zip");
fs.mkdirSync(path.dirname(output), { recursive: true });

try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["archive", "--format=zip", `--output=${output}`, "HEAD"], { cwd: root, stdio: "inherit" });
  console.log(`Source archive created from tracked HEAD only: ${output}`);
} catch (error) {
  console.error("Source packaging FAILED: run this command from a Git checkout.");
  process.exit(error?.status || 1);
}
