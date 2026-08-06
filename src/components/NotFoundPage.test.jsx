import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LanguageProvider from "../localization/LanguageProvider";
import NotFoundPage from "./NotFoundPage";

vi.mock("./OceanMorphBackground", () => ({
  default: () => <div data-testid="ocean-background" aria-hidden="true" />,
}));

function renderPage(initialEntry = "/missing") {
  return render(
    <MantineProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <NotFoundPage />
        </MemoryRouter>
      </LanguageProvider>
    </MantineProvider>,
  );
}

describe("NotFoundPage", () => {
  it("affiche une vraie page 404 française et ses liens de sortie", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Cette profondeur n’existe pas.");
    expect(screen.getByRole("link", { name: "Retour à l’accueil" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Voir les projets" })).toHaveAttribute("href", "/#projects");
    expect(screen.getByRole("link", { name: "Consulter le CV" })).toHaveAttribute("href", "/cv");
    expect(document.title).toBe("Page introuvable — Portfolio d’Idris ACHABOU");
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("conserve la langue anglaise dans les liens", () => {
    window.history.replaceState({}, "", "/missing?lang=en");
    renderPage("/missing?lang=en");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This depth does not exist.");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/?lang=en");
    expect(screen.getByRole("link", { name: "View résumé" })).toHaveAttribute("href", "/cv?lang=en");
  });
});
