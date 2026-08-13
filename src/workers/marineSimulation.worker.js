import { stepMarinePopulation } from "../ocean/oceanWorldEngine";

let agents = [];
let generation = 0;

function serializeState(source) {
  const state = new Float32Array(source.length * 5);
  for (let index = 0; index < source.length; index += 1) {
    const agent = source[index];
    const offset = index * 5;
    state[offset] = agent.x;
    state[offset + 1] = agent.y;
    state[offset + 2] = agent.vx;
    state[offset + 3] = agent.vy;
    state[offset + 4] = agent.heading;
  }
  return state;
}

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message) return;

  if (message.type === "sync-marine-population") {
    generation = Number(message.generation || 0);
    agents = Array.isArray(message.agents) ? message.agents.map((agent) => ({ ...agent })) : [];
    self.postMessage({ type: "marine-population-synced", generation, count: agents.length });
    return;
  }

  if (message.type !== "step-marine-population") return;
  if (Number(message.generation || 0) !== generation) {
    self.postMessage({ type: "marine-step-stale", generation: Number(message.generation || 0) });
    return;
  }

  stepMarinePopulation(
    agents,
    Number(message.delta || 0),
    Number(message.elapsed || 0),
    message.biome,
    message.danger ?? {},
  );

  const state = serializeState(agents);
  self.postMessage({
    type: "marine-step-result",
    generation,
    requestId: Number(message.requestId || 0),
    count: agents.length,
    stateBuffer: state.buffer,
  }, [state.buffer]);
});
