"""Execute the frozen AT-004 seed/K/time-step campaign."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import statistics
import sys

from model import run_experiment, window_mean_order_parameter
from run_manifest import write_run_bundle

SEEDS = (0, 1, 2, 3, 4, 7, 13, 21, 42, 99)
K_VALUES = (0.2, 0.5, 0.85)
DT_VALUES = (0.1, 0.05, 0.025)
WINDOW = (490.1, 500.0)
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PROTOCOL_PATH = REPOSITORY_ROOT / "experiments/ATANOR-AT004-001/protocol/AT-004-PROTOCOL-AMENDMENT-01-v1.0.0.json"
MODEL_PATH = Path(__file__).with_name("model.py")
LOCK_PATH = Path(__file__).with_name("requirements.txt")
CAMPAIGN_PATH = Path(__file__).resolve()


def criterion(K: float, value: float) -> bool:
    if K == 0.2:
        return value < 0.4
    if K == 0.5:
        return 0.4 <= value <= 0.8
    if K == 0.85:
        return value > 0.7
    raise ValueError(f"unregistered K: {K}")


def wilson_interval(successes: int, trials: int, z: float = 1.959963984540054):
    if trials <= 0:
        raise ValueError("trials must be positive")
    p = successes / trials
    denominator = 1.0 + z * z / trials
    center = (p + z * z / (2.0 * trials)) / denominator
    half = z * ((p * (1.0 - p) / trials + z * z / (4.0 * trials * trials)) ** 0.5) / denominator
    return [max(0.0, center - half), min(1.0, center + half)]


def _write_json(path: Path, value: object) -> bytes:
    payload = json.dumps(
        value, sort_keys=True, indent=2, ensure_ascii=False, allow_nan=False
    ).encode("utf-8") + b"\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return payload


def run_campaign(source_revision: str, output_dir: Path, attempt: int = 1) -> dict:
    protocol_path = PROTOCOL_PATH
    if not protocol_path.is_file():
        raise FileNotFoundError(protocol_path)
    output_dir.mkdir(parents=True, exist_ok=False)

    records = []
    current_run = None
    try:
        for dt in DT_VALUES:
            for K in K_VALUES:
                for seed in SEEDS:
                    current_run = {"dt": dt, "K": K, "seed": seed}
                    result = run_experiment(K, T=500.0, seed=seed, dt=dt, scaling=6.5)
                    window_mean = window_mean_order_parameter(
                        result["times"], result["r_history"], *WINDOW
                    )
                    primary_value = result["r_mean_last_100"]
                    if dt == 0.1:
                        passed = criterion(K, primary_value)
                    else:
                        passed = None

                    result["r_mean_window_490p1_500"] = window_mean
                    result["campaign"] = {
                        "protocol": "ATANOR-AT004-001-AMENDMENT-01-v1.0.0",
                        "attempt": attempt,
                        "physical_window": list(WINDOW),
                    }
                    run_dir = (
                        output_dir / "runs" / f"dt_{dt:g}" /
                        f"K_{K:g}" / f"seed_{seed:03d}"
                    )
                    manifest = write_run_bundle(
                        result,
                        run_dir,
                        source_revision=source_revision,
                        model_source_path=MODEL_PATH,
                        dependency_lock_path=LOCK_PATH,
                        campaign_source_path=CAMPAIGN_PATH,
                        protocol_path=protocol_path,
                    )
                    records.append({
                        "seed": seed,
                        "K": K,
                        "dt": dt,
                        "r_final": result["r_final"],
                        "r_mean_last_100": primary_value,
                        "r_mean_window_490p1_500": window_mean,
                        "criterion_pass": passed,
                        "run_id": manifest["run_id"],
                        "results_sha256": manifest["artifacts"]["results.json"]["sha256"],
                    })

        if len(records) != len(SEEDS) * len(K_VALUES) * len(DT_VALUES):
            raise RuntimeError("campaign did not complete the frozen 90-run matrix")
        primary = [row for row in records if row["dt"] == 0.1]
        per_k = {}
        for K in K_VALUES:
            values = [row["r_mean_last_100"] for row in primary if row["K"] == K]
            successes = sum(row["criterion_pass"] is True for row in primary if row["K"] == K)
            per_k[str(K)] = {
                "n": len(values),
                "passes": successes,
                "pass_proportion": successes / len(values),
                "wilson_95": wilson_interval(successes, len(values)),
                "mean": statistics.mean(values),
                "sample_sd": statistics.stdev(values),
                "median": statistics.median(values),
                "min": min(values),
                "max": max(values),
            }

        robustness = []
        for K in K_VALUES:
            for seed in SEEDS:
                rows = {
                    row["dt"]: row["r_mean_window_490p1_500"]
                    for row in records if row["K"] == K and row["seed"] == seed
                }
                robustness.append({
                    "K": K,
                    "seed": seed,
                    "window_mean_by_dt": {str(dt): rows[dt] for dt in DT_VALUES},
                    "absolute_delta_vs_dt_0p1": {
                        str(dt): abs(rows[dt] - rows[0.1])
                        for dt in (0.05, 0.025)
                    },
                })

        summary = {
            "campaign_id": "ATANOR-AT004-001",
            "protocol": "ATANOR-AT004-001-AMENDMENT-01-v1.0.0",
            "source_revision": source_revision,
            "attempt": attempt,
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "run_count": len(records),
            "primary_run_count": len(primary),
            "numerical_sensitivity_run_count": len(records) - len(primary),
            "seeds": list(SEEDS),
            "K_values": list(K_VALUES),
            "dt_values": list(DT_VALUES),
            "primary_metric": "r_mean_last_100 at dt=0.1",
            "primary_by_K": per_k,
            "seed_level_records": records,
            "numerical_sensitivity": robustness,
            "claims_boundary": "Computational model behavior only; no historical, causal, emergence, synergy, external-validity, or numerical-convergence claim.",
        }
        summary_bytes = _write_json(output_dir / "summary.json", summary)
        campaign_manifest = {
            "schema": "AT-004-campaign-manifest-v1.0",
            "campaign_id": summary["campaign_id"],
            "protocol": summary["protocol"],
            "source_revision": source_revision,
            "attempt": attempt,
            "run_count": len(records),
            "summary_sha256": hashlib.sha256(summary_bytes).hexdigest(),
            "run_ids": [row["run_id"] for row in records],
        }
        _write_json(output_dir / "campaign-manifest.json", campaign_manifest)
        return summary
    except Exception as error:
        failure = {
            "campaign_id": "ATANOR-AT004-001",
            "source_revision": source_revision,
            "attempt": attempt,
            "completed_runs": len(records),
            "failed_run": current_run,
            "failure_type": type(error).__name__,
            "failure_message": str(error),
            "failed_at_utc": datetime.now(timezone.utc).isoformat(),
        }
        _write_json(output_dir / "campaign-failure.json", failure)
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-revision", required=True)
    parser.add_argument("--output-dir", default="at004-campaign-output")
    parser.add_argument("--attempt", type=int, default=1)
    args = parser.parse_args()
    if args.attempt < 1:
        parser.error("--attempt must be >= 1")
    summary = run_campaign(
        args.source_revision, Path(args.output_dir), attempt=args.attempt
    )
    print(json.dumps({
        "run_count": summary["run_count"],
        "primary_run_count": summary["primary_run_count"],
        "numerical_sensitivity_run_count": summary["numerical_sensitivity_run_count"],
        "primary_by_K": summary["primary_by_K"],
    }, indent=2))


if __name__ == "__main__":
    main()
