# Criptocromo ↔ NetLogo | Protocolo de equivalencia interplataforma v0.1

**Estado:** BORRADOR METODOLÓGICO · PENDIENTE DE REVISIÓN INDEPENDIENTE  
**Tipo:** especificación de reproducción y contraste de implementación  
**Antecedente:** AT-002 CAL-01, campaña `CAL01-20261123-01`  
**Motor de referencia:** Criptocromo O / 0.1.0 y D / 0.2.0-D  
**Plataforma de contraste propuesta:** NetLogo + BehaviorSpace  
**Ejecución autorizada:** NO  
**Implementación NetLogo:** NO INICIADA  
**Campaña interplataforma:** NO EJECUTADA

> Este protocolo compara implementaciones de un modelo computacional. No compara la calidad general de dos plataformas y no presupone que una implementación sea correcta por ser la referencia.

## 1. Pregunta y alcance

¿Pueden Criptocromo y NetLogo ejecutar la misma especificación matemática, con estados iniciales y entradas idénticos, y producir trazas equivalentes dentro de una tolerancia numérica definida antes de la comparación?

La evaluación separa dos preguntas que no deben mezclarse:

1. **Equivalencia de implementación:** ambos motores reciben el mismo estado inicial explícito y la misma secuencia de estímulos. Se compara cada transición y cada variable de estado.
2. **Comportamiento estadístico bajo RNG propio:** cada plataforma genera sus propias condiciones iniciales con su generador aleatorio nativo. Se comparan distribuciones y sensibilidad, no secuencias semilla a semilla.

Una semilla numéricamente idéntica no implica una secuencia aleatoria idéntica entre JavaScript/V8 y NetLogo. Por ello, la semilla no sustituye al archivo de estado inicial compartido en la fase 1.

Este documento no modifica AT-002, AT-003 ni sus artefactos históricos. No autoriza ejecutar CAL-01 otra vez, despachar workflows, ni iniciar una campaña nueva.

## 2. Identidad de la referencia

La referencia computacional se identifica por los archivos y versiones siguientes, según el repositorio consultado para redactar este protocolo:

| Componente | Identidad |
|---|---|
| Motor O | `src/experiments/at002-calibration/engines/engine-v0.1.0-O.ts`, versión 0.1.0 |
| Núcleo O | `src/core/engine.ts` |
| Tipos | `src/core/types.ts` |
| Configuración base | `src/experiments/at001/config.ts` |
| Motor D | `src/experiments/at002-calibration/engines/engine-v0.2.0-D.ts`, versión 0.2.0-D |
| Kernel compartido D | `src/experiments/at002-calibration/engines/variant-engine.ts` |
| Protocolo de campaña | `experiments/AT-002-CALIBRATION/configuration.json` |
| Resultados históricos | `docs/AT-002-CAL-01-RESULTS.md` |

La revisión de esta tabla debe comprobarse contra el commit exacto utilizado para construir los vectores de prueba. Los hashes Git blob SHA-1 existentes identifican objetos del repositorio; no son hashes criptográficos de los artefactos de una nueva campaña. Cada nuevo archivo de entrada y salida deberá tener SHA-256.

## 3. Especificación matemática compartida

### 3.1 Estado

Para cada nodo (i), el estado en el tick (t) contiene:

- frecuencia preferida (p_i);
- activación observada (a_i(t));
- memoria (m_i(t)).

La red contiene una matriz dirigida de pesos (w_{ij}(t)). La diagonal se inicializa en cero y permanece en cero.

La configuración de referencia tiene 24 nodos y estos parámetros:

| Parámetro | Valor |
|---|---:|
| `nodeCount` | 24 |
| `lambda` | 0.86 |
| `alpha` | 0.72 |
| `beta` | 0.42 |
| `gamma` | 0.18 |
| `eta` | 0.24 |
| `plasticityRate` | 0.035 |
| `decayRate` | 0.008 |
| `resonanceWidth` | 18 |
| Frecuencia objetivo | 0.5 |

Los switches A/B/C corresponden respectivamente a memoria, resonancia y plasticidad. CAL-01 utilizó A=true, B=true y C=true en O y D.

### 3.2 Entrada y resonancia

La intensidad efectiva de entrada es:

[
u(t)=\operatorname{clamp}(I(t),0,1)
]

La resonancia del nodo (i) es:

[
R_i(t)=
\begin{cases}
\exp[-\rho(f(t)-p_i)^2], & B=1 \\
1, & B=0
\end{cases}
]

donde (ho=18) y (f(t)) es la frecuencia del estímulo.

La señal de vecinos se calcula usando exclusivamente el estado anterior:

[
N_i(t)=\sum_{j=1}^{24} w_{ij}(t)a_j(t)
]

El orden de suma de referencia es (j=1,2,\ldots,24). No se permite actualización in-place de nodos durante este cálculo.

### 3.3 Activación bruta

La activación bruta previa a la política de salida es:

[
r_i(t+1)=
\alpha a_i(t)+
\beta R_i(t)u(t)+
\gamma N_i(t)+
\eta M_i(t)
]

donde:

[
M_i(t)=
\begin{cases}
m_i(t), & A=1 \\
0, & A=0
\end{cases}
]

La activación observada depende de la variante:

**O / 0.1.0, clipping histórico**

[
a_i(t+1)=\operatorname{clamp}(r_i(t+1),0,1)
]

**D / 0.2.0-D, identidad con guard**

[
a_i(t+1)=r_i(t+1)
]

si (r_i(t+1)) es finito y (|r_i(t+1)|\leq 1{,}000{,}000). Si cualquier nodo viola la condición, el tick se marca `ABORTED_GUARD`. No existe estado observado válido para ese tick ni se generan ticks posteriores de esa trayectoria.

D no es una variante “más verdadera” de O. Es un diagnóstico contrafactual que elimina el clipping y conserva un límite de seguridad.

### 3.4 Memoria

La memoria nueva se calcula con la activación anterior, no con la recién calculada:

[
m_i(t+1)=
\begin{cases}
\operatorname{clamp}(\lambda m_i(t)+(1-\lambda)a_i(t),0,1), & A=1 \\
0, & A=0
\end{cases}
]

### 3.5 Plasticidad

Los pesos nuevos se calculan después de obtener todas las activaciones nuevas:

[
w_{ij}(t+1)=
\begin{cases}
0, & i=j \\
w_{ij}(t), & i\ne j\land C=0 \\
\operatorname{clamp}(w_{ij}(t)+\eta_p a_i(t+1)a_j(t+1)-\delta w_{ij}(t),0,1), & i\ne j\land C=1
\end{cases}
]

con (eta_p=0.035) y (delta=0.008).

La matriz de pesos es dirigida: no se debe imponer simetría (w_{ij}=w_{ji}). La plasticidad utiliza las activaciones nuevas; la señal de vecinos utiliza los pesos y activaciones del estado anterior.

### 3.6 Actualización atómica

Un tick debe ejecutarse como transición sincrónica:

1. Leer una copia inmutable del estado (S_t).
2. Calcular (u(t)), (R_i(t)), (N_i(t)) y (r_i(t+1)) para todos los nodos.
3. Aplicar política O o D para obtener las activaciones nuevas.
4. Calcular las memorias nuevas usando (S_t).
5. Calcular todos los pesos nuevos usando las activaciones nuevas y los pesos de (S_t).
6. Publicar el estado completo (S_{t+1}) y avanzar un tick.

No se permite que un nodo actualizado influya en el cálculo de otro nodo dentro del mismo tick.

## 4. Construcción de estados iniciales compartidos

La fase de equivalencia no debe depender de que ambos entornos compartan el mismo RNG. Se generará un conjunto de estados iniciales canónicos desde la implementación Criptocromo de referencia y se exportará explícitamente.

Para cada estado:

- 24 valores (p_i), en orden de ID;
- 24 activaciones iniciales, todas 0;
- 24 memorias iniciales, todas 0;
- matriz 24×24 de pesos iniciales;
- diagonal de pesos igual a 0;
- tick inicial igual a 0;
- semilla y commit de referencia que generaron el estado;
- SHA-256 del archivo serializado.

La generación de referencia actual usa el generador congruencial lineal:

[
x_{n+1}=(1664525x_n+1013904223)\bmod 2^{32}
]

[
q_n=x_n/2^{32}
]

con estado inicial (x_0=\text{seed}\bmod 2^{32}). Se consumen primero 24 valores para (p_i), después 24×24 valores en orden de fila y columna para los pesos; la diagonal se fuerza a cero y los pesos fuera de diagonal son (0.12q_n).

El archivo compartido de estados iniciales, y no la semilla aislada, será la entrada de autoridad para la fase 1. El archivo deberá registrar el orden de nodos, orden de filas/columnas, precisión decimal suficiente para round-trip IEEE-754 y su SHA-256. No se redondearán valores para facilitar la importación.

## 5. Secuencia CAL-01 de referencia

La reproducción de protocolo utiliza las diez semillas históricas como etiquetas para seleccionar estados iniciales canónicos:

`101, 202, 303, 404, 505, 606, 707, 808, 909, 1010`.

Para cada estado inicial, se ejecutan dos variantes independientes, O y D:

- 24 nodos;
- A=true, B=true, C=true;
- frecuencia del estímulo = 0.5;
- intensidad = 1.0 en ticks 1–18;
- intensidad = 0.0 en ticks 19–42;
- frecuencia objetivo permanece en 0.5 durante recuperación;
- 42 ticks planeados por variante y estado inicial;
- O aplica clipping [0,1];
- D aplica identidad y guard absoluto 1,000,000.

El total planeado es 10 estados × 2 variantes × 42 ticks = 840 transiciones. Un aborto D reduce las transiciones completadas de esa trayectoria; el tick que dispara el guard se registra como evento de aborto y no como estado posterior válido.

**Importante:** esto será una reproducción interplataforma nueva con instrumentación ampliada. No debe describirse como descarga, recálculo o modificación de los artefactos históricos CAL-01.

## 6. Fase 1: equivalencia de implementación con entradas compartidas

### 6.1 Propósito

Aislar diferencias de implementación. Ambos motores reciben exactamente el mismo estado inicial explícito y la misma lista de estímulos. El RNG nativo de NetLogo no interviene en esta fase.

### 6.2 Instrumentación obligatoria

Por tick, nodo y variante, conservar:

- activación bruta (r_i);
- activación observada (a_i), o null si el guard aborta;
- memoria (m_i);
- estado del guard;
- política de activación aplicada;
- estímulo y switches;
- señal de vecinos (N_i);
- resonancia (R_i).

Por tick y transición, conservar además:

- matriz de pesos completa, o un archivo binario/JSON separado inequívocamente indexado por tick;
- delta absoluto de cada peso;
- contador de transiciones completadas;
- primer tick de divergencia por variable y nodo.

La traza histórica CAL-01 conserva activaciones brutas y observadas, pero no establece una trayectoria completa de pesos y memoria por tick. No se afirmará que esos estados internos existen en los artefactos históricos. La instrumentación ampliada pertenece a la nueva reproducción.

### 6.3 Criterio numérico provisional

Antes de la campaña, ejecutar vectores unitarios de una transición y comparar el resultado de cada ecuación. La tolerancia propuesta para comparar valores flotantes entre plataformas es:

[
|x_{NetLogo}-x_{Criptocromo}|\leq 10^{-10}
]

Esta tolerancia es provisional hasta que una revisión independiente confirme que es adecuada para las operaciones y runtimes fijados. Debe congelarse antes de ejecutar las 10 trayectorias completas. No se cambiará después de observar discrepancias de campaña.

La comparación también reportará error absoluto máximo, error absoluto medio, error relativo cuando esté definido y el primer índice de divergencia. Estados discretos (tick, IDs, fase, switches, estado de guard, presencia/null) deben coincidir exactamente.

### 6.4 Interpretación

- Si las trazas coinciden dentro de tolerancia, se informa equivalencia observada para los vectores, condiciones, variantes y versiones probadas.
- Si divergen, se identifica el primer tick, nodo y variable que difieren; no se compensa la diferencia ajustando parámetros.
- Una coincidencia final de métricas agregadas no sustituye la comparación de trayectorias.
- Si D aborta, solo se comparan estados válidos hasta el tick del aborto. No se extrapola ni se comparan ticks posteriores inexistentes.

## 7. Fase 2: experimentos con RNG nativo

Solo después de cerrar la fase 1 se realizará una comparación estadística independiente.

Cada motor generará estados iniciales usando su RNG nativo, registrando:

- nombre y versión del RNG;
- versión exacta de NetLogo y runtime Java;
- semilla;
- algoritmo de inicialización;
- archivo de estado inicial generado y SHA-256;
- parámetros, switches y estímulos;
- versión y hash del modelo ejecutable.

No se emparejarán observaciones porque las semillas tengan el mismo entero. Las comparaciones serán entre distribuciones de resultados y deberán definir previamente tamaño de muestra, métricas, intervalos, pruebas y criterios de equivalencia estadística. La fase 2 no puede usarse para excusar un fallo de equivalencia de implementación en la fase 1.

## 8. Diseño de artefactos y procedencia

Cada ejecución debe producir un paquete independiente que contenga:

- `manifest.json`: protocolo, ID, commit, versiones, runtime, RNG, configuración, switches, semillas, política O/D, guard, tolerancia y timestamps;
- `initial-states.json`: estados iniciales canónicos o referencia inequívoca al archivo;
- `stimuli.json`: secuencia completa de estímulos;
- `traces.jsonl`: trazas por tick/nodo;
- `weights.jsonl` o formato documentado equivalente: pesos por tick;
- `comparison.json`: diferencias, tolerancias, primeros puntos de divergencia y estados de terminación;
- `checksums.sha256`: SHA-256 de cada archivo.

Los artefactos de Criptocromo y NetLogo se almacenan por separado. Un comparador posterior lee ambos paquetes y genera el informe; no reescribe los datos de origen. Un hash acredita identidad del archivo comprometido, no exactitud científica ni veracidad del modelo.

## 9. Criterios de aceptación y bloqueo

La fase 1 solo puede declararse **EQUIVALENCIA OBSERVADA EN EL ALCANCE PROBADO** si:

1. La especificación, los estados iniciales y los estímulos están congelados y tienen hashes.
2. Las versiones de ambos motores y runtimes están registradas.
3. Todos los estados discretos y eventos de guard coinciden exactamente.
4. Todas las variables numéricas instrumentadas coinciden dentro de la tolerancia pre-registrada en todos los ticks comparables.
5. No existen ticks posteriores a un aborto D.
6. Los paquetes de artefactos y sus checksums verifican.
7. El comparador y sus pruebas se ejecutan sobre los paquetes originales sin alterarlos.

Si falla cualquier condición, el estado es **NO EQUIVALENTE / INCONCLUSO**, acompañado de la primera divergencia y su diagnóstico. No se cambian ecuaciones, tolerancias, condiciones o parámetros a posteriori para forzar aceptación.

La aceptación se limita a la versión, plataforma, runtime, especificación y conjunto de entradas probados. No demuestra equivalencia universal entre plataformas ni validez empírica del modelo.

## 10. NetLogo y BehaviorSpace: alcance de la comparación

NetLogo + BehaviorSpace es una plataforma general de modelado y experimentación. Puede gestionar parámetros, semillas, lotes de ejecuciones, exportación de resultados y ejecución headless. El protocolo no presupone que sus funciones nativas sustituyan los controles de procedencia de Criptocromo; tampoco presupone que esos controles no puedan implementarse mediante código, scripts, CI y herramientas externas.

La comparación no asigna una jerarquía general:

- NetLogo puede facilitar exploración y experimentación de modelos.
- Criptocromo estructura un laboratorio específico con identidades de motor, protocolos y artefactos separados.
- La reproducibilidad y trazabilidad deben evaluarse en la configuración real de cada implementación, no inferirse por el nombre de la plataforma.

La frase “NetLogo explora; Criptocromo da confianza” no es un resultado y no se utilizará como conclusión.

## 11. Límites de inferencia

Este protocolo no demuestra:

- que Criptocromo sea más confiable que NetLogo;
- que NetLogo sea menos reproducible;
- que un motor sea científicamente correcto por coincidir con el otro;
- que el modelo represente un sistema biológico o físico;
- causalidad, sinergia, emergencia, inteligencia o conciencia;
- equivalencia para entradas, versiones o plataformas no evaluadas.

La equivalencia entre dos implementaciones puede revelar errores de traducción o diferencias numéricas. No valida por sí sola la especificación que ambas implementan.

## 12. Secuencia de trabajo y estado

| Etapa | Estado |
|---|---|
| Especificación neutral y ecuaciones | Este documento, borrador v0.1 |
| Revisión independiente de ecuaciones y tolerancia | Pendiente |
| Exportador de estados iniciales canónicos | Pendiente |
| Vectores unitarios de transición | Pendiente |
| Implementación NetLogo | Pendiente |
| Comparador de artefactos | Pendiente |
| Reproducción CAL-01 interplataforma | No ejecutada; requiere autorización independiente |
| Contraste estadístico con RNG nativo | No diseñado en detalle; posterior a fase 1 |

**Regla de autorización:** aprobar este documento, fusionar su PR o ejecutar CI no autoriza una campaña. Toda ejecución experimental requiere protocolo congelado, revisión y autorización explícita separada.

## 13. Referencias internas

- `docs/AT-002-CAL-01-RESULTS.md`
- `docs/AT-002-CAL-01-TRACE-ANALYSIS-CHECKLIST.md`
- `docs/AT-002-CALIBRATION.md`
- `experiments/AT-002-CALIBRATION/configuration.json`
- `src/core/engine.ts`
- `src/experiments/at002-calibration/engines/variant-engine.ts`

