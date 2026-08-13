import { describe, expect, test } from "vitest";
import { decideSmartPrefetch } from "./smartPrefetch";

describe("smart prefetch", () => {
  test("précharge un prochain écran probable sur une machine saine", () => {
    const result = decideSmartPrefetch({ probability: 0.9, cost: "medium", prefetchLevel: "normal", effectiveType: "4g" });
    expect(result.decision).toBe("prefetch");
  });

  test("ne gaspille pas de données ou de mémoire", () => {
    expect(decideSmartPrefetch({ probability: 0.99, saveData: true }).reason).toBe("save-data");
    expect(decideSmartPrefetch({ probability: 0.99, memoryState: "pressure" }).reason).toBe("memory-pressure");
    expect(decideSmartPrefetch({ probability: 0.99, effectiveType: "2g" }).reason).toBe("slow-network");
  });

  test("une ressource critique n'est jamais bloquée par la prédiction", () => {
    expect(decideSmartPrefetch({ probability: 0, cost: "extreme", critical: true, saveData: true }).decision).toBe("prefetch");
  });
});
