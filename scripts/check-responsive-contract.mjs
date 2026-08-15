import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const errors = [];

const indexHtml = read("index.html");
const app = read("src/App.jsx");
const facade = read("src/index.css");
const responsiveSpec = read("e2e/responsive.spec.js");
const packageJson = JSON.parse(read("package.json"));

if (!indexHtml.includes("viewport-fit=cover")) errors.push("index.html must enable viewport-fit=cover.");
if (!app.includes("<ViewportStability />")) errors.push("ViewportStability must be mounted once in App.");
if (!facade.trimEnd().endsWith('@import "./styles/responsive/company-responsive.css";')) {
  errors.push("company-responsive.css must be the final global stylesheet.");
}

const expectedViewports = [
  "360x800",
  "390x844",
  "430x932",
  "768x1024",
  "820x1180",
  "966x768",
  "1024x768",
  "1366x768",
  "1920x1080",
];
for (const viewport of expectedViewports) {
  if (!responsiveSpec.includes(`name: \"${viewport}\"`)) errors.push(`Responsive matrix missing ${viewport}.`);
}

for (const script of ["check:responsive", "test:e2e:responsive"]) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing npm script ${script}.`);
}

if (errors.length) {
  console.error(`Responsive contract failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Responsive contract OK: ${expectedViewports.length} viewports, visual viewport controller and safe-area support.`);
