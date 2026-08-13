import { act, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminVersionPreviewPage from "./AdminVersionPreviewPage";
import { apiRequest } from "../../services/authApi";

vi.mock("../../services/authApi", () => ({ apiRequest: vi.fn() }));
vi.mock("../../hooks/useResponsiveProfile", () => ({
  default: () => ({
    isMobile: false,
    reducedMotion: true,
    performanceMode: "lite",
    preference: "reduced",
    isFirefox: false,
    animationsEnabled: false,
    animationsPaused: false,
  }),
}));
vi.mock("../../performance/usePerformanceRuntime", () => ({ default: () => ({ runtimeQuality: "balanced" }) }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ ownerId: "1", versionId: "2" }),
    useSearchParams: () => [new URLSearchParams("locale=fr")],
  };
});

vi.mock("../GlobalAquarium", () => ({ default: () => null }));
vi.mock("../OceanMorphBackground", () => ({ default: () => null }));
vi.mock("../OceanWorldBridge", () => ({ default: () => null }));
vi.mock("../OceanTransitionStage", () => ({ default: () => null }));
vi.mock("../ProfileHero", () => ({ default: () => null }));
vi.mock("../ProjectsShowcase", () => ({ default: () => null }));
vi.mock("../ProvenSkillsSection", () => ({ default: () => null }));
vi.mock("../SiteFooter", () => ({ default: () => null }));
vi.mock("../TopNavigation", () => ({ default: () => null }));
vi.mock("../PortfolioTimeline", () => ({ default: () => null }));
vi.mock("../UnderwaterVolcanoField", () => ({ default: () => null }));

function ownerSnapshot() {
  return {
    ownerId: 1,
    firstName: "Idris",
    name: "ACHABOU",
    prof: { title: "Développeur" },
    timeline: { experiences: [] },
    projects: [],
    provenSkills: [],
  };
}

describe("AdminVersionPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = "Portfolio";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "index,follow");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.querySelectorAll('meta[name="robots"]').forEach((node, index) => {
      if (index > 0) node.remove();
    });
  });

  it("fetches the manager-only draft snapshot and restores SEO metadata on unmount", async () => {
    apiRequest.mockResolvedValue(ownerSnapshot());

    const view = render(
      <MantineProvider>
        <AdminVersionPreviewPage />
      </MantineProvider>,
    );

    await screen.findByText("APERÇU DRAFT — privé");
    expect(apiRequest).toHaveBeenCalledWith(
      "GET",
      "/manager/1/versions/2/preview?locale=fr",
      undefined,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(document.title).toContain("Preview v2");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow,noarchive");

    view.unmount();

    await waitFor(() => {
      expect(document.title).toBe("Portfolio");
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
    });
  });

  it("keeps the last valid snapshot visible when a later refresh fails", async () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    let intervalTick;
    vi.spyOn(window, "setInterval").mockImplementation((callback, delay) => {
      if (delay === 2500) intervalTick = callback;
      return 42;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => {});
    apiRequest
      .mockResolvedValueOnce(ownerSnapshot())
      .mockRejectedValueOnce(new Error("network down"));

    const view = render(
      <MantineProvider>
        <AdminVersionPreviewPage />
      </MantineProvider>,
    );

    await screen.findByText("APERÇU DRAFT — privé");
    expect(intervalTick).toEqual(expect.any(Function));
    await act(async () => {
      intervalTick();
      await Promise.resolve();
    });

    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(2));
    await screen.findByText(/Dernière actualisation en erreur : network down/);
    expect(screen.getByText("APERÇU DRAFT — privé")).toBeInTheDocument();
    view.unmount();
  });
});
