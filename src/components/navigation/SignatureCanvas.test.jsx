import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SignatureCanvas from "./SignatureCanvas";

vi.mock("../../contexts/useAnimationPreferences", () => ({
  default: () => ({
    animationsEnabled: false,
    animationsPaused: false,
    performanceMode: "full",
  }),
}));

function createGradient() {
  return { addColorStop: vi.fn() };
}

function createContext() {
  return {
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(createGradient),
    createLinearGradient: vi.fn(createGradient),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 13 })),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "round",
    lineJoin: "round",
    font: "",
    textBaseline: "alphabetic",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
  };
}

describe("SignatureCanvas", () => {
  let getContextSpy;

  beforeEach(() => {
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(createContext());
    window.matchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    getContextSpy?.mockRestore();
  });

  it("dessine une signature statique et conserve un fallback image", async () => {
    const { container } = render(<SignatureCanvas name="Idris" fallbackSrc="/logo.png" />);

    const signature = container.querySelector(".nav_signature");
    const canvas = container.querySelector("canvas");
    const fallback = container.querySelector(".nav_signature-fallback");
    const wordmark = container.querySelector(".nav-signature-wordmark");

    expect(canvas).toBeTruthy();
    expect(fallback).toHaveAttribute("src", "/logo.png");
    expect(signature).toHaveAttribute("aria-hidden", "true");
    expect(wordmark).toHaveClass("is-static");
    expect(container.querySelectorAll(".nav-signature-letter")).toHaveLength(5);

    await waitFor(() => expect(signature).toHaveAttribute("data-canvas-ready", "true"));
    expect(signature).toHaveAttribute("data-signature-quality", "static");
    expect(signature).toHaveAttribute("data-signature-event", "idle");
    expect(getContextSpy).toHaveBeenCalledWith("2d", { alpha: true, desynchronized: true });
  });
});
