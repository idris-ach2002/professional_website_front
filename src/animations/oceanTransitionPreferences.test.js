import { describe, expect, it } from "vitest";
import {
  DEFAULT_OCEAN_TRANSITION_PREFERENCES,
  isOceanTransitionEnabled,
  normalizeOceanTransitionPreferences,
  preferenceKeyForOceanScene,
} from "./oceanTransitionPreferences";

describe("oceanTransitionPreferences", () => {
  it("keeps every transition enabled by default", () => {
    expect(normalizeOceanTransitionPreferences(null)).toEqual(DEFAULT_OCEAN_TRANSITION_PREFERENCES);
    expect(isOceanTransitionEnabled(null, "surface-deep")).toBe(true);
  });

  it("maps both directions of a seam to the same preference", () => {
    expect(preferenceKeyForOceanScene("surface-deep")).toBe("profileTimeline");
    expect(preferenceKeyForOceanScene("deep-surface")).toBe("profileTimeline");
  });

  it("lets the master switch disable every cinematic without deleting individual choices", () => {
    const preferences = normalizeOceanTransitionPreferences({ master: false, profileTimeline: true });
    expect(preferences.profileTimeline).toBe(true);
    expect(isOceanTransitionEnabled(preferences, "surface-deep")).toBe(false);
  });

  it("disables one seam independently", () => {
    const preferences = normalizeOceanTransitionPreferences({ profileTimeline: false });
    expect(isOceanTransitionEnabled(preferences, "surface-deep")).toBe(false);
    expect(isOceanTransitionEnabled(preferences, "caldera-projects")).toBe(true);
  });
});
