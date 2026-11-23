"""
network_24.py - Red de 24 osciladores con topología Anticítera
"""

import numpy as np
from kuramoto import simulate
from antikythera_drives import antikythera_omega_base, modulated_omega

def build_antikythera_matrix(N=24):
    """
    Matriz de acoplo A_ij inspirada en engranajes Anticítera:
    - 4 clusters de 6 (metonic, callippic, saros, lunar)
    - Intra-cluster 0.8, inter-cluster 0.2
    - Conexión central (eje principal) a todos
    """
    A = np.zeros((N, N))
    cluster_size = 6
    for c in range(4):
        start = c * cluster_size
        end = start + cluster_size
        A[start:end, start:end] = 0.8
    # Inter-cluster débil
    A[A==0] = 0.2
    np.fill_diagonal(A, 0)
    # Eje principal: nodo 0 conectado fuerte a todos
    A[0, :] = 1.0
    A[:, 0] = 1.0
    A[0,0] = 0
    # Normalizar por fila
    A = A / np.sum(A, axis=1, keepdims=True)
    return A

def run_experiment(K=0.5, T=500, N=24, seed=0):
    """
    Corre simulación completa con manivela t 0-500
    K in [0.2, 0.5, 0.85] - puntos de prueba
    """
    rng = np.random.default_rng(seed)
    A = build_antikythera_matrix(N)
    theta0 = rng.uniform(0, 2*np.pi, size=N)
    omega0 = antikythera_omega_base(N=N, seed=seed)

    dt = 0.1
    steps = int(T/dt)
    theta = theta0.copy()
    r_history = []
    omega_history = []

    for step_idx in range(steps):
        t = step_idx * dt  # manivela 0-500
        omega_t = modulated_omega(t, omega0)
        # Kuramoto step
        coupling = np.zeros(N)
        for i in range(N):
            diff = theta - theta[i]
            coupling[i] = np.sum(A[i] * np.sin(diff))
        theta = theta + (omega_t + K * coupling) * dt
        r = np.abs(np.mean(np.exp(1j * theta)))
        r_history.append(r)
        omega_history.append(omega_t.mean())

    return {
        "K": K,
        "seed": seed,
        "r_final": r_history[-1],
        "r_mean_last_100": np.mean(r_history[-100:]),
        "r_history": np.array(r_history),
        "A": A,
    }
