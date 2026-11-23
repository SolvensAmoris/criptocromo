import { createNetwork, meanActivation, stepNetwork } from '../../core/engine';
import type { SimulationConfig, Stimulus } from '../../core/types';

export interface At001Run {
  config: SimulationConfig;
  stimulusFrequency: number;
  history: number[];
  finalMeanActivation: number;
  finalState: ReturnType<typeof createNetwork>;
}

export function runAt001(
  config: SimulationConfig,
  frequency = 0.5,
  pulseSteps = 18,
  recoverySteps = 24
): At001Run {
  let state = createNetwork(config);
  const history: number[] = [];
  const pulse: Stimulus = { frequency, intensity: 1 };

  for (let i = 0; i < pulseSteps; i += 1) {
    state = stepNetwork(state, pulse, config);
    history.push(meanActivation(state));
  }
  for (let i = 0; i < recoverySteps; i += 1) {
    state = stepNetwork(state, { frequency, intensity: 0 }, config);
    history.push(meanActivation(state));
  }

  return {
    config,
    stimulusFrequency: frequency,
    history,
    finalMeanActivation: meanActivation(state),
    finalState: state
  };
}
