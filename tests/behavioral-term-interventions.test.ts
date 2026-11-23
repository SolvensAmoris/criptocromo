import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/experiments/at001/config';
import * as O from '../src/experiments/at002-calibration/engines/engine-v0.1.0-O';
import * as D from '../src/experiments/at002-calibration/engines/engine-v0.2.0-D';
import {
  stepWithTermIntervention,
  TERM_INTERVENTION_TICK
} from '../src/experiments/behavioral-term-interventions';

const config = (seed = 101) => ({ ...defaultConfig, seed, switches: { memory: true, resonance: true, plasticity: true } });
const stimulus = { frequency: 0.5, intensity: 1 };

describe('term-level sensitivity intervention primitive', () => {
  it('matches the historical O and D transitions when no intervention is supplied', () => {
    for (const seed of [101, 303, 606]) {
      const cfg = config(seed);
      const oInitial = O.createNetwork(cfg);
      const dInitial = D.createNetwork(cfg);
      expect(stepWithTermIntervention(oInitial, stimulus, cfg, 'O')).toEqual(O.stepNetwork(oInitial, stimulus, cfg));
      expect(stepWithTermIntervention(dInitial, stimulus, cfg, 'D')).toEqual(D.stepNetwork(dInitial, stimulus, cfg));
    }
  });

  it('does not apply either intervention before the declared second tick', () => {
    const cfg = config();
    const initial = O.createNetwork(cfg);
    const baselineTick1 = stepWithTermIntervention(initial, stimulus, cfg, 'O');
    const perturbedTick1 = stepWithTermIntervention(initial, stimulus, cfg, 'O', {
      kind: 'NEIGHBOR_TERM_SCALE', delta: 1e-6
    });
    expect(perturbedTick1).toEqual(baselineTick1);
    expect(TERM_INTERVENTION_TICK).toBe(2);
  });

  it('applies ACT_RAW_SCALE at the transition that produces tick 2', () => {
    const cfg = config();
    const tick1 = stepWithTermIntervention(O.createNetwork(cfg), stimulus, cfg, 'O');
    const baseline2 = stepWithTermIntervention(tick1, stimulus, cfg, 'O');
    const perturbed2 = stepWithTermIntervention(tick1, stimulus, cfg, 'O', {
      kind: 'ACT_RAW_SCALE', delta: 1e-6
    });
    expect(perturbed2).not.toEqual(baseline2);
    expect(perturbed2.tick).toBe(2);
  });

  it('applies NEIGHBOR_TERM_SCALE at the transition that produces tick 2', () => {
    const cfg = config();
    const tick1 = stepWithTermIntervention(O.createNetwork(cfg), stimulus, cfg, 'O');
    const baseline2 = stepWithTermIntervention(tick1, stimulus, cfg, 'O');
    const perturbed2 = stepWithTermIntervention(tick1, stimulus, cfg, 'O', {
      kind: 'NEIGHBOR_TERM_SCALE', delta: 1e-6
    });
    expect(perturbed2).not.toEqual(baseline2);
    expect(perturbed2.tick).toBe(2);
  });

  it('preserves O clipping and D fail-closed guard semantics', () => {
    const cfg = { ...config(), alpha: 1, beta: 4, gamma: 0, eta: 0, switches: { memory: false, resonance: false, plasticity: false } };
    const initial = O.createNetwork(cfg);
    const o = stepWithTermIntervention(initial, stimulus, cfg, 'O');
    expect(o.nodes.every(node => node.activation >= 0 && node.activation <= 1)).toBe(true);

    const dangerous = { ...cfg, beta: 3_000_000 };
    expect(() => stepWithTermIntervention(O.createNetwork(dangerous), stimulus, dangerous, 'D'))
      .toThrow(/overflow guard/);
  });

  it('rejects invalid perturbation magnitudes', () => {
    const cfg = config();
    const initial = O.createNetwork(cfg);
    expect(() => stepWithTermIntervention(initial, stimulus, cfg, 'O', {
      kind: 'ACT_RAW_SCALE', delta: 0
    })).toThrow(/delta/);
    expect(() => stepWithTermIntervention(initial, stimulus, cfg, 'O', {
      kind: 'NEIGHBOR_TERM_SCALE', delta: 1
    })).toThrow(/delta/);
  });
});
