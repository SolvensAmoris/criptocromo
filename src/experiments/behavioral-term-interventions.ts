import type { NetworkState, SimulationConfig, Stimulus } from '../core/types';

export type TermInterventionKind = 'ACT_RAW_SCALE' | 'NEIGHBOR_TERM_SCALE';
export type EnginePolicy = 'O' | 'D';

export interface TermIntervention {
  kind: TermInterventionKind;
  /** Dimensionless relative perturbation, e.g. 1e-6. */
  delta: number;
}

export const TERM_INTERVENTION_TICK = 2;
export const DIAGNOSTIC_OVERFLOW_GUARD_ABS = 1_000_000;

const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

/**
 * Executes one synchronous transition with an optional one-shot intervention.
 * ACT_RAW_SCALE multiplies the complete pre-policy raw activation.
 * NEIGHBOR_TERM_SCALE multiplies only gamma * neighborSignal.
 *
 * The intervention is applied exactly once while state.tick === 1, on the
 * transition that produces tick 2. This avoids perturbing the zero initial
 * neighbor signal. This primitive does not alter the historical O/D engines
 * and is not a campaign runner.
 */
export function stepWithTermIntervention(
  state: NetworkState,
  stimulus: Stimulus,
  config: SimulationConfig,
  policy: EnginePolicy,
  intervention?: TermIntervention
): NetworkState {
  if (!Number.isFinite(stimulus.frequency) || !Number.isFinite(stimulus.intensity)) {
    throw new Error('Stimulus values must be finite numbers');
  }
  if (intervention && (
    !Number.isFinite(intervention.delta) ||
    intervention.delta <= 0 ||
    intervention.delta >= 1
  )) {
    throw new Error('Intervention delta must be finite and between 0 and 1');
  }

  const applyIntervention = Boolean(intervention) && state.tick === TERM_INTERVENTION_TICK - 1;
  const input = clamp(stimulus.intensity);

  const nextNodes = state.nodes.map((node, i) => {
    const distance = stimulus.frequency - node.preferredFrequency;
    const resonance = config.switches.resonance
      ? Math.exp(-config.resonanceWidth * distance * distance)
      : 1;
    const neighborSignal = state.nodes.reduce(
      (sum, neighbor, j) => sum + state.weights[i][j] * neighbor.activation,
      0
    );
    const neighborContribution = config.gamma * neighborSignal;
    const retainedMemory = config.switches.memory ? node.memory : 0;
    const localTerms =
      config.alpha * node.activation +
      config.beta * resonance * input +
      config.eta * retainedMemory;

    let raw = localTerms + neighborContribution;
    if (applyIntervention && intervention) {
      const signedDelta = i % 2 === 0 ? intervention.delta : -intervention.delta;
      const factor = 1 + signedDelta;
      raw = intervention.kind === 'ACT_RAW_SCALE'
        ? raw * factor
        : localTerms + neighborContribution * factor;
    }

    if (!Number.isFinite(raw)) throw new Error('Non-finite activation');
    let activation: number;
    if (policy === 'O') {
      activation = clamp(raw);
    } else {
      if (Math.abs(raw) > DIAGNOSTIC_OVERFLOW_GUARD_ABS) {
        throw new Error(`D overflow guard triggered: ${raw}`);
      }
      activation = raw;
    }

    const memory = config.switches.memory
      ? clamp(config.lambda * node.memory + (1 - config.lambda) * node.activation)
      : 0;
    return { ...node, activation, memory };
  });

  const nextWeights = state.weights.map((row, i) =>
    row.map((weight, j) => {
      if (i === j || !config.switches.plasticity) return weight;
      const hebbian = config.plasticityRate *
        nextNodes[i].activation * nextNodes[j].activation;
      return clamp(weight + hebbian - config.decayRate * weight, 0, 1);
    })
  );

  return { nodes: nextNodes, weights: nextWeights, tick: state.tick + 1 };
}
