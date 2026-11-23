/**
 * Deterministic event-sequence equivalence evaluator.
 *
 * Time representation is FIXED_TICK / ns. All timestamps and tolerances
 * must be BigInt values; JSON adapters should serialize them as decimal strings.
 * No floating-point conversion is performed.
 */

export const INT64_MIN = -(1n << 63n);
export const INT64_MAX = (1n << 63n) - 1n;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isInt64 = (value) => typeof value === 'bigint' && value >= INT64_MIN && value <= INT64_MAX;
const isNonNegativeInt64 = (value) => isInt64(value) && value >= 0n;

function invalidResult(reason, evidence = []) {
  return {
    verdict: 'INDETERMINATE/CENSORED',
    reasons: [reason],
    evidence
  };
}

function validateIntervals(intervals, label) {
  if (!Array.isArray(intervals)) {
    return { valid: false, reason: label + ' must be an array of closed intervals' };
  }
  const normalized = [];
  for (let index = 0; index < intervals.length; index += 1) {
    const interval = intervals[index];
    if (!isRecord(interval) || !isNonNegativeInt64(interval.startNs) ||
        !isNonNegativeInt64(interval.endNs) || interval.startNs > interval.endNs) {
      return {
        valid: false,
        reason: label + ' contains an invalid interval at index ' + index
      };
    }
    normalized.push({ startNs: interval.startNs, endNs: interval.endNs });
  }
  return { valid: true, intervals: normalized };
}

/**
 * Merge inclusive fixed-tick intervals. Adjacent nanoseconds are contiguous:
 * [0, 60] and [61, 100] form [0, 100].
 */
export function unionIntervals(intervals) {
  if (!Array.isArray(intervals)) throw new TypeError('intervals must be an array');
  const sorted = intervals.map(({ startNs, endNs }) => ({ startNs, endNs }))
    .sort((left, right) => left.startNs < right.startNs ? -1 : left.startNs > right.startNs ? 1 : 0);
  if (sorted.length === 0) return [];

  const merged = [];
  let current = { ...sorted[0] };
  for (let index = 1; index < sorted.length; index += 1) {
    const next = sorted[index];
    if (next.startNs <= current.endNs + 1n) {
      if (next.endNs > current.endNs) current.endNs = next.endNs;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Check complete inclusive coverage of [0, horizonNs] using FIXED_TICK ns.
 * Input intervals must already have passed structural validation.
 */
export function coversHorizon(intervals, horizonNs) {
  if (!isNonNegativeInt64(horizonNs)) return false;
  const merged = unionIntervals(intervals);
  let cursor = 0n;
  for (const interval of merged) {
    if (interval.endNs < cursor) continue;
    if (interval.startNs > cursor) return false;
    if (interval.endNs >= horizonNs) return true;
    cursor = interval.endNs + 1n;
  }
  return false;
}

/**
 * Establish a logical RUN_START origin. The first successful read is 0 ns.
 * Subsequent values are elapsed monotonic nanoseconds. Failure is sticky and
 * never wraps or saturates.
 */
export function createMonotonicRunClock(readMonotonicNs = () => process.hrtime.bigint()) {
  let origin;
  let failed = null;

  return {
    readElapsedNs() {
      if (failed) return { valid: false, reason: failed.reason, evidence: failed.evidence };
      let reading;
      try {
        reading = readMonotonicNs();
      } catch (error) {
        failed = {
          reason: 'MONOTONIC_CLOCK_FAILURE',
          evidence: String(error?.message ?? error)
        };
        return { valid: false, ...failed };
      }
      if (typeof reading !== 'bigint') {
        failed = {
          reason: 'MONOTONIC_READING_NOT_BIGINT',
          evidence: 'Clock readings must be BigInt nanoseconds; floating-point and Number inputs are forbidden.'
        };
        return { valid: false, ...failed };
      }
      if (origin === undefined) {
        origin = reading;
        return { valid: true, timeNs: 0n };
      }
      const elapsed = reading - origin;
      if (elapsed < 0n) {
        failed = {
          reason: 'MONOTONIC_CLOCK_MOVED_BACKWARD',
          evidence: 'A later monotonic reading was smaller than RUN_START.'
        };
        return { valid: false, ...failed };
      }
      if (elapsed > INT64_MAX) {
        failed = {
          reason: 'INT64_OVERFLOW',
          evidence: 'Elapsed nanoseconds exceed the signed int64 maximum.'
        };
        return { valid: false, ...failed };
      }
      return { valid: true, timeNs: elapsed };
    }
  };
}

function validateInstrumentMetadata(metadata, label) {
  if (!isRecord(metadata) || typeof metadata.clockSource !== 'string' || metadata.clockSource.length === 0 ||
      metadata.clockResolutionNs !== 1n ||
      !['QUANTIFIED', 'NOT_QUANTIFIED'].includes(metadata.uncertaintyStatus)) {
    return { valid: false, reason: label + '.instrumentMetadata is missing or incompatible with the 1 ns clock contract' };
  }
  if (metadata.clockAccuracyNs !== null && metadata.clockAccuracyNs !== undefined &&
      !isNonNegativeInt64(metadata.clockAccuracyNs)) {
    return { valid: false, reason: label + '.instrumentMetadata.clockAccuracyNs is invalid' };
  }
  if (metadata.uncertaintyStatus === 'QUANTIFIED') {
    if (!isNonNegativeInt64(metadata.measurementUncertaintyNs)) {
      return { valid: false, reason: label + '.instrumentMetadata.measurementUncertaintyNs is invalid' };
    }
  } else if (metadata.measurementUncertaintyNs !== null) {
    return { valid: false, reason: label + '.instrumentMetadata must explicitly use null when uncertainty is not quantified' };
  }
  if (metadata.notes !== undefined && typeof metadata.notes !== 'string') {
    return { valid: false, reason: label + '.instrumentMetadata.notes must be a string' };
  }
  return { valid: true, metadata };
}

function validateTrace(trace, label, horizonNs) {
  if (!isRecord(trace)) return { valid: false, reason: label + ' trace must be an object' };
  if (!Array.isArray(trace.events)) return { valid: false, reason: label + '.events must be an array' };
  const instrument = validateInstrumentMetadata(trace.instrumentMetadata, label);
  if (!instrument.valid) return instrument;
  if (!Array.isArray(trace.processActiveIntervals)) {
    return { valid: false, reason: label + '.processActiveIntervals must be an array' };
  }
  if (!Array.isArray(trace.recorderValidIntervals)) {
    return { valid: false, reason: label + '.recorderValidIntervals must be an array' };
  }

  const process = validateIntervals(trace.processActiveIntervals, label + '.processActiveIntervals');
  if (!process.valid) return process;
  const recorder = validateIntervals(trace.recorderValidIntervals, label + '.recorderValidIntervals');
  if (!recorder.valid) return recorder;

  const events = [];
  for (let index = 0; index < trace.events.length; index += 1) {
    const event = trace.events[index];
    if (!isRecord(event) || typeof event.id !== 'string' || event.id.length === 0 ||
        !isNonNegativeInt64(event.timeNs)) {
      return {
        valid: false,
        reason: label + '.events contains an invalid event at sequence index ' + index
      };
    }
    if (event.payload !== undefined && typeof event.payload === 'function') {
      return { valid: false, reason: label + '.events contains a non-serializable payload' };
    }
    if (event.timeNs <= horizonNs) events.push(event);
  }

  const acquisitionErrors = trace.acquisitionErrors ?? [];
  if (!Array.isArray(acquisitionErrors) || acquisitionErrors.some((item) => typeof item !== 'string')) {
    return { valid: false, reason: label + '.acquisitionErrors must be an array of strings' };
  }

  return {
    valid: true,
    events,
    instrumentMetadata: instrument.metadata,
    processIntervals: process.intervals,
    recorderIntervals: recorder.intervals,
    acquisitionErrors
  };
}

function isJsonValue(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || seen.has(value)) return false;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  seen.add(value);
  const valid = (Array.isArray(value) ? value : Object.values(value)).every((item) => isJsonValue(item, seen));
  seen.delete(value);
  return valid;
}

function payloadsEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (left === undefined || right === undefined) return false;
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false;
  return leftKeys.every((key) => payloadsEqual(left[key], right[key]));
}

/**
 * Evaluate one reference/perturbed pair.
 *
 * Required options are explicit: timeDomain='FIXED_TICK', timeUnit='ns',
 * payloadMode='IGNORE'|'EXACT'. Events are matched by their existing sequence
 * position; event arrays are never sorted.
 */
export function evaluateEventEquivalence(reference, perturbed, options) {
  if (!isRecord(options) || options.timeDomain !== 'FIXED_TICK' ||
      options.timeUnit !== 'ns' || !['IGNORE', 'EXACT'].includes(options.payloadMode)) {
    return invalidResult(
      'Temporal domain, unit, or payload comparison mode is missing or incompatible',
      ['Required: timeDomain=FIXED_TICK, timeUnit=ns, payloadMode=IGNORE|EXACT']
    );
  }
  const { horizonNs, toleranceNs } = options;
  if (!isNonNegativeInt64(horizonNs) || !isNonNegativeInt64(toleranceNs)) {
    return invalidResult('Horizon or temporal tolerance is invalid or outside signed int64 nanoseconds', [
      'T and tau must be non-negative BigInt values in nanoseconds; Number/float values are forbidden.'
    ]);
  }

  const ref = validateTrace(reference, 'reference', horizonNs);
  const pert = validateTrace(perturbed, 'perturbed', horizonNs);
  if (!ref.valid || !pert.valid) {
    return invalidResult('Trace data is malformed or temporally incompatible', [
      ...(!ref.valid ? ['reference: ' + ref.reason] : []),
      ...(!pert.valid ? ['perturbed: ' + pert.reason] : [])
    ]);
  }

  const reasons = [];
  const evidence = [];
  let demonstratedRejection = false;
  const pairedCount = Math.min(ref.events.length, pert.events.length);

  for (let index = 0; index < pairedCount; index += 1) {
    const expected = ref.events[index];
    const actual = pert.events[index];
    if (expected.id !== actual.id) {
      demonstratedRejection = true;
      reasons.push('Event identity or sequence order differs at position ' + index);
      evidence.push({
        type: 'EVENT_IDENTITY_MISMATCH',
        position: index,
        referenceId: expected.id,
        perturbedId: actual.id
      });
      break;
    }
    if (options.payloadMode === 'EXACT' && !payloadsEqual(expected.payload, actual.payload)) {
      demonstratedRejection = true;
      reasons.push('Event payload differs at position ' + index);
      evidence.push({ type: 'EVENT_PAYLOAD_MISMATCH', position: index });
      break;
    }
    const deltaNs = actual.timeNs >= expected.timeNs
      ? actual.timeNs - expected.timeNs
      : expected.timeNs - actual.timeNs;
    if (deltaNs > toleranceNs) {
      demonstratedRejection = true;
      reasons.push('Event timing exceeds the predeclared tolerance at position ' + index);
      evidence.push({
        type: 'EVENT_TIMING_OUT_OF_TOLERANCE',
        position: index,
        referenceTimeNs: expected.timeNs.toString(),
        perturbedTimeNs: actual.timeNs.toString(),
        absoluteDeltaNs: deltaNs.toString(),
        toleranceNs: toleranceNs.toString()
      });
      break;
    }
  }

  const refProcessCoverage = coversHorizon(ref.processIntervals, horizonNs);
  const pertProcessCoverage = coversHorizon(pert.processIntervals, horizonNs);
  const refRecorderCoverage = coversHorizon(ref.recorderIntervals, horizonNs);
  const pertRecorderCoverage = coversHorizon(pert.recorderIntervals, horizonNs);
  const refCoverage = refProcessCoverage && refRecorderCoverage && ref.acquisitionErrors.length === 0;
  const pertCoverage = pertProcessCoverage && pertRecorderCoverage && pert.acquisitionErrors.length === 0;
  const fullCoverage = refCoverage && pertCoverage;

  evidence.push({
    type: 'COVERAGE',
    horizonStartNs: '0',
    horizonEndNs: horizonNs.toString(),
    endpointInclusive: true,
    reference: {
      process: refProcessCoverage,
      recorder: refRecorderCoverage,
      fullCoverage: refCoverage,
      acquisitionErrors: ref.acquisitionErrors,
      instrumentMetadata: {
        clockSource: ref.instrumentMetadata.clockSource,
        clockResolutionNs: ref.instrumentMetadata.clockResolutionNs.toString(),
        clockAccuracyNs: ref.instrumentMetadata.clockAccuracyNs == null ? null : ref.instrumentMetadata.clockAccuracyNs.toString(),
        measurementUncertaintyNs: ref.instrumentMetadata.measurementUncertaintyNs == null ? null : ref.instrumentMetadata.measurementUncertaintyNs.toString(),
        uncertaintyStatus: ref.instrumentMetadata.uncertaintyStatus
      }
    },
    perturbed: {
      process: pertProcessCoverage,
      recorder: pertRecorderCoverage,
      fullCoverage: pertCoverage,
      acquisitionErrors: pert.acquisitionErrors,
      instrumentMetadata: {
        clockSource: pert.instrumentMetadata.clockSource,
        clockResolutionNs: pert.instrumentMetadata.clockResolutionNs.toString(),
        clockAccuracyNs: pert.instrumentMetadata.clockAccuracyNs == null ? null : pert.instrumentMetadata.clockAccuracyNs.toString(),
        measurementUncertaintyNs: pert.instrumentMetadata.measurementUncertaintyNs == null ? null : pert.instrumentMetadata.measurementUncertaintyNs.toString(),
        uncertaintyStatus: pert.instrumentMetadata.uncertaintyStatus
      }
    }
  });

  if (demonstratedRejection) {
    if (!fullCoverage) reasons.push('Coverage is incomplete; REJECT is based only on the valid observed prefix');
    return { verdict: 'REJECT', reasons, evidence };
  }

  if (!fullCoverage && ref.events.length === pert.events.length) {
    return {
      verdict: 'INDETERMINATE/CENSORED',
      reasons: ['Full horizon [0,T] is not validly observable in both executions'],
      evidence
    };
  }

  if (ref.events.length !== pert.events.length) {
    const shorterTraceIsComplete = ref.events.length < pert.events.length ? refCoverage : pertCoverage;
    if (fullCoverage || shorterTraceIsComplete) {
      return {
        verdict: 'REJECT',
        reasons: [ref.events.length < pert.events.length
          ? 'An additional event is demonstrated against the fully observed shorter reference sequence'
          : 'An event is missing from the fully observed shorter perturbed sequence'],
        evidence: [{
          type: 'EVENT_COUNT_MISMATCH',
          referenceCount: ref.events.length,
          perturbedCount: pert.events.length,
          basis: fullCoverage ? 'BOTH_TRACES_FULLY_COVERED' : 'SHORTER_SEQUENCE_TRACE_FULLY_COVERED'
        }, ...evidence]
      };
    }
    return {
      verdict: 'INDETERMINATE/CENSORED',
      reasons: ['Observed event counts differ, but the shorter sequence may be incomplete'],
      evidence: [{
        type: 'EVENT_COUNT_DIFFERENCE_NOT_YET_DEMONSTRABLE',
        referenceCount: ref.events.length,
        perturbedCount: pert.events.length
      }, ...evidence]
    };
  }

  return {
    verdict: 'ACCEPT',
    reasons: ['Full coverage and all declared event-sequence criteria are satisfied'],
    evidence: [
      ...evidence,
      { type: 'STRUCTURAL_MATCH', eventCount: ref.events.length, identityOrderPayloadMode: options.payloadMode },
      { type: 'TEMPORAL_MATCH', allAbsoluteDeltasWithinTolerance: true, toleranceNs: toleranceNs.toString() }
    ]
  };
}
