# Contrato metodológico de equivalencia conductual
## Versión 0.3 | Contrato común para pruebas futuras de margen

**Estado:** `DRAFT_NOT_FROZEN`  
**Naturaleza:** contrato metodológico prospectivo e independiente.  
**Aplicación:** futuras pruebas que evalúen si una perturbación conserva el comportamiento observable de una implementación bajo una tarea y unas condiciones declaradas.  
**No modifica:** AT-003, AT-002 CAL-01, AT-002 CAL-02, PR #12, PR #13, ni los resultados históricos de sensibilidad. No reanaliza ni reclasifica retrospectivamente sus datos.

## 1. Propósito y principio rector

Este documento define qué significará afirmar que dos ejecuciones conservan el mismo comportamiento observable durante un horizonte finito. No define de antemano qué variable del modelo constituye la conducta relevante, ni selecciona un observable porque produzca resultados más favorables.

**El observable primario debe justificarse por la tarea y por el significado conductual que se pretende preservar.** La conveniencia matemática, la estabilidad numérica o la menor divergencia observada no son justificaciones suficientes.

La equivalencia es relativa a:
- una tarea y sus entradas;
- unas condiciones iniciales y ambientales;
- una implementación y su versión;
- un conjunto de observables y eventos;
- un horizonte temporal (T);
- tolerancias y reglas de fallo definidas antes de examinar los resultados;
- una clase y magnitud de perturbación concretas.

Por tanto, no existe en este contrato una equivalencia conductual universal ni un margen universal.

## 2. Dos capas de variables: `Y_t` y `Z_t`

### 2.1 Observables conductuales primarios: `Y_t`

`Y_t` contiene las salidas que representan la conducta relevante para la tarea evaluada. Son las variables sobre las que se decide equivalencia.

Antes de cada campaña, el protocolo específico debe:
1. enumerar cada observable `Y_j`;
2. definir su significado operativo y su relación con la tarea;
3. especificar unidad, dominio, escala y método de captura;
4. justificar por qué es una salida conductual relevante y no solo una variable interna disponible;
5. fijar su tolerancia y regla de comparación;
6. declarar si se compara por nodo, entidad, componente, evento o agregado.

La selección debe hacerse antes de inspeccionar los resultados de la campaña. Si se utiliza un agregado, se debe justificar por qué no oculta diferencias conductualmente relevantes. Cuando corresponda, se conservarán observables desagregados como primarios y los agregados como secundarios.

**ACT no queda designada aquí como observable primario por defecto.** Puede formar parte de `Y_t` si la especificación de la tarea justifica que la activación observada representa una salida conductual relevante. Tampoco se excluye por anticipado.

### 2.2 Variables internas de diagnóstico: `Z_t`

`Z_t` contiene variables útiles para explicar, auditar o caracterizar el mecanismo, pero que no forman parte de la decisión primaria de equivalencia salvo justificación expresa en el protocolo de tarea.

Candidatas como memoria (MEM), pesos (WGT), activación bruta, contribución vecinal u otros estados internos no se clasifican automáticamente como conducta ni automáticamente como diagnóstico. Su clasificación depende de la interfaz observable y de la pregunta experimental.

Las variables `Z_t`:
- se registran cuando sea posible;
- pueden explicar divergencias o fallos;
- no sustituyen a `Y_t` en la decisión primaria;
- no pueden convertirse retrospectivamente en observables primarios porque sus resultados sean más convenientes.

Si una variable inicialmente diagnóstica pasa a ser relevante para otra tarea, debe declararse como `Y_t` en un protocolo nuevo o en una enmienda prospectiva, con justificación y tolerancia propias.

### 2.3 El motor y la validez de ejecución no son observables conductuales por defecto

La identidad del motor, el estado del proceso, el motivo de aborto, el guard y la integridad del artefacto son metadatos o diagnósticos de ejecución. Deben registrarse, pero no deben confundirse con la conducta de `Y_t`.

Un evento de ejecución puede impedir evaluar equivalencia sin demostrar por sí mismo que las conductas divergieron.

## 3. Comparación de observables continuos

Para cada observable continuo `j`, el protocolo debe establecer una tolerancia positiva `tau_j`, con unidad y justificación práctica explícitas.

Para la ejecución baseline `b` y la ejecución perturbada `p`, una distancia normalizada admisible es:

```text
d_j(t) = abs(Y_p,j(t) - Y_b,j(t)) / tau_j
```

La condición numérica de equivalencia para cada observable `j` durante el horizonte `0 <= t <= T` es:

```text
max_{0 <= t <= T} d_j(t) <= 1
```

La condición debe cumplirse para **cada** observable continuo primario. No se permite promediar observables para compensar el incumplimiento de otro.

El protocolo específico debe además declarar:
- si la comparación es absoluta, relativa o mixta;
- cómo se tratan valores cercanos a cero, límites de dominio y unidades heterogéneas;
- si hay transformaciones, normalizaciones o ponderaciones, y por qué son apropiadas;
- precisión de captura y redondeo;
- correspondencia exacta de entidad, nodo, componente y tick;
- tratamiento de valores ausentes, no finitos o no comparables.

No se aceptará una tolerancia solo porque coincida con la resolución de punto flotante o con un umbral ya usado en otro experimento. La tolerancia debe justificarse por la interpretación de la salida y por el propósito de la tarea. Las tolerancias pueden diferir entre observables.

## 4. Eventos categóricos y fallos cualitativos

### 4.1 Eventos categóricos

Para los eventos categóricos relevantes, el protocolo debe definir un vocabulario cerrado o una regla explícita de codificación. La equivalencia exige:
- correspondencia uno a uno entre los eventos de ambas ejecuciones;
- coincidencia exacta de identidad o categoría y de los atributos relevantes;
- conservación exacta del número de eventos y de su orden;
- diferencia temporal no mayor que la tolerancia de evento predefinida;
- ausencia de eventos omitidos, adicionales, sustituidos o reordenados.

La tolerancia temporal de eventos debe expresarse en la unidad temporal de la tarea (por ejemplo, ticks) y justificarse por su significado práctico antes de observar los resultados. No se debe confundir la tolerancia temporal con una tolerancia sobre la identidad del evento: la identidad y la secuencia deben coincidir exactamente, aunque el instante de ocurrencia pueda variar dentro del límite declarado.

Cuando existan eventos repetidos de la misma categoría, el protocolo debe fijar una regla de emparejamiento determinista y preservar el orden. Una opción es emparejar el evento número k de cada categoría en una ejecución con el evento número k de esa categoría en la otra, siempre que la secuencia global también conserve el orden. No se permite escoger retrospectivamente el emparejamiento que minimice las diferencias.

No se permite que una distancia temporal pequeña compense la aparición, desaparición, sustitución o reordenamiento de un evento categórico primario.

### 4.2 Fallos cualitativos

Antes de la ejecución, el protocolo debe enumerar los fallos cualitativos que invalidan la equivalencia para la tarea. Ejemplos posibles, no universales:
- incumplimiento de una restricción funcional;
- pérdida de una salida requerida;
- transición a un estado prohibido;
- violación de una condición de seguridad;
- terminación funcional no prevista;
- pérdida de un evento obligatorio o aparición de uno prohibido.

La lista debe derivarse de la tarea. No se debe inventar ni ampliar después de observar qué ejecución falló. Un fallo cualitativo predefinido implica rechazo de equivalencia para la comparación evaluable.

### 4.3 Ejemplo operativo: emisión de señales

Supóngase que la tarea consiste en emitir una señal al detectar un evento. El protocolo específico define como observable conductual primario la secuencia de señales emitidas y sus tiempos. Las variables internas del detector se registran por separado como diagnóstico, salvo que la tarea justifique incluir alguna de ellas en el conjunto primario.

Para este ejemplo, antes de ejecutar las pruebas se fijan:
- horizonte: 100 ticks;
- tolerancia temporal por señal: máximo 1 tick;
- identidad y orden de las señales: coincidencia exacta;
- número de señales: coincidencia exacta;
- cobertura: ambas ejecuciones deben completar el tick 100.

Dos ejecuciones son equivalentes hasta 100 ticks si existe una correspondencia uno a uno entre todas sus señales, cada señal emparejada conserva identidad y posición en la secuencia, la diferencia absoluta entre sus tiempos de emisión es como máximo 1 tick, no falta ni aparece ninguna señal adicional y ambas ejecuciones completan el horizonte.

La regla temporal se aplica a cada evento emparejado:

```text
Delta_i = abs(t_i_perturbada - t_i_referencia)
ACCEPT temporal si Delta_i <= tau para todo evento i
```

La tolerancia `tau` no se estima a partir de las diferencias observadas entre las ejecuciones. Se justifica desde los requisitos funcionales de la tarea, la resolución del reloj y la incertidumbre del método de detección; después se fija y congela antes de evaluar las perturbaciones. Por ejemplo, `tau = 1 tick` expresa que la tarea considera funcionalmente aceptable una emisión hasta un tick antes o después de la referencia. No existe una fórmula universal para obtener `tau`: la justificación debe documentarse para cada tarea.

Ejemplos con `tau = 1 tick`:

**Caso 1: rechazo por retraso excesivo.** La referencia emite `A → B → C` en los ticks `10, 20, 30`; la perturbada emite la misma secuencia en `10, 22, 30`. Los desfases son `0, 2, 0`. Se conserva identidad, cantidad y orden, pero B excede la tolerancia. Resultado: `REJECT` para esa pareja, únicamente por el retraso de B.

**Caso 2: aceptación en el límite.** La referencia emite `A → B → C` en `10, 20, 30`; la perturbada en `10, 21, 30`. Los desfases son `0, 1, 0`. Si no hay eventos ausentes o adicionales y el orden se conserva, el criterio se cumple: `ACCEPT`.

**Caso 3: aceptación con varios desfases.** La referencia emite `A → B → C → D → E` en `5, 12, 20, 27, 35`; la perturbada emite las mismas señales en `6, 12, 21, 26, 35`. Los desfases absolutos son `1, 0, 1, 1, 0`. Ninguno supera `tau`, y la identidad, cantidad y orden coinciden: `ACCEPT`.

**Caso 4: cuatro eventos, todos en el límite.** La referencia emite `A → B → C → D` en `5, 12, 20, 27`; la perturbada emite las mismas señales en `6, 11, 21, 28`. Los desfases son `1, 1, 1, 1`. Todos cumplen `Delta_i <= tau`; con identidad, cantidad y orden conservados, el resultado es `ACCEPT`.

Estos ejemplos ilustran decisiones para parejas individuales. Un rechazo por exceder la tolerancia significa que esa pareja no conservó la conducta definida para esa tarea y ese criterio. No demuestra por sí solo un fallo general del sistema ni identifica una causa. Si una tolerancia mayor fuera apropiada para la tarea, debe justificarse y fijarse prospectivamente; no puede ampliarse después para convertir un rechazo en aceptación.

Si una ejecución termina antes del tick 100 por guard, no se declara equivalente hasta 100 ticks. Para preservar la distinción entre conducta y observación incompleta, el resultado se registra como `INDETERMINATE/CENSORED` cuando la terminación impide observar el horizonte completo y no existe otra regla de rechazo predefinida que ya se haya violado. El guard y su tick quedan registrados como diagnóstico. Si la tarea define expresamente la terminación anticipada como fallo cualitativo, se registra además ese rechazo por la regla de tarea, sin atribuirlo automáticamente a divergencia de señales no observadas.

### 4.4 Guard y terminación anticipada

Un guard es, ante todo, un mecanismo de control o protección de la ejecución. Si una ejecución termina por guard antes de completar (T):
- la ejecución se marca como `INDETERMINATE/CENSORED` para la equivalencia sobre el horizonte completo;
- se registra el motivo, tick de activación, último tick completo y datos diagnósticos disponibles;
- los ticks no observados se consideran censurados, nunca ceros ni valores imputados;
- no se declara aceptación por coincidir el guard con el baseline;
- tampoco se declara divergencia conductual únicamente porque el guard se activó.

Si el guard constituye además un fallo cualitativo definido por la tarea, esa regla debe estar declarada antes de la campaña. Aun así, se debe distinguir el rechazo por fallo de tarea de la imposibilidad de evaluar la trayectoria completa. El guard no se convierte retroactivamente en un evento conductual.

## 5. Horizonte temporal y cobertura

El protocolo debe fijar (T) antes de ejecutar. Debe especificar:
- unidad temporal y convención de ticks;
- si el tick inicial se incluye;
- entradas y condiciones aplicadas en cada instante;
- ventana de estímulo y ventana de recuperación, si existen;
- regla para ejecuciones incompletas;
- eventos que deben observarse durante el horizonte.

Para declarar equivalencia completa, ambas ejecuciones deben proporcionar observaciones comparables para todos los observables primarios y eventos requeridos hasta (T). Un prefijo común puede analizarse como diagnóstico parcial, pero no demuestra equivalencia hasta (T).

Si falta una observación por censura, error de instrumentación o pérdida de correspondencia, el resultado del horizonte afectado es `INDETERMINATE/CENSORED`, salvo que un criterio de rechazo independiente y predefinido ya se haya satisfecho con evidencia observada.

## 6. Estados de decisión

Cada comparación debe terminar en exactamente uno de estos estados:

| Estado | Regla |
|---|---|
| `ACCEPT` | Todas las salidas continuas primarias cumplen sus tolerancias en todos los instantes hasta (T); todos los eventos categóricos requeridos coinciden exactamente y conservan el orden; no ocurre ningún fallo cualitativo predefinido; la cobertura de observación es completa. |
| `REJECT` | Existe al menos una violación observable y evaluable de tolerancia, un desacuerdo categórico primario o un fallo cualitativo predefinido. Se identifica la regla concreta que falló. |
| `INDETERMINATE/CENSORED` | No puede evaluarse el horizonte completo por guard, terminación anticipada, ausencia de datos o falta de comparabilidad, y no existe ya una violación independiente suficiente para decidir `REJECT`. |

Una ejecución puede tener un estado diagnóstico de terminación como `COMPLETED`, `ABORTED_GUARD` o `ERROR`, pero ese estado no sustituye la clasificación de equivalencia.

La coincidencia de terminación o de tick de guard no implica equivalencia de `Y_t`. La equivalencia de un prefijo no implica equivalencia de la trayectoria completa.

## 7. Definición operacional del margen de perturbación

El margen se define únicamente después de fijar:
- el contrato de observables `Y_t`;
- el horizonte (T);
- las tolerancias y eventos;
- las condiciones iniciales y entradas;
- la variante e identidad del motor;
- la clase de perturbación y su métrica de magnitud;
- la población de casos o semillas a la que se pretende aplicar.

Para una clase de perturbación (P) y una magnitud (delta), se evalúa si la comparación recibe `ACCEPT`, `REJECT` o `INDETERMINATE/CENSORED`.

El **margen operacional observado** es el mayor nivel de perturbación efectivamente probado que satisface el criterio de aceptación bajo una regla de agregación de casos declarada antes de la campaña. Esa regla debe indicar si se exige aceptación en todos los casos, una proporción mínima u otro criterio justificable; los resultados por caso siempre se conservan y reportan. Una tasa de aceptación agregada no convierte los casos rechazados o censurados en aceptados. Debe informarse como resultado condicionado, por ejemplo:

[
`M_obs(P, Y, T, C, V, S)`
]

donde `C` representa las condiciones de ejecución, `V` la variante/versión y `S` el conjunto de casos o semillas.

Reglas:
- No mezclar tipos de perturbación ni métricas de magnitud incompatibles.
- No combinar variables o variantes para producir una aprobación global.
- No contar comparaciones censuradas como aceptadas.
- No llamar “máximo” a un nivel no explorado por encima del mayor nivel probado.
- Si la búsqueda usa una malla discreta, informar el mayor nivel probado que pasó y el siguiente nivel probado que falló; no afirmar que se conoce el umbral exacto.
- No asumir monotonicidad entre magnitud de perturbación y divergencia. Una búsqueda binaria o interpolación solo es válida si la monotonicidad se justifica y se comprueba; de lo contrario, informar el patrón observado en toda la malla.
- Si ningún nivel pasa, el margen queda no establecido para esa combinación.
- Si los niveles relevantes están censurados, el margen queda no resuelto, no aceptado.

Un margen es, por tanto, específico de la tarea, los observables, el horizonte, el tipo de intervención, el motor y las condiciones evaluadas. No es una propiedad universal del sistema.

## 8. Margen operacional y garantía estadística son afirmaciones distintas

El margen operacional describe el resultado de las comparaciones realizadas en un conjunto concreto. Por sí solo no estima la tasa de éxito en casos nuevos.

Cualquier afirmación como “al menos el 99% de las ejecuciones conserva equivalencia” requiere, antes de la campaña:
- definir la población objetivo y la unidad independiente de muestreo;
- justificar el tamaño de muestra y el diseño;
- definir el criterio binario de éxito, incluyendo el tratamiento de censura;
- fijar el nivel de confianza y el método de intervalo;
- reservar un conjunto de validación independiente cuando corresponda;
- informar éxitos, rechazos, censuras y datos excluidos con sus motivos.

No se puede convertir una tasa observada en una garantía poblacional sin incertidumbre cuantificada. Las semillas pareadas, repeticiones técnicas e instancias independientes no son unidades intercambiables. Una repetición técnica idéntica no constituye replicación independiente.

## 9. Registro mínimo reproducible

Cada campaña que use este contrato debe preservar:
- versión y hash del contrato metodológico;
- protocolo de tarea y justificación de `Y_t` y `Z_t`;
- unidades, tolerancias y sus justificaciones;
- horizonte (T), entradas, condiciones y reglas de eventos/fallo;
- definición exacta de cada perturbación y su magnitud;
- código, commit, motor, runtime y dependencias;
- semillas o identificadores de casos y su método de selección;
- trazas baseline y perturbadas;
- cobertura temporal y motivos de censura;
- resultados por observable, instante, caso y perturbación;
- estados de decisión y reglas activadas;
- manifiesto, checksums y artefactos originales.

Los agregados deben poder reconstruirse desde las trazas primarias. Los datos ausentes no deben rellenarse silenciosamente.

## 10. Límites de interpretación y no retroactividad

Este contrato:
- no demuestra emergencia, sinergia, causalidad, inteligencia, conciencia ni equivalencia con sistemas naturales;
- no convierte coincidencia de implementación en equivalencia conductual;
- no convierte similitud de métricas agregadas en equivalencia de trayectoria;
- no autoriza ejecutar campañas;
- no cambia resultados históricos ni protocolos preregistrados;
- no selecciona ACT, MEM, WGT u otra variable como observable universal.

AT-003, CAL-01, CAL-02 y los estudios de sensibilidad anteriores conservan sus definiciones, decisiones y resultados originales. Cualquier aplicación de este contrato será prospectiva y deberá identificar explícitamente la versión utilizada. Una modificación de protocolos previos requeriría una enmienda versionada, justificada y autorizada por separado.

## 11. Checklist de aprobación para una campaña futura

- [ ] Tarea y conducta relevante definidas.
- [ ] `Y_t` seleccionado y justificado antes de observar resultados.
- [ ] `Z_t` separado y clasificado como diagnóstico, salvo justificación explícita.
- [ ] Unidades, escalas y tolerancias por observable justificadas.
- [ ] Eventos categóricos y orden definidos.
- [ ] Fallos cualitativos definidos antes de la ejecución.
- [ ] Horizonte (T), entradas y cobertura fijados.
- [ ] Reglas de guard, terminación y censura especificadas.
- [ ] Clase y magnitud de perturbación definidas por separado.
- [ ] Diseño de casos/semillas y análisis estadístico predefinidos.
- [ ] Instrumentación, trazas, manifiesto y checksums verificados.
- [ ] Autorización explícita de ejecución registrada por separado.

---

**Conclusión:** este documento define un lenguaje común para decidir qué significa conservar el comportamiento observable y cómo evaluar un margen de perturbación condicionado. No elige por anticipado los observables de una tarea, no fija un margen numérico y no declara equivalencia para ninguna campaña histórica o futura.
