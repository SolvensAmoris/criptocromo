# AT-004 — Prospective control and numerical validation design

**Protocol status:** DRAFT_NOT_FROZEN  
**Campaign status:** NOT_EXECUTED / NOT_AUTHORIZED  
**Parent audit:** [AT-004-AUDIT-01](AT-004-AUDIT-01-MODEL-DEFINITION-CONTROL-DESIGN-v0.1.md)

## 1. Question

Does the proposed 24-node coupling architecture produce a different global or community-level synchronization profile from appropriately matched alternative topologies, under the same natural frequencies, initial phases, forcing, numerical method and random seed?

This is narrower than claiming that the historical Antikythera mechanism operated as a Kuramoto network.

## 2. Required controls

All controls must use paired seeds and identical oscillator-level inputs. Topology-specific normalization must be stated in advance because changing normalization can change effective coupling strength.

| ID | Condition | Purpose |
|---|---|---|
| T0 | (K=0), proposed topology retained but coupling disabled | Uncoupled baseline |
| T1 | Proposed four-community + reinforced-node topology | Candidate architecture |
| T2 | Homogeneous all-to-all reference | Dense symmetric reference |
| T3 | Degree/weight-preserving randomized topology | Tests dependence on arrangement beyond selected coarse graph properties |
| T4 | Four communities with central-node reinforcement removed | Tests the contribution of the central-node rule |

For T3, the randomization algorithm, number of randomized realizations and preserved invariants must be specified before execution. A single random graph is not an adequate representation of a randomized-topology null distribution.

## 3. Paired inputs

For every seed and parameter condition:
- generate (	heta_0) once and reuse it across topology conditions;
- generate (omega_0) once and reuse it across topology conditions;
- use identical forcing signals and integration time grid;
- record the exact topology matrix and its checksum;
- do not reuse one mutable matrix object across conditions if any condition modifies it.

This pairing reduces avoidable input variation. It does not make the resulting trajectories statistically independent.

## 4. Numerical convergence

Candidate time steps: (dt\in\{0.1,0.05,0.025,0.01\}).

Use the same initial conditions and continuous-time forcing definition. Compare:
- final-time and window-mean global order parameter;
- community order parameters;
- phase trajectories using a declared circular-distance metric;
- frequency traces;
- any threshold classification.

Define numerical tolerances before the convergence run. If a classification changes with time step, report the result as numerically unresolved at the coarser step rather than choosing the favorable output.

The fastest drive has scaled period 0.4862 time units under the supplied mapping. The candidate time-step grid is intended to test this resolution concern, not to presume that any one step is sufficient.

## 5. Observables

### Primary
Global order parameter (r_g(t)), with the primary summary statistic and sample timestamps explicitly defined in the frozen protocol.

### Secondary
- per-community (r_c(t));
- community mean phases and inter-community phase differences;
- instantaneous frequency summaries;
- phase-locking duration, only if operationally defined before execution.

Secondary outcomes remain secondary. They cannot be promoted to primary after inspection.

## 6. Statistics and reporting

Report per-seed outcomes and distributions separately by K and topology. Include:
- number of planned and completed trajectories;
- all exclusions and aborts, with reasons;
- mean, sample standard deviation, median, minimum and maximum;
- confidence intervals only with a predeclared method and estimand;
- paired contrasts between topology conditions;
- full configuration, source revision, runtime environment and artifact checksums.

Do not pool distinct K or topology conditions into one aggregate statistic.

## 7. Success-criterion handling

The original AT-004 thresholds are preserved as historical preregistered criteria. They overlap for (0.7<R\le0.8), so they cannot be interpreted as three mutually exclusive synchronization classes.

Before any new confirmatory run, publish a versioned amendment that:
- either retains the original three Boolean success rules and explicitly permits overlapping success;
- or defines mutually exclusive categories using new thresholds and explains why those thresholds are justified.

Do not choose amended thresholds after seeing new results.

## 8. Execution gate

This document does not authorize execution. A separate campaign specification must freeze:
- exact topology matrices or deterministic generation algorithms;
- active drive mapping and scaling units;
- integrator and step size;
- K values and seed list;
- sample timestamps and primary statistic;
- topology randomization count and preserved invariants;
- numerical tolerances;
- statistical analysis plan;
- artifact schema and checksums.

Only after independent review and explicit execution authorization may a campaign be dispatched.
