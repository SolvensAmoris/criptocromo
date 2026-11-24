# AT-004-AUDIT-02 — Corrected implementation review

**Version:** 0.1  
**Date:** 2026-11-24  
**Status:** IMPLEMENTATION_CANDIDATE / NOT_FROZEN  
**Baseline:** `main` at `d817bb9e1283c944408900533ba549e87f76aee0`  
**Historical source:** `experiments/ATANOR-AT004-001/original/`  
**Prospective implementation:** `experiments/ATANOR-AT004-001/revised/`

## 1. Audit boundary

This review distinguishes the immutable historical implementation from a prospective candidate. The historical files and preregistration remain unchanged. The revised implementation is not a retroactive correction of earlier runs and does not authorize a new sweep.

The source receipt now confirms that `experiment.py` is present in the repository capture. Its earlier description as missing was stale. The capture contains five Python modules and the preregistration JSON. Git blob identities are recorded in `original/SOURCE-RECEIPT.md`; identity against a separate external filesystem copy remains unverified.

## 2. F-01 — Duplicate integration paths

**Historical defect confirmed.** `original/kuramoto.py::simulate` and `original/network_24.py::run_experiment` each implement Euler updates but differ in:
- step size (`0.05` default versus `0.1` in the experiment runner);
- whether phase noise is added;
- whether the order parameter is sampled before or after the update;
- whether time-varying frequencies are applied.

**Prospective disposition:** `revised/model.py` defines one `euler_step`; the simulation loop calls only that function. The candidate fixes `dt=0.1` as its default, uses zero added noise, evaluates forcing at the pre-update time `t_n`, and records observables at post-update times `t_{n+1}`. The last 100 samples at `T=500`, `dt=0.1` therefore correspond to 490.1 through 500.0 inclusive.

**Status:** CLOSED IN CANDIDATE; requires review and CI confirmation.

## 3. F-02 — Row normalization destroys symmetry

**Historical defect confirmed, with an arithmetic correction to Audit-01 v0.1.** Before normalization, the 24-node matrix is symmetric. Its actual unnormalized row sums are:
- node 0: 23.0;
- nodes 1–5: 7.8 each;
- nodes 6–23: 8.4 each.

The earlier value 7.6 for every non-hub row was incorrect. The difference arises because node 0's edge is overwritten to weight 1.0 after the within-community weights are assigned.

Row normalization divides by unequal row sums and makes the effective matrix asymmetric. In particular, `A[0,1]=1/23` while `A[1,0]=1/7.8`.

**Prospective disposition:** the candidate divides the entire symmetric matrix by its global mean weighted degree, `sum_ij(A_ij)/N`. This preserves `A_ij=A_ji` and makes the mean row sum equal to 1. Individual row sums are not forced to 1; preserving the relative strength of the hub and community nodes is intentional.

**Status:** CLOSED IN CANDIDATE; covered by symmetry and global-normalization tests.

## 4. F-03 — Common-mode modulation and group assignment

**Historical defect confirmed.** The historical function multiplies every oscillator's natural frequency by one shared scalar. The cycle signals are not assigned to the four six-node groups.

**Prospective disposition:** the candidate uses an explicit synthetic partition:
- nodes 0–5: Metonic;
- nodes 6–11: Callippic;
- nodes 12–17: Saros;
- nodes 18–23: Lunar.

Each group receives only its assigned cycle. All four amplitudes are set to 0.1 in this candidate so that period is the varying drive property rather than amplitude. This is a prospective modeling choice, not an archaeological claim and not a parameter found in the original preregistration. It must be reviewed and frozen in a versioned amendment before any confirmatory run.

The groups are synthetic partitions of a 24-node model. They are not asserted to correspond one-to-one to four physically isolated subsystems in the historical mechanism.

**Status:** IMPLEMENTED AS AN EXPLICIT PROPOSAL; SCIENTIFIC FREEZE PENDING REVIEW.

## 5. Additional defects handled or bounded

- **Scaling propagation:** the explicit `scaling` argument is used for every period. Tests verify the four scaled periods and verify that changing the factor changes the result.
- **Fixed topology size:** the candidate rejects `N != 24` rather than implying unsupported generality.
- **Output completeness:** the candidate returns time stamps, per-node frequency traces, order-parameter history, final phases, coupling matrix, seed, and configuration. A durable run manifest, source revision and artifact checksums are still required before campaign execution.
- **Overlapping historical thresholds:** the original Boolean criteria are not changed. Their overlap on `0.7 < r <= 0.8` remains a reporting limitation; no mutually exclusive labels are introduced.
- **Aggregation:** the historical aggregate still pools K values. The candidate does not introduce a pooled aggregate. Any campaign report must summarize each K and topology separately.
- **Fast lunar drive:** with scaling 6.5, the lunar period is 0.4862 simulated time units. At `dt=0.1`, this is approximately 4.862 steps per cycle. The candidate does not claim numerical convergence; the planned step-size study remains mandatory.

## 6. Tests

The prospective test suite covers:
1. symmetric coupling matrix;
2. global mean weighted-degree normalization;
3. rejection of unsupported node counts;
4. scaling propagation;
5. complete, one-to-one group-drive assignment;
6. isolation of a drive to its assigned group;
7. one-step Euler arithmetic;
8. deterministic seeded execution and post-update sampling;
9. rejection of invalid time grids and insufficient summary windows.

The local test run executed 8 tests successfully. CI must independently reproduce this result after the PR is opened. Unit tests validate implementation contracts; they are not experimental results.

## 7. Execution gate

No AT-004 sweep or confirmatory execution has been run as part of this audit. The historical preregistration remains untouched. Before execution, reviewers must approve:
- the synthetic group-to-cycle mapping;
- the equal amplitude 0.1 choice or a justified alternative;
- whether the changed coupling normalization is the intended prospective model;
- the time-step convergence plan and numerical tolerances;
- a versioned amendment to the historical protocol;
- the run manifest, environment capture and artifact schema;
- the original overlapping success-criterion interpretation.

**Current decision:** the candidate is ready for code review, not for confirmatory execution. MODEL != EVIDENCE.
