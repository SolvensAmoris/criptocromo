#!/usr/bin/env python3
"""Create a deterministic provenance manifest for an OpenTimestamps proof."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def git_bytes(*args: str) -> bytes:
    return subprocess.check_output(["git", *args])


def git_text(*args: str) -> str:
    return git_bytes(*args).decode("utf-8").strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="timestamp-manifest.json")
    parser.add_argument("--repository", default="SolvensAmoris/criptocromo")
    args = parser.parse_args()

    commit = git_text("rev-parse", "HEAD")
    tree = git_text("rev-parse", "HEAD^{tree}")
    archive = git_bytes("archive", "--format=tar", "HEAD")
    archive_sha256 = hashlib.sha256(archive).hexdigest()

    payload = {
        "schema": "atanor-ots-manifest-v1",
        "repository": args.repository,
        "git_commit": commit,
        "git_tree": tree,
        "git_archive_sha256": archive_sha256,
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
