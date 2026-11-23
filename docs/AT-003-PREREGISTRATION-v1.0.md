# AT-003 | PRE-REGISTRATION v1.0
## Causalidad e interacción factorial

**Estado:** `AT003_PREREGISTRATION_v1.0_FROZEN_PENDING_INDEPENDENT_REVIEW_NOT_IMPLEMENTED_NOT_EXECUTED`  
**Antecedente:** AT-002 CAL-02, Run `45184129343`, `CAL02-20261123-01`, commit `3002ba013a33fa7919fdb46c6cdc2aaf7aed87cb`.  
**Motor:** O / 0.1.0, inmutable. AT-002 y sus artefactos no se modifican.

**Alcance de congelación:** hipótesis, variable primaria, contrastes, margen práctico, protocolo de calibración, regla de selección de intensidad, algoritmo de tamaño muestral, inferencia y límites de interpretación. La intensidad y el tamaño final se derivarán mediante las reglas aquí fijadas y se registrarán en un manifiesto con SHA-256 antes de cualquier campaña confirmatoria.

> No intentamos demostrar que ATANOR tiene algo extraordinario. Construimos un experimento que pueda decirnos, incluso de forma incómoda, que nuestra hipótesis estaba equivocada.

## 1. Pregunta y alcance

¿La combinación de memoria (A), resonancia (B) y plasticidad (C) produce cambios de activación que no se explican por sus efectos individuales y sus interacciones factoriales?

AT-003 estudia causalidad computacional e interacciones mediante intervenciones sobre switches. Los resultados describen el software bajo este protocolo. No establecen equivalencia biológica/física, inteligencia, conciencia ni emergencia.

Reglas: `MODEL ≠ EVIDENCE`; una combinación inesperada no demuestra emergencia; una interacción positiva no demuestra por sí sola causalidad; una correlación entre mecanismos no demuestra sinergia.

## 2. Hipótesis confirmatorias

**H-AT003-C1 | Plasticidad en contexto A.** Con A activada y B desactivada, C activada produce mayor activación media temporal que C desactivada:

\[
D_{C|A,\neg B}=Y_{AC}-Y_A>0
\]

Esta es la comparación causal primaria para C. `C_ONLY − BASELINE`, `BC − B_ONLY` y `ABC − AB` son efectos simples secundarios predefinidos.

**H-AT003-C2 | Memoria en condición basal.** A cambia la activación media temporal frente al baseline:

\[
D_A=Y_A-Y_0\ne0
\]

Hipótesis no direccional.

**H-AT003-S1 | Interacción AC.**

\[
I_{AC}=Y_{AC}-Y_A-Y_C+Y_0>0
\]

**H-AT003-S2 | Interacción de tercer orden ABC.**

\[
I_{ABC}=Y_{ABC}-Y_{AB}-Y_{AC}-Y_{BC}+Y_A+Y_B+Y_C-Y_0\ne0
\]

C1 y S1 son direccionales positivas; C2 y S2 son no direccionales. Emergencia no es confirmatoria en AT-003. Cualquier patrón macroscópico será exploratorio y podrá motivar AT-004.

## 3. Diseño factorial 2³

| Condición | A memoria | B resonancia | C plasticidad |
|---|---:|---:|---:|
| BASELINE | 0 | 0 | 0 |
| A_ONLY | 1 | 0 | 0 |
| B_ONLY | 0 | 1 | 0 |
| C_ONLY | 0 | 0 | 1 |
| AB | 1 | 1 | 0 |
| AC | 1 | 0 | 1 |
| BC | 0 | 1 | 1 |
| ABC | 1 | 1 | 1 |

Semillas pareadas en las ocho condiciones. Para una misma semilla se mantienen idénticos estado inicial, pesos iniciales, frecuencias preferidas, estímulo, parámetros base y duración. Solo cambian A/B/C.

Parámetros fijos: O / 0.1.0; 24 nodos; configuración base AT-001; frecuencia objetivo 0.5; pulso 18 ticks; recuperación 24 ticks. Intensidad elegida solo por la regla de calibración de la sección 6. No se modifican coeficientes, fórmula de activación, clipping, nodos ni ventana primaria.

## 4. Variable primaria y margen de equivalencia

**Variable primaria única:** para cada semilla \(s\) y condición \(c\), activación media temporal observada en ticks 1–16:

\[
Y_{s,c}=\frac{1}{16\cdot24}\sum_{t=1}^{16}\sum_{i=1}^{24}a_{s,c,i,t}
\]

\(a\) es la activación observada tras el comportamiento normal de O, incluido el clipping histórico. No se incluye el estado inicial tick 0. \(Y\in[0,1]\). Contrastes por semilla; nodos y ticks no son réplicas estadísticas independientes.

**Margen práctico congelado:**

\[
\Delta=0.05
\]

Un efecto absoluto menor que 0.05 en \(Y\) se considera demasiado pequeño para ser relevante a efectos prácticos de este protocolo: cinco puntos porcentuales de activación media. Es una decisión operacional, no una constante natural ni una propiedad biológica.

- Equivalencia: intervalo ajustado completamente dentro de [-0.05, +0.05].
- Efecto positivo de interés: límite inferior del intervalo ajustado > +0.05.
- Efecto negativo de interés: límite superior < -0.05.
- En los demás casos: inconcluso respecto al umbral práctico.

No significativo no equivale a ausencia de efecto. Solo se afirma equivalencia si se cumple el criterio anterior.

**Métricas secundarias mecanicistas:** activación bruta pre-clipping; fracción de valores recortados; ocupación del techo; desviación estándar e IQR de activación; memoria media; media/desviación de pesos; cambio absoluto medio de pesos; señal media de vecinos; tick de primer clipping. No sustituyen a \(Y\) para decisiones confirmatorias.

## 5. Contrastes

Para cada semilla, sean \(Y_0,Y_A,Y_B,Y_C,Y_{AB},Y_{AC},Y_{BC},Y_{ABC}\) los resultados por condición.

Efectos principales factoriales:

\[
E_A=\frac{(Y_A-Y_0)+(Y_{AB}-Y_B)+(Y_{AC}-Y_C)+(Y_{ABC}-Y_{BC})}{4}
\]
\[
E_B=\frac{(Y_B-Y_0)+(Y_{AB}-Y_A)+(Y_{BC}-Y_C)+(Y_{ABC}-Y_{AC})}{4}
\]
\[
E_C=\frac{(Y_C-Y_0)+(Y_{AC}-Y_A)+(Y_{BC}-Y_B)+(Y_{ABC}-Y_{AB})}{4}
\]

Interacciones de segundo orden:

\[
I_{AB}=Y_{AB}-Y_A-Y_B+Y_0
\]
\[
I_{AC}=Y_{AC}-Y_A-Y_C+Y_0
\]
\[
I_{BC}=Y_{BC}-Y_B-Y_C+Y_0
\]

Interacción de tercer orden:

\[
I_{ABC}=Y_{ABC}-Y_{AB}-Y_{AC}-Y_{BC}+Y_A+Y_B+Y_C-Y_0
\]

Los efectos principales promedian los efectos simples sobre los niveles de los otros factores. Cada contraste se calcula por semilla y después se resume entre semillas.

La familia confirmatoria de siete contrastes es: C1 (`AC − A_ONLY`), C2 (`A_ONLY − BASELINE`), S1 (`I_AC`), S2 (`I_ABC`) y `E_A`, `E_B`, `E_C`. Los efectos simples secundarios de C no sustituyen ni amplían esta familia.

## 6. Calibración independiente y selección de intensidad

La calibración no prueba C1/C2/S1/S2 y no declara sinergia.

### 6.1 Evidencia previa de CAL-02

\(Y\) recalculada desde trazas CAL-02 en ticks 1–16 para ABC:

| Intensidad | Media de Y | SD entre semillas |
|---:|---:|---:|
| 0.10 | 0.1942 | 0.0328 |
| 0.20 | 0.4368 | 0.0545 |
| 0.35 | 0.6182 | 0.0416 |
| 0.50 | 0.7073 | 0.0343 |
| 0.75 | 0.7856 | 0.0276 |

A intensidad 0.10 no hubo clipping en ticks 1–16 en las diez semillas CAL-02. CAL-02 solo ejecutó ABC. Su SD marginal no estima la SD de diferencias pareadas entre condiciones factoriales y no se usará como si lo hiciera para calcular el tamaño confirmatorio.

### 6.2 Diseño de calibración

- O / 0.1.0, 24 nodos, configuración base y protocolo temporal de la sección 3.
- Ocho condiciones factoriales.
- Semillas fijas `2001` a `2020` inclusive.
- Intensidades candidatas fijas: `0.025, 0.050, 0.075, 0.100, 0.125, 0.150, 0.200`.
- 20 semillas por condición e intensidad.
- Ticks 1–16: resolución primaria. Ticks 17–42: diagnóstico de saturación/recuperación.
- Las semillas de calibración no se reutilizan en confirmación ni se reutilizan semillas CAL-02 (`101` a `1010`).

### 6.3 Elegibilidad por intensidad

Una intensidad es elegible solo si **cada una de sus 160 corridas** (8 condiciones × 20 semillas) satisface durante ticks 1–16:

1. Cero valores brutos fuera de [0,1].
2. Ocupación del techo observada (valor exactamente 1.0) ≤5% de los 384 valores nodo-tick.
3. Desviación estándar de los 384 valores observados >0.
4. Al menos tres valores observados distintos.

Todas las corridas deben además pasar validez técnica: trazas completas, identidad de motor/dependencias, paridad de instrumentación y checksums correctos.

### 6.4 Regla exacta de selección

Evaluar las siete intensidades en orden ascendente. Descartar una intensidad si incumple cualquiera de los cuatro criterios en una o más corridas. Entre las elegibles, seleccionar la **mayor intensidad numérica**. No se usan la magnitud de \(Y\), efectos factoriales, signos de interacciones ni resultados de hipótesis para seleccionar.

Si ninguna es elegible: `CALIBRATION_BLOCKED_NO_ELIGIBLE_INTENSITY`. No ampliar el rango, cambiar ventana ni relajar umbrales. Cualquier nuevo rango o criterio requiere enmienda versionada antes de otra calibración.

La regla conserva el mayor estímulo que mantiene resolución en todas las condiciones; no maximiza un resultado favorable. Se publican todos los niveles y motivos de rechazo.

### 6.5 Manifiesto de cierre de calibración

Antes de confirmación se publica manifiesto con RUN_ID, commit, SHA-256 de configuración, identidad/hashes de motor y dependencias, semillas, niveles candidatos, elegibilidad por corrida, intensidad seleccionada o estado BLOCKED, y checksums de artefactos. El manifiesto y su SHA-256 se registran antes de ejecutar confirmación. La intensidad no puede cambiarse después de observar resultados confirmatorios.

## 7. Tamaño muestral confirmatorio

No se fija diez semillas por costumbre ni se usa la SD marginal de CAL-02. Se calcula usando las diferencias pareadas de los siete contrastes en la calibración factorial independiente, después de seleccionar intensidad.

Para cada contraste \(j\), calcular la SD \(s_j\) de sus 20 diferencias pareadas de calibración. Límite superior unilateral del 95% para la SD, bajo supuesto de diferencias aproximadamente normales:

\[
\sigma_{U,j}=s_j\sqrt{\frac{n_{cal}-1}{\chi^2_{0.05,n_{cal}-1}}}
\]

con \(n_{cal}=20\). Definir \(\sigma_U=\max_j\sigma_{U,j}\). Si alguna diferencia no puede calcularse para todas las semillas o la calibración falla técnicamente, no se calcula el tamaño y la campaña queda bloqueada.

Potencia objetivo 90%, \(\Delta=0.05\), planificación conservadora Bonferroni para siete contrastes. \(n_{precision}\) es el menor entero \(n\ge20\) que cumple:

\[
t_{1-0.05/(2\cdot7),n-1}\frac{\sigma_U}{\sqrt n}\le\frac{\Delta}{2}
\]

Tamaño por potencia:

\[
n_{power}=\left\lceil
\left(\frac{[z_{1-0.05/(2\cdot7)}+z_{0.90}]\sigma_U}{\Delta}\right)^2
\right\rceil
\]

Tamaño confirmatorio:

\[
n_{confirmatory}=\max(20,n_{precision},n_{power})
\]

Redondear hacia arriba. No reducir por conveniencia ni aumentar después de inspeccionar resultados confirmatorios. Si no puede calcularse o no puede ejecutarse, `SAMPLE_SIZE_BLOCKED`; cualquier cambio requiere enmienda previa.

Semillas confirmatorias consecutivas desde `5001` hasta `5000 + n_confirmatory`. No reutilizar semillas de CAL-02 ni calibración. La lista completa se registra antes de ejecutar.

## 8. Inferencia y multiplicidad

- Unidad: una diferencia pareada por semilla y contraste.
- Reportar estimación, IC, distribución completa de efectos por semilla, mediana, SD y proporción de signos concordantes.
- Reportar IC ordinarios del 95% e intervalos simultáneos de decisión con control familiar del 95% mediante Bonferroni para siete contrastes.
- Aplicar Holm para control familiar del error tipo I al 5% en la familia de siete contrastes. C1/S1 direccionales positivas; C2/S2 y efectos principales no direccionales.
- Equivalencia mediante TOST y corrección Holm sobre la familia de siete.
- Publicar valores ajustados y no ajustados, sin presentar los no ajustados como evidencia independiente.
- Nodos, ticks e intensidades de calibración no son réplicas confirmatorias.

No se impondrá retrospectivamente un porcentaje de semillas concordantes para rescatar o rechazar una hipótesis; se publicará la distribución completa. La interpretación práctica exige que el intervalo ajustado supere el umbral ±0.05 según la regla de la sección 4.

## 9. Saturación y validez

**Validez técnica:** ejecución completa, registros íntegros, identidad y hashes verificados, instrumentación consistente. Un error técnico se conserva y puede re-ejecutarse con la misma semilla dejando registro; nunca se borra la corrida original.

**Resolución:** clipping dentro de ticks 1–16 se marca `PRIMARY_WINDOW_CLIPPING`. La corrida se conserva y permanece en el análisis primario si es técnicamente válida. No se excluye automáticamente: la saturación puede depender de la condición y excluirla puede sesgar contrastes.

El análisis primario incluye todas las corridas técnicamente válidas y reporta clipping, techo y distribuciones por condición/semilla. Análisis de sensibilidad repite contrastes solo con corridas sin clipping, claramente identificado como condicionado por resolución y nunca como sustituto del análisis primario. Si cambia signo, magnitud o conclusión, se informa. No se imputan valores brutos como si fueran observados.

## 10. Emergencia y exploración

Persistencia de estructuras colectivas tras retirar estímulo queda como candidata para AT-004. En AT-003 pueden describirse patrones, coordinación, transiciones y persistencia, pero no se declarará emergencia confirmada.

Una futura prueba debe definir una propiedad macroscópica única, algoritmo de medición, modelo nulo composicional, criterio de rechazo y replicación cruzada independiente. Persistencia de activación no se etiqueta como estructura colectiva sin definición operacional que la distinga de persistencia individual.

## 11. Identidad y auditoría

Cada campaña registra RUN_ID único, commit/rama, motor O / 0.1.0 y Git blob SHA-1 de módulo/dependencias, SHA-256 de configuración/manifiesto/trazas/métricas/checksums, runtime, semillas, intensidad, switches, estímulos, ventana y manifiesto de calibración.

Workflow manual con autorización explícita `YES` y campaign ID obligatorio. CI ejecuta instalación reproducible, auditoría, tests, build y validación del plan antes de cualquier campaña. Merge no ejecuta experimentos. No sobrescribir artefactos.

AT-003 se implementa en archivos/workflows nuevos. No modificar AT-002, AT-001 ni motor O. Todo cambio posterior requiere enmienda versionada, justificación, fecha, autoría y hashes; nunca corrección silenciosa.

## 12. Secuencia

1. Revisión independiente de este pre-registro y sus hashes.
2. Implementar ejecutor de calibración en rama nueva, sin ejecución confirmatoria.
3. Revisar y probar ejecutor; merge no equivale a autorización.
4. Ejecutar calibración manual con semillas 2001–2020 y siete intensidades fijadas.
5. Verificar artefactos y aplicar mecánicamente selección.
6. Calcular tamaño confirmatorio y publicar manifiesto de cierre.
7. Revisar y autorizar explícitamente campaña confirmatoria.
8. Ejecutar factorial 2³ con semillas nuevas.
9. Analizar conforme a secciones 4, 5, 8 y 9.
10. Documentar exploración macroscópica por separado. Prueba confirmatoria de emergencia queda para AT-004.

**Estado operativo al congelar:** protocolo congelado como especificación; ejecutor AT-003 no implementado; calibración no ejecutada; campaña confirmatoria no autorizada ni ejecutada.

## 13. Límites de interpretación

- Diferencias entre switches evidencian contribución causal dentro de la implementación y condiciones probadas, no causalidad universal.
- Interacción positiva es sinergia operacional bajo esta métrica y protocolo, no emergencia.
- Saturación es limitación de resolución del motor, no amplificación ilimitada.
- Resultado no significativo no prueba ausencia de efecto.
- Prueba automatizada verifica código; campaña registra comportamiento bajo condiciones experimentales.
- Ausencia de evidencia no es evidencia de ausencia.
