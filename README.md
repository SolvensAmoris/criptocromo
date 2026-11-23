# Criptocromo | ATANOR Ω

**Laboratorio computacional de principios y comportamientos emergentes.**

Criptocromo es el entorno experimental de ATANOR Ω para estudiar qué ocurre cuando principios de distintos dominios se formalizan como operadores ejecutables y se componen en mecanismos computacionales.

> Principio → Operador → Mecanismo → Comportamiento

## Estado del proyecto

**Fase:** fundación experimental  
**Primer experimento:** AT-001, Memoria resonante autoorganizada  
**Plataforma inicial:** aplicación web local-first, ejecutable en navegadores de escritorio y móviles.

Esta primera versión es un prototipo de investigación. Sus ecuaciones son hipótesis de diseño computacional, no leyes físicas ni afirmaciones de equivalencia biológica.

## Inicio rápido

Requisitos: Node.js 20 o posterior y npm.

```bash
npm install
npm run dev
```

Para ejecutar pruebas y compilar:

```bash
npm test
npm run build
npm run preview
```

## Arquitectura inicial

- `src/core/`: tipos y motor determinista de simulación.
- `src/experiments/at001/`: modelo, configuración y métricas del experimento.
- `tests/`: pruebas automatizadas del comportamiento esperado.
- `experiments/AT-001/`: hipótesis y protocolo reproducible.
- `docs/`: criterios metodológicos y límites de interpretación.

## AT-001: Memoria resonante autoorganizada

Explora la interacción de tres mecanismos: persistencia de estado, respuesta selectiva a una frecuencia y adaptación local de conexiones. Se comparará el sistema completo con ablaciones que desactivan cada mecanismo.

Las métricas iniciales son persistencia, selectividad, actividad residual y estabilidad. Un resultado interesante no demuestra por sí mismo novedad, inteligencia, conciencia ni equivalencia con un sistema natural.

## Principios metodológicos

- `EXPERIMENT ≠ RESULT ≠ CONCLUSION`
- `MODEL ≠ EVIDENCE`
- `OBSERVATION ≠ ONTOLOGY`
- Las propuestas de IA son hipótesis revisables, nunca veredictos.
- Las ejecuciones deben registrar configuración, semilla y versión del motor.
- Los resultados negativos y las limitaciones también forman parte del registro.

## Colaboración con modelos de IA

Las integraciones externas se añadirán mediante adaptadores desacoplados. Ningún proveedor será obligatorio para ejecutar el núcleo. Los modelos podrán proponer, estructurar y criticar experimentos; la ejecución y validación permanecerán en herramientas deterministas y pruebas reproducibles.

## Alcance y límites

La aplicación inicial corre en el navegador. El rendimiento dependerá del dispositivo y del tamaño de la simulación. No se promete capacidad uniforme en todos los teléfonos o computadoras. Las integraciones remotas, sincronización y ejecución distribuida quedan fuera de esta primera base.

## Licencia

Aún no se ha seleccionado una licencia. No reutilices ni redistribuyas el código como si tuviera una licencia explícita hasta que se añada una.

---
ATANOR Ω · Criptocromo
