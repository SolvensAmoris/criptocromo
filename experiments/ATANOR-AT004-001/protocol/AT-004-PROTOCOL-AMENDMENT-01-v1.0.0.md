# AT-004 protocol amendment 01 — v1.0.0

**Status:** FROZEN ON MERGE OF THIS AMENDMENT  
**Campaign ID:** ATANOR-AT004-001  
**Original preregistration:** experiments/ATANOR-AT004-001/original/at004_prereg.json (preserved unchanged)  
**Machine-readable contract:** experiments/ATANOR-AT004-001/protocol/AT-004-PROTOCOL-AMENDMENT-01-v1.0.0.json

## 1. Scope

This amendment freezes the prospective candidate's computational choices and resolves the executable metric interpretation. It does not rewrite or replace the historical preregistration. The original JSON remains byte-for-byte unchanged.

The experiment is a computational reproducibility campaign. It tests the behavior of this specific model, not the historical mechanism.

## 2. Frozen model

- 24 nodes, four synthetic groups of six.
- Nodes 0–5: Metonic, 19.0 reference years, amplitude 0.1.
- Nodes 6–11: Callippic, 76.0 reference years, amplitude 0.1.
- Nodes 12–17: Saros, 18.03 reference years, amplitude 0.1.
- Nodes 18–23: Lunar, 0.0748 reference years, amplitude 0.1.
- Scaling: 6.5 simulated units per reference year.
- Intra-group weight 0.8; inter-group weight 0.2; hub node 0 weight 1.0; diagonal zero.
- Normalize the complete symmetric matrix by its global mean weighted degree, sum(A_ij)/N.
- Forward Euler, primary dt=0.1, duration T=500, added noise zero.
- Evaluate drive at pre-update t_n; record order parameter after update at t_(n+1).
- Initial phases and natural frequencies use separate NumPy Generators initialized with the same seed. Phases are uniform on [0,2π); natural frequencies are normal with mean 1.0 and standard deviation 0.1.

The group-to-cycle mapping, amplitudes and normalization are explicit prospective modeling choices. They are not claims about archaeological gear assignments.

## 3. Primary campaign

Run all 10 preregistered seeds [0,1,2,3,4,7,13,21,42,99] at each K in [0.2,0.5,0.85], for 30 primary runs.

The primary metric is r_mean_last_100, the arithmetic mean of the last 100 post-update order-parameter observations. At dt=0.1, those observations are timestamped 490.1 through 500.0.

The executable historical metrics.py uses this metric for all three K values. The original preregistration JSON explicitly names r_mean_last_100 for K=0.2 but abbreviates the metric as r for K=0.5 and K=0.85. This amendment resolves that ambiguity in favor of the executable historical metric, without modifying the original file.

Seed-level criteria:
- K=0.2: r_mean_last_100 < 0.4.
- K=0.5: 0.4 <= r_mean_last_100 <= 0.8.
- K=0.85: r_mean_last_100 > 0.7.

Report all individual values and outcomes. Per K, report pass count, proportion, Wilson 95% interval, mean, sample standard deviation, median, minimum and maximum. Keep K strata separate. There is no all-seeds pass threshold and no pooled campaign-wide binary verdict.

## 4. Numerical sensitivity

Repeat the same seed/K combinations at dt=0.05 and dt=0.025, for 60 additional runs. Together with the primary set, this is 90 runs.

For each run, calculate a trapezoidal time average of r over [490.1,500.0], linearly interpolating boundary values. Compare the three time steps for each seed and K. Report absolute differences relative to dt=0.1.

This is a descriptive sensitivity analysis. No numerical tolerance or pass/fail convergence claim is specified. Do not describe these results as proof of numerical convergence.

## 5. Failure and retry rules

- A model exception, non-finite state or non-finite metric invalidates the run and stops the campaign. Preserve partial artifacts. Do not silently replace a seed.
- An infrastructure failure may be retried only with the exact same frozen commit, seed, K, dt and parameters. Retain attempt records.
- No source, parameter, criterion or seed changes are permitted after freeze. Any change requires a new amendment and campaign identifier.

## 6. Provenance

Every run bundle records the full 40-character Git commit SHA, SHA-256 hashes of model source, campaign runner, protocol JSON and dependency lock, the seed, K, dt and full configuration, Python/NumPy/platform environment, result SHA-256 and a deterministic run ID.

The manifest is a self-generated provenance record, not an independent attestation or trusted timestamp. Recompute all hashes during audit.

Target environment: Python 3.13.18 and NumPy 2.3.5.

## 7. Claims boundary

A successful run means only that the frozen computational model executed and produced the recorded outputs under the specified conditions. It does not establish historical physical correspondence, emergence, synergy, causality, external validity or numerical convergence.
