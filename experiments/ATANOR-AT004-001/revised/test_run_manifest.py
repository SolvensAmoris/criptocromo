import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from run_manifest import write_run_bundle


class AT004RunManifestTests(unittest.TestCase):
    def test_bundle_records_identity_environment_and_result_hash(self):
        result = {
            "seed": 303,
            "K": 0.5,
            "config": {"N": 24, "dt": 0.1, "noise_sigma": 0.0},
            "r_history": [0.1, 0.2],
        }
        with tempfile.TemporaryDirectory() as directory:
            manifest = write_run_bundle(
                result, directory, source_revision="abc123",
            )
            root = Path(directory)
            result_bytes = (root / "results.json").read_bytes()
            saved_manifest = json.loads((root / "manifest.json").read_text())
            self.assertEqual(saved_manifest, manifest)
            self.assertEqual(manifest["source_revision"], "abc123")
            self.assertEqual(manifest["seed"], 303)
            self.assertEqual(manifest["K"], 0.5)
            self.assertIn("numpy", manifest["environment"])
            self.assertEqual(
                manifest["artifacts"]["results.json"]["sha256"],
                hashlib.sha256(result_bytes).hexdigest(),
            )
            self.assertEqual(len(manifest["run_id"]), 64)

    def test_bundle_requires_source_revision_and_execution_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                write_run_bundle(
                    {"seed": 1, "K": 0.2, "config": {}},
                    directory, source_revision="",
                )
            with self.assertRaises(ValueError):
                write_run_bundle({"seed": 1}, directory, source_revision="abc123")

    def test_model_source_hash_is_recorded(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "model.py"
            source.write_text("# test source\\n")
            result = {"seed": 7, "K": 0.85, "config": {}}
            manifest = write_run_bundle(
                result, root / "bundle", source_revision="def456",
                model_source_path=source,
            )
            expected = hashlib.sha256(source.read_bytes()).hexdigest()
            self.assertEqual(manifest["model_source_sha256"], expected)


if __name__ == "__main__":
    unittest.main()
