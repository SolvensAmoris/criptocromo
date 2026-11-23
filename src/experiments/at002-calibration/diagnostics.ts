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
