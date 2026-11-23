"""
metrics.py - Métricas de éxito AT-004
"""

import numpy as np

def success_criteria(result: dict) -> dict:
    """
    Criterio preregistrado AT-004_prereg.json
    Éxito si:
    - K=0.2: r < 0.4 (incoherente)
    - K=0.5: 0.4 <= r <= 0.8 (parcial)
    - K=0.85: r > 0.7 (sincronizado)
    """
    K = result["K"]
    r = result["r_mean_last_100"]

    if K == 0.2:
        success = r < 0.4
        expected = "r < 0.4"
    elif K == 0.5:
        success = 0.4 <= r <= 0.8
        expected = "0.4 <= r <= 0.8"
    elif K == 0.85:
        success = r > 0.7
        expected = "r > 0.7"
    else:
        success = False
        expected = "K no preregistrado"

    return {
        "K": K,
        "r_observed": float(r),
        "expected": expected,
        "success": bool(success),
        "rule": "MODEL != EVIDENCE: éxito del modelo no implica que Anticítera fuera Kuramoto"
    }

def aggregate_metrics(results: list) -> dict:
    rs = [r["r_mean_last_100"] for r in results]
    return {
        "mean_r": float(np.mean(rs)),
        "std_r": float(np.std(rs)),
        "min_r": float(np.min(rs)),
        "max_r": float(np.max(rs)),
        "n": len(results)
    }
