import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnimationPreferencesProvider from "./AnimationPreferencesContext";
import useAnimationPreferences from "./useAnimationPreferences";

function Harness() {
  const context = useAnimationPreferences();
  return (
    <div>
      <span data-testid="preference">{context.preference}</span>
      <span data-testid="profile">{context.performanceMode}</span>
      <span data-testid="paused">{String(context.animationsPaused)}</span>
      <button type="button" onClick={() => context.setPreference("full")}>full</button>
      <button type="button" onClick={() => context.setPreference("reduced")}>reduced</button>
      <button type="button" onClick={() => context.setPreference("off")}>off</button>
      <button type="button" onClick={context.togglePaused}>pause</button>
    </div>
  );
}

function renderProvider() {
  return render(<AnimationPreferencesProvider><Harness /></AnimationPreferencesProvider>);
}

describe("AnimationPreferencesProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion") ? false : false,
      media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(),
    }));
  });

  it("mémorise le mode choisi et la pause", async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "reduced" }));
    expect(screen.getByTestId("profile")).toHaveTextContent("lite");
    expect(window.localStorage.getItem("portfolio-animation-preference")).toBe("reduced");
    await user.click(screen.getByRole("button", { name: "pause" }));
    expect(screen.getByTestId("paused")).toHaveTextContent("true");
    expect(window.localStorage.getItem("portfolio-animation-paused")).toBe("true");
  });

  it("active le mode ultra-léger quand les animations sont désactivées", async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "off" }));
    expect(screen.getByTestId("profile")).toHaveTextContent("ultra-lite");
    expect(document.documentElement).toHaveAttribute("data-animation-state", "off");
  });

  it("donne la priorité à prefers-reduced-motion même en mode complet", async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(),
    }));
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "full" }));
    expect(screen.getByTestId("preference")).toHaveTextContent("full");
    expect(screen.getByTestId("profile")).toHaveTextContent("ultra-lite");
  });
});
