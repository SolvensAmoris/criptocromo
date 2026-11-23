# AT-004 | Resultados del estudio de sensibilidad conductual v0.1

**Run ID:** `BSENS-20261123-01`  
**Estado:** `EXECUTED_TECHNICALLY_VALID_INTERPRETATION_PENDING_REVIEW`  
**Workflow:** [CI run #107](https://github.com/SolvensAmoris/criptocromo/actions/runs/45197104838)  
**PR:** [#13](https://github.com/SolvensAmoris/criptocromo/pull/13)  
**Head del PR:** `47d690c03baed5222fdf5901ed1ccc41f84ff9a8`  
**Commit de ejecución registrado en manifest:** `1a4cf8058db2510e1549116496405e90a9385781`  
**Artifact ID:** `14829955023`  
**SHA-256 del artifact reportado por GitHub:** `b2b63ff593767c208017d760053cf344ac0d5db7ae06f569ce99265e79291ecc`

## 1. Integridad y cobertura

- 200/200 trayectorias registradas: 20 baseline (10 semillas × O/D) + 180 perturbadas.
- 10 semillas CAL-01: 101, 202, 303, 404, 505, 606, 707, 808, 909, 1010.
- Variantes O / 0.1.0 y D / 0.2.0-D.
- Variables ACT, MEM, WGT; magnitudes absolutas `1e-6`, `1e-8`, `1e-10`.
- Node v24.22.3, Linux x64.
- Tests, build, validación del plan AT-002, ejecución del estudio y verificación de checksums: SUCCESS.
- Checksums internos de `manifest.json`, `summaries.json` y `tick-comparisons.jsonl`: 3/3 verificados.

## 2. Variante O / 0.1.0

En las 90 comparaciones perturbadas (3 variables × 3 niveles × 10 semillas):
- 0 cambios en el primer evento de clipping (tick/nodos).
- 0 cambios de terminación.
- 0 diferencias de `Y_s` superiores a 0.01.

| Variable | Delta | Máxima diferencia puntual de estado | Máxima diferencia absoluta en `Y_s` |
|---|---:|---:|---:|
| ACT | 1e-6 | 2.55153049e-6 | 2.52585198e-7 |
| ACT | 1e-8 | 2.55152744e-8 | 2.52585086e-9 |
| ACT | 1e-10 | 2.55152788e-10 | 2.52585730e-11 |
| MEM | 1e-6 | 2.31329008e-6 | 1.56533674e-7 |
| MEM | 1e-8 | 2.31328869e-8 | 1.56533631e-9 |
| MEM | 1e-10 | 2.31329067e-10 | 1.56534785e-11 |
| WGT | 1e-6 | 2.57112555e-6 | 8.87976762e-8 |
| WGT | 1e-8 | 2.57111685e-8 | 8.87978691e-10 |
| WGT | 1e-10 | 2.57111554e-10 | 8.87978580e-12 |

**Lectura O:** las perturbaciones no cambiaron los eventos estructurales ni `Y_s` de forma material. Sin embargo, las diferencias máximas punto a punto excedieron la magnitud inicial de perturbación por un factor aproximado de 2.31–2.57. En particular, el máximo inducido por `1e-6` superó `1e-6`. Por tanto, estos resultados no justifican `1e-6` como límite máximo de diferencia puntual de trayectoria, aunque sí muestran estabilidad local de clipping y de `Y_s` en las diez semillas evaluadas.

## 3. Variante D / 0.2.0-D

Las diez trayectorias baseline D abortaron por guard en los ticks históricos 15–17. Las perturbaciones mantuvieron el mismo estado de terminación y el mismo tick de aborto en las 90 comparaciones: no se observó cambio estructural de terminación.

Sin embargo, la trayectoria D mostró amplificación alta y `Y_s` solo pudo calcularse en la semilla 303, que completó 16 ticks antes de abortar en tick 17. En esa semilla, la diferencia de `Y_s` superó 0.01 para las tres variables al nivel `1e-6`:

| Variable | Delta | Máxima diferencia puntual de estado | Máxima diferencia `Y_s` |
|---|---:|---:|---:|
| ACT | 1e-6 | 4.29528563 | 0.22872193 |
| ACT | 1e-8 | 0.04295270 | 0.00228721 |
| ACT | 1e-10 | 0.00042953 | 0.00002287 |
| MEM | 1e-6 | 2.89595036 | 0.17185725 |
| MEM | 1e-8 | 0.02895944 | 0.00171857 |
| MEM | 1e-10 | 0.00028960 | 0.00001719 |
| WGT | 1e-6 | 1.78727045 | 0.07716501 |
| WGT | 1e-8 | 0.01787268 | 0.00077165 |
| WGT | 1e-10 | 0.00017873 | 0.00000772 |

Para las otras nueve semillas, D abortó antes de completar tick 16; `Y_s` se marcó no disponible y no se imputó. La ausencia de diferencia en tick de aborto no equivale a equivalencia de trayectoria: las diferencias numéricas en el prefijo común fueron grandes.

## 4. Decisión provisional

1. `1e-6` **no se acepta** como margen conductual general compartido por O y D.
2. Para O, `1e-6` no alteró clipping ni `Y_s` de forma material en esta configuración, pero excedió el propio candidato como diferencia máxima puntual de trayectoria. No puede congelarse como epsilon estricto de Nivel 1 con esta evidencia.
3. Para D, `1e-6` produjo una diferencia `Y_s > 0.01` en la única semilla con ventana completa de 16 ticks y diferencias grandes en el prefijo común. D permanece un diagnóstico de alta sensibilidad bajo el régimen sin clipping y con guard.
4. Los niveles `1e-8` y `1e-10` redujeron las diferencias aproximadamente de forma proporcional en este estudio; ninguno queda automáticamente aceptado como margen conductual.
5. No se selecciona un nuevo epsilon a posteriori. El resultado es **MARGEN NO RESUELTO**. Se requiere revisión metodológica antes de diseñar un nuevo estudio o modificar el criterio.

## 5. Límites

Este estudio es sensibilidad local en diez estados iniciales CAL-01, no replicación independiente ni robustez global. No compara plataformas, no demuestra equivalencia científica y no valida el modelo. No modifica los artefactos históricos CAL-01 ni AT-003.

**Conclusión:** el estudio fue ejecutado e íntegro. Su resultado principal no es que `1e-6` haya pasado, sino que no puede sostenerse como margen conductual general ni como epsilon estricto de trayectoria a partir de estos datos.