# AT-002 · CAL-01 · Resultados oficiales

**Estado del análisis:** revisión descriptiva completada  
**Campaña:** CAL01-20261123-01  
**Protocolo:** AT-002-CALIBRATION v0.3.0  
**Commit ejecutado:** defe73928bdccdc63b4cc4ccad93779b0d5e2478  
**Runtime:** Node v24.22.3 · Linux x64  
**Fecha de ejecución:** 23 de noviembre de 2026 (UTC)

## 1. Identidad y procedencia

La ejecución canónica es GitHub Actions run **45179854158** (run number 2), evento workflow_dispatch, branch main, conclusión success. El job cal01 completó todos los pasos: validación de autorización e identidad, instalación, pruebas, build, validación del plan, ejecución CAL-01, resumen y carga de evidencias.

- [Ejecución canónica #2](https://github.com/SolvensAmoris/criptocromo/actions/runs/45179854158)
- Artefacto: at002-cal01-CAL01-20261123-01
- Artifact ID: 14821100607
- SHA-256 del ZIP informado por GitHub y verificado tras descarga: 6e1c005931993645e79b541e8d3c55ba9dfc616a8c3a5e90bb5016db20cd264d
- Run ID experimental: CAL01-20261123-01
- Config SHA-256: b456b4cc8fe64e2c184d163d8ef623aea6cc093351c1c6a6dfe31b83d2b0e8cd

La campaña se despachó dos veces con el mismo run ID. La ejecución #3 (run ID 45179945427) también terminó en success y produjo un segundo artefacto. Los archivos traces.jsonl y metrics.json de ambas ejecuciones son idénticos byte por byte para O y D; los manifiestos difieren únicamente en createdAt y, por consecuencia, también cambian sus archivos checksums.sha256. La segunda ejecución se registra como repetición técnica del mismo protocolo y no como réplica independiente ni como una nueva muestra experimental. No se combinan sus datos.

La ejecución #1 (45179522868) terminó skipped y no produjo artefactos; no forma parte de la campaña ejecutada.

## 2. Integridad y estructura

Se descargó el ZIP original sin modificarlo. El digest del archivo coincide con el digest publicado por GitHub. Los checksums internos de manifest.json, traces.jsonl y metrics.json verifican correctamente en ambas variantes.

| Variante | Estado | Pasos planeados | Pasos completados | Abortos guard | Registros |
|---|---:|---:|---:|---:|---:|
| O · original 0.1.0 | COMPLETE | 420 | 420 | 0 | 420 |
| D · diagnóstico 0.2.0-D | ABORTED_GUARD | 420 | 148 | 10 | 158 |

La inspección estructural no encontró errores: orden monótono de ticks, ausencia de duplicados, 24 activaciones por registro, fases y estímulos coherentes con el protocolo, identidades de variante y semilla correctas. En D, cada semilla termina en un único registro guard_aborted, con observedActivations=null, error literal y activaciones brutas preservadas. No hay registros posteriores al aborto. Los 148 pasos completados y los 10 registros de aborto suman los 158 registros D.

La validación de identidad de motores, dependencias e instrumentación forma parte del ejecutor y fue superada por el job. Los manifiestos coinciden en commit, configuración, protocolo, semillas, switches y runtime.

### Checksums internos

| Variante | manifest.json | traces.jsonl | metrics.json |
|---|---|---|---|
| O | 765c209f2f7622ee41f93db3503a3e5b81737c18ddfe12d138844d99cd357a10 | 495647cec1f5ea7d763952d8a61789407e094fb1b620293845fe47a59c8c9d86 | 43603869eb7624aab0d6d22d9e754f6753c6aa0c2348faff3a9b067e7cbf5a60 |
| D | 9dcaa575b2eba0699aad0f3d806b2edc03217b64c5291c1ce776e4027f3795ec | 926fb5cdb5388bf921f66e48666007b5479fd542994bf0a08361f1f78e7d621f | 368bb2b0128caca11991d63fd66b5d06895228aa8345d959bd4c5e5cca2f2d91 |

## 3. Estado por semilla

| Semilla | O | D: ticks completados | D: tick de aborto |
|---:|---|---:|---:|
| 101 | COMPLETE · 42/42 | 15 | 16 |
| 202 | COMPLETE · 42/42 | 15 | 16 |
| 303 | COMPLETE · 42/42 | 16 | 17 |
| 404 | COMPLETE · 42/42 | 15 | 16 |
| 505 | COMPLETE · 42/42 | 14 | 15 |
| 606 | COMPLETE · 42/42 | 14 | 15 |
| 707 | COMPLETE · 42/42 | 15 | 16 |
| 808 | COMPLETE · 42/42 | 15 | 16 |
| 909 | COMPLETE · 42/42 | 15 | 16 |
| 1010 | COMPLETE · 42/42 | 14 | 15 |

D activó el guard en las diez semillas, siempre durante la fase de pulso. El límite configurado fue |activation| > 1,000,000. El máximo bruto por semilla estuvo entre 1,093,392.13 y 4,803,767.17. Cada tick abortado conserva el vector bruto y el error, pero no inventa un vector observado ni un estado posterior. CAL-01 no produjo trayectoria D de recuperación.

## 4. Clipping y saturación en O

En O se registraron 8,907 valores fuera del intervalo [0,1] entre 10,080 valores nodo-tick: **88.36%**. Hubo al menos un valor fuera de rango en 399 de los 420 ticks. La activación bruta máxima por semilla estuvo aproximadamente entre 5.099337 y 5.099345; la activación observada nunca superó 1.

La fracción media de nodos activos fue 1.0 en todos los ticks. Desde el tick 10 hasta el tick 42, los 24 nodos de las diez semillas estuvieron en el techo de activación: 240 de 240 valores por tick fueron exactamente 1. Esto incluye los 24 ticks de recuperación.

Para cada semilla, el pico de activación media fue 1 y la activación media residual al final de la recuperación también fue 1. La caída pico-residual fue 0 (0%). Por tanto, el motor O completó formalmente la recuperación, pero la recuperación no es informativa: la salida permaneció saturada en el techo.

## 5. Diagnóstico D y divergencia O/D

D conserva la transformación identidad para la activación y aplica un guard de desbordamiento. Antes de los abortos se registraron 2,732 valores brutos fuera de [0,1] entre 3,792 valores disponibles (72.05%). Este porcentaje describe únicamente la exposición parcial de D y **no debe compararse directamente** con el 88.36% de O, que cubre 420 ticks completos. Los estados de O y D dejan de ser equivalentes tras aplicar transformaciones distintas.

La primera divergencia de activación observada O/D aparece en el tick 3 para nueve semillas y en el tick 4 para la semilla 202. La primera divergencia de activación bruta O/D aparece un tick después: tick 4 para nueve semillas y tick 5 para la semilla 202. Esto es consistente con que ambos motores parten de las mismas condiciones y la diferencia de transformación modifica el estado que alimenta los pasos siguientes.

La primera activación bruta de O fuera de [0,1] aparece en el tick 3 para nueve semillas y en el tick 4 para la semilla 202. No se calculan ni reportan distancias posteriores al aborto de D.

## 6. Interpretación restringida

**Observaciones:**

1. Con intensidad 1.0 y los tres switches activos, O alcanza saturación generalizada y permanece en el techo durante la recuperación.
2. La variante D sin clipping desarrolla activaciones brutas que superan el guard de 1,000,000 y aborta de forma controlada en las diez semillas antes de completar la fase de pulso.
3. Los abortos D son resultados parciales válidos, no errores de integridad ni fallos del workflow.

**Conclusión de CAL-01:** la configuración de intensidad 1.0 no permite evaluar recuperación útil en O, y la variante diagnóstica sin clipping no permanece dentro del límite numérico establecido. CAL-01 cumple su propósito de detectar clipping y divergencia instrumental bajo esta configuración.

**Lo que CAL-01 no demuestra:** no identifica qué principio causa la divergencia; no atribuye causalidad a la plasticidad; no demuestra que la retroalimentación hebbiana sea necesaria o suficiente; no demuestra sinergia, emergencia, inteligencia, conciencia ni equivalencia con sistemas físicos o biológicos. H-D1 permanece como hipótesis y requiere una ablación independiente pre-registrada.

## 7. Siguiente etapa recomendada

La siguiente calibración ya definida en configuration.json es CAL-02: barrido de intensidad de entrada en el motor O, con parámetros restantes fijos, los mismos diez seeds y niveles 0.1, 0.2, 0.35, 0.5 y 0.75. Su objetivo inmediato debe ser localizar un régimen que evite la saturación del motor O y permita observar una recuperación informativa.

En la rama main revisada para este informe no existe todavía un workflow de ejecución CAL-02: solo está el workflow manual CAL-01. Por tanto, CAL-02 no se ha ejecutado ni autorizado. Antes de despacharlo se necesita implementar y revisar su ejecutor/workflow, mantener el plan pre-registrado y solicitar autorización explícita para la campaña.

## 8. Artefactos

- [Workflow canónico #2](https://github.com/SolvensAmoris/criptocromo/actions/runs/45179854158)
- [Workflow repetido #3](https://github.com/SolvensAmoris/criptocromo/actions/runs/45179945427)
- [Checklist de análisis CAL-01](AT-002-CAL-01-TRACE-ANALYSIS-CHECKLIST.md)
- [Protocolo AT-002](AT-002-CALIBRATION.md)

Los ZIP originales permanecen como artefactos de GitHub Actions con retención indicada hasta el 21 de febrero de 2027. Este documento es un análisis derivado; no modifica los artefactos originales.
