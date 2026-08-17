import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArchitectureObservatory from "./ArchitectureObservatory";

describe("ArchitectureObservatory", () => {
  afterEach(() => vi.restoreAllMocks());

  it("affiche le graphe nœuds-arêtes même sans endpoint backend", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<ArchitectureObservatory snapshot={null} liveSample={{ fps: 60, p95: 13.9 }} />);

    expect(screen.getByLabelText(/graphe exploratoire de l’architecture réelle du portfolio/i)).toBeInTheDocument();
    expect(screen.getByText("Spring Boot 4")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText(/plan de déploiement reste visible/i)).toBeInTheDocument();
    const reactNode = screen.getByRole("button", { name: /React 19.*Déplacer le nœud/i });
    expect(reactNode).toBeInTheDocument();
    expect(reactNode).toHaveClass("heat-healthy");
    expect(within(reactNode).getByText("Sain")).toBeInTheDocument();
    expect(within(reactNode).getByText("13.9 ms p95")).toBeInTheDocument();
    expect(screen.getByText(/CPU layout libéré/i)).toBeInTheDocument();
    expect(screen.getAllByText("professional_website_front").length).toBeGreaterThan(0);
    expect(screen.getAllByText("professional_website").length).toBeGreaterThan(0);
    const sageButton = screen.getByRole("button", { name: "Canvas Sauge" });
    expect(sageButton).toHaveClass("is-active");
    const stage = container.querySelector("#architecture-system-stage");
    const surface = container.querySelector("canvas.architecture-webgl");
    expect(surface).toBeInTheDocument();
    expect(stage).toHaveAttribute("data-canvas-shade", "sage");
    expect(stage?.getAttribute("style")).toContain("--canvas-b: #5c6b63");
    expect(surface?.getAttribute("style")).toContain("--canvas-b: #5c6b63");
    expect(stage?.getAttribute("style")).toContain("--canvas-background:");
    fireEvent.click(screen.getByRole("button", { name: "Canvas Lavande" }));
    expect(screen.getByRole("button", { name: "Canvas Lavande" })).toHaveClass("is-active");
    expect(stage).toHaveAttribute("data-canvas-shade", "lavender");
    expect(stage?.getAttribute("style")).toContain("--canvas-b: #625d70");
    fireEvent.click(reactNode);
    const reactDialog = screen.getByRole("dialog", { name: /Détails React 19/i });
    expect(reactDialog).toBeInTheDocument();
    expect(within(reactDialog).getByText("Sain")).toBeInTheDocument();
    expect(within(reactDialog).getByText("< 20 ms")).toBeInTheDocument();
    expect(within(reactDialog).getByText("6.1 ms")).toBeInTheDocument();
    expect(screen.getByText(/Fermeture dans/i)).toBeInTheDocument();
    expect(container.querySelectorAll(".architecture-node.heat-unknown").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".architecture-link-base")).toHaveLength(19);
    expect(container.querySelectorAll(".architecture-link-pulse").length).toBeGreaterThan(0);
  });
  it("utilise une composition mobile native avant de charger le graphe complet", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: String(query).includes("max-width: 820px"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const { container } = render(<ArchitectureObservatory snapshot={null} liveSample={{ fps: 60, p95: 16.4 }} />);

    expect(screen.getByRole("region", { name: /architecture mobile synthétique/i })).toBeInTheDocument();
    const reactStep = screen.getByRole("button", { name: /React 19/i });
    expect(reactStep).toHaveClass("heat-healthy");
    expect(within(reactStep).getByText("Sain")).toBeInTheDocument();
    expect(within(reactStep).getByText("16.4 ms p95")).toBeInTheDocument();
    expect(container.querySelector("#architecture-system-stage")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Explorer le graphe/i }));
    expect(screen.getByText("Graphe complet")).toBeInTheDocument();
    expect(container.querySelector("#architecture-system-stage")).toBeInTheDocument();
  });

});
