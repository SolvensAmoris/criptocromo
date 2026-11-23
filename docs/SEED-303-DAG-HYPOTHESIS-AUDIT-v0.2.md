# Auditoría reproducible de topología y ciclo de actualización v0.2

**Estado:** evidencia de implementación reconstruida y verificada por algoritmo; no es una afirmación de estabilidad dinámica.  
**Artefacto histórico:** `BSENS-45198131816`, SHA-256 `475cc8ddd26a1b3c629c290152aec2dda7954ad633d3592092e2b66b6595fd96`.  
**Fuente de generación:** commit `9ccd5f5cc5dab97bc724114154bf48fd39e0ba97`; PR #12 / PR #13.

## 1. Límite de procedencia: el ZIP no contiene la matriz inicial

El artefacto de sensibilidad contiene `manifest.json`, `summaries.json` y `tick-comparisons.jsonl`; no contiene la matriz inicial de pesos completa. Por tanto, esta auditoría **no afirma extraer la matriz directamente del ZIP**. Reconstruye la matriz inicial de forma determinista desde el generador LCG fijado en `variant-engine.ts`, el número de nodos y las diez semillas declaradas en el artefacto. El comparador verifica la identidad del blob de ese generador contra PR #12, PR #13 y HEAD antes de aceptar la reconstrucción.

Convención de aristas: `weights[i][j] > 0` significa que el nodo `j` contribuye al cálculo de activación del nodo `i`; la arista de influencia se representa como `j -> i`.

## 2. Auditoría topológica

Para cada semilla se consumen primero 24 valores LCG para las frecuencias preferidas y luego se reconstruye la matriz 24 × 24 en el mismo orden row-major del motor. La diagonal se fija en cero; cada una de las 552 posiciones fuera de diagonal recibe `random() * 0.12`.

El módulo ejecuta una detección de ciclos mediante ordenamiento topológico de Kahn. Si procesa menos de 24 nodos, el grafo no es acíclico. Además, emite un testigo explícito de ciclo recíproco `a -> b -> a`, verificando ambas aristas en la matriz reconstruida. La profundidad topológica se informa únicamente cuando el grafo es un DAG; para una red cíclica se devuelve `null`, no un número inventado.

Las pruebas cubren las diez semillas y los tres niveles de perturbación WGT. En los niveles declarados, la perturbación no elimina las conexiones positivas de la matriz inicial; el recuento permanece en 552 aristas dirigidas por semilla.

## 3. Ciclo de actualización del motor

El código ejecuta una transición sincrónica por llamada a `stepVariantNetwork`:

1. Calcula cada activación siguiente desde las activaciones y pesos del estado anterior.
2. Calcula la memoria siguiente desde memoria y activación anteriores.
3. Calcula la matriz completa de pesos siguiente usando las activaciones siguientes.
4. Devuelve el nuevo estado completo e incrementa el contador de tick una vez.

Por tanto, **un tick = una transición completa y sincrónica de todos los nodos**, no una capa topológica ni una visita a un nodo. La recurrencia se repite a través del tiempo.

El protocolo construye 42 estímulos (18 de pulso y 24 de recuperación). El ejecutor de sensibilidad itera sobre esos estímulos y termina una trayectoria D si el motor lanza la excepción del guard. No hay un límite de profundidad topológica ni un `max_ticks = 16` que explique la censura histórica.

## 4. Causa del final de trayectoria por semilla

La clasificación del comparador se deriva de los registros baseline D del artefacto. La causa esperada es `D_OVERFLOW_GUARD`, con el siguiente patrón histórico:

| Semilla | Tick del intento abortado | Último tick completado |
|---:|---:|---:|
| 101 | 16 | 15 |
| 202 | 16 | 15 |
| 303 | 17 | 16 |
| 404 | 16 | 15 |
| 505 | 15 | 14 |
| 606 | 15 | 14 |
| 707 | 16 | 15 |
| 808 | 16 | 15 |
| 909 | 16 | 15 |
| 1010 | 15 | 14 |

El comparador debe comprobar también que cada resumen de perturbación D conserva el tick de aborto de su baseline. Si la causa, el tick o el prefijo completado no coinciden con el contrato, la comprobación es `MISMATCH`.

## 5. Conclusión y límites

- La topología reconstruida es una red dirigida recurrente, no un DAG.
- El tick es una actualización sincrónica completa del estado.
- La ventana de 14–16 transiciones completadas en D se explica por el momento en que se dispara el guard de magnitud, no por profundidad del grafo ni por un límite de 16 ticks.
- Seed 303 completa una transición más que las otras nueve antes del guard. Esto no demuestra mayor estabilidad.
- No se infiere qué ciclo concreto causa la amplificación, estabilidad asintótica, convergencia ni comportamiento posterior al aborto.
- La reconstrucción es reproducible desde código y semillas fijados, pero no debe describirse como una matriz almacenada en el ZIP original.

**Veredicto:** `DAG_HYPOTHESIS_REJECTED_BY_SOURCE_AND_RECONSTRUCTION`. La profundidad topológica queda `NOT_APPLICABLE_CYCLIC_GRAPH`. El margen conductual sigue sin resolverse.
