import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { demoOwner } from "../src/data/demoPortfolio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDirectory = path.join(root, ".cache");
const cachePath = path.join(cacheDirectory, "public-portfolio-snapshot.json");

function readEnvFiles() {
  const values = {};
  const mode = process.env.NODE_ENV === "development" ? "development" : "production";
  const filenames = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  for (const filename of filenames) {
    const fullPath = path.join(root, filename);
    if (!fs.existsSync(fullPath)) continue;

    for (const rawLine of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  }

  return values;
}

function isPortfolioOwner(value) {
  return Boolean(
    value
      && typeof value === "object"
      && (Number.isFinite(Number(value.ownerId)) || (value.firstName && value.name))
      && Array.isArray(value.projects),
  );
}

function normalizeApiBase(value = "") {
  return value.trim().replace(/\/+$/, "");
}

function cloneDemoOwner(locale) {
  return {
    ...structuredClone(demoOwner),
    locale,
  };
}

async function fetchOwner(apiBase, locale) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const url = new URL(`${apiBase}/website/default`);
    url.searchParams.set("locale", locale);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${locale} public snapshot`);
    }

    const owner = await response.json();
    if (!isPortfolioOwner(owner)) {
      throw new Error(`Invalid ${locale} public snapshot returned by backend`);
    }
    return owner;
  } finally {
    clearTimeout(timeout);
  }
}


async function fetchCombinedSnapshot(apiBase) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${apiBase}/website/default/seo-snapshot`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching combined public snapshot`);
    }
    const snapshot = await response.json();
    if (!isPortfolioOwner(snapshot?.fr) || !isPortfolioOwner(snapshot?.en)) {
      throw new Error("Invalid combined public snapshot returned by backend");
    }
    return snapshot;
  } finally {
    clearTimeout(timeout);
  }
}

function readCachedSnapshot() {
  if (!fs.existsSync(cachePath)) return null;

  try {
    const snapshot = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (!isPortfolioOwner(snapshot?.fr) || !isPortfolioOwner(snapshot?.en)) return null;
    return snapshot;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(snapshot) {
  fs.mkdirSync(cacheDirectory, { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(snapshot, null, 2)}\n`);
}

export function getPublicSiteUrl() {
  const fileEnv = readEnvFiles();
  const configured = process.env.PUBLIC_SITE_URL
    || process.env.VITE_PUBLIC_SITE_URL
    || fileEnv.PUBLIC_SITE_URL
    || fileEnv.VITE_PUBLIC_SITE_URL
    || "";
  return configured ? new URL(configured).toString().replace(/\/$/, "") : "";
}

export async function loadPublicPortfolioSnapshot() {
  const fileEnv = readEnvFiles();
  const apiBase = normalizeApiBase(
    process.env.PUBLIC_API_BASE_URL
      || process.env.VITE_API_BASE_URL
      || fileEnv.PUBLIC_API_BASE_URL
      || fileEnv.VITE_API_BASE_URL
      || "",
  );
  const required = String(
    process.env.STATIC_SNAPSHOT_REQUIRED
      || fileEnv.STATIC_SNAPSHOT_REQUIRED
      || "false",
  ).toLowerCase() === "true";

  if (apiBase) {
    try {
      let backendSnapshot;
      try {
        backendSnapshot = await fetchCombinedSnapshot(apiBase);
      } catch (combinedError) {
        console.warn(`Combined SEO snapshot unavailable, using localized endpoints: ${combinedError.message}`);
        const [fr, en] = await Promise.all([
          fetchOwner(apiBase, "fr"),
          fetchOwner(apiBase, "en"),
        ]);
        backendSnapshot = { generatedAt: new Date().toISOString(), fr, en };
      }
      const snapshot = {
        generatedAt: backendSnapshot.generatedAt || new Date().toISOString(),
        source: "backend",
        apiBase,
        fr: backendSnapshot.fr,
        en: backendSnapshot.en,
      };
      writeCachedSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      if (required) throw error;
      console.warn(`Public backend snapshot unavailable: ${error.message}`);
    }
  } else if (required) {
    throw new Error("STATIC_SNAPSHOT_REQUIRED=true but PUBLIC_API_BASE_URL/VITE_API_BASE_URL is not configured.");
  }

  const cached = readCachedSnapshot();
  if (cached) {
    return { ...cached, source: "cache" };
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "demo-fallback",
    apiBase: "",
    fr: cloneDemoOwner("fr"),
    en: cloneDemoOwner("en"),
  };
}
