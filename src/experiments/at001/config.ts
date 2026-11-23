import type { SimulationConfig } from '../../core/types';

export const defaultConfig: SimulationConfig = {
  nodeCount: 24,
  seed: 1701,
  lambda: 0.86,
  alpha: 0.72,
  beta: 0.42,
  gamma: 0.18,
  eta: 0.24,
  plasticityRate: 0.035,
  decayRate: 0.008,
  resonanceWidth: 18,
  switches: { memory: true, resonance: true, plasticity: true }
};
