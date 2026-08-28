import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");

function walk(directory, out = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (absolute.endsWith(".css")) out.push(absolute);
  }
  return out;
}

const files = walk(src);
const rows = files.map((file) => {
  const source = fs.readFileSync(file, "utf8");
  return {
    file: path.relative(root, file).replaceAll(path.sep, "/"),
    bytes: Buffer.byteLength(source),
    important: source.match(/!important\b/g)?.length ?? 0,
  };
});

const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
const totalImportant = rows.reduce((sum, row) => sum + row.important, 0);

const budgets = {
  totalBytes: 575_000,
  totalImportant: 930,
  files: {
    "src/styles/navigation/premium-navigation-v2.css": { bytes: 180_000, important: 580 },
    "src/styles/sections/profile-arctic-ink.css": { bytes: 20_000, important: 12 },
    "src/styles/sections/timeline-legacy-optimized.css": { bytes: 4_000, important: 12 },
    "src/styles/sections/timeline-mission-ui.css": { bytes: 12_000, important: 0 },
    "src/styles/pages/mission-control.css": { bytes: 87_000, important: 10 },
    "src/styles/pages/architecture-app-mode.css": { bytes: 9_000, important: 0 },
    "src/styles/pages/recruiter-app-mode.css": { bytes: 8_000, important: 0 },
  },
};

const failures = [];
if (totalBytes > budgets.totalBytes) failures.push(`CSS total ${totalBytes} B > budget ${budgets.totalBytes} B`);
if (totalImportant > budgets.totalImportant) failures.push(`!important total ${totalImportant} > budget ${budgets.totalImportant}`);

for (const [file, budget] of Object.entries(budgets.files)) {
  const row = rows.find((item) => item.file === file);
  if (!row) {
    failures.push(`${file} introuvable`);
    continue;
  }
  if (row.bytes > budget.bytes) failures.push(`${file}: ${row.bytes} B > budget ${budget.bytes} B`);
  if (row.important > budget.important) failures.push(`${file}: ${row.important} !important > budget ${budget.important}`);
}

if (failures.length) {
  console.error("Local CSS debt budget failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Local CSS debt OK: ${files.length} files, ${totalBytes} bytes, ${totalImportant} !important.`);
for (const file of Object.keys(budgets.files)) {
  const row = rows.find((item) => item.file === file);
  console.log(`  ${file}: ${row.bytes} bytes, ${row.important} !important`);
}
