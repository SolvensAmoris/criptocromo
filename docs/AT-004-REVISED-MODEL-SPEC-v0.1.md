# AT-004 revised model specification — candidate v0.2

**Status:** PROPOSED / REVIEW REQUIRED / NOT FROZEN  
**Historical protocol:** `experiments/ATANOR-AT004-001/original/at004_prereg.json` (immutable)  
**Implementation:** `experiments/ATANOR-AT004-001/revised/model.py`  
**Manifest writer:** `experiments/ATANOR-AT004-001/revised/run_manifest.py`

## 1. Purpose and boundary

This document defines a prospective implementation candidate for the 24-node Kuramoto-inspired simulation. It does not reconstruct the historical Antikythera mechanism and does not amend the historical preregistration. The changes in v0.2 strengthen input validation, group-drive tests, physical-time summaries, and run provenance. They do not authorize a confirmatory sweep.

## 2. Model retained from v0.1

The state equation, forward-Euler integrator, zero added noise, pre-update forcing time, post-update observation convention, global mean weighted-degree normalization, synthetic group-to-cycle mapping, scaling 6.5, and equal drive amplitude 0.1 remain unchanged from v0.1.

The synthetic groups remain:
- nodes 0–5: Metonic;
- nodes 6–11: Callippic;
- nodes 12–17: Saros;
- nodes 18–23: Lunar.

These are prospective modeling conventions, not archaeological claims. Their scientific acceptance remains open.

## 3. v0.2 implementation safeguards

- Initial phase and frequency vectors are checked for finite numeric values.
- Euler inputs and generated phases are checked for finite values.
- The order parameter rejects non-finite phase input.
- `window_mean_order_parameter` computes a statistic over an inclusive physical-time interval, rather than a fixed number of records. It rejects invalid bounds, non-finite values, and empty windows.
- The historical `r_mean_last_100` is retained unchanged for compatibility with the original registered summary at the original grid. It must not be used as a cross-`dt` comparison because its physical duration changes with sample spacing.
- Initial phase and frequency vectors are returned in the result so that the actual initial state can be audited.

## 4. Group-drive isolation tests

Tests now activate one synthetic group at a time. For each of the four assigned periods, the test verifies that only the six nodes belonging to that group receive the corresponding modulation at one-quarter period. This tests implementation isolation; it does not validate the scientific rationale for the partition or cycle assignment.

## 5. Durable run bundle

`run_manifest.py` writes:
- `results.json`: canonical JSON serialization of the complete result;
- `manifest.json`: schema version, deterministic run identity, UTC creation time, source Git revision, seed, K, complete model configuration, Python/platform/NumPy environment, result SHA-256 and byte length, and optional SHA-256 of the model source file.

The caller must supply the exact source commit SHA. A source hash is included only when the model source path is supplied. The manifest is a provenance record, not a trusted timestamp, external attestation, or proof that the recorded source was actually executed. Independent verification must recompute hashes from the retained files and compare the commit/source identity.

## 6. Statistical and numerical reporting

For cross-step-size comparisons, use identical physical-time windows, such as `[490, 500]`, with the physical-window helper. Report the sample count and `dt` alongside the statistic. The historical final-100-sample statistic remains a separate compatibility measure.

The lunar period at scaling 6.5 remains 0.4862 simulated-time units. The v0.1 diagnostic showed a small difference in one K/seed/window case, but that is not a general convergence demonstration. A preregistered convergence design must specify tested step sizes, tolerances, K values, seeds, and observables before any confirmatory campaign.

## 7. Required review before execution

The reviewer must still decide whether to accept the synthetic group mapping and equal amplitudes, and whether the global coupling normalization is the intended prospective model. A versioned protocol amendment must also resolve:
- time-step convergence design and numerical tolerances;
- the overlapping historical thresholds for `0.7 < r <= 0.8`;
- whether and how results are summarized separately by K and topology;
- exact run-manifest schema and source-revision procedure;
- seed set and campaign scope.

No sweep, confirmatory execution, or external validation is authorized by this candidate or its unit tests.
