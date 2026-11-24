# ATANOR-AT004-001 | Original source receipt v0.2

## Provenance

This receipt inventories the historical source snapshot currently preserved in this repository. The files under `original/` are immutable audit inputs; no behavior, parameter, criterion, or implementation in that directory is corrected by this receipt.

**Completeness:** the capture contains five Python modules and the preregistration JSON: `experiment.py`, `network_24.py`, `kuramoto.py`, `antikythera_drives.py`, `metrics.py`, and `at004_prereg.json`. In particular, `experiment.py` is present in the repository and is no longer pending.

**Integrity boundary:** the identifiers below are Git blob object IDs returned by GitHub for the exact repository objects. They are not SHA-256 hashes of external local files. Byte-for-byte identity against any separate local copy remains unverified.

## Git blob object IDs

| File | Git blob object ID |
|---|---|
| `antikythera_drives.py` | `5cad791fab04626cdd020f3502626808b4e9457d` |
| `at004_prereg.json` | `a9912e2c16246b32df7a4786d6afdd09b2b6b56f` |
| `experiment.py` | `55d5dd90a4ac4c51a578bdf2a68cc5786b6b1be0` |
| `kuramoto.py` | `20d1ed7241b0c3b306884df8a5ce71414837ba9c` |
| `metrics.py` | `1f4b58ada5f9cde1918bd452fd3039f9db61a67a` |
| `network_24.py` | `cfe5aa3aea5f65950eecb9d6c27cc46418634606` |

## Handling rules

- This directory is immutable historical input for the audit.
- Characterization tests describe the behavior of this snapshot, including undesirable behavior.
- Corrections belong in a separately versioned implementation under `revised/`.
- The preregistered criteria and seed list are not amended by this receipt.
- No confirmatory campaign is authorized by source preservation, unit tests, or CI.

## Files

- `antikythera_drives.py`
- `at004_prereg.json`
- `experiment.py`
- `kuramoto.py`
- `metrics.py`
- `network_24.py`

## Remaining provenance limitation

The Git objects establish the identity of the captured repository texts. They do not establish byte-for-byte identity against an external filesystem copy or prove that the captured files were the exact bytes used in any historical execution. That requires an independently supplied original artifact or execution manifest.
