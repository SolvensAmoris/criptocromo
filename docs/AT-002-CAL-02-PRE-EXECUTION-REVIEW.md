# AT-002 | Revisión pre-ejecución CAL-02

**Estado:** revisión documental preparada; la campaña oficial permanece NO AUTORIZADA.  
**Implementación:** PR #7, merge commit `5000c7dba29661c83b584d629d5e288854eff39f`.  
**CI posterior al merge:** run #71, `45182805251`, conclusión `success`.  
**Identificador propuesto:** `CAL02-20261123-01` (debe comprobarse que no exista antes del despacho).

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

- [ ] Confirmar que el workflow corre desde `main` y que el SHA de checkout corresponde al commit revisado.
- [ ] Confirmar identidad Git blob SHA-1 del módulo O y de todas sus dependencias fijadas en `configuration.json`.
- [ ] Confirmar SHA-256 de la configuración incluida en el manifiesto.
- [ ] Confirmar que no se modificó el motor histórico O ni la configuración preregistrada después de la revisión.
- [ ] Confirmar que el identificador de ejecución es único y que el directorio final no existe.
- [ ] Confirmar que los artefactos se escriben solo en `O/CAL-02/<RUN_ID>/`, sin mezclar variantes ni campañas.

## 3. Estructura de trazas y métricas

- [ ] 2,100 registros de tick en `traces.jsonl`.
- [ ] 50 métricas semilla-intensidad en `metrics.json`.
- [ ] 42 ticks completos por combinación: 18 `pulse` y 24 `recovery`.
- [ ] 24 activaciones brutas y 24 observadas por registro.
- [ ] Intensidad registrada en cada traza y consistente con el conjunto preregistrado.
- [ ] Semilla registrada en cada traza y consistente con las diez semillas declaradas.
- [ ] Paridad de instrumentación: activaciones observadas coinciden con `clamp(raw, 0, 1)` dentro de la tolerancia implementada.
- [ ] Métricas de clipping, exceso absoluto, fracción activa, pico, residual y caída de recuperación recalculables desde las trazas.
- [ ] Checksums SHA-256 de manifiesto, trazas y métricas verificados independientemente.

## 4. Interpretación predefinida

Reportar cada intensidad por separado y conservar todos los resultados, incluidos ausencia de respuesta, clipping y saturación. Comparar semillas pareadas dentro de cada intensidad. No tratar los 2,100 ticks ni los 24 nodos como observaciones independientes para inflar el tamaño muestral.

CAL-02 puede identificar zonas de respuesta y límites del motor O bajo este protocolo. Por sí sola no demuestra causalidad de mecanismos internos, sinergia, emergencia, inteligencia, conciencia ni equivalencia física o biológica. No escoger retrospectivamente un nivel como “óptimo” sin definir y justificar un criterio independiente.

La evaluación de GATE-01 permanece separada y no se considera aprobada por ejecutar CAL-02.

## 5. Autorización y despacho

- [ ] Revisión del código y del protocolo cerrada.
- [ ] CI posterior al merge verificada.
- [ ] RUN_ID comprobado como no utilizado.
- [ ] Autorización explícita del responsable de la campaña recibida para CAL-02.
- [ ] En GitHub Actions seleccionar rama `main`, `authorization=YES` y el RUN_ID aprobado.
- [ ] Verificar que el job no quedó `skipped`, que finalizó y que el artefacto esperado fue publicado.

El workflow exige `YES` exacto. Merge, CI verde, generación del plan y autorización previa de CAL-01 no autorizan CAL-02. No despachar hasta completar las comprobaciones y recibir autorización específica para esta campaña.
