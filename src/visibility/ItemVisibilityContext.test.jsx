import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemVisibilityProvider } from "./ItemVisibilityContext";
import { useItemVisibility } from "./useItemVisibility";

function Probe({ onRender }) {
  const state = useItemVisibility();
  onRender(state);
  return <span data-testid="ready">{String(state.ready)}</span>;
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function runInitialRefresh() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  await flushMicrotasks();
}

describe("ItemVisibilityProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

    await runInitialRefresh();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(renders.at(-1)?.ready).toBe(true);
    const stableRenderCount = renders.length;
    const stableHidden = renders.at(-1).hidden;

    act(() => window.dispatchEvent(new Event("portfolio:visibility-updated")));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await flushMicrotasks();

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

    await runInitialRefresh();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(renders.at(-1)?.ready).toBe(true);
    const stableRenderCount = renders.length;
    const stableHidden = renders.at(-1).hidden;

    act(() => window.dispatchEvent(new Event("portfolio:visibility-updated")));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await flushMicrotasks();

    expect(renders.length).toBe(stableRenderCount);
    expect(renders.at(-1).hidden).toBe(stableHidden);
    expect(stableHidden.size).toBe(0);
  });
});
