# AT-003 / NetLogo CAL-01 implementation record

**Status:** IMPLEMENTATION IN PR · EXPERIMENTAL RUN PENDING CI  
**PR:** #12  
**Model:** NetLogo 7.0.4 + BehaviorSpace  
**Official Linux archive:** `https://downloads.netlogo.org/7.0.4/NetLogo-7.0.4-64.tgz`  
**Scope:** shared-state implementation equivalence only

## Commands

From the repository root:

```bash
npm ci
npm test
npm run netlogo:export
```

Then run BehaviorSpace from `experiments/netlogo`:

```bash
"$NETLOGO_CONSOLE" --headless \
  --model "CriptocromoEquivalence.nlogo" \
  --setup-file "behaviorspace.xml" \
  --experiment "Criptocromo CAL01 shared-state equivalence" \
  --threads 1 \
  --table /dev/null
```

Finally:

```bash
npm run netlogo:compare
```

The GitHub Actions workflow performs these steps and uploads the full evidence package even when a preceding experiment step fails.

## Input and execution identity

The exporter verifies the Git blob SHA-1 identities pinned in `experiments/AT-002-CALIBRATION/configuration.json` before creating any inputs. It exports one canonical NetLogo-readable state for each of the ten CAL-01 seed labels. The initial-state file is the actual model input; NetLogo does not call its RNG.

The TypeScript reference trace and NetLogo trace each record node-level raw/observed activation and memory, plus the complete directed weight matrix after every completed tick. A D guard event records raw activations and no fabricated post-abort state or weights.

The run uses the CAL-01 pulse/recovery sequence: 18 ticks at target frequency 0.5 and intensity 1.0, then 24 ticks at target frequency 0.5 and intensity 0.0. All three switches are enabled. The variants are run separately as O and D.

## Comparison

The comparator requires exact agreement of record keys, status fields, and empty/null fields. Numeric fields are compared against absolute tolerance `1e-10`. It reports total and matched record counts, missing/extra keys, mismatch count, maximum absolute error, and the first mismatch. It does not compare only final aggregate metrics.

The tolerance was frozen before the cross-platform execution. It remains an operational numerical threshold, not an independent scientific validation of the model or the implementation.

## Output package

Generated under `experiments/netlogo/interop-data/`:

- `initial_states.nls`
- `typescript_expected.csv`
- `netlogo_trace.csv`
- `comparison.json`
- `manifest.json`
- `checksums.sha256`

The comparison status `EQUIVALENCE_OBSERVED_WITHIN_TOLERANCE` means only that the instrumented traces matched within the frozen tolerance for this exact model version, runtime, initial-state set, and stimulus sequence. It is not a universal equivalence claim. Independent review remains required before final acceptance.
