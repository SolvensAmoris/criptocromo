# Deterministic Behavioral-Equivalence Evaluator
## Version 0.1 | Event-sequence evaluator and temporal capture contract

**Status:** `DRAFT_NOT_FROZEN`  
**Scope:** deterministic comparison of two event traces under an explicitly declared fixed-tick nanosecond domain.  
**Out of scope:** continuous-valued observable comparison, causal inference, engine changes, historical result reanalysis, and campaign execution or authorization.

## 1. Temporal domain

The evaluator requires the explicit configuration:

```text
TEMPORAL_DOMAIN = FIXED_TICK
TIME_UNIT = ns
TIME_RESOLUTION = 1
TIME_ORIGIN = RUN_START
CLOCK_TYPE = MONOTONIC
INTEGER_TYPE = int64
OVERFLOW_POLICY = INDETERMINATE_CENSORED
FLOAT_CONVERSION = FORBIDDEN
```

- `RUN_START` is the logical origin of an execution. Its first successful representable timestamp is exactly `0 ns`.
- The monotonic clock's native reading need not itself start at zero. The capture adapter records a monotonic origin and stores elapsed nanoseconds relative to it.
- `T`, event timestamps, interval endpoints, and `tau` use the same unit: integer nanoseconds.
- Runtime values are `BigInt`; serialized interchange values must be decimal integer strings. A JSON adapter must validate decimal syntax and int64 bounds before converting to `BigInt`.
- Signed int64 bounds are `-9223372036854775808` through `9223372036854775807`. Run-relative elapsed timestamps, `T`, and `tau` must be non-negative.
- The int64 range limits representable stored values, not physical clock accuracy. Instrument resolution, accuracy, and uncertainty are separate metadata and are never silently added to `tau`.
- A Number/float input, non-integer value, incompatible unit, negative horizon/tolerance, failed monotonic source, backward clock reading, or int64 overflow invalidates acquisition/evaluation. Do not wrap, saturate, round, or coerce. Record reason and evidence; return `INDETERMINATE/CENSORED`, unless an independent rejection is already demonstrated by validly observed events.

## 2. Trace schema

Each trace contains:
- `events`: ordered records `{ id, timeNs, payload? }`. Existing array order is the emission sequence and must never be reconstructed by sorting timestamps.
- `processActiveIntervals`: closed intervals during which the process was active.
- `recorderValidIntervals`: closed intervals during which required event instrumentation and recording were valid.
- `acquisitionErrors`: optional list of acquisition/clock failure reasons. Any such error prevents ACCEPT.

An event's `id` is a non-empty exact identity/category string. Payload is ignored unless the task protocol explicitly selects `payloadMode=EXACT`; the mode must be explicit. This evaluator does not infer relevant payload fields.

Events with timestamps in inclusive `[0,T]` are evaluated, including an event exactly at `T`. Events after `T` are outside this comparison horizon. Negative or non-int64 timestamps invalidate the trace.

## 3. Coverage

All intervals are inclusive and measured in integer nanoseconds. In fixed-tick time, `[0,60]` and `[61,100]` are contiguous. `[0,60]` and `[62,100]` contain a one-nanosecond gap.

Intervals are sorted once and merged in `O(n log n)`; if already sorted, the merge scan is `O(n)`. Two intervals merge when `next.startNs <= current.endNs + 1 ns`. Coverage of `[0,T]` requires the union of process-active intervals to cover every tick and, independently, the union of recorder-valid intervals to cover every tick, including `T`.

Process activity alone is insufficient. A recorder gap invalidates coverage even if the process remained active.

## 4. Deterministic event comparison

Pair events by their existing zero-based sequence position. Do not sort, search for a lower-distance matching, or otherwise optimize correspondence.

For each position shared by both observed sequences:
1. Compare exact event identity.
2. If configured, compare payload exactly.
3. Compare absolute timestamp difference using integer arithmetic:
   `deltaNs = abs(perturbed.timeNs - reference.timeNs)`.
4. Reject if `deltaNs > tauNs`; equality to `tauNs` passes.

Because BigInt arithmetic is arbitrary precision in the evaluator, subtraction is performed without int64 intermediate overflow. Inputs are nevertheless validated against int64 before comparison.

A demonstrated identity/order, selected-payload, or timing violation in the valid observed common prefix yields `REJECT`, even if coverage is later lost. An event-count difference yields `REJECT` when both traces have complete coverage, or when the shorter sequence belongs to a trace that independently has complete process and recorder coverage. In the latter case, the fully observed shorter trace establishes that the event is absent/additional relative to that horizon. If the shorter trace is not fully covered, its sequence may simply be censored before a later event, so the count difference alone is `INDETERMINATE/CENSORED`.

## 5. Decision precedence

Apply this order:

1. If a predeclared rejection condition is demonstrably violated by validly observed event evidence, return `REJECT`, preserving any coverage/acquisition diagnostic.
2. Otherwise, if either trace has malformed/invalid input, incomplete process coverage, incomplete recorder coverage, or acquisition errors, return `INDETERMINATE/CENSORED`.
3. Only with valid inputs, full inclusive coverage of both traces, exact structural agreement, and every event delta `<= tauNs`, return `ACCEPT`.

No unobserved event is treated as absent. No missing value is imputed as zero. A guard or clock failure is not automatically a behavioral mismatch unless the task protocol independently declares it a rejection condition.

## 6. Synthetic test requirements

The v0.1 test suite covers:
- exact match and complete coverage;
- delta exactly equal to `tau` and greater than `tau`;
- identity/order mismatch;
- missing/additional event count under complete coverage;
- incomplete horizon with no demonstrated rejection;
- demonstrated prefix rejection followed by censoring;\n- an additional/missing event demonstrated by the shorter fully covered trace while the longer trace is censored;\n- event-count difference with both traces censored remains indeterminate;
- process-active but recorder-invalid gaps;
- event exactly at `T`;
- overlapping, adjacent, and one-nanosecond-gap intervals;
- explicit domain/unit and rejection of Number/float values;
- int64 boundary and overflow behavior;
- monotonic clock failure, backward reading, and sticky invalid state;
- optional exact payload comparison.

## 7. Interpretation boundary

This module evaluates event-sequence equivalence only. It does not implement continuous `Y_t` comparisons, select task observables, establish causality, demonstrate emergence or intelligence, or validate the scientific model. Synthetic tests are software verification, not experimental evidence. No ATANOR campaign is executed or authorized by this change.
