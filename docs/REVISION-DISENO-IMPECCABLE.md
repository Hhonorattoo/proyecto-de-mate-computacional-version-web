# FlowLab v0.6 — revisión de diseño siguiendo criterios publicados por Impeccable

**Estado del instrumento:** revisión manual del diseño con base en los antipatrones y el flujo de evaluación publicados en [impeccable.style](https://impeccable.style/). **No se ejecutó el detector CLI en este entorno**: la prueba de acceso a `registry.npmjs.org` devolvió `EAI_AGAIN` (DNS). Tampoco se instaló la skill como plugin. No atribuir a Impeccable un resultado automático que aún no existe.

## Problemas detectados en v0.5 y cambios implementados

1. **Círculos difuminados casi idénticos a la referencia.** Se eliminaron los elementos y se creó el gráfico vectorial original `FlowSchematic.tsx`, que representa conexiones dirigidas, un recorrido y un regreso residual.
2. **Interfaz partida entre paneles blancos y grafo oscuro.** Se definió una superficie negro grafito compartida en toda la aplicación. El contraste depende de valores, separación y tipografía, no de cajas blancas.
3. **Gradiente de texto y acentos cian como recurso genérico.** Se retiró GradientTitle del hero; el título usa tinta clara y lima. Se preservan turquesa para fuentes y morado para las aristas inversas por significado algorítmico.
4. **Demasiadas tarjetas con radios grandes y sombras.** Los paneles principales ahora usan divisiones finas, radios pequeños y sin sombras prominentes. Se mantienen agrupaciones solo donde organizan datos.
5. **Configurador visualmente genérico.** Se incorporó una firma de red con número de fuentes y sumideros, selección por chips semánticos y la matriz de capacidades desplegable.
6. **Tipografía y objetivos de interacción.** Se definieron Space Grotesk / IBM Plex Mono, botones principales de al menos ~40px y textos secundarios más legibles.
7. **Accesibilidad.** Los chips de aristas dejan de ser `span` interactivos y pasan a ser botones; foco visible reforzado; matriz con encabezados de fila y columna; la ilustración decorativa no invade la navegación asistiva.

## Cómo ejecutar el detector verdadero (cuando haya Internet)

Desde la raíz del proyecto:

```bash
npx impeccable install
npx impeccable detect src/
```

La instalación permite escoger Codex, Cursor u otra herramienta; tras instalar, reiniciar la herramienta y usar el flujo `impeccable init` / `critique` / `polish` / `audit` según su documentación. La detección automática puede señalar patrones heredados de CSS aunque no se rendericen: revisar cada hallazgo y priorizar el efecto visual real.

## Verificación visual restante

- [x] Vista previa **estática** de composición de portada en Chromium de escritorio y móvil sin desbordamiento horizontal (no equivale al build de React).
- [x] Vista previa **estática** de composición de laboratorio en Chromium de escritorio sin desbordamiento horizontal.
- [ ] Auditoría CLI real con `npx impeccable detect src/`.
- [ ] `npm install`, `npm test`, `npm run build` y prueba visual de la app con React/React Flow reales.
- [ ] Inspeccionar interacción completa en navegador en 390, 768, 1280 y 1600 px.
