# AT-001 · Diseño factorial 2³

## Factores

| Factor | Interruptor del motor | Interpretación |
|---|---|---|
| A | `memory` | Persistencia de estado |
| B | `resonance` | Selectividad frecuencial |
| C | `plasticity` | Adaptación local de conexiones |

Las ocho condiciones recorren `000` a `111`. Las semillas predeterminadas son 101, 202, 303, 404, 505, 606, 707, 808, 909 y 1010. Cada semilla aparece en las ocho condiciones, formando bloques pareados. El barrido produce 80 registros factoriales. Cada registro incluye dos protocolos de estímulo (frecuencia objetivo 0.5 y frecuencia fuera de objetivo 0.9), por lo que el motor realiza 160 simulaciones AT-001.

## Corrección del control B

Cuando B está apagado, el motor aplica una entrada amplia (ganancia 1) en lugar de anular la entrada. De otro modo, la ablación de resonancia apagaría el estímulo y confundiría selectividad con ausencia de entrada. B=0 representa respuesta no selectiva; B=1 representa respuesta modulada por resonancia.

## Métricas

- `targetPeakActivation`: máximo de activación media durante el pulso objetivo.
- `targetResidualActivation`: activación media al final de la recuperación objetivo.
- `persistenceRatio`: residual / pico; vale 0 si el pico es 0.
- `selectivityDifference`: pico objetivo menos pico fuera de objetivo. Positivo indica preferencia por la frecuencia objetivo.
- `recoveryVolatility`: promedio de cambios absolutos entre pasos en los últimos ocho pasos de recuperación. Menor significa menos fluctuación, no necesariamente mejor funcionamiento.
- `activeNodeFraction`: fracción de nodos con activación final superior a 0.05.

## Análisis

Los efectos principales y las interacciones AB, AC, BC y ABC se calculan con contrastes factoriales codificados ±1, primero dentro de cada semilla y después agregados entre semillas. Se reportan media, desviación estándar muestral y n.

La comprobación aditiva en 111 se define específicamente como:

`sinergia_111 = observado(111) - [media(000) + (media(100)-media(000)) + (media(010)-media(000)) + (media(001)-media(000))]`

Esto compara 111 con la suma de los tres efectos simples medidos desde el control 000. No debe confundirse con la interacción factorial ABC, que es un contraste distinto y utiliza las ocho celdas.

El umbral absoluto de 0.05 es una regla exploratoria predefinida, no una prueba de significación estadística. El signo positivo o negativo no demuestra emergencia ontológica: describe desviación de aditividad dentro de este modelo y protocolo.

## Ejecución y exportación

`npm run factorial`

El comando utiliza exclusivamente el motor real. Si falla una dependencia o el motor, la ejecución termina con error; no hay fallback a mocks. Exporta JSONL, CSV y análisis JSON con nombres timestamped en `experiments/AT-001/results/`. Los archivos se crean con modo exclusivo (`wx`) para impedir sobrescrituras. No se genera un archivo `latest` mutable.

Los resultados son observaciones del modelo implementado. No son mediciones físicas ni demuestran novedad frente a toda la literatura.
