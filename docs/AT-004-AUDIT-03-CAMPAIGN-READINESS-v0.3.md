# AT-004 — Implementation review and campaign readiness audit

**Version:** 0.3  
**Status:** CODE_REVIEW_CANDIDATE / PROTOCOL_AMENDMENT_PROPOSED  
**Baseline:** main at merge commit 86cedb9e9ffdac9afd589e749ecc657c86bcca7b  
**Historical source:** experiments/ATANOR-AT004-001/original/  
**Candidate:** experiments/ATANOR-AT004-001/revised/

## 1. Findings from v0.2 review

### R-01 — Sample mean mislabeled as physical-time mean

The v0.2 helper selected samples inside the requested interval and calculated their arithmetic mean. That result is not generally invariant to sample spacing for nonlinear trajectories. Its test used a linear trace, for which the sampling bias is hidden.

**Correction:** v0.3 computes a trapezoidal time average, linearly interpolates the requested interval boundaries, requires strictly increasing timestamps, and requires the recorded data to cover the complete interval. This is a numerical quadrature estimate, not an exactly dt-invariant statistic. A nonlinear quadratic test verifies improvement as the grid is refined.

### R-02 — Incomplete manifest identity

The v0.2 manifest accepted a short arbitrary revision string and treated the model source hash as optional. It did not bind the campaign runner or protocol bytes.

**Correction:** v0.3 requires a full lowercase 40-character Git SHA and existing model, dependency-lock, campaign-runner and protocol files. All four input hashes are included in the run identity and manifest. Seed and K are validated before writing output.

### R-03 — Campaign protocol was not executable as a complete unit

The prior candidate did not provide a single command to execute the registered seed set, retain run-level evidence, or summarize the outcomes.

**Correction:** v0.3 adds a campaign runner for 10 fixed seeds × 3 K values × 3 time steps = 90 runs. The primary campaign is 30 runs at dt=0.1. The additional 60 runs at dt=0.05 and 0.025 are a descriptive numerical-sensitivity analysis, not a convergence pass/fail test.

## 2. Historical source review

The original experiment runner uses:
- K values 0.2, 0.5 and 0.85;
- seeds 0, 1, 2, 3, 4, 7, 13, 21, 42 and 99;
- T=500 and dt=0.1;
- the same seed in separate NumPy Generators for initial phases and natural frequencies.

The executable historical metrics.py evaluates r_mean_last_100 for all three K values. The original JSON names this metric explicitly for K=0.2 but uses shorthand r for K=0.5 and K=0.85. Protocol amendment 01 resolves the shorthand to the executable metric. The original JSON and original source files are not modified.

The original drive implementation applies common Metonic, Saros and Lunar modulation to all nodes. The revised candidate's four-group-specific mapping, including Callippic, is a prospective modeling change. It is not a correction to the historical implementation and must not be represented as archaeological fact.

## 3. Frozen protocol proposal

Protocol amendment 01 v1.0.0 fixes:
- four synthetic six-node groups and their cycle assignments;
- amplitude 0.1 per group;
- global mean weighted-degree normalization;
- forward Euler, forcing at pre-update time and post-update observations;
- zero added noise, T=500, scaling 6.5;
- primary dt=0.1, K values and all ten original seeds;
- per-seed thresholds and per-K reporting;
- a secondary dt set of 0.05 and 0.025 for descriptive sensitivity;
- fail-stop handling and no seed replacement;
- source, runner, protocol and dependency hashes.

No pooled pass threshold is defined. The report will show seed-level outcomes, pass counts and Wilson intervals separately by K. Numerical sensitivity is descriptive; no convergence tolerance or convergence claim is defined.

## 4. Provenance and execution

Each run bundle contains canonical results and a manifest. The manifest binds the full Git SHA, model source, campaign runner, protocol JSON and dependency lock. It records the Python/NumPy/platform environment and result SHA-256.

The campaign runner writes 90 run bundles, a seed-level summary and a campaign manifest. The GitHub Actions campaign workflow is isolated to the dedicated campaign branch. No execution is triggered by this code-review PR.

A self-generated manifest is not a trusted timestamp or independent attestation. Its hashes must be independently recomputed.

## 5. Validation status

The v0.2 CI run passed 14 Python tests and the application checks. v0.3 adds tests for nonlinear quadrature behavior, time-axis validity, strict source identity, required input hashes, threshold boundaries and Wilson intervals. These new tests require a fresh CI run.

## 6. Claims boundary

The planned campaign can establish reproducible behavior of the frozen computational model under the recorded parameters. It cannot establish historical physical correspondence, emergence, synergy, causality, external validity or numerical convergence.
