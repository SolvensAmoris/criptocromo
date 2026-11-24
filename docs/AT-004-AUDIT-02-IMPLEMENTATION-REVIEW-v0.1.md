# AT-004 — Implementation review and validation audit

**Version:** 0.2  
**Date:** 2026-11-24  
**Status:** IMPLEMENTATION_CANDIDATE / NOT_FROZEN  
**Baseline:** merged candidate v0.1 on `main`; v0.2 review branch is prospective  
**Historical source:** `experiments/ATANOR-AT004-001/original/`  
**Prospective implementation:** `experiments/ATANOR-AT004-001/revised/`

## 1. Audit boundary

The historical source snapshot and preregistration remain immutable. The v0.2 work strengthens implementation validation and execution provenance. It does not amend the historical preregistration and does not authorize a sweep or confirmatory run.

## 2. v0.1 findings retained

- F-01: one forward-Euler integration path in the candidate, with forcing at pre-update time and observables at post-update time.
- F-02: global mean weighted-degree normalization preserves matrix symmetry; it does not normalize every row independently.
- F-03: four synthetic six-node groups receive explicit cycle assignments. Mapping and equal amplitude 0.1 remain scientific review decisions.

The v0.1 candidate's diagnostic values are not treated as confirmatory evidence. The single-seed results and one-K step-size comparison do not establish a transition or general numerical convergence.

## 3. v0.2 defects addressed

### D-01 — Non-finite initial conditions

**Finding:** v0.1 checked vector lengths but did not reject NaN or infinity in initial phases and frequencies. Such values could contaminate the trajectory and summary.

**Change:** finite numeric validation is applied to initial phase/frequency vectors, Euler inputs, generated phases, and order-parameter inputs.

**Tests:** NaN, positive infinity, and negative infinity are rejected in both initial vectors.

**Status:** ADDRESSED IN CANDIDATE; CI review pending.

### D-02 — Incomplete drive-isolation coverage

**Finding:** the earlier test activated only the Saros group.

**Change:** the test suite independently activates each of the four assigned drives and verifies that exactly the corresponding six-node group is modulated.

**Status:** ADDRESSED IN CANDIDATE; CI review pending.

### D-03 — Fixed sample count changes physical window with dt

**Finding:** the final 100 samples cover different physical durations when dt changes.

**Change:** the historical `r_mean_last_100` is retained for historical-grid compatibility. A separate `window_mean_order_parameter(times, values, start, end)` computes an inclusive fixed physical-time window and rejects invalid or empty intervals.

**Tests:** equivalent linear traces sampled at different resolutions yield the same mean over the same physical interval.

**Status:** ADDRESSED IN CANDIDATE; CI review pending.

### D-04 — Documentation/test-count mismatch

**Finding:** v0.1 documentation listed nine covered properties while the suite contained eight test methods.

**Change:** v0.2 expands the suite and documents executable tests and covered properties separately. Test method count must be taken from the CI log, not inferred from a prose checklist.

**Status:** ADDRESSED IN CANDIDATE; CI review pending.

### D-05 — Missing durable run manifest

**Finding:** v0.1 returned in-memory results but did not write a durable manifest or checksums.

**Change:** `run_manifest.py` writes canonical `results.json` and `manifest.json`, recording the supplied Git revision, seed, K, configuration, runtime environment, result SHA-256, byte length, and optional model-source SHA-256. A deterministic run ID is derived from source revision, seed, K, configuration, and result digest.

**Tests:** manifest identity, environment fields, result digest, required inputs, and optional source digest are tested.

**Boundary:** a self-generated manifest is not an independent attestation, trusted timestamp, or proof of execution provenance. It is a reproducible record whose claims must be checked against retained files and repository history.

**Status:** IMPLEMENTED IN CANDIDATE; CI review pending.

## 4. Remaining scientific and numerical gates

The following are not implementation defects and are intentionally not silently changed:

- synthetic group-to-cycle mapping;
- equal drive amplitude 0.1;
- global coupling normalization as the prospective model definition;
- overlapping historical thresholds for `0.7 < r <= 0.8`;
- campaign aggregation and reporting by K/topology;
- convergence tolerances and the required step-size design;
- seed set and versioned protocol amendment.

The lunar period remains 0.4862 simulated-time units at scaling 6.5. The previous one-K, one-seed diagnostic is preliminary only. A full convergence design must be preregistered before a confirmatory campaign.

## 5. Execution status

No multi-seed sweep or confirmatory campaign is included in this change. Unit tests validate implementation contracts only. No claim of physical correspondence, emergence, synergy, or causal effect is supported by these tests.

**Decision:** v0.2 is prepared for code review and CI. It is not frozen and is not authorization to execute a confirmatory campaign.
