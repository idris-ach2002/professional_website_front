import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnimationPreferencesProvider from "../contexts/AnimationPreferencesContext";
import LanguageProvider from "../localization/LanguageProvider";
import AnimationPreferences from "./AnimationPreferences";

function renderControls() {
  return render(
    <LanguageProvider>
      <AnimationPreferencesProvider>
        <AnimationPreferences mobile />
      </AnimationPreferencesProvider>
    </LanguageProvider>,
  );
}

describe("AnimationPreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion") ? false : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  it("exposes the master transition switch and the five world seams", () => {
    const { container } = renderControls();
    expect(screen.getAllByRole("switch")).toHaveLength(6);
    expect(container.querySelectorAll(".animation-control-tile")).toHaveLength(11);
    expect(screen.getByRole("switch", { name: /Profil ↔ Timeline/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: /Timeline ↔ Volcan/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Timeline ↔ Projets/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Volcan ↔ Projets/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Projets ↔ Sortie/i })).toBeInTheDocument();
  });

  it("changes one seam without disabling the others", async () => {
    const user = userEvent.setup();
    renderControls();
    const profileTimeline = screen.getByRole("switch", { name: /Profil ↔ Timeline/i });
    const volcanoProjects = screen.getByRole("switch", { name: /Volcan ↔ Projets/i });

    await user.click(profileTimeline);

    expect(profileTimeline).toHaveAttribute("aria-checked", "false");
    expect(volcanoProjects).toHaveAttribute("aria-checked", "true");
  });
});
