"""
antikythera_drives.py - Drives de Anticítera escalados
ATANOR-AT004-001

El mecanismo de Anticítera tiene periodos Metónico (19a), Calípico (76a),
Saros (223 lunaciones). Aquí los escalamos x6.5 para encajar en 24 osciladores.
"""

import numpy as np

# Periodos reales del mecanismo (Freeth et al. 2006 Nature)
PERIODS_RAW = {
    "metonic": 19.0,      # años
    "callippic": 76.0,    # 4* metonic
    "saros": 18.03,       # 223 meses sinódicos ~ 18.03 años
    "exeligmos": 54.09,   # 3* saros
    "lunar": 0.0748,      # 27.3 días en años
}

SCALING = 6.5  # factor de escala para simular: 19a -> 19*6.5 = 123.5 pasos en t 0-500
# SCALING elegido para que manivela t 0-500 cubra ~4 ciclos metónicos

def get_scaled_periods():
    return {k: v * SCALING for k, v in PERIODS_RAW.items()}

def drive_signal(t: float, period_scaled: float, amp=1.0) -> float:
    """Señal sinusoidal del engranaje escalado"""
    return amp * np.sin(2 * np.pi * t / period_scaled)

def antikythera_omega_base(N=24, base_freq=1.0, dispersion=0.1, seed=0):
    """
    Frecuencias naturales omega_i distribuidas alrededor de base_freq
    con dispersión, moduladas por drives.
    """
    rng = np.random.default_rng(seed)
    omega = rng.normal(base_freq, dispersion, size=N)
    return omega

def modulated_omega(t: float, omega0: np.ndarray, scaling=SCALING):
    """
    Modula omega con los 3 drives principales
    Retorna omega(t)
    """
    periods = get_scaled_periods()
    # Pesos: metónico fuerte, saros medio, lunar rápido
    w_met = 0.2 * drive_signal(t, periods["metonic"])
    w_saros = 0.1 * drive_signal(t, periods["saros"])
    w_lunar = 0.05 * drive_signal(t, periods["lunar"])
    mod = 1.0 + w_met + w_saros + w_lunar
    return omega0 * mod
