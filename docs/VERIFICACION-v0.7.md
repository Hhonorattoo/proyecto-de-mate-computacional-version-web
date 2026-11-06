# FlowLab v0.7 — verificación real

Fecha local: 5 de noviembre de 2026 (America/Lima).
Base: ZIP v0.6 leído de /home/diegohonoratto/Downloads. Se extrajo en una carpeta nueva; no se modificó sources/ ni el ZIP original.

## Entorno y comandos

Node v20.19.2. npm no estaba en PATH: se descargó npm 10.8.2 del registro oficial y se ejecutó su npm-cli.js desde work/tooling/npm, sin instalación global. Se ejecutaron npm install, npm run test y npm run build. package-lock.json incluido.

- Base v0.6: 6 tests correctos y build correcto.
- v0.7: 9 tests correctos. Incluyen comparación de 30 DAG con enumeración independiente de todos los cortes, límites de flujo y conservación.
- npm audit: de 3 vulnerabilidades (2 críticas) a 0 tras actualizar Vitest a 4.1.12.
- Detector oficial Impeccable: 5 hallazgos iniciales; 0 al finalizar. Se ejecutó realmente `npm exec --yes --package=impeccable -- impeccable detect --json src/`. Es un análisis estático, no una certificación completa de accesibilidad.
- Documentación oficial: https://github.com/pbakaus/impeccable/blob/main/README.npm.md

## Cambios

- Barlow sustituye Space Grotesk y se elimina la franja lateral decorativa señalada por Impeccable; se mantiene la identidad oscura y el esquema de red propio.
- Validación de identificadores reservados, duplicados y terminales repetidos; capacidades y suma dentro del rango entero seguro.
- Delete/Backspace ya no elimina solo la representación visual de React Flow dejando intacto el modelo. La eliminación se realiza con los controles del editor, que mantienen ambos sincronizados.
- Selección de historial por iteración actual, corrigiendo el desplazamiento en BFS/camino; los controles conservan su semántica de botón.
- Recuperación de sesiones locales descarta índices no finitos.
- Versión de aplicación y exportación JSON: 0.7; se mantiene la clave de almacenamiento para compatibilidad.

## Navegador real

Se probó la aplicación React servida por Vite en localhost:5173 mediante navegador integrado.

- Portada y laboratorio oscuros: inspeccionados y capturados.
- Red inicial: 13 estados; resultado 17 = 17, S={A,B,E}, T={C,D,F,G}; corte A→C, B→D, E→G.
- Caso inverso: 19 estados; resultado 10 = 10; rastro morado histórico F→B en iteración 6 y camino A→D→F→B→C→E→G.
- Fuentes A/B y sumideros F/G: 17 = 17.
- Matriz: tabla expandida y valores inspeccionados.
- Editor: añadir H, eliminar H, editar A→B a 11; verificado en interfaz.
- Exportación JSON y reimportación: mensaje de éxito y recuperación del paso 12, resultado 17 y terminales múltiples; archivo leído y validado.
- CSV: descarga real, 14 líneas incluido encabezado.
- Consola: sin errores en la consulta realizada.
- Móvil: viewport solicitado 390×844; ancho de contenido efectivo 375 y scrollWidth 375, sin desbordamiento horizontal del documento.

## Alcance y límites

Se conserva docs/ENTREGA-SEMANA-12.md y sus funcionalidades académicas: 7–16 nodos, DAG, múltiples terminales, BFS, fases, regresos, historial, corte y exportaciones. No se sustituyó el informe/PPT académico ni se publicó en Vercel. El PDF original de la rúbrica no estaba en sources/; se conservó la matriz aportada en v0.6.

El build emite una advertencia por el chunk JavaScript mayor a 500 kB. No impide compilar. La auditoría estática no evalúa todos los contrastes ni todos los flujos con tecnología asistiva. No se hizo una prueba exhaustiva de cada gesto del editor, reproducción temporizada ni comparación funcional completa con la aplicación Python original. Las capturas están en logs/.
