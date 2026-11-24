import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from run_manifest import write_run_bundle


class AT004RunManifestTests(unittest.TestCase):
    def _inputs(self, root):
        files = {}
        for name, body in (
            ("model.py", "# test model\\n"),
            ("requirements.txt", "numpy==2.3.5\\n"),
            ("run_campaign.py", "# test runner\\n"),
            ("protocol.json", '{"protocol":"test"}\\n'),
        ):
            path = root / name
            path.write_text(body)
            files[name] = path
        return files

    def _write(self, result, root, revision="a" * 40, files=None):
        files = files or self._inputs(root)
        return write_run_bundle(
            result, root / "bundle", source_revision=revision,
            model_source_path=files["model.py"],
            dependency_lock_path=files["requirements.txt"],
            campaign_source_path=files["run_campaign.py"],
            protocol_path=files["protocol.json"],
        )

    def test_bundle_records_identity_environment_and_all_input_hashes(self):
        result = {
            "seed": 303,
            "K": 0.5,
            "config": {"N": 24, "dt": 0.1, "noise_sigma": 0.0},
            "r_history": [0.1, 0.2],
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = self._inputs(root)
            manifest = self._write(result, root, files=files)
            bundle = root / "bundle"
            result_bytes = (bundle / "results.json").read_bytes()
            saved_manifest = json.loads((bundle / "manifest.json").read_text())
            self.assertEqual(saved_manifest, manifest)
            self.assertEqual(manifest["source_revision"], "a" * 40)
            self.assertEqual(manifest["seed"], 303)
            self.assertEqual(manifest["K"], 0.5)
            self.assertIn("numpy", manifest["environment"])
            self.assertEqual(
                manifest["artifacts"]["results.json"]["sha256"],
                hashlib.sha256(result_bytes).hexdigest(),
            )
            for key, filename in (
                ("model_source_sha256", "model.py"),
                ("dependency_lock_sha256", "requirements.txt"),
                ("campaign_source_sha256", "run_campaign.py"),
                ("protocol_sha256", "protocol.json"),
            ):
                self.assertEqual(
                    manifest["inputs"][key],
                    hashlib.sha256(files[filename].read_bytes()).hexdigest(),
                )
            self.assertEqual(len(manifest["run_id"]), 64)
            self.assertEqual(manifest["schema"], "AT-004-run-manifest-v0.2")

    def test_bundle_rejects_short_or_malformed_revision(self):
        result = {"seed": 1, "K": 0.2, "config": {}}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for revision in ("", "abc123", "g" * 40):
                with self.subTest(revision=revision):
                    with self.assertRaises(ValueError):
                        self._write(result, root, revision)

    def test_bundle_requires_valid_seed_and_finite_k(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for bad_result in (
                {"seed": -1, "K": 0.2, "config": {}},
                {"seed": True, "K": 0.2, "config": {}},
                {"seed": 1, "K": float("nan"), "config": {}},
            ):
                with self.subTest(result=bad_result):
                    with self.assertRaises(ValueError):
                        self._write(bad_result, root)

    def test_all_source_files_are_required_and_validated_before_writing(self):
        result = {"seed": 7, "K": 0.85, "config": {}}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = self._inputs(root)
            output = root / "bundle"
            for key in ("model.py", "requirements.txt", "run_campaign.py", "protocol.json"):
                broken = dict(files)
                broken[key] = root / "missing"
                with self.subTest(missing=key):
                    with self.assertRaises(FileNotFoundError):
                        write_run_bundle(
                            result, output, source_revision="c" * 40,
                            model_source_path=broken["model.py"],
                            dependency_lock_path=broken["requirements.txt"],
                            campaign_source_path=broken["run_campaign.py"],
                            protocol_path=broken["protocol.json"],
                        )
                    self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
