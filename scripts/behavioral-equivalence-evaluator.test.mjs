import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INT64_MAX,
  INT64_MIN,
  coversHorizon,
  createMonotonicRunClock,
  evaluateEventEquivalence,
  unionIntervals
} from './behavioral-equivalence-evaluator.mjs';

const options = { timeDomain: 'FIXED_TICK', timeUnit: 'ns', horizonNs: 100n, toleranceNs: 5n, payloadMode: 'IGNORE' };
const full = [{ startNs: 0n, endNs: 100n }];
const trace = (events = [], overrides = {}) => ({
  events,
  processActiveIntervals: full,
  recorderValidIntervals: full,
  acquisitionErrors: [],
  ...overrides
});
const event = (id, timeNs, payload) => ({ id, timeNs: BigInt(timeNs), ...(payload === undefined ? {} : { payload }) });
const evaluate = (ref, pert, extra = {}) => evaluateEventEquivalence(ref, pert, { ...options, ...extra });

test('accepts exact event sequences with complete inclusive coverage', () => {
  assert.equal(evaluate(trace([event('A', 0), event('B', 100)]), trace([event('A', 0), event('B', 100)])).verdict, 'ACCEPT');
});

test('accepts a temporal difference exactly equal to tau', () => {
  assert.equal(evaluate(trace([event('A', 20)]), trace([event('A', 25)])).verdict, 'ACCEPT');
});

test('rejects a temporal difference greater than tau', () => {
  const result = evaluate(trace([event('A', 20)]), trace([event('A', 26)]));
  assert.equal(result.verdict, 'REJECT');
  assert.equal(result.evidence[0].type, 'EVENT_TIMING_OUT_OF_TOLERANCE');
});

test('rejects identity or order mismatch in the observed common prefix', () => {
  assert.equal(evaluate(trace([event('A', 10), event('B', 20)]), trace([event('B', 10)], {
    processActiveIntervals: [{ startNs: 0n, endNs: 40n }],
    recorderValidIntervals: [{ startNs: 0n, endNs: 40n }]
  })).verdict, 'REJECT');
});

test('rejects missing or additional events only with complete coverage', () => {
  assert.equal(evaluate(trace([event('A', 10), event('B', 20)]), trace([event('A', 10)])).verdict, 'REJECT');
});

test('censors an apparently matching prefix when either execution ends before T', () => {
  const partial = [{ startNs: 0n, endNs: 80n }];
  const result = evaluate(
    trace([event('A', 10)]),
    trace([event('A', 10)], { processActiveIntervals: partial, recorderValidIntervals: partial })
  );
  assert.equal(result.verdict, 'INDETERMINATE/CENSORED');
});

test('rejects a demonstrated prefix violation even when coverage is later lost', () => {
  const partial = [{ startNs: 0n, endNs: 80n }];
  const result = evaluate(
    trace([event('A', 10)]),
    trace([event('B', 10)], { processActiveIntervals: partial, recorderValidIntervals: partial })
  );
  assert.equal(result.verdict, 'REJECT');
  assert.ok(result.reasons.some((reason) => reason.includes('valid observed prefix')));
});

test('detects a recorder gap even when the process remains active', () => {
  const result = evaluate(
    trace([event('A', 10)]),
    trace([event('A', 10)], { recorderValidIntervals: [
      { startNs: 0n, endNs: 40n }, { startNs: 42n, endNs: 100n }
    ] })
  );
  assert.equal(result.verdict, 'INDETERMINATE/CENSORED');
});

test('includes an event exactly at T', () => {
  assert.equal(evaluate(trace([event('END', 100)]), trace([event('END', 100)])).verdict, 'ACCEPT');
});

test('merges overlapping and adjacent inclusive nanosecond intervals', () => {
  assert.deepEqual(unionIntervals([
    { startNs: 0n, endNs: 60n },
    { startNs: 61n, endNs: 100n },
    { startNs: 50n, endNs: 70n }
  ]), [{ startNs: 0n, endNs: 100n }]);
});

test('detects a one-nanosecond coverage gap', () => {
  assert.equal(coversHorizon([
    { startNs: 0n, endNs: 60n },
    { startNs: 62n, endNs: 100n }
  ], 100n), false);
});

test('accepts exact boundary continuity at end + 1 ns', () => {
  assert.equal(coversHorizon([
    { startNs: 0n, endNs: 60n },
    { startNs: 61n, endNs: 100n }
  ], 100n), true);
});

test('rejects float/Number time values rather than coercing them', () => {
  const result = evaluate(trace([event('A', 10)]), trace([event('A', 10)]), { horizonNs: 100, toleranceNs: 5 });
  assert.equal(result.verdict, 'INDETERMINATE/CENSORED');
});

test('rejects invalid or overflowing horizon/tolerance inputs', () => {
  assert.equal(evaluate(trace(), trace(), { horizonNs: INT64_MAX + 1n }).verdict, 'INDETERMINATE/CENSORED');
  assert.equal(evaluate(trace(), trace(), { toleranceNs: -1n }).verdict, 'INDETERMINATE/CENSORED');
  assert.equal(INT64_MIN, -(1n << 63n));
});

test('requires explicit temporal domain and unit', () => {
  const result = evaluateEventEquivalence(trace(), trace(), { horizonNs: 100n, toleranceNs: 5n, payloadMode: 'IGNORE' });
  assert.equal(result.verdict, 'INDETERMINATE/CENSORED');
});

test('compares payload only when the contract explicitly requests it', () => {
  const ref = trace([event('A', 10, { code: 1, label: 'x' })]);
  const pert = trace([event('A', 10, { label: 'x', code: 2 })]);
  assert.equal(evaluate(ref, pert, { payloadMode: 'IGNORE' }).verdict, 'ACCEPT');
  assert.equal(evaluate(ref, pert, { payloadMode: 'EXACT' }).verdict, 'REJECT');
});

test('logical RUN_START is zero and elapsed values use monotonic BigInt subtraction', () => {
  const readings = [9000000000000000000n, 9000000000000000007n];
  const clock = createMonotonicRunClock(() => readings.shift());
  assert.deepEqual(clock.readElapsedNs(), { valid: true, timeNs: 0n });
  assert.deepEqual(clock.readElapsedNs(), { valid: true, timeNs: 7n });
});

test('monotonic source failure is sticky and produces invalid acquisition evidence', () => {
  const clock = createMonotonicRunClock(() => { throw new Error('clock unavailable'); });
  const first = clock.readElapsedNs();
  assert.equal(first.valid, false);
  assert.equal(first.reason, 'MONOTONIC_CLOCK_FAILURE');
  assert.deepEqual(clock.readElapsedNs(), first);
});

test('rejects Number readings and backward monotonic readings', () => {
  const numberClock = createMonotonicRunClock(() => 12);
  assert.equal(numberClock.readElapsedNs().reason, 'MONOTONIC_READING_NOT_BIGINT');
  const readings = [100n, 99n];
  const backwardClock = createMonotonicRunClock(() => readings.shift());
  assert.equal(backwardClock.readElapsedNs().timeNs, 0n);
  assert.equal(backwardClock.readElapsedNs().reason, 'MONOTONIC_CLOCK_MOVED_BACKWARD');
});

test('rejects elapsed int64 overflow without wrapping or saturation', () => {
  const readings = [0n, INT64_MAX + 1n];
  const clock = createMonotonicRunClock(() => readings.shift());
  assert.equal(clock.readElapsedNs().timeNs, 0n);
  assert.equal(clock.readElapsedNs().reason, 'INT64_OVERFLOW');
});

test('rejects malformed interval bounds and malformed event timestamps', () => {
  assert.equal(evaluate(trace([], { recorderValidIntervals: [{ startNs: 2n, endNs: 1n }] }), trace()).verdict, 'INDETERMINATE/CENSORED');
  assert.equal(evaluate(trace([{ id: 'A', timeNs: 1 }]), trace()).verdict, 'INDETERMINATE/CENSORED');
});
