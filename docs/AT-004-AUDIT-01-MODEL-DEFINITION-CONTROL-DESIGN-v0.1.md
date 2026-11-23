# AT-004-AUDIT-01 — Model definition and control design

**Status:** DRAFT_NOT_FROZEN  
**Scope:** ATANOR-AT004-001 / ANTICITERA  
**Source basis:** user-supplied source excerpts and preregistration reproduced in the audit conversation on 2026-11-23.  
**Repository baseline:** `228d65f14b6757a7b1c1a90a284772e83cd2bf71`.

## 1. Purpose

This phase audits the computational definition before any new confirmatory execution. It separates:
- astronomical reference periods and their time mapping;
- the oscillator network topology;
- the Kuramoto dynamics and numerical integrator;
- observables and success criteria;
- topology and numerical controls.

The original AT-004 preregistration is historical evidence and must not be silently edited. Changes proposed here are prospective. No new sweep, confirmatory campaign, or physical replication is authorized by this document.

## 2. Original preregistered design

- Experiment: `ATANOR-AT004-001`
- Nodes: 24
- Coupling values: (K\in\{0.2,0.5,0.85\})
- Seeds: `[0,1,2,3,4,7,13,21,42,99]`
- Horizon: (T=500)
- Integrator step in `network_24.py`: (dt=0.1)
- Intended topology: four groups of six, with node 0 given stronger coupling.
- Primary recorded observable: global Kuramoto order parameter (r(t)).
- Reported statistic: mean of the last 100 recorded values of (r).

The planned original sweep contains 3 × 10 = 30 trajectories. This count is a design count, not evidence that the sweep was executed.

## 3. Source-level findings

### F-01 — Two integration paths

`kuramoto.py::simulate` and `network_24.py::run_experiment` implement separate Euler updates. The former adds Gaussian phase noise after each step; the latter does not call it and does not add that noise. The former records (r) before the update; the latter records (r) after the update. The latter also applies time-varying frequencies.

**Disposition:** define one canonical integrator and route all experiment execution through it. Preserve the historical implementation and outputs; do not retroactively relabel old runs.

### F-02 — Row normalization makes the effective coupling directed

The pre-normalized matrix is symmetric. Row normalization divides each row by a different row sum. For the supplied 24-node construction, row 0 has sum 23 and each other row has sum 7.6. Thus, for (j\ne0), (A_{0j}=1/23) while (A_{j0}=1/7.6).

**Disposition:** explicitly choose and document one of:
1. directed row-normalized coupling;
2. symmetric weighted coupling with a declared global normalization;
3. another justified normalization.

Do not describe the post-normalization matrix as symmetric.

### F-03 — Common-mode frequency modulation

The supplied `modulated_omega` multiplies every natural frequency by the same scalar (M(t)):
[
\omega_i(t)=\omega_i(0)M(t).
]
The metonic, saros and lunar signals therefore act as a common-mode temporal modulation. They are not assigned to separate node groups or gear-specific channels.

**Disposition:** retain common-mode forcing only if that is the intended model. If the scientific question concerns gear-train-inspired differentiated drives, define a node-to-drive mapping prospectively and justify it independently.

### F-04 — Declared periods not all used

The period dictionary contains metonic, callippic, saros, exeligmos and lunar periods. The supplied modulation function uses only metonic, saros and lunar. Callippic and exeligmos are computed but do not affect the trajectory.

**Disposition:** distinguish active drives from reference-only cycles in configuration and reporting.

### F-05 — Ignored function argument

`modulated_omega(..., scaling=SCALING)` does not pass its argument to `get_scaled_periods`; the global constant is used instead.

**Disposition:** make the time-mapping factor an explicit configuration value propagated through every period calculation, with a test proving that changing it changes the resulting periods.

### F-06 — Scaling semantics

The code multiplies periods by 6.5:
[
T_{sim}=6.5\,T_{reference}.
]
Thus 6.5 is a time-mapping factor in simulated-time units per reference year, not a period-reduction factor. The simulated time unit must be named explicitly. The mapping is a model convention, not a mechanical gear ratio.

### F-07 — Lunar period resolution

The supplied lunar period is 0.0748 years, mapped to 0.4862 simulated time units. At (dt=0.1), this yields about 4.862 integration steps per cycle. This is a resolution warning, not by itself proof of instability or invalidity.

**Disposition:** perform a prospective time-step convergence study. Candidate steps: 0.1, 0.05, 0.025 and 0.01, with all other inputs held fixed. Compare predeclared observables and numerical error; do not select a step based on which produces the desired classification.

### F-08 — Fixed-size topology assumption

The supplied matrix builder hardcodes four clusters of six. The public argument (N) suggests generality that the implementation does not provide.

**Disposition:** either enforce (N=24) with an explicit validation error or implement and test a general partitioning rule. The initial AT-004 protocol should remain (N=24).

### F-09 — Incomplete result record

`omega_history` is accumulated but not returned. The result also omits the final phase vector and the configuration/provenance needed to reconstruct the run from the returned object alone.

**Disposition:** prospective runner should return or persist configuration, time grid, frequency traces, phase/order-parameter traces, topology metadata, seed, code identity and artifact checksums.

### F-10 — Success criteria overlap

Original criteria:
- (K=0.2: R<0.4)
- (K=0.5: 0.4\le R\le0.8)
- (K=0.85: R>0.7)

The middle and high-coupling criteria overlap on (0.7<R\le0.8). They are not mutually exclusive categories. The implementation in `metrics.py` correctly reproduces the original strings and uses `r_mean_last_100`; the defect is in category interpretation, not translation.

**Disposition:** preserve original criteria as the historical preregistered rule. Any mutually exclusive classification must be a separately versioned prospective amendment, justified before new data are inspected.

### F-11 — Exact temporal meaning of the last-100 statistic

In the supplied `run_experiment`, (r) is recorded after each Euler update. With 5,000 steps and (dt=0.1), the 100 final recorded values correspond to post-update times 490.1 through 500.0 inclusive. They span 9.9 time units between the first and last sample, not 100 time units.

**Disposition:** specify the sample count, timestamp convention, endpoint inclusion and statistic explicitly in any amended protocol.

### F-12 — Aggregation pools coupling conditions

The supplied `aggregate_metrics` computes one mean and standard deviation across all results, mixing K values.

**Disposition:** report distributions separately by K and by topology/control. Preserve per-seed values. Use sample standard deviation where describing between-seed sample variability, and state the confidence-interval method if intervals are reported.

## 4. Observable limits

The global order parameter is:
[
r_g(t)=\left|\frac{1}{N}\sum_{j=1}^{N}e^{i\theta_j(t)}\right|.
]
It measures global phase concentration. It does not by itself establish equal frequencies, stationarity, phase-locking duration, causal attribution to topology, or local organization.

Prospective secondary observables may include:
- order parameter per six-node community;
- community mean phase and inter-community phase differences;
- natural and instantaneous frequency traces;
- phase-locking indicators with a predeclared definition;
- sensitivity to time step and initial conditions.

Secondary observables must not replace the original primary outcome after results are seen.

## 5. L1–L5 audit status

| Level | Meaning | Current status |
|---|---|---|
| L1 | Implementation | PARTIAL: two integration paths, ignored argument, fixed-size assumptions, incomplete output |
| L2 | Mathematical definition | PARTIAL: Kuramoto form is recognizable; coupling normalization and drive mapping need explicit specification |
| L3 | Reproducibility | PENDING: no canonical run artifact, environment record or executed-run provenance supplied in this audit |
| L4 | External validation | PENDING: no quantitative comparison to an independently specified physical/mechanical reference |
| L5 | Robustness | PENDING: no topology controls, convergence study or parameter sensitivity evidence |

These statuses describe the supplied code and documentation only. They are not results of a new execution.

## 6. Non-claims

This phase does not establish:
- that the historical Antikythera mechanism was a network of Kuramoto oscillators;
- that the proposed 24-node topology faithfully reconstructs its gear train;
- that topology causes synchronization;
- emergence, synergy, intelligence or natural-system equivalence;
- robustness or external validity.

## 7. Phase exit criteria

The phase may be considered ready for protocol freeze only after:
1. canonical integrator and time convention are specified;
2. coupling normalization and directionality are explicit;
3. active drive mapping and time-scaling units are explicit;
4. primary and secondary observables are defined;
5. original success criteria are preserved and any amendment is versioned;
6. controls and convergence design are preregistered;
7. tests cover topology invariants, scaling propagation, determinism and metric boundaries;
8. a reviewer can reproduce the protocol from repository artifacts alone.

**Current phase status: OPEN / DESIGN AUDIT IN PROGRESS.**
