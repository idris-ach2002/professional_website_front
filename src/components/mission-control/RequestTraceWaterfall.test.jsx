import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RequestTraceWaterfall from "./RequestTraceWaterfall";

describe("RequestTraceWaterfall", () => {
  it("dessine le trajet, le waterfall et le chemin critique", () => {
    render(<RequestTraceWaterfall renderMs={7} trace={{
      method: "GET",
      operation: "Snapshot d’observabilité",
      path: "/api/engineering/mission-control",
      url: "http://localhost:8080/api/engineering/mission-control",
      clientOrigin: "http://localhost:5173",
      initiator: "MissionControlPage",
      status: 200,
      totalMs: 42,
      dnsMs: 1,
      connectMs: 3,
      downloadMs: 5,
      transferBytes: 2048,
      decodedBodyBytes: 4096,
      contentType: "application/json",
      cacheStatus: "MISS",
      payloadSignals: ["JVM + système", "PostgreSQL"],
      calledComponents: ["Spring", "PostgreSQL"],
      serverTiming: [{ name: "spring", description: "Spring", durationMs: 26 }],
    }} />);
    expect(screen.getByRole("heading", { name: "Snapshot d’observabilité" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Anneau interactif des services/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Étape .*api\/engineering\/mission-control/i })).toBeInTheDocument();
    const requestFacts = screen.getByLabelText(/Identité et consommation de la requête/i);
    expect(within(requestFacts).getByText("http://localhost:5173")).toBeInTheDocument();
    expect(screen.getByText("4.0 Ko décodés")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /waterfall full-stack/i })).toBeInTheDocument();
    const diagnosis = document.querySelector(".trace-diagnosis");
    expect(diagnosis).toBeInTheDocument();
    expect(diagnosis).toHaveTextContent(/Spring.*concentre/);
    expect(screen.getByText(/Le serveur fournit son découpage interne/)).toBeInTheDocument();
  });
});
