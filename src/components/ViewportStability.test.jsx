import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ViewportStability from "./ViewportStability";

class VisualViewportMock extends EventTarget {
  width = 390;
  height = 744;
  offsetTop = 12;
  scale = 1;
}

describe("ViewportStability", () => {
  afterEach(() => {
    delete window.visualViewport;
    vi.restoreAllMocks();
  });

  it("publie les dimensions du visual viewport sans provoquer de rendu React", async () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: new VisualViewportMock(),
    });
    window.matchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { unmount } = render(<ViewportStability />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-viewport", "compact");
      expect(document.documentElement.style.getPropertyValue("--visual-viewport-width")).toBe("390px");
      expect(document.documentElement.style.getPropertyValue("--visual-viewport-height")).toBe("744px");
      expect(document.documentElement.style.getPropertyValue("--visual-viewport-top")).toBe("12px");
    });

    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-viewport");
    expect(document.documentElement.style.getPropertyValue("--visual-viewport-height")).toBe("");
  });
  it("ne republie pas les variables racine quand le visual viewport est inchangé", async () => {
    const visualViewport = new VisualViewportMock();
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });
    window.matchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");

    const { unmount } = render(<ViewportStability />);
    await waitFor(() => expect(setProperty).toHaveBeenCalledTimes(4));

    visualViewport.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(setProperty).toHaveBeenCalledTimes(4);

    visualViewport.offsetTop = 18;
    visualViewport.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--visual-viewport-top")).toBe("18px");
    });
    expect(setProperty).toHaveBeenCalledTimes(5);

    unmount();
  });

});
