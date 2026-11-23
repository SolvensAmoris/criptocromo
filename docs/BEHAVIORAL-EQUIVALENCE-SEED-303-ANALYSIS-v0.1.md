# Análisis de sensibilidad D: semilla 303 y prefijos comunes
## Versión 0.1 | Análisis descriptivo reproducible

**Estado:** análisis del artefacto histórico; no congela un margen conductual.  
**Fuente:** campaña BEHAVIORAL-SENSITIVITY-001, run ID BSENS-45198131816.  
**Artifact ID:** 14828178437.  
**SHA-256 ZIP:** 475cc8ddd26a1b3c629c290152aec2dda7954ad633d3592092e2b66b6595fd96.  
**Commit generador:** 9ccd5fccb5dab97bc724114154bf48fd39e0ba97.  
**Protocolo:** 10 semillas × 2 variantes × (baseline + 3 variables × 3 magnitudes) = 200 trayectorias; 18 ticks de pulso + 24 de recuperación.

## 1. Pregunta

¿La semilla 303 es un caso de amplificación excepcional, o es la única trayectoria D que permite observar la ventana primaria completa de 16 ticks antes de que se active el guard?

Este análisis utiliza únicamente los registros del artefacto citado. No reconstruye ni imputa ticks posteriores al aborto.

## 2. Integridad y alcance

- SHA-256 del ZIP verificado contra el valor fijado en el contrato del comparador.
- El paquete contiene manifest.json, summaries.json, tick-comparisons.jsonl y checksums.sha256.
- El manifiesto declara 200 trayectorias y los archivos internos tienen tres checksums verificables.
- La comparación por tick existe solo para el prefijo en que baseline y perturbación completaron ambos el tick.
- La diferencia máxima de estado usada para evaluar candidatos es el máximo entre activación observada, memoria y pesos. La activación bruta se informa por separado y no forma parte de maxStateDifference en el ejecutor original.
- Los indicadores exceedsCandidate1e6/1e8/1e10 del artefacto comparan maxStateDifference, no maxRawActivationDifference.

## 3. Ventana observada y censura

| Semilla | Último tick completado | Tick del intento abortado |
|---:|---:|---:|
| 101 | 15 | 16 |
| 202 | 15 | 16 |
| 303 | 16 | 17 |
| 404 | 15 | 16 |
| 505 | 14 | 15 |
| 606 | 14 | 15 |
| 707 | 15 | 16 |
| 808 | 15 | 16 |
| 909 | 15 | 16 |
| 1010 | 14 | 15 |

Las diez semillas comparten ticks 1–14. Solo la semilla 303 completa el tick 16 y, por ello, solo ella permite calcular Y16 en la variante D. Las otras nueve no tienen Y16 observable. No se les asigna cero ni se extrapola su resultado.

## 4. ¿La semilla 303 amplifica más en el prefijo común?

Para responder sin sesgo por diferente duración, se comparó primero el prefijo común de ticks 1–14. La siguiente tabla informa, para cada semilla, la máxima diferencia de estado observada en ese prefijo, tomando el máximo entre ACT, MEM y WGT a perturbación 1e-6. El valor resume activación observada, memoria y pesos, no activación bruta.

| Semilla | ACT | MEM | WGT | Máximo entre las tres |
|---:|---:|---:|---:|---:|
| 101 | 0.477879 | 0.322550 | 0.216640 | 0.477879 |
| 202 | 0.301663 | 0.215475 | 0.148734 | 0.301663 |
| 303 | 0.123062 | 0.092466 | 0.041519 | 0.123062 |
| 404 | 0.791141 | 0.529607 | 0.367751 | 0.791141 |
| 505 | 1.087089 | 0.705481 | 0.484906 | 1.087089 |
| 606 | 1.551417 | 1.024248 | 0.532362 | 1.551417 |
| 707 | 0.619212 | 0.419616 | 0.273992 | 0.619212 |
| 808 | 0.883804 | 0.595875 | 0.334078 | 0.883804 |
| 909 | 0.430692 | 0.294062 | 0.198414 | 0.430692 |
| 1010 | 0.879035 | 0.610966 | 0.311952 | 0.879035 |

**Resultado descriptivo:** en el prefijo común 1–14, la semilla 303 presenta el menor máximo de diferencia de estado de las diez semillas para cada variable perturbada a 1e-6. Por tanto, el artefacto no respalda describirla como la semilla de mayor amplificación temprana. Su singularidad en el análisis anterior procede de haber completado dos ticks adicionales y, con ello, de ser la única con Y16 calculable.

Esto no demuestra que la semilla 303 sea intrínsecamente menos sensible: el resultado se limita a las variables, magnitud, condiciones y prefijo comparados.

## 5. Crecimiento de diferencias en el prefijo común

En las diez semillas, las 30 combinaciones D (10 semillas × 3 variables) presentan su primera diferencia de estado en el primer tick completado comparado, para cada uno de los tres niveles de perturbación.

Como resumen de escala, para ACT con delta 1e-6, la mediana entre semillas del máximo de diferencia de activación observada por tick pasa de aproximadamente 8.63e-7 en tick 1 a 1.27e-3 en tick 10 y 7.05e-1 en tick 14. La secuencia evidencia amplificación en el prefijo observado bajo esta configuración. No identifica por sí sola el mecanismo causal ni autoriza extrapolar después del guard.

Los niveles 1e-8 y 1e-10 muestran el mismo patrón de escalamiento aproximado en los registros, pero no se deben tratar como equivalentes: cada nivel conserva sus propias diferencias absolutas y su propia comparación con el umbral candidato.

## 6. Evaluación de candidatos bajo el criterio de trayectoria

El ejecutor define maxStateDifference como el máximo entre maxActivationObserved, maxMemory y maxWeight, y compara ese valor con el candidato correspondiente. Recuento de perturbaciones cuyo máximo de estado supera su propio candidato:

| Variante | Variable | 1e-6 | 1e-8 | 1e-10 |
|---|---|---:|---:|---:|
| O | ACT | 10/10 | 10/10 | 10/10 |
| O | MEM | 9/10 | 9/10 | 9/10 |
| O | WGT | 9/10 | 9/10 | 9/10 |
| D | ACT | 10/10 | 10/10 | 10/10 |
| D | MEM | 10/10 | 10/10 | 10/10 |
| D | WGT | 10/10 | 10/10 | 10/10 |

**Interpretación limitada:** bajo el criterio estricto de trayectoria definido por el propio ejecutor, ni 1e-8 ni 1e-10 quedan respaldados como márgenes generales. En D, las 30/30 perturbaciones exceden su candidato en cada uno de los tres niveles. En O, ACT excede en 10/10 y MEM/WGT en 9/10 para cada nivel.

Este recuento no establece un margen alternativo. Confirma que no debe aceptarse uno solo por ser numéricamente menor.

## 7. Métrica agregada Y16 en la semilla 303

La diferencia absoluta de Y16 está disponible únicamente para las nueve perturbaciones de la semilla 303:

| Variable | delta=1e-6 | delta=1e-8 | delta=1e-10 |
|---|---:|---:|---:|
| ACT | 0.22872193 | 0.00228721 | 0.00002287 |
| MEM | 0.17185725 | 0.00171857 | 0.00001719 |
| WGT | 0.07716501 | 0.00077165 | 0.00000772 |

A 1e-6, las tres diferencias superan 0.01. A 1e-8 y 1e-10, las diferencias observadas en esta única semilla son inferiores a 0.01. Esto no compensa el incumplimiento del criterio primario de trayectoria ni permite generalizar a las otras nueve semillas, para las que Y16 no existe por censura.

## 8. Eventos estructurales

En las 90 perturbaciones D:

- el estado de terminación coincide con su baseline;
- el tick de aborto coincide con el baseline de la semilla;
- la causa registrada continúa siendo el guard de overflow;
- no aparece clipping en D.

La invariancia del tick de guard no equivale a equivalencia conductual: las diferencias de estado crecen antes del aborto y pueden superar ampliamente los candidatos numéricos.

## 9. Conclusiones autorizadas

1. La semilla 303 no es la de mayor amplificación dentro del prefijo común 1–14; en la comparación 1e-6 presenta los menores máximos de diferencia de estado para ACT, MEM y WGT.
2. Es la única semilla D con 16 ticks completos, por lo que es la única con Y16 calculable. La diferencia de Y16 para 1e-6 no debe interpretarse como una comparación de diez semillas.
3. Las nueve semillas restantes están censuradas antes de completar la ventana. No se infiere su Y16, ni comportamiento posterior al aborto.
4. Bajo el criterio de trayectoria del ejecutor, 1e-8 y 1e-10 tampoco satisfacen un margen general: todas las perturbaciones D exceden el candidato correspondiente.
5. La igualdad del tick de guard no demuestra equivalencia de trayectoria.
6. El análisis no identifica la causa dinámica de la amplificación, no demuestra inestabilidad asintótica y no permite inferir irreducibilidad computacional o emergencia.

## 10. Estado del criterio conductual v0.2

Este análisis satisface la tarea descriptiva de comparar la semilla 303 con las otras nueve en el prefijo común y documenta el resultado para los tres niveles. No completa todos los requisitos del checklist v0.2: falta una evaluación específica de márgenes por variable y variante que incluya las dimensiones no perturbadas directamente en PR #13 (activación bruta y señal de vecinos), además de revisión metodológica independiente.

**Decisión recomendada:** conservar el margen conductual general como UNRESOLVED; no congelar 1e-8 ni 1e-10. Actualizar v0.2 mediante una versión posterior solo después de revisión, sin alterar retrospectivamente los resultados de PR #12 o PR #13.

---

**Principio de interpretación:** la semilla 303 es una ventana de observación más larga, no una prueba de una dinámica excepcional. Los ticks no observados siguen siendo censurados, no ceros.
