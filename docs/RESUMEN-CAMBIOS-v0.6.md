# Resumen de cambios v0.5 → v0.6

La v0.5 fue ejecutada por el usuario y valorada favorablemente. La petición para v0.6 es **corregir la identidad visual**, no alterar el algoritmo ni retirar funcionalidades.

| Subsistema | v0.5 | v0.6 |
| --- | --- | --- |
| Portada | Blanco, orbes difuminados y gradiente en el título | Negro grafito, título editorial tipográfico y esquema SVG original de flujo |
| Marca | Icono genérico Workflow | Marca vectorial `FlowMark` que representa tres ramales convergentes; favicon equivalente |
| Configurador | Panel blanco con campos y chips | Panel grafito continuo, firma de fuentes/sumideros y controles semánticos |
| Grafo | Lienzo muy oscuro aislado entre paneles claros | Lienzo integrado con fondo/paneles oscuros, acentos de flujo y bordes coherentes |
| Resultados e historial | Tarjetas claras y una tarjeta oscura | Superficies oscuras coherentes, sin brillos decorativos, tipografía legible |
| Vista tabular | Edición de aristas | Se mantiene; **se añade** una matriz de capacidades desplegable |
| Accesibilidad | Chips de conexión en `span` interactivo | Chips de conexión convertidos en botones; se refuerza foco y contraste |
| Motor | BFS, regreso residual, múltiples fuentes/sumideros, historial y cortes | **Sin cambios algorítmicos** |
| Sesiones | `flowlab:session:v0.5` | Se **conserva la clave** para no perder datos guardados |

## Comprobado en el entorno de elaboración

- Transpilación sintáctica sin errores de cuatro módulos TSX/TS.
- Compilación estricta del motor TypeScript.
- Red de ejemplo: flujo 17 / corte 17.
- Red inversa: flujo 10 / corte 10, una traza inversa conservada en historial.
- Sintaxis CSS validada sin errores.
- Contraste calculado para texto principal, secundario, accesos y color residual.
- Vista previa **estática** en Chromium sin desbordamiento horizontal en portada (1440 / 900 / 390 px) y laboratorio de escritorio (1600 px).

## Pendiente con dependencias

No se pudo instalar npm ni ejecutar `vite build` o Vitest en el entorno por fallo DNS del registro. Tampoco se pudo ejecutar Impeccable CLI. El usuario debe probar los comandos `npm install`, `npm run test`, `npm run build`, `npm run dev`, y opcionalmente `npx impeccable detect src/` cuando el entorno tenga Internet.
