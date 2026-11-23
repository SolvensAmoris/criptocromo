# Auditoría de la hipótesis DAG para el análisis de seed 303

**Estado:** auditoría estática de implementación y del artefacto histórico.  
**Fuente:** PR #12, PR #13, commit de sensibilidad `9ccd5fccb5dab97bc724114154bf48fd39e0ba97`, artefacto `BSENS-45198131816`.  
**No es:** una nueva campaña, una inferencia asintótica ni una decisión sobre épsilon.

## Veredicto

**La hipótesis «el motor usa un DAG de profundidad máxima 16» no está respaldada por el código inspeccionado y contradice la estructura implementada.**

El motor construye una matriz de pesos dirigida con una entrada para cada par ordenado de nodos distintos:

`weights[i][j] = random() * 0.12` para `i != j`, y cero en la diagonal.

Con 24 nodos existen 24 × 23 = 552 posiciones dirigidas fuera de la diagonal. Se reprodujo el generador LCG del motor para las diez semillas del artefacto y las 552/552 posiciones fuera de diagonal resultaron estrictamente positivas en cada semilla. Por tanto, en estas diez redes no solo hay posibilidad estructural de ciclos: están presentes las conexiones recíprocas necesarias para ciclos de longitud 2. El término de vecinos de cada transición se calcula como:

`sum_j state.weights[i][j] * neighbor.activation`

Es decir, el nodo i recibe contribuciones de los estados de sus vecinos en la transición anterior. La misma estructura se vuelve a recorrer en cada tick. Además, los pesos se actualizan después de calcular las nuevas activaciones, usando `nextNodes[i].activation * nextNodes[j].activation`.

Esta arquitectura permite ciclos dirigidos de longitud 2: i recibe de j y j recibe de i. No es una calle unidireccional por capas ni un DAG de 16 niveles. Es una red dirigida recurrente desplegada en el tiempo mediante actualizaciones sincrónicas.

## Qué significan realmente los 16 ticks de seed 303

El protocolo contiene 42 ticks previstos: 18 de pulso y 24 de recuperación. La simulación D no termina porque alcance una profundidad topológica. Se interrumpe cuando una activación bruta supera el guard absoluto de 1,000,000.

El artefacto registra el tick de aborto para cada semilla D. Seed 303 completa los ticks 1–16 y el intento del tick 17 activa el guard. Las otras semillas activan el guard antes. Por tanto:

- 16 es la cantidad de transiciones D completadas en seed 303 antes del intento que aborta.
- No es la profundidad máxima de un DAG.
- Las otras nueve semillas no tienen caminos topológicos más cortos demostrados; tienen abortos anteriores por el guard.
- La diferencia de ventana observable se debe al momento del evento de guard en estas ejecuciones, no a una profundidad topológica establecida.

## Qué sí y qué no podemos concluir

**Sí podemos concluir:**

- El código implementa interacciones dirigidas entre nodos a través de una matriz de pesos.
- El cálculo de vecinos usa activaciones del estado anterior.
- La matriz de pesos se actualiza con las nuevas activaciones después del cálculo de activación y memoria.
- La ejecución repite esta transición hasta completar 42 ticks o activar el guard.
- El guard censura las trayectorias D antes de la ventana completa en nueve semillas.

**No podemos concluir:**

- Estabilidad asintótica, convergencia o divergencia a largo plazo.
- Que seed 303 sea estable o excepcional.
- Que un ciclo concreto sea responsable de la amplificación observada.
- Que la red tenga un «tiempo infinito» observable: el motor D aborta cuando se supera el guard.
- Que un DAG más profundo o un grafo recurrente alternativo sea necesario para responder cualquier pregunta conductual. Primero hay que distinguir qué propiedad se quiere medir.

## Corrección de la explicación causal

La formulación «nos faltó topología, no tiempo» debe rechazarse para el motor actual.

La formulación respaldada es:

> La red implementada ya contiene conexiones dirigidas recurrentes. La ventana observada de D está limitada por un guard de magnitud, no por una profundidad DAG de 16 capas. El artefacto permite comparar prefijos previos al guard, pero no permite inferir el comportamiento posterior al aborto ni la estabilidad asintótica.

Un estudio posterior de dinámica a largo plazo podría requerir revisar el guard, el dominio numérico y la seguridad de la integración. Eso sería un protocolo nuevo y explícito, no una modificación retroactiva de PR #13.

## Consecuencia para seed 303

La tabla por semilla debe conservarse como análisis de censura por guard. No se debe añadir la afirmación de que 303 «tenía una calle DAG más larga». Se debe registrar que 303 tuvo una transición observable adicional antes del aborto, bajo la misma topología de red y el mismo umbral de guard.

**Conclusión:** la hipótesis DAG queda `REJECTED_BY_SOURCE_INSPECTION`. El margen conductual permanece `NO RESUELTO`. No se acepta ningún épsilon y no se modifica AT-003.
