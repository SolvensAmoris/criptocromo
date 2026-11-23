export interface PrincipleSwitches {
  memory: boolean;
  resonance: boolean;
  plasticity: boolean;
}

export interface NodeState {
  id: number;
  preferredFrequency: number;
  activation: number;
  memory: number;
}

export interface NetworkState {
  nodes: NodeState[];
  weights: number[][];
  tick: number;
}

export interface SimulationConfig {
  nodeCount: number;
  seed: number;
  lambda: number;
  alpha: number;
  beta: number;
  gamma: number;
  eta: number;
  plasticityRate: number;
  decayRate: number;
  resonanceWidth: number;
  switches: PrincipleSwitches;
}

export interface Stimulus {
  frequency: number;
  intensity: number;
}
