"""Durable execution bundle writer for prospective AT-004 runs."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import sys

import numpy as np


def _canonical_json_bytes(value: object) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def write_run_bundle(result: dict, output_dir: str | Path, *,
                     source_revision: str,
                     model_source_path: str | Path | None = None) -> dict:
    """Write results.json and manifest.json, returning the manifest.

    source_revision must be the exact Git commit SHA used for the execution.
    A model-source hash is included when the source file is supplied.
    """
    if not isinstance(source_revision, str) or not source_revision.strip():
        raise ValueError("source_revision must be a non-empty Git revision")
    if "seed" not in result or "K" not in result or "config" not in result:
        raise ValueError("result must include seed, K, and config")

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    result_bytes = _canonical_json_bytes(result)
    result_path = destination / "results.json"
    result_path.write_bytes(result_bytes)

    model_hash = None
    if model_source_path is not None:
        source_path = Path(model_source_path)
        if not source_path.is_file():
            raise FileNotFoundError(source_path)
        model_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()

    identity = {
        "source_revision": source_revision,
        "seed": result["seed"],
        "K": result["K"],
        "config": result["config"],
        "results_sha256": hashlib.sha256(result_bytes).hexdigest(),
    }
    run_id = hashlib.sha256(_canonical_json_bytes(identity)).hexdigest()

    manifest = {
        "schema": "AT-004-run-manifest-v0.1",
        "run_id": run_id,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_revision": source_revision,
        "model_source_sha256": model_hash,
        "seed": result["seed"],
        "K": result["K"],
        "config": result["config"],
        "environment": {
            "python": sys.version,
            "python_implementation": platform.python_implementation(),
            "platform": platform.platform(),
            "numpy": np.__version__,
        },
        "artifacts": {
            "results.json": {
                "sha256": hashlib.sha256(result_bytes).hexdigest(),
                "bytes": len(result_bytes),
            }
        },
    }
    manifest_path = destination / "manifest.json"
    manifest_path.write_bytes(_canonical_json_bytes(manifest) + b"\\n")
    return manifest
