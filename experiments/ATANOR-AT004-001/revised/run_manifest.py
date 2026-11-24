"""Durable execution bundle writer for prospective AT-004 runs."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import re
import sys

import numpy as np


def _canonical_json_bytes(value: object) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_run_bundle(result: dict, output_dir: str | Path, *,
                     source_revision: str,
                     model_source_path: str | Path,
                     dependency_lock_path: str | Path,
                     campaign_source_path: str | Path,
                     protocol_path: str | Path) -> dict:
    """Write canonical results and a manifest bound to exact source inputs.

    The caller must supply a full 40-character Git commit SHA and paths to
    the exact model source and dependency lock used for the run.
    """
    if not isinstance(source_revision, str) or not re.fullmatch(r"[0-9a-f]{40}", source_revision):
        raise ValueError("source_revision must be a full 40-character lowercase Git SHA")
    if not isinstance(result, dict) or not {"seed", "K", "config"}.issubset(result):
        raise ValueError("result must include seed, K, and config")
    seed = result["seed"]
    if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
        raise ValueError("seed must be a non-negative integer")
    coupling_k = result["K"]
    if isinstance(coupling_k, bool) or not isinstance(coupling_k, (int, float)):
        raise ValueError("K must be numeric")
    if not np.isfinite(coupling_k):
        raise ValueError("K must be finite")
    if not isinstance(result["config"], dict):
        raise ValueError("config must be a dictionary")

    source_path = Path(model_source_path)
    lock_path = Path(dependency_lock_path)
    campaign_path = Path(campaign_source_path)
    protocol_file = Path(protocol_path)
    for required_path in (source_path, lock_path, campaign_path, protocol_file):
        if not required_path.is_file():
            raise FileNotFoundError(required_path)

    # Serialize and validate all inputs before creating or changing output files.
    result_bytes = _canonical_json_bytes(result)
    model_hash = _sha256(source_path)
    lock_hash = _sha256(lock_path)
    campaign_hash = _sha256(campaign_path)
    protocol_hash = _sha256(protocol_file)
    results_hash = hashlib.sha256(result_bytes).hexdigest()

    identity = {
        "source_revision": source_revision,
        "seed": seed,
        "K": coupling_k,
        "config": result["config"],
        "model_source_sha256": model_hash,
        "dependency_lock_sha256": lock_hash,
        "campaign_source_sha256": campaign_hash,
        "protocol_sha256": protocol_hash,
        "results_sha256": results_hash,
    }
    run_id = hashlib.sha256(_canonical_json_bytes(identity)).hexdigest()

    manifest = {
        "schema": "AT-004-run-manifest-v0.2",
        "run_id": run_id,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_revision": source_revision,
        "seed": seed,
        "K": coupling_k,
        "config": result["config"],
        "environment": {
            "python": sys.version,
            "python_implementation": platform.python_implementation(),
            "platform": platform.platform(),
            "numpy": np.__version__,
        },
        "inputs": {
            "model_source_sha256": model_hash,
            "dependency_lock_sha256": lock_hash,
            "campaign_source_sha256": campaign_hash,
            "protocol_sha256": protocol_hash,
        },
        "artifacts": {
            "results.json": {
                "sha256": results_hash,
                "bytes": len(result_bytes),
            }
        },
    }
    manifest_bytes = _canonical_json_bytes(manifest) + b"\n"

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "results.json").write_bytes(result_bytes)
    (destination / "manifest.json").write_bytes(manifest_bytes)
    return manifest
