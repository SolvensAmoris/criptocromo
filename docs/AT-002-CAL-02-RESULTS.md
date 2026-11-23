# AT-002 · CAL-02 · Resultados oficiales

**Estado:** campaña ejecutada; análisis descriptivo documentado.  
**Campaña:** `CAL02-20261123-01`  
**Workflow:** [GitHub Actions run #45184129343](https://github.com/SolvensAmoris/criptocromo/actions/runs/45184129343)  
**Artifact ID:** `14823130453`  
**Commit ejecutado:** `3002ba013a33fa7919fdb46c6cdc2aaf7aed87cb`  
**Motor:** O / 0.1.0  
**Runtime:** Node v24.22.3 · Linux x64  
**Resultado:** `success` · 2,100/2,100 pasos  
**SHA-256 del ZIP publicado por GitHub y verificado tras descarga:** `264d823bf9165ba8f0c7fbf4977bee7951ce9071f0b7544828a2384a2aca0e3d`.

## 1. Diseño ejecutado

CAL-02 fue un barrido de intensidad de entrada sobre el motor O / 0.1.0. Se mantuvieron habilitados memoria, resonancia y plasticidad. La intensidad fue el único factor manipulado.

- Intensidades: 0.10, 0.20, 0.35, 0.50 y 0.75.
- Semillas pareadas: 101, 202, 303, 404, 505, 606, 707, 808, 909 y 1010.
- Diez semillas por intensidad: 50 combinaciones semilla-intensidad.
- Pulso: 18 ticks; recuperación: 24 ticks.
- Duración: 42 ticks por combinación.
- Total: 50 × 42 = 2,100 pasos de motor.
- Registros publicados: 2,100 trazas de tick y 50 resúmenes semilla-intensidad.

## 2. Resultados descriptivos

| Intensidad | Fracción media de valores recortados (42 ticks) | Activación media residual | Pico medio |
|---:|---:|---:|---:|
| 0.10 | 55.35% | 1.00 | 0.7407 |
| 0.20 | 68.65% | 1.00 | 1.00 |
| 0.35 | 77.21% | 1.00 | 1.00 |
| 0.50 | 81.78% | 1.00 | 1.00 |
| 0.75 | 85.92% | 1.00 | 1.00 |

La fracción media de nodos activos fue 1.0 en las cinco intensidades. En las diez semillas de cada intensidad, la activación residual media fue exactamente 1.0.

La proporción de valores recortados disminuyó al reducir la intensidad, pero incluso en 0.10 la fracción total de clipping en los 42 ticks fue 55.35%. El residual permaneció en el techo para todas las semillas y todos los niveles.

## 3. Ventanas temporales y precisión de interpretación

La columna de fracción recortada resume los 42 ticks completos: 18 de pulso más 24 de recuperación. No representa exclusivamente la ventana primaria de ticks 1–16 que se definió posteriormente para AT-003.

En el recálculo de las trazas CAL-02 incorporado al pre-registro AT-003, la intensidad 0.10 no presentó clipping durante ticks 1–16 en las diez semillas. Este dato no contradice el 55.35% de clipping de la tabla: corresponden a ventanas distintas. La saturación residual final siguió ocurriendo en las diez semillas.

## 4. Integridad y procedencia

- El artefacto original se descargó desde GitHub Actions sin modificarlo.
- El SHA-256 del ZIP se recalculó localmente y coincide con el digest publicado por GitHub.
- Los checksums internos de `manifest.json`, `traces.jsonl` y `metrics.json` se recalcularon y coinciden con `checksums.sha256`.
- La identidad del motor O, sus dependencias y la paridad de instrumentación fueron validadas por el workflow.
- El job completó las etapas de validación, ejecución, resumen y carga de evidencia.

El archivo original se conserva como `00_RAW_ARTIFACTS/AT-002_CAL-02_original.zip` en el paquete de datos ATANOR Ω v0.1. La fuente canónica es el artefacto de GitHub Actions enlazado al inicio de este documento.

## 5. Interpretación permitida

Los resultados muestran que, bajo la configuración ejecutada, reducir la intensidad disminuyó la fracción total de valores recortados, pero no evitó la saturación residual. La fracción activa media tampoco discriminó entre intensidades. Por tanto, las métricas finales de activación pierden capacidad de discriminación en este régimen.

Esto es evidencia de una limitación instrumental y de recuperación del motor O bajo las condiciones concretas de CAL-02. No identifica por sí sola el mecanismo que produce la saturación.

## 6. Lo que CAL-02 no demuestra

CAL-02 no demuestra:

- emergencia;
- sinergia entre memoria, resonancia y plasticidad;
- causalidad de la plasticidad o de cualquier mecanismo individual;
- inteligencia, conciencia o agencia;
- equivalencia con procesos físicos o biológicos;
- superioridad o validez de los motores D o S, que no participaron en esta campaña.

El hecho de que los tres switches estuvieran habilitados no permite atribuir el resultado a ninguno de ellos. CAL-02 manipuló intensidad, no los mecanismos A/B/C.

## 7. Relación con AT-003

CAL-02 aporta un antecedente instrumental para AT-003, especialmente la observación de que una intensidad baja puede conservar rango durante ticks 1–16 y aun así saturarse durante la recuperación. AT-003 define su propia calibración factorial, sus semillas, sus criterios de elegibilidad y su regla de selección de intensidad. CAL-02 no ejecuta ni sustituye esa calibración y no confirma ninguna hipótesis de AT-003.

**Estado AT-003 al corte:** pre-registro v1.0 integrado en `main`; revisión independiente pendiente; ejecutor de calibración no implementado; calibración y confirmación no ejecutadas ni autorizadas.

## 8. Documentos relacionados

- [Protocolo AT-002](AT-002-CALIBRATION.md)
- [Revisión pre-ejecución CAL-02](AT-002-CAL-02-PRE-EXECUTION-REVIEW.md)
- [Pre-registro AT-003 v1.0](AT-003-PREREGISTRATION-v1.0.md)
- [Índice de análisis de trazas CAL-01](AT-002-CAL-01-TRACE-ANALYSIS-CHECKLIST.md)

---

ATANOR Ω · Criptocromo