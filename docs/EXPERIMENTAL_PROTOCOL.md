# Protocolo experimental

## Estados epistemológicos

- HYPOTHESIS: propuesta aún no contrastada.
- OBSERVED: salida producida por una ejecución identificada.
- REPRODUCED: salida replicada bajo condiciones declaradas.
- SUPPORTED: evidencia suficiente para una afirmación delimitada.
- REJECTED: la predicción especificada no superó la prueba.
- INDETERMINATE: datos insuficientes o controles inadecuados.

Estos estados describen afirmaciones y resultados, no la calidad moral de una hipótesis.

## Registro mínimo por ejecución

- ID único de ejecución.
- ID y versión del experimento.
- Hash o referencia inmutable del código.
- Configuración completa y semilla.
- Entorno de ejecución y versión del runtime.
- Entradas, salidas y métricas.
- Fecha, duración y errores.
- Desviaciones del protocolo.

## Controles

Usar ablaciones para desactivar cada mecanismo por separado y un control sin mecanismos. Cuando se evalúe interacción, incluir combinaciones factoriales y comparar contra un modelo nulo explícito.

## Reproducibilidad

Una repetición debe conservar configuración, semilla y versión. Una exploración con parámetros modificados es una ejecución nueva, no una réplica exacta.

## Integridad

No sobrescribir resultados anteriores. No descartar resultados negativos. Congelar hipótesis y métricas antes de una campaña confirmatoria. Las propuestas de modelos de IA deben registrarse como propuestas, no como observaciones.

## Límites

Una simulación muestra consecuencias del modelo implementado. No demuestra que el mecanismo exista en la naturaleza ni que sea novedoso frente a toda la literatura. La afirmación debe mantenerse dentro del alcance de los controles y datos.
