import { createNetwork, meanActivation, stepNetwork } from '../../core/engine';
import type { SimulationConfig } from '../../core/types';

export interface At001Metrics {
  peakActivation: number;
  residualActivation: number;
  persistenceRatio: number;
  activeNodeFraction: number;
}

export function measureAt001(
  config: SimulationConfig,
  frequency = 0.5,
  pulseSteps = 18,
  recoverySteps = 24
): At001Metrics {
  let state = createNetwork(config);
  let peakActivation = 0;

  for (let i = 0; i < pulseSteps; i += 1) {
    state = stepNetwork(state, { frequency, intensity: 1 }, config);
    peakActivation = Math.max(peakActivation, meanActivation(state));
  }
  for (let i = 0; i < recoverySteps; i += 1) {
    state = stepNetwork(state, { frequency, intensity: 0 }, config);
  }

  const residualActivation = meanActivation(state);
  return {
    peakActivation,
    residualActivation,
    persistenceRatio: peakActivation > 0 ? residualActivation / peakActivation : 0,
    activeNodeFraction: state.nodes.filter(node => node.activation > 0.05).length /
      Math.max(state.nodes.length, 1)
  };
}
