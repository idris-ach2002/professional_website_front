/* One-shot architecture layout worker.
 * It computes a readable arrangement, returns final positions, then the caller
 * terminates the worker. No continuous physics loop remains alive afterwards.
 */

const LAYER_ORDER = {
  "front:expérience": 0,
  "front:livraison": 1,
  "back:application": 2,
  "back:données": 3,
  "back:asynchrone": 4,
  "back:livraison": 5,
};

const LAYER_Y = {
  "front:expérience": 14,
  "front:livraison": 30,
  "back:application": 48,
  "back:données": 64,
  "back:asynchrone": 79,
  "back:livraison": 92,
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function degreeMap(nodes, links) {
  const degree = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  links.forEach((link) => {
    degree[link.source] = (degree[link.source] ?? 0) + 1;
    degree[link.target] = (degree[link.target] ?? 0) + 1;
  });
  return degree;
}

function adjacency(nodes, links, directed = false) {
  const map = new Map(nodes.map((node) => [node.id, []]));
  links.forEach((link) => {
    map.get(link.source)?.push(link.target);
    if (!directed) map.get(link.target)?.push(link.source);
  });
  return map;
}

function topologicalDepth(nodes, links) {
  const incoming = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  links.forEach((link) => {
    if (!(link.source in incoming) || !(link.target in incoming)) return;
    incoming[link.target] += 1;
    outgoing.get(link.source)?.push(link.target);
  });
  const queue = nodes.filter((node) => incoming[node.id] === 0).map((node) => node.id);
  const depth = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  const visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    visited.add(id);
    (outgoing.get(id) ?? []).forEach((target) => {
      depth[target] = Math.max(depth[target] ?? 0, (depth[id] ?? 0) + 1);
      incoming[target] -= 1;
      if (incoming[target] === 0) queue.push(target);
    });
  }
  // The graph can contain semantic cross-links. Relax remaining nodes instead
  // of allowing a cycle to explode the depth indefinitely.
  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    links.forEach((link) => {
      if (visited.has(link.target)) return;
      const next = Math.min(8, (depth[link.source] ?? 0) + 1);
      if (next > (depth[link.target] ?? 0)) {
        depth[link.target] = next;
        changed = true;
      }
    });
    if (!changed) break;
  }
  return depth;
}

function spread(items, axisStart, axisEnd) {
  if (!items.length) return [];
  if (items.length === 1) return [(axisStart + axisEnd) / 2];
  return items.map((_, index) => axisStart + ((axisEnd - axisStart) * index / (items.length - 1)));
}

function semanticSeed(nodes, links) {
  const depth = topologicalDepth(nodes, links);
  const neighbours = adjacency(nodes, links);
  const positions = {};
  const rows = new Map();
  nodes.forEach((node) => {
    const key = `${node.community}:${node.layer}`;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(node);
  });
  [...rows.entries()].sort((a, b) => (LAYER_ORDER[a[0]] ?? 99) - (LAYER_ORDER[b[0]] ?? 99)).forEach(([key, items]) => {
    items.sort((a, b) => (depth[a.id] ?? 0) - (depth[b.id] ?? 0) || a.id.localeCompare(b.id));
    const xs = spread(items, items.length <= 2 ? 28 : 11, items.length <= 2 ? 72 : 89);
    items.forEach((node, index) => { positions[node.id] = [xs[index], LAYER_Y[key] ?? 50]; });
  });
  // Barycentric ordering reduces crossings before the finite force pass.
  for (let pass = 0; pass < 7; pass += 1) {
    [...rows.entries()].forEach(([key, items]) => {
      if (items.length < 2) return;
      items.sort((a, b) => {
        const barycenter = (node) => {
          const connected = neighbours.get(node.id) ?? [];
          if (!connected.length) return positions[node.id]?.[0] ?? 50;
          return connected.reduce((sum, id) => sum + (positions[id]?.[0] ?? 50), 0) / connected.length;
        };
        return barycenter(a) - barycenter(b) || (depth[a.id] ?? 0) - (depth[b.id] ?? 0);
      });
      const xs = spread(items, items.length <= 2 ? 28 : 11, items.length <= 2 ? 72 : 89);
      items.forEach((node, index) => { positions[node.id] = [xs[index], LAYER_Y[key] ?? 50]; });
    });
  }
  return positions;
}

function flowSeed(nodes, links) {
  const depth = topologicalDepth(nodes, links);
  const maxDepth = Math.max(1, ...Object.values(depth));
  const groups = new Map();
  nodes.forEach((node) => {
    const d = depth[node.id] ?? 0;
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(node);
  });
  const positions = {};
  [...groups.entries()].sort((a, b) => a[0] - b[0]).forEach(([d, items]) => {
    items.sort((a, b) => (a.community === b.community ? 0 : a.community === "front" ? -1 : 1) || (LAYER_ORDER[`${a.community}:${a.layer}`] ?? 0) - (LAYER_ORDER[`${b.community}:${b.layer}`] ?? 0));
    const ys = spread(items, 10, 91);
    items.forEach((node, index) => {
      const x = 8 + ((84 * d) / maxDepth);
      positions[node.id] = [x, ys[index]];
    });
  });
  return positions;
}

function communitiesSeed(nodes) {
  const positions = {};
  const groups = [
    { id: "front", nodes: nodes.filter((node) => node.community === "front"), left: 8, right: 46, top: 8, bottom: 43 },
    { id: "back", nodes: nodes.filter((node) => node.community === "back"), left: 52, right: 92, top: 48, bottom: 94 },
  ];
  groups.forEach((group) => {
    const columns = Math.max(2, Math.ceil(Math.sqrt(group.nodes.length)));
    const rows = Math.ceil(group.nodes.length / columns);
    group.nodes
      .sort((a, b) => (LAYER_ORDER[`${a.community}:${a.layer}`] ?? 0) - (LAYER_ORDER[`${b.community}:${b.layer}`] ?? 0) || a.id.localeCompare(b.id))
      .forEach((node, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = group.left + ((group.right - group.left) * (column + .5) / columns);
        const y = group.top + ((group.bottom - group.top) * (row + .5) / Math.max(1, rows));
        positions[node.id] = [x, y];
      });
  });
  return positions;
}

function radialSeed(nodes, links) {
  const degree = degreeMap(nodes, links);
  const sorted = [...nodes].sort((a, b) => (degree[b.id] ?? 0) - (degree[a.id] ?? 0));
  const hub = sorted[0];
  const positions = { [hub.id]: [50, 50] };
  const front = sorted.slice(1).filter((node) => node.community === "front");
  const back = sorted.slice(1).filter((node) => node.community === "back");
  const placeArc = (items, start, end, radiusX, radiusY) => {
    items.forEach((node, index) => {
      const t = items.length === 1 ? .5 : index / (items.length - 1);
      const angle = start + (end - start) * t;
      positions[node.id] = [50 + Math.cos(angle) * radiusX, 50 + Math.sin(angle) * radiusY];
    });
  };
  placeArc(front, Math.PI * 1.08, Math.PI * 1.92, 39, 36);
  placeArc(back, Math.PI * .08, Math.PI * .92, 39, 40);
  return positions;
}

function deploymentSeed(nodes) {
  const positions = {};
  const frontChain = ["frontRepo", "frontCi", "edge", "react", "browser", "visitor"].filter((id) => nodes.some((node) => node.id === id));
  const backChain = ["backRepo", "backCi", "docker", "api", "services", "postgres"].filter((id) => nodes.some((node) => node.id === id));
  spread(frontChain, 10, 90).forEach((x, index) => { positions[frontChain[index]] = [x, 22]; });
  spread(backChain, 10, 90).forEach((x, index) => { positions[backChain[index]] = [x, 67]; });
  const remaining = nodes.filter((node) => !positions[node.id]);
  const xs = spread(remaining, 13, 87);
  remaining.forEach((node, index) => { positions[node.id] = [xs[index], node.community === "front" ? 39 : 88]; });
  return positions;
}

function compactSeed(nodes) {
  const positions = {};
  const sorted = [...nodes].sort((a, b) => (a.community === b.community ? 0 : a.community === "front" ? -1 : 1) || (LAYER_ORDER[`${a.community}:${a.layer}`] ?? 0) - (LAYER_ORDER[`${b.community}:${b.layer}`] ?? 0));
  const columns = 5;
  const rows = Math.ceil(sorted.length / columns);
  sorted.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions[node.id] = [9 + (82 * (column + .5) / columns), 8 + (84 * (row + .5) / rows)];
  });
  return positions;
}

function boundsFor(node, layout) {
  if (["radial", "flow", "compact", "deployment"].includes(layout)) return [6, 94];
  return node.community === "front" ? [6, 41] : [43, 96];
}

function refine(nodes, links, seed, { width = 1400, height = 1580, layout = "architecture", iterations = 175 } = {}) {
  // Hot one-shot path: use packed numeric buffers so every iteration reuses the
  // same memory instead of rebuilding {id:[x,y]} force/velocity objects.
  const count = nodes.length;
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const degree = degreeMap(nodes, links);
  const positions = new Float64Array(count * 2);
  const anchors = new Float64Array(count * 2);
  const velocities = new Float64Array(count * 2);
  const forces = new Float64Array(count * 2);
  const masses = new Float64Array(count);
  const minYs = new Float64Array(count);
  const maxYs = new Float64Array(count);
  const sx = Math.max(8, width / 100);
  const sy = Math.max(8, height / 100);
  const cardW = clamp(238 / sx, 13, 24);
  const cardH = clamp(132 / sy, 6.5, 11.5);
  const anchorStrength = layout === "architecture" ? .018 : layout === "communities" ? .026 : .034;

  nodes.forEach((node, index) => {
    const point = seed[node.id] ?? [50, 50];
    const offset = index * 2;
    positions[offset] = anchors[offset] = point[0];
    positions[offset + 1] = anchors[offset + 1] = point[1];
    masses[index] = 1 + Math.sqrt(degree[node.id] || 0);
    const bounds = boundsFor(node, layout);
    minYs[index] = bounds[0];
    maxYs[index] = bounds[1];
  });

  const linkData = links.map((link) => ({
    source: indexById.get(link.source),
    target: indexById.get(link.target),
    distance: link.flows?.includes("deploy") ? 285 : 235,
  })).filter((link) => Number.isInteger(link.source) && Number.isInteger(link.target));

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const cooling = Math.max(.12, 1 - iteration / iterations);
    forces.fill(0);

    for (let i = 0; i < count; i += 1) {
      const offset = i * 2;
      forces[offset] += (anchors[offset] - positions[offset]) * anchorStrength;
      forces[offset + 1] += (anchors[offset + 1] - positions[offset + 1]) * anchorStrength;
    }

    for (let i = 0; i < count; i += 1) {
      const ai = i * 2;
      for (let j = i + 1; j < count; j += 1) {
        const bi = j * 2;
        let dx = positions[bi] - positions[ai];
        let dy = positions[bi + 1] - positions[ai + 1];
        if (Math.abs(dx) < .01 && Math.abs(dy) < .01) { dx = (j - i) * .04; dy = .03; }
        const distancePx = Math.max(22, Math.hypot(dx * sx, dy * sy));
        const repulsion = Math.min(.16, (17000 * masses[i] * masses[j] / (distancePx * distancePx)) * .012) * cooling;
        const ux = dx * sx / distancePx;
        const uy = dy * sy / distancePx;
        const fx = ux * repulsion;
        const fy = uy * repulsion;
        forces[ai] -= fx; forces[ai + 1] -= fy;
        forces[bi] += fx; forces[bi + 1] += fy;

        const overlapX = cardW - Math.abs(dx);
        const overlapY = cardH - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const push = (dx >= 0 ? 1 : -1) * overlapX * .15;
            forces[ai] -= push; forces[bi] += push;
          } else {
            const push = (dy >= 0 ? 1 : -1) * overlapY * .15;
            forces[ai + 1] -= push; forces[bi + 1] += push;
          }
        }
      }
    }

    for (let index = 0; index < linkData.length; index += 1) {
      const link = linkData[index];
      const ai = link.source * 2;
      const bi = link.target * 2;
      const dx = positions[bi] - positions[ai];
      const dy = positions[bi + 1] - positions[ai + 1];
      const distancePx = Math.max(1, Math.hypot(dx * sx, dy * sy));
      const error = (distancePx - link.distance) / link.distance;
      const strength = .05 * cooling;
      const fx = dx * sx / distancePx * error * strength;
      const fy = dy * sy / distancePx * error * strength;
      forces[ai] += fx; forces[ai + 1] += fy;
      forces[bi] -= fx; forces[bi + 1] -= fy;
    }

    for (let i = 0; i < count; i += 1) {
      const offset = i * 2;
      let vx = (velocities[offset] + forces[offset]) * .72;
      let vy = (velocities[offset + 1] + forces[offset + 1]) * .72;
      const speed = Math.hypot(vx, vy);
      if (speed > 1) { vx /= speed; vy /= speed; }
      velocities[offset] = vx;
      velocities[offset + 1] = vy;
      positions[offset] = clamp(positions[offset] + vx, 8, 92);
      positions[offset + 1] = clamp(positions[offset + 1] + vy, minYs[i], maxYs[i]);
    }
  }

  const result = {};
  nodes.forEach((node, index) => {
    const offset = index * 2;
    result[node.id] = [positions[offset], positions[offset + 1]];
  });
  return result;
}

function compute(layout, nodes, links, width, height) {
  let seed;
  switch (layout) {
    case "flow": seed = flowSeed(nodes, links); break;
    case "communities": seed = communitiesSeed(nodes); break;
    case "radial": seed = radialSeed(nodes, links); break;
    case "deployment": seed = deploymentSeed(nodes); break;
    case "compact": seed = compactSeed(nodes); break;
    case "architecture":
    default: seed = semanticSeed(nodes, links); break;
  }
  const iterations = layout === "radial" ? 90 : layout === "compact" ? 70 : 165;
  return { positions: refine(nodes, links, seed, { width, height, layout, iterations }), iterations };
}

onmessage = (event) => {
  const message = event.data ?? {};
  if (message.type !== "compute") return;
  const startedAt = performance.now();
  const nodes = Array.isArray(message.nodes) ? message.nodes : [];
  const links = Array.isArray(message.links) ? message.links : [];
  const layout = message.layout || "architecture";
  const result = compute(layout, nodes, links, Number(message.width) || 1400, Number(message.height) || 1580);
  postMessage({
    type: "result",
    layout,
    positions: result.positions,
    meta: { iterations: result.iterations, durationMs: performance.now() - startedAt },
  });
};
