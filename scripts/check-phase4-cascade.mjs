import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const main = read("src/main.jsx");
const vendor = read("src/styles/vendor/mantine-layer.css");
const errors = [];

if (main.includes('import "@mantine/core/styles.css";')) errors.push("direct Mantine CSS import returned");
if (!main.includes('import "./styles/vendor/mantine-layer.css";')) errors.push("Mantine layer wrapper missing");
if (!vendor.includes('@import "@mantine/core/styles.css" layer(base);')) errors.push("Mantine not in base layer");

const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (absolute.endsWith(".css")) files.push(absolute);
  }
};
walk(path.join(root, "src"));

let important = 0;
let bytes = 0;
let layered = 0;
let priority = 0;
let critical = 0;
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  important += source.match(/!important\b/g)?.length ?? 0;
  bytes += Buffer.byteLength(source);
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (relative === "src/index.css") continue;
  if (relative === "src/styles/vendor/mantine-layer.css") continue;
  if (!source.startsWith("@layer base, priority, critical;")) errors.push(`${relative} outside final cascade layers`);
  else layered += 1;
  if (source.includes("@layer priority")) priority += 1;
  if (source.includes("@layer critical")) critical += 1;
}

if (important > 1500) errors.push(`!important ${important} > 1500`);
if (bytes > 765000) errors.push(`CSS ${bytes} > 765000`);
if (layered < 35) errors.push(`layered ${layered} < 35`);
if (priority < 20) errors.push(`priority files ${priority} < 20`);
if (critical < 20) errors.push(`critical files ${critical} < 20`);

if (errors.length) {
  console.error(`Final cascade contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Final cascade OK: ${important} !important, ${bytes} CSS bytes, ${layered} layered files, ${priority} priority files, ${critical} critical files.`);
