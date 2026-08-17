import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemVisibilityProvider } from "./ItemVisibilityContext";
import { useItemVisibility } from "./useItemVisibility";

function Probe({ onRender }) {
  const state = useItemVisibility();
  onRender(state);
  return <span data-testid="ready">{String(state.ready)}</span>;
}

describe("ItemVisibilityProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("conserve le même Set et évite un rerender lorsque la visibilité n'a pas changé", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: { "timeline.experience.demo": false } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const renders = [];

    render(
      <ItemVisibilityProvider>
        <Probe onRender={(state) => renders.push(state)} />
      </ItemVisibilityProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(renders.at(-1)?.ready).toBe(true));
    const stableRenderCount = renders.length;
    const stableHidden = renders.at(-1).hidden;

    window.dispatchEvent(new Event("portfolio:visibility-updated"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renders.length).toBe(stableRenderCount);
    expect(renders.at(-1).hidden).toBe(stableHidden);
  });

  it("reste fail-open sans republier un Set vide identique après une panne", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const renders = [];

    render(
      <ItemVisibilityProvider>
        <Probe onRender={(state) => renders.push(state)} />
      </ItemVisibilityProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(renders.at(-1)?.ready).toBe(true));
    const stableRenderCount = renders.length;
    const stableHidden = renders.at(-1).hidden;

    window.dispatchEvent(new Event("portfolio:visibility-updated"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renders.length).toBe(stableRenderCount);
    expect(renders.at(-1).hidden).toBe(stableHidden);
    expect(stableHidden.size).toBe(0);
  });
});
