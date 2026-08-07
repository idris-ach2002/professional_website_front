import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const legacyPaths = [
  "public/assets/mock",
  "public/white_dragon.png",
];

let removed = 0;
for (const relativePath of legacyPaths) {
  const absolutePath = resolve(relativePath);
  if (!existsSync(absolutePath)) continue;
  rmSync(absolutePath, { recursive: true, force: true });
  removed += 1;
  console.log(`Removed legacy public asset: ${relativePath}`);
}

if (removed === 0) {
  console.log("Legacy public asset cleanup OK: nothing to remove.");
}
