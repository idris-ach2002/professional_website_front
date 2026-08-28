import { render, screen, within } from "@testing-library/react";
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

  it("présente une vue racine compacte et les sous-menus détaillés", () => {
    renderControls();
    expect(screen.getByRole("group", { name: /Niveau d’animations/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transitions océaniques/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Volcan sous-marin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Navbar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Profil Arctic Ink/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Performance/i })).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(1);
  });

  it("ouvre les transitions et conserve le contrôle indépendant des cinq jonctions", async () => {
    const user = userEvent.setup();
    renderControls();
    await user.click(screen.getByRole("button", { name: /Transitions océaniques/i }));

    expect(screen.getAllByRole("switch")).toHaveLength(6);
    const profileTimeline = screen.getByRole("switch", { name: /Profil ↔ Timeline/i });
    const volcanoProjects = screen.getByRole("switch", { name: /Volcan ↔ Projets/i });
    expect(profileTimeline).toHaveAttribute("aria-checked", "true");

    await user.click(profileTimeline);
    expect(profileTimeline).toHaveAttribute("aria-checked", "false");
    expect(volcanoProjects).toHaveAttribute("aria-checked", "true");
  });

  it("persiste les réglages détaillés du volcan", async () => {
    const user = userEvent.setup();
    renderControls();
    await user.click(screen.getByRole("button", { name: /Volcan sous-marin/i }));

    const mode = screen.getByRole("group", { name: /Mode du volcan/i });
    await user.click(within(mode).getByRole("button", { name: /Animé/i }));

    const quality = screen.getByRole("group", { name: /Qualité du volcan/i });
    await user.click(within(quality).getByRole("button", { name: /Équilibrée/i }));
    await user.click(screen.getByRole("switch", { name: /Bulles/i }));

    expect(JSON.parse(window.localStorage.getItem("portfolio-animation-scenes-v1"))).toMatchObject({
      volcanoMode: "animated",
      volcanoQuality: "balanced",
      volcanoEffects: { bubbles: false },
    });
  });
});
