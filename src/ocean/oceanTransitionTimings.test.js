import { describe, expect, test } from "vitest";
import {
  OCEAN_CINEMATIC_DURATIONS_MS,
  resolveOceanTransitionDurationMs,
  resolveOceanTransitionDurationSeconds,
} from "./oceanTransitionTimings";

describe("ocean transition timings", () => {
  test("utilise une source de vérité sous la seconde pour les transitions recruiter-first", () => {
    expect(Math.max(...Object.values(OCEAN_CINEMATIC_DURATIONS_MS))).toBeLessThan(1000);
    expect(resolveOceanTransitionDurationMs("deep", "caldera")).toBe(800);
    expect(resolveOceanTransitionDurationSeconds("projects", "outro")).toBeCloseTo(0.78, 4);
  });

  test("les retours sont plus courts et une transition identique vaut zéro", () => {
    expect(resolveOceanTransitionDurationMs("caldera", "deep")).toBeLessThan(
      resolveOceanTransitionDurationMs("deep", "caldera"),
    );
    expect(resolveOceanTransitionDurationMs("deep", "deep")).toBe(0);
  });
});
