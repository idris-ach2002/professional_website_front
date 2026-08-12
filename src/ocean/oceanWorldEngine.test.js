import { describe, expect, test } from "vitest";
import {
  OCEAN_BIOMES,
  OCEAN_WORLD_ANCHOR_IDS,
  createMarineAgent,
  biomeFromSectionId,
  createMarinePopulation,
  resolveBiomeTransitionDuration,
  resolveMarinePopulation,
  resolveViewportBiome,
  sampleOceanCurrent,
  stepMarinePopulation,
} from "./oceanWorldEngine";

describe("living ocean world", () => {
  test("un poisson spawn à gauche regarde et nage vers la droite", () => {
    const agent = createMarineAgent(0, OCEAN_BIOMES.SURFACE, 123, { spawnLeft: true });
    expect(agent.vx).toBeGreaterThan(0);
    expect(agent.heading).toBe(1);
  });

  test("l'orientation reste cohérente avec la vitesse horizontale", () => {
    const agents = createMarinePopulation(6, OCEAN_BIOMES.DEEP, 84);
    let elapsed = 0;
    for (let frame = 0; frame < 240; frame += 1) {
      elapsed += 1 / 120;
      stepMarinePopulation(agents, 1 / 120, elapsed, OCEAN_BIOMES.DEEP);
    }
    for (const agent of agents) {
      if (agent.vx > 0.006) expect(agent.heading).toBe(1);
      if (agent.vx < -0.006) expect(agent.heading).toBe(-1);
    }
  });

  test("le courant partagé reste borné", () => {
    for (const biome of Object.values(OCEAN_BIOMES)) {
      const current = sampleOceanCurrent(0.5, 0.5, 42, biome);
      expect(Math.abs(current.x)).toBeLessThan(0.5);
      expect(Math.abs(current.y)).toBeLessThan(0.25);
    }
  });


  test("les ponts visuels déclenchent le biome suivant avant la section cible", () => {
    expect(biomeFromSectionId("ocean-transition-deep")).toBe(OCEAN_BIOMES.DEEP);
    expect(biomeFromSectionId("ocean-transition-caldera")).toBe(OCEAN_BIOMES.CALDERA);
    expect(biomeFromSectionId("ocean-transition-projects")).toBe(OCEAN_BIOMES.PROJECTS);
    expect(biomeFromSectionId("projects")).toBe(OCEAN_BIOMES.PROJECTS);
    expect(biomeFromSectionId("ocean-transition-outro")).toBe(OCEAN_BIOMES.OUTRO);
    expect(biomeFromSectionId("ocean-outro")).toBe(OCEAN_BIOMES.OUTRO);
    expect(resolveBiomeTransitionDuration(OCEAN_BIOMES.PROJECTS, OCEAN_BIOMES.OUTRO)).toBeCloseTo(0.78, 4);
  });


  test("les gates permanents pilotent le biome sans dépendre des composants différés", () => {
    expect(OCEAN_WORLD_ANCHOR_IDS).toEqual([
      "profile",
      "skills",
      "ocean-transition-deep",
      "ocean-transition-caldera",
      "ocean-transition-projects",
      "ocean-transition-outro",
    ]);

    const anchors = [
      { id: "profile", top: -900 },
      { id: "skills", top: -500 },
      { id: "ocean-transition-deep", top: -200 },
      { id: "ocean-transition-caldera", top: 300 },
      { id: "ocean-transition-projects", top: 1_100 },
      { id: "ocean-transition-outro", top: 1_900 },
    ];

    expect(resolveViewportBiome(anchors, OCEAN_BIOMES.SURFACE, 450)).toBe(
      OCEAN_BIOMES.CALDERA,
    );

    const beforeCaldera = anchors.map((anchor) => (
      anchor.id === "ocean-transition-caldera"
        ? { ...anchor, top: 700 }
        : anchor
    ));

    expect(resolveViewportBiome(beforeCaldera, OCEAN_BIOMES.SURFACE, 450)).toBe(
      OCEAN_BIOMES.DEEP,
    );
  });

  test("un gate centré gagne immédiatement et un gate futur ne gagne pas", () => {
    const focusY = 450;
    const centeredDeep = [
      { id: "profile", top: -800 },
      { id: "skills", top: -240 },
      { id: "ocean-transition-deep", top: focusY - 0.5 },
      { id: "ocean-transition-caldera", top: 1_200 },
    ];

    expect(resolveViewportBiome(centeredDeep, OCEAN_BIOMES.SURFACE, focusY)).toBe(
      OCEAN_BIOMES.DEEP,
    );

    expect(resolveViewportBiome([
      { id: "ocean-transition-deep", top: focusY + 80 },
    ], OCEAN_BIOMES.SURFACE, focusY)).toBe(OCEAN_BIOMES.SURFACE);
  });

  test("le governor réduit la population", () => {
    expect(resolveMarinePopulation("high", "full", false)).toBeGreaterThan(
      resolveMarinePopulation("balanced", "full", false),
    );
    expect(resolveMarinePopulation("balanced", "full", false)).toBeGreaterThan(
      resolveMarinePopulation("constrained", "full", false),
    );
  });
});
