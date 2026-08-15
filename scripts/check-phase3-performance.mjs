import fs from "node:fs";

const app = fs.readFileSync("src/App.jsx", "utf8");
const signature = fs.readFileSync("src/components/navigation/SignatureCanvas.jsx", "utf8");
const failures = [];

if (/^import\s+ProjectsShowcase\s+from\s+["']\.\/components\/ProjectsShowcase["'];/m.test(app)) {
  failures.push("ProjectsShowcase must not return to the static App import graph.");
}
if (!app.includes('const ProjectsShowcase = lazy(() => import("./components/ProjectsShowcase"));')) {
  failures.push("ProjectsShowcase must stay code-split with React.lazy.");
}
if (!app.includes('<Suspense fallback={<div className="section-skeleton">{t("app.routeLoading")}</div>}>')) {
  failures.push("The lazy projects section must keep an explicit Suspense fallback.");
}

const names = [
  "ACTIVE_FRAME_RATE_FULL",
  "ACTIVE_FRAME_RATE_BALANCED",
  "REST_FRAME_RATE_FULL",
  "REST_FRAME_RATE_BALANCED",
];

const rates = Object.fromEntries(names.map((name) => {
  const match = signature.match(new RegExp(`const ${name} = (\\d+);`));
  return [name, Number(match?.[1] ?? 0)];
}));

if (!rates.ACTIVE_FRAME_RATE_FULL
  || !rates.ACTIVE_FRAME_RATE_BALANCED
  || !rates.REST_FRAME_RATE_FULL
  || !rates.REST_FRAME_RATE_BALANCED) {
  failures.push("SignatureCanvas adaptive frame-rate constants are missing.");
} else {
  if (rates.REST_FRAME_RATE_FULL >= rates.ACTIVE_FRAME_RATE_FULL) {
    failures.push("Full-quality rest cadence must stay below active cadence.");
  }
  if (rates.REST_FRAME_RATE_BALANCED >= rates.ACTIVE_FRAME_RATE_BALANCED) {
    failures.push("Balanced rest cadence must stay below active cadence.");
  }
}

if (!signature.includes('["prepare", "shed", "assemble", "return"].includes(specialEvent.mode)')) {
  failures.push("SignatureCanvas must reserve high cadence for active transformation phases.");
}
if (!signature.includes("const targetFrameRate = highMotion")) {
  failures.push("SignatureCanvas adaptive cadence selection is missing.");
}

if (failures.length) {
  console.error("Phase 3 performance contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Phase 3 performance OK: ProjectsShowcase is lazy; SignatureCanvas active/rest FPS `
  + `${rates.ACTIVE_FRAME_RATE_FULL}/${rates.REST_FRAME_RATE_FULL} full, `
  + `${rates.ACTIVE_FRAME_RATE_BALANCED}/${rates.REST_FRAME_RATE_BALANCED} balanced.`,
);
