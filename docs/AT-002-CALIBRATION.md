# AT-002 | Protocolo de calibración

**Estado:** CAL-01 instrumentado y probado en directorio temporal; campaña oficial no ejecutada.  
**Predecesor conservado:** AT-001-PILOT-01, motor 0.1.0.  
**Versión del protocolo:** 0.3.0.

> La calibración no busca producir sinergia. Busca producir un instrumento capaz de distinguirla si existe.

## 1. Pregunta y alcance

¿Podemos identificar un régimen operativo del motor en el que la respuesta conserve rango dinámico, variabilidad entre semillas y recuperación observable, sin seleccionar parámetros por producir una interacción determinada?

AT-002 es una campaña de calibración, no una prueba de sinergia. No se calculará ni optimizará una interacción factorial como criterio de selección. Los resultados describen el comportamiento del software, no un fenómeno físico.

## 2. Preservación e identidad del instrumento

- **O / Original:** adaptador al motor histórico 0.1.0, con clipping en [0,1]. No modificar.
- **D / Diagnóstico:** variante 0.2.0-D que deja sin clipping la activación de nodo y aplica un guard fail-fast de magnitud absoluta 1,000,000.
- **S / Suave:** variante 0.2.0-S que aplica logística. Es un modelo no lineal alternativo, no un estimador de pérdida por clipping.

Cada identidad registra el hash Git blob SHA-1 del módulo y de sus dependencias relevantes. O identifica explícitamente `src/core/engine.ts`, `src/core/types.ts` y los valores por defecto de simulación. D/S identifican el kernel compartido, tipos y configuración base. CAL-01 también fija los hashes del ejecutor, diagnóstico y runner. El ejecutor recalcula los Git blob SHA-1 antes de iniciar y bloquea una discrepancia.

Los hashes SHA-1 mencionados son identificadores Git blob, no SHA-256. Cada ejecución registra además SHA-256 del archivo de configuración. Los artefactos finales deben tener sus propios digests SHA-256.

## 3. CAL-01 | Diagnóstico de clipping

CAL-01 compara únicamente O y D, en ese orden, con las mismas diez semillas, estímulos, duración y switches. Cada semilla ejecuta 18 pasos de pulso a frecuencia objetivo e intensidad 1.0, seguidos de 24 pasos de recuperación con intensidad cero. Total: 10 semillas × 2 motores × 42 pasos = 840 pasos de motor.

En cada tick se calcula la activación bruta antes de la transformación, se ejecuta el motor y se comprueba que la activación observada coincide con la transformación esperada:
- O: `clamp(raw, 0, 1)`.
- D: `raw`, sujeto al guard de overflow.

La instrumentación independiente vuelve a calcular la ecuación de activación previa al paso. Si el valor transformado no coincide con el estado producido por el motor, la ejecución falla. Esto permite conservar por tick y nodo tanto la activación bruta como la observada, cantidad de valores que habrían sido recortados y exceso absoluto acumulado.

Métricas por semilla y motor:
- máximo, mínimo y máximo absoluto de activación bruta;
- máximo de activación observada;
- cantidad y proporción de valores fuera de [0,1];
- exceso absoluto acumulado sobre los límites;
- ticks con al menos un valor fuera de rango;
- pico medio, residual medio y fracción media de nodos activos.

D no se interpreta como salida de O. Su trayectoria diverge cuando la activación bruta rebasa el intervalo histórico. S no participa en CAL-01. El guard de D puede detener una semilla antes de completar la ventana. En ese caso se conserva una fila `guard_aborted` con la activación bruta que disparó el guard, `observedActivations=null`, el error y las métricas parciales. La salida de esa variante se marca `ABORTED_GUARD`; nunca se presenta como trayectoria completa.

### Artefactos y protección contra sobrescritura

La ejecución escribe conjuntos separados:

`artifacts/AT-002-CALIBRATION/O/CAL-01/<RUN_ID>/`  
`artifacts/AT-002-CALIBRATION/D/CAL-01/<RUN_ID>/`

Cada conjunto contiene:
- `manifest.json`: identidad de motor, hashes de fuente/dependencias e instrumentación, SHA-256 de configuración, commit de origen, semillas, estímulo, switches y runtime;
- `traces.jsonl`: valores brutos y observados por tick y nodo;
- `metrics.json`: métricas por semilla, incluidos pasos completados y abortos del guard.
- `checksums.sha256`: SHA-256 de manifest, trazas y métricas.

El RUN_ID debe ser explícito y seguro para rutas. Si cualquiera de los directorios finales ya existe, el ejecutor rechaza la ejecución. No sobrescribe resultados anteriores. Los conjuntos O y D no se mezclan.

El ejecutor puede invocarse con:

```bash
AT002_CAL01_AUTHORIZED=YES AT002_RUN_ID=cal01-run-001 npm run at002:cal01
```

La variable de autorización es una barrera explícita para evitar ejecuciones accidentales. No se ha autorizado ni ejecutado la campaña oficial. Las pruebas automatizadas invocan el ejecutor únicamente en directorios temporales y verifican separación de artefactos y rechazo de sobrescritura. La primera prueba de integración detectó que D rebasa el guard de 1,000,000 (un valor observado fue aproximadamente 3,033,517). El ejecutor ahora conserva ese aborto como evidencia parcial en lugar de perder toda la ejecución o elevar el límite para forzar una finalización. Este hallazgo procede de una prueba automatizada temporal, no de una campaña oficial.

## 4. CAL-02 | Barrido de ganancia

Barrido predefinido de intensidad de entrada: **0.10, 0.20, 0.35, 0.50, 0.75**. Se mantienen fijos los demás parámetros y la estructura del motor O. No modificar simultáneamente umbrales, coeficientes internos o función de activación.

Usar las diez semillas pareadas: 101, 202, 303, 404, 505, 606, 707, 808, 909, 1010. Registrar todos los resultados, incluidos los que saturen o no produzcan respuesta. La intensidad es el único factor manipulado en esta fase.

El motor 0.1.0 limita la intensidad de entrada a [0,1]; por tanto, el barrido propuesto usa valores dentro de ese intervalo. El plan está definido; el ejecutor de CAL-02 todavía no está implementado.

## 5. CAL-03 | Disociación de memoria y plasticidad

No inferir acoplamiento ni independencia a partir de métricas finales similares. Registrar trazas temporales de activación media, memoria media por tick, media y suma de cambios absolutos de pesos por tick, switches efectivos, estímulo y semilla.

Controles mínimos: A sola (memory=true, plasticity=false) y C sola (memory=false, plasticity=true), con B=false. Añadir baseline sin A ni C. La prueba de repetición y la prueba de novedad deben definirse como protocolos distintos y conservar idénticas semillas entre condiciones.

Criterio de lectura: memoria debe poder cambiar sin plasticidad; los pesos deben poder cambiar sin memoria. Esto comprueba rutas computacionales separadas, no demuestra independencia funcional universal. El plan está definido; el ejecutor de CAL-03 todavía no está implementado.

## 6. CAL-04 | Recuperación y rango dinámico

Guardar la curva completa por tick, separando pulso y recuperación. Informar pico, residual, tiempo hasta cruzar el 50% del pico (si cruza), pendiente de recuperación, fracción de nodos activos, fracción de valores en suelo/techo y dispersión entre semillas. Si el 50% no se alcanza durante la ventana, registrar `not_reached`, no imputar un tiempo.

El plan está definido; el ejecutor de CAL-04 todavía no está implementado.

## 7. GATE-01 | Criterio operativo pre-registrado

Estos umbrales son reglas operativas iniciales para decidir si AT-001-R2 puede ejecutarse con O. No son leyes universales ni criterios de significación estadística.

- Pico medio entre 0.40 y 0.80 en al menos 6 de las 8 condiciones.
- Fracción activa entre 0.30 y 0.85 en las condiciones evaluadas; no todas pueden colapsar al mismo valor.
- Al menos una condición con pico medio inferior a 0.40.
- Ninguna condición con pico medio igual a 1.00.
- Desviación estándar entre semillas del pico superior a 0.02 en al menos 4 condiciones.
- Descenso desde pico hasta residual de al menos 20% en al menos 4 condiciones.

**Regla:** pasa únicamente si se satisfacen todos los criterios. Si falla uno, GATE-01 = BLOCKED y se regresa a CAL-02 o se revisa el diseño en una nueva versión. No cambiar umbrales después de observar los datos. La fracción activa debe especificar umbral y momento de medición. Inspeccionar distribuciones por semilla, no solo promedios.

## 8. Secuencia y autorización

| Etapa | Estado |
|---|---|
| CAL-01 | Ejecutor y workflow manual implementados; prueba temporal detecta aborto del guard D; campaña oficial pendiente de autorización y despacho |
| CAL-02 | Plan definido; ejecutor pendiente |
| CAL-03 | Plan definido; ejecutor pendiente |
| CAL-04 | Plan definido; ejecutor pendiente |
| GATE-01 | No evaluado |
| AT-001-R2 | Bloqueado hasta que GATE-01 pase |

La aprobación de código, la aprobación del plan y la autorización de una campaña son decisiones distintas. Si D termina en `ABORTED_GUARD`, CAL-01 debe leerse como diagnóstico parcial y no como comparación O/D completa; esa condición debe resolverse o aceptarse explícitamente en una revisión del protocolo antes de interpretar la etapa. Un CI verde no autoriza una campaña. Una prueba unitaria no sustituye una ejecución experimental.

## 9. Limitaciones explícitas

- La salida es una consecuencia del modelo computacional implementado.
- La separación de variables internas no prueba independencia causal universal.
- La ausencia de saturación no demuestra por sí sola que exista resolución suficiente.
- Superar GATE-01 habilita una campaña factorial; no anticipa ni garantiza sinergia.
- AT-001-PILOT-01 permanece como evidencia histórica y no se recalcula retroactivamente.
- CAL-01 cuantifica dónde la trayectoria contrafactual D se separa de O; no convierte los valores de D en observaciones del motor original.

## 10. Pruebas unitarias y evidencia experimental

> Una prueba unitaria demuestra que una función cumple una propiedad especificada. Una campaña demuestra qué ocurrió al ejecutar el sistema bajo condiciones experimentales. No son intercambiables.

Las pruebas verifican equivalencia O/D antes del clipping, divergencia después del límite, guard de overflow, identidades de dependencias, captura de activación bruta, integridad de las trazas, separación de artefactos y política no-overwrite. La prueba de integración del ejecutor usa un directorio temporal y no crea una campaña oficial.

El runner `npm run at002:plan` sigue siendo plan-only. El comando `npm run at002:cal01` exige `AT002_CAL01_AUTHORIZED=YES` y un `AT002_RUN_ID` explícito. El workflow manual `.github/workflows/at002-cal01.yml` encapsula esa ejecución: requiere seleccionar `YES`, valida el identificador, repite tests/build/plan, ejecuta O y D, resume los estados y publica los artefactos durante 90 días. El identificador predeterminado propuesto es `CAL01-20261123-01`; no se ejecuta automáticamente al fusionar el workflow. Un envío con autorización `NO` no inicia el job.
