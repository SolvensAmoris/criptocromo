import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/experiments/at001/config';
import { runCalibrationTrace, transformActivation } from '../src/experiments/at002-calibration/diagnostics';

const repeatedStimulus = Array.from({ length: 8 }, () => ({ frequency: 0.5, intensity: 0.5 }));

describe('AT-002 calibration diagnostics', () => {
  it('keeps the three activation transforms explicitly distinct', () => {
    expect(transformActivation(1.5, 'original-clip')).toBe(1);
    expect(transformActivation(1.5, 'diagnostic-identity')).toBe(1.5);
    expect(transformActivation(1.5, 'smooth-sigmoid')).toBeCloseTo(0.817574, 5);
  });

  it('rejects non-finite diagnostic inputs', () => {
    expect(() => transformActivation(Number.NaN, 'diagnostic-identity')).toThrow();
    expect(() => transformActivation(Number.POSITIVE_INFINITY, 'original-clip')).toThrow();
  });

  it('records memory evolution independently of plasticity', () => {
    const config = { ...defaultConfig, seed: 101, switches: { memory: true, resonance: false, plasticity: false } };
    const trace = runCalibrationTrace(config, repeatedStimulus);
    expect(trace).toHaveLength(8);
    expect(trace.some(point => point.meanMemory > 0)).toBe(true);
    expect(trace.every(point => point.totalAbsoluteWeightDelta === 0)).toBe(true);
  });

  it('records plasticity evolution independently of memory', () => {
    const config = { ...defaultConfig, seed: 101, switches: { memory: false, resonance: false, plasticity: true } };
    const trace = runCalibrationTrace(config, repeatedStimulus);
    expect(trace).toHaveLength(8);
    expect(trace.every(point => point.meanMemory === 0)).toBe(true);
    expect(trace.some(point => point.totalAbsoluteWeightDelta > 0)).toBe(true);
  });

  it('keeps baseline traces inert when both mechanisms are disabled', () => {
    const config = { ...defaultConfig, seed: 101, switches: { memory: false, resonance: false, plasticity: false } };
    const trace = runCalibrationTrace(config, [{ frequency: 0.5, intensity: 0.5 }]);
    expect(trace[0].meanMemory).toBe(0);
    expect(trace[0].totalAbsoluteWeightDelta).toBe(0);
  });
});
