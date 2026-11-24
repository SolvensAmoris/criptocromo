# AT-004 revised model and execution specification — v0.3

**Status:** candidate for review; protocol amendment 01 is separately versioned  
**Implementation:** experiments/ATANOR-AT004-001/revised/model.py  
**Campaign runner:** experiments/ATANOR-AT004-001/revised/run_campaign.py  
**Manifest:** experiments/ATANOR-AT004-001/revised/run_manifest.py  
**Frozen-protocol proposal:** experiments/ATANOR-AT004-001/protocol/AT-004-PROTOCOL-AMENDMENT-01-v1.0.0.md

## 1. Numerical window statistic

The physical-time statistic is a trapezoidal quadrature average over a specified interval. Boundary values are linearly interpolated. Timestamps must be finite and strictly increasing, and the recorded series must cover the full interval.

The statistic is not exactly invariant to dt for nonlinear signals. It provides a consistent physical-time integral approximation whose discretization error can be examined by grid refinement. The original r_mean_last_100 remains the primary metric at dt=0.1 to preserve the executable historical metric.

## 2. Run provenance

A run manifest requires:
- a full lowercase 40-character Git commit SHA;
- model source file;
- dependency lock file;
- campaign runner source;
- protocol JSON.

The manifest records SHA-256 for all four source inputs and for results.json. Its deterministic run ID binds those hashes with source revision, seed, K, configuration and result digest. Runtime environment includes Python, implementation, platform and NumPy.

The manifest does not prove that a supplied SHA was actually checked out or that the files were executed. The campaign workflow supplies GITHUB_SHA and the checked-out repository files; independent audit must recompute hashes.

## 3. Campaign execution

The runner executes the fixed ten-seed set for three K values at dt=0.1, 0.05 and 0.025, producing 90 run bundles. The primary 30 runs at dt=0.1 use r_mean_last_100 for the registered per-K criteria. The additional 60 runs support descriptive sensitivity comparisons using the trapezoidal mean over [490.1,500.0].

Per-K summaries include pass count, proportion, Wilson 95% interval, mean, sample standard deviation, median, minimum and maximum. No pooled K summary or campaign-wide pass threshold is produced.

## 4. Failure policy

A model exception or non-finite result stops the campaign and preserves partial artifacts. No seed is silently replaced. Only an infrastructure failure can be retried, using the identical frozen commit and parameters, with a distinct attempt record.

## 5. Scientific boundary

The group-cycle assignment, equal amplitudes and global normalization remain prospective modeling choices. The campaign tests computational behavior only. The dt comparison is descriptive and does not establish numerical convergence. No historical or physical claim is supported by code tests or model output alone.
