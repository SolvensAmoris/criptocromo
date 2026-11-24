import unittest

from run_campaign import criterion, wilson_interval


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

    def test_unknown_coupling_value_is_rejected(self):
        with self.assertRaises(ValueError):
            criterion(0.3, 0.5)


if __name__ == "__main__":
    unittest.main()
