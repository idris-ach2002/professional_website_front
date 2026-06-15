import { demoOwner } from "../data/demoPortfolio";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SHOULD_USE_DIRECT_BACKEND =
  !import.meta.env.DEV || import.meta.env.VITE_USE_DIRECT_BACKEND === "true";
const API_BASE_URL = SHOULD_USE_DIRECT_BACKEND ? RAW_API_BASE_URL : "";
const REQUEST_TIMEOUT = 4500;

async function requestJson(path) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchWebsite() {
  const owner = await requestJson("/website/default");
  if (!owner) {
    throw new Error("Aucun owner retourné trouvé dans l'API");
  }
  return owner;
}

export async function loadPortfolio() {
  try {
    const owner = await fetchWebsite();
    return {
      owners: [owner],
      owner: owner,
      source: "api",
      error: null,
    };
  } catch (error) {
    return {
      owners: [demoOwner],
      owner: demoOwner,
      source: "demo",
      error: error instanceof Error ? error.message : "API indisponible",
    };
  }
}
