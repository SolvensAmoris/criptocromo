# AT-004 | Estudio de sensibilidad para margen de equivalencia conductual v0.1

**Estado:** `SENSITIVITY_PROTOCOL_v0.1_FROZEN_FOR_EXECUTION`  
**Tipo:** protocolo de sensibilidad numérica, no campaña confirmatoria  
**Antecedente:** CAL-01 `CAL01-20261123-01`; criterio conductual `BEHAVIORAL_EQUIVALENCE_v0.1_DRAFT_NOT_FROZEN`  
**Ejecución:** autorizada por el investigador en conversación el 23 de noviembre de 2026  
**Margen candidato evaluado:** `1e-6`; niveles comparativos `1e-8` y `1e-10`

## 1. Pregunta

¿Perturbaciones iniciales controladas de magnitud absoluta `1e-6`, `1e-8` y `1e-10`, aplicadas por separado a activación, memoria o pesos, cambian las trayectorias posteriores, el clipping de O, la terminación por guard de D o el resultado primario `Y_s` de O?

El estudio evalúa sensibilidad local alrededor de los estados iniciales canónicos CAL-01. No demuestra robustez global ni equivalencia científica.

## 2. Referencia congelada

- Configuración: `experiments/AT-002-CALIBRATION/configuration.json`, sección CAL-01.
- Semillas: 101, 202, 303, 404, 505, 606, 707, 808, 909, 1010.
- Variantes: O / 0.1.0 y D / 0.2.0-D.
- 24 nodos; A=B=C=true.
- Frecuencia objetivo 0.5; intensidad 1.0 en ticks 1–18 y 0.0 en ticks 19–42.
- 42 ticks planeados; ventana de `Y_s`: ticks 1–16.
- Parámetros de simulación: `src/experiments/at001/config.ts`.
- No se modifica el motor O, el kernel D, CAL-01, AT-003 ni artefactos históricos.
- La identidad de motor/dependencias se verifica contra los Git blob SHA-1 fijados en la configuración.

## 3. Diseño exacto de perturbación

Cada semilla y variante tiene una trayectoria baseline sin perturbación. Se ejecutan nueve trayectorias adicionales por semilla y variante: tres variables × tres magnitudes. Total: 10 semillas × 2 variantes × (1 baseline + 9 perturbaciones) = **200 trayectorias**.

Magnitudes absolutas: `1e-6`, `1e-8`, `1e-10`. Cada variable se perturba de forma aislada.

### 3.1 Activación inicial (ACT)

La activación canónica inicial es cero. Para respetar el dominio [0,1], se aplica perturbación unilateral positiva: nodos con índice 0-based par reciben `+delta`; nodos impares permanecen en cero. No se aplica clipping adicional.

### 3.2 Memoria inicial (MEM)

La memoria canónica inicial es cero. Se usa el mismo patrón unilateral: nodos con índice 0-based par reciben `+delta`; nodos impares permanecen en cero.

### 3.3 Pesos iniciales (WGT)

Para cada peso fuera de diagonal, con índices 0-based `i,j`, se aplica `+delta` si `(i+j+seedIndex) mod 2 = 0` y `-delta` en caso contrario. `seedIndex` es la posición de la semilla en la lista CAL-01, empezando en cero. La diagonal permanece exactamente cero. El ejecutor verifica que ningún peso salga de [0,1]; no recorta silenciosamente.

### 3.4 Justificación de dirección

No existe una perturbación simétrica ±delta alrededor de cero que permanezca dentro del dominio [0,1] para activación y memoria. ACT/MEM se interpretan como sensibilidad direccional positiva. WGT usa un patrón balanceado de signos.

## 4. Variables y eventos registrados

Por trayectoria: variante, semilla, variable, delta, estado de terminación, tick/motivo de aborto, primer tick y nodos con clipping, número de valores brutos fuera de [0,1], `Y_s` en ticks 1–16 (solo si existen los 16 ticks), último tick completado y media de activación final descriptiva.

Por tick, comparar frente al baseline emparejado: diferencias máximas absolutas de activación bruta, activación observada, memoria y pesos. Comparar estados solo en ticks completados por ambas trayectorias. No inventar estados después de un aborto.

## 5. Reglas de análisis

1. Baseline y perturbación se emparejan por semilla y variante.
2. O debe completar 42 ticks. D puede abortar; si no completa tick 16, `Y_s` es no disponible.
3. Un cambio estructural ocurre si cambia presencia, tick o nodo del primer clipping O, o cambia estado/motivo/tick de aborto D.
4. `Y_s` cambia materialmente si `abs(Y_pert - Y_base) > 0.01`. Este umbral es un disparador diagnóstico del estudio, no el margen práctico AT-003 ni el margen conductual.
5. Se reporta si cualquier diferencia puntual en activación observada, memoria o pesos excede `1e-6`, `1e-8` o `1e-10`. Activación bruta se reporta por separado.
6. No se promedian diferencias de nodos/ticks para ocultar máximos.
7. Ningún margen se ajusta después de observar resultados.

## 6. Regla de decisión sobre 1e-6

Para cada variable por separado, `1e-6` recibe apoyo local solo si no produce cambios estructurales ni cambios `Y_s > 0.01` en ninguna de las diez semillas para esa variable. Si `1e-6` cambia un evento estructural o `Y_s > 0.01` en cualquier semilla, se rechaza para esa variable/configuración. Los niveles menores se reportan, sin selección automática ni ajuste post hoc.

La ausencia de cambios en diez semillas no prueba insensibilidad fuera de los estados, parámetros y estímulos examinados. El resultado no convierte `1e-6` en margen universal.

## 7. Integridad y límites

El estudio genera baseline y perturbaciones desde el mismo estado canónico. Parámetros, estímulos y secuencia permanecen fijos. Se verifica identidad de fuentes, conteo de trayectorias y checksums SHA-256. Artefactos en directorio único, sin sobrescritura.

Este estudio evalúa sensibilidad local de Criptocromo O/D. No compara NetLogo, no prueba robustez global, equivalencia científica, causalidad, sinergia, emergencia, inteligencia, conciencia ni validez biológica/física.

**Estado:** parámetros y patrones fijados para esta ejecución. La interpretación y aceptación del margen conductual siguen pendientes de revisión.