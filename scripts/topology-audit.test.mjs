import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDirectedGraph, auditSeedTopologies, reconstructInitialWeights } from './topology-audit.mjs';

const seeds = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010];

test('reconstructs 24-node, 552-edge directed networks for every historical seed', () => {
  for (const seed of seeds) {
    const weights = reconstructInitialWeights(seed);
    const graph = analyzeDirectedGraph(weights);
    assert.equal(graph.nodeCount, 24);
    assert.equal(graph.edgeCount, 24 * 23);
    assert.equal(graph.selfLoops, false);
    assert.ok(graph.minimumPositiveWeight > 0);
  }
});

test('Kahn topological-sort audit rejects every seed as cyclic and emits a valid 2-cycle witness', () => {
  for (const seed of seeds) {
    const weights = reconstructInitialWeights(seed);
    const graph = analyzeDirectedGraph(weights);
    assert.equal(graph.isDag, false);
    assert.equal(graph.topologicalDepth, null);
    assert.ok(graph.topologicalSortProcessedNodes < 24);
    const [a, b, c] = graph.cycleWitness.nodes;
    assert.equal(a, c);
    assert.ok(weights[b][a] > 0); // a -> b
    assert.ok(weights[a][b] > 0); // b -> a
  }
});

test('all declared WGT perturbation levels preserve the 552-edge topology', () => {
  const audits = auditSeedTopologies(seeds, 24, [1e-6, 1e-8, 1e-10]);
  for (const row of audits) {
    for (const item of row.perturbed) {
      assert.equal(item.graph.edgeCount, 552, `seed=${row.seed}, delta=${item.delta}`);
      assert.equal(item.graph.isDag, false);
      assert.ok(item.graph.minimumPositiveWeight > 0);
    }
  }
});

test('reports a valid topological depth only for an acyclic graph', () => {
  const dag = [
    [0, 0, 0],
    [0.1, 0, 0],
    [0, 0.1, 0]
  ];
  const graph = analyzeDirectedGraph(dag);
  assert.equal(graph.isDag, true);
  assert.equal(graph.cycleWitness, null);
  assert.equal(graph.topologicalDepth, 3);
  assert.equal(graph.topologicalSortProcessedNodes, 3);
});
