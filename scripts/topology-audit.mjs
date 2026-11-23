// Deterministic reconstruction and graph-theoretic audit of the historical initial network.
// Edge convention: weights[i][j] > 0 means node j contributes to node i, so edge j -> i.
export function createLcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function reconstructInitialWeights(seed, nodeCount = 24) {
  if (!Number.isInteger(nodeCount) || nodeCount < 2) throw new Error('nodeCount must be an integer >= 2');
  const random = createLcg(seed);
  // Match createVariantNetwork: consume one PRNG value per preferred frequency first.
  for (let i = 0; i < nodeCount; i += 1) random();
  return Array.from({ length: nodeCount }, (_, i) =>
    Array.from({ length: nodeCount }, (_, j) => (i === j ? 0 : random() * 0.12))
  );
}

export function applyWeightPerturbation(weights, delta, seedIndex) {
  return weights.map((row, i) => row.map((weight, j) => {
    if (i === j) return weight;
    return weight + ((i + j + seedIndex) % 2 === 0 ? delta : -delta);
  }));
}

export function analyzeDirectedGraph(weights) {
  const n = weights.length;
  if (!n || weights.some((row) => row.length !== n)) throw new Error('weights must be a non-empty square matrix');
  const adjacency = Array.from({ length: n }, () => []);
  const indegree = Array(n).fill(0);
  let edgeCount = 0;
  let minimumPositiveWeight = Infinity;
  for (let target = 0; target < n; target += 1) {
    for (let source = 0; source < n; source += 1) {
      const weight = weights[target][source];
      if (target === source && weight !== 0) throw new Error('self-loop detected where diagonal must be zero');
      if (target !== source && weight > 0) {
        adjacency[source].push(target);
        indegree[target] += 1;
        edgeCount += 1;
        minimumPositiveWeight = Math.min(minimumPositiveWeight, weight);
      }
    }
  }
  const queue = [];
  for (let i = 0; i < n; i += 1) if (indegree[i] === 0) queue.push(i);
  const levels = Array(n).fill(0);
  let cursor = 0;
  let processed = 0;
  while (cursor < queue.length) {
    const node = queue[cursor++];
    processed += 1;
    for (const next of adjacency[node]) {
      levels[next] = Math.max(levels[next], levels[node] + 1);
      indegree[next] -= 1;
      if (indegree[next] === 0) queue.push(next);
    }
  }
  let cycleWitness = null;
  if (processed !== n) {
    outer: for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        // weights[i][j] means j -> i; weights[j][i] means i -> j.
        if (weights[i][j] > 0 && weights[j][i] > 0) {
          cycleWitness = { nodes: [i, j, i], edges: [[i, j], [j, i]], length: 2 };
          break outer;
        }
      }
    }
  }
  const isDag = processed === n;
  return {
    nodeCount: n,
    edgeCount,
    minimumPositiveWeight: Number.isFinite(minimumPositiveWeight) ? minimumPositiveWeight : null,
    selfLoops: false,
    topologicalSortProcessedNodes: processed,
    isDag,
    classification: isDag ? 'DIRECTED_ACYCLIC_GRAPH' : 'RECURRENT_DIRECTED_NETWORK_NOT_DAG',
    topologicalDepth: isDag ? (n ? Math.max(...levels) + 1 : 0) : null,
    cycleWitness
  };
}

export function auditSeedTopologies(seeds, nodeCount = 24, perturbationLevels = []) {
  return seeds.map((seed, seedIndex) => {
    const baseline = analyzeDirectedGraph(reconstructInitialWeights(seed, nodeCount));
    const perturbed = perturbationLevels.map((delta) => ({
      delta,
      graph: analyzeDirectedGraph(applyWeightPerturbation(reconstructInitialWeights(seed, nodeCount), delta, seedIndex))
    }));
    return { seed, baseline, perturbed };
  });
}
