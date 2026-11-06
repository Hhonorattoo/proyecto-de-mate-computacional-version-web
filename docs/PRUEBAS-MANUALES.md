# Checklist antes de publicar o entregar

Las siguientes pruebas deben realizarse localmente o en Vercel y marcarse **solo cuando se comprueben en navegador**.

## Instalación y renderizado

- [ ] `npm install` sin error.
- [ ] `npm run test` completo sin errores.
- [ ] `npm run build` completo sin errores.
- [ ] Portada grafito con diagrama dirigido original, título FLOWLAB y botón de entrada, sin scroll horizontal.
- [ ] Botón Entrar al laboratorio abre el laboratorio; Volver al inicio y el enlace directo `/#/laboratorio` funcionan.
- [ ] En ancho móvil se muestra el botón para abrir/cerrar herramientas y el grafo se puede manipular.

## Preservación funcional

- [ ] La portada y el configurador mantienen el mismo sistema visual oscuro; revisar contraste y jerarquía.
- [ ] Abrir/cerrar la nueva matriz de capacidades y verificar sus valores contra las aristas, incluso con fuentes/sumideros múltiples.
- [ ] Agregar y quitar nodos, respetando 7–16.
- [ ] Agregar y eliminar aristas, cambiar capacidades positivas desde Conexiones y capacidades.
- [ ] Conectar nodos con el mouse, moverlos sin que salten de vuelta a posiciones originales.
- [ ] Seleccionar dos fuentes y dos sumideros con chips sin usar Ctrl/Cmd.
- [ ] Generar DAG aleatorio e iniciar simulación.
- [ ] Hacer un grafo inválido y comprobar que el motor no inicia sin validarlo.
- [ ] Navegar BFS → Camino encontrado → Flujo actualizado por separado, comprobar etiquetas y cuello de botella.
- [ ] Avanzar y retroceder, ir al último paso, volver al primero y reproducir/pausar.
- [ ] Seleccionar una iteración del historial y observar los estados correctos.
- [ ] En el ejemplo inicial, observar flujo 17 y corte 17.
- [ ] Cargar caso con regreso; en iteración 6 se ve `F → B` morado antes y después de actualizar.
- [ ] En el estado final del caso inverso, permanece la curva morada histórica.
- [ ] En el estado final aparecen S, T, aristas de corte, capacidad del corte e igualdad flujo/corte.
- [ ] Descargar sesión JSON y CSV, importar JSON y restaurar el paso actual.
- [ ] Actualizar navegador: se conservan grafo y etapa actual en almacenamiento local.

## Entrega

- [ ] Revisar Chrome/Firefox y pantalla móvil.
- [ ] Comprobar accesibilidad básica: foco, contraste, enlaces y texto legible.
- [ ] Documentar resultados y figuras del informe con formato APA según la rúbrica.
- [ ] Verificar que `npm run build` y Vercel publiquen la misma versión.
- [ ] Sacar capturas de la portada, edición de red, BFS, regreso morado, historial y corte mínimo.
