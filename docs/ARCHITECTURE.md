# Arquitectura inicial

La aplicación separa interfaz y motor determinista.

- UI: React y Vite.
- Core: tipos, inicialización reproducible y transición de estado pura.
- Experiments: modelos y métricas por protocolo.
- Tests: invariantes y regresiones.
- Integrations: adaptadores opcionales para proveedores externos.

Flujo: Principio → operador formal → mecanismo compuesto → ejecución → observación → análisis.

Los modelos de IA pueden proponer y criticar hipótesis, pero no convertir propuestas en evidencia ni alterar el registro de resultados. Evolución prevista: ablaciones, barridos de parámetros, registro con hashes, persistencia local, Web Workers y adaptadores MCP/proveedores.