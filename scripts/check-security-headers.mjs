import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const headersPath = path.join(root, "public/_headers");
if (!fs.existsSync(headersPath)) {
  console.error("Security headers FAILED: public/_headers is missing.");
  process.exit(1);
}
const source = fs.readFileSync(headersPath, "utf8");
const errors = [];
for (const fragment of [
  "Content-Security-Policy:",
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self'",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy:",
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "Cross-Origin-Opener-Policy: same-origin",
  "/assets/*",
  "max-age=31536000, immutable",
  "/admin*",
  "Cache-Control: no-store",
]) {
  if (!source.includes(fragment)) errors.push(`missing ${fragment}`);
}
if (source.includes("unsafe-eval")) errors.push("unsafe-eval must never be allowed");
if (/connect-src[^;]*\shttps:(?:\s|;)/.test(source)) errors.push("connect-src must not allow arbitrary HTTPS origins");
if (!source.includes("https://professional-website-hozo.onrender.com")) errors.push("production backend origin must be explicit in connect-src");
if (errors.length) {
  console.error("Security headers FAILED:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log("Security headers OK: CSP, anti-framing, MIME, referrer, permissions, immutable asset cache and admin no-store policies are present.");
