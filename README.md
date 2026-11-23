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

**Fase:** fundación experimental y calibración del instrumento.  
**Experimento histórico:** AT-001, Memoria resonante autoorganizada.  
**Experimento activo:** AT-002, calibración del motor y diagnóstico de clipping.  
**Plataforma:** aplicación web adaptable, ejecutable en navegadores de escritorio y móviles.

AT-001-PILOT-01 se conserva como registro histórico. AT-002 mantiene motores versionados O, D y S para separar el comportamiento original con clipping, una variante diagnóstica sin clipping y una alternativa logística.

**CAL-01:** revisión pre-ejecución documentada y cerrada. El ejecutor y el despacho manual están implementados. La campaña oficial todavía no se ha ejecutado; no hay resultados oficiales de CAL-01 publicados.

## Principios metodológicos

- `MODEL ≠ EVIDENCE`
- `OBSERVATION ≠ ONTOLOGY`
- `EXPERIMENT ≠ RESULT ≠ CONCLUSION`
- Una prueba unitaria no sustituye una campaña experimental.
- Divergencia observada no equivale a atribución causal.
- `ABORTED_GUARD` es una observación diagnóstica parcial cuando el guard se activa; no representa una trayectoria completa ni autoriza extrapolar estados posteriores.
- Los resultados negativos, los abortos controlados y las limitaciones también forman parte del registro.
- Cada campaña debe conservar identidad del motor, configuración, semillas, entorno y checksums de sus artefactos.

La hipótesis H-D1 sobre la posible contribución de la plasticidad a una retroalimentación positiva permanece como hipótesis. CAL-01 mide divergencia O/D; la atribución causal requiere una ablación independiente y pre-registrada.

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

El comando anterior no ejecuta una campaña. La campaña oficial CAL-01 tiene un workflow manual separado y exige autorización explícita `YES` más un identificador de ejecución. No se despacha al hacer merge ni al ejecutar el plan.

## Arquitectura

- `src/core/`: tipos y motor histórico.
- `src/experiments/at001/`: modelo, configuración y métricas AT-001.
- `src/experiments/at002-calibration/`: variantes O/D/S, instrumentación, diagnósticos y ejecutor CAL-01.
- `experiments/AT-002-CALIBRATION/`: configuración versionada del protocolo.
- `tests/`: pruebas automatizadas.
- `docs/`: protocolos, límites metodológicos y procedimientos de análisis.

## Documentación principal

- [Protocolo AT-002](docs/AT-002-CALIBRATION.md)
- [Checklist de análisis de trazas CAL-01](docs/AT-002-CAL-01-TRACE-ANALYSIS-CHECKLIST.md)
- [Workflow manual CAL-01](.github/workflows/at002-cal01.yml)

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
