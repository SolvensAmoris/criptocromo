# AT-002 | Revisión pre-ejecución CAL-02

**Estado:** revisión pre-ejecución histórica; las comprobaciones se completaron antes del despacho. CAL-02 fue autorizada y ejecutada oficialmente el 23 de noviembre de 2026. Los resultados posteriores no alteran el protocolo ni esta lista de control.  
**Implementación:** PR #7, merge commit `5000c7dba29661c83b584d629d5e288854eff39f`.  
**CI posterior al merge:** run #71, `45182805251`, conclusión `success`.  
**Identificador ejecutado:** `CAL02-20261123-01`.

## 1. Diseño preregistrado que no debe alterarse

- Motor: O / 0.1.0, con clipping histórico.
- Factor manipulado: intensidad de entrada.
- Niveles: 0.10, 0.20, 0.35, 0.50 y 0.75.
- Semillas pareadas: 101, 202, 303, 404, 505, 606, 707, 808, 909 y 1010.
- Switches: memoria, resonancia y plasticidad habilitados.
- Secuencia por combinación: 18 ticks de pulso y 24 de recuperación.
- Cardinalidad: 5 niveles × 10 semillas = 50 combinaciones.
- Pasos de motor planeados: 50 × 42 = 2,100.
- Único factor manipulado: intensidad. No ajustar coeficientes, umbrales, frecuencia, motor ni switches en esta campaña.

La intensidad de entrada no es la activación del nodo. El barrido mapea cómo el motor O responde a esos estímulos; no presupone que los niveles bajos eviten clipping ni que alguno sea un régimen óptimo.

## 2. Integridad e identidad

- [x] Confirmado: workflow desde `main`; commit ejecutado `3002ba013a33fa7919fdb46c6cdc2aaf7aed87cb`.
- [x] Identidad Git blob SHA-1 del módulo O y dependencias validada por el ejecutor.
- [x] SHA-256 de configuración registrado en el manifiesto de campaña.
- [x] Motor O y configuración preregistrada conservados sin cambios para la campaña.
- [x] RUN_ID `CAL02-20261123-01` validado por el workflow/ejecutor.
- [x] Artefactos generados en la ruta O/CAL-02 correspondiente al RUN_ID.

## 3. Estructura de trazas y métricas

- [x] 2,100 registros de tick en `traces.jsonl`.
- [x] 50 métricas semilla-intensidad en `metrics.json`.
- [x] 42 ticks completos por combinación: 18 `pulse` y 24 `recovery`.
- [x] 24 activaciones brutas y 24 observadas por registro.
- [x] Intensidad registrada en cada traza y consistente con el conjunto preregistrado.
- [x] Semilla registrada en cada traza y consistente con las diez semillas declaradas.
- [x] Paridad de instrumentación comprobada: activaciones observadas coinciden con `clamp(raw, 0, 1)` dentro de la tolerancia implementada.
- [x] Métricas de clipping, exceso absoluto, fracción activa, pico, residual y caída de recuperación incluidas y recalculables desde las trazas.
- [x] Checksums SHA-256 internos verificados; SHA-256 del ZIP contrastado con el digest de GitHub.

## 4. Interpretación predefinida

Reportar cada intensidad por separado y conservar todos los resultados, incluidos ausencia de respuesta, clipping y saturación. Comparar semillas pareadas dentro de cada intensidad. No tratar los 2,100 ticks ni los 24 nodos como observaciones independientes para inflar el tamaño muestral.

CAL-02 puede identificar zonas de respuesta y límites del motor O bajo este protocolo. Por sí sola no demuestra causalidad de mecanismos internos, sinergia, emergencia, inteligencia, conciencia ni equivalencia física o biológica. No escoger retrospectivamente un nivel como “óptimo” sin definir y justificar un criterio independiente.

La evaluación de GATE-01 permanece separada y no se considera aprobada por ejecutar CAL-02.

## 5. Autorización y despacho

- [x] Revisión del código y del protocolo cerrada antes del despacho.
- [x] CI posterior al merge verificada.
- [x] RUN_ID comprobado como no utilizado antes del despacho.
- [x] Autorización explícita `YES` recibida para CAL-02.
- [x] Workflow manual despachado desde `main` con `authorization=YES` y RUN_ID aprobado.
- [x] Job completado con `success`; artefacto esperado publicado y preservado.

El workflow exigió `YES` exacto. Merge, CI verde, generación del plan y autorización previa de CAL-01 no constituyeron autorización para CAL-02. La autorización específica se recibió antes del despacho documentado en la sección 6. Esta lista no autoriza ninguna repetición ni campaña futura.


## 6. Resultado posterior a la revisión

La campaña oficial se ejecutó en [GitHub Actions #45184129343](https://github.com/SolvensAmoris/criptocromo/actions/runs/45184129343). El artifact ID es `14823130453`; el commit ejecutado es `3002ba013a33fa7919fdb46c6cdc2aaf7aed87cb`; el SHA-256 del ZIP es `264d823bf9165ba8f0c7fbf4977bee7951ce9071f0b7544828a2384a2aca0e3d`.

Resultado: 2,100/2,100 pasos, 50 resúmenes semilla-intensidad. La activación residual media fue 1.0 en cada intensidad y en las diez semillas. La fracción activa media también fue 1.0. La fracción de valores recortados (resumida sobre 42 ticks) fue 55.35%, 68.65%, 77.21%, 81.78% y 85.92% para intensidades 0.10, 0.20, 0.35, 0.50 y 0.75, respectivamente.

La reducción de intensidad disminuyó el clipping total, pero no evitó la saturación residual. CAL-02 no demuestra emergencia, sinergia ni causalidad de mecanismos internos. El informe completo está en `docs/AT-002-CAL-02-RESULTS.md`.

Esta revisión conserva su función histórica: documenta las condiciones verificadas antes de ejecutar. No debe leerse como una autorización reutilizable para campañas futuras.
