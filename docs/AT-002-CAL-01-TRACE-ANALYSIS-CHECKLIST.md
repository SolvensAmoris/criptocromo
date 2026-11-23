# AT-002 | CAL-01 | Checklist de análisis de trazas

**Propósito:** analizar la campaña oficial CAL-01 sin confundir divergencia descriptiva con atribución causal.  
**Estado:** especificación pre-ejecución. No contiene resultados de campaña.  
**Artefactos esperados:** `manifest.json`, `traces.jsonl`, `metrics.json`, `checksums.sha256` para O y D.

## A. Integridad y procedencia

- [ ] Registrar URL del workflow, número de ejecución, fecha/hora UTC, conclusión y SHA del commit ejecutado.
- [ ] Registrar el identificador de campaña y confirmar que coincide en O y D.
- [ ] Descargar el artefacto original sin modificarlo y conservar una copia de solo lectura.
- [ ] Verificar los cuatro archivos esperados por variante.
- [ ] Validar `checksums.sha256` para `manifest.json`, `traces.jsonl` y `metrics.json` en O y D.
- [ ] Confirmar que `configSha256`, `sourceCommitSha`, protocolo, semillas, switches, estímulo y runtime coinciden con lo pre-registrado.
- [ ] Confirmar identidades de motor y dependencias: O=0.1.0, D=0.2.0-D; comprobar hashes registrados contra el manifiesto.
- [ ] Confirmar 10 semillas esperadas: 101, 202, 303, 404, 505, 606, 707, 808, 909, 1010.
- [ ] Confirmar 18 pasos de pulso y 24 de recuperación por semilla, salvo los ticks D abortados por guard.
- [ ] Confirmar que no hubo mezcla de variantes ni sobrescritura de directorios.

**Regla:** si falla una comprobación de identidad o integridad, detener el análisis sustantivo. Informar el problema como bloqueo de evidencia, no reparar silenciosamente los archivos.

## B. Integridad estructural de las trazas

Para cada variante y semilla:

- [ ] Contar registros y ticks únicos.
- [ ] Comprobar orden monótono de ticks y ausencia de duplicados.
- [ ] Comprobar que cada registro declara experimento, versión de protocolo, etapa, variante, versión de motor y semilla correctos.
- [ ] Comprobar que cada vector de activación tiene el número esperado de nodos.
- [ ] Confirmar fase: ticks 1–18 = pulso; ticks 19–42 = recuperación.
- [ ] Confirmar estímulo: frecuencia objetivo 0.5; intensidad 1.0 durante pulso y 0 durante recuperación.
- [ ] Verificar que los ticks completados tienen `observedActivations` y `meanActivation` válidos.
- [ ] Verificar que un tick `guard_aborted` tiene `observedActivations=null`, error registrado y valores brutos conservados.
- [ ] Confirmar que no hay registros posteriores al tick abortado para esa semilla D.
- [ ] Comparar recuentos de registros, métricas por semilla y manifiesto.

No imputar estados ni rellenar huecos posteriores al aborto.

## C. Estado de ejecución por variante y semilla

Construir una tabla con una fila por semilla y variante:

| Campo | Descripción |
|---|---|
| `status` | COMPLETE o ABORTED_GUARD |
| `plannedTickCount` | 42 |
| `completedTickCount` | Pasos completados antes del final o aborto |
| `guardTriggered` | Booleano |
| `guardError` | Mensaje literal, si aplica |
| `recordCount` | Registros efectivamente conservados |
| `maxAbsoluteRawActivation` | Máxima magnitud bruta observada |
| `clippedValueCount` | Valores brutos fuera de [0,1] |
| `clippedFraction` | Fracción respecto a valores brutos registrados |
| `totalAbsoluteClippingExcess` | Exceso absoluto acumulado |
| `ticksWithAnyClipping` | Ticks con al menos un valor fuera de rango |

- [ ] Informar número de semillas O completas.
- [ ] Informar número de semillas D completas y abortadas por guard.
- [ ] No llamar “fallo” a un aborto correctamente registrado por el guard.
- [ ] Separar error de integridad, error del workflow y `ABORTED_GUARD`.

## D. Divergencia O/D

La comparación entre motores es descriptiva y solo se realiza en ticks comparables. O y D comparten semilla, estímulo y estado inicial determinista, pero sus estados dejan de ser equivalentes una vez que la transformación de activación difiere.

- [ ] Alinear por semilla y tick.
- [ ] Comparar activaciones brutas O/D antes de la transformación para comprobar la primera diferencia numérica.
- [ ] Identificar el primer tick donde la activación bruta excede [0,1] en O.
- [ ] Identificar el primer tick donde la activación observada O y D deja de coincidir dentro de tolerancia numérica predefinida.
- [ ] Reportar ambas definiciones por separado; no tratarlas como equivalentes.
- [ ] Para cada tick comparable, calcular resumen de diferencias de activación por nodo: media absoluta, máximo absoluto y número de nodos divergentes.
- [ ] Graficar o tabular media, máximo y distribución de activación bruta por tick.
- [ ] Marcar explícitamente los ticks abortados de D y detener la curva en ese punto.
- [ ] No calcular distancia O/D para ticks posteriores al aborto.
- [ ] No describir D como “la salida verdadera” ni O como “error”: son variantes con reglas de activación distintas.

**Nota:** si la instrumentación bruta recalculada es idéntica antes de transformar, la primera divergencia observada debe localizarse en la transformación/estado posterior, no atribuirse a una diferencia de entrada.

## E. Clipping y exceso de activación

Para O y D, por semilla y tick:

- [ ] Contar valores brutos menores que 0.
- [ ] Contar valores brutos mayores que 1.
- [ ] Calcular fracción de valores fuera de [0,1].
- [ ] Calcular exceso positivo acumulado: suma de `max(0, -x, x-1)` para valores brutos x.
- [ ] Informar máximo, mínimo y máximo absoluto de activación bruta.
- [ ] Informar ticks con al menos un valor fuera de rango.
- [ ] Comparar magnitud del exceso entre semillas sin ocultar distribuciones individuales.
- [ ] Distinguir cantidad de valores fuera de rango de magnitud del exceso: no son la misma métrica.

No inferir causalidad a partir de correlaciones temporales entre exceso, pesos y activación.

## F. Recuperación del motor O

La recuperación completa solo puede evaluarse en O, que mantiene el clipping histórico y debe completar los 42 pasos si la ejecución fue correcta.

- [ ] Confirmar 24 ticks de recuperación por semilla O.
- [ ] Reportar activación media por tick durante pulso y recuperación.
- [ ] Reportar pico y residual por semilla.
- [ ] Calcular cambio pico-residual y fracción de descenso con fórmula explícita.
- [ ] Reportar fracción de nodos activos por tick usando el criterio documentado del ejecutor (`activation > 0`); no cambiarlo después de ver resultados.
- [ ] Reportar valores en suelo y techo por tick: activación igual a 0 y a 1.
- [ ] Reportar dispersión entre semillas, además de medias.
- [ ] No evaluar GATE-01 con CAL-01: GATE-01 requiere las condiciones factoriales correspondientes y sus métricas definidas.

## G. Interpretación y límites

- [ ] Separar observación, cálculo derivado e interpretación.
- [ ] Describir CAL-01 como diagnóstico de clipping y divergencia entre O/D.
- [ ] Describir `ABORTED_GUARD` como resultado parcial válido bajo el límite de seguridad computacional fijado.
- [ ] No extrapolar trayectoria D posterior al guard.
- [ ] No concluir que plasticidad causó la divergencia.
- [ ] No concluir que la retroalimentación hebbiana es necesaria o suficiente.
- [ ] No concluir emergencia, sinergia ni comportamiento físico a partir de CAL-01.
- [ ] Registrar anomalías, datos ausentes y decisiones analíticas sin modificar los datos originales.
- [ ] Publicar scripts o fórmulas de análisis, versión del entorno y hashes del análisis derivado.

## H. Informe mínimo de resultados

El informe debe incluir:

1. Identidad de campaña, commit, runtime y verificación de checksums.
2. Tabla de estado por semilla y variante.
3. Resumen de completitud y abortos.
4. Curvas O y D, con marcas de aborto y sin extrapolación.
5. Primer tick de divergencia bruta y primer tick de divergencia observada, definidos por separado.
6. Conteos y fracciones fuera de [0,1], más exceso absoluto acumulado.
7. Recuperación O y dispersión entre semillas.
8. Limitaciones, desviaciones del protocolo y cualquier bloqueo de integridad.
9. Conclusión restringida a lo que CAL-01 realmente mide.
10. Próxima pregunta experimental, sin adelantar resultado de la ablación H-D1.

**Criterio de cierre del análisis:** todas las secciones A–H completadas o marcadas explícitamente como no evaluables con justificación. Ningún dato posterior a un aborto puede presentarse como observado.
