# Criptocromo | ATANOR Ω

**Autor e investigador principal:** Luis Alberto Burciaga Miker  
**Ubicación del autor (sin afiliación institucional declarada):** Ensenada, Baja California, México  
**Proyecto:** ATANOR Ω · Criptocromo  
© 2026 Luis Alberto Burciaga Miker · Ensenada, Baja California, México

**Laboratorio computacional de principios y comportamientos emergentes.**

Criptocromo es el entorno experimental de ATANOR Ω. Investiga qué ocurre cuando principios de distintos dominios se formalizan como operadores ejecutables y se componen en mecanismos computacionales.

> Principio → Operador → Mecanismo → Comportamiento

El objetivo no es asumir que una combinación produce emergencia. Es diseñar experimentos reproducibles capaces de distinguir efectos individuales, interacciones, límites del instrumento y explicaciones alternativas.

## Estado del proyecto

**Fase actual:** auditoría metodológica y cierre de la definición de equivalencia conductual; AT-003 permanece preregistrado, pendiente de revisión independiente y de implementación del ejecutor de calibración.

- **AT-001:** campaña factorial exploratoria histórica (8 condiciones × 10 semillas × 2 estímulos = 160 simulaciones). No constituye evidencia confirmatoria de sinergia o emergencia.
- **AT-002 CAL-01 y CAL-02:** campañas oficiales ejecutadas. CAL-01 comparó O y D; CAL-02 ejecutó O. O presentó saturación; D terminó con guard de overflow y conservó registros parciales. Los resultados están documentados y no demuestran causalidad, sinergia ni emergencia.
- **AT-003:** pre-registro v1.0 integrado mediante [PR #9](https://github.com/SolvensAmoris/criptocromo/pull/9), pendiente de revisión independiente. El ejecutor de calibración no está implementado; calibración y confirmación no se han ejecutado ni autorizado.
- **Reproducción entre motores:** [PR #12](https://github.com/SolvensAmoris/criptocromo/pull/12) integró la reproducción NetLogo de CAL-01. La coincidencia numérica exacta observada se limita a esa configuración y secuencia.
- **Sensibilidad conductual:** [PR #13](https://github.com/SolvensAmoris/criptocromo/pull/13) integró el estudio de 200 trayectorias. El candidato 1e-6 fue rechazado como margen general.
- **Criterio conductual v0.2:** [PR #14](https://github.com/SolvensAmoris/criptocromo/pull/14) dejó un borrador metodológico no congelado. 1e-8 y 1e-10 permanecen sin aceptación; el margen general está sin resolver.
- **Contrato de equivalencia conductual v0.3:** borrador prospectivo común para futuras pruebas de margen. Separa observables conductuales Yₜ de variables diagnósticas Zₜ, define tolerancias por observable, eventos categóricos, fallos cualitativos y censura por guard. No selecciona ACT por defecto ni modifica campañas anteriores. Ver [Contrato metodológico v0.3](docs/BEHAVIORAL-EQUIVALENCE-CONTRACT-v0.3.md).
- **Topología y comparador:** [PR #15](https://github.com/SolvensAmoris/criptocromo/pull/15) y [PR #16](https://github.com/SolvensAmoris/criptocromo/pull/16) integraron la auditoría de red recurrente y el comparador de definición v0.2. La salida esperada es DEFINITION_PARTIAL_MATCH: el comparador detecta una diferencia conocida en el dominio de guardas TypeScript/NetLogo. No es una prueba formal de equivalencia semántica ni conductual.
- **Análisis de semilla 303:** en la campaña BEHAVIORAL-SENSITIVITY-001 (run `BSENS-45198131816`), y únicamente entre las diez semillas preregistradas de esa campaña, 303 fue la única semilla D que completó 16 ticks. En el prefijo común 1–14 no presentó la mayor amplificación; tuvo el menor máximo de diferencia de estado de las diez en las tres variables comparadas a 1e-6. Esto no la convierte en una semilla excepcional fuera de ese conjunto ni permite inferir ticks censurados. Ver [Análisis de sensibilidad D: semilla 303](docs/BEHAVIORAL-EQUIVALENCE-SEED-303-ANALYSIS-v0.1.md).
- **BEHAVIORAL-SENSITIVITY-002:** protocolo v0.1 en borrador para intervenir por separado la activación bruta y la contribución vecinal. La primitiva tiene pruebas unitarias; no existe ejecutor de campaña y no se ha ejecutado ni autorizado el estudio. Ver [Protocolo de sensibilidad por términos](docs/BEHAVIORAL-SENSITIVITY-002-PROTOCOL-v0.1.md).
- **AT-004 / Anticítera:** la captura histórica conserva `experiment.py` y los demás módulos originales sin modificación. El candidato prospectivo v0.1 corrigió la ruta de integración, normalización y asignación sintética de ciclos. La revisión v0.2 añade validación de entradas finitas, pruebas de aislamiento para los cuatro grupos, resumen por ventana de tiempo físico y escritura de manifiestos con hashes de resultados y entorno. El candidato sigue sin congelarse; no se ha ejecutado ningún barrido confirmatorio. Ver [auditoría AT-004](docs/AT-004-AUDIT-02-IMPLEMENTATION-REVIEW-v0.2.md) y [especificación candidata](docs/AT-004-REVISED-MODEL-SPEC-v0.2.md).

### Siguiente secuencia

1. Revisar el análisis por semilla 303 y el borrador BEHAVIORAL-SENSITIVITY-002, especialmente la semántica de las intervenciones por término.
2. Si el protocolo se aprueba, implementar un ejecutor aislado con trazas, manifiesto, checksums y controles de censura; la ejecución requerirá autorización explícita posterior.
3. Resolver el contrato de equivalencia conductual por variable y variante, o declarar que no existe un margen justificable con la evidencia actual.
4. Definir después la tarea y el contrato de comparación entre costo de predicción y costo de ejecución para la línea independiente de límites predictivos.
5. Mantener AT-003 separado: su protocolo no se modifica por estas líneas de análisis.

## Principios metodológicos

- MODEL ≠ EVIDENCE
- OBSERVATION ≠ ONTOLOGY
- EXPERIMENT ≠ RESULT ≠ CONCLUSION
- CLAIM ≠ EVIDENCE ≠ AUTHORIZATION
- Una prueba unitaria no sustituye una campaña experimental.
- Divergencia observada no equivale a atribución causal.
- ABORTED_GUARD es una observación diagnóstica parcial; no representa una trayectoria completa ni autoriza extrapolar estados posteriores.
- Los ticks no observados por aborto son datos censurados, no ceros.
- La reproducción numérica de una secuencia concreta no implica equivalencia conductual general.
- Cada campaña debe conservar identidad del motor, configuración, semillas, entorno y checksums de sus artefactos.

La hipótesis H-D1 sobre la posible contribución de la plasticidad a una retroalimentación positiva permanece como hipótesis. CAL-01 no aisló causalmente la plasticidad. AT-003 es un protocolo factorial independiente y no debe presentarse como validado por AT-002.

## Inicio rápido

Requisitos: Node.js 24.x y npm. La integración continua fija Node.js 24.22.3.

```bash
npm ci
npm run dev
```

Pruebas y compilación:

```bash
npm test
npm run build
npm run preview
```

Generar el plan AT-002 en modo de solo planificación:

```bash
npm run at002:plan
```

El comando anterior no ejecuta una campaña. Las campañas oficiales se despachan mediante workflows manuales separados, con autorización explícita YES e identificador de ejecución. El merge, la CI y la generación del plan no autorizan ni despachan campañas.

## Arquitectura

- src/core/: tipos y motor histórico.
- src/experiments/at001/: modelo, configuración y métricas AT-001.
- src/experiments/at002-calibration/: variantes O/D/S, instrumentación, diagnósticos y ejecutores CAL-01/CAL-02.
- experiments/ATANOR-AT004-001/revised/: candidato independiente de modelo y pruebas de regresión AT-004.
- experiments/AT-002-CALIBRATION/: configuración versionada del protocolo.
- experiments/netlogo/: implementación de comparación NetLogo.
- scripts/: comparador de definición y auditoría topológica.
- tests/: pruebas automatizadas.
- docs/: protocolos, resultados, auditorías y límites metodológicos.

## Documentación principal

- [Protocolo AT-002](docs/AT-002-CALIBRATION.md)
- [Resultados oficiales CAL-01](docs/AT-002-CAL-01-RESULTS.md)
- [Resultados oficiales CAL-02](docs/AT-002-CAL-02-RESULTS.md)
- [Pre-registro AT-003 v1.0](docs/AT-003-PREREGISTRATION-v1.0.md)
- [Criterio de equivalencia conductual v0.2](docs/BEHAVIORAL-EQUIVALENCE-CRITERION-v0.2.md)
- [Contrato metodológico de equivalencia conductual v0.3](docs/BEHAVIORAL-EQUIVALENCE-CONTRACT-v0.3.md)
- [Resultados de sensibilidad conductual v0.1](docs/BEHAVIORAL-EQUIVALENCE-SENSITIVITY-RESULTS-v0.1.md)
- [Análisis de semilla 303 v0.1](docs/BEHAVIORAL-EQUIVALENCE-SEED-303-ANALYSIS-v0.1.md)
- [Contrato del comparador de definición v0.2](docs/DEFINITION-COMPARATOR-CONTRACT-v0.2.json)
- [Auditoría topológica y de ciclo v0.2](docs/SEED-303-DAG-HYPOTHESIS-AUDIT-v0.2.md)
- [Workflow del comparador](.github/workflows/definition-comparator.yml)
- [Auditoría de implementación AT-004](docs/AT-004-AUDIT-02-IMPLEMENTATION-REVIEW-v0.2.md)
- [Especificación candidata AT-004](docs/AT-004-REVISED-MODEL-SPEC-v0.2.md)

## Procedencia y timestamps verificables

Criptocromo incorpora un flujo opcional de timestamping criptográfico con OpenTimestamps. El flujo genera un manifiesto determinista que identifica el repositorio, el commit y el árbol Git seleccionados; calcula su huella y solicita a calendarios públicos que la incorporen a una agregación Merkle anclada posteriormente en Bitcoin.

- Workflow manual: [OpenTimestamps](.github/workflows/ots-timestamp.yml).
- Especificación y procedimiento de verificación: [Procedencia y timestamps](docs/PROVENANCE-AND-OPEN-TIMESTAMPS.md).
- Los archivos .ots son recibos/proofs asociados al manifiesto exacto.
- Un recibo recién creado puede estar pendiente de anclaje. Debe actualizarse y verificarse antes de declararlo completo.
- Un timestamp acredita existencia previa del dato comprometido, no autoría, exactitud científica, integridad de todo el historial ni aprobación institucional.

No se crean timestamps automáticamente en cada commit: el despacho es manual y queda asociado a un commit concreto. No se sobrescriben artefactos.

## Colaboración con modelos de IA

Los modelos de IA pueden proponer, estructurar y criticar experimentos. No constituyen por sí mismos evidencia, autoridad de ejecución ni validación de resultados. El núcleo debe seguir siendo ejecutable sin depender de un proveedor externo.

## Alcance y límites

El sistema es software experimental. Sus ecuaciones son hipótesis de diseño computacional, no leyes físicas ni afirmaciones de equivalencia biológica. Una dinámica observada en la simulación describe el modelo ejecutado bajo sus condiciones; no demuestra por sí sola emergencia ontológica, inteligencia, conciencia, causalidad descendente ni comportamiento de un sistema natural.

## Licencias

El repositorio usa licencias separadas según el tipo de material:

- **Código fuente, pruebas, scripts y workflows:** Apache License 2.0, ver [LICENSE](LICENSE).
- **README, documentación, protocolos experimentales y materiales editoriales originales:** Creative Commons Attribution 4.0 International (CC BY 4.0), ver [LICENSE-DOCS.md](LICENSE-DOCS.md).

Los datos experimentales generados, archivos de terceros, dependencias, marcas y materiales expresamente identificados con otra licencia no quedan automáticamente cubiertos por estas declaraciones generales. Cada artefacto o componente de terceros conserva los avisos y términos que le correspondan. Las licencias no conceden derechos sobre las marcas ATANOR Ω ni Criptocromo.

---

ATANOR Ω · Criptocromo
