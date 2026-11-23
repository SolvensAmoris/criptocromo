import type { NetworkState, SimulationConfig, Stimulus } from './types';

const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function createNetwork(config: SimulationConfig): NetworkState {
  if (!Number.isInteger(config.nodeCount) || config.nodeCount < 2) {
    throw new Error('nodeCount must be an integer greater than or equal to 2');
  }
  const random = createRandom(config.seed);
  const nodes = Array.from({ length: config.nodeCount }, (_, id) => ({
    id,
    preferredFrequency: random(),
    activation: 0,
    memory: 0
  }));
  const weights = nodes.map((_, i) =>
    nodes.map((__, j) => (i === j ? 0 : random() * 0.12))
  );
  return { nodes, weights, tick: 0 };
}

export function stepNetwork(
  state: NetworkState,
  stimulus: Stimulus,
  config: SimulationConfig
): NetworkState {
  if (!Number.isFinite(stimulus.frequency) || !Number.isFinite(stimulus.intensity)) {
    throw new Error('Stimulus values must be finite numbers');
  }
  const input = clamp(stimulus.intensity);

  const nextNodes = state.nodes.map((node, i) => {
    const distance = stimulus.frequency - node.preferredFrequency;
    // With resonance disabled, retain a broad input path. Zero would disable
    // the whole experiment and confound B with the presence/absence of input.
    const resonance = config.switches.resonance
      ? Math.exp(-config.resonanceWidth * distance * distance)
      : 1;
    const neighborSignal = state.nodes.reduce(
      (sum, neighbor, j) => sum + state.weights[i][j] * neighbor.activation,
      0
    );
    const retainedMemory = config.switches.memory ? node.memory : 0;
    const activation = clamp(
      config.alpha * node.activation +
      config.beta * resonance * input +
      config.gamma * neighborSignal +
      config.eta * retainedMemory
    );
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

export function runSteps(
  initial: NetworkState,
  stimuli: Stimulus[],
  config: SimulationConfig
): NetworkState {
  return stimuli.reduce((state, stimulus) => stepNetwork(state, stimulus, config), initial);
}

export function meanActivation(state: NetworkState): number {
  if (state.nodes.length === 0) return 0;
  return state.nodes.reduce((sum, node) => sum + node.activation, 0) / state.nodes.length;
}
