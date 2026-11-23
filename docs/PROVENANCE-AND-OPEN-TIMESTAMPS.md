# Procedencia criptográfica y OpenTimestamps

**Responsable del proyecto:** Luis Alberto Burciaga Miker  
**Ubicación declarada:** Sonora, México  
**Proyecto:** ATANOR Ω / Criptocromo

## Objetivo

Producir evidencia criptográfica independiente de que un manifiesto que identifica una revisión concreta del repositorio existía antes de un punto temporal anclado en Bitcoin.

Criptocromo usa OpenTimestamps (OTS), un protocolo abierto de timestamping. El cliente calcula una huella del manifiesto y la envía a calendarios públicos. Los calendarios agregan compromisos en estructuras Merkle y posteriormente publican un compromiso en Bitcoin. El recibo `.ots` contiene las operaciones necesarias para verificar la relación entre el archivo original y la atestación.

## Alcance probatorio

Un OTS válido puede respaldar esta afirmación limitada:

> Los bytes exactos del manifiesto asociado estaban comprometidos criptográficamente antes o a más tardar en el tiempo del bloque Bitcoin verificado.

No demuestra:
- quién creó el contenido o quién controlaba la cuenta;
- que el commit o el manifiesto sean científicamente correctos;
- que todos los archivos del repositorio existieran en esa fecha, salvo que estén incluidos en el compromiso;
- que una campaña experimental haya sido autorizada o ejecutada;
- que el tiempo del commit Git sea confiable por sí mismo.

El timestamp no reemplaza firmas de autor, revisión, checksums, CI ni cadena de custodia experimental.

## Diseño de Criptocromo

El workflow manual `.github/workflows/ots-timestamp.yml` ejecuta los pasos siguientes sobre el commit seleccionado:

1. Obtiene el SHA del commit y el SHA del árbol Git.
2. Construye `timestamp-manifest.json` con esquema versionado, repositorio, commit, árbol, referencia descriptiva y protocolo.
3. Ejecuta `ots stamp timestamp-manifest.json`.
4. Calcula SHA-256 del manifiesto y del recibo.
5. Publica ambos archivos y el checksum como artefacto de GitHub Actions.

El manifiesto es determinista para el mismo commit y metadatos de proyecto. La hora de solicitud no se inserta en él: la evidencia temporal procede de la atestación OTS, no de un reloj local ni de un campo autodeclarado.

## Ejecución

En GitHub Actions, seleccionar **OpenTimestamps provenance**, elegir la rama o tag que se desea anclar y escribir exactamente `STAMP` en el campo de confirmación.

El workflow es manual. No se ejecuta al hacer push, al abrir PR ni al integrar cambios. No autoriza ni ejecuta experimentos.

El recibo inicial puede contener únicamente una promesa de calendario pendiente. Esto es normal: la agregación y la confirmación en Bitcoin pueden tardar. No etiquetar el recibo como prueba completa hasta actualizarlo y verificarlo.

## Actualización y verificación local

Instalar el cliente oficial:

```bash
python -m pip install opentimestamps-client==0.7.2
```

Después de descargar el artefacto y situarse en el directorio que contiene los archivos:

```bash
ots upgrade timestamp-manifest.json.ots
ots verify timestamp-manifest.json.ots
ots info timestamp-manifest.json.ots
sha256sum -c timestamp-SHA256SUMS.txt
```

Si `ots upgrade` obtiene una atestación Bitcoin, el archivo `.ots` cambia. En ese caso se debe recalcular y conservar un nuevo checksum del recibo; el checksum del manifiesto debe permanecer igual. `ots verify` debe ejecutarse sobre el manifiesto exacto que originó el recibo.

La verificación independiente más fuerte utiliza un nodo Bitcoin Core propio. La verificación mediante herramientas web o exploradores es útil como comprobación adicional, pero debe documentarse qué fuente y método se usaron.

## Política de conservación

Cada timestamp debe conservarse como un conjunto inseparable:

- `timestamp-manifest.json`;
- `timestamp-manifest.json.ots` actualizado;
- `timestamp-SHA256SUMS.txt` correspondiente a esos bytes;
- URL del workflow, número de ejecución, commit SHA y artefacto de GitHub;
- resultado de verificación y, cuando exista, altura/hash del bloque Bitcoin.

No reemplazar un recibo previo sin conservar la versión anterior. No inferir una fecha exacta de creación a partir del timestamp del commit Git. No declarar un recibo completo mientras solo tenga una promesa de calendario.

## Referencias

- OpenTimestamps: https://opentimestamps.org/
- Cliente oficial: https://github.com/opentimestamps/opentimestamps-client
- Integración Git: https://github.com/opentimestamps/opentimestamps-client/blob/master/doc/git-integration.md
