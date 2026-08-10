import { describe, expect, it } from "vitest";
import {
  VOLCANO_PULSE_TYPES,
  VOLCANO_STAGES,
  createVolcanoParticles,
  createVolcanoSimulation,
  resolveVolcanoParticleCounts,
  resolveVolcanoStageProfile,
  stepVolcanoParticles,
  stepVolcanoSimulation,
} from "./volcanoSimulationEngine";

describe("volcano perpetual eruption engine", () => {
  it("reste en éruption permanente", () => {
    const simulation = createVolcanoSimulation(42);
    expect(VOLCANO_STAGES).toEqual(["eruption"]);
    for (let index = 0; index < 2400; index += 1) {
      stepVolcanoSimulation(simulation, 1 / 120);
      expect(simulation.stage).toBe("eruption");
    }
  });

  it("garde lave, cratère et fumée actifs même entre deux pulses", () => {
    const simulation = createVolcanoSimulation(0x8218);
    let minLava = Number.POSITIVE_INFINITY;
    let minPlume = Number.POSITIVE_INFINITY;
    let minCrater = Number.POSITIVE_INFINITY;
    for (let frame = 0; frame < 3600; frame += 1) {
      stepVolcanoSimulation(simulation, 1 / 120);
      const profile = resolveVolcanoStageProfile(simulation);
      minLava = Math.min(minLava, profile.lava);
      minPlume = Math.min(minPlume, profile.plume);
      minCrater = Math.min(minCrater, profile.crater);
    }
    expect(minLava).toBeGreaterThanOrEqual(0.96);
    expect(minPlume).toBeGreaterThanOrEqual(0.96);
    expect(minCrater).toBeGreaterThanOrEqual(1.02);
  });


  it("accentue la chaleur des veines pendant les pulses sans refroidir la base", () => {
    const simulation = createVolcanoSimulation(0x8218);
    const baseline = resolveVolcanoStageProfile(simulation);
    let peakLava = baseline.lava;
    let peakFracture = baseline.fracture;
    let peakHeat = baseline.heat;
    for (let frame = 0; frame < 420; frame += 1) {
      stepVolcanoSimulation(simulation, 1 / 120);
      const profile = resolveVolcanoStageProfile(simulation);
      peakLava = Math.max(peakLava, profile.lava);
      peakFracture = Math.max(peakFracture, profile.fracture);
      peakHeat = Math.max(peakHeat, profile.heat);
    }
    expect(baseline.lava).toBeGreaterThanOrEqual(0.96);
    expect(baseline.fracture).toBeGreaterThanOrEqual(0.96);
    expect(baseline.heat).toBeGreaterThanOrEqual(0.84);
    expect(peakLava).toBeGreaterThan(baseline.lava + 0.35);
    expect(peakFracture).toBeGreaterThan(baseline.fracture + 0.20);
    expect(peakHeat).toBeGreaterThan(baseline.heat + 0.35);
  });

  it("garde un panache continu stable, indépendant des méga-éruptions", () => {
    const simulation = createVolcanoSimulation(0x8218);
    const densities = [];
    const flows = [];
    let sawMega = false;
    for (let frame = 0; frame < 420; frame += 1) {
      stepVolcanoSimulation(simulation, 1 / 120);
      const profile = resolveVolcanoStageProfile(simulation);
      densities.push(profile.smokeDensity);
      flows.push(profile.smokeFlow);
      if (profile.pulseType === "mega") sawMega = true;
    }
    expect(sawMega).toBe(true);
    expect(Math.min(...densities)).toBeGreaterThanOrEqual(1.3);
    expect(Math.max(...densities) - Math.min(...densities)).toBeLessThan(0.001);
    expect(Math.max(...flows) - Math.min(...flows)).toBeLessThan(0.09);
  });

  it("déclenche une méga-éruption avant 2 secondes et une onde forte", () => {
    const simulation = createVolcanoSimulation(0x8218);
    let megaStartedAt = null;
    let peakPulse = 0;
    let peakShock = 0;
    for (let frame = 0; frame < 480; frame += 1) {
      stepVolcanoSimulation(simulation, 1 / 120);
      const profile = resolveVolcanoStageProfile(simulation);
      if (profile.pulseType === "mega" && megaStartedAt == null) megaStartedAt = simulation.elapsed;
      peakPulse = Math.max(peakPulse, profile.pulse);
      peakShock = Math.max(peakShock, profile.shock);
    }
    expect(megaStartedAt).not.toBeNull();
    expect(megaStartedAt).toBeLessThan(1.9);
    expect(peakPulse).toBeGreaterThan(1.3);
    expect(peakShock).toBeGreaterThan(1.5);
  });

  it("alterne des pulses organiques sans cadence mécanique", () => {
    const simulation = createVolcanoSimulation(0x8218);
    const starts = [];
    let previous = "base";
    for (let frame = 0; frame < 3600; frame += 1) {
      stepVolcanoSimulation(simulation, 1 / 120);
      const profile = resolveVolcanoStageProfile(simulation);
      if (profile.pulseType !== "base" && profile.pulseType !== previous) {
        starts.push({ kind: profile.pulseType, at: simulation.elapsed });
      }
      previous = profile.pulseType;
      if (simulation.elapsed > 24) break;
    }
    expect(starts.length).toBeGreaterThanOrEqual(8);
    expect(starts.map((item) => item.kind)).toEqual(expect.arrayContaining(["surge", "burst", "mega"]));
    expect(VOLCANO_PULSE_TYPES).toEqual(expect.arrayContaining(["base", "surge", "burst", "mega"]));
    const intervals = starts.slice(1).map((item, index) => item.at - starts[index].at);
    expect(Math.max(...intervals) - Math.min(...intervals)).toBeGreaterThan(1.5);
  });

  it("reste stable entre 60 et 120 Hz", () => {
    const sixty = createVolcanoSimulation(77);
    const oneTwenty = createVolcanoSimulation(77);
    for (let index = 0; index < 1200; index += 1) stepVolcanoSimulation(sixty, 1 / 60);
    for (let index = 0; index < 2400; index += 1) stepVolcanoSimulation(oneTwenty, 1 / 120);
    const profile60 = resolveVolcanoStageProfile(sixty);
    const profile120 = resolveVolcanoStageProfile(oneTwenty);
    expect(oneTwenty.stage).toBe(sixty.stage);
    expect(oneTwenty.pulseKind).toBe(sixty.pulseKind);
    expect(oneTwenty.elapsed).toBeCloseTo(sixty.elapsed, 4);
    expect(profile120.pulse).toBeCloseTo(profile60.pulse, 4);
    expect(profile120.lava).toBeCloseTo(profile60.lava, 4);
  });

  it("réduit fumée, sédiments et débris sous pression runtime", () => {
    const high = resolveVolcanoParticleCounts("high", "full");
    const constrained = resolveVolcanoParticleCounts("constrained", "full");
    expect(constrained.smoke).toBeLessThan(high.smoke);
    expect(constrained.ember).toBeLessThan(high.ember);
    expect(constrained.bubble).toBeLessThan(high.bubble);
    expect(constrained.sediment).toBeLessThan(high.sediment);
    expect(constrained.fragment).toBeLessThan(high.fragment);
  });

  it("préremplit un panache étroit et continu sans mushroom cloud", () => {
    const counts = { smoke: 40, vent: 0, ember: 0, ash: 0, bubble: 0, bio: 0, sediment: 0, fragment: 0 };
    const particles = createVolcanoParticles(1200, 720, counts, 0x7610);
    const layers = particles.map((particle) => particle.plumeLayer);
    expect(layers).toEqual(expect.arrayContaining(["hot", "main", "diffuse"]));
    expect(layers).not.toEqual(expect.arrayContaining(["cap", "crown"]));
    expect(Math.min(...particles.map((particle) => particle.y))).toBeLessThan(720 * 0.20);
    expect(Math.max(...particles.map((particle) => particle.alpha))).toBeGreaterThan(0.5);
    const spread = Math.max(...particles.map((particle) => Math.abs(particle.x - 600)));
    expect(spread).toBeLessThan(1200 * 0.06);
  });

  it("crée les particules de caldeira latérale", () => {
    const counts = { smoke: 1, vent: 1, ember: 1, ash: 1, bubble: 1, bio: 1, sediment: 1, fragment: 1 };
    const particles = createVolcanoParticles(1000, 600, counts, 91);
    expect(particles.map((particle) => particle.type)).toEqual(expect.arrayContaining(["vent", "sediment", "fragment"]));
  });

  it("fait évoluer les particules de façon cohérente", () => {
    const counts = { smoke: 1, vent: 1, ember: 1, ash: 1, bubble: 1, bio: 1, sediment: 1, fragment: 1 };
    const a = createVolcanoParticles(1000, 600, counts, 91);
    const b = createVolcanoParticles(1000, 600, counts, 91);
    const simulation = createVolcanoSimulation(9);
    const profile = resolveVolcanoStageProfile(simulation);
    for (let index = 0; index < 60; index += 1) {
      stepVolcanoParticles(a, 1 / 60, 1000, 600, (index + 1) / 60, profile, 123);
    }
    for (let index = 0; index < 120; index += 1) {
      stepVolcanoParticles(b, 1 / 120, 1000, 600, (index + 1) / 120, profile, 123);
    }
    expect(a[0].y).toBeCloseTo(b[0].y, 0);
  });
});
