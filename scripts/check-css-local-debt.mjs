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
  totalBytes: 765_000,
  totalImportant: 1_500,
  files: {
    "src/styles/navigation/premium-navigation-v2.css": { bytes: 212_000, important: 600 },
    "src/styles/sections/profile-ios-v49.css": { bytes: 80_000, important: 300 },
    "src/styles/sections/timeline-legacy-optimized.css": { bytes: 4_000, important: 12 },
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
