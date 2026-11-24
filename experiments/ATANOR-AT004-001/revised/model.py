"""Prospective AT-004 model implementation.

This is a separately versioned candidate. Historical source under ../original/
is immutable and is not imported or modified by this implementation.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
import math
import numpy as np
from typing import Sequence

NODE_COUNT = 24
GROUP_SIZE = 6
DEFAULT_T = 500.0
DEFAULT_DT = 0.1
DEFAULT_SCALING = 6.5
DEFAULT_DRIVE_AMPLITUDE = 0.1

REFERENCE_PERIODS_YEARS = {
    "metonic": 19.0,
    "callippic": 76.0,
    "saros": 18.03,
    "lunar": 0.0748,
}

@dataclass(frozen=True)
class DriveSpec:
    """One synthetic six-node group and its explicitly assigned cycle."""
    group: int
    period: str
    amplitude: float

PROPOSED_DRIVES = (
    DriveSpec(0, "metonic", DEFAULT_DRIVE_AMPLITUDE),
    DriveSpec(1, "callippic", DEFAULT_DRIVE_AMPLITUDE),
    DriveSpec(2, "saros", DEFAULT_DRIVE_AMPLITUDE),
    DriveSpec(3, "lunar", DEFAULT_DRIVE_AMPLITUDE),
)

def _finite_sequence(values: Sequence[float], name: str) -> None:
    try:
        valid = all(math.isfinite(float(value)) for value in values)
    except (TypeError, ValueError, OverflowError):
        valid = False
    if not valid:
        raise ValueError(f"{name} must contain only finite numeric values")

def _finite_positive(value: float, name: str) -> None:
    if not math.isfinite(value) or value <= 0:
        raise ValueError(f"{name} must be finite and positive")

def scaled_periods(scaling: float = DEFAULT_SCALING) -> dict[str, float]:
    """Return simulated-time periods; scaling is units per reference year."""
    _finite_positive(scaling, "scaling")
    return {name: years * scaling for name, years in REFERENCE_PERIODS_YEARS.items()}

def validate_drive_specs(drives: Sequence[DriveSpec]) -> None:
    if len(drives) != 4:
        raise ValueError("exactly four group drive assignments are required")
    groups = [drive.group for drive in drives]
    if sorted(groups) != [0, 1, 2, 3]:
        raise ValueError("each synthetic group 0..3 must have exactly one drive")
    for drive in drives:
        if drive.period not in REFERENCE_PERIODS_YEARS:
            raise ValueError(f"unknown reference period: {drive.period}")
        if not math.isfinite(drive.amplitude) or drive.amplitude < 0:
            raise ValueError("drive amplitude must be finite and non-negative")

def build_coupling_matrix(n: int = NODE_COUNT) -> list[list[float]]:
    """Build the symmetric 24-node matrix with global mean-strength normalization."""
    if n != NODE_COUNT:
        raise ValueError(f"AT-004 topology is fixed at N={NODE_COUNT}")
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            weight = 0.8 if i // GROUP_SIZE == j // GROUP_SIZE else 0.2
            if i == 0 or j == 0:
                weight = 1.0
            matrix[i][j] = weight
            matrix[j][i] = weight
    mean_weighted_degree = math.fsum(math.fsum(row) for row in matrix) / n
    if mean_weighted_degree <= 0:
        raise ValueError("mean weighted degree must be positive")
    return [[weight / mean_weighted_degree for weight in row] for row in matrix]

def order_parameter(theta: Sequence[float]) -> float:
    if len(theta) == 0:
        raise ValueError("theta must not be empty")
    _finite_sequence(theta, "theta")
    real = math.fsum(math.cos(value) for value in theta) / len(theta)
    imag = math.fsum(math.sin(value) for value in theta) / len(theta)
    return math.hypot(real, imag)

def window_mean_order_parameter(times: Sequence[float], values: Sequence[float],
                                start: float, end: float) -> float:
    """Mean r over an inclusive physical-time interval, independent of dt."""
    if not math.isfinite(start) or not math.isfinite(end) or start > end:
        raise ValueError("window bounds must be finite and start <= end")
    if len(times) != len(values) or len(times) == 0:
        raise ValueError("times and values must have equal non-zero lengths")
    _finite_sequence(times, "times")
    _finite_sequence(values, "values")
    selected = [value for time, value in zip(times, values) if start <= time <= end]
    if not selected:
        raise ValueError("time window contains no recorded samples")
    return math.fsum(selected) / len(selected)

def euler_step(theta: Sequence[float], omega: Sequence[float], coupling_k: float,
               matrix: Sequence[Sequence[float]], dt: float) -> list[float]:
    """The sole forward-Euler update used by the prospective runner."""
    _finite_positive(dt, "dt")
    n = len(theta)
    if n == 0 or len(omega) != n or len(matrix) != n:
        raise ValueError("theta, omega and matrix dimensions must agree")
    _finite_sequence(theta, "theta")
    _finite_sequence(omega, "omega")
    _finite_sequence([value for row in matrix for value in row], "matrix")
    if any(len(row) != n for row in matrix):
        raise ValueError("coupling matrix must be square")
    if not math.isfinite(coupling_k):
        raise ValueError("coupling_k must be finite")
    updated = []
    for i in range(n):
        coupling = math.fsum(
            matrix[i][j] * math.sin(theta[j] - theta[i]) for j in range(n)
        )
        updated.append(theta[i] + (omega[i] + coupling_k * coupling) * dt)
    _finite_sequence(updated, "updated phases")
    return updated

def modulated_frequencies(t: float, omega0: Sequence[float],
                          scaling: float = DEFAULT_SCALING,
                          drives: Sequence[DriveSpec] = PROPOSED_DRIVES) -> list[float]:
    """Apply the explicitly assigned cycle to each synthetic six-node group."""
    if not math.isfinite(t):
        raise ValueError("t must be finite")
    if len(omega0) != NODE_COUNT:
        raise ValueError(f"omega0 must contain exactly {NODE_COUNT} values")
    _finite_sequence(omega0, "base frequencies")
    validate_drive_specs(drives)
    periods = scaled_periods(scaling)
    by_group = {drive.group: drive for drive in drives}
    output = []
    for node, base_frequency in enumerate(omega0):
        drive = by_group[node // GROUP_SIZE]
        factor = 1.0 + drive.amplitude * math.sin(
            2.0 * math.pi * t / periods[drive.period]
        )
        output.append(base_frequency * factor)
    return output

def simulate(theta0: Sequence[float], omega0: Sequence[float], coupling_k: float,
             *, T: float = DEFAULT_T, dt: float = DEFAULT_DT,
             scaling: float = DEFAULT_SCALING,
             drives: Sequence[DriveSpec] = PROPOSED_DRIVES) -> dict:
    """Run deterministic, zero-noise Euler simulation; record post-update samples."""
    if len(theta0) != NODE_COUNT or len(omega0) != NODE_COUNT:
        raise ValueError(f"AT-004 requires {NODE_COUNT} initial phases and frequencies")
    _finite_sequence(theta0, "initial phases")
    _finite_sequence(omega0, "initial frequencies")
    if not math.isfinite(coupling_k):
        raise ValueError("coupling_k must be finite")
    _finite_positive(T, "T")
    _finite_positive(dt, "dt")
    _finite_positive(scaling, "scaling")
    ratio = T / dt
    steps = round(ratio)
    if not math.isclose(ratio, steps, rel_tol=0.0, abs_tol=1e-9):
        raise ValueError("T/dt must be an integer")
    if steps < 100:
        raise ValueError("at least 100 steps are required for the registered summary")
    validate_drive_specs(drives)
    matrix = build_coupling_matrix()
    theta = list(theta0)
    times: list[float] = []
    r_history: list[float] = []
    omega_history: list[list[float]] = []
    for step_index in range(steps):
        t = step_index * dt
        omega_t = modulated_frequencies(t, omega0, scaling, drives)
        theta = euler_step(theta, omega_t, coupling_k, matrix, dt)
        times.append((step_index + 1) * dt)
        r_history.append(order_parameter(theta))
        omega_history.append(omega_t)
    return {
        "K": coupling_k,
        "times": times,
        "r_history": r_history,
        "omega_history": omega_history,
        "theta_initial": list(theta0),
        "omega_initial": list(omega0),
        "theta_final": theta,
        "A": matrix,
        "r_final": r_history[-1],
        "r_mean_last_100": math.fsum(r_history[-100:]) / 100.0,
        "config": {
            "N": NODE_COUNT,
            "T": T,
            "dt": dt,
            "integrator": "forward_euler",
            "sample_convention": "post_update",
            "noise_sigma": 0.0,
            "scaling_simulated_units_per_reference_year": scaling,
            "drive_specs": [asdict(drive) for drive in drives],
        },
    }

def run_experiment(coupling_k: float = 0.5, *, T: float = DEFAULT_T,
                   seed: int = 0, dt: float = DEFAULT_DT,
                   scaling: float = DEFAULT_SCALING,
                   drives: Sequence[DriveSpec] = PROPOSED_DRIVES) -> dict:
    """Seeded runner preserving the original NumPy Generator input convention."""
    theta_rng = np.random.default_rng(seed)
    omega_rng = np.random.default_rng(seed)
    theta0 = theta_rng.uniform(0.0, 2.0 * math.pi, size=NODE_COUNT).tolist()
    omega0 = omega_rng.normal(1.0, 0.1, size=NODE_COUNT).tolist()
    result = simulate(theta0, omega0, coupling_k, T=T, dt=dt,
                      scaling=scaling, drives=drives)
    result["seed"] = seed
    return result
