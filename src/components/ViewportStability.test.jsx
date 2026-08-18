import { act, render } from "@testing-library/react";
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

function installControlledRaf() {
  let nextId = 1;
  const callbacks = new Map();

  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextId;
    nextId += 1;
    callbacks.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    callbacks.delete(id);
  });

  return {
    pending: () => callbacks.size,
    flush(timestamp = 0) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(timestamp));
    },
  };
}

let restoreMutationObserver = null;

function installControlledMutationObserver() {
  let activeObserver = null;
  const previousMutationObserver = globalThis.MutationObserver;

  class ControlledMutationObserver {
    constructor(callback) {
      this.callback = callback;
      activeObserver = this;
    }

    observe = vi.fn();
    disconnect = vi.fn();

    emitAdded(node) {
      this.callback([{ addedNodes: [node] }], this);
    }
  }

  Object.defineProperty(globalThis, "MutationObserver", {
    configurable: true,
    writable: true,
    value: ControlledMutationObserver,
  });
  restoreMutationObserver = () => {
    Object.defineProperty(globalThis, "MutationObserver", {
      configurable: true,
      writable: true,
      value: previousMutationObserver,
    });
  };

  return {
    emitAdded(node) {
      if (!activeObserver) throw new Error("MutationObserver non initialisé");
      activeObserver.emitAdded(node);
    },
  };
}

describe("ViewportStability", () => {
  afterEach(() => {
    delete window.visualViewport;
    document.querySelectorAll("[data-viewport-test]").forEach((node) => node.remove());
    restoreMutationObserver?.();
    restoreMutationObserver = null;
    vi.restoreAllMocks();
  });

  it("publie les dimensions uniquement sur les shells viewport-sensibles", async () => {
    installViewport();
    const nav = document.createElement("nav");
    nav.className = "nav_fixed nav_fixed--portfolio";
    nav.dataset.viewportTest = "true";
    document.body.appendChild(nav);

    const { unmount } = render(<ViewportStability />);

    expect(document.documentElement).toHaveAttribute("data-viewport", "compact");
    expect(nav.style.getPropertyValue("--visual-viewport-width")).toBe("390px");
    expect(nav.style.getPropertyValue("--visual-viewport-height")).toBe("744px");
    expect(nav.style.getPropertyValue("--visual-viewport-top")).toBe("12px");
    expect(document.documentElement.style.getPropertyValue("--visual-viewport-height")).toBe("");

    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-viewport");
    expect(nav.style.getPropertyValue("--visual-viewport-height")).toBe("");
  });

  it("ne republie pas quand le visual viewport est inchangé et hydrate les cibles tardives", async () => {
    const raf = installControlledRaf();
    const mutations = installControlledMutationObserver();
    const visualViewport = installViewport();
    const nav = document.createElement("nav");
    nav.className = "nav_fixed nav_fixed--portfolio";
    nav.dataset.viewportTest = "true";
    document.body.appendChild(nav);
    const setProperty = vi.spyOn(nav.style, "setProperty");

    const { unmount } = render(<ViewportStability />);
    expect(setProperty).toHaveBeenCalledTimes(4);

    visualViewport.dispatchEvent(new Event("scroll"));
    expect(raf.pending()).toBe(1);
    act(() => raf.flush());
    expect(setProperty).toHaveBeenCalledTimes(4);

    visualViewport.offsetTop = 18;
    visualViewport.dispatchEvent(new Event("scroll"));
    expect(raf.pending()).toBe(1);
    act(() => raf.flush());
    expect(nav.style.getPropertyValue("--visual-viewport-top")).toBe("18px");
    expect(setProperty).toHaveBeenCalledTimes(5);

    const modal = document.createElement("div");
    modal.className = "project-detail-modal-inner";
    modal.dataset.viewportTest = "true";
    document.body.appendChild(modal);
    act(() => mutations.emitAdded(modal));
    expect(modal.style.getPropertyValue("--visual-viewport-top")).toBe("18px");
    expect(modal.style.getPropertyValue("--visual-viewport-height")).toBe("744px");

    unmount();
  });
});
