# AT-004 revised model specification — candidate v0.1

**Status:** PROPOSED / REVIEW REQUIRED / NOT FROZEN  
**Historical protocol:** `experiments/ATANOR-AT004-001/original/at004_prereg.json` (immutable)  
**Implementation:** `experiments/ATANOR-AT004-001/revised/model.py`

## 1. Purpose and boundary

This document defines a prospective implementation candidate for the 24-node Kuramoto-inspired simulation. It does not reconstruct the historical Antikythera mechanism and does not amend the historical preregistration. No confirmatory sweep is authorized.

## 2. State equation

For node `i`:

\[
\theta_i(t+\Delta t)=\theta_i(t)+\Delta t\left[\omega_i(t)+K\sum_{j=1}^{24}A_{ij}\sin(\theta_j(t)-\theta_i(t))\right].
\]

The candidate uses forward Euler, `dt=0.1` by default, zero added phase noise, and forcing evaluated at `t_n`. The order parameter is recorded after each update at `t_{n+1}`.

## 3. Coupling matrix

The unnormalized symmetric matrix has:
- within-group weight 0.8;
- between-group weight 0.2;
- hub node 0 connected to every other node with weight 1.0;
- zero diagonal.

The normalized matrix is:

\[
A'_{ij}=\frac{A_{ij}}{\bar d},\qquad
\bar d=\frac{1}{N}\sum_{i=1}^{N}\sum_{j=1}^{N}A_{ij}.
\]

This global scalar preserves symmetry. It does not force each row sum to one.

## 4. Synthetic drive assignment

The 24 nodes are divided into four contiguous synthetic groups of six:

| Group | Nodes | Assigned reference cycle | Reference period |
|---|---:|---|---:|
| 0 | 0–5 | Metonic | 19.0 years |
| 1 | 6–11 | Callippic | 76.0 years |
| 2 | 12–17 | Saros | 18.03 years |
| 3 | 18–23 | Lunar | 0.0748 years |

For group `g`:

\[
\omega_i(t)=\omega_i(0)\left[1+a_g\sin\left(\frac{2\pi t}{sT_g}\right)\right],
\]

where `s` is simulated-time units per reference year. The candidate uses `s=6.5` and `a_g=0.1` for all four groups.

Equal amplitudes are a deliberate simplifying choice: the drive period changes by group while amplitude is held constant. The amplitude 0.1 is a prospective parameter, not a value established by the historical preregistration or by archaeological evidence. The assignment is a synthetic modeling convention, not a claim that the physical mechanism contained four isolated oscillator communities.

## 5. Initial conditions and random generator

The convenience runner uses NumPy `default_rng(seed)` for initial phases and a separately initialized `default_rng(seed)` for natural frequencies, matching the historical runner's random-generator construction. The historical integrator and topology normalization are nevertheless different, so matching the seed does not imply matching trajectories.

## 6. Primary statistic

The candidate retains the historical descriptive statistic `r_mean_last_100`, computed from the final 100 post-update samples. At `T=500`, `dt=0.1`, sample timestamps are 490.1 through 500.0 inclusive.

The historical success rules overlap for `0.7 < r <= 0.8`. They remain unchanged in the historical preregistration and must not be interpreted as mutually exclusive classes.

## 7. Required review before execution

The reviewer must decide whether to accept the synthetic group mapping and equal amplitudes, or require a different versioned specification. The time-step convergence design remains open because the scaled lunar period is 0.4862 simulated time units, only about 4.862 steps at `dt=0.1`.

No sweep, confirmatory execution, or external validation is included in this candidate.
