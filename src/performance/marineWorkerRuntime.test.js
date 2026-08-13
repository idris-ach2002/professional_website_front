import { describe, expect, test } from "vitest";
import { applyMarineStateBuffer, createMarineWorkerRuntime } from "./marineWorkerRuntime";

describe("marine worker runtime", () => {
  test("applique un snapshot transféré sans remplacer les métadonnées des agents", () => {
    const agents = [
      { id: "a", species: "reef", x: 0, y: 0, vx: 0, vy: 0, heading: 1 },
      { id: "b", species: "ray", x: 0, y: 0, vx: 0, vy: 0, heading: -1 },
    ];
    const state = new Float32Array([
      0.1, 0.2, 0.3, 0.4, 1,
      0.5, 0.6, -0.3, 0.2, -1,
    ]);

    expect(applyMarineStateBuffer(agents, state.buffer, 2)).toBe(true);
    expect(agents[0]).toMatchObject({ id: "a", species: "reef", heading: 1 });
    expect(agents[0].x).toBeCloseTo(0.1);
    expect(agents[0].y).toBeCloseTo(0.2);
    expect(agents[1].species).toBe("ray");
    expect(agents[1].x).toBeCloseTo(0.5);
  });

  test("bascule le Worker en échec déterministe lorsqu'une réponse reste bloquée", () => {
    let clock = 10;
    const statuses = [];

    class SilentWorker {
      constructor() {
        this.listeners = new Map();
        this.terminated = false;
      }

      addEventListener(type, listener) {
        this.listeners.set(type, listener);
      }

      postMessage() {}

      terminate() {
        this.terminated = true;
      }
    }

    const runtime = createMarineWorkerRuntime({
      WorkerClass: SilentWorker,
      now: () => clock,
      stallTimeoutMs: 100,
      onStatus: (status) => statuses.push(status),
    });

    expect(runtime.sync([{ x: 0, y: 0, vx: 0, vy: 0, heading: 1 }])).toBe(true);
    expect(runtime.getStatus().failed).toBe(false);

    clock = 111;
    expect(runtime.getStatus()).toMatchObject({ failed: true, inFlight: false, ready: false });
    expect(statuses.at(-1)).toMatchObject({ status: "failed", reason: "worker-stall" });
    expect(runtime.step({ delta: 0.016 })).toBe(false);
  });

  test("accorde au démarrage du Worker un budget plus large qu'à une frame", () => {
    let clock = 10;

    class DelayedWorker {
      static instance;

      constructor() {
        this.listeners = new Map();
        DelayedWorker.instance = this;
      }

      addEventListener(type, listener) {
        this.listeners.set(type, listener);
      }

      postMessage() {}

      emit(type, data) {
        this.listeners.get(type)?.({ data });
      }

      terminate() {}
    }

    const runtime = createMarineWorkerRuntime({
      WorkerClass: DelayedWorker,
      now: () => clock,
      syncTimeoutMs: 2_500,
      stepTimeoutMs: 900,
    });

    expect(runtime.sync([{ x: 0, y: 0, vx: 0, vy: 0, heading: 1 }])).toBe(true);
    clock = 1_500;
    expect(runtime.getStatus()).toMatchObject({
      failed: false,
      pendingOperation: "sync",
      timeoutMs: 2_500,
    });

    DelayedWorker.instance.emit("message", {
      type: "marine-population-synced",
      generation: 1,
      count: 1,
    });
    clock = 1_600;
    expect(runtime.step({ delta: 0.016, elapsed: 1, biome: "reef" })).toBe(true);
    clock = 2_250;
    expect(runtime.getStatus()).toMatchObject({
      failed: false,
      pendingOperation: "step",
      timeoutMs: 900,
    });

    runtime.terminate();
  });

  test("synchronise, calcule puis restitue un état marin transféré", () => {
    let clock = 10;
    const states = [];
    const statuses = [];

    class ResponsiveWorker {
      static instance;

      constructor() {
        this.listeners = new Map();
        this.messages = [];
        this.terminated = false;
        ResponsiveWorker.instance = this;
      }

      addEventListener(type, listener) {
        this.listeners.set(type, listener);
      }

      postMessage(message) {
        this.messages.push(message);
      }

      emit(type, data) {
        this.listeners.get(type)?.({ data });
      }

      terminate() {
        this.terminated = true;
      }
    }

    const runtime = createMarineWorkerRuntime({
      WorkerClass: ResponsiveWorker,
      now: () => clock,
      onState: (...args) => states.push(args),
      onStatus: (status) => statuses.push(status),
    });
    const worker = ResponsiveWorker.instance;

    expect(runtime.sync([{ x: 0, y: 0, vx: 0, vy: 0, heading: 1 }])).toBe(true);
    expect(worker.messages[0]).toMatchObject({ type: "sync-marine-population", generation: 1 });

    worker.emit("message", { type: "marine-population-synced", generation: 1, count: 1 });
    expect(runtime.getStatus()).toMatchObject({ ready: true, failed: false, inFlight: false });

    clock = 20;
    expect(runtime.step({ delta: 0.016, elapsed: 1, biome: "reef", danger: { danger: 0 } })).toBe(true);
    const state = new Float32Array([0.1, 0.2, 0.3, 0.4, 1]);
    clock = 23;
    worker.emit("message", {
      type: "marine-step-result",
      generation: 1,
      requestId: 1,
      count: 1,
      stateBuffer: state.buffer,
    });

    expect(states).toHaveLength(1);
    expect(states[0][1]).toBe(1);
    expect(states[0][2]).toMatchObject({ generation: 1, requestId: 1, latencyMs: 3 });
    expect(statuses.at(-1)).toMatchObject({ status: "active", ready: true, failed: false });

    runtime.terminate();
    expect(worker.terminated).toBe(true);
    expect(statuses.at(-1).status).toBe("terminated");
  });
});
