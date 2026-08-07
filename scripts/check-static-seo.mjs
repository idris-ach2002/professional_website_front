import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPublicSiteUrl } from "./public-snapshot.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const requiredPages = [
  ["index.html", "fr"],
  ["en/index.html", "en"],
  ["recruiter/index.html", "fr"],
  ["en/recruiter/index.html", "en"],
  ["cv/index.html", "fr"],
  ["en/cv/index.html", "en"],
  ["admin/index.html", "fr"],
  ["en/admin/index.html", "en"],
];
const failures = [];
const canonicalRequired = Boolean(getPublicSiteUrl());

for (const [relativePath, locale] of requiredPages) {
  const filePath = path.join(dist, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath}: missing`);
    continue;
  }

  const html = fs.readFileSync(filePath, "utf8");
  const expectedRobots = relativePath.includes("admin/")
    ? /<meta\s+name="robots"\s+content="noindex, nofollow"/i
    : /<meta\s+name="robots"\s+content="index, follow, max-image-preview:large"/i;
  const checks = [
    [new RegExp(`<html[^>]+lang=["']${locale}["']`, "i"), "html lang"],
    [/<meta\s+name="description"\s+content="[^"]+"/i, "description"],
    [expectedRobots, "robots"],
    [/<main\s+id="seo-static-content"/i, "static body content"],
    ...(canonicalRequired
      ? [
          [/<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/i, "canonical"],
          [/<link\s+rel="alternate"\s+hreflang="fr"\s+href="https?:\/\/[^"]+"/i, "hreflang fr"],
          [/<link\s+rel="alternate"\s+hreflang="en"\s+href="https?:\/\/[^"]+"/i, "hreflang en"],
          [/<link\s+rel="alternate"\s+hreflang="x-default"\s+href="https?:\/\/[^"]+"/i, "hreflang x-default"],
        ]
      : []),
  ];

  for (const [pattern, label] of checks) {
    if (!pattern.test(html)) failures.push(`${relativePath}: ${label} missing`);
  }
}



for (const [relativePath, locale] of [["404.html", "fr"], ["en/404.html", "en"]]) {
  const filePath = path.join(dist, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath}: missing`);
    continue;
  }
  const html = fs.readFileSync(filePath, "utf8");
  if (!new RegExp(`<html[^>]+lang=["']${locale}["']`, "i").test(html)) failures.push(`${relativePath}: html lang missing`);
  if (!/<meta\s+name="robots"\s+content="noindex, follow"/i.test(html)) failures.push(`${relativePath}: noindex missing`);
}

for (const relativePath of ["admin/index.html", "en/admin/index.html"]) {
  const html = fs.readFileSync(path.join(dist, relativePath), "utf8");
  if (!/<meta\s+name="robots"\s+content="noindex, nofollow"/i.test(html)) failures.push(`${relativePath}: private noindex missing`);
}

const frProjectsDirectory = path.join(dist, "projects");
const enProjectsDirectory = path.join(dist, "en", "projects");
const frProjectCount = fs.existsSync(frProjectsDirectory)
  ? fs.readdirSync(frProjectsDirectory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  : 0;
const enProjectCount = fs.existsSync(enProjectsDirectory)
  ? fs.readdirSync(enProjectsDirectory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  : 0;
if (frProjectCount === 0) failures.push("French project pages missing");
if (frProjectCount !== enProjectCount) failures.push(`FR/EN project page mismatch: ${frProjectCount}/${enProjectCount}`);

const snapshotMetaPath = path.join(dist, "public-snapshot-meta.json");
if (!fs.existsSync(snapshotMetaPath)) {
  failures.push("public-snapshot-meta.json missing");
} else if (String(process.env.STATIC_SNAPSHOT_REQUIRED).toLowerCase() === "true") {
  const snapshotMeta = JSON.parse(fs.readFileSync(snapshotMetaPath, "utf8"));
  if (snapshotMeta.source !== "backend") failures.push(`production snapshot source is ${snapshotMeta.source}`);
}

if (failures.length > 0) {
  console.error(`Static SEO validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Static SEO OK: ${requiredPages.length} core FR/EN pages validated.`);
