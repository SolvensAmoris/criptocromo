import type { NetworkState, SimulationConfig, Stimulus } from '../../../../core/types';
import { createVariantNetwork, meanVariantActivation, stepVariantNetwork } from './variant-engine';
export const ENGINE_ID = 'D' as const;
export const ENGINE_VERSION = '0.2.0-D' as const;
export const OVERFLOW_GUARD_ABS = 1000000;
function diagnosticIdentity(raw: number): number {
  if (!Number.isFinite(raw) || Math.abs(raw) > OVERFLOW_GUARD_ABS) throw new Error(`D overflow guard triggered: ${raw}`);
  return raw;
}
export const createNetwork = (config: SimulationConfig): NetworkState => createVariantNetwork(config);
export const stepNetwork = (state: NetworkState, stimulus: Stimulus, config: SimulationConfig): NetworkState => stepVariantNetwork(state, stimulus, config, diagnosticIdentity);
export const meanActivation = meanVariantActivation;
