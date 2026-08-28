import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import ProfileHero from "./ProfileHero";

vi.mock("../animations/useGsap", () => ({ useGsap: vi.fn() }));
vi.mock("../contexts/useAnimationPreferences", () => ({
  default: () => ({ effectiveProfileMotion: "animated" }),
}));
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
  description: "Je conçois des applications robustes et maintenables.",
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
    expect(document.querySelector('.arctic-profile-name[aria-label="Idris ACHABOU"]')).toBeInTheDocument();
  });
  it("rend le contrat Arctic Ink avec les technologies réelles du profil", () => {
    const { container } = render(
      <MantineProvider>
        <ProfileHero owner={owner} prof={profile} />
      </MantineProvider>,
    );

    const root = container.querySelector('.arctic-profile[data-profile-theme="arctic-ink"]');
    expect(root).toBeInTheDocument();
    expect(container.querySelectorAll('.profile-identity-dock[data-profile-module="identity-dock"]')).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Développeur Java Full Stack" })).toBeInTheDocument();
    expect(screen.getByText("Java 21 / Spring Boot / React / PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("Spring Boot")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText("API REST")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText(profile.availability)).toBeInTheDocument();
    expect(screen.getByText(profile.location)).toBeInTheDocument();
    expect(container.querySelector(".profile-shared-motion-field")).not.toBeInTheDocument();
  });

});
