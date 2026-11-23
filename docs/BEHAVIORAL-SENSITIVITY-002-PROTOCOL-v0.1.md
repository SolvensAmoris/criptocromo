# Protocolo de sensibilidad por términos de activación
## BEHAVIORAL-SENSITIVITY-002 | v0.1 DRAFT_NOT_FROZEN

**Estado:** propuesta técnica y primitiva de intervención con pruebas unitarias; no es una campaña ejecutada ni autorizada.  
**Dependencia:** resultados históricos de BEHAVIORAL-SENSITIVITY-001 y análisis de semilla 303 v0.1.  
**No modifica:** motores O/D, artefactos CAL-01/CAL-02, AT-003, criterio conductual v0.2 ni resultados de PR #12/#13.

## 1. Motivo

El estudio anterior perturbó el estado inicial en ACT, MEM y WGT. El registro de activación bruta fue una variable observada, no una variable intervenida directamente. La señal de vecinos tampoco se perturbó como término separado.

Este protocolo cubre esos dos huecos con intervenciones internas explícitas y separadas. No las presenta como perturbaciones de estado inicial ni como evidencia causal de un mecanismo biológico.

## 2. Ecuación instrumentada

Para cada nodo i, la activación bruta es la suma de cuatro términos:

- retención: alpha × activación anterior;
- entrada resonante: beta × resonancia × entrada;
- contribución vecinal: gamma × suma de (peso anterior × activación vecina anterior);
- memoria: eta × memoria anterior.

Se definen dos intervenciones relativas, aplicadas una sola vez en la transición que produce el tick 2, después de completar el tick 1. La elección evita intervenir cuando la señal vecinal inicial es exactamente cero.

### I-RAW: escala del resultado bruto

ACT_RAW se multiplica por (1 + s_i × delta), después de sumar los cuatro términos y antes de aplicar la política O/D.

### I-NEIGHBOR: escala exclusiva de la contribución vecinal

Solo el término gamma × señal vecinal se multiplica por (1 + s_i × delta), antes de sumarlo a los otros tres términos.

Donde s_i = +1 para nodos de índice par y s_i = -1 para nodos de índice impar. La pauta es fija, determinista y común a todas las semillas. Delta es adimensional y se interpreta como cambio relativo del término seleccionado.

**Importante:** I-RAW e I-NEIGHBOR son intervenciones en términos de la ecuación, no perturbaciones equivalentes del estado inicial. Sus diferencias se informan por separado. No se agregan en una única distribución.

## 3. Diseño propuesto

- Variantes: O y D, sin alterar sus implementaciones históricas.
- Semillas: las diez semillas históricas CAL-01, emparejadas por variante.
- Niveles: 1e-6, 1e-8 y 1e-10, aplicados como factores relativos.
- Intervenciones: I-RAW, I-NEIGHBOR y baseline sin intervención.
- Momento: transición 1→2, una sola vez; después se ejecuta la dinámica ordinaria.
- Estímulos: protocolo histórico de 18 ticks de pulso y 24 de recuperación.
- Switches: A/B/C activos, idénticos a CAL-01.
- Conteo esperado: 10 semillas × 2 variantes × (1 baseline + 2 intervenciones × 3 niveles) = 140 trayectorias; 20 baseline + 120 intervenidas.

Esta es una sensibilidad local de términos bajo la configuración CAL-01. No es factorial de A/B/C ni prueba causal de plasticidad.

## 4. Observables obligatorios

Por tick y semilla, baseline e intervención emparejados:

1. Activación bruta ACT_RAW, antes de política O/D.
2. Contribución vecinal gamma × suma de (peso × activación vecina).
3. Activación observada después de clipping O o aceptación D.
4. Memoria por nodo.
5. Pesos por arista y cambio absoluto de pesos.
6. Primer tick de diferencia exacta y máximo absoluto de diferencia por observable.
7. Primer clipping y conjunto de nodos afectados en O.
8. Estado de terminación, tick de guard y último tick completado en D.
9. Métrica agregada Y16, solo si baseline e intervención completan los 16 ticks requeridos.

Los máximos se calculan sobre el prefijo común completado. Las observaciones posteriores a un guard no existen y no se imputan.

## 5. Reglas de análisis

- Reportar cada variante, intervención y nivel por separado.
- No comparar una diferencia relativa del término vecinal con una diferencia absoluta del estado como si fueran la misma magnitud.
- Comparar primero el prefijo común entre todas las semillas; después presentar extensiones disponibles por semilla, claramente censuradas.
- Distinguir divergencia en ACT_RAW, contribución vecinal, activación observada, memoria y pesos.
- Una diferencia en el término intervenido confirma que la intervención se aplicó; no constituye por sí sola un efecto conductual.
- Una diferencia en estados posteriores describe propagación bajo el modelo; no identifica por sí sola causalidad descendente, sinergia o plasticidad biológica.
- El mismo tick de guard no implica equivalencia de trayectoria.
- No seleccionar ni congelar un margen conductual a partir de este estudio. El criterio v0.2 permanece DRAFT_NOT_FROZEN.

## 6. Primitiva de software

src/experiments/behavioral-term-interventions.ts implementa una transición sincrónica compatible con O/D y permite las dos intervenciones de un solo tick. Las pruebas comprueban:
- coincidencia con la transición histórica cuando no hay intervención;
- ausencia de intervención en el tick 1;
- intervención de I-RAW e I-NEIGHBOR en el tick 2;
- preservación de clipping O y guard D;
- rechazo de magnitudes inválidas.

La primitiva no escribe artefactos, no despacha workflows y no puede iniciar una campaña. El ejecutor reproducible, manifiesto, checksums y workflow de campaña quedan pendientes de revisión del protocolo.

## 7. Autorización y estado

**No ejecutado. No autorizado.** La integración de código o la CI no autorizan una campaña. Para ejecutar se requerirá una decisión explícita posterior, un RUN_ID único, autorización de ejecución y artefactos nuevos e inmutables.

## 8. Criterio de salida

El estudio podrá informar sensibilidad diferencial de los términos bajo las condiciones fijadas. No podrá por sí solo demostrar:
- equivalencia conductual general;
- irreducibilidad computacional;
- emergencia fuerte o causalidad descendente;
- causalidad biológica de la plasticidad;
- robustez fuera de las diez semillas y parámetros evaluados.

**Decisión pendiente:** revisión independiente del diseño, la semántica de las intervenciones y las pruebas antes de congelar v1.0.
