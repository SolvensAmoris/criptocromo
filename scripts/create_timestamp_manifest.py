#!/usr/bin/env python3
"""Create a deterministic provenance manifest for an OpenTimestamps proof."""
import argparse
import json
import subprocess
from pathlib import Path


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="timestamp-manifest.json")
    parser.add_argument("--repository", default="SolvensAmoris/criptocromo")
    args = parser.parse_args()

    commit = git("rev-parse", "HEAD")
    tree = git("rev-parse", "HEAD^{tree}")
    ref = git("describe", "--tags", "--always", "--dirty")
    payload = {
        "schema": "atanor-ots-manifest-v1",
        "repository": args.repository,
        "git_commit": commit,
        "git_tree": tree,
        "git_ref_description": ref,
        "hash_algorithm": "SHA-256",
        "timestamp_protocol": "OpenTimestamps",
        "anchor_network": "Bitcoin",
        "author": "Luis Alberto Burciaga Miker",
        "project": "ATANOR Ω / Criptocromo",
    }
    Path(args.output).write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
