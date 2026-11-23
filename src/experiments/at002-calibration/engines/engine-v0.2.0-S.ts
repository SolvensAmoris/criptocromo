import type { NetworkState, SimulationConfig, Stimulus } from '../../../core/types';
import { createVariantNetwork, meanVariantActivation, stepVariantNetwork } from './variant-engine';
export const ENGINE_ID = 'S' as const;
export const ENGINE_VERSION = '0.2.0-S' as const;
export function smoothSigmoid(raw: number): number {
  if (!Number.isFinite(raw)) throw new Error('S received non-finite activation');
  return 1 / (1 + Math.exp(-raw));
}
export const createNetwork = (config: SimulationConfig): NetworkState => createVariantNetwork(config);
export const stepNetwork = (state: NetworkState, stimulus: Stimulus, config: SimulationConfig): NetworkState => stepVariantNetwork(state, stimulus, config, smoothSigmoid);
export const meanActivation = meanVariantActivation;
