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
    window_mean_order_parameter,
)

class AT004ModelTests(unittest.TestCase):
    def test_matrix_is_symmetric_and_globally_normalized(self):
        matrix = build_coupling_matrix()
        self.assertEqual(len(matrix), 24)
        self.assertTrue(all(matrix[i][i] == 0 for i in range(24)))
        asymmetry = max(abs(matrix[i][j] - matrix[j][i])
                        for i in range(24) for j in range(24))
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

    def test_each_drive_is_isolated_to_its_assigned_group(self):
        omega = [1.0] * 24
        names = ("metonic", "callippic", "saros", "lunar")
        for group, period_name in enumerate(names):
            with self.subTest(group=group, period=period_name):
                drives = tuple(
                    DriveSpec(i, names[i], DEFAULT_DRIVE_AMPLITUDE if i == group else 0.0)
                    for i in range(4)
                )
                period = scaled_periods(6.5)[period_name]
                modulated = modulated_frequencies(period / 4.0, omega, 6.5, drives)
                for node, value in enumerate(modulated):
                    expected = 1.1 if node // 6 == group else 1.0
                    self.assertAlmostEqual(value, expected, places=12)

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
        with self.assertRaises(ValueError):
            validate_drive_specs((object(),) * 4)

    def test_euler_step_is_single_forward_euler_update(self):
        theta = [0.0, math.pi / 2]
        omega = [1.0, 2.0]
        matrix = [[0.0, 1.0], [1.0, 0.0]]
        result = euler_step(theta, omega, 0.5, matrix, 0.1)
        self.assertAlmostEqual(result[0], 0.15, places=12)
        self.assertAlmostEqual(result[1], math.pi / 2 + 0.15, places=12)

    def test_non_finite_and_non_numeric_initial_conditions_are_rejected(self):
        theta = [0.0] * 24
        omega = [1.0] * 24
        for invalid in (math.nan, math.inf, -math.inf, "0.5", True):
            with self.subTest(invalid=invalid):
                bad_theta = theta.copy()
                bad_theta[3] = invalid
                with self.assertRaises(ValueError):
                    simulate(bad_theta, omega, 0.2, T=10.0)
                bad_omega = omega.copy()
                bad_omega[4] = invalid
                with self.assertRaises(ValueError):
                    simulate(theta, bad_omega, 0.2, T=10.0)

    def test_runner_is_deterministic_and_records_post_update(self):
        first = run_experiment(0.2, T=10.0, seed=303)
        second = run_experiment(0.2, T=10.0, seed=303)
        self.assertEqual(first["r_history"], second["r_history"])
        self.assertEqual(first["theta_final"], second["theta_final"])
        self.assertEqual(len(first["r_history"]), 100)
        self.assertAlmostEqual(first["times"][0], 0.1)
        self.assertAlmostEqual(first["times"][-1], 10.0)
        self.assertEqual(first["config"]["noise_sigma"], 0.0)
        self.assertNotIn("omega_history", first)
        self.assertEqual(len(first["theta_initial"]), 24)
        self.assertEqual(len(first["omega_initial"]), 24)

    def test_runner_rejects_invalid_time_grid_and_short_summary(self):
        theta = [0.0] * 24
        omega = [1.0] * 24
        with self.assertRaises(ValueError):
            simulate(theta, omega, 0.2, T=1.0, dt=0.3)
        with self.assertRaises(ValueError):
            simulate(theta, omega, 0.2, T=1.0, dt=0.1)

    def test_trapezoidal_physical_time_average_is_exact_for_linear_signal(self):
        coarse_t = [i / 10 for i in range(1, 101)]
        fine_t = [i / 20 for i in range(1, 201)]
        coarse_r = [0.5 + 0.01 * t for t in coarse_t]
        fine_r = [0.5 + 0.01 * t for t in fine_t]
        coarse = window_mean_order_parameter(coarse_t, coarse_r, 4.0, 8.0)
        fine = window_mean_order_parameter(fine_t, fine_r, 4.0, 8.0)
        self.assertAlmostEqual(coarse, 0.56, places=12)
        self.assertAlmostEqual(fine, 0.56, places=12)

    def test_trapezoidal_average_converges_for_nonlinear_signal(self):
        coarse_t = [i / 10 for i in range(1, 101)]
        fine_t = [i / 20 for i in range(1, 201)]
        coarse_y = [t * t for t in coarse_t]
        fine_y = [t * t for t in fine_t]
        exact = (8.0**3 - 4.0**3) / (3.0 * (8.0 - 4.0))
        coarse = window_mean_order_parameter(coarse_t, coarse_y, 4.0, 8.0)
        fine = window_mean_order_parameter(fine_t, fine_y, 4.0, 8.0)
        self.assertGreater(abs(coarse - exact), abs(fine - exact))
        self.assertLess(abs(fine - exact), 0.001)

    def test_physical_time_window_rejects_unsorted_duplicate_and_uncovered_times(self):
        with self.assertRaises(ValueError):
            window_mean_order_parameter([1.0, 0.5], [0.1, 0.2], 0.5, 1.0)
        with self.assertRaises(ValueError):
            window_mean_order_parameter([0.0, 1.0, 1.0], [0.1, 0.2, 0.3], 0.0, 1.0)
        with self.assertRaises(ValueError):
            window_mean_order_parameter([1.0, 2.0], [0.1, 0.2], 0.5, 1.5)

    def test_physical_time_window_rejects_invalid_or_empty_ranges(self):
        with self.assertRaises(ValueError):
            window_mean_order_parameter([0.0, 1.0], [0.5, 0.6], 2.0, 1.0)
        with self.assertRaises(ValueError):
            window_mean_order_parameter([0.0, 1.0], [0.5, 0.6], 2.0, 3.0)
        with self.assertRaises(ValueError):
            window_mean_order_parameter([0.0, 1.0], [0.5, 0.6], 0.5, 0.5)

if __name__ == "__main__":
    unittest.main()
