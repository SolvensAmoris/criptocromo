import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from run_manifest import write_run_bundle


class AT004RunManifestTests(unittest.TestCase):
    def _inputs(self, root):
        source = root / "model.py"
        lock = root / "requirements.txt"
        source.write_text("# test model\\n")
        lock.write_text("numpy==2.3.5\\n")
        return source, lock

    def test_bundle_records_identity_environment_and_all_input_hashes(self):
        result = {
            "seed": 303,
            "K": 0.5,
            "config": {"N": 24, "dt": 0.1, "noise_sigma": 0.0},
            "r_history": [0.1, 0.2],
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, lock = self._inputs(root)
            manifest = write_run_bundle(
                result, root / "bundle", source_revision="a" * 40,
                model_source_path=source, dependency_lock_path=lock,
            )
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
            self.assertEqual(
                manifest["inputs"]["model_source_sha256"],
                hashlib.sha256(source.read_bytes()).hexdigest(),
            )
            self.assertEqual(
                manifest["inputs"]["dependency_lock_sha256"],
                hashlib.sha256(lock.read_bytes()).hexdigest(),
            )
            self.assertEqual(len(manifest["run_id"]), 64)
            self.assertEqual(manifest["schema"], "AT-004-run-manifest-v0.2")

    def test_bundle_rejects_short_or_malformed_revision(self):
        result = {"seed": 1, "K": 0.2, "config": {}}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, lock = self._inputs(root)
            for revision in ("", "abc123", "g" * 40):
                with self.subTest(revision=revision):
                    with self.assertRaises(ValueError):
                        write_run_bundle(
                            result, root / "bundle", source_revision=revision,
                            model_source_path=source, dependency_lock_path=lock,
                        )

    def test_bundle_requires_valid_seed_and_finite_k(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, lock = self._inputs(root)
            for bad_result in (
                {"seed": -1, "K": 0.2, "config": {}},
                {"seed": True, "K": 0.2, "config": {}},
                {"seed": 1, "K": float("nan"), "config": {}},
            ):
                with self.subTest(result=bad_result):
                    with self.assertRaises(ValueError):
                        write_run_bundle(
                            bad_result, root / "bundle", source_revision="b" * 40,
                            model_source_path=source, dependency_lock_path=lock,
                        )

    def test_model_and_lock_files_are_mandatory_and_validated_before_writing(self):
        result = {"seed": 7, "K": 0.85, "config": {}}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, lock = self._inputs(root)
            output = root / "bundle"
            with self.assertRaises(FileNotFoundError):
                write_run_bundle(
                    result, output, source_revision="c" * 40,
                    model_source_path=root / "missing.py", dependency_lock_path=lock,
                )
            self.assertFalse(output.exists())
            with self.assertRaises(FileNotFoundError):
                write_run_bundle(
                    result, output, source_revision="c" * 40,
                    model_source_path=source, dependency_lock_path=root / "missing.txt",
                )
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
