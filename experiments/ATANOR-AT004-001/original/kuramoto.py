"""
kuramoto.py - Kuramoto 24 osciladores
ATANOR-AT004-001 / ANTICITERA
"""

import numpy as np

def order_parameter(theta: np.ndarray) -> complex:
    """
    Parámetro de orden r*exp(i Psi)
    r=1 sincronizado, r=0 incoherente
    theta: (N,) fases
    """
    return np.mean(np.exp(1j * theta))

def step(theta: np.ndarray, omega: np.ndarray, K: float, A: np.ndarray, dt=0.05):
    """
    Un paso Euler de Kuramoto con acoplo matriz A (24x24)
    dtheta_i/dt = omega_i + K * sum_j A_ij sin(theta_j - theta_i)
    """
    N = len(theta)
    coupling = np.zeros(N)
    for i in range(N):
        # Vectorizado parcial para velocidad
        diff = theta - theta[i]  # N
        coupling[i] = np.sum(A[i] * np.sin(diff))
    dtheta = omega + K * coupling
    return theta + dtheta * dt

def simulate(theta0, omega, K, A, T=500, dt=0.05, seed=0):
    rng = np.random.default_rng(seed)
    steps = int(T/dt)
    theta = theta0.copy()
    rs = []
    for _ in range(steps):
        r = order_parameter(theta)
        rs.append(np.abs(r))
        theta = step(theta, omega, K, A, dt=dt)
        # Ruido pequeño para evitar artefacto numérico
        theta += rng.normal(0, 1e-4, size=theta.shape)
    return np.array(rs), theta
