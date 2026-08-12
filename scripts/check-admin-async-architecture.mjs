import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const errors = [];
const requireText = (source, fragment, message) => { if (!source.includes(fragment)) errors.push(message); };
const forbidText = (source, fragment, message) => { if (source.includes(fragment)) errors.push(message); };

const auth = read("src/services/authApi.js");
const coordinator = read("src/components/admin/useAdminAsyncCoordinator.js");
const core = read("src/components/admin/useAdminPortfolioCore.jsx");
const crud = read("src/components/admin/useAdminCrudActions.jsx");
const jsonWorkspace = read("src/components/admin/useAdminJsonWorkspace.jsx");
const analytics = read("src/components/admin/AdminAnalyticsPanel.jsx");
const translations = read("src/components/admin/AdminTranslationPanel.jsx");

for (const file of [
  "src/services/authApi.test.js",
  "src/components/admin/useAdminAsyncCoordinator.test.jsx",
]) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing critical async test: ${file}.`);
}

for (const contract of ["csrfTokenInFlight", "waitForPromiseWithSignal", "If-Match", "ConcurrencyConflictError", "resetAuthSessionCache"]) {
  requireText(auth, contract, `authApi concurrency contract missing: ${contract}.`);
}
for (const contract of ["pendingRef", "lanesRef", "generationRef", "mutationTailRef", "AbortController", "runLatest", "runMutation", "isCurrent", "commit"]) {
  requireText(coordinator, contract, `Admin coordinator contract missing: ${contract}.`);
}
requireText(core, "runLatest", "Admin portfolio reads must use latest-wins coordination.");
requireText(core, "signal", "Admin portfolio reads must propagate AbortSignal.");
requireText(core, "commit(() =>", "Latest-wins admin reads must commit state only through generation-guarded commits.");
requireText(crud, "runMutation", "Admin writes must be serialized through runMutation.");
requireText(crud, "versionEntityTag", "Version mutations must carry optimistic-concurrency tags.");
requireText(crud, "ownerEntityTag", "Owner mutations must carry optimistic-concurrency tags.");
requireText(jsonWorkspace, "runMutation", "JSON workspace writes must use the mutation lane.");
requireText(jsonWorkspace, "versionEntityTag", "JSON workspace must protect version writes with If-Match.");
requireText(analytics, "AbortController", "Analytics refreshes must abort obsolete requests.");
requireText(analytics, "requestRef.current === controller", "Analytics must ignore stale responses.");
requireText(translations, "AbortController", "Translation selection reads must be cancellable.");
requireText(translations, "bulkControllerRef", "Translation bulk work must own an abortable lifecycle.");
requireText(translations, "{ signal: controller.signal }", "Translation writes and bulk work must propagate AbortSignal.");
requireText(translations, "isAbortError", "Translation cancellation must not surface as a user error.");

for (const file of [
  "src/components/admin/useAdminPortfolioCore.jsx",
  "src/components/admin/useAdminCrudActions.jsx",
  "src/components/admin/useAdminJsonWorkspace.jsx",
  "src/components/admin/useAdminSafetyActions.jsx",
]) {
  const source = read(file);
  forbidText(source, "setLoading(true)", `${file} must not manipulate the shared loading boolean directly.`);
  forbidText(source, "setLoading(false)", `${file} must not manipulate the shared loading boolean directly.`);
}
for (const source of [auth, core, crud, jsonWorkspace]) {
  for (const legacy of ["/api/projects", "/api/profiles", "/api/timelines", "/api/experiences"]) {
    forbidText(source, legacy, `Retired unversioned admin route must stay absent: ${legacy}.`);
  }
}

if (errors.length) {
  console.error("Admin async architecture FAILED:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log("Admin async architecture OK: latest-wins reads, serialized writes, shared CSRF, AbortSignal propagation and HTTP optimistic-concurrency tags are enforced.");
