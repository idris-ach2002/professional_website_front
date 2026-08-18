import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./runtimeScheduler.js", () => ({
  scheduleBackgroundTask: vi.fn((task) => Promise.resolve().then(task)),
}));

import { scheduleOceanTransitionOffscreen } from "./oceanTransitionOffscreenController";

describe("ocean transition OffscreenCanvas protocol", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 720 });
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
  });

  it("transfère exactement le canvas et initialise le Worker avec le viewport borné", async () => {
    const offscreen = { kind: "offscreen-fixture" };
    const postMessage = vi.fn();
    const terminate = vi.fn();

    class FakeWorker {
      constructor(url, options) {
        this.url = url;
        this.options = options;
        this.postMessage = postMessage;
        this.terminate = terminate;
      }
    }
    vi.stubGlobal("Worker", FakeWorker);

    const canvas = {
      width: 0,
      height: 0,
      style: {},
      transferControlToOffscreen: vi.fn(() => offscreen),
    };

    const result = await scheduleOceanTransitionOffscreen(
      canvas,
      "balanced",
      new AbortController().signal,
    );

    expect(canvas.transferControlToOffscreen).toHaveBeenCalledTimes(1);
    expect(result.viewport).toEqual({ width: 1280, height: 720, dpr: 1.05 });
    expect(canvas.width).toBe(1344);
    expect(canvas.height).toBe(756);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0]).toEqual({
      type: "init",
      canvas: offscreen,
      viewport: result.viewport,
    });
    expect(postMessage.mock.calls[0][1]).toEqual([offscreen]);
    expect(terminate).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("termine le Worker si le transfert échoue et propage l'erreur", async () => {
    const terminate = vi.fn();
    class FakeWorker {
      postMessage() {}
      terminate() { terminate(); }
    }
    vi.stubGlobal("Worker", FakeWorker);

    const error = new Error("transfer denied");
    const canvas = {
      width: 0,
      height: 0,
      style: {},
      transferControlToOffscreen: vi.fn(() => { throw error; }),
    };

    await expect(scheduleOceanTransitionOffscreen(
      canvas,
      "high",
      new AbortController().signal,
    )).rejects.toBe(error);
    expect(terminate).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
