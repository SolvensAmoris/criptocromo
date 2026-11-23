import type { NetworkState, SimulationConfig, Stimulus } from '../../core/types';
import { createNetwork, meanActivation, stepNetwork } from '../../core/engine';

export type ActivationVariant = 'original-clip' | 'diagnostic-identity' | 'smooth-sigmoid';

export function transformActivation(value: number, variant: ActivationVariant): number {
  if (!Number.isFinite(value)) throw new Error('Activation input must be finite');
  switch (variant) {
    case 'original-clip': return Math.min(1, Math.max(0, value));
    case 'diagnostic-identity': return value;
    case 'smooth-sigmoid': return 1 / (1 + Math.exp(-value));
  }
}

export function calculateRawActivations(state: NetworkState, stimulus: Stimulus, config: SimulationConfig): number[] {
  if (!Number.isFinite(stimulus.frequency) || !Number.isFinite(stimulus.intensity)) throw new Error('Stimulus values must be finite');
  const input = Math.min(1, Math.max(0, stimulus.intensity));
  return state.nodes.map((node, i) => {
    const distance = stimulus.frequency - node.preferredFrequency;
    const resonance = config.switches.resonance ? Math.exp(-config.resonanceWidth * distance * distance) : 1;
    const neighborSignal = state.nodes.reduce((sum, neighbor, j) => sum + state.weights[i][j] * neighbor.activation, 0);
    const retainedMemory = config.switches.memory ? node.memory : 0;
    return config.alpha * node.activation + config.beta * resonance * input +
      config.gamma * neighborSignal + config.eta * retainedMemory;
  });
}

export interface CalibrationTracePoint {
  tick: number;
  meanActivation: number;
  meanMemory: number;
  meanAbsoluteWeightDelta: number;
  totalAbsoluteWeightDelta: number;
}

export function traceStep(previous: NetworkState, next: NetworkState): CalibrationTracePoint {
  const deltas: number[] = [];
  for (let i = 0; i < previous.weights.length; i += 1) {
    for (let j = 0; j < previous.weights[i].length; j += 1) {
      deltas.push(Math.abs(next.weights[i][j] - previous.weights[i][j]));
    }
  }
  const totalAbsoluteWeightDelta = deltas.reduce((sum, value) => sum + value, 0);
  const meanMemory = next.nodes.length
    ? next.nodes.reduce((sum, node) => sum + node.memory, 0) / next.nodes.length : 0;
  return {
    tick: next.tick,
    meanActivation: meanActivation(next),
    meanMemory,
    meanAbsoluteWeightDelta: deltas.length ? totalAbsoluteWeightDelta / deltas.length : 0,
    totalAbsoluteWeightDelta
  };
}

export function runCalibrationTrace(config: SimulationConfig, stimuli: Stimulus[]): CalibrationTracePoint[] {
  let state = createNetwork(config);
  const trace: CalibrationTracePoint[] = [];
  for (const stimulus of stimuli) {
    const next = stepNetwork(state, stimulus, config);
    trace.push(traceStep(state, next));
    state = next;
  }
  return trace;
}
