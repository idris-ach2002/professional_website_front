import { demoOwner } from "../data/demoPortfolio";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
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

export async function fetchOwners() {
  const owners = await requestJson("/manager");
  if (!Array.isArray(owners) || owners.length === 0) {
    throw new Error("Aucun owner retourné par /manager");
  }
  return owners;
}

export async function loadPortfolio() {
  try {
    const owners = await fetchOwners();
    return {
      owners,
      owner: owners[0],
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
