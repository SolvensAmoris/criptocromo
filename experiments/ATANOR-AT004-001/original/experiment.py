"""
experiment.py - Barrido K y semillas AT-004
Preregistro: AT-004_prereg.json
"""

import numpy as np
from network_24 import run_experiment
from metrics import success_criteria, aggregate_metrics
import json

# Puntos preregistrados - no cambiar después de ver resultados
K_VALUES = [0.2, 0.5, 0.85]
SEEDS = [0, 1, 2, 3, 4, 7, 13, 21, 42, 99]  # 10 semillas

def full_sweep():
    all_results = []
    report = []

    for K in K_VALUES:
        for seed in SEEDS:
            res = run_experiment(K=K, T=500, seed=seed)
            crit = success_criteria(res)
            all_results.append(res)
            report.append(crit)
            print(f"K={K:.2f} seed={seed:2d} r={crit['r_observed']:.3f} "
                  f"expected {crit['expected']} -> {'PASS' if crit['success'] else 'FAIL'}")

    agg = aggregate_metrics(all_results)
    print("\n=== AGREGADO ===")
    print(json.dumps(agg, indent=2))

    # Tasa de éxito por K
    for K in K_VALUES:
        subset = [r for r in report if r["K"] == K]
        pass_rate = sum(1 for r in subset if r["success"]) / len(subset)
        print(f"K={K} pass_rate={pass_rate:.1%}")

    return all_results, report

if __name__ == "__main__":
    full_sweep()
