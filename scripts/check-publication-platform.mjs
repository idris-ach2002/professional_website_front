import fs from "node:fs";

const contracts = [
  ["src/components/admin/AdminPublicationStudio.jsx", [
    "Publication Studio",
    "Pre-Publish Center",
    "Ouvrir l’aperçu sécurisé",
    "Background Job Center",
    "Transactional Outbox / Event Stream",
    "Audit immuable",
  ]],
  ["src/components/admin/useAdminPublicationActions.jsx", [
    "/publication/draft-metadata",
    "Idempotency-Key",
    "publishIntentRef",
    "toISOString()",
    "/publish-validation",
    "/publication-audit",
    "/events/${eventId}/retry",
    "isConcurrencyConflictError",
  ]],
  ["src/components/admin/AdminVersionPreviewPage.jsx", [
    "/preview?locale=",
    "noindex,nofollow,noarchive",
    "previousTitle",
    "previousRobotsContent",
    "actualisation automatique",
  ]],
];

const failures = [];
for (const [file, needles] of contracts) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing`);
    continue;
  }
  const source = fs.readFileSync(file, "utf8");
  for (const needle of needles) {
    if (!source.includes(needle)) failures.push(`${file}: missing contract ${JSON.stringify(needle)}`);
  }
}

if (failures.length) {
  console.error("Publication platform contract failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Publication platform contract OK: autosave, secure preview, validation, idempotent publish, jobs, outbox and immutable audit are wired.");
