# ATANOR-AT004-001 | Original source receipt v0.2

## Provenance

Captured from the five Python source texts and the preregistration supplied by the project owner in the conversation on 2026-11-23. The preserved snapshot contains the four model/metric modules, the sweep runner, and the preregistration JSON. No behavior, parameter, criterion, or implementation has been corrected in this directory.

**Completeness:** all six items supplied across the conversation are now present: `kuramoto.py`, `network_24.py`, `antikythera_drives.py`, `metrics.py`, `experiment.py`, and `at004_prereg.json`.

**Integrity boundary:** the SHA-256 values identify the UTF-8/LF text materialized into this repository. They are not hashes of separately uploaded original filesystem objects. Byte-for-byte identity against an external local copy therefore remains pending.

## SHA-256

| File | SHA-256 |
|---|---|
| antikythera_drives.py | 0aa80076d27da67f68e9e339a5eebf63b89a09ad479768487eee908138c4b40e |
| at004_prereg.json | fc9610d9a06e75766a758ae898020f9aecd2c0c3a78650d3c81ab61d0a296c8f |
| experiment.py | 6034007a511c921ccc7cc4a01e141249d0d69908618532a7e600ceeda88d1922 |
| kuramoto.py | f422e45f60ab84a061f761c27403c3126adeb6ca7a79510196c2c5ea45e83fbe |
| metrics.py | 6ef1125d248dc0e002ab59f80638952105763d69c902ff79c3fef8fd43c9a1eb |
| network_24.py | 90af945f84930b6837cc64dcbcfcb98f79d1e2488d3164868e47c54a1daedf64 |

## Handling rules

- This directory is immutable historical input for the audit.
- Characterization tests must describe the behavior of this snapshot, including undesirable behavior.
- Corrections belong in a separately versioned implementation.
- The preregistered criteria and seed list are not amended by this receipt.
- No confirmatory campaign is authorized by source preservation or unit tests.

## Source inventory

- `kuramoto.py`
- `network_24.py`
- `antikythera_drives.py`
- `metrics.py`
- `experiment.py`
- `at004_prereg.json`

## Confirmed behavior of the sweep runner

- Iterates the three preregistered K values and ten preregistered seeds: 30 calls to `run_experiment` when executed normally.
- Computes pass/fail for each result using the original criteria.
- Computes per-K pass rates.
- Calls `aggregate_metrics(all_results)` once on the pooled 30-result list. Consequently, its aggregate statistics combine all three K conditions rather than reporting condition-specific distributions.
- Prints results and returns `all_results` and `report`.
