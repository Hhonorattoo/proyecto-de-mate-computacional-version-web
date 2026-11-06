# FlowLab v0.9 — Laboratorio de flujo máximo

Simulador web de Ford–Fulkerson con búsqueda BFS (Edmonds–Karp), React y TypeScript.

## Recorrido

1. **Configurar:** cantidad exacta de nodos (7–16) y creación manual o automática.
2. **Construir:** grafo editable en manual, selección de fuentes y sumideros en ambos modos, superfuente S* y supersumidero T* visibles al elegir varias terminales. Matriz de capacidades plegada por defecto, solo en esta pantalla. Los ciclos y otras redes inválidas bloquean el inicio.
3. **Simular:** historial a la izquierda, grafo al centro y controles a la derecha en escritorio. El botón verde avanza una etapa. También se puede reproducir automáticamente y retroceder.
4. **Resultado:** al terminar, el botón verde cambia a Ver resultado final. Muestra el flujo máximo, corte mínimo, conjuntos S/T, capacidades de corte, flujo por arista y caminos utilizados.

Cada pantalla permite volver a la anterior. Volver no borra la red ni la simulación; editar la red invalida los estados previos. Crear una red nueva inicia un análisis nuevo.

Los nodos ficticios no cuentan entre los n originales. Sus arcos son discontinuos y usan la misma capacidad del motor: suma de capacidades originales + 1. El flujo en esos arcos se obtiene del balance de cada terminal. Las aristas inversas y su rastro histórico continúan disponibles; se retiró la visualización del árbol/etiquetas BFS, no la búsqueda BFS del motor.

## Desarrollo

Node.js 20.19+ y npm:

```sh
npm ci
npm run dev
npm run test
npm run build
```

Vercel compila con `npm run build` y publica `dist`. La rama main del repositorio web activa el despliegue. El repositorio Python original permanece independiente.

## Verificación

11 tests del motor y la generación (incluyen 30 DAG contrastados con todos sus cortes). Navegador: automático multifuente/multisumidero, nodos ficticios visibles, fases, historial, resultado, navegación de regreso, manual con ciclo bloqueado y corregido, reproducción automática y disposición móvil sin desbordamiento horizontal. Se aplica revisión Impeccable del código y revisión visual; no equivale a una certificación WCAG completa ni a prueba de gestos en dispositivo físico.

Los logs de v0.7 y los documentos de esa versión se conservan como antecedentes. Esta actualización no prepara la entrega académica ni cambia el programa Python.
