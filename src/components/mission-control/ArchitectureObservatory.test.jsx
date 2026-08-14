import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArchitectureObservatory from "./ArchitectureObservatory";

describe("ArchitectureObservatory", () => {
  afterEach(() => vi.restoreAllMocks());

  it("affiche le graphe nœuds-arêtes même sans endpoint backend", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<ArchitectureObservatory snapshot={null} liveSample={{ fps: 60 }} />);

    expect(screen.getByLabelText(/graphe exploratoire de l’architecture réelle du portfolio/i)).toBeInTheDocument();
    expect(screen.getByText("Spring Boot 4")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText(/plan de déploiement reste visible/i)).toBeInTheDocument();
    const reactNode = screen.getByRole("button", { name: /React 19.*Déplacer le nœud/i });
    expect(reactNode).toBeInTheDocument();
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
    expect(screen.getByRole("dialog", { name: /Détails React 19/i })).toBeInTheDocument();
    expect(screen.getByText(/Fermeture dans/i)).toBeInTheDocument();
    expect(container.querySelectorAll(".architecture-node.heat-unknown").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".architecture-link-base")).toHaveLength(19);
    expect(container.querySelectorAll(".architecture-link-pulse").length).toBeGreaterThan(0);
  });
});
