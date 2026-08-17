import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import ProfileHero from "./ProfileHero";

vi.mock("../animations/useGsap", () => ({ useGsap: vi.fn() }));
vi.mock("../localization/useLanguage", () => ({
  default: () => ({
    localizedPath: (path) => path,
    t: (key, options = {}) => options.fallback ?? key,
  }),
}));
vi.mock("../visibility/ItemVisibilityContext", () => ({
  VisibilityGate: ({ children }) => children,
}));
vi.mock("./FilePreview", () => ({
  PreviewableImage: ({ alt, modalTitle }) => <img alt={alt} data-modal-title={modalTitle} />,
}));

const owner = {
  firstName: "Idris",
  name: "ACHABOU",
  contacts: [
    { type: "EMAIL", value: "idris@example.com" },
  ],
};

const profile = {
  title: "Développeur Java Full Stack",
  headline: "Applications structurées et maintenables.",
  shortDescription: "Portfolio professionnel.",
  subtitle: "Java 21 / Spring Boot / React / PostgreSQL",
  availability: "Disponible pour une alternance à partir de septembre 2026",
  location: "Île-de-France",
  profileImageUrl: "/portrait.jpg",
  cvUrl: "/cv.pdf",
};

describe("ProfileHero", () => {
  it("rend la photo avec son titre localisé sans référence hors portée", () => {
    render(
      <MantineProvider>
        <ProfileHero owner={owner} prof={profile} />
      </MantineProvider>,
    );

    const image = screen.getByAltText("Idris ACHABOU");
    const dock = image.closest(".profile-identity-dock");
    expect(dock).toHaveAttribute("data-profile-module", "identity-dock");
    expect(image).toHaveAttribute("data-modal-title", "nav.profile — Idris ACHABOU");
    expect(screen.getByText("Idris ACHABOU")).toBeInTheDocument();
  });
  it("garde les disciplines visuelles fixes sans exposer les technologies de prof.subtitle", () => {
    render(
      <MantineProvider>
        <ProfileHero owner={owner} prof={profile} />
      </MantineProvider>,
    );

    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.queryByText("Java 21")).not.toBeInTheDocument();
    expect(screen.queryByText("Spring Boot")).not.toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.queryByText("PostgreSQL")).not.toBeInTheDocument();
  });

});
