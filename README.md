# Criptocromo | ATANOR Ω

**Autor e investigador principal:** Luis Alberto Burciaga Miker  
**Afiliación / ubicación:** Sonora, México  
**Proyecto:** ATANOR Ω · Criptocromo  
© 2026 Luis Alberto Burciaga Miker · Sonora, México  

**Laboratorio computacional de principios y comportamientos emergentes.**

Criptocromo es el entorno experimental de ATANOR Ω. Investiga qué ocurre cuando principios de distintos dominios se formalizan como operadores ejecutables y se componen en mecanismos computacionales.

> Principio → Operador → Mecanismo → Comportamiento

El objetivo no es asumir que una combinación produce emergencia. Es diseñar experimentos reproducibles capaces de distinguir efectos individuales, interacciones, límites del instrumento y explicaciones alternativas.

## Estado del proyecto

**Fase:** cierre documental de AT-002 y preparación metodológica de AT-003.  
**Experimento histórico:** AT-001, campaña factorial exploratoria.  
**Campaña de calibración:** AT-002, CAL-01 y CAL-02 ejecutadas; CAL-03/CAL-04 y GATE-01 siguen pendientes.  
**Siguiente experimento:** AT-003, pre-registro v1.0 integrado; revisión independiente y ejecutor de calibración pendientes.  
**Plataforma:** aplicación web adaptable, ejecutable en navegadores de escritorio y móviles.

AT-001 se conserva como campaña exploratoria histórica. AT-002 mantiene motores versionados O, D y S: O conserva el clipping histórico; D elimina el clipping y aplica un guard de seguridad; S sustituye el corte por una transformación logística. Las campañas oficiales CAL-01 y CAL-02 no deben confundirse con una comparación empírica de las tres variantes: CAL-01 ejecutó O y D; CAL-02 ejecutó únicamente O.

**CAL-01:** campaña oficial ejecutada el 23 de noviembre de 2026. O completó 420/420 pasos y presentó saturación persistente; D terminó con ABORTED_GUARD en las diez semillas, con los datos parciales preservados. La integridad de los artefactos y sus checksums fue verificada. El análisis descriptivo está documentado en [Resultados oficiales CAL-01](docs/AT-002-CAL-01-RESULTS.md). CAL-01 no demuestra causalidad, sinergia ni emergencia.

**CAL-02:** campaña oficial ejecutada el 23 de noviembre de 2026 mediante [workflow #45184129343](https://github.com/SolvensAmoris/criptocromo/actions/runs/45184129343), run ID `CAL02-20261123-01`, commit `3002ba013a33fa7919fdb46c6cdc2aaf7aed87cb`. O completó 2,100/2,100 pasos: cinco intensidades, diez semillas pareadas, 18 ticks de pulso y 24 de recuperación. La activación residual media fue 1.0 en las cinco intensidades y en las diez semillas de cada nivel; la fracción activa también fue 1.0. El barrido redujo la fracción total de valores recortados al disminuir la intensidad, pero no evitó la saturación residual. Esto documenta un límite de resolución del motor bajo las condiciones probadas, no emergencia ni sinergia. Ver [Resultados oficiales CAL-02](docs/AT-002-CAL-02-RESULTS.md).

**AT-003:** el pre-registro v1.0 quedó integrado en `main` mediante [PR #9](https://github.com/SolvensAmoris/criptocromo/pull/9), merge commit `7fda37275d00e93f89807d87a8b22228c7fa5ba1`. La CI posterior al merge, run #76 (`45186968981`), terminó `success`. El documento está congelado como protocolo, pendiente de revisión independiente. Su ejecutor de calibración no está implementado; la calibración y la campaña confirmatoria no se han ejecutado ni autorizado. Ver [Pre-registro AT-003 v1.0](docs/AT-003-PREREGISTRATION-v1.0.md).

## Principios metodológicos

- `MODEL ≠ EVIDENCE`
- `OBSERVATION ≠ ONTOLOGY`
- `EXPERIMENT ≠ RESULT ≠ CONCLUSION`
- Una prueba unitaria no sustituye una campaña experimental.
- Divergencia observada no equivale a atribución causal.
- `ABORTED_GUARD` es una observación diagnóstica parcial cuando el guard se activa; no representa una trayectoria completa ni autoriza extrapolar estados posteriores.
- Los resultados negativos, los abortos controlados y las limitaciones también forman parte del registro.
- Cada campaña debe conservar identidad del motor, configuración, semillas, entorno y checksums de sus artefactos.

La hipótesis H-D1 sobre la posible contribución de la plasticidad a una retroalimentación positiva permanece como hipótesis. CAL-01 midió divergencia O/D; no aisló causalmente la plasticidad. AT-003 es un protocolo factorial independiente dentro de Criptocromo y no debe presentarse como validado por AT-002.

## Inicio rápido

Requisitos: Node.js 24.x y npm. La integración continua fija Node.js 24.22.3.

Instalar dependencias bloqueadas y ejecutar la aplicación:

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

El comando anterior no ejecuta una campaña. CAL-01 y CAL-02 se despacharon mediante workflows manuales separados, con autorización explícita `YES` e identificador de ejecución. El merge, la CI y la generación del plan no autorizan ni despachan campañas.

## Arquitectura

- `src/core/`: tipos y motor histórico.
- `src/experiments/at001/`: modelo, configuración y métricas AT-001.
- `src/experiments/at002-calibration/`: variantes O/D/S, instrumentación, diagnósticos y ejecutores CAL-01/CAL-02.
- `experiments/AT-002-CALIBRATION/`: configuración versionada del protocolo.
- `tests/`: pruebas automatizadas.
- `docs/`: protocolos, límites metodológicos y procedimientos de análisis.

## Documentación principal

- [Protocolo AT-002](docs/AT-002-CALIBRATION.md)
- [Checklist de análisis de trazas CAL-01](docs/AT-002-CAL-01-TRACE-ANALYSIS-CHECKLIST.md)
- [Resultados oficiales CAL-01](docs/AT-002-CAL-01-RESULTS.md)
- [Resultados oficiales CAL-02](docs/AT-002-CAL-02-RESULTS.md)
- [Revisión pre-ejecución CAL-02](docs/AT-002-CAL-02-PRE-EXECUTION-REVIEW.md)
- [Pre-registro AT-003 v1.0](docs/AT-003-PREREGISTRATION-v1.0.md)
- [Workflow manual CAL-01](.github/workflows/at002-cal01.yml)
- [Workflow manual CAL-02](.github/workflows/at002-cal02.yml)
## Procedencia y timestamps verificables

Criptocromo incorpora un flujo opcional de timestamping criptográfico con OpenTimestamps. El flujo genera un manifiesto determinista que identifica el repositorio, el commit y el árbol Git seleccionados; calcula su huella y solicita a calendarios públicos que la incorporen a una agregación Merkle anclada posteriormente en Bitcoin.

- Workflow manual: [OpenTimestamps](.github/workflows/ots-timestamp.yml).
- Especificación y procedimiento de verificación: [Procedencia y timestamps](docs/PROVENANCE-AND-OPEN-TIMESTAMPS.md).
- Los archivos `.ots` son recibos/proofs asociados al manifiesto exacto.
- Un recibo recién creado puede estar pendiente de anclaje. Debe actualizarse y verificarse antes de declararlo completo.
- Un timestamp acredita existencia previa del dato comprometido, no autoría, exactitud científica, integridad de todo el historial ni aprobación institucional.

No se crean timestamps automáticamente en cada commit: el despacho es manual y queda asociado a un commit concreto. Los artefactos de prueba deben conservarse junto con el manifiesto y sus checksums.

## Colaboración con modelos de IA

Los modelos de IA pueden proponer, estructurar y criticar experimentos. No constituyen por sí mismos evidencia, autoridad de ejecución ni validación de resultados. El núcleo debe seguir siendo ejecutable sin depender de un proveedor externo.

## Alcance y límites

El sistema es software experimental. Sus ecuaciones son hipótesis de diseño computacional, no leyes físicas ni afirmaciones de equivalencia biológica. Una dinámica observada en la simulación describe el modelo ejecutado bajo sus condiciones; no demuestra por sí sola emergencia ontológica, inteligencia, conciencia ni comportamiento de un sistema natural.

## Licencias

El repositorio usa licencias separadas según el tipo de material:

- **Código fuente, pruebas, scripts y workflows:** Apache License 2.0, ver [LICENSE](LICENSE).
- **README, documentación, protocolos experimentales y materiales editoriales originales:** Creative Commons Attribution 4.0 International (CC BY 4.0), ver [LICENSE-DOCS.md](LICENSE-DOCS.md).

Los datos experimentales generados, archivos de terceros, dependencias, marcas y materiales expresamente identificados con otra licencia no quedan automáticamente cubiertos por estas declaraciones generales. Cada artefacto o componente de terceros conserva los avisos y términos que le correspondan. Las licencias no conceden derechos sobre las marcas ATANOR Ω ni Criptocromo.

---

ATANOR Ω · Criptocromo
