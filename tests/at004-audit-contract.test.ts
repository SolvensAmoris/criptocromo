import { describe, expect, it } from 'vitest';
import {
  auditCouplingMatrix,
  evaluateOriginalSuccessCriteria,
  lastPostUpdateSampleTimes,
  scaleReferencePeriod
} from '../src/experiments/at004/audit-contract';

describe('AT-004 deterministic audit contract', () => {
  it('maps reference periods using an explicit simulated-units-per-year factor', () => {
    expect(scaleReferencePeriod(19, 6.5)).toBe(123.5);
    expect(scaleReferencePeriod(76, 6.5)).toBe(494);
    expect(scaleReferencePeriod(0.0748, 6.5)).toBeCloseTo(0.4862, 12);
    expect(() => scaleReferencePeriod(19, 0)).toThrow();
    expect(() => scaleReferencePeriod(Number.NaN, 6.5)).toThrow();
  });
  it('timestamps the final 100 post-update samples at 490.1 through 500.0', () => {
    const times = lastPostUpdateSampleTimes(5000, 0.1, 100);
    expect(times).toHaveLength(100);
    expect(times[0]).toBeCloseTo(490.1, 10);
    expect(times[99]).toBeCloseTo(500, 10);
    expect(times[99] - times[0]).toBeCloseTo(9.9, 10);
  });
  it('preserves the original overlapping Boolean success criteria', () => {
    expect(evaluateOriginalSuccessCriteria(0.2, 0.399999)).toBe(true);
    expect(evaluateOriginalSuccessCriteria(0.2, 0.4)).toBe(false);
    expect(evaluateOriginalSuccessCriteria(0.5, 0.4)).toBe(true);
    expect(evaluateOriginalSuccessCriteria(0.5, 0.8)).toBe(true);
    expect(evaluateOriginalSuccessCriteria(0.5, 0.800001)).toBe(false);
    expect(evaluateOriginalSuccessCriteria(0.85, 0.7)).toBe(false);
    expect(evaluateOriginalSuccessCriteria(0.85, 0.700001)).toBe(true);
    // The historical thresholds overlap on 0.7 < r <= 0.8.
    expect(evaluateOriginalSuccessCriteria(0.5, 0.75)).toBe(true);
    expect(evaluateOriginalSuccessCriteria(0.85, 0.75)).toBe(true);
  });
  it('detects asymmetry introduced by row-normalizing a symmetric matrix', () => {
    const symmetric = [[0, 1, 1], [1, 0, 0], [1, 0, 0]];
    const normalized = symmetric.map(row => {
      const sum = row.reduce((total, value) => total + value, 0);
      return row.map(value => value / sum);
    });
    const before = auditCouplingMatrix(symmetric);
    const after = auditCouplingMatrix(normalized);
    expect(before.maxAbsoluteAsymmetry).toBe(0);
    expect(before.asymmetricUnorderedPairs).toBe(0);
    expect(after.rowSums).toEqual([1, 1, 1]);
    expect(after.maxAbsoluteAsymmetry).toBeCloseTo(0.5, 12);
    expect(after.asymmetricUnorderedPairs).toBe(2);
  });
  it('rejects malformed matrices and invalid sample windows', () => {
    expect(() => auditCouplingMatrix([[0, 1], [1]])).toThrow();
    expect(() => auditCouplingMatrix([[0, Number.NaN], [1, 0]])).toThrow();
    expect(() => lastPostUpdateSampleTimes(10, 0.1, 11)).toThrow();
    expect(() => evaluateOriginalSuccessCriteria(0.3, 0.5)).toThrow();
    expect(() => evaluateOriginalSuccessCriteria(0.5, 1.1)).toThrow();
  });
});
