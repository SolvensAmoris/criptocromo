/**
 * AT-004 audit contract helpers.
 * These helpers test mathematical/reporting conventions identified in the
 * source-level audit. They are NOT the AT-004 simulation engine and do not
 * reconstruct the historical Antikythera mechanism.
 */
export interface CouplingMatrixAudit {
  nodeCount: number;
  rowSums: number[];
  maxAbsoluteAsymmetry: number;
  asymmetricUnorderedPairs: number;
}
function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(label + ' must be a finite positive number');
  }
}
export function scaleReferencePeriod(referencePeriodYears: number, simulatedUnitsPerReferenceYear: number): number {
  assertFinitePositive(referencePeriodYears, 'referencePeriodYears');
  assertFinitePositive(simulatedUnitsPerReferenceYear, 'simulatedUnitsPerReferenceYear');
  return referencePeriodYears * simulatedUnitsPerReferenceYear;
}
/** Final sampleCount post-update timestamps; the first post-update sample is at dt, not zero. */
export function lastPostUpdateSampleTimes(totalSteps: number, dt: number, sampleCount: number): number[] {
  if (!Number.isInteger(totalSteps) || totalSteps < 1) throw new Error('totalSteps must be a positive integer');
  if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > totalSteps) {
    throw new Error('sampleCount must be an integer in [1, totalSteps]');
  }
  assertFinitePositive(dt, 'dt');
  const firstStep = totalSteps - sampleCount + 1;
  return Array.from({ length: sampleCount }, (_, index) => (firstStep + index) * dt);
}
/** Evaluate historical Boolean criteria without forcing mutually exclusive categories. */
export function evaluateOriginalSuccessCriteria(couplingK: number, rMeanLast100: number): boolean {
  if (!Number.isFinite(rMeanLast100) || rMeanLast100 < 0 || rMeanLast100 > 1) {
    throw new Error('rMeanLast100 must be finite and in [0, 1]');
  }
  switch (couplingK) {
    case 0.2: return rMeanLast100 < 0.4;
    case 0.5: return rMeanLast100 >= 0.4 && rMeanLast100 <= 0.8;
    case 0.85: return rMeanLast100 > 0.7;
    default: throw new Error('couplingK must be one of the preregistered values: 0.2, 0.5, 0.85');
  }
}
/** Inspect a square finite matrix without assuming symmetry. */
export function auditCouplingMatrix(matrix: number[][], tolerance = 1e-12): CouplingMatrixAudit {
  if (!Array.isArray(matrix) || matrix.length === 0) throw new Error('matrix must be a non-empty square matrix');
  if (!Number.isFinite(tolerance) || tolerance < 0) throw new Error('tolerance must be finite and non-negative');
  const n = matrix.length;
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== n || row.some(value => !Number.isFinite(value))) {
      throw new Error('matrix must be square and contain only finite numbers');
    }
  }
  const rowSums = matrix.map(row => row.reduce((sum, value) => sum + value, 0));
  let maxAbsoluteAsymmetry = 0;
  let asymmetricUnorderedPairs = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const difference = Math.abs(matrix[i][j] - matrix[j][i]);
      maxAbsoluteAsymmetry = Math.max(maxAbsoluteAsymmetry, difference);
      if (difference > tolerance) asymmetricUnorderedPairs += 1;
    }
  }
  return { nodeCount: n, rowSums, maxAbsoluteAsymmetry, asymmetricUnorderedPairs };
}
