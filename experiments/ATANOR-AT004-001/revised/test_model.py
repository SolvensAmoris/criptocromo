import math
import unittest

from model import (
    DEFAULT_DRIVE_AMPLITUDE,
    DriveSpec,
    PROPOSED_DRIVES,
    build_coupling_matrix,
    euler_step,
    modulated_frequencies,
    run_experiment,
    scaled_periods,
    simulate,
    validate_drive_specs,
)

class AT004ModelTests(unittest.TestCase):
    def test_matrix_is_symmetric_and_globally_normalized(self):
        matrix = build_coupling_matrix()
        self.assertEqual(len(matrix), 24)
        self.assertTrue(all(matrix[i][i] == 0 for i in range(24)))
        asymmetry = max(
            abs(matrix[i][j] - matrix[j][i])
            for i in range(24) for j in range(24)
        )
        self.assertLessEqual(asymmetry, 1e-15)
        self.assertAlmostEqual(sum(map(sum, matrix)) / 24, 1.0, places=12)

    def test_topology_rejects_unsupported_node_count(self):
        with self.assertRaises(ValueError):
            build_coupling_matrix(23)

    def test_scaling_argument_reaches_every_period(self):
        periods = scaled_periods(6.5)
        self.assertAlmostEqual(periods["metonic"], 123.5)
        self.assertAlmostEqual(periods["callippic"], 494.0)
        self.assertAlmostEqual(periods["saros"], 117.195)
        self.assertAlmostEqual(periods["lunar"], 0.4862)
        self.assertAlmostEqual(scaled_periods(2.0)["metonic"], 38.0)

    def test_drive_assignment_is_complete_and_group_specific(self):
        omega = [1.0] * 24
        drives = tuple(
            DriveSpec(i, ("metonic", "callippic", "saros", "lunar")[i],
                      DEFAULT_DRIVE_AMPLITUDE if i == 2 else 0.0)
            for i in range(4)
        )
        validate_drive_specs(drives)
        t = scaled_periods(6.5)["saros"] / 4.0
        modulated = modulated_frequencies(t, omega, 6.5, drives)
        for node in range(12):
            self.assertAlmostEqual(modulated[node], 1.0, places=12)
        for node in range(12, 18):
            self.assertAlmostEqual(modulated[node], 1.1, places=12)
        for node in range(18, 24):
            self.assertAlmostEqual(modulated[node], 1.0, places=12)

    def test_missing_or_duplicate_group_assignment_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_drive_specs(PROPOSED_DRIVES[:3])
        with self.assertRaises(ValueError):
            validate_drive_specs((
                DriveSpec(0, "metonic", 0.1),
                DriveSpec(0, "callippic", 0.1),
                DriveSpec(2, "saros", 0.1),
                DriveSpec(3, "lunar", 0.1),
            ))

    def test_euler_step_is_single_forward_euler_update(self):
        theta = [0.0, math.pi / 2]
        omega = [1.0, 2.0]
        matrix = [[0.0, 1.0], [1.0, 0.0]]
        result = euler_step(theta, omega, 0.5, matrix, 0.1)
        self.assertAlmostEqual(result[0], 0.15, places=12)
        self.assertAlmostEqual(result[1], math.pi / 2 + 0.15, places=12)

    def test_runner_is_deterministic_and_records_post_update(self):
        first = run_experiment(0.2, T=10.0, seed=303)
        second = run_experiment(0.2, T=10.0, seed=303)
        self.assertEqual(first["r_history"], second["r_history"])
        self.assertEqual(first["theta_final"], second["theta_final"])
        self.assertEqual(len(first["r_history"]), 100)
        self.assertAlmostEqual(first["times"][0], 0.1)
        self.assertAlmostEqual(first["times"][-1], 10.0)
        self.assertEqual(first["config"]["noise_sigma"], 0.0)
        self.assertEqual(len(first["omega_history"]), 100)
        self.assertEqual(len(first["omega_history"][0]), 24)

    def test_runner_rejects_invalid_time_grid_and_short_summary(self):
        theta = [0.0] * 24
        omega = [1.0] * 24
        with self.assertRaises(ValueError):
            simulate(theta, omega, 0.2, T=1.0, dt=0.3)
        with self.assertRaises(ValueError):
            simulate(theta, omega, 0.2, T=1.0, dt=0.1)

if __name__ == "__main__":
    unittest.main()
