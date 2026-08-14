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
  const positions = structuredClone(seed);
  const anchors = structuredClone(seed);
  const degree = degreeMap(nodes, links);
  const velocities = Object.fromEntries(nodes.map((node) => [node.id, [0, 0]]));
  const sx = Math.max(8, width / 100);
  const sy = Math.max(8, height / 100);
  const cardW = clamp(238 / sx, 13, 24);
  const cardH = clamp(132 / sy, 6.5, 11.5);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const cooling = Math.max(.12, 1 - iteration / iterations);
    const forces = Object.fromEntries(nodes.map((node) => [node.id, [0, 0]]));

    nodes.forEach((node) => {
      const point = positions[node.id] ?? [50, 50];
      const anchor = anchors[node.id] ?? point;
      const anchorStrength = layout === "architecture" ? .018 : layout === "communities" ? .026 : .034;
      forces[node.id][0] += (anchor[0] - point[0]) * anchorStrength;
      forces[node.id][1] += (anchor[1] - point[1]) * anchorStrength;
    });

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const pa = positions[a.id];
        const pb = positions[b.id];
        if (!pa || !pb) continue;
        let dx = pb[0] - pa[0];
        let dy = pb[1] - pa[1];
        if (Math.abs(dx) < .01 && Math.abs(dy) < .01) { dx = (j - i) * .04; dy = .03; }
        const distancePx = Math.max(22, Math.hypot(dx * sx, dy * sy));
        const mass = (1 + Math.sqrt(degree[a.id] || 0)) * (1 + Math.sqrt(degree[b.id] || 0));
        const repulsion = Math.min(.16, (17000 * mass / (distancePx * distancePx)) * .012) * cooling;
        const ux = dx * sx / distancePx;
        const uy = dy * sy / distancePx;
        forces[a.id][0] -= ux * repulsion;
        forces[a.id][1] -= uy * repulsion;
        forces[b.id][0] += ux * repulsion;
        forces[b.id][1] += uy * repulsion;

        const overlapX = cardW - Math.abs(dx);
        const overlapY = cardH - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const direction = dx >= 0 ? 1 : -1;
            forces[a.id][0] -= direction * overlapX * .15;
            forces[b.id][0] += direction * overlapX * .15;
          } else {
            const direction = dy >= 0 ? 1 : -1;
            forces[a.id][1] -= direction * overlapY * .15;
            forces[b.id][1] += direction * overlapY * .15;
          }
        }
      }
    }

    links.forEach((link) => {
      const a = positions[link.source];
      const b = positions[link.target];
      if (!a || !b) return;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const distancePx = Math.max(1, Math.hypot(dx * sx, dy * sy));
      const target = link.flows?.includes("deploy") ? 285 : 235;
      const error = (distancePx - target) / target;
      const ux = dx * sx / distancePx;
      const uy = dy * sy / distancePx;
      const strength = .05 * cooling;
      forces[link.source][0] += ux * error * strength;
      forces[link.source][1] += uy * error * strength;
      forces[link.target][0] -= ux * error * strength;
      forces[link.target][1] -= uy * error * strength;
    });

    nodes.forEach((node) => {
      const velocity = velocities[node.id];
      velocity[0] = (velocity[0] + forces[node.id][0]) * .72;
      velocity[1] = (velocity[1] + forces[node.id][1]) * .72;
      const speed = Math.hypot(velocity[0], velocity[1]);
      const limit = speed > 1 ? 1 / speed : 1;
      velocity[0] *= limit;
      velocity[1] *= limit;
      const [minY, maxY] = boundsFor(node, layout);
      const point = positions[node.id] ?? [50, 50];
      positions[node.id] = [clamp(point[0] + velocity[0], 8, 92), clamp(point[1] + velocity[1], minY, maxY)];
    });
  }
  return positions;
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
