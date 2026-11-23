import { describe, expect, it } from 'vitest';
import { CONDITIONS, SEEDS, analyzeFactorial, runFactorial } from '../src/experiments/at001/factorial';

describe('AT-001 factorial runner', () => {
  it('runs the full 2^3 design with ten paired seeds', () => {
    const records = runFactorial();
    expect(records).toHaveLength(80);
    for (const seed of SEEDS) {
      expect(records.filter(record => record.seed === seed)).toHaveLength(8);
    }
    expect(new Set(records.map(record => record.condition.label))).toEqual(
      new Set(CONDITIONS.map(condition => condition.label))
    );
    expect(records.every(record => Object.values(record.metrics).every(Number.isFinite))).toBe(true);
  });

  it('uses the real engine and records the exact switch mapping', () => {
    const records = runFactorial([101]);
    const full = records.find(record => record.condition.label === '111')!;
    const baseline = records.find(record => record.condition.label === '000')!;
    expect(full.config.switches).toEqual({ memory: true, resonance: true, plasticity: true });
    expect(baseline.config.switches).toEqual({ memory: false, resonance: false, plasticity: false });
    expect(full.engineVersion).toBeTruthy();
  });

  it('computes main effects and interactions from a complete paired matrix', () => {
    const records = runFactorial([101, 202, 303]);
    const analysis = analyzeFactorial(records);
    expect(analysis.persistenceRatio.mainEffects.A.n).toBe(3);
    expect(Number.isFinite(analysis.selectivityDifference.interactions.ABC.estimate)).toBe(true);
    expect(() => analyzeFactorial(records.slice(1))).toThrow(/Incomplete factorial matrix/);
  });
});
