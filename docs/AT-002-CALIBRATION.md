# AT-002 | Protocolo de calibración

**Estado:** protocolo propuesto; no ejecutado  
**Predecesor conservado:** AT-001-PILOT-01, motor 0.1.0

> La calibración no busca producir sinergia. Busca producir un instrumento capaz de distinguirla si existe.

## 1. Pregunta y alcance

¿Podemos identificar un régimen operativo del motor en el que la respuesta conserve rango dinámico, variabilidad entre semillas y recuperación observable, sin seleccionar parámetros por producir una interacción determinada?

AT-002 es una campaña de calibración, no una prueba de sinergia. No se calculará ni optimizará una interacción factorial como criterio de selección. Los resultados describen el comportamiento del software, no un fenómeno físico.

## 2. Preservación y separación de motores

- **O / Original:** motor 0.1.0 con clipping en [0,1]. Referencia histórica. No modificar.
- **D / Diagnóstico:** contrafactual sin clipping de activación, destinado a cuantificar cuánto ocultaría el límite. Debe implementarse como variante identificada y versionada antes de comparar resultados. No presentar sus valores como salidas de O.
- **S / Suave:** variante con transformación sigmoide, identificada y versionada por separado. Es exploratoria y no sustituye O.

Cada variante registra engineVariant, engineVersion, hash del código y configuración. Nunca combinar observaciones O, D y S como si fueran el mismo instrumento. D y S quedan pendientes de implementación; no se declaran ejecutadas.

## 3. CAL-01 | Diagnóstico de clipping

Comparar O y D con las mismas semillas, estímulos, duración y switches. Registrar por tick la activación previa a cualquier transformación, activación observada y exceso sobre el límite. D debe derivarse del mismo conjunto de ecuaciones salvo por la transformación de activación explícitamente documentada.

Métricas: máximo bruto, máximo observado, cantidad y proporción de valores recortados, exceso acumulado, nodos activos y divergencia entre trayectorias. Si D requiere otros cambios además de retirar el clipping, la comparación queda invalidada o debe declararse como comparación de modelos distintos.

## 4. CAL-02 | Barrido de ganancia

Barrido predefinido de intensidad de entrada: **0.10, 0.20, 0.35, 0.50, 0.75**. Se mantienen fijos los demás parámetros y la estructura del motor O. No modificar simultáneamente umbrales, coeficientes internos o función de activación.

Usar las diez semillas pareadas: 101, 202, 303, 404, 505, 606, 707, 808, 909, 1010. Registrar todos los resultados, incluidos los que saturen o no produzcan respuesta. La intensidad es el único factor manipulado en esta fase.

El motor 0.1.0 limita la intensidad de entrada a [0,1]; por tanto, el barrido propuesto usa valores dentro de ese intervalo. No interpretar valores superiores a 1 como ganancia efectiva en O.

## 5. CAL-03 | Disociación de memoria y plasticidad

No inferir acoplamiento ni independencia a partir de métricas finales similares. Registrar trazas temporales de activación media, memoria media por tick, media y suma de cambios absolutos de pesos por tick, switches efectivos, estímulo y semilla.

Controles mínimos: A sola (memory=true, plasticity=false) y C sola (memory=false, plasticity=true), con B=false. Añadir baseline sin A ni C. La prueba de repetición y la prueba de novedad deben definirse como protocolos distintos y conservar idénticas semillas entre condiciones.

Criterio de lectura: memoria debe poder cambiar sin plasticidad; los pesos deben poder cambiar sin memoria. Esto comprueba rutas computacionales separadas, no demuestra independencia funcional universal.

## 6. CAL-04 | Recuperación y rango dinámico

Guardar la curva completa por tick, separando pulso y recuperación. Informar pico, residual, tiempo hasta cruzar el 50% del pico (si cruza), pendiente de recuperación, fracción de nodos activos, fracción de valores en suelo/techo y dispersión entre semillas. Si el 50% no se alcanza durante la ventana, registrar not_reached, no imputar un tiempo.

## 7. GATE-01 | Criterio operativo pre-registrado

Estos umbrales son reglas operativas iniciales para decidir si AT-001-R2 puede ejecutarse con O. No son leyes universales ni criterios de significación estadística.

- Pico medio entre 0.40 y 0.80 en al menos 6 de las 8 condiciones.
- Fracción activa entre 0.30 y 0.85 en las condiciones evaluadas; no todas pueden colapsar al mismo valor.
- Al menos una condición con pico medio inferior a 0.40.
- Ninguna condición con pico medio igual a 1.00.
- Desviación estándar entre semillas del pico superior a 0.02 en al menos 4 condiciones.
- Descenso desde pico hasta residual de al menos 20% en al menos 4 condiciones.

**Regla:** pasa únicamente si se satisfacen todos los criterios. Si falla uno, GATE-01 = BLOCKED y se regresa a CAL-02 o se revisa el diseño en una nueva versión. No cambiar umbrales después de observar los datos. La fracción activa debe especificar umbral y momento de medición. Inspeccionar distribuciones por semilla, no solo promedios.

## 8. Secuencia y artefactos

| Etapa | Entregable |
|---|---|
| CAL-01 | Comparación O/D, diagnóstico de clipping y trazas |
| CAL-02 | Matriz de cinco ganancias, datos por semilla y curvas |
| CAL-03 | Trazas internas A/C y pruebas de disociación |
| CAL-04 | Curvas completas y métricas de recuperación |
| GATE-01 | Informe de criterios, evidencia y decisión |
| AT-001-R2 | Nuevo factorial 2³ solo si GATE-01 pasa |

Cada ejecución debe producir configuración serializada, semilla, variante/versión del motor, hash de código, timestamp, entorno, datos por tick, métricas agregadas y errores. No sobrescribir artefactos anteriores.

## 9. Limitaciones explícitas

- La salida es una consecuencia del modelo computacional implementado.
- La separación de variables internas no prueba independencia causal universal.
- La ausencia de saturación no demuestra por sí sola que exista resolución suficiente.
- Superar GATE-01 habilita una campaña factorial; no anticipa ni garantiza sinergia.
- AT-001-PILOT-01 permanece como evidencia histórica y no se recalcula retroactivamente.

## 10. Motores versionados y límites de comparación

- **O (`0.1.0`)** es un adaptador al motor histórico `src/core/engine.ts`. No modifica sus ecuaciones ni su clipping.
- **D (`0.2.0-D`)** usa las mismas ecuaciones, pero deja sin clipping la activación de nodo. Conserva los límites históricos de entrada, memoria y pesos. Incorpora un guard fail-fast de overflow absoluto en `1,000,000`; no recorta ni sustituye el valor. Si se dispara, la ejecución se marca como error.
- **S (`0.2.0-S`)** aplica la logística `1/(1+exp(-x))` a la activación bruta. Es un modelo no lineal distinto desde valores bajos; no se espera que coincida con O antes del techo y no debe usarse para estimar la pérdida por clipping.

La comparación de equivalencia pre-techo corresponde a O frente a D, bajo estados y entradas que no alcancen el clipping. La divergencia posterior al techo comprueba que D retiene valores que O recorta. S se contrasta como modelo alternativo, no como contrafactual de clipping. No es matemáticamente correcto exigir que una sigmoide logística ordinaria sea idéntica a la identidad antes del techo.

Los módulos versionados conservan la misma inicialización PRNG y las mismas ecuaciones de acoplamiento, memoria y plasticidad. Cualquier cambio adicional invalida la atribución de diferencias exclusivamente a la función de activación.

## 11. Runner en modo plan

`runner.ts` construye el plan de trabajos a partir de `configuration.json`; no ejecuta simulaciones ni escribe resultados. Rechaza semillas duplicadas, niveles de entrada fuera de [0,1] y políticas de artefactos que permitan mezclar motores o sobrescribir datos. Cada job lleva etapa, variante, semilla, condición, switches, intensidad y perfil de estímulo explícitos.

La partición obligatoria de artefactos es `artifacts/AT-002-CALIBRATION/<ENGINE>/<STAGE>/<RUN_ID>/`. Cada manifiesto futuro deberá incluir `engineVariant`, `engineVersion`, hash de fuente/configuración, semilla y etapa. Un artefacto solo puede contener una variante de motor y una etapa. Los archivos de O, D y S nunca se agregan en un mismo JSONL, CSV o análisis.

**No se ha ejecutado CAL-01, CAL-02, CAL-03 ni CAL-04.** El runner actual solo genera el plan; el adaptador de ejecución y el escritor de artefactos son tareas posteriores. El plan puede inspeccionarse con `npm run at002:plan`; el comando imprime JSON en stdout y no crea artefactos experimentales.

## 12. Pruebas unitarias y evidencia experimental

> Una prueba unitaria demuestra que una función cumple una propiedad especificada. Una campaña demuestra qué ocurrió al ejecutar el sistema bajo condiciones experimentales. No son intercambiables.

Las pruebas del runner verifican la expansión del plan y sus barreras de aislamiento. No constituyen calibración, no producen resultados experimentales y no habilitan por sí solas GATE-01.
