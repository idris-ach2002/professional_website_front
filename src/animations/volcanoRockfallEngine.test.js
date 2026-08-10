import { describe, expect, test } from "vitest";
import { createVolcanoRockfall, resolveRockfallLimit, stepVolcanoRockfall } from "./volcanoRockfallEngine";

describe("volcano persistent rockfall", () => {
  test("les roches se déposent au fond au lieu d'être recyclées", () => {
    const runtime = createVolcanoRockfall(42);
    const profile = { shock: 1.2, pulse: 1.4, heat: 1.3 };
    let elapsed = 0;
    let settled = 0;
    for (let frame = 0; frame < 1800; frame += 1) {
      elapsed += 1 / 120;
      settled += stepVolcanoRockfall(runtime, 1 / 120, 1200, 700, elapsed, profile, 14).length;
    }
    expect(settled).toBeGreaterThan(0);
    expect(runtime.settledCount).toBe(settled);
  });


  test("les débris utilisent plusieurs catégories sans recyclage visuel", () => {
    const runtime = createVolcanoRockfall(77);
    const profile = { shock: 1.1, pulse: 1.5, heat: 1.4, pulseType: "mega" };
    let elapsed = 0;
    const kinds = new Set();
    for (let frame = 0; frame < 1200; frame += 1) {
      elapsed += 1 / 120;
      const settled = stepVolcanoRockfall(runtime, 1 / 120, 1200, 700, elapsed, profile, 22);
      for (const rock of [...runtime.active, ...settled]) kinds.add(rock.kind);
    }
    expect([...kinds].every((kind) => ["dust", "hot", "basalt", "mega"].includes(kind))).toBe(true);
    expect(kinds).toEqual(new Set(["dust", "hot", "basalt", "mega"]));
  });

  test("le governor borne le nombre de fragments dynamiques", () => {
    expect(resolveRockfallLimit("high", "full")).toBeGreaterThan(resolveRockfallLimit("balanced", "full"));
    expect(resolveRockfallLimit("balanced", "full")).toBeGreaterThan(resolveRockfallLimit("constrained", "full"));
  });
});
