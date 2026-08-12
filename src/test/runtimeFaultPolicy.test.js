import { describe, expect, it } from "vitest";
import {
  classifyConsoleError,
  classifyNetworkFailure,
} from "../../e2e/support/runtime-fault-policy";

describe("E2E runtime fault policy", () => {
  it.each([
    "NS_BINDING_ABORTED",
    "NS_ERROR_ABORT",
    "net::ERR_ABORTED",
  ])("classe l'annulation navigateur %s comme diagnostic", (errorText) => {
    const result = classifyNetworkFailure({
      method: "GET",
      url: "https://fonts.gstatic.com/inter.woff2",
      resourceType: "font",
      errorText,
    });

    expect(result.severity).toBe("diagnostic");
  });

  it("ne confond pas une connexion réellement avortée avec une annulation de navigation", () => {
    const result = classifyNetworkFailure({
      method: "GET",
      url: "http://127.0.0.1:4173/assets/app.js",
      resourceType: "script",
      errorText: "net::ERR_CONNECTION_ABORTED",
    });

    expect(result.severity).toBe("fatal");
  });

  it("classe une vraie panne réseau comme fatale", () => {
    const result = classifyNetworkFailure({
      method: "GET",
      url: "http://127.0.0.1:4173/assets/app.js",
      resourceType: "script",
      errorText: "net::ERR_CONNECTION_REFUSED",
    });

    expect(result.severity).toBe("fatal");
  });

  it("classe le doublon console Chromium d'une réponse HTTP en diagnostic", () => {
    const result = classifyConsoleError(
      "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
    );
    expect(result.severity).toBe("diagnostic");
  });

  it("conserve une vraie console.error applicative comme faute fatale", () => {
    const result = classifyConsoleError("Unhandled application invariant");
    expect(result.severity).toBe("fatal");
  });
});
