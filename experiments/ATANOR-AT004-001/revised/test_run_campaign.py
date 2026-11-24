import json
from pathlib import Path
import unittest

from model import PROPOSED_DRIVES
from run_campaign import criterion, wilson_interval, SEEDS, K_VALUES, DT_VALUES


class AT004CampaignContractTests(unittest.TestCase):
    def test_registered_threshold_boundaries(self):
        self.assertTrue(criterion(0.2, 0.399999))
        self.assertFalse(criterion(0.2, 0.4))
        self.assertTrue(criterion(0.5, 0.4))
        self.assertTrue(criterion(0.5, 0.8))
        self.assertFalse(criterion(0.5, 0.800001))
        self.assertFalse(criterion(0.85, 0.7))
        self.assertTrue(criterion(0.85, 0.700001))

    def test_wilson_interval_known_edges(self):
        lower, upper = wilson_interval(0, 10)
        self.assertAlmostEqual(lower, 0.0, places=12)
        self.assertGreater(upper, 0.0)
        lower, upper = wilson_interval(10, 10)
        self.assertLess(lower, 1.0)
        self.assertAlmostEqual(upper, 1.0, places=12)

    def test_wilson_rejects_zero_trials(self):
        with self.assertRaises(ValueError):
            wilson_interval(0, 0)

    def test_protocol_json_matches_executable_campaign_constants(self):
        root = Path(__file__).resolve().parents[3]
        protocol_path = root / "experiments/ATANOR-AT004-001/protocol/AT-004-PROTOCOL-AMENDMENT-01-v1.0.0.json"
        protocol = json.loads(protocol_path.read_text(encoding="utf-8"))
        self.assertEqual(tuple(protocol["primary_campaign"]["seeds_in_fixed_order"]), SEEDS)
        self.assertEqual(tuple(protocol["primary_campaign"]["K_values"]), K_VALUES)
        self.assertEqual(tuple(protocol["numerical_robustness"]["dt_values"]), DT_VALUES)
        expected = [
            (0, "metonic", 0.1),
            (1, "callippic", 0.1),
            (2, "saros", 0.1),
            (3, "lunar", 0.1),
        ]
        actual = [(drive.group, drive.period, drive.amplitude) for drive in PROPOSED_DRIVES]
        self.assertEqual(actual, expected)
        self.assertEqual(protocol["model"]["duration"], 500.0)
        self.assertEqual(protocol["model"]["dt_primary"], 0.1)

    def test_unknown_coupling_value_is_rejected(self):
        with self.assertRaises(ValueError):
            criterion(0.3, 0.5)


if __name__ == "__main__":
    unittest.main()
