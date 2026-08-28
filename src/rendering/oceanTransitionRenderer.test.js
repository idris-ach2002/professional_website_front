import { describe, expect, it } from "vitest";
import { resolveScenePlan } from "./oceanTransitionRenderer";

describe("ocean transition prepared scene dispatch", () => {
  it.each([
    ["surface-deep", { kind: "pressure", reverse: false, direct: false }],
    ["deep-surface", { kind: "pressure", reverse: true, direct: false }],
    ["deep-caldera", { kind: "seismic", reverse: false, direct: false }],
    ["caldera-deep", { kind: "seismic", reverse: true, direct: false }],
    ["caldera-projects", { kind: "station", reverse: false, direct: false }],
    ["projects-caldera", { kind: "station", reverse: true, direct: false }],
    ["deep-projects", { kind: "station", reverse: false, direct: true }],
    ["projects-deep", { kind: "station", reverse: true, direct: true }],
    ["projects-outro", { kind: "mineral", reverse: false, direct: false }],
    ["outro-projects", { kind: "mineral", reverse: true, direct: false }],
  ])("prépare %s sans résolution de scène par frame", (key, expected) => {
    expect(resolveScenePlan(key)).toEqual(expected);
  });

  it("ignore proprement une scène inconnue", () => {
    expect(resolveScenePlan("unknown-transition")).toBeNull();
  });
});
