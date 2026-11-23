# Criterio de equivalencia conductual entre implementaciones
## Versión 0.2 | Borrador para revisión y PR

**Estado:** `BEHAVIORAL_EQUIVALENCE_v0.2_DRAFT_FOR_PR_NOT_FROZEN`  
**Decisión:** borrador para revisión. No congelar hasta resolver el análisis de la semilla 303 y evaluar márgenes separados por variable y variante.  
**Naturaleza:** documento metodológico independiente.  
**No modifica:** AT-002, AT-003 v0.2, PR #12 ni PR #13. Los resultados se citan como antecedentes y no se reinterpretan.

## Antecedentes verificados

- **PR #12, integrado:** reproducción NetLogo / Criptocromo de CAL-01. Merge commit completo: `8cf190010b798ec73b0a619e1e7772bb4d1eb209`. Resultado reportado: `EQUIVALENCE_OBSERVED_WITHIN_TOLERANCE`, 341,040 registros emparejados, cero discrepancias y error absoluto máximo 0, con tolerancia numérica absoluta de `1e-10`. Esto acredita la comparación numérica de esa configuración concreta, no equivalencia conductual general.
- **PR #13, integrado:** estudio de sensibilidad conductual. Merge commit completo: `4b1578e132d8eb4f0ea514da7889c6d6c3737569`.
- **Ejecución de sensibilidad:** workflow [run #7](https://github.com/SolvensAmoris/criptocromo/actions/runs/45198131816), identificador `BSENS-45198131816`; 200/200 trayectorias; checksums internos 3/3 verificados; Node v24.22.3, Linux x64.
- **Paquete de evidencia:** artifact ID `14828178437`; SHA-256 `475cc8ddd26a1b3c629c290152aec2dda7954ad633d3592092e2b66b6595fd96`.
- **Resultados detallados:** [AT-004 | Resultados del estudio de sensibilidad conductual v0.1](BEHAVIORAL-EQUIVALENCE-SENSITIVITY-RESULTS-v0.1.md).

Los identificadores abreviados que aparecieron en borradores previos (`8a1f306`, `ab1528ee` y `BSENS-4519813816`) no son los identificadores canónicos de GitHub para estos antecedentes. Se sustituyen aquí por los SHA y el run ID verificados arriba.

## 1. Qué cambia de v0.1 a v0.2

En v0.1, `1e-6` era un candidato provisional. A partir de la evidencia de PR #13, v0.2 lo clasifica como **RECHAZADO como margen conductual general y como epsilon estricto de trayectoria**.

No se rechaza por preferencia numérica, sino por resultados observados:

### Evidencia de la variante O

- Ninguna de las 90 comparaciones perturbadas cambió el primer evento de clipping ni la terminación.
- Ninguna diferencia de (Y_s) superó 0.01.
- Sin embargo, para perturbaciones iniciales de `1e-6`, las diferencias puntuales máximas de estado llegaron aproximadamente a (2.31\times10^{-6})–(2.57\times10^{-6}), superiores al propio candidato.
- **Conclusión limitada:** `1e-6` no satisface el criterio propuesto de epsilon estricto para cada punto de la trayectoria en O. La ausencia de cambios en clipping y (Y_s) no elimina esa refutación.

### Evidencia de la variante D

- Las perturbaciones no cambiaron el estado de terminación ni el tick de guard reportado.
- La semilla 303 fue la única que completó los 16 ticks necesarios para calcular (Y_s) antes de abortar en tick 17.
- En esa semilla, las perturbaciones `1e-6` en ACT, MEM y WGT produjeron diferencias de (Y_s) superiores a 0.01. Los máximos reportados fueron aproximadamente 0.22872, 0.17186 y 0.07717, respectivamente.
- En las demás semillas D, (Y_s) no está disponible porque el guard interrumpió la ejecución antes de completar la ventana. No se imputan valores.
- **Conclusión limitada:** `1e-6` puede alterar materialmente (Y_s) en D, al menos en la semilla 303 y bajo esta configuración. La ausencia de cambio en el tick de aborto no equivale a equivalencia de trayectoria.

### Decisión v0.2

| Criterio | Estado |
|---|---|
| (1e-10) como tolerancia numérica | EXISTENTE; comparación numérica específica de PR #12 |
| (0.05) como margen práctico AT-003 | PRE-REGISTRADO en AT-003 v0.2; no justifica margen conductual |
| (1e-6) como margen conductual general | RECHAZADO por evidencia de PR #13 |
| (1e-8) | PENDIENTE; no aceptado |
| (1e-10) como margen conductual | PENDIENTE; no aceptado |
| Trayectorias completas / prefijo común y terminación | Criterio primario |
| Métricas agregadas | Criterios secundarios; nunca sustitutos |
| Distribuciones | Diagnóstico exploratorio; sin veto |
| Margen conductual general | NO RESUELTO |

No se propone un nuevo epsilon en v0.2.

## 2. Pregunta 1: semilla 303 en D

Esta es la pregunta metodológica prioritaria antes de proponer otro candidato.

**Hecho observado:** la semilla 303 es la única trayectoria D del estudio que completó 16 ticks observables y, por tanto, la única para la que se calculó (Y_s) en la ventana 1–16. Su guard ocurrió en tick 17. Las otras nueve trayectorias D abortaron antes de completar esa ventana.

**Preguntas que deben responderse con datos:**

1. ¿La amplificación observada en 303 se debe a que sobrevivió más ticks y tuvo mayor ventana de exposición, o hay características de su estado inicial que la hacen especialmente sensible?
2. En las otras nueve semillas D, ¿las diferencias crecen de forma similar antes del aborto, o sus trayectorias tienen una dinámica distinta?
3. ¿En qué tick aparece la primera diferencia y cómo evoluciona por tick el máximo de diferencia puntual en el prefijo común?
4. ¿La semilla 303 es un caso extremo o simplemente la única que permite observar una ventana más larga antes del guard?

**Análisis requerido:**

- Tabla por semilla D con: ticks completados, tick de guard, motivo de aborto, primera diferencia de estado, máximo de diferencia puntual por variable y nivel (`1e-6`, `1e-8`, `1e-10`), y diferencia de (Y_s) cuando la ventana completa exista.
- Serie por tick de las diferencias de activación observada, activación bruta, memoria y pesos para cada variable perturbada, comparando 303 con las otras nueve semillas solo dentro del prefijo común disponible.
- Resumen separado para cada magnitud de perturbación. No mezclar niveles.
- Conclusión explícita sobre qué puede inferirse y qué queda censurado por la terminación anticipada.

**Regla de interpretación:** una trayectoria que aborta antes no demuestra ausencia de amplificación posterior. Los ticks no observados son datos censurados por el guard, no ceros ni evidencia de estabilidad.

Sin este análisis no se propone un nuevo candidato.

## 3. Pregunta 2: márgenes por variable y variante

PR #13 no justifica un único margen común. v0.2 exige evaluar por separado variable perturbada y variante del motor.

| Variable / dimensión | Estado actual | Pregunta pendiente |
|---|---|---|
| Activación observada (ACT) | (1e-6) rechazado como general | ¿Qué niveles cumplen el criterio por trayectoria en O y D? |
| Activación bruta | No perturbada directamente; se midió su diferencia como salida | ¿Qué escala y sensibilidad tiene bajo perturbaciones controladas de otras variables? |
| Memoria (MEM) | (1e-6) rechazado como general | ¿Cómo cambia la amplificación entre O y D? |
| Pesos (WGT) | (1e-6) rechazado como general | ¿Cómo influye la perturbación alternante (+\delta/-\delta) frente a perturbaciones unilaterales? |
| Señal de vecinos | No perturbada directamente | ¿Requiere un estudio específico o se deriva de las variables ya perturbadas? |
| Eventos discretos | Igualdad exacta | ¿Se conserva ocurrencia, tick, nodo y motivo? |

**Detalle de alcance de PR #13:** ACT y MEM se perturbaron positivamente en nodos de índice par; WGT se perturbó con signo alternante en conexiones fuera de la diagonal. La activación bruta se registró como variable de salida para comparar diferencias, pero no recibió una perturbación directa. La señal de vecinos tampoco recibió una perturbación directa independiente. Por tanto, PR #13 no permite declarar márgenes para esas dimensiones no perturbadas directamente.

**Regla v0.2:** no habrá un margen general asumido. Si la evidencia futura lo permite, se informará un margen por variable y variante. Si no lo permite, el resultado será margen no resuelto para esa combinación.

### Eventos estructurales: igualdad exacta

- **Clipping:** misma ocurrencia, tick y nodo.
- **Guard:** misma ocurrencia, tick y motivo.
- **Terminación:** mismo estado de finalización o aborto.

Una diferencia que cambia un evento estructural es una diferencia conductual, aunque la distancia numérica sea pequeña.

## 4. Criterio para evaluar candidatos futuros

Un candidato específico por variable y variante solo podrá aceptarse en una futura versión congelada si satisface todos los niveles aplicables:

### Nivel 1: primario, trayectoria

- Diferencia puntual máxima menor o igual al candidato en el 100% de los puntos del prefijo común comparado.
- Cero claves ausentes o adicionales y correspondencia exacta de semilla, tick, nodo y variable.
- Mismo estado de terminación, tick y motivo de guard.
- Eventos de clipping idénticos en ocurrencia, tick y nodo.

Si una ejecución termina antes, solo se compara el prefijo común observable. No se extrapolan estados posteriores al aborto.

### Nivel 2: secundario, métricas agregadas

Solo se evalúa después del Nivel 1:

- Diferencia absoluta de (Y_s) entre perturbado y baseline (le 0.01) por semilla, para todas las semillas con 16 ticks observables.
- Diferencia en fracción de valores recortados (le 0.01).
- Diferencia en tick del primer clipping igual a cero.

Las semillas sin ventana completa se reportan como no evaluables para (Y_s), nunca se excluyen silenciosamente ni se imputan.

### Nivel 3: diagnóstico

- Reportar distribuciones y su descripción.
- No tienen capacidad de veto en v0.2.
- Si en el futuro se desea un veto, debe pre-registrarse la distribución, la distancia estadística, el umbral y el conjunto de semillas antes de ejecutar el análisis.

Un candidato que falle en una variable o variante se rechaza para esa combinación. No se promedian fallos entre variables, variantes o semillas para obtener una aprobación global.

## 5. Qué no haremos en v0.2

- No bajaremos a (1e-8) por estética de precisión.
- No congelaremos (1e-8) por conveniencia.
- No usaremos el margen práctico (0.05) de AT-003 para justificar un margen conductual.
- No reinterpretaremos PR #12: su conclusión permanece limitada a equivalencia numérica observada dentro de la tolerancia registrada y la configuración ejecutada.
- No modificaremos AT-003 v0.2 desde este documento. Si el análisis afecta su diseño o sus decisiones, se elaborará una enmienda versionada y explícita en AT-003.
- No trataremos abortos anticipados como evidencia de que no hubo amplificación posterior.
- No declararemos márgenes para variables que no fueron perturbadas directamente.

## 6. Checklist para pasar de v0.2 a una versión congelable

- [ ] Análisis de semilla 303 en D y tabla de las diez semillas.
- [ ] Serie de crecimiento de diferencias por tick en el prefijo común, comparando 303 con el resto.
- [ ] Evaluación de (1e-8) y (1e-10) con el criterio de la sección 4, por variable y variante.
- [ ] Definición del alcance para activación bruta y señal de vecinos, que no fueron perturbadas directamente en PR #13.
- [ ] Propuesta de margen por variable / variante, o declaración explícita de que no hay margen justificable.
- [ ] Revisión metodológica y aprobación explícita del investigador.
- [ ] Congelación solo después de revisión, con versión, commit, SHA-256 y registro de aprobación.

---

**Conclusión:** v0.2 rechaza el candidato general (1e-6) con evidencia de PR #13, conserva (1e-8) y (1e-10) como pendientes, y establece el análisis de la semilla 303 y la evaluación por variable/variante como condiciones previas para proponer nuevos márgenes. Este documento no declara equivalencia conductual ni congela un margen.
