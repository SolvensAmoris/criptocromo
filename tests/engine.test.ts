import { describe, expect, it } from 'vitest';
import { createNetwork, meanActivation, stepNetwork } from '../src/core/engine';
import { defaultConfig } from '../src/experiments/at001/config';
import { measureAt001 } from '../src/experiments/at001/metrics';

describe('deterministic simulation engine', () => {
  it('creates identical networks for the same seed', () => {
    const a = createNetwork(defaultConfig);
    const b = createNetwork(defaultConfig);
    expect(a).toEqual(b);
  });

  it('advances exactly one tick per step', () => {
    const initial = createNetwork(defaultConfig);
    const next = stepNetwork(initial, { frequency: 0.5, intensity: 1 }, defaultConfig);
    expect(next.tick).toBe(1);
    expect(initial.tick).toBe(0);
  });

  it('keeps activations and memory within [0, 1]', () => {
    let state = createNetwork(defaultConfig);
    for (let i = 0; i < 100; i += 1) {
      state = stepNetwork(state, { frequency: (i % 10) / 10, intensity: 1 }, defaultConfig);
    }
    for (const node of state.nodes) {
      expect(node.activation).toBeGreaterThanOrEqual(0);
      expect(node.activation).toBeLessThanOrEqual(1);
      expect(node.memory).toBeGreaterThanOrEqual(0);
      expect(node.memory).toBeLessThanOrEqual(1);
    }
  });

  it('returns finite metrics for AT-001', () => {
    const metrics = measureAt001(defaultConfig);
    expect(Number.isFinite(metrics.persistenceRatio)).toBe(true);
    expect(meanActivation(createNetwork(defaultConfig))).toBe(0);
  });

  it('keeps a broad input path when resonance is disabled', () => {
    const config = { ...defaultConfig, switches: { ...defaultConfig.switches, resonance: false } };
    const next = stepNetwork(createNetwork(config), { frequency: 0.5, intensity: 1 }, config);
    expect(meanActivation(next)).toBeGreaterThan(0);
  });

  it('rejects networks smaller than two nodes', () => {
    expect(() => createNetwork({ ...defaultConfig, nodeCount: 1 })).toThrow();
  });
});
