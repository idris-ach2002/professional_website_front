import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ViewportStability from "./ViewportStability";

class VisualViewportMock extends EventTarget {
  width = 390;
  height = 744;
  offsetTop = 12;
  scale = 1;
}

function installViewport() {
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
  return visualViewport;
}

describe("ViewportStability", () => {
  afterEach(() => {
    delete window.visualViewport;
    document.querySelectorAll("[data-viewport-test]").forEach((node) => node.remove());
    vi.restoreAllMocks();
  });

  it("publie les dimensions uniquement sur les shells viewport-sensibles", async () => {
    installViewport();
    const nav = document.createElement("nav");
    nav.className = "nav_fixed nav_fixed--portfolio";
    nav.dataset.viewportTest = "true";
    document.body.appendChild(nav);

    const { unmount } = render(<ViewportStability />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-viewport", "compact");
      expect(nav.style.getPropertyValue("--visual-viewport-width")).toBe("390px");
      expect(nav.style.getPropertyValue("--visual-viewport-height")).toBe("744px");
      expect(nav.style.getPropertyValue("--visual-viewport-top")).toBe("12px");
      expect(document.documentElement.style.getPropertyValue("--visual-viewport-height")).toBe("");
    });

    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-viewport");
    expect(nav.style.getPropertyValue("--visual-viewport-height")).toBe("");
  });

  it("ne republie pas quand le visual viewport est inchangé et hydrate les cibles tardives", async () => {
    const visualViewport = installViewport();
    const nav = document.createElement("nav");
    nav.className = "nav_fixed nav_fixed--portfolio";
    nav.dataset.viewportTest = "true";
    document.body.appendChild(nav);
    const setProperty = vi.spyOn(nav.style, "setProperty");

    const { unmount } = render(<ViewportStability />);
    await waitFor(() => expect(setProperty).toHaveBeenCalledTimes(4));

    visualViewport.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(setProperty).toHaveBeenCalledTimes(4);

    visualViewport.offsetTop = 18;
    visualViewport.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(nav.style.getPropertyValue("--visual-viewport-top")).toBe("18px"));
    expect(setProperty).toHaveBeenCalledTimes(5);

    const modal = document.createElement("div");
    modal.className = "project-detail-modal-inner";
    modal.dataset.viewportTest = "true";
    document.body.appendChild(modal);
    await waitFor(() => expect(modal.style.getPropertyValue("--visual-viewport-top")).toBe("18px"));
    expect(modal.style.getPropertyValue("--visual-viewport-height")).toBe("744px");

    unmount();
  });
});
