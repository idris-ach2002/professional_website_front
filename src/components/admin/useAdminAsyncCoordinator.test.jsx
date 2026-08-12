import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useAdminAsyncCoordinator from "./useAdminAsyncCoordinator";
import { ConcurrencyConflictError } from "../../services/authApi";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderCoordinator() {
  const setters = {
    setLoading: vi.fn(),
    setMessage: vi.fn(),
    setError: vi.fn(),
    setAuthStatus: vi.fn(),
  };
  const hook = renderHook(() => useAdminAsyncCoordinator(setters));
  return { ...hook, setters };
}

describe("useAdminAsyncCoordinator", () => {
  it("implements latest-wins reads and aborts the obsolete lane", async () => {
    const { result } = renderCoordinator();
    const firstDeferred = deferred();
    let firstSignal;

    let first;
    let second;
    await act(async () => {
      first = result.current.runLatest("versions", ({ signal }) => {
        firstSignal = signal;
        return firstDeferred.promise;
      });
      second = result.current.runLatest("versions", async () => "fresh");
    });

    expect(firstSignal.aborted).toBe(true);
    firstDeferred.resolve("stale");

    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toBe("fresh");
  });


  it("never commits state from an obsolete latest-wins generation", async () => {
    const { result } = renderCoordinator();
    const gate = deferred();
    const commits = [];

    let first;
    let second;
    await act(async () => {
      first = result.current.runLatest("owners", async ({ commit }) => {
        await gate.promise;
        commit(() => commits.push("stale"));
        return "stale";
      });
      second = result.current.runLatest("owners", async ({ commit }) => {
        commit(() => commits.push("fresh"));
        return "fresh";
      });
    });

    gate.resolve();
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(commits).toEqual(["fresh"]);
    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toBe("fresh");
  });

  it("serializes mutations instead of letting writes race", async () => {
    const { result } = renderCoordinator();
    const gate = deferred();
    const order = [];

    let first;
    let second;
    await act(async () => {
      first = result.current.runMutation(async () => {
        order.push("first:start");
        await gate.promise;
        order.push("first:end");
        return 1;
      });
      second = result.current.runMutation(async () => {
        order.push("second:start");
        return 2;
      });
      await Promise.resolve();
    });

    expect(order).toEqual(["first:start"]);
    gate.resolve();
    await act(async () => {
      await Promise.all([first, second]);
    });
    expect(order).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("keeps loading true until every overlapping action is complete", async () => {
    const { result, setters } = renderCoordinator();
    const a = deferred();
    const b = deferred();

    let one;
    let two;
    await act(async () => {
      one = result.current.runAction(() => a.promise);
      two = result.current.runAction(() => b.promise);
    });
    expect(setters.setLoading).toHaveBeenLastCalledWith(true);

    a.resolve("a");
    await act(async () => { await one; });
    expect(setters.setLoading).toHaveBeenLastCalledWith(true);

    b.resolve("b");
    await act(async () => { await two; });
    expect(setters.setLoading).toHaveBeenLastCalledWith(false);
  });

  it("surfaces optimistic-concurrency conflicts distinctly", async () => {
    const { result, setters } = renderCoordinator();

    await act(async () => {
      await result.current.runAction(async () => {
        throw new ConcurrencyConflictError("stale", { status: 412 });
      });
    });

    expect(setters.setError).toHaveBeenCalledWith(expect.stringContaining("Modification concurrente"));
  });
});
